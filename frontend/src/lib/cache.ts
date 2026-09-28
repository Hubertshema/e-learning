'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

const memoryCache = new Map<string, CacheEntry<any>>();
const inFlightRequests = new Map<string, Promise<any>>();
type CacheListener = (key: string, data: any) => void;
const cacheListeners = new Set<CacheListener>();

const STORAGE_PREFIX = 'lc_cache_';
const MAX_STALE_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days of stale data allowed for instant viewing

export const clientCache = {
  /**
   * Retrieves an item from memory or persistent storage.
   * If allowStale is true (default), returns the cached data immediately even if past TTL.
   */
  get<T>(key: string, allowStale = true): T | null {
    const now = Date.now();

    // 1. Check memory cache first (instant 0ms)
    const mem = memoryCache.get(key);
    if (mem) {
      const isFresh = now - mem.timestamp < mem.ttl;
      const isWithinMaxAge = now - mem.timestamp < MAX_STALE_AGE_MS;

      if (isFresh || (allowStale && isWithinMaxAge)) {
        return mem.data as T;
      }
      if (!isWithinMaxAge) {
        memoryCache.delete(key);
      }
    }

    // 2. Check localStorage / sessionStorage fallback
    if (typeof window !== 'undefined') {
      try {
        const item = localStorage.getItem(`${STORAGE_PREFIX}${key}`) || sessionStorage.getItem(`fe_cache_${key}`);
        if (item) {
          const parsed: CacheEntry<T> = JSON.parse(item);
          const isFresh = now - parsed.timestamp < parsed.ttl;
          const isWithinMaxAge = now - parsed.timestamp < MAX_STALE_AGE_MS;

          if (isFresh || (allowStale && isWithinMaxAge)) {
            memoryCache.set(key, parsed);
            return parsed.data;
          }
          if (!isWithinMaxAge) {
            localStorage.removeItem(`${STORAGE_PREFIX}${key}`);
            sessionStorage.removeItem(`fe_cache_${key}`);
          }
        }
      } catch {
        // Storage quota full or disabled
      }
    }

    return null;
  },

  /**
   * Checks if an item in cache is still strictly fresh.
   */
  isFresh(key: string): boolean {
    const mem = memoryCache.get(key);
    if (mem && Date.now() - mem.timestamp < mem.ttl) return true;
    return false;
  },

  /**
   * Saves data into memory and persistent storage, notifying active listeners.
   */
  set<T>(key: string, data: T, ttlMs = 180000): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttlMs,
    };
    memoryCache.set(key, entry);

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(entry));
      } catch {
        // LocalStorage quota might be full or private mode; fallback to memory
      }
    }

    // Notify active listeners of new data
    cacheListeners.forEach((listener) => {
      try {
        listener(key, data);
      } catch {}
    });
  },

  /**
   * Invalidates any matching key or prefix across memory and storage.
   */
  invalidate(keyOrPrefix: string): void {
    // Clear matching memory cache keys
    Array.from(memoryCache.keys()).forEach((key) => {
      if (key.startsWith(keyOrPrefix) || key.includes(keyOrPrefix)) {
        memoryCache.delete(key);
      }
    });

    // Clear matching localStorage & sessionStorage keys
    if (typeof window !== 'undefined') {
      try {
        const localKeysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && (k.startsWith(`${STORAGE_PREFIX}${keyOrPrefix}`) || k.includes(keyOrPrefix))) {
            localKeysToRemove.push(k);
          }
        }
        localKeysToRemove.forEach((k) => localStorage.removeItem(k));

        const sessionKeysToRemove: string[] = [];
        for (let i = 0; i < sessionStorage.length; i++) {
          const k = sessionStorage.key(i);
          if (k && (k.startsWith(`fe_cache_${keyOrPrefix}`) || k.includes(keyOrPrefix))) {
            sessionKeysToRemove.push(k);
          }
        }
        sessionKeysToRemove.forEach((k) => sessionStorage.removeItem(k));
      } catch {
        // Ignore
      }
    }

    // Notify listeners about invalidation (null data)
    cacheListeners.forEach((listener) => {
      try {
        listener(keyOrPrefix, null);
      } catch {}
    });
  },

  /**
   * Subscribe to cache updates for specific keys.
   */
  subscribe(listener: CacheListener): () => void {
    cacheListeners.add(listener);
    return () => cacheListeners.delete(listener);
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
  const { ttl = 180000, revalidateOnFocus = false, initialData } = options;

  // Stale-While-Revalidate: initialize data immediately if cached (allowStale = true)
  const [data, setData] = useState<T | null>(() => {
    if (!key) return initialData ?? null;
    const cached = clientCache.get<T>(key, true);
    return cached !== null ? cached : (initialData ?? null);
  });

  // Loading is ONLY true if we have NEVER seen this data (no cache at all)
  const [loading, setLoading] = useState<boolean>(() => {
    if (!key) return false;
    const cached = clientCache.get<T>(key, true);
    return cached === null && initialData === undefined;
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
        // Request deduplication for identical concurrent fetches
        let promise = inFlightRequests.get(key);
        if (!promise) {
          promise = fetcherRef.current().finally(() => {
            inFlightRequests.delete(key);
          });
          inFlightRequests.set(key, promise);
        }

        const result = await promise;
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

    // Check if we have cached data (even stale)
    const cached = clientCache.get<T>(key, true);
    if (cached !== null) {
      setData(cached);
      setLoading(false);
      // Run background revalidation silently without blocking user
      revalidate(false);
    } else {
      // First view ever: show loading skeleton while fetching
      revalidate(true);
    }
  }, [key, revalidate]);

  // Subscribe to external cache updates/invalidations
  useEffect(() => {
    if (!key) return;

    const unsubscribe = clientCache.subscribe((updatedKey, newData) => {
      if (updatedKey === key && newData !== null) {
        setData(newData);
        setLoading(false);
      } else if (key.startsWith(updatedKey) && newData === null) {
        // Key was invalidated, revalidate in background
        revalidate(false);
      }
    });

    return unsubscribe;
  }, [key, revalidate]);

  // Optional: revalidate on window focus
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

