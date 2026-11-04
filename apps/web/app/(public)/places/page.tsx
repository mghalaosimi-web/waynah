'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Badge,
  Button,
  Container,
  EmptyState,
  ErrorState,
  PageHeader,
  Skeleton,
} from '@waynah/ui';
import { Header } from '../../../components/layout/Header';
import { Footer } from '../../../components/layout/Footer';
import { PlaceCard } from '../../../components/domain/PlaceCard';
import { SearchBar, type LocationCoords } from '../../../components/domain/SearchBar';
import { apiClient, type PlaceSearchResult } from '../../../lib/api/api-client';

const PAGE_SIZE = 48;
const DEFAULT_RADIUS_METERS = 5000;

export default function PlacesPage() {
  const [places, setPlaces] = useState<PlaceSearchResult[]>([]);
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState<LocationCoords | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPlaces = useCallback(
    async (searchQuery: string, coords: LocationCoords | null) => {
      setLoading(true);
      setError(null);

      try {
        const result = await apiClient.searchPlaces({
          query: searchQuery.trim() || undefined,
          lat: coords?.lat,
          lng: coords?.lng,
          radiusMeters: coords ? DEFAULT_RADIUS_METERS : undefined,
          limit: PAGE_SIZE,
          offset: 0,
        });

        if (result.success) {
          setPlaces(result.data);
        } else {
          setPlaces([]);
          setError(
            typeof result.error === 'string'
              ? result.error
              : result.error.message || 'تعذر تحميل دليل الأماكن حالياً.'
          );
        }
      } catch {
        setPlaces([]);
        setError('تعذر الاتصال بخدمة الأماكن. يرجى المحاولة مرة أخرى.');
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    void loadPlaces('', null);
  }, [loadPlaces]);

  const handleSearch = (nextQuery: string) => {
    setQuery(nextQuery);
    void loadPlaces(nextQuery, location);
  };

  const handleLocationChange = (coords: LocationCoords | null) => {
    setLocation(coords);
    void loadPlaces(query, coords);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 dark:bg-slate-900 dark:text-slate-100">
      <Header />

      <main className="flex-1">
        <Container size="xl" className="space-y-6 py-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <PageHeader
              title="دليل الأماكن في اليمن"
              subtitle="اكتشف الأماكن والخدمات المحلية من بيانات WAYNAH المسجلة."
              badge={
                !loading && !error ? (
                  <Badge variant="gold">{places.length} مكان</Badge>
                ) : undefined
              }
            />

            <Link href="/map" className="shrink-0">
              <Button variant="outline" className="w-full sm:w-auto">
                استكشف على الخريطة
              </Button>
            </Link>
          </div>

          <SearchBar
            onSearch={handleSearch}
            onLocationToggle={handleLocationChange}
            isLoading={loading}
            initialValue={query}
            activeLocation={location}
            placeholder="ابحث عن اسم مكان أو خدمة أو منطقة..."
            showSuggestions={false}
          />

          {location && (
            <div className="flex items-center justify-between gap-3 rounded-xl border border-primary-200 bg-primary-50 px-4 py-3 text-sm text-primary-800 dark:border-primary-900 dark:bg-primary-950/30 dark:text-primary-200">
              <span>يتم ترتيب النتائج ضمن نطاق 5 كم من موقعك المحدد.</span>
              <button
                type="button"
                onClick={() => handleLocationChange(null)}
                className="shrink-0 font-bold underline underline-offset-4"
              >
                إزالة الموقع
              </button>
            </div>
          )}

          {loading && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }, (_, index) => (
                <div
                  key={index}
                  className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
                >
                  <Skeleton variant="text" className="h-6 w-3/4" />
                  <Skeleton variant="text" className="h-4 w-1/2" />
                  <Skeleton variant="rectangular" className="h-16 rounded-lg" />
                </div>
              ))}
            </div>
          )}

          {!loading && error && (
            <ErrorState
              title="تعذر تحميل دليل الأماكن"
              message={error}
              onRetry={() => void loadPlaces(query, location)}
            />
          )}

          {!loading && !error && places.length > 0 && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {places.map((place) => (
                <PlaceCard
                  key={place.id}
                  id={place.id}
                  nameAr={place.nameAr}
                  nameEn={place.nameEn}
                  categoryNameAr={place.categoryNameAr || 'مكان محلي'}
                  districtNameAr={place.districtNameAr || place.governorateNameAr}
                  address={place.address}
                  distanceMeters={place.distance_meters}
                  confidenceScore={place.confidenceScore}
                  status={place.verificationStatus || 'UNVERIFIED'}
                />
              ))}
            </div>
          )}

          {!loading && !error && places.length === 0 && (
            <EmptyState
              title={query ? 'لم نعثر على نتائج مطابقة' : 'لا توجد أماكن منشورة حالياً'}
              description={
                query
                  ? 'جرّب كلمات بحث مختلفة أو أزل الموقع المحدد.'
                  : 'ستظهر هنا الأماكن التي تم تسجيلها وإتاحتها عبر منصة WAYNAH.'
              }
              action={
                query || location ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setQuery('');
                      setLocation(null);
                      void loadPlaces('', null);
                    }}
                  >
                    عرض جميع الأماكن
                  </Button>
                ) : undefined
              }
            />
          )}

          {!loading && !error && places.length === PAGE_SIZE && (
            <p className="text-center text-xs text-slate-500">
              يتم عرض أول {PAGE_SIZE} نتيجة. استخدم البحث لتضييق النتائج.
            </p>
          )}
        </Container>
      </main>

      <Footer />
    </div>
  );
}
