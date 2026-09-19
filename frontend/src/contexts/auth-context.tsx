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
      const data = await apiClient<{ user: User }>('/auth/me');
      setUser(data.user);
    } catch (error) {
      console.warn('Failed to fetch user profile, clearing session:', error);
      tokenStorage.clearTokens();
      setUser(null);
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
