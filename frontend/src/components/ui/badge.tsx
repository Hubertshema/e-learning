import * as React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'primary' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'indigo' | 'info';
  className?: string;
  children?: React.ReactNode;
  key?: React.Key;
}

function Badge({ className, variant = 'default', children, ...props }: BadgeProps) {
  const variants: Record<string, string> = {
    default: 'bg-primary-600 text-white shadow hover:bg-primary-700',
    primary: 'bg-primary-600 text-white shadow hover:bg-primary-700',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
    destructive: 'bg-destructive/10 text-destructive border border-destructive/20',
    outline: 'text-foreground border border-input',
    success: 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800',
    warning: 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-800',
    indigo: 'bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950 dark:text-indigo-400 dark:border-indigo-800',
    info: 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-800',
  };

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export { Badge };
