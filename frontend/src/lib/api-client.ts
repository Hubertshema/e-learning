const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

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

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

function onRefreshed(token: string) {
  refreshSubscribers.forEach((callback) => callback(token));
  refreshSubscribers = [];
}

function addRefreshSubscriber(callback: (token: string) => void) {
  refreshSubscribers.push(callback);
}

export async function apiClient<T = unknown>(endpoint: string, options: ApiOptions = {}): Promise<T> {
  const { requiresAuth = true, headers = {}, ...restOptions } = options;

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

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
    const refreshToken = tokenStorage.getRefreshToken();

    if (!refreshToken) {
      tokenStorage.clearTokens();
      throw new ApiError('Session expired. Please log in again.', 401, 'UNAUTHORIZED');
    }

    if (!isRefreshing) {
      isRefreshing = true;

      try {
        const refreshResponse = await fetch(`${API_BASE_URL}/auth/refresh-token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });

        const refreshData = await refreshResponse.json();

        if (refreshResponse.ok && refreshData.success) {
          const { accessToken, refreshToken: newRefreshToken } = refreshData.data.tokens;
          tokenStorage.setTokens(accessToken, newRefreshToken);
          onRefreshed(accessToken);
        } else {
          tokenStorage.clearTokens();
          if (typeof window !== 'undefined') {
            window.location.href = '/login?expired=1';
          }
          throw new ApiError('Session expired. Please log in again.', 401, 'SESSION_EXPIRED');
        }
      } catch (err) {
        tokenStorage.clearTokens();
        throw err;
      } finally {
        isRefreshing = false;
      }
    }

    // Wait for the active refresh to finish, then retry original request
    return new Promise((resolve, reject) => {
      addRefreshSubscriber(async (newToken: string) => {
        try {
          requestHeaders['Authorization'] = `Bearer ${newToken}`;
          const retryResponse = await fetch(url, {
            ...restOptions,
            headers: requestHeaders,
          });
          const retryData = await retryResponse.json();
          if (!retryResponse.ok) {
            return reject(
              new ApiError(
                retryData.error?.message || 'Request failed',
                retryResponse.status,
                retryData.error?.code,
                retryData.error?.details
              )
            );
          }
          resolve(retryData.data);
        } catch (retryErr) {
          reject(retryErr);
        }
      });
    });
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    let errorMessage = data.error?.message || response.statusText || 'An unexpected error occurred';
    if (Array.isArray(data.error?.details) && data.error.details.length > 0) {
      const fieldDetails = data.error.details
        .map((d: any) => (d.field ? `${d.field}: ${d.message}` : d.message))
        .join('; ');
      errorMessage = `${data.error.message || 'Validation failed'} (${fieldDetails})`;
    }

    throw new ApiError(
      errorMessage,
      response.status,
      data.error?.code || 'ERROR',
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

export const api = apiClient;
