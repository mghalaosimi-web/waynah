import React from 'react';
import { cn } from '../utils/cn.js';
import { Button } from './Button.js';

export interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'حدث خطأ غير متوقع',
  message,
  onRetry,
  className,
}) => {
  return (
    <div className={cn('flex flex-col items-center justify-center text-center p-6 border border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20 rounded-xl', className)}>
      <div className="mb-3 p-2.5 bg-red-100 dark:bg-red-900/40 rounded-full text-red-600 dark:text-red-400">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <h4 className="text-sm font-bold text-red-900 dark:text-red-200 mb-1">{title}</h4>
      <p className="text-xs text-red-700 dark:text-red-300 max-w-sm mb-4">{message}</p>
      {onRetry && (
        <Button variant="danger" size="sm" onClick={onRetry}>
          إعادة المحاولة
        </Button>
      )}
    </div>
  );
};
