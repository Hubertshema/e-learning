'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number; // 0 to 100
  max?: number;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'sage' | 'subtle';
}

export function Progress({
  value = 0,
  max = 100,
  showLabel = false,
  size = 'md',
  variant = 'primary',
  className,
  ...props
}: ProgressProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  const sizeClasses = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  };

  const variantFills = {
    primary: 'bg-[#315b36]',
    sage: 'bg-[#7ba27a]',
    subtle: 'bg-[#558757]',
  };

  return (
    <div className={cn('w-full space-y-1.5', className)} {...props}>
      {showLabel && (
        <div className="flex items-center justify-between text-xs font-semibold text-[#2e3339]">
          <span>Progress</span>
          <span className="font-mono text-[#315b36]">{Math.round(percentage)}%</span>
        </div>
      )}
      <div
        className={cn(
          'w-full overflow-hidden rounded-full bg-[#eff4ec] border border-[#e2ebe2]',
          sizeClasses[size]
        )}
      >
        <div
          className={cn(
            'h-full transition-all duration-300 ease-out rounded-full',
            variantFills[variant]
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
