import React from 'react';
import { cn } from '../utils/cn.js';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'outline' | 'flat';
}

export const Card: React.FC<CardProps> = ({ variant = 'default', className, children, ...props }) => {
  const variants = {
    default: 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 shadow-sm hover:shadow-md transition-shadow',
    outline: 'bg-transparent border border-slate-300 dark:border-slate-700',
    flat: 'bg-slate-100 dark:bg-slate-800/60 border-transparent',
  };

  return (
    <div className={cn('rounded-xl p-5 text-right', variants[variant], className)} {...props}>
      {children}
    </div>
  );
};

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, children, ...props }) => (
  <div className={cn('flex flex-col gap-1 mb-4 pb-3 border-b border-slate-100 dark:border-slate-700/50', className)} {...props}>
    {children}
  </div>
);

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({ className, children, ...props }) => (
  <h3 className={cn('text-lg font-bold text-slate-900 dark:text-slate-100', className)} {...props}>
    {children}
  </h3>
);

export const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({ className, children, ...props }) => (
  <p className={cn('text-xs text-slate-500 dark:text-slate-400', className)} {...props}>
    {children}
  </p>
);

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, children, ...props }) => (
  <div className={cn('flex flex-col gap-3', className)} {...props}>
    {children}
  </div>
);

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, children, ...props }) => (
  <div className={cn('mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/50 flex items-center justify-between', className)} {...props}>
    {children}
  </div>
);
