import React from 'react';
import { Card } from '@waynah/ui';

export interface CategoryCardProps {
  id: string;
  nameAr: string;
  icon?: React.ReactNode;
  count?: number;
  onClick?: (id: string) => void;
}

export const CategoryCard: React.FC<CategoryCardProps> = ({
  id,
  nameAr,
  icon,
  count,
  onClick,
}) => {
  return (
    <Card
      variant="outline"
      className="cursor-pointer hover:border-primary-500 hover:bg-primary-50/50 dark:hover:bg-primary-950/20 transition-all flex items-center justify-between p-4"
      onClick={() => onClick && onClick(id)}
    >
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-slate-100 dark:bg-slate-800 text-primary-600 dark:text-primary-400 rounded-lg">
          {icon || (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          )}
        </div>
        <span className="font-bold text-sm text-slate-800 dark:text-slate-200">{nameAr}</span>
      </div>
      {count !== undefined && (
        <span className="text-xs font-semibold px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-full">
          {count}
        </span>
      )}
    </Card>
  );
};
