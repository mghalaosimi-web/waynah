'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Container,
  Section,
  Button,
  Badge,
  Skeleton,
  EmptyState,
  ErrorState,
} from '@waynah/ui';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import { SearchBar, LocationCoords } from '../components/domain/SearchBar';
import { PlaceCard } from '../components/domain/PlaceCard';
import { CategoryCard } from '../components/domain/CategoryCard';
import { SearchFilters } from '../components/filters/SearchFilters';
import { apiClient, type PlaceSearchResult, type PlaceCategory } from '../lib/api/api-client';

export default function PublicHomePage() {
  // State for search & filters
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState<LocationCoords | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);
  const [radiusMeters, setRadiusMeters] = useState<number>(5000);
  const [showFilters, setShowFilters] = useState(false);

  // Data states
  const [searchResults, setSearchResults] = useState<PlaceSearchResult[] | null>(null);
  const [categories, setCategories] = useState<PlaceCategory[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch Categories on mount
  useEffect(() => {
    async function loadCategories() {
      const res = await apiClient.getCategories();
      if (res.success && res.data) {
        setCategories(res.data);
      }
    }
    loadCategories();
  }, []);

  // Search function
  const executeSearch = useCallback(
    async (
      searchQuery: string,
      coords: LocationCoords | null = location,
      catId: string | undefined = selectedCategory,
      radius: number = radiusMeters
    ) => {
      setLoading(true);
      setError(null);
      setHasSearched(true);

      const params: {
        query?: string;
        lat?: number;
        lng?: number;
        radiusMeters?: number;
        categoryId?: string;
        limit?: number;
      } = {
        limit: 20,
      };

      if (searchQuery.trim()) {
        params.query = searchQuery.trim();
      }

      if (coords) {
        params.lat = coords.lat;
        params.lng = coords.lng;
        params.radiusMeters = radius;
      }

      if (catId) {
        params.categoryId = catId;
      }

      const res = await apiClient.searchPlaces(params);
      setLoading(false);

      if (res.success && res.data) {
        setSearchResults(res.data);
      } else {
        setError(res.error || 'تعذر جلب نتائج البحث، يرجى المحاولة لاحقاً.');
      }
    },
    [location, selectedCategory, radiusMeters]
  );

  // Perform initial search on mount (fetch latest / nearby places)
  useEffect(() => {
    executeSearch('', null, undefined, 5000);
  }, []);

  // Handlers
  const handleSearchSubmit = (newQuery: string) => {
    setQuery(newQuery);
    executeSearch(newQuery, location, selectedCategory, radiusMeters);
  };

  const handleLocationToggle = (coords: LocationCoords | null) => {
    setLocation(coords);
    executeSearch(query, coords, selectedCategory, radiusMeters);
  };

  const handleCategoryChange = (catId: string | undefined) => {
    setSelectedCategory(catId);
    executeSearch(query, location, catId, radiusMeters);
  };

  const handleRadiusChange = (radius: number) => {
    setRadiusMeters(radius);
    executeSearch(query, location, selectedCategory, radius);
  };

  const handleResetFilters = () => {
    setSelectedCategory(undefined);
    setRadiusMeters(5000);
    executeSearch(query, location, undefined, 5000);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100">
      {/* Public Navigation Header */}
      <Header />

      <main className="flex-1 space-y-10 pb-16">
        {/* Hero & Primary Search Section */}
        <section className="relative bg-gradient-to-b from-primary-500/10 via-primary-500/5 to-transparent pt-12 pb-10 border-b border-slate-200/60 dark:border-slate-800">
          <Container size="xl">
            <div className="max-w-3xl mx-auto text-center space-y-6">
              {/* Badge & Main Title */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary-100 dark:bg-primary-950/80 text-primary-700 dark:text-primary-300 text-xs font-bold border border-primary-200 dark:border-primary-800 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>المحرك المكاني الموثوق لـ "وينه؟"</span>
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
                تعرّف على مكان خدماتك الأقرب وبدقة عالية
              </h1>

              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
                ابحث عن المستشفيات، الصيدليات، المطاعم، المقاهي، والخدمات الحكومية والمحلية بحس جغرافي موثوق.
              </p>

              {/* Main Interactive SearchBar */}
              <div className="pt-2">
                <SearchBar
                  onSearch={handleSearchSubmit}
                  onLocationToggle={handleLocationToggle}
                  isLoading={loading}
                  initialValue={query}
                  activeLocation={location}
                />
              </div>

              {/* Toggle Filter & Actions bar */}
              <div className="flex items-center justify-between text-xs pt-2">
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

                {location && (
                  <span className="text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-100 dark:bg-emerald-950/60 px-2.5 py-1 rounded-md">
                    📍 التصفح مقترن بموقعك الجغرافي الحالي
                  </span>
                )}
              </div>

              {/* Search Filters Drawer / Collapsible */}
              {showFilters && (
                <div className="pt-2 text-right">
                  <SearchFilters
                    categories={categories}
                    selectedCategory={selectedCategory}
                    radiusMeters={radiusMeters}
                    hasLocation={Boolean(location)}
                    onCategoryChange={handleCategoryChange}
                    onRadiusChange={handleRadiusChange}
                    onResetFilters={handleResetFilters}
                  />
                </div>
              )}
            </div>
          </Container>
        </section>

        {/* Section: Search Results / Places Display */}
        <Container size="xl" className="space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                {query || selectedCategory ? 'نتائج البحث والاستكشاف' : 'أبرز الأماكن والخدمات المكتشفة'}
              </h2>
              {searchResults && searchResults.length > 0 && (
                <Badge variant="gold" size="sm" className="font-mono">
                  {searchResults.length} نتيجة
                </Badge>
              )}
            </div>

            <Link href="/map" className="text-xs font-bold text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1">
              <span>عرض الكل على الخريطة</span>
              <span>←</span>
            </Link>
          </div>

          {/* Loading Skeletons */}
          {loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3 bg-white dark:bg-slate-900">
                  <Skeleton variant="text" className="h-6 w-3/4" />
                  <Skeleton variant="text" className="h-4 w-1/2" />
                  <Skeleton variant="rectangular" className="h-16 rounded-lg" />
                </div>
              ))}
            </div>
          )}

          {/* Error State */}
          {!loading && error && (
            <ErrorState
              title="تعذر تنفيذ عملية البحث"
              message={error}
              onRetry={() => executeSearch(query, location, selectedCategory, radiusMeters)}
            />
          )}

          {/* Results Grid */}
          {!loading && !error && searchResults && searchResults.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {searchResults.map((place) => (
                <PlaceCard
                  key={place.id}
                  id={place.id}
                  nameAr={place.nameAr}
                  nameEn={place.nameEn}
                  categoryNameAr={place.categoryNameAr || 'مكان محلي'}
                  districtNameAr={place.districtNameAr || place.governorateNameAr || 'حي الرياض'}
                  address={place.address}
                  distanceMeters={place.distance_meters}
                  confidenceScore={place.confidenceScore ?? (place.match_score ? Math.min(place.match_score, 1.0) : 0.85)}
                  status={place.verificationStatus || 'AUTO_APPROVED'}
                />
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && searchResults && searchResults.length === 0 && (
            <EmptyState
              title="لم نجد أماكن مطابقة لبحثك"
              description="جرّب البحث بكلمات مختلفة (مثل: مستشفى، مطعم، مقهى) أو غيّر نطاق الفلترة الجغرافية."
              action={
                <Button variant="outline" size="sm" onClick={() => handleSearchSubmit('')}>
                  عرض الأماكن المتاحة
                </Button>
              }
            />
          )}
        </Container>

        {/* Section: Category Discovery */}
        <Container size="xl" className="space-y-6 pt-6">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                استكشف الأماكن حسب التصنيف
              </h2>
              <p className="text-xs text-slate-500">اختر التصنيف للانتقال السريع وتضييق نطاق الاستكشاف</p>
            </div>

            <Link href="/categories" className="text-xs font-bold text-primary-600 dark:text-primary-400 hover:underline">
              استعرض جميع التصنيفات ←
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {categories.length > 0 ? (
              categories.map((cat) => (
                <CategoryCard
                  key={cat.id}
                  id={cat.id}
                  nameAr={cat.nameAr}
                  onClick={(id) => handleCategoryChange(id)}
                />
              ))
            ) : (
              <>
                <CategoryCard id="cat-1" nameAr="مقاهي ومشروبات" onClick={() => handleSearchSubmit('مقهى')} />
                <CategoryCard id="cat-2" nameAr="مطاعم ومأكولات" onClick={() => handleSearchSubmit('مطعم')} />
                <CategoryCard id="cat-3" nameAr="صيدليات ورعاية صحية" onClick={() => handleSearchSubmit('صيدلية')} />
                <CategoryCard id="cat-4" nameAr="مستشفيات ومراكز طبية" onClick={() => handleSearchSubmit('مستشفى')} />
                <CategoryCard id="cat-5" nameAr="متاجر وتسوق" onClick={() => handleSearchSubmit('سوبرماركت')} />
                <CategoryCard id="cat-6" nameAr="مدارس وتعليم" onClick={() => handleSearchSubmit('مدرسة')} />
              </>
            )}
          </div>
        </Container>
      </main>

      {/* Public Footer */}
      <Footer />
    </div>
  );
}
