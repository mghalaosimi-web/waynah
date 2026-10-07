'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { apiClient, type DistrictDetailData } from '../../../../lib/api/api-client';
import { useAuth } from '../../../../lib/auth/auth-context';
import { can } from '../../../../lib/permissions/permission-helper';
import { PERMISSIONS } from '@waynah/shared';
import { MapShell } from '../../../../lib/maps/map-shell';
import { Button } from '@waynah/ui';
import {
  MapPin,
  Globe,
  Layers,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
  Database,
  Map as MapIcon,
  RefreshCw,
} from 'lucide-react';

export default function AdminDistrictDetailPage() {
  const params = useParams();
  const districtId = (params?.id as string) || '';

  const { actor, isAuthenticated, isLoading: authLoading } = useAuth();

  const hasAccess =
    isAuthenticated &&
    actor &&
    (can(actor, PERMISSIONS.GEOGRAPHY_READ) ||
      actor.roles?.includes('ADMIN') ||
      actor.roles?.includes('SUPER_ADMIN'));

  const [detail, setDetail] = useState<DistrictDetailData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDetail = async () => {
    if (!districtId) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiClient.getDistrictById(districtId);
      if (res.success && res.data) {
        setDetail(res.data);
      } else {
        const msg = typeof res.error === 'object' && res.error?.message ? res.error.message : 'لم يتم العثور على بيانات المديرية الجغرافية';
        setError(msg);
      }
    } catch {
      setError('حدث خطأ أثناء التواصل مع خادم البيانات الجغرافية');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (hasAccess && districtId) {
      fetchDetail();
    }
  }, [hasAccess, districtId]);

  if (authLoading) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 text-center space-y-4">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-slate-500 font-bold">جاري التحقق من الصلاحيات...</p>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="max-w-3xl mx-auto py-12 px-4">
        <div className="bg-white dark:bg-slate-850 p-8 rounded-3xl border border-rose-500/30 text-center space-y-4">
          <ShieldAlert className="w-8 h-8 text-rose-600 mx-auto" />
          <h1 className="text-lg font-black text-slate-900 dark:text-white">
            غير مصرح بالوصول إلى تفاصيل الجغرافيا الإدارية
          </h1>
          <Link href="/admin">
            <Button variant="outline" size="sm" className="font-bold rounded-xl text-xs">
              العودة للإدارة
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Navigation Topbar */}
      <div className="flex items-center justify-between">
        <Link href="/admin/geography">
          <Button variant="outline" size="sm" className="gap-1.5 text-xs font-bold rounded-xl">
            <ChevronRight className="w-4 h-4" />
            <span>العودة إلى سجل الجغرافيا والإدارة</span>
          </Button>
        </Link>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchDetail}
          className="gap-1.5 text-xs font-bold rounded-xl"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>تحديث</span>
        </Button>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-4">
          <div className="h-28 bg-slate-200 dark:bg-slate-800 rounded-3xl animate-pulse" />
          <div className="h-80 bg-slate-200 dark:bg-slate-800 rounded-3xl animate-pulse" />
        </div>
      ) : detail ? (
        <div className="space-y-6">
          {/* Header Card */}
          <div className="bg-white dark:bg-slate-850 p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-black text-slate-900 dark:text-white">
                    مديرية {detail.nameAr}
                  </h1>
                  {detail.externalId && (
                    <span className="px-2.5 py-0.5 rounded-md text-xs font-mono font-bold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                      P-code: {detail.externalId}
                    </span>
                  )}
                </div>
                {detail.nameEn && (
                  <p className="text-xs text-slate-400 font-sans mt-0.5">{detail.nameEn} District</p>
                )}
              </div>

              <div>
                {detail.hasBoundary ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>حدود متوفرة PostGIS (AVAILABLE)</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    <span>بدون حدود مضلعة (MISSING)</span>
                  </span>
                )}
              </div>
            </div>

            {/* Grid Metadata */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-1">
                <span className="text-slate-400 font-medium">المحافظة التابعة:</span>
                <p className="font-bold text-slate-900 dark:text-white">{detail.governorate?.nameAr || 'غير محدد'}</p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-1">
                <span className="text-slate-400 font-medium">الرمز الجغرافي / SRID:</span>
                <p className="font-mono text-slate-900 dark:text-white">
                  {detail.code || 'N/A'} {detail.srid ? `(EPSG:${detail.srid})` : ''}
                </p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-1">
                <span className="text-slate-400 font-medium">المواقع المرتبطة بالمديرية:</span>
                <p className="font-bold text-blue-600 dark:text-blue-400">{detail.placesCount ?? 0} مكان</p>
              </div>
            </div>
          </div>

          {/* Map Visualization */}
          <div className="bg-white dark:bg-slate-850 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <MapIcon className="w-5 h-5 text-emerald-500" />
                <h2 className="font-extrabold text-base text-slate-900 dark:text-white">
                  معاينة حدود المديرية (PostGIS Boundary GeoJSON Map)
                </h2>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                {detail.boundaryGeometryType || 'MultiPolygon'}
              </span>
            </div>

            {detail.boundaryGeoJson ? (
              <MapShell
                height="h-[450px]"
                boundaryGeoJson={detail.boundaryGeoJson}
                showControls={true}
              />
            ) : (
              <div className="h-[350px] rounded-2xl bg-slate-100 dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800 flex items-center justify-center p-6 text-center text-xs text-slate-400">
                <div>
                  <MapPin className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="font-bold">لا تتوفر حدود مضلعة GeoJSON لهذه المديرية حالياً.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
