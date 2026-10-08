'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { type Actor, ANONYMOUS_ACTOR } from '@waynah/shared';
import { apiClient, type UserData } from '../api/api-client';
import { supabase } from '../supabase';

export interface AuthContextType {
  actor: Actor;
  user: UserData | null;
  isAuthenticated: boolean;
  emailVerified: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  loginWithGoogleToken: (accessToken: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
  verifyEmail: (token: string) => Promise<{ success: boolean; message?: string; error?: string }>;
  resendVerification: (email: string) => Promise<{ success: boolean; message?: string; error?: string }>;
  forgotPassword: (email: string) => Promise<{ success: boolean; message?: string; error?: string }>;
  resetPassword: (token: string, newPassword: string) => Promise<{ success: boolean; message?: string; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [actor, setActor] = useState<Actor>(ANONYMOUS_ACTOR);
  const [user, setUser] = useState<UserData | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const emailVerified = Boolean(user?.emailVerified);

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

  const loginWithGoogle = async () => {
    try {
      const redirectUrl = typeof window !== 'undefined' 
        ? `${window.location.origin}/callback` 
        : 'https://waynah.vercel.app/callback';
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account',
          },
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch {
      return { success: false, error: 'تعذر بدء عملية تسجيل الدخول بـ Google' };
    }
  };

  const loginWithGoogleToken = async (accessToken: string) => {
    setIsLoading(true);
    try {
      const res = await apiClient.loginWithGoogle({ accessToken });
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
          : 'فشل تسجيل الدخول بواسطة Google';

      setIsLoading(false);
      return { success: false, error: errorMessage };
    } catch {
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

  const verifyEmail = async (token: string) => {
    try {
      const res = await apiClient.verifyEmail({ token });
      if (res.success) {
        await refreshAuth();
        return { success: true, message: res.data.message };
      }
      const errorMessage =
        typeof res.error === 'object' && res.error?.message
          ? res.error.message
          : typeof res.error === 'string'
          ? res.error
          : 'فشل تأكيد البريد الإلكتروني';
      return { success: false, error: errorMessage };
    } catch {
      return { success: false, error: 'حدث خطأ غير متوقع أثناء التأكيد' };
    }
  };

  const resendVerification = async (email: string) => {
    try {
      const res = await apiClient.resendVerification({ email });
      if (res.success) {
        return { success: true, message: res.data.message };
      }
      const errorMessage =
        typeof res.error === 'object' && res.error?.message
          ? res.error.message
          : typeof res.error === 'string'
          ? res.error
          : 'فشل إعادة إرسال رابط التأكيد';
      return { success: false, error: errorMessage };
    } catch {
      return { success: false, error: 'حدث خطأ غير متوقع أثناء طلب إعادة الإرسال' };
    }
  };

  const forgotPassword = async (email: string) => {
    try {
      const res = await apiClient.forgotPassword({ email });
      if (res.success) {
        return { success: true, message: res.data.message };
      }
      const errorMessage =
        typeof res.error === 'object' && res.error?.message
          ? res.error.message
          : typeof res.error === 'string'
          ? res.error
          : 'فشل طلب إعادة ضبط كلمة المرور';
      return { success: false, error: errorMessage };
    } catch {
      return { success: false, error: 'حدث خطأ غير متوقع أثناء الطلب' };
    }
  };

  const resetPassword = async (token: string, newPassword: string) => {
    try {
      const res = await apiClient.resetPassword({ token, newPassword });
      if (res.success) {
        // Backend revokes all active sessions upon password reset
        setActor(ANONYMOUS_ACTOR);
        setUser(null);
        setIsAuthenticated(false);
        return { success: true, message: res.data.message };
      }
      const errorMessage =
        typeof res.error === 'object' && res.error?.message
          ? res.error.message
          : typeof res.error === 'string'
          ? res.error
          : 'فشل إعادة ضبط كلمة المرور';
      return { success: false, error: errorMessage };
    } catch {
      return { success: false, error: 'حدث خطأ غير متوقع أثناء العملية' };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        actor,
        user,
        isAuthenticated,
        emailVerified,
        isLoading,
        login,
        loginWithGoogle,
        loginWithGoogleToken,
        register,
        logout,
        refreshAuth,
        verifyEmail,
        resendVerification,
        forgotPassword,
        resetPassword,
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
