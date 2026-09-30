'use client';

import React from 'react';
import { PlaceCategory } from '../../lib/api/api-client';

export interface FilterState {
  radiusMeters: number;
  categoryId?: string;
}

export interface SearchFiltersProps {
  categories?: PlaceCategory[];
  selectedCategory?: string;
  radiusMeters?: number;
  hasLocation?: boolean;
  onCategoryChange?: (categoryId: string | undefined) => void;
  onRadiusChange?: (radiusMeters: number) => void;
  onResetFilters?: () => void;
}

const RADIUS_OPTIONS = [
  { label: '1 كم', value: 1000 },
  { label: '5 كم', value: 5000 },
  { label: '10 كم', value: 10000 },
  { label: '20 كم', value: 20000 },
];

export const SearchFilters: React.FC<SearchFiltersProps> = ({
  categories = [],
  selectedCategory,
  radiusMeters = 5000,
  hasLocation = false,
  onCategoryChange,
  onRadiusChange,
  onResetFilters,
}) => {
  return (
    <div className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-4 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          <span className="font-bold text-sm text-slate-800 dark:text-slate-200">تخصيص البحث والفلترة</span>
        </div>

        {(selectedCategory || radiusMeters !== 5000) && (
          <button
            type="button"
            onClick={onResetFilters}
            className="text-xs text-rose-600 dark:text-rose-400 hover:underline font-semibold"
          >
            إعادة ضبط الفلاتر
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
        {/* Category Filter */}
        <div className="space-y-1.5">
          <label htmlFor="category-select" className="font-semibold text-slate-600 dark:text-slate-300 block">
            التصنيف الأساسي
          </label>
          <select
            id="category-select"
            value={selectedCategory || ''}
            onChange={(e) => onCategoryChange && onCategoryChange(e.target.value || undefined)}
            className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">جميع التصنيفات</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.nameAr}
              </option>
            ))}
          </select>
        </div>

        {/* Distance Radius Filter (Active when location is enabled or for spatial scope) */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="font-semibold text-slate-600 dark:text-slate-300 block">
              نطاق المسافة {hasLocation && <span className="text-emerald-600 dark:text-emerald-400 font-bold">(مفعل جغرافياً)</span>}
            </label>
          </div>

          <div className="grid grid-cols-4 gap-1.5">
            {RADIUS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => onRadiusChange && onRadiusChange(opt.value)}
                className={`py-2 px-2 rounded-lg font-bold border text-center transition-all ${
                  radiusMeters === opt.value
                    ? 'bg-primary-500 text-white border-primary-600 shadow-sm'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
