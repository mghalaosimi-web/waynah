'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  apiClient,
  type GovernorateItem,
  type DistrictItem,
  type DistrictDetailData,
} from '../../../lib/api/api-client';
import { useAuth } from '../../../lib/auth/auth-context';
import { can } from '../../../lib/permissions/permission-helper';
import { PERMISSIONS } from '@waynah/shared';
import { MapShell } from '../../../lib/maps/map-shell';
import { Button } from '@waynah/ui';
import {
  MapPin,
  Globe,
  Layers,
  Search,
  RefreshCw,
  ChevronLeft,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
  Building2,
  Info,
  X,
  Compass,
  Database,
  Map as MapIcon,
} from 'lucide-react';

export default function AdminGeographyPage() {
  const { actor, isAuthenticated, isLoading: authLoading } = useAuth();

  // Permission & Role Check
  const hasAccess =
    isAuthenticated &&
    actor &&
    (can(actor, PERMISSIONS.GEOGRAPHY_READ) ||
      actor.roles?.includes('ADMIN') ||
      actor.roles?.includes('SUPER_ADMIN'));

  // Data States
  const [governorates, setGovernorates] = useState<GovernorateItem[]>([]);
  const [selectedGovernorate, setSelectedGovernorate] = useState<GovernorateItem | null>(null);
  const [districts, setDistricts] = useState<DistrictItem[]>([]);
  const [selectedDistrictDetail, setSelectedDistrictDetail] = useState<DistrictDetailData | null>(null);

  // Loading & Error States
  const [isGovLoading, setIsGovLoading] = useState<boolean>(true);
  const [isDistLoading, setIsDistLoading] = useState<boolean>(false);
  const [isDetailLoading, setIsDetailLoading] = useState<boolean>(false);
  const [govError, setGovError] = useState<string | null>(null);
  const [distError, setDistError] = useState<string | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);

  // Search filter
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Fetch Governorates
  const fetchGovernorates = useCallback(async () => {
    setIsGovLoading(true);
    setGovError(null);
    try {
      const res = await apiClient.getGovernorates();
      if (res.success && res.data) {
        setGovernorates(res.data);
        if (res.data.length > 0 && !selectedGovernorate) {
          setSelectedGovernorate(res.data[0]);
        }
      } else {
        const msg = typeof res.error === 'object' && res.error?.message ? res.error.message : 'فشل تحميل قائمة المحافظات';
        setGovError(msg);
      }
    } catch {
      setGovError('حدث خطأ أثناء التواصل مع خادم البيانات الجغرافية');
    } finally {
      setIsGovLoading(false);
    }
  }, [selectedGovernorate]);

  // Fetch Districts when Governorate changes
  const fetchDistricts = useCallback(async (govId: string) => {
    setIsDistLoading(true);
    setDistError(null);
    setDistricts([]);
    try {
      const res = await apiClient.getDistrictsByGovernorate(govId);
      if (res.success && res.data) {
        setDistricts(res.data);
      } else {
        const msg = typeof res.error === 'object' && res.error?.message ? res.error.message : 'فشل تحميل مديريات المحافظة';
        setDistError(msg);
      }
    } catch {
      setDistError('حدث خطأ أثناء الاتصال بالخادم لجلب المديريات');
    } finally {
      setIsDistLoading(false);
    }
  }, []);

  // Fetch District Detail
  const fetchDistrictDetail = async (distId: string) => {
    setIsDetailLoading(true);
    setDetailError(null);
    setSelectedDistrictDetail(null);
    try {
      const res = await apiClient.getDistrictById(distId);
      if (res.success && res.data) {
        setSelectedDistrictDetail(res.data);
      } else {
        const msg = typeof res.error === 'object' && res.error?.message ? res.error.message : 'فشل جلب تفاصيل المديرية والحدود المكانية';
        setDetailError(msg);
      }
    } catch {
      setDetailError('حدث خطأ أثناء جلب تفاصيل المديرية الجغرافية');
    } finally {
      setIsDetailLoading(false);
    }
  };

  useEffect(() => {
    if (hasAccess) {
      fetchGovernorates();
    }
  }, [hasAccess, fetchGovernorates]);

  useEffect(() => {
    if (selectedGovernorate?.id) {
      fetchDistricts(selectedGovernorate.id);
    }
  }, [selectedGovernorate, fetchDistricts]);

  // Filtered Governorates
  const filteredGovernorates = governorates.filter(
    (g) =>
      g.nameAr.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (g.nameEn && g.nameEn.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (g.externalId && g.externalId.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (g.code && g.code.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (authLoading) {
    return (
      <div className="max-w-7xl mx-auto py-12 px-4 text-center space-y-4">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-slate-500 font-bold">جاري التحقق من صلاحيات الإدارة والجغرافيا...</p>
      </div>
    );
  }

  // Authorization Shield Fallback
  if (!hasAccess) {
    return (
      <div className="max-w-3xl mx-auto py-12 px-4">
        <div className="bg-white dark:bg-slate-850 p-8 rounded-3xl border border-rose-500/30 shadow-lg text-center space-y-5">
          <div className="w-16 h-16 bg-rose-500/10 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-black text-slate-900 dark:text-white">
              غير مصرح بالوصول — لوحة الجغرافيا الإدارية
            </h1>
            <p className="text-xs text-slate-600 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
              هذه الصفحة مخصصة فقط لمديري ومسؤولي النظام الحاصلين على صلاحيات الإدارة الجغرافية (<code className="font-mono text-rose-600">geography.read</code> / Admin role).
            </p>
          </div>
          <div className="pt-2">
            <Link href="/admin">
              <Button variant="outline" size="sm" className="font-bold rounded-xl text-xs">
                العودة إلى لوحة الإدارة الرئيسية
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 p-6 sm:p-8 rounded-3xl text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-300 text-xs font-bold">
              <Compass className="w-4 h-4 text-blue-400" />
              <span>الإدارة الجغرافية الإدارية — Geo-D</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              سجل المحافظات والمديريات والحدود المكانية
            </h1>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              استعراض ومراجعة التقسيمات الجغرافية الرسمية، فحص كفاية الحدود المكانية PostGIS EPSG:4326، ومتابعة ربط المواقع بالمديريات.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchGovernorates}
              className="gap-2 text-xs font-bold rounded-xl border-slate-700 hover:bg-slate-800 text-slate-200"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isGovLoading ? 'animate-spin' : ''}`} />
              <span>تحديث السجل</span>
            </Button>
            <Link href="/admin">
              <Button variant="outline" size="sm" className="text-xs font-bold rounded-xl border-slate-700 text-slate-300">
                الرئيسية
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Overview Metric Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-850 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-bold">إجمالي المحافظات</span>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              {isGovLoading ? '...' : governorates.length}
            </p>
          </div>
          <div className="p-3 bg-blue-500/10 text-blue-600 rounded-2xl">
            <Globe className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-850 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-bold">المحافظة المحددة</span>
            <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1 truncate max-w-[180px]">
              {selectedGovernorate ? selectedGovernorate.nameAr : 'لم تحدد'}
            </p>
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-2xl">
            <MapPin className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-850 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-bold">مديريات المحافظة</span>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              {isDistLoading ? '...' : districts.length}
            </p>
          </div>
          <div className="p-3 bg-amber-500/10 text-amber-600 rounded-2xl">
            <Layers className="w-6 h-6" />
          </div>
        </div>
      </div>

      {govError && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{govError}</span>
        </div>
      )}

      {/* Main Split Layout: Left Governorates Drawer / Right Districts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Governorates Sidebar Selection (4 cols) */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-850 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-blue-600" />
              <h2 className="font-extrabold text-base text-slate-900 dark:text-white">
                قائمة المحافظات
              </h2>
            </div>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600">
              {filteredGovernorates.length} محافظة
            </span>
          </div>

          {/* Search Governorates input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute top-3 right-3" />
            <input
              type="text"
              placeholder="ابحث عن محافظة (الاسم / P-code)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-9 pl-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
            />
          </div>

          {/* Governorates List */}
          {isGovLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-14 bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : filteredGovernorates.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 space-y-2">
              <Building2 className="w-8 h-8 text-slate-300 mx-auto" />
              <p>لم يتم العثور على نتائج مطابقة لـ "{searchQuery}"</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[550px] overflow-y-auto pr-1">
              {filteredGovernorates.map((gov) => {
                const isSelected = selectedGovernorate?.id === gov.id;
                return (
                  <button
                    key={gov.id}
                    onClick={() => setSelectedGovernorate(gov)}
                    className={`w-full text-right p-3.5 rounded-2xl border transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-500 text-blue-900 dark:text-blue-200 shadow-sm'
                        : 'bg-white dark:bg-slate-850 border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-xs">{gov.nameAr}</span>
                        {gov.nameEn && (
                          <span className="text-[11px] text-slate-400 font-sans">({gov.nameEn})</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                        {gov.externalId && <span>P-code: {gov.externalId}</span>}
                        {gov.code && <span>رمز: {gov.code}</span>}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600">
                        {gov.districtCount ?? 0} مديرية
                      </span>
                      <ChevronLeft className={`w-4 h-4 ${isSelected ? 'text-blue-600' : 'text-slate-300'}`} />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Selected Governorate's Districts List & Detail (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white dark:bg-slate-850 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-black text-slate-900 dark:text-white">
                    {selectedGovernorate ? `مديريات محافظة ${selectedGovernorate.nameAr}` : 'اختر محافظة'}
                  </h2>
                  {selectedGovernorate?.externalId && (
                    <span className="px-2.5 py-0.5 rounded-md text-xs font-mono font-bold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                      {selectedGovernorate.externalId}
                    </span>
                  )}
                </div>
                {selectedGovernorate?.nameEn && (
                  <p className="text-xs text-slate-400 mt-0.5 font-sans">
                    {selectedGovernorate.nameEn} Governorate
                  </p>
                )}
              </div>

              {selectedGovernorate && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchDistricts(selectedGovernorate.id)}
                  className="gap-1.5 text-xs font-bold rounded-xl"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isDistLoading ? 'animate-spin' : ''}`} />
                  <span>تحديث المديريات</span>
                </Button>
              )}
            </div>

            {distError && (
              <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{distError}</span>
              </div>
            )}

            {/* Districts List */}
            {isDistLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-24 bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse" />
                ))}
              </div>
            ) : !selectedGovernorate ? (
              <div className="p-12 text-center text-xs text-slate-400 space-y-2">
                <Info className="w-8 h-8 mx-auto text-slate-300" />
                <p>يرجى اختيار محافظة من القائمة لعرض المديريات التابعة لها.</p>
              </div>
            ) : districts.length === 0 ? (
              <div className="p-12 text-center bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-3">
                <Layers className="w-8 h-8 text-slate-400 mx-auto" />
                <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  لا توجد مديريات مسجلة لهذه المحافظة حالياً
                </h3>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {districts.map((dist) => {
                  return (
                    <div
                      key={dist.id}
                      className="bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800 space-y-3 flex flex-col justify-between hover:border-blue-500/50 transition-all"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <h3 className="font-bold text-xs text-slate-900 dark:text-white">
                            مديرية {dist.nameAr}
                          </h3>
                          {dist.hasBoundary ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                              <span>حدود متوفرة</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                              <span>بدون حدود مضلعة</span>
                            </span>
                          )}
                        </div>

                        {dist.nameEn && (
                          <p className="text-[11px] text-slate-400 font-sans">{dist.nameEn}</p>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-200/60 dark:border-slate-800/80 pt-2.5">
                        <div className="font-mono space-x-2 space-x-reverse text-[10px]">
                          {dist.externalId && <span>P-code: {dist.externalId}</span>}
                          {dist.code && <span>رمز: {dist.code}</span>}
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => fetchDistrictDetail(dist.id)}
                          className="text-[11px] font-bold rounded-xl py-1 h-7 px-2.5 gap-1 text-blue-600 border-blue-200 dark:border-blue-900 hover:bg-blue-50 dark:hover:bg-blue-950"
                        >
                          <MapIcon className="w-3.5 h-3.5" />
                          <span>معاينة الحدود</span>
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* District Detail Modal Overlay */}
      {(selectedDistrictDetail || isDetailLoading || detailError) && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-850 w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-500/10 text-blue-600 rounded-2xl">
                  <MapIcon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900 dark:text-white">
                    {selectedDistrictDetail ? `تفاصيل مديرية ${selectedDistrictDetail.nameAr}` : 'معاينة الحدود المكانية'}
                  </h3>
                  {selectedDistrictDetail?.governorate && (
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      محافظة {selectedDistrictDetail.governorate.nameAr}
                    </p>
                  )}
                </div>
              </div>

              <button
                onClick={() => {
                  setSelectedDistrictDetail(null);
                  setDetailError(null);
                }}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {isDetailLoading ? (
                <div className="space-y-4 text-center py-12">
                  <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-xs font-bold text-slate-500">جاري تحميل بيانات الحدود المكانية PostGIS...</p>
                </div>
              ) : detailError ? (
                <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{detailError}</span>
                </div>
              ) : selectedDistrictDetail ? (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Metadata Table (5 cols) */}
                  <div className="lg:col-span-5 space-y-4">
                    <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-3">
                      <h4 className="font-extrabold text-xs text-slate-900 dark:text-white flex items-center gap-1.5 border-b border-slate-200/60 dark:border-slate-800 pb-2">
                        <Database className="w-4 h-4 text-blue-500" />
                        <span>بيانات التسجيل والجغرافيا</span>
                      </h4>

                      <dl className="space-y-2.5 text-xs">
                        <div className="flex justify-between">
                          <dt className="text-slate-500 font-medium">اسم المديرية:</dt>
                          <dd className="font-bold text-slate-900 dark:text-white">{selectedDistrictDetail.nameAr}</dd>
                        </div>
                        {selectedDistrictDetail.nameEn && (
                          <div className="flex justify-between">
                            <dt className="text-slate-500 font-medium">الاسم بالإنجليزية:</dt>
                            <dd className="font-sans text-slate-700 dark:text-slate-300">{selectedDistrictDetail.nameEn}</dd>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <dt className="text-slate-500 font-medium">المحافظة:</dt>
                          <dd className="font-bold text-blue-600 dark:text-blue-400">{selectedDistrictDetail.governorate?.nameAr || 'N/A'}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-slate-500 font-medium">معرف OCHA / P-Code:</dt>
                          <dd className="font-mono text-slate-800 dark:text-slate-200">{selectedDistrictDetail.externalId || 'غير مسجل'}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-slate-500 font-medium">الرمز الجغرافي:</dt>
                          <dd className="font-mono text-slate-800 dark:text-slate-200">{selectedDistrictDetail.code || 'غير مسجل'}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-slate-500 font-medium">حالة الحدود المكانية:</dt>
                          <dd>
                            {selectedDistrictDetail.hasBoundary ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                <span>متوفرة ({selectedDistrictDetail.boundaryStatus})</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
                                <span>غير متوفرة (MISSING)</span>
                              </span>
                            )}
                          </dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-slate-500 font-medium">نوع الهندسة (Geometry):</dt>
                          <dd className="font-mono text-slate-800 dark:text-slate-200">{selectedDistrictDetail.boundaryGeometryType || 'N/A'}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-slate-500 font-medium">النظام المرجعي SRID:</dt>
                          <dd className="font-mono text-slate-800 dark:text-slate-200">{selectedDistrictDetail.srid ? `EPSG:${selectedDistrictDetail.srid}` : 'N/A'}</dd>
                        </div>
                        <div className="flex justify-between border-t border-slate-200/60 dark:border-slate-800 pt-2">
                          <dt className="text-slate-500 font-medium">المواقع المرتبطة بالمديرية:</dt>
                          <dd className="font-bold text-slate-900 dark:text-white">{selectedDistrictDetail.placesCount ?? 0} مكان</dd>
                        </div>
                      </dl>
                    </div>
                  </div>

                  {/* Map Boundary Visualization (7 cols) */}
                  <div className="lg:col-span-7 space-y-2">
                    <h4 className="font-extrabold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                      <MapIcon className="w-4 h-4 text-emerald-500" />
                      <span>معاينة حدود المديرية (PostGIS GeoJSON Boundary Map)</span>
                    </h4>

                    {selectedDistrictDetail.boundaryGeoJson ? (
                      <MapShell
                        height="h-[360px]"
                        boundaryGeoJson={selectedDistrictDetail.boundaryGeoJson}
                        showControls={true}
                      />
                    ) : (
                      <div className="h-[360px] rounded-2xl bg-slate-100 dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800 flex items-center justify-center p-6 text-center text-xs text-slate-400 space-y-2">
                        <div>
                          <MapPin className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                          <p className="font-bold">لا تتوفر حدود مضلعة GeoJSON لهذه المديرية حالياً.</p>
                          <p className="text-[11px] text-slate-500 mt-1">
                            يمكن إضافة حدود جديدة عبر عملية استيراد البيانات الجغرافية المعتمدة (Geo-B).
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : null}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedDistrictDetail(null);
                  setDetailError(null);
                }}
                className="text-xs font-bold rounded-xl"
              >
                إغلاق
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
