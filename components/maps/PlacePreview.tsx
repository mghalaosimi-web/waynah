'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, Badge, Button } from '@waynah/ui';
import { StatusBadge } from '../domain/StatusBadge';
import { MapMarkerData } from '../../lib/maps/map-types';

export interface PlacePreviewProps {
  place: MapMarkerData;
  onClose?: () => void;
  onViewDetails?: (id: string) => void;
  className?: string;
}

export const PlacePreview: React.FC<PlacePreviewProps> = ({
  place,
  onClose,
  onViewDetails,
  className = '',
}) => {
  const formattedScore = place.confidenceScore ? Math.round(place.confidenceScore * 100) : null;

  const formatDistance = (meters?: number) => {
    if (meters === undefined || meters === null || meters === 0) return null;
    if (meters < 1000) return `${Math.round(meters)} م`;
    return `${(meters / 1000).toFixed(1)} كم`;
  };

  const distanceText = formatDistance(place.distance_meters);

  return (
    <div className={`w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden ${className}`}>
      {/* Header bar with close button */}
      <div className="flex items-center justify-between px-4 pt-3 pb-1 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
          <svg className="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          </svg>
          <span>معاينة المكان المكاني</span>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="إغلاق المعاينة"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-0.5">
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white leading-snug">
              {place.nameAr}
            </h3>
            {place.nameEn && (
              <span className="text-xs text-slate-400 font-mono dir-ltr text-right block truncate">
                {place.nameEn}
              </span>
            )}
          </div>

          {formattedScore !== null && (
            <Badge variant="gold" size="sm" className="font-mono shrink-0">
              ثقة %{formattedScore}
            </Badge>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          {place.categoryNameAr && (
            <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-700 dark:text-slate-300 font-semibold">
              {place.categoryNameAr}
            </span>
          )}

          {place.districtNameAr && (
            <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-700 dark:text-slate-300">
              📍 {place.districtNameAr}
            </span>
          )}

          {distanceText && (
            <span className="bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded font-bold">
              {distanceText}
            </span>
          )}
        </div>

        {place.address && (
          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 pt-1 border-t border-slate-100 dark:border-slate-800">
            {place.address}
          </p>
        )}

        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
          <StatusBadge status={place.verificationStatus || 'AUTO_APPROVED'} />

          <Link href={`/places/${place.id}`}>
            <Button
              variant="primary"
              size="sm"
              onClick={() => onViewDetails && onViewDetails(place.id)}
              className="text-xs font-bold gap-1"
            >
              <span>التفاصيل الكاملة</span>
              <span>←</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
