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
import { apiClient, type PlaceSearchResult, type PlaceCategory } from '../../../lib/api/api-client';

function SearchPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialQuery = searchParams.get('q') || searchParams.get('query') || '';
  const initialCategory = searchParams.get('categoryId') || undefined;

  const [query, setQuery] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(initialCategory);
  const [location, setLocation] = useState<LocationCoords | null>(null);
  const [radiusMeters, setRadiusMeters] = useState<number>(5000);

  const [searchResults, setSearchResults] = useState<PlaceSearchResult[] | null>(null);
  const [categories, setCategories] = useState<PlaceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadCategories() {
      const res = await apiClient.getCategories();
      if (res.success && res.data) {
        setCategories(res.data);
      }
    }
    loadCategories();
  }, []);

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
        setSearchResults(res.data);
      } else {
        setError(res.error || 'تعذر استرجاع نتائج البحث من الواجهة البرمجية');
      }
    },
    [radiusMeters]
  );

  useEffect(() => {
    performSearch(initialQuery, initialCategory, location, radiusMeters);
  }, [initialQuery, initialCategory]);

  const handleSearchSubmit = (newQuery: string) => {
    setQuery(newQuery);
    const urlParams = new URLSearchParams();
    if (newQuery) urlParams.set('q', newQuery);
    if (selectedCategory) urlParams.set('categoryId', selectedCategory);

    router.push(`/search?${urlParams.toString()}`);
    performSearch(newQuery, selectedCategory, location, radiusMeters);
  };

  const handleCategoryChange = (catId?: string) => {
    setSelectedCategory(catId);
    const urlParams = new URLSearchParams();
    if (query) urlParams.set('q', query);
    if (catId) urlParams.set('categoryId', catId);

    router.push(`/search?${urlParams.toString()}`);
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

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100">
      <Header />

      <main className="flex-1">
        <Container size="xl" className="py-8 space-y-6">
          <PageHeader
            title="محرك البحث المكاني"
            subtitle="نتائج البحث المباشرة من قاعدة بيانات وينه الاستكشافية"
            badge={
              searchResults ? (
                <Badge variant="gold" className="font-mono">
                  {searchResults.length} نتيجة
                </Badge>
              ) : undefined
            }
          />

          <SearchBar
            onSearch={handleSearchSubmit}
            onLocationToggle={handleLocationToggle}
            isLoading={loading}
            initialValue={query}
            activeLocation={location}
          />

          <SearchFilters
            categories={categories}
            selectedCategory={selectedCategory}
            radiusMeters={radiusMeters}
            hasLocation={Boolean(location)}
            onCategoryChange={handleCategoryChange}
            onRadiusChange={handleRadiusChange}
            onResetFilters={() => handleCategoryChange(undefined)}
          />

          {loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3 bg-white dark:bg-slate-900">
                  <Skeleton variant="text" className="h-6 w-3/4" />
                  <Skeleton variant="text" className="h-4 w-1/2" />
                  <Skeleton variant="rectangular" className="h-16 rounded-lg" />
                </div>
              ))}
            </div>
          )}

          {!loading && error && (
            <ErrorState
              title="خطأ في جلب النتائج"
              message={error}
              onRetry={() => performSearch(query, selectedCategory, location, radiusMeters)}
            />
          )}

          {!loading && !error && searchResults && searchResults.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
              {searchResults.map((place) => (
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
                  status={place.verificationStatus || 'AUTO_APPROVED'}
                />
              ))}
            </div>
          )}

          {!loading && !error && searchResults && searchResults.length === 0 && (
            <EmptyState
              title="لم يتم العثور على نتائج للبحث"
              description="حاول البحث عن اسم مكان آخر أو تغيير كلمات البحث والتصنيف"
              action={
                <Button variant="outline" size="sm" onClick={() => handleSearchSubmit('')}>
                  مسح كلمة البحث
                </Button>
              }
            />
          )}
        </Container>
      </main>

      <Footer />
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs">جارٍ تحميل صفحة البحث...</div>}>
      <SearchPageContent />
    </Suspense>
  );
}
