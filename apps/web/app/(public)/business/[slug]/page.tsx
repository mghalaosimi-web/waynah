'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Container,
  Button,
  Badge,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Skeleton,
  ErrorState,
} from '@waynah/ui';
import {
  Building2,
  CheckCircle2,
  MapPin,
  Phone,
  Globe,
  Calendar,
  Store,
  Layers,
  ChevronLeft,
  ShieldCheck,
  AlertCircle,
  Map,
  Compass,
  ArrowRight,
  ExternalLink,
  Package,
  Wrench,
  Clock,
  Tag,
  ShoppingBag,
} from 'lucide-react';
import { Header } from '../../../../components/layout/Header';
import { Footer } from '../../../../components/layout/Footer';
import { StatusBadge } from '../../../../components/domain/StatusBadge';
import { MapShell } from '../../../../lib/maps/map-shell';
import { MapMarkerData } from '../../../../lib/maps/map-types';
import { apiClient, type BusinessItem, type PlaceSearchResult, type BusinessCatalogData } from '../../../../lib/api/api-client';

export default function PublicBusinessProfilePage() {
  const params = useParams();
  const router = useRouter();
  const slugParam = params?.slug as string;

  const [business, setBusiness] = useState<BusinessItem | null>(null);
  const [catalog, setCatalog] = useState<BusinessCatalogData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);

  const fetchPublicProfile = useCallback(async () => {
    if (!slugParam) return;

    setIsLoading(true);
    setError(null);

    try {
      const [resProfile, resCatalog] = await Promise.all([
        apiClient.getPublicBusinessProfile(slugParam),
        apiClient.getPublicCatalog(slugParam),
      ]);

      if (resProfile.success && resProfile.data) {
        setBusiness(resProfile.data);
      } else {
        const errorMsg =
          typeof resProfile.error === 'string'
            ? resProfile.error
            : resProfile.error?.message || 'النشاط التجاري غير موجود';
        setError(errorMsg);
      }

      if (resCatalog.success && resCatalog.data) {
        setCatalog(resCatalog.data);
      }
    } catch (_err) {
      setError('تعذر العثور على بيانات النشاط التجاري، يرجى المحاولة لاحقاً.');
    } finally {
      setIsLoading(false);
    }
  }, [slugParam]);

  useEffect(() => {
    fetchPublicProfile();
  }, [fetchPublicProfile]);

  // Transform branches (Places) with valid coordinates for spatial MapShell visualization
  const mapMarkers: MapMarkerData[] = (business?.places || [])
    .map((place) => {
      const lat = place.location?.latitude ?? place.latitude;
      const lng = place.location?.longitude ?? place.longitude;
      if (lat === undefined || lat === null || lng === undefined || lng === null) {
        return null;
      }
      return {
        id: place.id,
        latitude: lat,
        longitude: lng,
        nameAr: place.nameAr,
        nameEn: place.nameEn,
        categoryNameAr: place.category?.nameAr || place.categoryNameAr,
        districtNameAr: place.district?.nameAr || place.districtNameAr,
        address: place.address,
        verificationStatus: place.verificationStatus,
      };
    })
    .filter((m): m is MapMarkerData => m !== null);

  const handleMarkerSelect = (marker: MapMarkerData | null) => {
    setSelectedBranchId(marker ? marker.id : null);
  };

  const isVerified = business?.verified || business?.verificationStatus === 'VERIFIED';
  const isPending = business?.verificationStatus === 'PENDING';

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 dir-rtl">
      <Header />

      <main className="flex-1">
        <Container size="lg" className="py-8 space-y-6">
          {/* Breadcrumb / Top Navigation Bar */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.back()}
              className="gap-1.5 text-xs font-semibold rounded-xl"
            >
              <ArrowRight className="w-4 h-4" />
              <span>العودة لنتائج البحث</span>
            </Button>

            <div className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
              <span className="font-bold text-emerald-600 dark:text-emerald-400">منصة وينه؟</span>
              <span>•</span>
              <span>الملف التجاري العام</span>
            </div>
          </div>

          {/* Loading Skeleton State */}
          {isLoading && (
            <div className="space-y-6">
              <Card className="p-8 space-y-4 rounded-3xl border border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-4">
                  <Skeleton variant="circular" className="w-16 h-16 rounded-2xl" />
                  <div className="space-y-2 flex-1">
                    <Skeleton variant="text" className="h-8 w-1/3" />
                    <Skeleton variant="text" className="h-4 w-2/3" />
                  </div>
                </div>
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <Skeleton variant="text" className="h-10 rounded-xl" />
                  <Skeleton variant="text" className="h-10 rounded-xl" />
                  <Skeleton variant="text" className="h-10 rounded-xl" />
                </div>
              </Card>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4">
                  <Skeleton variant="rectangular" className="h-64 rounded-2xl" />
                  <Skeleton variant="rectangular" className="h-40 rounded-2xl" />
                </div>
                <div className="space-y-4">
                  <Skeleton variant="rectangular" className="h-96 rounded-2xl" />
                </div>
              </div>
            </div>
          )}

          {/* Error State (API Error or Not Found) */}
          {!isLoading && (error || !business) && (
            <div className="max-w-xl mx-auto py-12">
              <Card className="p-8 text-center space-y-5 bg-white dark:bg-slate-850 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-md">
                <div className="w-16 h-16 mx-auto rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                  <AlertCircle className="w-8 h-8" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
                    النشاط التجاري غير موجود
                  </h2>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                    {error || 'لم يتم العثور على النشاط التجاري المطلوب في سجل المنظومة.'}
                  </p>
                </div>
                <div className="pt-2 flex justify-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchPublicProfile}
                    className="rounded-xl font-bold text-xs"
                  >
                    إعادة المحاولة
                  </Button>
                  <Link href="/search">
                    <Button variant="primary" size="sm" className="rounded-xl font-bold text-xs">
                      العودة لاستكشاف الأماكن
                    </Button>
                  </Link>
                </div>
              </Card>
            </div>
          )}

          {/* Business Profile Content */}
          {!isLoading && business && (
            <div className="space-y-6">
              {/* Business Header Card */}
              <div className="bg-white dark:bg-slate-850 p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex items-start gap-4">
                    <div className="p-4 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-2xl shrink-0 border border-emerald-500/20">
                      <Building2 className="w-10 h-10" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                          {business.name}
                        </h1>

                        {isVerified && (
                          <Badge variant="emerald" className="gap-1 px-3 py-1 text-xs">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>منشأة معتمدة وموثقة</span>
                          </Badge>
                        )}

                        {isPending && (
                          <Badge variant="gold" className="gap-1 px-3 py-1 text-xs">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>التوثيق قيد المراجعة</span>
                          </Badge>
                        )}

                        {!isVerified && !isPending && (
                          <Badge variant="neutral" className="gap-1 px-3 py-1 text-xs">
                            <span>غير موثق</span>
                          </Badge>
                        )}
                      </div>

                      {business.description && (
                        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
                          {business.description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Metadata & Key Indicators Bar */}
                <div className="pt-5 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 space-y-1">
                    <span className="text-slate-400 text-[11px] block">عدد المواقع المشغلة</span>
                    <p className="font-extrabold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 text-sm">
                      <Store className="w-4 h-4" />
                      <span>{business.totalPlaces || business.places?.length || 0} فرع وموقع</span>
                    </p>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 space-y-1">
                    <span className="text-slate-400 text-[11px] block">تاريخ الانضمام للنظام</span>
                    <p className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 text-xs mt-0.5">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <span>{new Date(business.createdAt).toLocaleDateString('ar-SA')}</span>
                    </p>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 space-y-1 col-span-2 sm:col-span-1">
                    <span className="text-slate-400 text-[11px] block">حالة التوثيق المعمارية</span>
                    <p className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 text-xs mt-0.5">
                      <ShieldCheck className="w-4 h-4 text-amber-500" />
                      <span>{isVerified ? 'موثق رسمياً' : isPending ? 'قيد التدقيق' : 'في انتظار التوثيق'}</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Architectural Domain Boundary Callout */}
              <div className="p-4 sm:p-5 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 text-xs space-y-2">
                <div className="flex items-center gap-2 font-bold text-emerald-700 dark:text-emerald-300">
                  <Layers className="w-4 h-4" />
                  <span>المفهوم المعماري لمنظومة WAYNAH (Business & Places):</span>
                </div>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-[11px]">
                  <strong>النشاط التجاري (Business):</strong> يمثل الكيان التجاري أو المؤسسي المشغل.<br />
                  <strong>الفروع والمواقع (Places):</strong> تمثل الكيانات الجغرافية المكتشفة والمربوطة مكانياً عبر معرّف النشاط.
                </p>
              </div>

              {/* Public Catalog Section (Products & Services) */}
              {catalog && (catalog.products.length > 0 || catalog.services.length > 0) && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                      <ShoppingBag className="w-5 h-5 text-emerald-600" />
                      <span>دليل المنتجات والخدمات المتاحة</span>
                    </h2>
                    <div className="flex items-center gap-2">
                      {catalog.products.length > 0 && (
                        <Badge variant="emerald" className="text-[11px]">
                          {catalog.products.length} منتج
                        </Badge>
                      )}
                      {catalog.services.length > 0 && (
                        <Badge variant="emerald" className="text-[11px]">
                          {catalog.services.length} خدمة
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Products Grid */}
                  {catalog.products.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                        <Package className="w-4 h-4 text-emerald-600" />
                        <span>المنتجات التجارية ({catalog.products.length})</span>
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {catalog.products.map((prod) => (
                          <Card key={prod.id} className="p-4 space-y-3 bg-white dark:bg-slate-850 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm hover:border-emerald-500/40 transition-all">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-2.5">
                                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                                  <Package className="w-5 h-5" />
                                </div>
                                <div>
                                  <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                                    {prod.nameAr}
                                  </h4>
                                  {prod.nameEn && (
                                    <p className="text-[11px] font-mono text-slate-400 dir-ltr text-right">
                                      {prod.nameEn}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-lg shrink-0">
                                {Number(prod.price).toFixed(2)} {prod.currency || 'ر.س'}
                              </span>
                            </div>

                            {prod.description && (
                              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-2">
                                {prod.description}
                              </p>
                            )}

                            {prod.sku && (
                              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 font-mono flex items-center gap-1">
                                <span>رمز SKU:</span>
                                <span>{prod.sku}</span>
                              </div>
                            )}
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Services Grid */}
                  {catalog.services.length > 0 && (
                    <div className="space-y-3 pt-2">
                      <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                        <Wrench className="w-4 h-4 text-emerald-600" />
                        <span>الخدمات المتاحة ({catalog.services.length})</span>
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {catalog.services.map((serv) => (
                          <Card key={serv.id} className="p-4 space-y-3 bg-white dark:bg-slate-850 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm hover:border-emerald-500/40 transition-all">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-2.5">
                                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                                  <Wrench className="w-5 h-5" />
                                </div>
                                <div>
                                  <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                                    {serv.nameAr}
                                  </h4>
                                  {serv.nameEn && (
                                    <p className="text-[11px] font-mono text-slate-400 dir-ltr text-right">
                                      {serv.nameEn}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-lg shrink-0">
                                {serv.price !== null && serv.price !== undefined
                                  ? `${Number(serv.price).toFixed(2)} ${serv.currency || 'ر.س'}`
                                  : 'حسب الطلب'}
                              </span>
                            </div>

                            {serv.description && (
                              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-2">
                                {serv.description}
                              </p>
                            )}

                            {serv.durationMinutes && (
                              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 font-medium">
                                <Clock className="w-3.5 h-3.5 text-blue-500" />
                                <span>مدة الخدمة: {serv.durationMinutes} دقيقة</span>
                              </div>
                            )}
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Branch Explorer Section: Interactive Map & Branch Cards */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                    <Store className="w-5 h-5 text-emerald-600" />
                    <span>فروع وشبكة المواقع المكانية ({business.places?.length || 0})</span>
                  </h2>

                  {mapMarkers.length > 0 && (
                    <Badge variant="emerald" className="text-[11px]">
                      {mapMarkers.length} موقع مخصص على الخريطة
                    </Badge>
                  )}
                </div>

                {(!business.places || business.places.length === 0) ? (
                  /* Zero Branches Empty State */
                  <Card className="p-10 text-center bg-white dark:bg-slate-850 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
                    <Store className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
                    <div className="space-y-1">
                      <h3 className="font-extrabold text-base text-slate-800 dark:text-slate-200">
                        لا توجد فروع مرتبطة بهذا النشاط حالياً
                      </h3>
                      <p className="text-xs text-slate-400 max-w-md mx-auto">
                        لم يتم ربط أي مواقع جغرافية بهذا النشاط التجاري بعد. عند اعتماد طلبات ربط الفروع، ستظهر المواقع المكانية هنا تلقائياً.
                      </p>
                    </div>
                  </Card>
                ) : (
                  /* Multi-branch Explorer with Interactive Map & Cards Grid */
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    
                    {/* Spatial Map Component Column */}
                    <div className="lg:col-span-6 xl:col-span-7 lg:sticky lg:top-6 space-y-2 order-2 lg:order-1">
                      <div className="flex items-center justify-between px-1 text-xs text-slate-500 font-semibold">
                        <span className="flex items-center gap-1.5">
                          <Map className="w-4 h-4 text-emerald-600" />
                          <span>الخريطة التفاعلية للفروع</span>
                        </span>
                        {selectedBranchId && (
                          <button
                            onClick={() => setSelectedBranchId(null)}
                            className="text-emerald-600 dark:text-emerald-400 hover:underline text-[11px]"
                          >
                            إلغاء تحديد الفرع
                          </button>
                        )}
                      </div>

                      {mapMarkers.length > 0 ? (
                        <MapShell
                          markers={mapMarkers}
                          selectedMarkerId={selectedBranchId}
                          onMarkerSelect={handleMarkerSelect}
                          height="h-[420px] lg:h-[520px]"
                        />
                      ) : (
                        <div className="h-[250px] bg-slate-100 dark:bg-slate-800/60 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center p-6 text-center text-xs text-slate-400 space-y-2">
                          <Compass className="w-8 h-8 opacity-40" />
                          <p className="font-bold">لا تتوفر إحداثيات موقعية دقيقة للفروع على الخريطة</p>
                          <p className="text-[11px] text-slate-400">يمكنك استعراض تفاصيل العناوين النصية في قائمة الفروع المجانبة.</p>
                        </div>
                      )}
                    </div>

                    {/* Branch List Cards Column */}
                    <div className="lg:col-span-6 xl:col-span-5 space-y-3 order-1 lg:order-2">
                      {business.places.map((place: PlaceSearchResult) => {
                        const isSelected = selectedBranchId === place.id;
                        const hasCoords = !!(place.location?.latitude || place.latitude);

                        return (
                          <div
                            key={place.id}
                            onClick={() => setSelectedBranchId(place.id)}
                            className={`bg-white dark:bg-slate-850 p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer space-y-3 shadow-sm ${
                              isSelected
                                ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/20 dark:bg-emerald-950/20'
                                : 'border-slate-200/80 dark:border-slate-800 hover:border-emerald-500/50'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                                    {place.nameAr}
                                  </h3>
                                  <StatusBadge status={place.verificationStatus} />
                                </div>
                                {place.nameEn && (
                                  <p className="text-xs font-mono text-slate-400 dir-ltr text-right">
                                    {place.nameEn}
                                  </p>
                                )}
                              </div>

                              <Link href={`/places/${place.id}`} onClick={(e) => e.stopPropagation()}>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-xs gap-1 rounded-xl px-2.5 py-1 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800"
                                >
                                  <span>تفاصيل المكان</span>
                                  <ChevronLeft className="w-3.5 h-3.5" />
                                </Button>
                              </Link>
                            </div>

                            {/* Address & District Info */}
                            {place.address && (
                              <div className="flex items-start gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                                <MapPin className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                                <span className="leading-relaxed">{place.address}</span>
                              </div>
                            )}

                            {/* Tags Bar (Category & District) */}
                            <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
                              {(place.category?.nameAr || place.categoryNameAr) && (
                                <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1">
                                  <span>{place.category?.icon || '🏷️'}</span>
                                  <span>{place.category?.nameAr || place.categoryNameAr}</span>
                                </span>
                              )}

                              {(place.district?.nameAr || place.districtNameAr) && (
                                <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1">
                                  <span>📍</span>
                                  <span>
                                    {place.district?.nameAr || place.districtNameAr}
                                    {place.district?.governorate?.nameAr
                                      ? ` - ${place.district.governorate.nameAr}`
                                      : ''}
                                  </span>
                                </span>
                              )}
                            </div>

                            {/* Contact information if present for this branch */}
                            {(place.phoneNumber || place.website) && (
                              <div className="pt-2 border-t border-slate-100 dark:border-slate-800/60 flex flex-wrap items-center gap-4 text-xs">
                                {place.phoneNumber && (
                                  <a
                                    href={`tel:${place.phoneNumber}`}
                                    onClick={(e) => e.stopPropagation()}
                                    className="flex items-center gap-1 text-slate-600 dark:text-slate-300 hover:text-emerald-600 font-mono dir-ltr text-[11px]"
                                  >
                                    <Phone className="w-3 h-3 text-emerald-600" />
                                    <span>{place.phoneNumber}</span>
                                  </a>
                                )}

                                {place.website && (
                                  <a
                                    href={place.website}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 hover:underline font-mono dir-ltr text-[11px] truncate max-w-[180px]"
                                  >
                                    <Globe className="w-3 h-3" />
                                    <span>{place.website}</span>
                                    <ExternalLink className="w-2.5 h-2.5" />
                                  </a>
                                )}
                              </div>
                            )}

                            {/* Map locate trigger indicator */}
                            {hasCoords && (
                              <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1 pt-1">
                                <Compass className="w-3 h-3" />
                                <span>انقر للتحديد على الخريطة التفاعلية</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </Container>
      </main>

      <Footer />
    </div>
  );
}
