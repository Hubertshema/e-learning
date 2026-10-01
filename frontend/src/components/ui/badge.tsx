import * as React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'primary' | 'sage' | 'secondary' | 'tint' | 'outline' | 'destructive' | 'success' | 'warning' | 'indigo' | 'info';
  className?: string;
  children?: React.ReactNode;
  key?: React.Key;
}

function Badge({ className, variant = 'default', children, ...props }: BadgeProps) {
  const variants: Record<string, string> = {
    default: 'bg-[#012970] text-white border-transparent shadow-sm',
    primary: 'bg-[#006EF3] text-white border-transparent shadow-sm',
    sage: 'bg-[#006EF3] text-white border-transparent shadow-sm',
    secondary: 'bg-[#F3F7FC] text-[#012970] border-[#E2E8F0]',
    tint: 'bg-[#F3F7FC] text-[#006EF3] border-[#E2E8F0]',
    outline: 'bg-white text-[#172033] border-[#E2E8F0]',
    destructive: 'bg-red-50 text-red-700 border-red-200',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-[#F5B400] border-amber-200',
    indigo: 'bg-[#F3F7FC] text-[#012970] border-[#E2E8F0]',
    info: 'bg-[#F3F7FC] text-[#006EF3] border-[#E2E8F0]',
  };

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-lg border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[#006EF3] focus:ring-offset-2',
        variants[variant] || variants.default,
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export { Badge };
