'use client';

import React, { useEffect, useState } from 'react';
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
import { Bookmark, Loader2, Edit3, ShieldCheck, MapPin } from 'lucide-react';
import { Header } from '../../../../components/layout/Header';
import { Footer } from '../../../../components/layout/Footer';
import { StatusBadge } from '../../../../components/domain/StatusBadge';
import { TrustProvenanceCard } from '../../../../components/domain/TrustProvenanceCard';
import { CorrectionModal } from '../../../../components/domain/CorrectionModal';
import { BusinessOverviewCard } from '../../../../components/domain/BusinessOverviewCard';
import { UncertaintyNotice } from '../../../../components/domain/UncertaintyNotice';
import { apiClient, type PlaceSearchResult } from '../../../../lib/api/api-client';
import { useAuth } from '../../../../lib/auth/auth-context';

export default function PlaceDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const placeId = params?.id as string;
  const { isAuthenticated } = useAuth();

  const [place, setPlace] = useState<PlaceSearchResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [favLoading, setFavLoading] = useState(false);
  const [showCorrectionModal, setShowCorrectionModal] = useState(false);

  const fetchPlaceDetails = async () => {
    if (!placeId) return;
    setLoading(true);
    setError(null);

    const res = await apiClient.getPlaceById(placeId);
    setLoading(false);

    if (res.success && res.data) {
      setPlace(res.data);
    } else {
      setError(
        typeof res.error === 'string'
          ? res.error
          : res.error?.message || 'تعذر العثور على المكان المطلوب'
      );
    }
  };

  useEffect(() => {
    fetchPlaceDetails();
  }, [placeId]);

  useEffect(() => {
    if (isAuthenticated && placeId) {
      apiClient.getFavorites().then((res) => {
        if (res.success && res.data) {
          const found = res.data.some((f) => f.placeId === placeId);
          setIsSaved(found);
        }
      });
    }
  }, [isAuthenticated, placeId]);

  const handleToggleFavorite = async () => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    setFavLoading(true);
    if (isSaved) {
      const res = await apiClient.removeFavorite(placeId);
      if (res.success) setIsSaved(false);
    } else {
      const res = await apiClient.addFavorite(placeId);
      if (res.success) setIsSaved(true);
    }
    setFavLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100">
      <Header />

      <main className="flex-1">
        <Container size="lg" className="py-8 space-y-6">
          {/* Breadcrumb & Navigation Back */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.back()}
              className="gap-1.5 text-xs font-semibold"
            >
              ← العودة لنتائج البحث
            </Button>

            <div className="text-xs text-slate-500 flex items-center gap-1 font-mono dir-ltr">
              <span className="font-bold text-slate-700 dark:text-slate-300">ID: {placeId}</span>
            </div>
          </div>

          {loading && (
            <Card className="p-8 space-y-4">
              <Skeleton variant="text" className="h-8 w-2/3" />
              <Skeleton variant="text" className="h-4 w-1/3" />
              <Skeleton variant="rectangular" className="h-40 rounded-xl" />
            </Card>
          )}

          {!loading && error && (
            <ErrorState
              title="لم نتمكن من عرض المكان"
              message={error}
              onRetry={fetchPlaceDetails}
            />
          )}

          {!loading && place && (
            <div className="space-y-6">
              {/* Header Title Section */}
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white">
                        {place.nameAr}
                      </h1>
                      <StatusBadge status={place.verificationStatus} />
                    </div>
                    {place.nameEn && (
                      <p className="text-sm font-mono text-slate-500 dir-ltr text-right">
                        {place.nameEn}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Correction / Report Action Button (Screen 07 trigger) */}
                    <Button
                      variant="outline"
                      size="md"
                      onClick={() => setShowCorrectionModal(true)}
                      className="gap-2 font-bold rounded-xl text-xs text-slate-700 dark:text-slate-200"
                    >
                      <Edit3 className="w-4 h-4 text-amber-600" />
                      <span>إبلاغ عن خطأ / اقترح تعديلاً</span>
                    </Button>

                    <Button
                      variant={isSaved ? 'primary' : 'outline'}
                      size="md"
                      disabled={favLoading}
                      onClick={handleToggleFavorite}
                      className="gap-2 font-bold rounded-xl text-xs"
                    >
                      {favLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
                      )}
                      <span>
                        {!isAuthenticated
                          ? 'حفظ المكان'
                          : isSaved
                          ? 'محفوظ'
                          : 'حفظ للمفضلة'}
                      </span>
                    </Button>

                    {place.latitude && place.longitude && (
                      <Link href={`/map?lat=${place.latitude}&lng=${place.longitude}`}>
                        <Button variant="primary" size="md" className="gap-2 font-bold shadow-md shadow-primary-500/20 text-xs">
                          <MapPin className="w-4 h-4" />
                          <span>عرض على الخريطة</span>
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>

                {/* Spatial Metadata Bar */}
                <div className="flex flex-wrap items-center gap-3 text-xs border-t border-slate-100 dark:border-slate-700/60 pt-4">
                  {place.categoryNameAr && (
                    <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-700 px-3 py-1.5 rounded-lg text-slate-700 dark:text-slate-200 font-semibold">
                      <span>🏷️ التصنيف:</span>
                      <span className="font-bold">{place.categoryNameAr}</span>
                    </div>
                  )}

                  {place.districtNameAr && (
                    <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-700 px-3 py-1.5 rounded-lg text-slate-700 dark:text-slate-200 font-semibold">
                      <span>📍 الحي المكاني:</span>
                      <span className="font-bold">{place.districtNameAr}</span>
                    </div>
                  )}

                  {place.governorateNameAr && (
                    <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-700 px-3 py-1.5 rounded-lg text-slate-700 dark:text-slate-200 font-semibold">
                      <span>🏙️ المحافظة:</span>
                      <span className="font-bold">{place.governorateNameAr}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Uncertainty Warning Notice (Section 17 Edge State) */}
              {place.verificationStatus === 'COMMUNITY' && (
                <UncertaintyNotice
                  type="CONFLICTING_PHONE"
                  onAction={() => setShowCorrectionModal(true)}
                  actionText="ساهم بتأكيد الهاتف"
                />
              )}

              {place.verificationStatus === 'STALE' && (
                <UncertaintyNotice
                  type="STALE_DATA"
                  onAction={() => setShowCorrectionModal(true)}
                  actionText="تحديث بيانات المكان"
                />
              )}

              {/* Grid Layout for Place Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Location & Address */}
                <Card variant="default">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-primary-500" />
                      الموقع والعنوان المكاني
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    {place.address ? (
                      <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-semibold">
                        {place.address}
                      </p>
                    ) : (
                      <p className="text-xs text-slate-400 italic">لا يوجد عنوان نصي تفصيلي مسجل.</p>
                    )}

                    {place.latitude && place.longitude && (
                      <div className="p-3 bg-slate-100 dark:bg-slate-800/80 rounded-xl font-mono text-xs text-slate-600 dark:text-slate-300 space-y-1 dir-ltr text-right">
                        <div>Latitude: {place.latitude.toFixed(6)}</div>
                        <div>Longitude: {place.longitude.toFixed(6)}</div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Contact & Hours Details */}
                <Card variant="default">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-amber-500" />
                      معلومات التواصل وساعات العمل
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    {place.phoneNumber ? (
                      <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl">
                        <span className="text-xs text-slate-500">رقم التواصل:</span>
                        <a
                          href={`tel:${place.phoneNumber}`}
                          className="font-mono font-bold text-primary-600 dark:text-primary-400 hover:underline dir-ltr"
                        >
                          {place.phoneNumber}
                        </a>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic">رقم الهاتف غير متوفر حالياً.</p>
                    )}

                    {place.website ? (
                      <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl">
                        <span className="text-xs text-slate-500">الموقع الإلكتروني:</span>
                        <a
                          href={place.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono text-xs text-primary-600 dark:text-primary-400 hover:underline dir-ltr truncate max-w-[200px]"
                        >
                          {place.website}
                        </a>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic">الموقع الإلكتروني غير متوفر حالياً.</p>
                    )}

                    {place.description && (
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300">
                        <span className="font-bold block mb-1">الوصف المكاني والخدماتي:</span>
                        <p className="leading-relaxed">{place.description}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Screen 06 — Trust & Provenance Card */}
                <TrustProvenanceCard
                  status={place.verificationStatus}
                  sourceType="تثبت ميداني ومجتمعي"
                  lastConfirmedAt="قبل 5 أيام"
                  confidenceScore={place.confidenceScore}
                  isStale={place.verificationStatus === 'STALE'}
                />

                {/* Screen 05 — Business Entity Overview Card */}
                <BusinessOverviewCard
                  businessId="biz-1"
                  businessName="منشأة صيدليات السلام الوطنية"
                  verificationStatus="VERIFIED"
                />
              </div>
            </div>
          )}
        </Container>
      </main>

      {/* Screen 07 — Contribution / Correction Modal */}
      {place && (
        <CorrectionModal
          placeId={place.id}
          placeName={place.nameAr}
          isOpen={showCorrectionModal}
          onClose={() => setShowCorrectionModal(false)}
        />
      )}

      <Footer />
    </div>
  );
}
