'use client';

import React from 'react';

export interface UncertaintyNoticeProps {
  type: 'UNSATISFIED' | 'CONFLICTING_PHONE' | 'STALE_DATA' | 'UNKNOWN_HOURS' | 'MAP_OFFLINE' | 'NO_RESULTS';
  message?: string;
  onAction?: () => void;
  actionText?: string;
}

export const UncertaintyNotice: React.FC<UncertaintyNoticeProps> = ({
  type,
  message,
  onAction,
  actionText = 'إبلاغ أو تقديم تصحيح',
}) => {
  const configs = {
    CONFLICTING_PHONE: {
      icon: '📞',
      title: 'رقم الهاتف غير مؤكد أو متعارض',
      desc: message || 'توجد بلاغات متعددة بخصوص أرقام تواصل مختلفة لهذا المكان. ننصح بالتثبت المباشر.',
      badgeClass: 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800',
    },
    STALE_DATA: {
      icon: '⏳',
      title: 'معلومات غير محدثة مؤخراً',
      desc: message || 'آخر تأكيد لبيانات هذا المكان كان قبل أكثر من 3 أشهر. قد تتغير ساعات العمل أو الخدمات.',
      badgeClass: 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800',
    },
    UNKNOWN_HOURS: {
      icon: '🕒',
      title: 'ساعات العمل غير مؤكدة',
      desc: message || 'لم يتم تأكيد الجدول الزمني الرسمي للعمل ميدانياً بعد.',
      badgeClass: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700',
    },
    MAP_OFFLINE: {
      icon: '📡',
      title: 'وضع التصفح منخفض النطاق (بدون خريطة)',
      desc: message || 'الخريطة التفاعلية معطلة أو غير متوفرة. يمكنك الاستمرار في اكتشاف واستخدام الأماكن عبر القائمة النصية المباشرة.',
      badgeClass: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800',
    },
    NO_RESULTS: {
      icon: '🔍',
      title: 'لم نجد نتائج مطابقة',
      desc: message || 'جرّب البحث باسم آخر أو إلغاء تصفية التصنيف.',
      badgeClass: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700',
    },
    UNSATISFIED: {
      icon: '⚠️',
      title: 'معلومات بحاجة لتثبت مجتمعي',
      desc: message || 'نحن نتبع مبدأ التثبت الصريح ونعرض عدم اليقين بوضوح لمستخدمينا.',
      badgeClass: 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800',
    },
  };

  const config = configs[type] || configs.UNSATISFIED;

  return (
    <div className={`p-4 rounded-2xl border ${config.badgeClass} space-y-2 text-right transition-all`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 font-extrabold text-xs sm:text-sm">
          <span className="text-base">{config.icon}</span>
          <span>{config.title}</span>
        </div>
        {onAction && (
          <button
            type="button"
            onClick={onAction}
            className="text-xs font-bold underline hover:opacity-80 transition-opacity"
          >
            {actionText}
          </button>
        )}
      </div>
      <p className="text-xs leading-relaxed opacity-90">{config.desc}</p>
    </div>
  );
};
