import * as React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link' | 'gradient' | 'sage';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', isLoading, children, disabled, ...props }, ref) => {
    const baseStyles =
      'inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#315b36] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]';

    const variants = {
      default: 'bg-[#315b36] text-white shadow hover:bg-[#254629] active:bg-[#1b351e]',
      primary: 'bg-[#315b36] text-white shadow hover:bg-[#254629] active:bg-[#1b351e]',
      sage: 'bg-[#7ba27a] text-white shadow hover:bg-[#688e67] active:bg-[#577a56]',
      destructive: 'bg-red-600 text-white shadow-sm hover:bg-red-700',
      outline: 'border border-[#e2ebe2] bg-transparent text-current shadow-sm hover:bg-[#eff4ec] hover:text-[#315b36] hover:border-[#315b36]/40',
      secondary: 'bg-[#eff4ec] text-[#315b36] border border-[#e2ebe2] shadow-sm hover:bg-[#d5e4d4]',
      ghost: 'bg-transparent text-current hover:bg-[#eff4ec] hover:text-[#315b36]',
      link: 'text-[#315b36] underline-offset-4 hover:underline p-0 h-auto',
      gradient: 'bg-[#315b36] text-white shadow-md hover:bg-[#254629] active:bg-[#1b351e]',
    };

    const sizes = {
      default: 'h-11 px-5 py-2.5 text-sm sm:text-[15px] font-semibold',
      sm: 'h-9 rounded-xl px-3.5 text-xs sm:text-[13.5px] font-semibold',
      lg: 'h-13 rounded-xl px-7 text-base sm:text-[16.5px] font-bold',
      icon: 'h-11 w-11 p-0',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant] || variants.default, sizes[size], className)}
        {...props}
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <svg
              className="h-4 w-4 animate-spin text-current"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>Loading...</span>
          </span>
        ) : (
          children
        )}
      </button>
    );
  }
);
Button.displayName = 'Button';

export { Button };
