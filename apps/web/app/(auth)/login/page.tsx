'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../../lib/auth/auth-context';
import { Button, Input, Card } from '@waynah/ui';
import { Compass, Mail, Lock, LogIn, ArrowRight, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/dashboard';
  const { login, loginWithGoogle, isAuthenticated } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Read error param from searchParams if present (e.g., from callback failure)
  React.useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam) {
      setErrorMessage(decodeURIComponent(errorParam));
    }
  }, [searchParams]);

  // If already authenticated, redirect automatically
  React.useEffect(() => {
    if (isAuthenticated) {
      router.push(redirectUrl);
    }
  }, [isAuthenticated, router, redirectUrl]);

  const handleGoogleSignIn = async () => {
    setErrorMessage(null);
    setGoogleLoading(true);
    try {
      const res = await loginWithGoogle();
      if (!res.success) {
        setErrorMessage(res.error || 'تعذر الاتصال بـ Google');
        setGoogleLoading(false);
      }
    } catch {
      setErrorMessage('حدث خطأ غير متوقع عند محاولة الاتصال بـ Google');
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim() || !password) {
      setErrorMessage('يرجى إدخال البريد الإلكتروني وكلمة المرور');
      return;
    }

    setLoading(true);

    try {
      const res = await login(email.trim(), password);
      if (res.success) {
        router.push(redirectUrl);
      } else {
        setErrorMessage(res.error || 'فشل تسجيل الدخول. يرجى التحقق من البيانات والتحاول مجدداً.');
      }
    } catch {
      setErrorMessage('حدث خطأ غير متوقع أثناء عملية الدخول');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="w-full max-w-md px-4 py-8">
      <div className="flex flex-col items-center mb-6 text-center space-y-2">
        <Link href="/" className="flex items-center gap-2.5 group mb-2">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-white shadow-lg shadow-emerald-600/30 group-hover:scale-105 transition-transform">
            <Compass className="w-6 h-6" />
          </div>
          <span className="font-extrabold text-2xl tracking-tight text-slate-900 dark:text-white">
            وينه؟
          </span>
        </Link>
        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
          تسجيل الدخول إلى حسابك
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          أدخل بيانات حسابك للوصول إلى لوحة التحكم والخدمات التفاعلية
        </p>
      </div>

      <Card className="p-6 shadow-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-850 rounded-3xl">
        {errorMessage && (
          <div
            role="alert"
            className="mb-4 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-300 text-xs font-semibold flex items-center gap-2.5 animate-in fade-in-50"
          >
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600 dark:text-red-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading || googleLoading}
          className="w-full py-3 mb-4 font-bold text-sm rounded-xl flex items-center justify-center gap-3 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
        >
          <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>{googleLoading ? 'جاري الاتصال بـ Google...' : 'تسجيل الدخول بواسطة Google'}</span>
        </button>

        <div className="relative flex items-center justify-center mb-4">
          <div className="border-t border-slate-200 dark:border-slate-800 w-full" />
          <span className="bg-white dark:bg-slate-850 px-3 text-xs text-slate-400 font-medium shrink-0">
            أو عبر البريد الإلكتروني
          </span>
          <div className="border-t border-slate-200 dark:border-slate-800 w-full" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <Input
              id="login-email"
              type="email"
              label="البريد الإلكتروني"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<Mail className="w-4 h-4" />}
              required
              disabled={loading || googleLoading}
              autoComplete="email"
            />
          </div>

          <div>
            <Input
              id="login-password"
              type="password"
              label="كلمة المرور"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={<Lock className="w-4 h-4" />}
              required
              disabled={loading || googleLoading}
              autoComplete="current-password"
            />
            <div className="flex justify-end mt-1">
              <Link
                href="/forgot-password"
                className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
              >
                نسيت كلمة المرور؟
              </Link>
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            disabled={loading || googleLoading}
            className="w-full py-3 mt-2 font-bold text-sm rounded-xl gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20"
          >
            {loading ? (
              <span>جاري التحقق من البيانات...</span>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>تسجيل الدخول</span>
              </>
            )}
          </Button>
        </form>

        <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 text-center space-y-3 text-xs">
          <p className="text-slate-600 dark:text-slate-400">
            ليس لديك حساب بعد؟{' '}
            <Link
              href={`/register${redirectUrl !== '/dashboard' ? `?redirect=${encodeURIComponent(redirectUrl)}` : ''}`}
              className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              إنشاء حساب جديد
            </Link>
          </p>

          <div className="pt-2">
            <Link
              href="/"
              className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors font-medium"
            >
              <span>العودة إلى التصفح العام</span>
              <ArrowRight className="w-3.5 h-3.5 rotate-180" />
            </Link>
          </div>
        </div>
      </Card>
    </main>
  );
}
