export function getApiBaseUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
  if (typeof window !== 'undefined') {
    const currentHost = window.location.hostname;
    if (currentHost && currentHost !== 'localhost' && currentHost !== '127.0.0.1') {
      try {
        const parsed = new URL(envUrl);
        if (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1') {
          parsed.hostname = currentHost;
          return parsed.toString().replace(/\/$/, '');
        }
      } catch {
        // fallback to envUrl
      }
    }
  }
  return envUrl;
}

export const API_BASE_URL = getApiBaseUrl();

export interface ApiOptions extends RequestInit {
  requiresAuth?: boolean;
}

export class ApiError extends Error {
  public status: number;
  public code: string;
  public details?: unknown;

  constructor(message: string, status: number, code = 'API_ERROR', details?: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

// Token storage helpers
export const tokenStorage = {
  getAccessToken: (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('access_token');
  },
  getRefreshToken: (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('refresh_token');
  },
  setTokens: (accessToken: string, refreshToken: string) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
  },
  clearTokens: () => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  },
};

// Single-flight token refresh. The in-flight promise is stored on globalThis
// (NOT module scope) so that every Next.js client chunk / component shares the
// SAME refresh request. Without this, concurrent 401s on page load could each
// POST the single-use refresh token, the backend would revoke it twice, and the
// second call would be rejected with TOKEN_REVOKED -> user gets logged out.
const REFRESH_SINGLE_FLIGHT_KEY = '__lingua_refresh_single_flight__';

function getInFlightRefresh(): Promise<string> | null {
  return (globalThis as any)[REFRESH_SINGLE_FLIGHT_KEY] ?? null;
}

function setInFlightRefresh(promise: Promise<string> | null) {
  (globalThis as any)[REFRESH_SINGLE_FLIGHT_KEY] = promise;
}

const SESSION_EXPIRED_MESSAGE = 'Your session has ended. Please sign in again to continue.';

/**
 * Exchange the current refresh token for a fresh token pair.
 * Returns the new access token on success.
 */
