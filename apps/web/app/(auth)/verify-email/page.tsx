'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '../../../lib/auth/auth-context';
import { Button, Input, Card } from '@waynah/ui';
import { Compass, CheckCircle2, AlertTriangle, Mail, ArrowRight, Loader2, Send } from 'lucide-react';

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const rawToken = searchParams.get('token');
  const token = rawToken ? rawToken.trim() : null;

  const { verifyEmail, resendVerification, user } = useAuth();

  const [verificationState, setVerificationState] = useState<'IDLE' | 'LOADING' | 'SUCCESS' | 'ERROR'>(
    token ? 'LOADING' : 'IDLE'
  );
  const [verificationMessage, setVerificationMessage] = useState<string | null>(null);

  // Resend Verification State
  const [resendEmail, setResendEmail] = useState<string>(user?.email || '');
  const [resendLoading, setResendLoading] = useState<boolean>(false);
  const [resendStatus, setResendStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const verificationAttempted = useRef<boolean>(false);

  useEffect(() => {
    if (!token || verificationAttempted.current) return;
    verificationAttempted.current = true;

    let isMounted = true;
    (async () => {
      try {
        const res = await verifyEmail(token);
        if (!isMounted) return;

        if (res.success) {
          setVerificationState('SUCCESS');
          setVerificationMessage(res.message || 'تم تأكيد البريد الإلكتروني بنجاح!');
        } else {
          setVerificationState('ERROR');
          setVerificationMessage(res.error || 'رابط التحقق غير صالح أو منتهي الصلاحية');
        }
      } catch {
        if (!isMounted) return;
        setVerificationState('ERROR');
        setVerificationMessage('حدث خطأ أثناء عملية تأكيد البريد الإلكتروني');
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [token, verifyEmail]);

  const handleResendSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResendStatus(null);

    if (!resendEmail.trim()) {
      setResendStatus({ type: 'error', message: 'يرجى إدخال البريد الإلكتروني' });
      return;
    }

    setResendLoading(true);

    try {
      const res = await resendVerification(resendEmail.trim());
      if (res.success) {
        setResendStatus({
          type: 'success',
          message: res.message || 'إذا كان البريد الإلكتروني متاحاً وغير مفعل، تم إرسال رابط التأكيد',
        });
      } else {
        setResendStatus({
          type: 'error',
          message: res.error || 'فشل إرسال رابط التأكيد، يرجى المحاولة لاحقاً',
        });
      }
    } catch {
      setResendStatus({
        type: 'error',
        message: 'حدث خطأ أثناء طلب إعادة إرسال رابط التأكيد',
      });
    } finally {
      setResendLoading(false);
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
          تأكيد البريد الإلكتروني
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          تفعيل حسابك في منصة وينه لتأكيد هويتك واستخدام كافة الخصائص
        </p>
      </div>

      <Card className="p-6 shadow-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-850 rounded-3xl space-y-6">
        {/* State: Token present & Loading */}
        {verificationState === 'LOADING' && (
          <div className="py-8 flex flex-col items-center text-center space-y-3">
            <Loader2 className="w-10 h-10 text-emerald-600 animate-spin" />
            <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">
              جاري التحقق من رمز البريد الإلكتروني...
            </p>
            <p className="text-xs text-slate-500">يرجى الانتظار قليلاً</p>
          </div>
        )}

        {/* State: Verification Success */}
        {verificationState === 'SUCCESS' && (
          <div className="py-4 flex flex-col items-center text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h2 className="font-bold text-lg text-slate-900 dark:text-white">
                تم التأكيد بنجاح!
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                {verificationMessage}
              </p>
            </div>
            <Link href="/dashboard" className="w-full mt-2">
              <Button
                variant="primary"
                className="w-full py-3 font-bold text-sm rounded-xl gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-md"
              >
                <span>الانتقال إلى لوحة التحكم</span>
              </Button>
            </Link>
          </div>
        )}

        {/* State: Verification Error / Invalid / Expired */}
        {verificationState === 'ERROR' && (
          <div className="py-2 flex flex-col items-center text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h2 className="font-bold text-base text-slate-900 dark:text-white">
                عذراً، تعذر تأكيد البريد الإلكتروني
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                {verificationMessage}
              </p>
            </div>
          </div>
        )}

        {/* Missing Token or Error State: Show Resend Form */}
        {(verificationState === 'IDLE' || verificationState === 'ERROR') && (
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-4">
            <div className="text-right">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                طلب رابط تأكيد جديد
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                أدخل بريدك الإلكتروني لإعادة إرسال رمز تفعيل الحساب
              </p>
            </div>

            <form onSubmit={handleResendSubmit} className="space-y-3" noValidate>
              {resendStatus && (
                <div
                  role="alert"
                  className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center gap-2.5 animate-in fade-in-50 ${
                    resendStatus.type === 'success'
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
                      : 'bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-300'
                  }`}
                >
                  <Mail className="w-4 h-4 shrink-0" />
                  <span>{resendStatus.message}</span>
                </div>
              )}

              <div>
                <Input
                  id="resend-email"
                  type="email"
                  label="البريد الإلكتروني"
                  placeholder="name@example.com"
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                  leftIcon={<Mail className="w-4 h-4" />}
                  required
                  disabled={resendLoading}
                  autoComplete="email"
                />
              </div>

              <Button
                type="submit"
                variant="outline"
                disabled={resendLoading}
                className="w-full py-2.5 font-bold text-xs rounded-xl gap-2 border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                {resendLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>جاري الإرسال...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>إعادة إرسال رابط التأكيد</span>
                  </>
                )}
              </Button>
            </form>
          </div>
        )}

        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-center text-xs">
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
