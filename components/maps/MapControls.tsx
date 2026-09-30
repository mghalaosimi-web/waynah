'use client';

import React from 'react';
import { Button } from '@waynah/ui';

export interface MapControlsProps {
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onCurrentLocation?: () => void;
  onFitBounds?: () => void;
  isLocating?: boolean;
  hasMarkers?: boolean;
  className?: string;
}

export const MapControls: React.FC<MapControlsProps> = ({
  onZoomIn,
  onZoomOut,
  onCurrentLocation,
  onFitBounds,
  isLocating = false,
  hasMarkers = false,
  className = '',
}) => {
  return (
    <div className={`flex flex-col gap-2 z-20 ${className}`}>
      {/* Zoom controls */}
      <div className="flex flex-col bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg overflow-hidden">
        <button
          type="button"
          onClick={onZoomIn}
          className="p-2.5 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors border-b border-slate-200 dark:border-slate-700"
          title="تكبير الخريطة"
          aria-label="تكبير"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </button>
        <button
          type="button"
          onClick={onZoomOut}
          className="p-2.5 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          title="تصغير الخريطة"
          aria-label="تصغير"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
          </svg>
        </button>
      </div>

      {/* Geolocation Button */}
      <button
        type="button"
        onClick={onCurrentLocation}
        disabled={isLocating}
        className="p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl shadow-lg transition-colors flex items-center justify-center disabled:opacity-50"
        title="تحديد موقعي الحالي"
        aria-label="موقعي الحالي"
      >
        <svg
          className={`w-5 h-5 ${isLocating ? 'animate-spin text-primary-500' : 'text-primary-600 dark:text-primary-400'}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>

      {/* Fit Bounds Button */}
      {hasMarkers && (
        <button
          type="button"
          onClick={onFitBounds}
          className="p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl shadow-lg transition-colors flex items-center justify-center"
          title="عرض جميع النتائج على الخريطة"
          aria-label="احتواء النتائج"
        >
          <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          </svg>
        </button>
      )}
    </div>
  );
};