async function performTokenRefresh(): Promise<string> {
  const originalToken = tokenStorage.getRefreshToken();

  // Give a concurrent refresher (another tab / chunk / process) a beat to write
  // its rotated token into localStorage before we read ours.
  await new Promise((resolve) => setTimeout(resolve, 60));

  let token = tokenStorage.getRefreshToken() || originalToken;

  for (let attempt = 0; attempt < 2; attempt++) {
    if (!token) {
      throw new ApiError(SESSION_EXPIRED_MESSAGE, 401, 'UNAUTHORIZED');
    }

    let refreshResponse: Response;
    try {
      refreshResponse = await fetch(`${getApiBaseUrl()}/auth/refresh-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: token }),
      });
    } catch (err: any) {
      if (err instanceof TypeError) {
        throw new ApiError(
          'We could not reach the server. Please check your connection and try again.',
          0,
          'NETWORK_ERROR'
        );
      }
      throw err;
    }

    const refreshData = await refreshResponse.json().catch(() => ({}));

    if (refreshResponse.ok && refreshData.success) {
      const { accessToken, refreshToken: newRefreshToken } = refreshData.data.tokens;
      tokenStorage.setTokens(accessToken, newRefreshToken);
      return accessToken;
    }

    const code: string = refreshData.error?.code || '';
    const status: number = refreshResponse.status;

    if (status === 401) {
      // We sent a stale refresh token (rotated by a concurrent call). If the
      // successor token is already in storage, retry once with the live one.
      const latest = tokenStorage.getRefreshToken();
      if (attempt === 0 && latest && latest !== token) {
        token = latest;
        continue;
      }
      tokenStorage.clearTokens();
      throw new ApiError(SESSION_EXPIRED_MESSAGE, 401, 'SESSION_EXPIRED');
    }

    throw new ApiError(
      refreshData.error?.message || 'Token refresh failed. Please try again.',
      status,
      code || 'REFRESH_ERROR'
    );
  }

  throw new ApiError(SESSION_EXPIRED_MESSAGE, 401, 'SESSION_EXPIRED');
}


/**
 * Translates raw backend error codes & messages into friendly, plain-language
 * messages that any user can understand — no tech jargon.
 */
function getFriendlyErrorMessage(raw: string, code: string, status: number): string {
  // Code-based lookup (most specific — backend error codes)
  const codeMap: Record<string, string> = {
    INVALID_CREDENTIALS:       'The email or password you entered is incorrect. Please try again.',
    USER_ALREADY_EXISTS:       'An account with this email address already exists. Try signing in instead.',
    ACCOUNT_SUSPENDED:         'Your account has been suspended. Please contact support for help.',
    USER_INACTIVE:             'Your account is not active. Please contact support.',
    TOKEN_EXPIRED:             'Your session has ended. Please sign in again to continue.',
    TOKEN_REVOKED:             'Your session has ended. Please sign in again to continue.',
    SESSION_EXPIRED:           'Your session has ended. Please sign in again to continue.',
    UNAUTHORIZED:              'You need to sign in to access this page.',
    INVALID_TOKEN:             'Your session has ended. Please sign in again to continue.',
    INVALID_REFRESH_TOKEN:     'Your session has ended. Please sign in again to continue.',
    FORBIDDEN:                 'You do not have permission to do that.',
    NOT_FOUND:                 'The item you are looking for could not be found.',
    VALIDATION_ERROR:          'Some information is missing or incorrect. Please check and try again.',
    RATE_LIMIT_EXCEEDED:       'Too many attempts. Please wait a moment and try again.',
    SERVER_ERROR:              'Something went wrong on our end. Please try again in a moment.',
    CAPTCHA_FAILED:            'The security check failed. Please refresh the page and try again.',
    CAPTCHA_EXPIRED:           'The security check expired. Please refresh the page and try again.',
  };

  if (code && codeMap[code]) return codeMap[code];

  // HTTP status fallbacks
  if (status === 400) return 'Some information is missing or incorrect. Please check and try again.';
  if (status === 401) return 'Your session has ended. Please sign in again to continue.';
  if (status === 403) return 'You do not have permission to do that.';
  if (status === 404) return 'The item you are looking for could not be found.';
  if (status === 409) return 'This already exists. Please check for duplicates.';
  if (status === 422) return 'Some information is missing or incorrect. Please check and try again.';
  if (status === 429) return 'Too many attempts. Please wait a moment and try again.';
  if (status >= 500) return 'Something went wrong on our end. Please try again in a moment.';

  // If the raw message looks like a clean sentence (not a code), use it
  if (raw && raw.length > 0 && raw.length < 120 && !raw.includes('_') && /[a-z]/.test(raw)) {
    return raw.charAt(0).toUpperCase() + raw.slice(1);
  }

  return 'Something went wrong. Please try again.';
}

export async function apiClient<T = unknown>(endpoint: string, options: ApiOptions = {}): Promise<T> {

  const { requiresAuth = true, headers = {}, ...restOptions } = options;

  const baseUrl = getApiBaseUrl();
  const url = endpoint.startsWith('http') ? endpoint : `${baseUrl}${endpoint}`;

  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(headers as Record<string, string>),
  };

  if (requiresAuth) {
    const token = tokenStorage.getAccessToken();
    if (token) {
      requestHeaders['Authorization'] = `Bearer ${token}`;
    }
  }

  let response = await fetch(url, {
    ...restOptions,
    headers: requestHeaders,
  });

  // Handle 401 Token Expiry & Automatic Refresh
  if (response.status === 401 && requiresAuth && !endpoint.includes('/auth/refresh-token')) {
    if (!tokenStorage.getRefreshToken()) {
      tokenStorage.clearTokens();
      throw new ApiError(SESSION_EXPIRED_MESSAGE, 401, 'UNAUTHORIZED');
    }

    // Join the shared in-flight refresh (or become its initiator).
    let refreshPromise = getInFlightRefresh();
    if (!refreshPromise) {
      refreshPromise = performTokenRefresh();
      setInFlightRefresh(refreshPromise);
      refreshPromise
        .finally(() => {
          if (getInFlightRefresh() === refreshPromise) {
            setInFlightRefresh(null);
          }
        })
        .catch(() => {
          // Swallow: callers await refreshPromise directly and handle errors.
        });
    }

    try {
      const newToken = await refreshPromise;
      requestHeaders['Authorization'] = `Bearer ${newToken}`;
      const retryResponse = await fetch(url, {
        ...restOptions,
        headers: requestHeaders,
      });
      const retryData = await retryResponse.json().catch(() => ({}));

      if (!retryResponse.ok) {
        const retryMessage: string = retryData.error?.message || retryResponse.statusText || '';
        const retryCode: string = retryData.error?.code || '';
        if (retryResponse.status === 401) {
          tokenStorage.clearTokens();
        }
        throw new ApiError(
          getFriendlyErrorMessage(retryMessage, retryCode, retryResponse.status),
          retryResponse.status,
          retryCode || 'ERROR',
          retryData.error?.details
        );
      }

      return (retryData && retryData.data !== undefined ? retryData.data : retryData) as T;
    } catch (err: any) {
      if (err instanceof TypeError) {
        // Network failure — server temporarily unreachable, don't log out
        console.warn('[Auth] Refresh flow hit a network error. Keeping existing session.', err.message);
        throw new ApiError(
          'We could not reach the server. Please check your connection and try again.',
          0,
          'NETWORK_ERROR'
        );
      }
      throw err;
    }
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const rawMessage: string = data.error?.message || response.statusText || '';
    const code: string = data.error?.code || '';

    // Translate technical backend messages into plain user-friendly language
    const friendlyMessage = getFriendlyErrorMessage(rawMessage, code, response.status);

    throw new ApiError(
      friendlyMessage,
      response.status,
      code || 'ERROR',
      data.error?.details
    );
  }

  return (data && data.data !== undefined ? data.data : data) as T;
}

// Convenience REST methods
apiClient.get = <T = unknown>(endpoint: string, options?: ApiOptions) =>
  apiClient<T>(endpoint, { ...options, method: 'GET' });

apiClient.post = <T = unknown>(endpoint: string, body?: unknown, options?: ApiOptions) =>
  apiClient<T>(endpoint, {
    ...options,
    method: 'POST',
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

apiClient.put = <T = unknown>(endpoint: string, body?: unknown, options?: ApiOptions) =>
  apiClient<T>(endpoint, {
    ...options,
    method: 'PUT',
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

apiClient.patch = <T = unknown>(endpoint: string, body?: unknown, options?: ApiOptions) =>
  apiClient<T>(endpoint, {
    ...options,
    method: 'PATCH',
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

apiClient.delete = <T = unknown>(endpoint: string, options?: ApiOptions) =>
  apiClient<T>(endpoint, { ...options, method: 'DELETE' });

apiClient.upload = async <T = unknown>(endpoint: string, formData: FormData, options?: ApiOptions): Promise<T> => {
  const baseUrl = getApiBaseUrl();
  const url = endpoint.startsWith('http') ? endpoint : `${baseUrl}${endpoint}`;
  const token = tokenStorage.getAccessToken();
  const headers: Record<string, string> = {
    ...(options?.headers as Record<string, string> || {}),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: formData,
    ...options,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new ApiError(data.error?.message || data.message || 'Upload failed', response.status);
  }
  return (data && data.data !== undefined ? data.data : data) as T;
};

export const api = apiClient;

