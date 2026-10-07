'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../../lib/auth/auth-context';
import { Button, Input, Card } from '@waynah/ui';
import { Compass, Mail, ArrowRight, AlertCircle, CheckCircle2, Loader2, KeyRound } from 'lucide-react';

export default function ForgotPasswordPage() {
  const { forgotPassword } = useAuth();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    if (!email.trim()) {
      setStatusMessage({ type: 'error', message: 'يرجى إدخال البريد الإلكتروني' });
      return;
    }

    setLoading(true);

    try {
      const res = await forgotPassword(email.trim());
      if (res.success) {
        setStatusMessage({
          type: 'success',
          message: res.message || 'إذا كان البريد الإلكتروني مسجلاً، فقد تم إرسال تعليمات إعادة ضبط كلمة المرور',
        });
      } else {
        setStatusMessage({
          type: 'error',
          message: res.error || 'حدث خطأ أثناء الطلب، يرجى المحاولة لاحقاً',
        });
      }
    } catch {
      setStatusMessage({
        type: 'error',
        message: 'حدث خطأ غير متوقع أثناء الاتصال بالخادم',
      });
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
          نسيت كلمة المرور؟
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          أدخل عنوان البريد الإلكتروني المرتبط بحسابك لاستلام رابط إعادة الضبط
        </p>
      </div>

      <Card className="p-6 shadow-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-850 rounded-3xl">
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {statusMessage && (
            <div
              role="alert"
              className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center gap-2.5 animate-in fade-in-50 ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
                  : 'bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-300'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600 dark:text-red-400" />
              )}
              <span>{statusMessage.message}</span>
            </div>
          )}

          <div>
            <Input
              id="forgot-email"
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

          <Button
            type="submit"
            variant="primary"
            disabled={loading}
            className="w-full py-3 mt-2 font-bold text-sm rounded-xl gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>جاري إرسال الطلب...</span>
              </>
            ) : (
              <>
                <KeyRound className="w-4 h-4" />
                <span>إرسال رابط إعادة الضبط</span>
              </>
            )}
          </Button>
        </form>

        <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 text-center space-y-3 text-xs">
          <p className="text-slate-600 dark:text-slate-400">
            تذكرت كلمة المرور؟{' '}
            <Link href="/login" className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline">
              تسجيل الدخول
            </Link>
          </p>

          <div className="pt-1">
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
