'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent, Badge } from '@waynah/ui';

export interface BusinessBranchItem {
  id: string;
  nameAr: string;
  districtNameAr?: string;
  isCurrent?: boolean;
}

export interface BusinessOverviewProps {
  businessId: string;
  businessName: string;
  businessDescription?: string;
  verificationStatus?: 'VERIFIED' | 'PENDING' | 'UNVERIFIED';
  branches?: BusinessBranchItem[];
}

export const BusinessOverviewCard: React.FC<BusinessOverviewProps> = ({
  businessId,
  businessName,
  businessDescription = 'المنشأة الأم المسؤولة عن تشغيل وإدارة هذه الفروع والمواقع الخدمية.',
  verificationStatus = 'VERIFIED',
  branches = [
    { id: 'place-1', nameAr: 'فرع السوق الرئيسي - عبس', districtNameAr: 'حي السوق', isCurrent: true },
    { id: 'place-2', nameAr: 'فرع الدوار العام - عبس', districtNameAr: 'حي السلام', isCurrent: false },
  ],
}) => {
  return (
    <Card variant="default" className="border-slate-200 dark:border-slate-800">
      <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary-100 dark:bg-primary-950/80 text-primary-700 dark:text-primary-300 flex items-center justify-center font-bold text-xs">
              🏢
            </div>
            <div>
              <CardTitle className="text-sm font-extrabold text-slate-900 dark:text-white">
                {businessName}
              </CardTitle>
              <span className="text-[10px] text-slate-500 font-medium">المنشأة التجارية الأم (Business Entity)</span>
            </div>
          </div>

          {verificationStatus === 'VERIFIED' ? (
            <Badge variant="emerald">منشأة معتمدة</Badge>
          ) : (
            <Badge variant="gold">قيد التوثيق</Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-4 space-y-3 text-xs">
        <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
          {businessDescription}
        </p>

        {/* Branch Network List */}
        <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <span className="font-bold text-slate-700 dark:text-slate-200 block text-[11px]">
            فروع وشبكة المنشأة المكانية ({branches.length}):
          </span>

          <div className="space-y-1.5">
            {branches.map((b) => (
              <div
                key={b.id}
                className={`flex items-center justify-between p-2.5 rounded-xl border text-xs transition-colors ${
                  b.isCurrent
                    ? 'bg-primary-50/60 dark:bg-primary-950/30 border-primary-200 dark:border-primary-800/80 font-bold'
                    : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span>📍</span>
                  <span>{b.nameAr}</span>
                  {b.isCurrent && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary-200 dark:bg-primary-900 text-primary-800 dark:text-primary-200">
                      هذا الفرع
                    </span>
                  )}
                </div>

                {!b.isCurrent && (
                  <Link
                    href={`/places/${b.id}`}
                    className="text-primary-600 dark:text-primary-400 font-semibold hover:underline text-[11px]"
                  >
                    عرض الفرع ←
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-[10px] text-slate-500 flex items-center justify-between">
          <span>المنشأة = هوية قانونية تجارية</span>
          <span>الفرع = وجود مكاني عملياتي</span>
        </div>
      </CardContent>
    </Card>
  );
};
