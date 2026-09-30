'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, Badge, Button } from '@waynah/ui';
import { StatusBadge } from './StatusBadge';

export interface PlaceCardProps {
  id: string;
  nameAr: string;
  nameEn?: string | null;
  categoryNameAr?: string;
  districtNameAr?: string;
  address?: string | null;
  distanceMeters?: number;
  confidenceScore?: number;
  status?: string;
  onViewDetails?: (id: string) => void;
}

export const PlaceCard: React.FC<PlaceCardProps> = ({
  id,
  nameAr,
  nameEn,
  categoryNameAr = 'مكان محلي',
  districtNameAr = 'حي الرياض',
  address,
  distanceMeters,
  confidenceScore,
  status = 'AUTO_APPROVED',
  onViewDetails,
}) => {
  const formattedScore = confidenceScore ? Math.round(confidenceScore * 100) : null;

  const formatDistance = (meters?: number) => {
    if (meters === undefined || meters === null || meters === 0) return null;
    if (meters < 1000) {
      return `${Math.round(meters)} م`;
    }
    return `${(meters / 1000).toFixed(1)} كم`;
  };

  const distanceText = formatDistance(distanceMeters);

  return (
    <Card className="hover:border-primary-500/60 transition-all duration-200 group flex flex-col justify-between h-full bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md">
      <div>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex flex-col gap-0.5 min-w-0">
              <Link href={`/places/${id}`} className="group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                <CardTitle className="text-lg font-bold truncate leading-tight">{nameAr}</CardTitle>
              </Link>
              {nameEn && <span className="text-xs text-slate-400 font-mono dir-ltr text-right truncate">{nameEn}</span>}
            </div>

            {formattedScore !== null && (
              <Badge variant="gold" size="sm" className="shrink-0 font-mono">
                ثقة %{formattedScore}
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
          <div className="flex flex-wrap items-center gap-2">
            {categoryNameAr && (
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md">
                <svg className="w-3.5 h-3.5 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                <span className="font-semibold text-slate-700 dark:text-slate-300">{categoryNameAr}</span>
              </div>
            )}

            {districtNameAr && (
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md">
                <svg className="w-3.5 h-3.5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                </svg>
                <span>{districtNameAr}</span>
              </div>
            )}

            {distanceText && (
              <div className="flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 px-2.5 py-1 rounded-md font-bold">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                <span>{distanceText}</span>
              </div>
            )}
          </div>

          {address && (
            <p className="text-slate-500 dark:text-slate-400 text-xs line-clamp-2 pt-1 border-t border-slate-100 dark:border-slate-800">
              📍 {address}
            </p>
          )}
        </CardContent>
      </div>

      <CardFooter className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <StatusBadge status={status} />
        <Link href={`/places/${id}`}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onViewDetails && onViewDetails(id)}
            className="text-xs font-bold text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-950/40"
          >
            التفاصيل المكانية ←
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
};
