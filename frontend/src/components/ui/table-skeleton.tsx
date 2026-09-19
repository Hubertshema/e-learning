import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export interface TableSkeletonProps {
  rows?: number;
  columns?: number;
  className?: string;
}

export function TableSkeleton({ rows = 5, columns = 4, className = '' }: TableSkeletonProps) {
  return (
    <div className={`w-full overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 ${className}`}>
      {/* Table Header Skeleton */}
      <div className="flex items-center gap-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/80 p-4">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1 bg-slate-200 dark:bg-slate-800" />
        ))}
      </div>

      {/* Table Rows Skeleton */}
      <div className="divide-y divide-slate-100 dark:divide-slate-800 p-2">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="flex items-center gap-4 p-3.5">
            {Array.from({ length: columns }).map((_, c) => (
              <Skeleton
                key={c}
                className="h-4 flex-1 bg-slate-100 dark:bg-slate-800/60"
                style={{ width: `${70 + ((r + c) % 3) * 10}%` }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
