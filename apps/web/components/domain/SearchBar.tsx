'use client';

import React, { useState, useEffect } from 'react';
import { Button, Input } from '@waynah/ui';

export interface LocationCoords {
  lat: number;
  lng: number;
}

export interface SearchBarProps {
  onSearch?: (query: string) => void;
  onLocationToggle?: (coords: LocationCoords | null) => void;
  isLoading?: boolean;
  placeholder?: string;
  initialValue?: string;
  showSuggestions?: boolean;
  activeLocation?: LocationCoords | null;
}

const DEFAULT_SUGGESTIONS = [
  'مستشفى',
  'صيدلية',
  'مطعم',
  'مختبر',
  'محل جوالات',
  'مدرسة',
  'مقهى',
  'سوبرماركت',
];

export const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  onLocationToggle,
  isLoading = false,
  placeholder = 'ماذا تبحث؟ (مثال: صيدلية، مطعم، حي العليا...)',
  initialValue = '',
  showSuggestions = true,
  activeLocation = null,
}) => {
  const [query, setQuery] = useState(initialValue);
  const [locLoading, setLocLoading] = useState(false);
  const [locError, setLocError] = useState<string | null>(null);

  useEffect(() => {
    setQuery(initialValue);
  }, [initialValue]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(query.trim());
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    if (onSearch) {
      onSearch(suggestion);
    }
  };

  const handleClear = () => {
    setQuery('');
    if (onSearch) {
      onSearch('');
    }
  };

  const handleToggleLocation = () => {
    if (activeLocation) {
      // Clear location
      if (onLocationToggle) onLocationToggle(null);
      return;
    }

    if (!navigator.geolocation) {
      setLocError('متصفحك لا يدعم تحديد الموقع الجغرافي');
      return;
    }

    setLocLoading(true);
    setLocError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocLoading(false);
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        if (onLocationToggle) {
          onLocationToggle(coords);
        }
      },
      (error) => {
        setLocLoading(false);
        if (error.code === error.PERMISSION_DENIED) {
          setLocError('تم رفض إذن الوصول للموقع الجغرافي');
        } else {
          setLocError('تعذر تحديد موقعك الحالي');
        }
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  return (
    <div className="w-full space-y-3">
      <form onSubmit={handleSubmit} className="w-full flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center">
        <div className="relative flex-1 w-full">
          <Input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            className="text-base py-3.5 pr-11 pl-10 w-full rounded-xl border-slate-300 dark:border-slate-700 shadow-sm focus:ring-2 focus:ring-primary-500"
            leftIcon={
              <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            }
          />
          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute left-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              aria-label="مسح البحث"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        <div className="flex gap-2 shrink-0">
          {/* Location button */}
          <Button
            type="button"
            variant={activeLocation ? 'primary' : 'outline'}
            size="lg"
            onClick={handleToggleLocation}
            isLoading={locLoading}
            className="px-3 shrink-0 rounded-xl"
            title={activeLocation ? 'تم تفعيل الموقع الجغرافي' : 'استخدم موقعي الحالي'}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="hidden md:inline text-xs font-semibold mr-1">
              {activeLocation ? 'موقعي مفعّل' : 'موقعي'}
            </span>
          </Button>

          {/* Submit Search button */}
          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isLoading}
            className="flex-1 sm:flex-initial px-6 shrink-0 rounded-xl font-bold"
          >
            بحث
          </Button>
        </div>
      </form>

      {locError && (
        <p className="text-xs text-rose-500 font-semibold px-1">{locError}</p>
      )}

      {/* Quick Discovery Suggestions */}
      {showSuggestions && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs text-slate-500">
          <span className="shrink-0 font-semibold text-slate-400">اقتراحات سريعة:</span>
          <div className="flex items-center gap-1.5 flex-wrap sm:flex-nowrap">
            {DEFAULT_SUGGESTIONS.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => handleSuggestionClick(item)}
                className={`px-3 py-1 rounded-full border text-xs transition-colors shrink-0 ${
                  query === item
                    ? 'bg-primary-50 dark:bg-primary-950/50 border-primary-400 text-primary-600 dark:text-primary-300 font-bold'
                    : 'bg-slate-100 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
