'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { User, Role } from '../types/auth';
import { apiClient, tokenStorage } from '../lib/api-client';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (payload: Record<string, any>) => Promise<User>;
  loginWithGoogle: (payload?: { email?: string; firstName?: string; lastName?: string; role?: Role }) => Promise<User>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  getDashboardRoute: (role?: Role) => string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const router = useRouter();
  const pathname = usePathname();

  const getDashboardRoute = useCallback((userRole?: Role): string => {
    const role = userRole || user?.role;
    switch (role) {
      case 'SUPERADMIN':
        return '/superadmin';
      case 'TEACHER':
        return '/teacher';
      case 'STUDENT':
      default:
        return '/student';
    }
  }, [user]);

  const refreshUser = useCallback(async () => {
    const token = tokenStorage.getAccessToken();
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      // apiClient already handles token refresh internally on 401, so
      // a successful call here means we're fully authenticated.
      const data = await apiClient<{ user: User }>('/auth/me');
      setUser(data.user);
    } catch (error: any) {
      // Only clear session if the refresh token itself is also gone / invalid.
      // The apiClient already attempted token rotation; if it still throws
      // SESSION_EXPIRED / UNAUTHORIZED it means the refresh token is dead too.
      const isHardFail =
        error?.code === 'SESSION_EXPIRED' ||
        error?.code === 'INVALID_REFRESH_TOKEN' ||
        error?.code === 'TOKEN_REVOKED' ||
        error?.status === 401;

      // Network failure — server temporarily unreachable, never log out
      const isNetworkFailure =
        error?.code === 'NETWORK_ERROR' ||
        error instanceof TypeError ||
        error?.status === 0;

      if (isNetworkFailure) {
        // Decode existing token locally to keep UI working while server is down
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          if (payload?.exp * 1000 > Date.now()) {
            setUser({
              id: payload.id,
              email: payload.email,
              role: payload.role,
              firstName: payload.firstName,
              lastName: payload.lastName,
            } as User);
          } else {
            // Token truly expired and server is down — clear gracefully
            tokenStorage.clearTokens();
            setUser(null);
          }
        } catch {
          console.warn('[Auth] Could not decode token during network failure.');
        }
      } else if (isHardFail) {
        // Only redirect if we're currently on a protected dashboard route
        if (
          typeof window !== 'undefined' &&
          (window.location.pathname.startsWith('/teacher') ||
            window.location.pathname.startsWith('/student') ||
            window.location.pathname.startsWith('/superadmin'))
        ) {
          tokenStorage.clearTokens();
          setUser(null);
        } else {
          // Public page — just clear silently without redirecting
          tokenStorage.clearTokens();
          setUser(null);
        }
      } else {
        // Other non-fatal error — keep the session alive, just log
        console.warn('[Auth] Could not verify session (network?), keeping tokens:', error);
        // Decode the existing token payload optimistically to keep UI working
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          if (payload?.exp * 1000 > Date.now()) {
            // Token still valid per its own expiry, keep the user
            setUser({
              id: payload.id,
              email: payload.email,
              role: payload.role,
              firstName: payload.firstName,
              lastName: payload.lastName,
            } as User);
          } else {
            tokenStorage.clearTokens();
            setUser(null);
          }
        } catch {
          tokenStorage.clearTokens();
          setUser(null);
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);


  const login = async (email: string, password: string): Promise<User> => {
    setIsLoading(true);
    try {
      const data = await apiClient<{ user: User; tokens: { accessToken: string; refreshToken: string } }>(
        '/auth/login',
        {
          method: 'POST',
          body: JSON.stringify({ email, password }),
          requiresAuth: false,
        }
      );

      tokenStorage.setTokens(data.tokens.accessToken, data.tokens.refreshToken);
      setUser(data.user);

      // Navigate to corresponding dashboard
      const targetRoute = getDashboardRoute(data.user.role);
      router.push(targetRoute);

      return data.user;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (payload: Record<string, any>): Promise<User> => {
    setIsLoading(true);
    try {
      const data = await apiClient<{ user: User; tokens: { accessToken: string; refreshToken: string } }>(
        '/auth/register',
        {
          method: 'POST',
          body: JSON.stringify(payload),
          requiresAuth: false,
        }
      );

      tokenStorage.setTokens(data.tokens.accessToken, data.tokens.refreshToken);
      setUser(data.user);

      const targetRoute = getDashboardRoute(data.user.role);
      router.push(targetRoute);

      return data.user;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = async (payload?: { email?: string; firstName?: string; lastName?: string; role?: Role }): Promise<User> => {
    setIsLoading(true);
    try {
      const email = payload?.email || `student.${Math.random().toString(36).substring(2, 7)}@gmail.com`;
      const firstName = payload?.firstName || 'Google';
      const lastName = payload?.lastName || 'Scholar';
      const role = payload?.role || 'STUDENT';

      const data = await apiClient<{ user: User; tokens: { accessToken: string; refreshToken: string } }>(
        '/auth/google',
        {
          method: 'POST',
          body: JSON.stringify({ email, firstName, lastName, role }),
          requiresAuth: false,
        }
      );

      tokenStorage.setTokens(data.tokens.accessToken, data.tokens.refreshToken);
      setUser(data.user);

      const targetRoute = getDashboardRoute(data.user.role);
      router.push(targetRoute);

      return data.user;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    const refreshToken = tokenStorage.getRefreshToken();
    try {
      if (refreshToken) {
        await apiClient('/auth/logout', {
          method: 'POST',
          body: JSON.stringify({ refreshToken }),
          requiresAuth: false,
        });
      }
    } catch {
      // Ignore network errors during logout
    } finally {
      tokenStorage.clearTokens();
      setUser(null);
      router.push('/login');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        loginWithGoogle,
        logout,
        refreshUser,
        getDashboardRoute,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
