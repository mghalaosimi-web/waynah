'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../../lib/auth/auth-context';
import { Button, Input, Card } from '@waynah/ui';
import { Compass, User, Mail, Lock, UserPlus, ArrowRight, AlertCircle } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/dashboard';
  const { register, isAuthenticated } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // If already authenticated, redirect automatically
  React.useEffect(() => {
    if (isAuthenticated) {
      router.push(redirectUrl);
    }
  }, [isAuthenticated, router, redirectUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Client-side validations
    if (!name.trim() || name.trim().length < 2) {
      setErrorMessage('يرجى إدخال الاسم الثلاثي أو اسم العرض (حرفين على الأقل)');
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('يرجى إدخال بريد إلكتروني صحيح');
      return;
    }

    if (!password || password.length < 8) {
      setErrorMessage('كلمة المرور يجب أن لا تقل عن 8 خانات');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('كلمة المرور وتأكيد كلمة المرور غير متطابقين');
      return;
    }

    setLoading(true);

    try {
      const res = await register(name.trim(), email.trim(), password);
      if (res.success) {
        router.push(redirectUrl);
      } else {
        setErrorMessage(res.error || 'فشل إنشاء الحساب. يرجى التأكد من البيانات والتحاول مجدداً.');
      }
    } catch {
      setErrorMessage('حدث خطأ غير متوقع أثناء عملية التسجيل');
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
          إنشاء حساب جديد
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          انضم إلى منصة وينه للاستكشاف الجغرافي وحفظ أماكنك المفضلة
        </p>
      </div>

      <Card className="p-6 shadow-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-850 rounded-3xl">
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {errorMessage && (
            <div
              role="alert"
              className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-300 text-xs font-semibold flex items-center gap-2.5 animate-in fade-in-50"
            >
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600 dark:text-red-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div>
            <Input
              id="register-name"
              type="text"
              label="الاسم الكامل"
              placeholder="مثال: أحمد المحمد"
              value={name}
              onChange={(e) => setName(e.target.value)}
              leftIcon={<User className="w-4 h-4" />}
              required
              disabled={loading}
              autoComplete="name"
            />
          </div>

          <div>
            <Input
              id="register-email"
              type="email"
              label="البريد الإلكتروني"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<Mail className="w-4 h-4" />}
              required
              disabled={loading}
              autoComplete="email"
            />
          </div>

          <div>
            <Input
              id="register-password"
              type="password"
              label="كلمة المرور"
              placeholder="8 خانات على الأقل"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={<Lock className="w-4 h-4" />}
              helperText="يجب أن تتكون من 8 خانات على الأقل"
              required
              disabled={loading}
              autoComplete="new-password"
            />
          </div>

          <div>
            <Input
              id="register-confirm-password"
              type="password"
              label="تأكيد كلمة المرور"
              placeholder="إعادة كتابة كلمة المرور"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              leftIcon={<Lock className="w-4 h-4" />}
              required
              disabled={loading}
              autoComplete="new-password"
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            disabled={loading}
            className="w-full py-3 mt-2 font-bold text-sm rounded-xl gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20"
          >
            {loading ? (
              <span>جاري إنشاء الحساب...</span>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                <span>إنشاء الحساب الان</span>
              </>
            )}
          </Button>
        </form>

        <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 text-center space-y-3 text-xs">
          <p className="text-slate-600 dark:text-slate-400">
            لديك حساب بالفعل؟{' '}
            <Link
              href={`/login${redirectUrl !== '/dashboard' ? `?redirect=${encodeURIComponent(redirectUrl)}` : ''}`}
              className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              تسجيل الدخول
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
