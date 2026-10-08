'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../../lib/auth/auth-context';
import { supabase } from '../../../lib/supabase';
import { Compass, Loader2, AlertTriangle, ArrowLeft } from 'lucide-react';

interface DiagnosticError {
  title: string;
  summary: string[];
  supabaseMessage?: string;
  supabaseName?: string;
  supabaseStatus?: number | string;
}

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { loginWithGoogleToken } = useAuth();
  const [statusMessage, setStatusMessage] = useState('جاري إكمال تسجيل الدخول بواسطة Google...');
  const [diagnosticError, setDiagnosticError] = useState<DiagnosticError | null>(null);

  useEffect(() => {
    let isSubscribed = true;

    const handleOAuthCallback = async () => {
      const code = searchParams.get('code');
      const rawError = searchParams.get('error');
      const rawErrorDesc = searchParams.get('error_description');
      const errorParam = rawErrorDesc || rawError;

      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'غير محدد';

      // Log non-sensitive diagnostics only (Booleans only, no codes/tokens/secrets)
      console.log('[OAuth Callback Diagnostics]', {
        origin,
        hasCode: Boolean(code),
        hasError: Boolean(rawError),
        hasErrorDescription: Boolean(rawErrorDesc),
        supabaseUrl,
      });

      if (errorParam) {
        console.log('[OAuth Callback Diagnostics] Callback received explicit error param');
        if (isSubscribed) {
          setDiagnosticError({
            title: 'خطأ في استجابة موفر الهوية (OAuth Error)',
            summary: [
              'وصل OAuth callback إلى التطبيق بنجاح.',
              'تحتوي استجابة التوثيق على رمز خطأ مباشر من الموفر.'
            ],
            supabaseMessage: errorParam,
          });
        }
        return;
      }

      try {
        let accessToken: string | null = null;

        // 1. If authorization code is present in URL, exchange PKCE code for Supabase session
        if (code) {
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);

          console.log('[OAuth Callback Diagnostics] exchangeCodeForSession result:', {
            exchangeResult: error ? 'failure' : 'success',
            hasSession: Boolean(data?.session),
            hasAccessToken: Boolean(data?.session?.access_token),
          });

          if (error) {
            if (isSubscribed) {
              setDiagnosticError({
                title: 'تشخيص فشل تبادل رمز التوثيق (Authorization Code Failure)',
                summary: [
                  'وصل OAuth callback إلى التطبيق بنجاح.',
                  'فشل تبادل رمز التفويض (authorization code) مع Supabase.'
                ],
                supabaseMessage: error.message,
                supabaseName: error.name,
                supabaseStatus: (error as any).status || (error as any).code,
              });
            }
            return;
          }
          accessToken = data.session?.access_token || null;
        } else {
          // 2. Fallback: check existing session from Supabase client
          const { data } = await supabase.auth.getSession();

          console.log('[OAuth Callback Diagnostics] Fallback getSession result:', {
            hasSession: Boolean(data?.session),
            hasAccessToken: Boolean(data?.session?.access_token),
          });

          accessToken = data.session?.access_token || null;
        }

        if (!accessToken) {
          console.log('[OAuth Callback Diagnostics] No access token available after exchange/session check', {
            exchangeResult: 'failure',
            hasSession: false,
            hasAccessToken: false,
          });
          if (isSubscribed) {
            setDiagnosticError({
              title: 'تشخيص عدم توفر رمز الوصول (Access Token)',
              summary: [
                'وصل OAuth callback إلى التطبيق بنجاح.',
                'استدعاء exchangeCodeForSession لم يعطِ session/access_token.'
              ],
              supabaseMessage: 'تعذر الحصول على توكن التوثيق من Google بعد إجراء التبادل.',
            });
          }
          return;
        }

        // 3. Exchange Supabase access_token for WAYNAH session token via API
        if (isSubscribed) {
          setStatusMessage('جاري إنشاء جلسة WAYNAH آمنة...');
        }

        const result = await loginWithGoogleToken(accessToken);

        // Sign out of client-side Supabase session after exchanging token to maintain single session authority
        await supabase.auth.signOut().catch(() => {});

        if (result.success) {
          if (isSubscribed) {
            router.replace('/dashboard');
          }
        } else {
          if (isSubscribed) {
            console.log('[OAuth Callback Diagnostics] WAYNAH session exchange result: failure');
            setDiagnosticError({
              title: 'فشل إنشاء جلسة WAYNAH',
              summary: [
                'تم الحصول على توكن Google بنجاح.',
                'فشل إنشاء الجلسة في خادم WAYNAH (POST /v1/auth/google).'
              ],
              supabaseMessage: result.error || 'فشل توثيق حساب Google مع النظام',
            });
          }
        }
      } catch (err: unknown) {
        const errorObj = err as { message?: string; name?: string; status?: number };
        console.log('[OAuth Callback Diagnostics] Unexpected error in handleOAuthCallback');
        if (isSubscribed) {
          setDiagnosticError({
            title: 'حدث خطأ غير متوقع',
            summary: [
              'وصل OAuth callback إلى التطبيق بنجاح.',
              'حدث خطأ استثنائي أثناء معالجة التوثيق.'
            ],
            supabaseMessage: errorObj?.message || 'حدث خطأ غير متوقع أثناء إكمال التوثيق',
            supabaseName: errorObj?.name,
            supabaseStatus: errorObj?.status,
          });
        }
      }
    };

    handleOAuthCallback();

    return () => {
      isSubscribed = false;
    };
  }, [router, searchParams, loginWithGoogleToken]);

  if (diagnosticError) {
    return (
      <main className="w-full max-w-lg px-4 py-12 flex flex-col items-center justify-center min-h-[70vh]">
        <div className="w-full bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900/50 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
          <div className="flex items-center gap-3 text-amber-600 dark:text-amber-400">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 dark:text-white">
                {diagnosticError.title}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                نتائج التشخيص الأمني لمسار OAuth
              </p>
            </div>
          </div>

          <div className="space-y-2 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 text-xs">
            <div className="font-semibold text-slate-700 dark:text-slate-300 mb-1">
              ملخص الحالة:
            </div>
            <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-400">
              {diagnosticError.summary.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </div>

          <div className="space-y-3 border-t border-slate-100 dark:border-slate-800 pt-4 text-xs">
            <div className="font-semibold text-slate-700 dark:text-slate-300">
              تفاصيل الخطأ التشخيصية:
            </div>
            
            {diagnosticError.supabaseMessage && (
              <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-3 text-red-700 dark:text-red-300 font-mono text-[11px] break-words">
                <span className="font-semibold text-slate-500 dark:text-slate-400 block font-sans mb-1">
                  error.message:
                </span>
                {diagnosticError.supabaseMessage}
              </div>
            )}

            {diagnosticError.supabaseName && (
              <div className="flex justify-between items-center bg-slate-100 dark:bg-slate-800 px-3 py-2 rounded-xl text-slate-700 dark:text-slate-300 font-mono text-[11px]">
                <span className="font-sans text-slate-500">error.name:</span>
                <span>{diagnosticError.supabaseName}</span>
              </div>
            )}

            {diagnosticError.supabaseStatus !== undefined && (
              <div className="flex justify-between items-center bg-slate-100 dark:bg-slate-800 px-3 py-2 rounded-xl text-slate-700 dark:text-slate-300 font-mono text-[11px]">
                <span className="font-sans text-slate-500">error.status:</span>
                <span>{String(diagnosticError.supabaseStatus)}</span>
              </div>
            )}
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <Link
              href="/login"
              className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-md shadow-emerald-600/20"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>العودة لصفحة تسجيل الدخول</span>
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="w-full max-w-md px-4 py-16 flex flex-col items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-white shadow-xl shadow-emerald-600/30 animate-pulse">
          <Compass className="w-8 h-8" />
        </div>

        <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold text-sm">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>{statusMessage}</span>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400">
          يرجى الانتظار بينما يتم التحقق التشفيري من الهوية وبناء الجلسة الآمنة
        </p>
      </div>
    </main>
  );
}
