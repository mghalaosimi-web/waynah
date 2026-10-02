'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { apiClient, type DataConflictItem } from '../../../lib/api/api-client';
import { Button } from '@waynah/ui';
import {
  Layers,
  ShieldCheck,
  AlertCircle,
  Clock,
  RefreshCw,
  ChevronLeft,
  ArrowUpRight,
  FileText,
  Building2,
  Lock,
} from 'lucide-react';

interface ParsedConflictDetail {
  field: string;
  old: string | null;
  new: string;
}

export default function AdminConflictsQueuePage() {
  const [conflicts, setConflicts] = useState<DataConflictItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);

  const fetchConflicts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setErrorCode(null);
    try {
      const res = await apiClient.getAdminConflicts();
      if (res.success && res.data) {
        setConflicts(res.data);
      } else {
        const errObj = typeof res.error === 'object' ? res.error : null;
        const msg = errObj?.message || (typeof res.error === 'string' ? res.error : 'فشل تحميل طابور تعارضات البيانات');
        const code = errObj?.code || null;
        setError(msg);
        setErrorCode(code);
      }
    } catch {
      setError('حدث خطأ أثناء التواصل مع خادم API');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConflicts();
  }, [fetchConflicts]);

  const parseDescription = (desc: string): ParsedConflictDetail[] => {
    try {
      const parsed = JSON.parse(desc);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    } catch (_e) {
      // Return raw description string as single detail if not JSON
    }
    return [{ field: 'تفاصيل التعارض', old: null, new: desc }];
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-850 p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-teal-500/10 text-teal-600 dark:text-teal-400 rounded-2xl">
            <Layers className="w-7 h-7" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-[11px] font-bold mb-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>جودة المعرفة والرقابة الميدانية</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">
              طابور تعارضات البيانات (Data Conflicts)
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              مراجعة تعارضات الملاحظات المكتشفة تلقائياً عبر مصادر البيانات وتاريخ تعديل المكان
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchConflicts}
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

      {/* Security & Error Banners */}
      {errorCode === 'UNAUTHORIZED' && (
        <div className="p-5 rounded-3xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-medium flex items-start gap-3">
          <Lock className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
          <div>
            <h4 className="font-bold text-sm text-rose-800 dark:text-rose-200">غير مصرح بالوصول (401 Unauthorized)</h4>
            <p className="mt-1">يتطلب استعراض طابور تعارضات البيانات تسجيل الدخول بصلاحية إدارية مفعلة.</p>
          </div>
        </div>
      )}

      {errorCode === 'FORBIDDEN' && (
        <div className="p-5 rounded-3xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-200 text-xs font-medium flex items-start gap-3">
          <Lock className="w-5 h-5 shrink-0 text-amber-600 mt-0.5" />
          <div>
            <h4 className="font-bold text-sm text-amber-900 dark:text-amber-100">صلاحية غير كافية (403 Forbidden)</h4>
            <p className="mt-1">يتطلب استعراض هذا الطابور امتلاك صلاحية <code className="font-mono bg-amber-200/50 dark:bg-amber-900/50 px-1.5 py-0.5 rounded">admin.conflicts.read</code>.</p>
          </div>
        </div>
      )}

      {error && !errorCode && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Conflicts Content */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-slate-200 dark:bg-slate-800 rounded-3xl animate-pulse" />
          ))}
        </div>
      ) : conflicts.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-850 rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-4">
          <div className="w-16 h-16 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center mx-auto">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div className="space-y-1 max-w-sm mx-auto">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              لا توجد تعارضات بيانات مفتوحة حالياً
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              جميع ملاحظات الاستكشاف المكتشفة متوافقة ومستقرة مع سجلات الأماكن المعتمدة.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 px-1">
            <span>إجمالي التعارضات المفتوحة: {conflicts.length}</span>
            <span className="text-[11px] text-slate-400">سجل التغييرات يتطلب التدقيق والاطلاع على تاريخ المكان</span>
          </div>

          {conflicts.map((conflict) => {
            const details = parseDescription(conflict.description);
            const place = conflict.place;

            return (
              <div
                key={conflict.id}
                className="bg-white dark:bg-slate-850 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-all space-y-4"
              >
                {/* Row Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-2xl">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                          {place?.nameAr || 'مكان غير محدد'}
                        </h2>
                        {place?.nameEn && (
                          <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                            ({place.nameEn})
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-2 font-mono">
                        <span>معرف النزاع: {conflict.id}</span>
                        {place?.phoneNumber && <span>• هاتف المكان: {place.phoneNumber}</span>}
                      </p>
                    </div>
                  </div>

                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-500/30 self-start sm:self-center">
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    <span>تعارض مفتوح (OPEN)</span>
                  </span>
                </div>

                {/* Conflict Details Grid */}
                <div className="bg-slate-50 dark:bg-slate-900/70 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-3">
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-teal-600" />
                    <span>الخاصيات المتعارضة بين السجل المعتمد والملاحظة الجديدة:</span>
                  </h4>

                  <div className="grid grid-cols-1 gap-2 text-xs">
                    {details.map((item, idx) => (
                      <div
                        key={idx}
                        className="bg-white dark:bg-slate-850 p-3 rounded-xl border border-slate-200/60 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                      >
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          الخاصية: <code className="font-mono text-teal-600 dark:text-teal-400">{item.field}</code>
                        </span>
                        <div className="flex flex-wrap items-center gap-3 font-mono text-[11px]">
                          <span className="text-slate-500">
                            القيمة في السجل: <span className="text-slate-700 dark:text-slate-300 font-semibold">{item.old || 'غير محدد'}</span>
                          </span>
                          <span className="text-slate-400">←</span>
                          <span className="text-rose-600 dark:text-rose-400 font-semibold bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                            القيمة الملاحظة: {item.new}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer Trace Links */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 text-[11px] text-slate-500">
                  <div className="flex flex-wrap items-center gap-3 font-mono">
                    <span>ملاحظة مرجعية: {conflict.baseObservationId.substring(0, 8)}...</span>
                    <span>• ملاحظة متعارضة: {conflict.conflictingObservationId.substring(0, 8)}...</span>
                    <span>
                      • التاريخ:{' '}
                      {new Date(conflict.createdAt).toLocaleDateString('ar-YE', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>

                  <Link href={`/admin/places/${conflict.placeId}/history`}>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5 text-xs font-bold rounded-xl border-teal-600/30 text-teal-700 dark:text-teal-300 hover:bg-teal-50 dark:hover:bg-teal-950/30 self-start sm:self-center"
                    >
                      <span>استعراض سجل المعرفة والملاحظات</span>
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
