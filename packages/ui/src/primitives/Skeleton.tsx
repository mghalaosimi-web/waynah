import React from 'react';
import { cn } from '../utils/cn.js';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circular' | 'rectangular';
}

export const Skeleton: React.FC<SkeletonProps> = ({ variant = 'text', className, ...props }) => {
  const variants: Record<'text' | 'circular' | 'rectangular', string> = {
    text: 'h-4 w-full rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
  };

  return (
    <div
      className={cn('animate-pulse bg-slate-200 dark:bg-slate-700/60', variants[variant], className)}
      {...props}
    />
  );
};
