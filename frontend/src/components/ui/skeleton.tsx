import React from 'react';
import { cn } from '@/lib/utils';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  shimmer?: boolean;
}

export function Skeleton({ className, shimmer = true, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        'rounded-xl bg-slate-200/80 dark:bg-slate-800/80',
        shimmer ? 'animate-pulse' : '',
        className
      )}
      {...props}
    />
  );
}
