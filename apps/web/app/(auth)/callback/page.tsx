'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../../lib/auth/auth-context';
import { supabase } from '../../../lib/supabase';
import { Compass, Loader2 } from 'lucide-react';

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { loginWithGoogleToken } = useAuth();
  const [statusMessage, setStatusMessage] = useState('جاري إكمال تسجيل الدخول بواسطة Google...');

  useEffect(() => {
    let isSubscribed = true;

    const handleOAuthCallback = async () => {
      const code = searchParams.get('code');
      const errorParam = searchParams.get('error_description') || searchParams.get('error');

      if (errorParam) {
        if (isSubscribed) {
          router.replace(`/login?error=${encodeURIComponent(errorParam)}`);
        }
        return;
      }

      try {
        let accessToken: string | null = null;

        // 1. If authorization code is present in URL, exchange PKCE code for Supabase session
        if (code) {
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            if (isSubscribed) {
              router.replace(`/login?error=${encodeURIComponent(error.message)}`);
            }
            return;
          }
          accessToken = data.session?.access_token || null;
        } else {
          // 2. Fallback: check existing session from Supabase client
          const { data } = await supabase.auth.getSession();
          accessToken = data.session?.access_token || null;
        }

        if (!accessToken) {
          if (isSubscribed) {
            router.replace('/login?error=' + encodeURIComponent('تعذر الحصول على توكن التوثيق من Google'));
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
            const errorMsg = result.error || 'فشل توثيق حساب Google مع النظام';
            router.replace(`/login?error=${encodeURIComponent(errorMsg)}`);
          }
        }
      } catch {
        if (isSubscribed) {
          router.replace('/login?error=' + encodeURIComponent('حدث خطأ غير متوقع أثناء إكمال التوثيق'));
        }
      }
    };

    handleOAuthCallback();

    return () => {
      isSubscribed = false;
    };
  }, [router, searchParams, loginWithGoogleToken]);

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
