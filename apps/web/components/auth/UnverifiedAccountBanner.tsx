'use client';

import React, { useState } from 'react';
import { useAuth } from '../../lib/auth/auth-context';
import { Button } from '@waynah/ui';
import { MailWarning, Send, Loader2, CheckCircle2 } from 'lucide-react';

export const UnverifiedAccountBanner: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { user, isAuthenticated, emailVerified, resendVerification } = useAuth();

  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  if (!isAuthenticated || !user || emailVerified) {
    return null;
  }

  const handleResend = async () => {
    setFeedback(null);
    setLoading(true);

    try {
      const res = await resendVerification(user.email);
      if (res.success) {
        setFeedback({
          type: 'success',
          message: res.message || 'إذا كان البريد الإلكتروني متاحاً وغير مفعل، تم إرسال رابط التأكيد',
        });
      } else {
        setFeedback({
          type: 'error',
          message: res.error || 'فشل إرسال رابط التأكيد، يرجى المحاولة لاحقاً',
        });
      }
    } catch {
      setFeedback({
        type: 'error',
        message: 'حدث خطأ أثناء طلب إعادة الإرسال',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      role="region"
      aria-label="تنبيه تأكيد البريد الإلكتروني"
      className={`w-full bg-amber-500/10 border-b border-amber-500/20 text-amber-900 dark:text-amber-200 px-4 py-3 text-xs font-medium transition-colors ${className}`}
    >
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <MailWarning className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <span>
            بريدك الإلكتروني (<strong>{user.email}</strong>) غير مفعّل. يرجى تأكيد البريد للوصول الكامل لكافة الخدمات.
          </span>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {feedback && (
            <span
              role="status"
              className={`flex items-center gap-1 font-semibold ${
                feedback.type === 'success' ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400'
              }`}
            >
              {feedback.type === 'success' && <CheckCircle2 className="w-3.5 h-3.5" />}
              {feedback.message}
            </span>
          )}

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleResend}
            disabled={loading}
            className="h-8 px-3 text-xs font-bold rounded-lg border-amber-500/40 text-amber-900 dark:text-amber-100 hover:bg-amber-500/20 gap-1.5"
          >
            {loading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>جاري الإرسال...</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>إعادة إرسال الرابط</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
