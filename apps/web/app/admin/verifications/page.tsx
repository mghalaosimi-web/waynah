'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { apiClient, type BusinessVerificationData } from '../../../lib/api/api-client';
import { Button } from '@waynah/ui';
import {
  ShieldCheck,
  Clock,
  CheckCircle2,
  AlertCircle,
  Building2,
  Calendar,
  FileText,
  ChevronLeft,
  RefreshCw,
  Search,
  ArrowUpRight
} from 'lucide-react';

export default function AdminVerificationQueuePage() {
  const searchParams = useSearchParams();
  const initialStatus = searchParams?.get('status') || 'PENDING';

  const [statusFilter, setStatusFilter] = useState<string>(initialStatus);
  const [verifications, setVerifications] = useState<BusinessVerificationData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVerifications = useCallback(async (status?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiClient.getAdminVerifications(status === 'ALL' ? undefined : status);
      if (res.success && res.data) {
        setVerifications(res.data);
      } else {
        const msg = typeof res.error === 'object' && res.error?.message ? res.error.message : 'فشل تحميل طابور التوثيق';
        setError(msg);
      }
    } catch {
      setError('حدث خطأ أثناء التواصل مع خادم API');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVerifications(statusFilter);
  }, [statusFilter, fetchVerifications]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="bg-white dark:bg-slate-850 p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-2xl">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">
              طابور مراجعة توثيق الأنشطة
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Verification Review Queue — اتخاذ القرارات وحسم طلبات الاعتماد
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchVerifications(statusFilter)}
            className="gap-1.5 text-xs font-bold rounded-xl"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>تحديث</span>
          </Button>
          <Link href="/admin">
            <Button variant="outline" size="sm" className="text-xs font-bold rounded-xl">
              العودة للرئيسية
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        {[
          { id: 'PENDING', label: 'بانتظار المراجعة (PENDING)', icon: Clock, color: 'text-amber-600' },
          { id: 'VERIFIED', label: 'موثّق (VERIFIED)', icon: CheckCircle2, color: 'text-emerald-600' },
          { id: 'REJECTED', label: 'مرفوض (REJECTED)', icon: AlertCircle, color: 'text-rose-600' },
          { id: 'ALL', label: 'كافة الطلبات (ALL)', icon: Building2, color: 'text-slate-600' },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = statusFilter === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                isActive
                  ? 'bg-slate-900 text-white dark:bg-emerald-600 dark:text-white shadow-md'
                  : 'bg-white dark:bg-slate-850 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-800 hover:bg-slate-50'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : tab.color}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Queue List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 bg-slate-200 dark:bg-slate-800 rounded-3xl animate-pulse" />
          ))}
        </div>
      ) : verifications.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-850 rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-4">
          <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-2xl flex items-center justify-center mx-auto">
            <Building2 className="w-8 h-8" />
          </div>
          <div className="space-y-1 max-w-sm mx-auto">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              لا توجد طلبات توثيق في هذا الطابور
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              لم يتم العثور على طلبات توثيق بحالة ({statusFilter}) حالياً.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {verifications.map((item) => {
            const biz = item.business;
            return (
              <div
                key={item.id || item.businessId}
                className="bg-white dark:bg-slate-850 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-all space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-2xl">
                      <Building2 className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-base font-bold text-slate-900 dark:text-white">
                          {biz?.name || 'نشاط تجاري'}
                        </h2>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600">
                          {biz?.slug || biz?.id || item.businessId}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        معرف التوثيق: <span className="font-mono">{item.id || 'N/A'}</span>
                      </p>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div>
                    {item.status === 'VERIFIED' && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>موثّق (VERIFIED)</span>
                      </span>
                    )}
                    {item.status === 'PENDING' && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                        <span>بانتظار المراجعة (PENDING)</span>
                      </span>
                    )}
                    {item.status === 'REJECTED' && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-500/30">
                        <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                        <span>مرفوض (REJECTED)</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Content Info */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  {biz?.description && (
                    <div className="md:col-span-2 space-y-1">
                      <span className="text-slate-400 font-medium">وصف النشاط:</span>
                      <p className="text-slate-700 dark:text-slate-300 line-clamp-2 leading-relaxed">
                        {biz.description}
                      </p>
                    </div>
                  )}

                  {item.notes && (
                    <div className="space-y-1 bg-slate-50 dark:bg-slate-900 p-3 rounded-2xl border border-slate-100 dark:border-slate-800">
                      <span className="text-slate-400 font-medium flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5 text-indigo-500" />
                        <span>ملاحظات المالك:</span>
                      </span>
                      <p className="text-slate-700 dark:text-slate-300 italic font-mono text-[11px] line-clamp-2">
                        "{item.notes}"
                      </p>
                    </div>
                  )}
                </div>

                {/* Footer Action */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-3 text-[11px] text-slate-500">
                    {item.submittedAt && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>تاريخ التقديم: {new Date(item.submittedAt).toLocaleDateString('ar-SA')}</span>
                      </span>
                    )}
                  </div>

                  <Link href={`/admin/verifications/${item.id || item.businessId}`}>
                    <Button
                      variant={item.status === 'PENDING' ? 'primary' : 'outline'}
                      size="sm"
                      className={`gap-1.5 text-xs font-bold rounded-xl ${
                        item.status === 'PENDING' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''
                      }`}
                    >
                      <span>{item.status === 'PENDING' ? 'مراجعة واتخاذ القرار' : 'تفاصيل الطلب'}</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
