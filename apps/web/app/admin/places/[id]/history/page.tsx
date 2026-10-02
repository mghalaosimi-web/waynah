'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { apiClient, type PlaceHistoryData } from '../../../../../lib/api/api-client';
import { Button } from '@waynah/ui';
import {
  History,
  Building2,
  MapPin,
  Phone,
  ShieldCheck,
  Clock,
  AlertCircle,
  RefreshCw,
  ChevronRight,
  Database,
  Users,
  CheckCircle2,
  FileText,
  Lock,
} from 'lucide-react';

export default function PlaceKnowledgeHistoryPage() {
  const params = useParams();
  const placeId = (params?.id as string) || '';

  const [placeHistory, setPlaceHistory] = useState<PlaceHistoryData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    if (!placeId) return;
    setIsLoading(true);
    setError(null);
    setErrorCode(null);
    try {
      const res = await apiClient.getPlaceHistory(placeId);
      if (res.success && res.data) {
        setPlaceHistory(res.data);
      } else {
        const errObj = typeof res.error === 'object' ? res.error : null;
        const msg = errObj?.message || (typeof res.error === 'string' ? res.error : 'فشل جلب سجل المعرفة للمكان');
        const code = errObj?.code || null;
        setError(msg);
        setErrorCode(code);
      }
    } catch {
      setError('حدث خطأ أثناء التواصل مع خادم API');
    } finally {
      setIsLoading(false);
    }
  }, [placeId]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Navigation & Header */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <Link href="/admin/conflicts">
            <Button variant="outline" size="sm" className="gap-1 text-xs font-bold rounded-xl">
              <ChevronRight className="w-4 h-4" />
              <span>العودة لطابور التعارضات</span>
            </Button>
          </Link>
          <div className="h-4 w-px bg-slate-300 dark:bg-slate-700" />
          <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
            Place ID: {placeId || 'N/A'}
          </span>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchHistory}
          className="gap-1.5 text-xs font-bold rounded-xl"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>تحديث السجل</span>
        </Button>
      </div>

      {/* Security & Error Banners */}
      {errorCode === 'UNAUTHORIZED' && (
        <div className="p-5 rounded-3xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-medium flex items-start gap-3">
          <Lock className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
          <div>
            <h4 className="font-bold text-sm text-rose-800 dark:text-rose-200">غير مصرح بالوصول (401 Unauthorized)</h4>
            <p className="mt-1">يتطلب استعراض سجل المعرفة والملاحظات تسجيل الدخول بصلاحية إدارية مفعلة.</p>
          </div>
        </div>
      )}

      {errorCode === 'FORBIDDEN' && (
        <div className="p-5 rounded-3xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-200 text-xs font-medium flex items-start gap-3">
          <Lock className="w-5 h-5 shrink-0 text-amber-600 mt-0.5" />
          <div>
            <h4 className="font-bold text-sm text-amber-900 dark:text-amber-100">صلاحية غير كافية (403 Forbidden)</h4>
            <p className="mt-1">يتطلب استعراض هذا السجل امتلاك صلاحية <code className="font-mono bg-amber-200/50 dark:bg-amber-900/50 px-1.5 py-0.5 rounded">admin.places.history.read</code>.</p>
          </div>
        </div>
      )}

      {error && !errorCode && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-4">
          <div className="h-44 bg-slate-200 dark:bg-slate-800 rounded-3xl animate-pulse" />
          <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-3xl animate-pulse" />
        </div>
      ) : !placeHistory ? (
        <div className="p-12 text-center bg-white dark:bg-slate-850 rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-4">
          <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-2xl flex items-center justify-center mx-auto">
            <Building2 className="w-8 h-8" />
          </div>
          <div className="space-y-1 max-w-sm mx-auto">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">المكان غير موجود</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              لم يتم العثور على سجل للمكان صاحب المعرف "{placeId}".
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Canonical Place Overview Card */}
          <div className="bg-white dark:bg-slate-850 p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-teal-500/10 text-teal-700 dark:text-teal-300 border border-teal-500/20">
                    {placeHistory.category?.nameAr || 'فئة غير محددة'}
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    حالة التوثيق: {placeHistory.verificationStatus}
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                  {placeHistory.nameAr}
                </h1>
                {placeHistory.nameEn && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                    English Name: {placeHistory.nameEn}
                  </p>
                )}
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 text-xs space-y-1 self-start sm:self-auto">
                <span className="text-slate-400 font-medium block">الموقع الجغرافي والإحداثيات:</span>
                <p className="font-bold text-slate-800 dark:text-slate-200">
                  {placeHistory.district?.nameAr} — {placeHistory.district?.governorate?.nameAr}
                </p>
                {placeHistory.location && (
                  <p className="font-mono text-[11px] text-teal-600 dark:text-teal-400">
                    {placeHistory.location.latitude.toFixed(5)}, {placeHistory.location.longitude.toFixed(5)}
                  </p>
                )}
              </div>
            </div>

            {/* Attributes Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-3.5 bg-slate-50 dark:bg-slate-900 rounded-2xl space-y-1">
                <span className="text-slate-400 font-medium flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-teal-600" />
                  <span>رقم الهاتف المعتمد:</span>
                </span>
                <p className="font-mono font-bold text-slate-800 dark:text-slate-200">
                  {placeHistory.phoneNumber || 'غير مسجل بالسجل الرئيسي'}
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 dark:bg-slate-900 rounded-2xl space-y-1">
                <span className="text-slate-400 font-medium flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-teal-600" />
                  <span>العنوان التفصيلي:</span>
                </span>
                <p className="font-bold text-slate-800 dark:text-slate-200 truncate">
                  {placeHistory.address || 'عبس — حجة'}
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 dark:bg-slate-900 rounded-2xl space-y-1">
                <span className="text-slate-400 font-medium flex items-center gap-1">
                  <Database className="w-3.5 h-3.5 text-teal-600" />
                  <span>إجمالي الملاحظات المرتبطة:</span>
                </span>
                <p className="font-bold text-slate-800 dark:text-slate-200">
                  {placeHistory.observations?.length || 0} ملاحظة مسجلة
                </p>
              </div>
            </div>
          </div>

          {/* Observations Timeline Table */}
          <div className="bg-white dark:bg-slate-850 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden space-y-4 p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-teal-500/10 text-teal-600 dark:text-teal-400 rounded-xl">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                    سجل الملاحظات والمصادر (Knowledge Observations History)
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    التسلسل الزمني الكامل للملاحظات المكتشفة وتتبع الأنشطة والمصادر
                  </p>
                </div>
              </div>

              <span className="text-xs font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-full">
                {placeHistory.observations?.length || 0} ملاحظات
              </span>
            </div>

            {!placeHistory.observations || placeHistory.observations.length === 0 ? (
              <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-xs">
                لا توجد ملاحظات مسجلة لهذا المكان حتى الآن.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200/80 dark:border-slate-800">
                    <tr>
                      <th className="p-3.5 rounded-r-xl">مصدر البيانات</th>
                      <th className="p-3.5">البيانات الملاحظة (اسم / هاتف)</th>
                      <th className="p-3.5">الإحداثيات المكتشفة</th>
                      <th className="p-3.5">حالة الرصد</th>
                      <th className="p-3.5">درجة الثقة للرصد</th>
                      <th className="p-3.5 rounded-l-xl">تاريخ الاكتشاف</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {placeHistory.observations.map((obs) => {
                      const isCommunity =
                        obs.dataSource?.type === 'COMMUNITY_OBSERVATION' ||
                        obs.dataSource?.name === 'WAYNAH Community Reports';

                      return (
                        <tr
                          key={obs.id}
                          className={`transition-colors ${
                            isCommunity ? 'bg-amber-50/30 dark:bg-amber-950/10 hover:bg-amber-50/60' : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/40'
                          }`}
                        >
                          <td className="p-3.5">
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-1.5">
                                {isCommunity ? (
                                  <Users className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                ) : (
                                  <Database className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                                )}
                                <span className="font-bold text-slate-900 dark:text-white">
                                  {obs.dataSource?.name || 'مصدر غير معروف'}
                                </span>
                              </div>
                              <span className="block text-[10px] text-slate-400 font-mono">
                                وزن موثوقية المصدر: {obs.dataSource?.reliabilityWeight ?? '1.0'}
                              </span>
                            </div>
                          </td>

                          <td className="p-3.5 space-y-0.5">
                            <p className="font-bold text-slate-800 dark:text-slate-200">
                              {obs.name || '—'}
                            </p>
                            {obs.phone && (
                              <p className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                                {obs.phone}
                              </p>
                            )}
                          </td>

                          <td className="p-3.5 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                            {obs.latitude !== null && obs.latitude !== undefined && obs.longitude !== null && obs.longitude !== undefined ? (
                              <span>
                                {obs.latitude.toFixed(4)}, {obs.longitude.toFixed(4)}
                              </span>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>

                          <td className="p-3.5">
                            {obs.status === 'AUTO_APPROVED' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>مستقر تلقائياً</span>
                              </span>
                            )}
                            {obs.status === 'CONFLICTED' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-500/30">
                                <AlertCircle className="w-3 h-3 text-rose-600" />
                                <span>تعارض مكتشف</span>
                              </span>
                            )}
                            {obs.status === 'PENDING' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                                <Clock className="w-3 h-3 text-amber-600" />
                                <span>قيد الانتظار (PENDING)</span>
                              </span>
                            )}
                          </td>

                          <td className="p-3.5">
                            <div className="space-y-0.5">
                              <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                                {obs.confidenceScore.toFixed(2)} / 1.00
                              </span>
                              <span className="block text-[10px] text-slate-400">
                                ({Math.round(obs.confidenceScore * 100)}%)
                              </span>
                            </div>
                          </td>

                          <td className="p-3.5 text-slate-500 font-mono text-[11px]">
                            {new Date(obs.discoveredAt || obs.createdAt).toLocaleDateString('ar-YE', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
