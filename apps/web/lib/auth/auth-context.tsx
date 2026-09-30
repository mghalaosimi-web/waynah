'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { type Actor, ANONYMOUS_ACTOR } from '@waynah/shared';
import { apiClient, type UserData } from '../api/api-client';

export interface AuthContextType {
  actor: Actor;
  user: UserData | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [actor, setActor] = useState<Actor>(ANONYMOUS_ACTOR);
  const [user, setUser] = useState<UserData | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshAuth = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.getMe();
      if (res.success && res.data && res.data.authenticated && res.data.user) {
        setActor(res.data.actor as Actor);
        setUser(res.data.user);
        setIsAuthenticated(true);
      } else {
        setActor(ANONYMOUS_ACTOR);
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch {
      setActor(ANONYMOUS_ACTOR);
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshAuth();
  }, [refreshAuth]);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await apiClient.login({ email, password });
      if (res.success && res.data) {
        setActor(res.data.actor as Actor);
        setUser(res.data.user);
        setIsAuthenticated(true);
        setIsLoading(false);
        return { success: true };
      }

      const errorMessage =
        typeof res.error === 'object' && res.error?.message
          ? res.error.message
          : typeof res.error === 'string'
          ? res.error
          : 'فشل تسجيل الدخول';

      setIsLoading(false);
      return { success: false, error: errorMessage };
    } catch (err: unknown) {
      setIsLoading(false);
      return { success: false, error: 'حدث خطأ غير متوقع أثناء الاتصال بالخادم' };
    }
  };

  const register = async (name: string, email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await apiClient.register({ name, email, password });
      if (res.success && res.data) {
        setActor(res.data.actor as Actor);
        setUser(res.data.user);
        setIsAuthenticated(true);
        setIsLoading(false);
        return { success: true };
      }

      const errorMessage =
        typeof res.error === 'object' && res.error?.message
          ? res.error.message
          : typeof res.error === 'string'
          ? res.error
          : 'فشل إنشاء الحساب';

      setIsLoading(false);
      return { success: false, error: errorMessage };
    } catch (err: unknown) {
      setIsLoading(false);
      return { success: false, error: 'حدث خطأ غير متوقع أثناء الاتصال بالخادم' };
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await apiClient.logout();
    } catch {
      // Ignore network errors on logout
    } finally {
      setActor(ANONYMOUS_ACTOR);
      setUser(null);
      setIsAuthenticated(false);
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        actor,
        user,
        isAuthenticated,
        isLoading,
        login,
        register,
        logout,
        refreshAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
