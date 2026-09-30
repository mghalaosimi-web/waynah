'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Container,
  PageHeader,
  Button,
  Badge,
  Skeleton,
  EmptyState,
  ErrorState,
} from '@waynah/ui';
import { Header } from '../../../components/layout/Header';
import { Footer } from '../../../components/layout/Footer';
import { SearchBar, LocationCoords } from '../../../components/domain/SearchBar';
import { PlaceCard } from '../../../components/domain/PlaceCard';
import { SearchFilters } from '../../../components/filters/SearchFilters';
import { MapShell } from '../../../lib/maps/map-shell';
import { GeoPoint, MapMarkerData } from '../../../lib/maps/map-types';
import { apiClient, type PlaceSearchResult, type PlaceCategory } from '../../../lib/api/api-client';

function MapPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // URL parameters
  const initialQuery = searchParams.get('q') || searchParams.get('query') || '';
  const initialCategory = searchParams.get('categoryId') || undefined;
  const initialPlaceId = searchParams.get('placeId') || undefined;
  const latStr = searchParams.get('lat');
  const lngStr = searchParams.get('lng');

  const initialLat = latStr ? Number(latStr) : 24.7136;
  const initialLng = lngStr ? Number(lngStr) : 46.6753;

  // Search & Filter state
  const [query, setQuery] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(initialCategory);
  const [location, setLocation] = useState<LocationCoords | null>(
    latStr && lngStr ? { lat: initialLat, lng: initialLng } : null
  );
  const [radiusMeters, setRadiusMeters] = useState<number>(5000);
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(initialPlaceId || null);

  // View mode toggle on mobile (Map vs List)
  const [mobileView, setMobileView] = useState<'map' | 'list'>('map');
  const [showFilters, setShowFilters] = useState(false);

  // Data states
  const [places, setPlaces] = useState<PlaceSearchResult[]>([]);
  const [categories, setCategories] = useState<PlaceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load Categories on mount
  useEffect(() => {
    async function loadCategories() {
      const res = await apiClient.getCategories();
      if (res.success && res.data) {
        setCategories(res.data);
      }
    }
    loadCategories();
  }, []);

  // Fetch search places
  const performSearch = useCallback(
    async (
      searchQuery: string,
      catId?: string,
      coords?: LocationCoords | null,
      radius: number = radiusMeters
    ) => {
      setLoading(true);
      setError(null);

      const params: {
        query?: string;
        lat?: number;
        lng?: number;
        radiusMeters?: number;
        categoryId?: string;
        limit?: number;
      } = {
        limit: 30,
      };

      if (searchQuery.trim()) params.query = searchQuery.trim();
      if (catId) params.categoryId = catId;
      if (coords) {
        params.lat = coords.lat;
        params.lng = coords.lng;
        params.radiusMeters = radius;
      }

      const res = await apiClient.searchPlaces(params);
      setLoading(false);

      if (res.success && res.data) {
        setPlaces(res.data);
      } else {
        setError(res.error || 'تعذر جلب الأماكن الجغرافية من الـ API');
      }
    },
    [radiusMeters]
  );

  useEffect(() => {
    performSearch(initialQuery, initialCategory, location, radiusMeters);
  }, [initialQuery, initialCategory]);

  // Convert PlaceSearchResult array to MapMarkerData array
  const mapMarkers: MapMarkerData[] = places
    .filter((p) => p.latitude !== null && p.longitude !== null && p.latitude !== undefined && p.longitude !== undefined)
    .map((p) => ({
      id: p.id,
      latitude: p.latitude!,
      longitude: p.longitude!,
      nameAr: p.nameAr,
      nameEn: p.nameEn,
      categoryNameAr: p.categoryNameAr,
      districtNameAr: p.districtNameAr || p.governorateNameAr,
      address: p.address,
      confidenceScore: p.confidenceScore ?? (p.match_score ? Math.min(p.match_score, 1.0) : 0.85),
      verificationStatus: p.verificationStatus,
      distance_meters: p.distance_meters,
    }));

  // Handlers
  const handleSearchSubmit = (newQuery: string) => {
    setQuery(newQuery);
    const urlParams = new URLSearchParams();
    if (newQuery) urlParams.set('q', newQuery);
    if (selectedCategory) urlParams.set('categoryId', selectedCategory);

    router.push(`/map?${urlParams.toString()}`);
    performSearch(newQuery, selectedCategory, location, radiusMeters);
  };

  const handleCategoryChange = (catId?: string) => {
    setSelectedCategory(catId);
    const urlParams = new URLSearchParams();
    if (query) urlParams.set('q', query);
    if (catId) urlParams.set('categoryId', catId);

    router.push(`/map?${urlParams.toString()}`);
    performSearch(query, catId, location, radiusMeters);
  };

  const handleLocationToggle = (coords: LocationCoords | null) => {
    setLocation(coords);
    performSearch(query, selectedCategory, coords, radiusMeters);
  };

  const handleRadiusChange = (radius: number) => {
    setRadiusMeters(radius);
    performSearch(query, selectedCategory, location, radius);
  };

  const handlePlaceSelect = (placeId: string) => {
    setSelectedPlaceId(placeId);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100">
      <Header />

      <main className="flex-1 flex flex-col">
        <Container size="xl" className="py-6 space-y-4 flex-1 flex flex-col">
          {/* Header & Controls Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <PageHeader
              title="الخريطة المكانية التفاعلية"
              subtitle="استكشاف الأماكن والخدمات الجغرافية وتتبع المواقع بدقة عالية"
              badge={
                <Badge variant="gold" className="font-mono">
                  {mapMarkers.length} مكان محدد
                </Badge>
              }
              className="mb-0 pb-0 border-b-0"
            />

            {/* Mobile View Toggle */}
            <div className="flex md:hidden items-center justify-center p-1 bg-slate-200 dark:bg-slate-800 rounded-xl">
              <button
                type="button"
                onClick={() => setMobileView('map')}
                className={`flex-1 py-1.5 px-4 text-xs font-bold rounded-lg transition-colors ${
                  mobileView === 'map'
                    ? 'bg-white dark:bg-slate-900 text-primary-600 dark:text-primary-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                🗺️ الخريطة
              </button>
              <button
                type="button"
                onClick={() => setMobileView('list')}
                className={`flex-1 py-1.5 px-4 text-xs font-bold rounded-lg transition-colors ${
                  mobileView === 'list'
                    ? 'bg-white dark:bg-slate-900 text-primary-600 dark:text-primary-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                📋 القائمة ({places.length})
              </button>
            </div>
          </div>

          {/* SearchBar */}
          <SearchBar
            onSearch={handleSearchSubmit}
            onLocationToggle={handleLocationToggle}
            isLoading={loading}
            initialValue={query}
            activeLocation={location}
          />

          {/* Toggle Filter Button */}
          <div className="flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-1.5 font-bold text-primary-600 dark:text-primary-400 hover:underline"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 010 4m-6 8a2 2 0 100-4m0 4a2 2 0 010-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 010-4m0 4v2m0-6V4" />
              </svg>
              <span>{showFilters ? 'إخفاء خيارات الفلترة' : 'تخصيص الفلترة والنطاق'}</span>
            </button>
          </div>

          {/* Filters Drawer */}
          {showFilters && (
            <SearchFilters
              categories={categories}
              selectedCategory={selectedCategory}
              radiusMeters={radiusMeters}
              hasLocation={Boolean(location)}
              onCategoryChange={handleCategoryChange}
              onRadiusChange={handleRadiusChange}
              onResetFilters={() => handleCategoryChange(undefined)}
            />
          )}

          {/* Main Content Area: Split View Desktop / Responsive View Mobile */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-[500px] pt-2">
            {/* List Side Panel (Visible on Desktop OR when mobileView === 'list') */}
            <div className={`lg:col-span-1 space-y-4 overflow-y-auto max-h-[600px] pr-1 scrollbar-thin ${mobileView === 'map' ? 'hidden lg:block' : 'block'}`}>
              <div className="flex items-center justify-between text-xs font-bold text-slate-500 pb-1 border-b border-slate-200 dark:border-slate-800">
                <span>نتائج التصفح المكاني ({places.length})</span>
                {selectedPlaceId && (
                  <button
                    type="button"
                    onClick={() => setSelectedPlaceId(null)}
                    className="text-primary-600 hover:underline"
                  >
                    إلغاء التحديد
                  </button>
                )}
              </div>

              {loading && (
                <div className="space-y-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2 bg-white dark:bg-slate-900">
                      <Skeleton variant="text" className="h-5 w-3/4" />
                      <Skeleton variant="text" className="h-4 w-1/2" />
                    </div>
                  ))}
                </div>
              )}

              {!loading && error && (
                <ErrorState
                  title="خطأ في تحميل الأماكن"
                  message={error}
                  onRetry={() => performSearch(query, selectedCategory, location, radiusMeters)}
                />
              )}

              {!loading && !error && places.length > 0 && (
                <div className="space-y-3">
                  {places.map((place) => {
                    const isSelected = selectedPlaceId === place.id;
                    return (
                      <div
                        key={place.id}
                        onClick={() => handlePlaceSelect(place.id)}
                        className={`cursor-pointer transition-all ${
                          isSelected ? 'ring-2 ring-amber-500 rounded-2xl shadow-md' : ''
                        }`}
                      >
                        <PlaceCard
                          id={place.id}
                          nameAr={place.nameAr}
                          nameEn={place.nameEn}
                          categoryNameAr={place.categoryNameAr || 'مكان محلي'}
                          districtNameAr={place.districtNameAr || place.governorateNameAr || 'حي الرياض'}
                          address={place.address}
                          distanceMeters={place.distance_meters}
                          confidenceScore={place.confidenceScore ?? (place.match_score ? Math.min(place.match_score, 1.0) : 0.85)}
                          status={place.verificationStatus || 'AUTO_APPROVED'}
                          onViewDetails={() => handlePlaceSelect(place.id)}
                        />
                      </div>
                    );
                  })}
                </div>
              )}

              {!loading && !error && places.length === 0 && (
                <EmptyState
                  title="لا توجد أماكن مطابقة على الخريطة"
                  description="جرّب تغيير عبارة البحث أو توسيع نطاق الفلترة الجغرافية"
                />
              )}
            </div>

            {/* Map Container Viewport (Visible on Desktop OR when mobileView === 'map') */}
            <div className={`lg:col-span-2 relative ${mobileView === 'list' ? 'hidden lg:block' : 'block'}`}>
              <MapShell
                center={{ latitude: initialLat, longitude: initialLng }}
                zoom={12}
                markers={mapMarkers}
                selectedMarkerId={selectedPlaceId}
                onMarkerSelect={(m) => setSelectedPlaceId(m ? m.id : null)}
                onLocationFound={(coords) => setLocation({ lat: coords.latitude, lng: coords.longitude })}
                height="h-[550px] lg:h-[650px]"
              />
            </div>
          </div>
        </Container>
      </main>

      <Footer />
    </div>
  );
}

export default function MapPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs">جارٍ تحميل الخريطة المكانية...</div>}>
      <MapPageContent />
    </Suspense>
  );
}
