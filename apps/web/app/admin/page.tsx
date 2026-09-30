'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { apiClient, type AdminVerificationStats } from '../../lib/api/api-client';
import { Button } from '@waynah/ui';
import {
  ShieldCheck,
  Clock,
  CheckCircle2,
  AlertCircle,
  Building2,
  ChevronLeft,
  RefreshCw,
  Layers,
  ArrowUpRight
} from 'lucide-react';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminVerificationStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiClient.getAdminVerificationStats();
      if (res.success && res.data) {
        setStats(res.data);
      } else {
        const msg = typeof res.error === 'object' && res.error?.message ? res.error.message : 'فشل تحميل بيانات الإحصائيات';
        setError(msg);
      }
    } catch {
      setError('حدث خطأ أثناء التواصل مع خادم API');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div className="space-y-6">
      {/* Admin Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 p-6 sm:p-8 rounded-3xl text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>لوحة الإدارة والإشراف الأمني</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              نظام مراجعة وتوثيق الأنشطة التجارية
            </h1>
            <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
              إدارة طلبات التوثيق المعلقة، دراسة الاعتمادات المرفوعة، ومتابعة حالة الموثوقية التشغيلية للكيانات.
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchStats}
            className="gap-2 text-xs font-bold rounded-xl border-slate-700 hover:bg-slate-800 text-slate-200 self-start sm:self-center"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>تحديث البيانات</span>
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Real Metrics Summary Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Pending */}
        <Link href="/admin/verifications?status=PENDING" className="block group">
          <div className="bg-white dark:bg-slate-850 p-5 rounded-2xl border border-amber-500/30 shadow-sm space-y-3 transition-all group-hover:border-amber-500 group-hover:shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-600 dark:text-amber-400">قيد المراجعة</span>
              <div className="p-2 bg-amber-500/10 text-amber-600 rounded-xl">
                <Clock className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-black text-slate-900 dark:text-white">
                {isLoading ? '...' : stats?.pendingCount ?? 0}
              </span>
              <span className="text-xs text-amber-600 dark:text-amber-400 font-bold flex items-center gap-0.5">
                <span>استعراض الطابور</span>
                <ChevronLeft className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
        </Link>

        {/* Metric 2: Verified */}
        <Link href="/admin/verifications?status=VERIFIED" className="block group">
          <div className="bg-white dark:bg-slate-850 p-5 rounded-2xl border border-emerald-500/30 shadow-sm space-y-3 transition-all group-hover:border-emerald-500 group-hover:shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">أنشطة موثقة</span>
              <div className="p-2 bg-emerald-500/10 text-emerald-600 rounded-xl">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-black text-slate-900 dark:text-white">
                {isLoading ? '...' : stats?.verifiedCount ?? 0}
              </span>
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-0.5">
                <span>عرض الموثقة</span>
                <ChevronLeft className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
        </Link>

        {/* Metric 3: Rejected */}
        <Link href="/admin/verifications?status=REJECTED" className="block group">
          <div className="bg-white dark:bg-slate-850 p-5 rounded-2xl border border-rose-500/30 shadow-sm space-y-3 transition-all group-hover:border-rose-500 group-hover:shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-rose-600 dark:text-rose-400">طلبات مرفوضة</span>
              <div className="p-2 bg-rose-500/10 text-rose-600 rounded-xl">
                <AlertCircle className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-black text-slate-900 dark:text-white">
                {isLoading ? '...' : stats?.rejectedCount ?? 0}
              </span>
              <span className="text-xs text-rose-600 dark:text-rose-400 font-bold flex items-center gap-0.5">
                <span>عرض المرفوضة</span>
                <ChevronLeft className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
        </Link>

        {/* Metric 4: Total Businesses */}
        <div className="bg-white dark:bg-slate-850 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">إجمالي الأنشطة المسجلة</span>
            <div className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-600 rounded-xl">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-black text-slate-900 dark:text-white">
              {isLoading ? '...' : stats?.totalBusinessesCount ?? 0}
            </span>
            <span className="text-[11px] text-slate-400">في قاعدة البيانات</span>
          </div>
        </div>
      </div>

      {/* Main Admin Navigation Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Action 1: Verifications Queue */}
        <div className="bg-white dark:bg-slate-850 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 bg-emerald-500/10 text-emerald-600 rounded-xl">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h2 className="font-extrabold text-base text-slate-900 dark:text-white">
                طابور مراجعة توثيق الأنشطة
              </h2>
            </div>
            <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
              {stats?.pendingCount ?? 0} طلب قيد الانتظار
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            مراجعة الطلبات المرفوعة من مالكي الأنشطة التجارية وتطبيق قرار الاعتماد أو الرفض مع تسبيب إداري مسبب.
          </p>
          <div className="pt-2">
            <Link href="/admin/verifications">
              <Button variant="primary" className="w-full font-bold py-3 rounded-2xl gap-2 text-xs bg-emerald-600 hover:bg-emerald-700 text-white">
                <span>فتح طابور التوثيق (Verification Queue)</span>
                <ArrowUpRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Action 2: Spatial Conflicts Queue */}
        <div className="bg-white dark:bg-slate-850 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 bg-blue-500/10 text-blue-600 rounded-xl">
                <Layers className="w-5 h-5" />
              </div>
              <h2 className="font-extrabold text-base text-slate-900 dark:text-white">
                طابور التعارضات المكانية
              </h2>
            </div>
            <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600">
              جودة المعرفة المكانية
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            مطابقة وتصفية تعارضات الملاحظات المكتشفة تلقائياً عبر مصادر البيانات وتاريخ تعديل الأماكن الجغرافية.
          </p>
          <div className="pt-2">
            <Link href="/admin/conflicts">
              <Button variant="outline" className="w-full font-bold py-3 rounded-2xl gap-2 text-xs">
                <span>فتح طابور التعارضات (Conflicts Queue)</span>
                <ArrowUpRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
