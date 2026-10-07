'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '../../../lib/auth/auth-context';
import { Button, Input, Card } from '@waynah/ui';
import { Compass, Lock, ArrowRight, AlertCircle, CheckCircle2, Loader2, KeyRound, AlertTriangle } from 'lucide-react';

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const rawToken = searchParams.get('token');
  const token = rawToken ? rawToken.trim() : null;

  const { resetPassword } = useAuth();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!token) {
      setErrorMessage('رمز إعادة الضبط مفقود. يرجى طلب رابط جديد.');
      return;
    }

    if (!newPassword) {
      setErrorMessage('يرجى إدخال كلمة المرور الجديدة');
      return;
    }

    if (newPassword.length < 8) {
      setErrorMessage('كلمة المرور يجب أن لا تقل عن 8 خانات');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('كلمتا المرور غير متطابقتين');
      return;
    }

    setLoading(true);

    try {
      const res = await resetPassword(token, newPassword);
      if (res.success) {
        setIsSuccess(true);
      } else {
        setErrorMessage(res.error || 'فشل إعادة ضبط كلمة المرور. قد يكون الرابط مستخدماً أو منتهي الصلاحية.');
      }
    } catch {
      setErrorMessage('حدث خطأ غير متوقع أثناء عملية إعادة الضبط');
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
          إعادة ضبط كلمة المرور
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          قم بتعيين كلمة مرور جديدة وقوية لحسابك
        </p>
      </div>

      <Card className="p-6 shadow-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-850 rounded-3xl">
        {!token ? (
          <div className="py-4 flex flex-col items-center text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h2 className="font-bold text-base text-slate-900 dark:text-white">
                رابط غير مكتمل
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                رمز إعادة الضبط مفقود في الرابط. يرجى طلب رابط جديد من صفحة نسيت كلمة المرور.
              </p>
            </div>
            <Link href="/forgot-password" className="w-full mt-2">
              <Button variant="primary" className="w-full py-2.5 font-bold text-xs rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white">
                طلب رابط جديد
              </Button>
            </Link>
          </div>
        ) : isSuccess ? (
          <div className="py-4 flex flex-col items-center text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h2 className="font-bold text-lg text-slate-900 dark:text-white">
                تم تغير كلمة المرور بنجاح!
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                تم إلغاء تفعيل جميع الجلسات القديمة لحماية حسابك. يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة.
              </p>
            </div>
            <Link href="/login" className="w-full mt-2">
              <Button
                variant="primary"
                className="w-full py-3 font-bold text-sm rounded-xl gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-md"
              >
                <span>تسجيل الدخول الان</span>
              </Button>
            </Link>
          </div>
        ) : (
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
                id="reset-new-password"
                type="password"
                label="كلمة المرور الجديدة"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                leftIcon={<Lock className="w-4 h-4" />}
                required
                disabled={loading}
                autoComplete="new-password"
              />
            </div>

            <div>
              <Input
                id="reset-confirm-password"
                type="password"
                label="تأكيد كلمة المرور الجديدة"
                placeholder="••••••••"
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
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>جاري تحديث كلمة المرور...</span>
                </>
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  <span>حفظ كلمة المرور الجديدة</span>
                </>
              )}
            </Button>
          </form>
        )}

        <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 text-center text-xs">
          <Link
            href="/login"
            className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors font-medium"
          >
            <span>العودة إلى تسجيل الدخول</span>
            <ArrowRight className="w-3.5 h-3.5 rotate-180" />
          </Link>
        </div>
      </Card>
    </main>
  );
}
