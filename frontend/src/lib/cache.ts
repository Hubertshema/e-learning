'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

const memoryCache = new Map<string, CacheEntry<any>>();

export const clientCache = {
  get<T>(key: string): T | null {
    // 1. Check memory cache
    const mem = memoryCache.get(key);
    if (mem) {
      if (Date.now() - mem.timestamp < mem.ttl) {
        return mem.data as T;
      }
      memoryCache.delete(key);
    }

    // 2. Check localStorage/sessionStorage fallback
    if (typeof window !== 'undefined') {
      try {
        const item = sessionStorage.getItem(`fe_cache_${key}`);
        if (item) {
          const parsed: CacheEntry<T> = JSON.parse(item);
          if (Date.now() - parsed.timestamp < parsed.ttl) {
            memoryCache.set(key, parsed);
            return parsed.data;
          }
          sessionStorage.removeItem(`fe_cache_${key}`);
        }
      } catch {
        // Ignore JSON/Storage errors
      }
    }
    return null;
  },

  set<T>(key: string, data: T, ttlMs = 120000): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttlMs,
    };
    memoryCache.set(key, entry);

    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem(`fe_cache_${key}`, JSON.stringify(entry));
      } catch {
        // Storage quota full or disabled
      }
    }
  },

  invalidate(keyOrPrefix: string): void {
    // Clear matching memory cache keys
    Array.from(memoryCache.keys()).forEach((key) => {
      if (key.startsWith(keyOrPrefix)) {
        memoryCache.delete(key);
      }
    });

    // Clear matching sessionStorage keys
    if (typeof window !== 'undefined') {
      try {
        const keysToRemove: string[] = [];
        for (let i = 0; i < sessionStorage.length; i++) {
          const k = sessionStorage.key(i);
          if (k && k.startsWith(`fe_cache_${keyOrPrefix}`)) {
            keysToRemove.push(k);
          }
        }
        keysToRemove.forEach((k) => sessionStorage.removeItem(k));
      } catch {
        // Ignore
      }
    }
  },
};

export interface UseCachedDataOptions<T> {
  ttl?: number;
  revalidateOnFocus?: boolean;
  initialData?: T;
  onSuccess?: (data: T) => void;
  onError?: (err: any) => void;
}

export function useCachedData<T>(
  key: string | null,
  fetcher: () => Promise<T>,
  options: UseCachedDataOptions<T> = {}
) {
  const { ttl = 120000, revalidateOnFocus = true, initialData } = options;

  const [data, setData] = useState<T | null>(() => {
    if (!key) return initialData ?? null;
    const cached = clientCache.get<T>(key);
    return cached !== null ? cached : (initialData ?? null);
  });

  const [loading, setLoading] = useState<boolean>(() => {
    if (!key) return false;
    const cached = clientCache.get<T>(key);
    return cached === null;
  });

  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const revalidate = useCallback(
    async (showLoading = false) => {
      if (!key) return;
      if (showLoading) setLoading(true);
      setIsValidating(true);
      setError(null);

      try {
        const result = await fetcherRef.current();
        if (result !== undefined) {
          setData(result);
          clientCache.set(key, result, ttl);
          options.onSuccess?.(result);
        }
      } catch (err: any) {
        setError(err instanceof Error ? err : new Error(String(err)));
        options.onError?.(err);
      } finally {
        setLoading(false);
        setIsValidating(false);
      }
    },
    [key, ttl]
  );

  useEffect(() => {
    if (!key) return;

    const cached = clientCache.get<T>(key);
    if (cached !== null) {
      setData(cached);
      setLoading(false);
      // Background revalidation (stale-while-revalidate)
      revalidate(false);
    } else {
      revalidate(true);
    }
  }, [key, revalidate]);

  // Revalidate on window focus
  useEffect(() => {
    if (!revalidateOnFocus || !key) return;

    const onFocus = () => {
      revalidate(false);
    };

    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [key, revalidateOnFocus, revalidate]);

  const mutate = useCallback(
    (newData: T | ((prev: T | null) => T | null), shouldRevalidate = true) => {
      setData((prev) => {
        const resolved = typeof newData === 'function' ? (newData as any)(prev) : newData;
        if (key && resolved !== null) {
          clientCache.set(key, resolved, ttl);
        }
        return resolved;
      });

      if (shouldRevalidate) {
        revalidate(false);
      }
    },
    [key, ttl, revalidate]
  );

  return {
    data,
    loading,
    isValidating,
    error,
    mutate,
    refresh: () => revalidate(true),
  };
}
