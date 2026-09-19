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
    default: 'bg-[#315b36] text-white border-transparent shadow-sm',
    primary: 'bg-[#315b36] text-white border-transparent shadow-sm',
    sage: 'bg-[#7ba27a] text-white border-transparent shadow-sm',
    secondary: 'bg-[#eff4ec] text-[#315b36] border-[#e2ebe2]',
    tint: 'bg-[#eff4ec] text-[#315b36] border-[#e2ebe2]',
    outline: 'bg-white text-[#2e3339] border-[#e2ebe2]',
    destructive: 'bg-red-50 text-red-700 border-red-200',
    success: 'bg-[#eff4ec] text-[#315b36] border-[#d5e4d4]',
    warning: 'bg-[#eff4ec] text-[#315b36] border-[#e2ebe2]',
    indigo: 'bg-[#eff4ec] text-[#315b36] border-[#e2ebe2]',
    info: 'bg-[#eff4ec] text-[#315b36] border-[#e2ebe2]',
  };

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-lg border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[#315b36] focus:ring-offset-2',
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
