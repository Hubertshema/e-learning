import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export interface CardGridSkeletonProps {
  count?: number;
  columns?: '2' | '3' | '4';
  className?: string;
}

export function CardGridSkeleton({ count = 6, columns = '3', className = '' }: CardGridSkeletonProps) {
  const colClass =
    columns === '2'
      ? 'grid-cols-1 md:grid-cols-2'
      : columns === '4'
      ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
      : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';

  return (
    <div className={`grid ${colClass} gap-6 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4 shadow-sm"
        >
          {/* Card Top Thumbnail/Header */}
          <Skeleton className="h-36 w-full rounded-xl bg-slate-200/80 dark:bg-slate-800" />

          {/* Card Meta & Title */}
          <div className="space-y-2 pt-1">
            <div className="flex justify-between items-center">
              <Skeleton className="h-4 w-20 bg-slate-200 dark:bg-slate-800" />
              <Skeleton className="h-4 w-12 bg-slate-200 dark:bg-slate-800" />
            </div>
            <Skeleton className="h-5 w-3/4 bg-slate-200 dark:bg-slate-800" />
            <Skeleton className="h-3.5 w-full bg-slate-100 dark:bg-slate-800/60" />
            <Skeleton className="h-3.5 w-2/3 bg-slate-100 dark:bg-slate-800/60" />
          </div>

          {/* Card Bottom Footer */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
            <Skeleton className="h-4 w-24 bg-slate-200 dark:bg-slate-800" />
            <Skeleton className="h-8 w-24 rounded-lg bg-slate-200 dark:bg-slate-800" />
          </div>
        </div>
      ))}
    </div>
  );
}
