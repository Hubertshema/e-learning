'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string | null;
  alt?: string;
  fallback?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const AvatarContext = React.createContext<{
  hasImageLoaded: boolean;
  setHasImageLoaded: (loaded: boolean) => void;
  hasImageError: boolean;
  setHasImageError: (err: boolean) => void;
}>({
  hasImageLoaded: false,
  setHasImageLoaded: () => {},
  hasImageError: false,
  setHasImageError: () => {},
});

export function Avatar({ src, alt, fallback = 'U', size = 'md', className, children, ...props }: AvatarProps) {
  const [hasImageLoaded, setHasImageLoaded] = React.useState(false);
  const [hasImageError, setHasImageError] = React.useState(false);

  const sizeClasses = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-12 w-12 text-base',
    xl: 'h-16 w-16 text-xl font-bold',
  };

  if (children) {
    return (
      <AvatarContext.Provider
        value={{
          hasImageLoaded,
          setHasImageLoaded,
          hasImageError,
          setHasImageError,
        }}
      >
        <div
          className={cn(
            'relative flex shrink-0 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 items-center justify-center font-medium text-slate-700 dark:text-slate-300 select-none shadow-sm',
            sizeClasses[size],
            className
          )}
          {...props}
        >
          {children}
        </div>
      </AvatarContext.Provider>
    );
  }

  return (
    <AvatarContext.Provider
      value={{
        hasImageLoaded,
        setHasImageLoaded,
        hasImageError,
        setHasImageError,
      }}
    >
      <div
        className={cn(
          'relative flex shrink-0 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 items-center justify-center font-medium text-slate-700 dark:text-slate-300 select-none shadow-sm',
          size && !className?.includes('h-') && !className?.includes('w-') ? sizeClasses[size] : '',
          className
        )}
        {...props}
      >
        {src && !hasImageError ? (
          <img
            src={src}
            alt={alt || 'Avatar'}
            onError={() => setHasImageError(true)}
            onLoad={() => setHasImageLoaded(true)}
            className="aspect-square h-full w-full object-cover"
          />
        ) : (
          <span>{fallback.toUpperCase().slice(0, 2)}</span>
        )}
      </div>
    </AvatarContext.Provider>
  );
}

export interface AvatarImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src?: string;
  alt?: string;
}

export function AvatarImage({ src, alt = 'Avatar', className, onError, onLoad, ...props }: AvatarImageProps) {
  const { setHasImageLoaded, setHasImageError } = React.useContext(AvatarContext);
  const [localError, setLocalError] = React.useState(false);

  React.useEffect(() => {
    setLocalError(false);
    if (!src) {
      setHasImageError(true);
      setHasImageLoaded(false);
    }
  }, [src, setHasImageError, setHasImageLoaded]);

  if (!src || localError) {
    return null;
  }

  return (
    <img
      src={src}
      alt={alt}
      onError={(e) => {
        setLocalError(true);
        setHasImageError(true);
        onError?.(e);
      }}
      onLoad={(e) => {
        setHasImageLoaded(true);
        onLoad?.(e);
      }}
      className={cn('aspect-square h-full w-full object-cover', className)}
      {...props}
    />
  );
}

export interface AvatarFallbackProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
}

export function AvatarFallback({ children, className, ...props }: AvatarFallbackProps) {
  const { hasImageLoaded, hasImageError } = React.useContext(AvatarContext);

  if (hasImageLoaded && !hasImageError) {
    return null;
  }

  return (
    <div
      className={cn(
        'flex h-full w-full items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
