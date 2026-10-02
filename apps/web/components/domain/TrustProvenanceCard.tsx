'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, Badge } from '@waynah/ui';

export interface TrustProvenanceProps {
  status?: string;
  sourceType?: string;
  lastConfirmedAt?: string;
  confidenceScore?: number;
  conflictingFields?: string[];
  uncertaintyReason?: string;
  isStale?: boolean;
}

export const TrustProvenanceCard: React.FC<TrustProvenanceProps> = ({
  status = 'AUTO_APPROVED',
  sourceType = 'مساهمة مجتمعية موثوقة',
  lastConfirmedAt = 'قبل 4 أيام',
  confidenceScore,
  conflictingFields = [],
  uncertaintyReason,
  isStale = false,
}) => {
  const getStatusBadge = () => {
    switch (status) {
      case 'VERIFIED':
      case 'OFFICIAL':
        return <Badge variant="emerald">موثق ميدانياً / رسمي</Badge>;
      case 'COMMUNITY':
      case 'AUTO_APPROVED':
        return <Badge variant="gold">محدث من المجتمع</Badge>;
      case 'STALE':
        return <Badge variant="outline" className="text-amber-700 bg-amber-50">يحتاج إلى تحديث</Badge>;
      case 'CONFLICTED':
        return <Badge variant="danger">معلومات متعارضة</Badge>;
      default:
        return <Badge variant="secondary">معلومات غير مؤكدة</Badge>;
    }
  };

  return (
    <Card variant="default" className="border-slate-200 dark:border-slate-800">
      <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2 font-extrabold text-slate-900 dark:text-white">
            <svg className="w-4 h-4 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            سجل التوثيق وموثوقية البيانات
          </CardTitle>
          {getStatusBadge()}
        </div>
      </CardHeader>

      <CardContent className="pt-4 space-y-3 text-xs">
        {/* Source & Date */}
        <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
          <div>
            <span className="text-slate-500 block mb-0.5">مصدر المعلومة:</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">{sourceType}</span>
          </div>
          <div>
            <span className="text-slate-500 block mb-0.5">آخر تأكيد:</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">{lastConfirmedAt}</span>
          </div>
        </div>

        {/* Uncertainty Warning Alert if exists */}
        {(uncertaintyReason || conflictingFields.length > 0 || isStale) && (
          <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-xl space-y-1 text-amber-900 dark:text-amber-200">
            <div className="flex items-center gap-1.5 font-bold">
              <span>⚠️ تنبيه عدم اليقين:</span>
            </div>
            {uncertaintyReason && <p className="leading-relaxed">{uncertaintyReason}</p>}
            {conflictingFields.length > 0 && (
              <p className="text-[11px]">
                توجد بلاغات متعارضة حول: <span className="font-bold">{conflictingFields.join('، ')}</span>
              </p>
            )}
            {isStale && (
              <p className="text-[11px]">
                لم يتم التأكيد الميداني لهذا المكان منذ أكثر من 90 يوماً.
              </p>
            )}
          </div>
        )}

        <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1">
          <span>دليل مكاني قائم على التثبت وليس الادعاء.</span>
          <span className="font-mono text-slate-400">Prototype Context</span>
        </div>
      </CardContent>
    </Card>
  );
};
