import React from 'react';
import { cn } from '../utils/cn.js';
import { Button } from './Button.js';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
}) => {
  return (
    <div className={cn('flex flex-col items-center justify-center text-center p-8 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-900/30', className)}>
      {icon && <div className="mb-4 p-3 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500 dark:text-slate-400">{icon}</div>}
      <h4 className="text-base font-bold text-slate-800 dark:text-slate-200 mb-1">{title}</h4>
      {description && <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mb-4">{description}</p>}
      {actionLabel && onAction && (
        <Button variant="outline" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
