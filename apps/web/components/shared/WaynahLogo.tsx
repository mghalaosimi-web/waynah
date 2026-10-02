'use client';

import React from 'react';

export interface WaynahLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  showBadge?: boolean;
}

export const WaynahLogo: React.FC<WaynahLogoProps> = ({
  className = '',
  size = 'md',
  showLabel = true,
  showBadge = true,
}) => {
  const iconSizes = {
    sm: 'w-7 h-7',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
  };

  const textSizes = {
    sm: 'text-base',
    md: 'text-xl',
    lg: 'text-3xl',
  };

  return (
    <div className={`inline-flex items-center gap-2.5 group cursor-pointer ${className}`}>
      {/* 
        WAYNAH Fixed Brand Icon:
        Abstract 'و' path -> location node with question mark curve.
        Fixed styling across themes.
      */}
      <div
        className={`${iconSizes[size]} rounded-xl bg-slate-900 dark:bg-slate-100 text-slate-100 dark:text-slate-900 flex items-center justify-center shadow-md shadow-slate-900/10 group-hover:scale-105 transition-transform shrink-0`}
      >
        <svg
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-3/4 h-3/4 stroke-current"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* Loop of Arabic 'و' + Geographic Pin Path */}
          <path d="M 28 15 C 24 10, 16 12, 16 18 C 16 24, 25 24, 28 20 Z" fill="currentColor" fillOpacity="0.15" />
          <path d="M 28 15 C 24 10, 16 12, 16 18 C 16 24, 25 24, 28 20 C 31 16, 36 21, 32 28 C 28 35, 24 38, 24 42" />
          {/* Coordinate Node / Location Pin Point */}
          <circle cx="24" cy="42" r="2.5" fill="currentColor" />
          {/* Subtle Question Mark Dot Accent */}
          <circle cx="34" cy="14" r="2" fill="currentColor" />
        </svg>
      </div>

      {showLabel && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className={`font-extrabold tracking-tight text-slate-900 dark:text-white ${textSizes[size]}`}>
              وَيْنَه؟
            </span>
            {showBadge && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-primary-100 dark:bg-primary-950/80 text-primary-800 dark:text-primary-300 border border-primary-200 dark:border-primary-800">
                أطلس محلي
              </span>
            )}
          </div>
          <span className="text-[10px] text-slate-500 font-medium">الدليل المكاني الموثوق</span>
        </div>
      )}
    </div>
  );
};
