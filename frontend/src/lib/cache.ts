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

/**
 * Fast deep equality comparison between two arbitrary values.
 * Used by background sync to avoid triggering unnecessary component re-renders
 * when freshly fetched data is structurally identical to existing data.
 */
export function fastDeepEqual(a: any, b: any): boolean {
  if (a === b) return true;
  if (a === null || b === null || typeof a !== 'object' || typeof b !== 'object') {
    return false;
  }
  if (Array.isArray(a) !== Array.isArray(b)) return false;

  if (Array.isArray(a)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!fastDeepEqual(a[i], b[i])) return false;
    }
    return true;
  }

  if (a instanceof Date && b instanceof Date) {
    return a.getTime() === b.getTime();
  }

  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;

  for (let i = 0; i < keysA.length; i++) {
    const key = keysA[i];
    if (!Object.prototype.hasOwnProperty.call(b, key)) return false;
    if (!fastDeepEqual(a[key], b[key])) return false;
  }

  return true;
}

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
   * Updates timestamp of an item in cache without re-notifying listeners.
   */
  touch(key: string): void {
    const mem = memoryCache.get(key);
    if (mem) {
      mem.timestamp = Date.now();
    }
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
  ttl?: number;                     // Memory/Storage TTL (default: 180000ms = 3 mins)
  revalidateOnFocus?: boolean;      // Silent background sync when window focuses (default: true)
  revalidateOnVisibility?: boolean; // Silent background sync when tab becomes visible (default: true)
  revalidateOnReconnect?: boolean;  // Silent background sync when network comes back online (default: true)
  revalidateInterval?: number;      // Background auto-sync interval in ms (default: 30000ms, set 0 to disable)
  syncInterval?: number;            // Alias for revalidateInterval
  minStaleTime?: number;            // Minimum ms between automatic background fetches (default: 10000ms)
  initialData?: T;
  enabled?: boolean;                // If false, disables fetching/syncing
  compare?: (prev: T | null, next: T) => boolean; // Custom comparison function, defaults to fastDeepEqual
  onSuccess?: (data: T) => void;
  onError?: (err: any) => void;
}

export function useCachedData<T>(
  key: string | null,
  fetcher: () => Promise<T>,
  options: UseCachedDataOptions<T> = {}
) {
  const {
    ttl = 180000,
    revalidateOnFocus = true,
    revalidateOnVisibility = true,
    revalidateOnReconnect = true,
    revalidateInterval,
    syncInterval,
    minStaleTime = 10000,
    initialData,
    enabled = true,
    compare = fastDeepEqual,
  } = options;

  const actualInterval = syncInterval ?? revalidateInterval ?? 30000;

  // Stale-While-Revalidate: initialize data immediately if cached (allowStale = true)
  const [data, setData] = useState<T | null>(() => {
    if (!key) return initialData ?? null;
    const cached = clientCache.get<T>(key, true);
    return cached !== null ? cached : (initialData ?? null);
  });

  // Loading is ONLY true if we have NEVER seen this data (no memory or disk cache)
  const [loading, setLoading] = useState<boolean>(() => {
    if (!key || !enabled) return false;
    const cached = clientCache.get<T>(key, true);
    return cached === null && initialData === undefined;
  });

  // isValidating is true ONLY during manual user-initiated refresh()
  const [isValidating, setIsValidating] = useState(false);
  // isSyncing tracks silent background sync in flight (non-blocking)
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const currentDataRef = useRef<T | null>(data);
  currentDataRef.current = data;

  const optionsRef = useRef(options);
  optionsRef.current = options;

  const lastFetchTimeRef = useRef<number>(Date.now());
  const isSyncInProgressRef = useRef<boolean>(false);

  const performFetch = useCallback(
    async (config: { isManual?: boolean; showLoading?: boolean } = {}) => {
      const { isManual = false, showLoading = false } = config;

      if (!key || enabled === false) return;

      // Prevent duplicate or overlapping background synchronization requests
      if (isSyncInProgressRef.current) {
        return;
      }

      // Show initial loading spinner ONLY if explicitly requested AND there is no existing data
      if (showLoading && currentDataRef.current === null) {
        setLoading(true);
      }

      // Only set isValidating during manual user refresh (prevents flashing spinners in background)
      if (isManual) {
        setIsValidating(true);
      } else {
        setIsSyncing(true);
      }

      isSyncInProgressRef.current = true;

      try {
        // Request deduplication across identical concurrent fetches
        let promise = inFlightRequests.get(key);
        if (!promise) {
          promise = fetcherRef.current().finally(() => {
            inFlightRequests.delete(key);
          });
          inFlightRequests.set(key, promise);
        }

        const result = await promise;
        lastFetchTimeRef.current = Date.now();

        if (result !== undefined && result !== null) {
          // Compare new data with current data to prevent unnecessary re-renders
          const hasNotChanged = compare
            ? compare(currentDataRef.current, result)
            : fastDeepEqual(currentDataRef.current, result);

          if (!hasNotChanged) {
            // Data actually changed: update UI smoothly
            setData(result);
            currentDataRef.current = result;
            clientCache.set(key, result, ttl);
            optionsRef.current.onSuccess?.(result);
          } else {
            // Data is identical: keep UI state untouched, update cache freshness timestamp
            clientCache.touch(key);
          }

          // Clear any initial error since fetch succeeded
          setError(null);
        }
      } catch (err: any) {
        const errorObj = err instanceof Error ? err : new Error(String(err));

        // If we already have data, handle network errors silently!
        // Do NOT overwrite current data or crash the UI into an error screen.
        if (currentDataRef.current === null) {
          // Only show error state if there is completely no data to display
          setError(errorObj);
        } else {
          // Silent fallback: keep displaying last successfully loaded data
          if (process.env.NODE_ENV === 'development') {
            console.debug(`[BackgroundSync] Silent sync failed for ${key}, retaining cached data:`, errorObj.message);
          }
        }
        optionsRef.current.onError?.(err);
      } finally {
        isSyncInProgressRef.current = false;
        setLoading(false);
        if (isManual) {
          setIsValidating(false);
        } else {
          setIsSyncing(false);
        }
      }
    },
    [key, enabled, ttl, compare]
  );

  // Initial fetch on mount or key change
  useEffect(() => {
    if (!key || !enabled) return;

    const cached = clientCache.get<T>(key, true);
    if (cached !== null) {
      // Cached data available: set immediately and trigger silent background sync
      setData(cached);
      currentDataRef.current = cached;
      setLoading(false);
      performFetch({ showLoading: false, isManual: false });
    } else {
      // First view ever: show loading skeleton while fetching
      performFetch({ showLoading: true, isManual: false });
    }
  }, [key, enabled, performFetch]);

  // Subscribe to external cache updates/invalidations
  useEffect(() => {
    if (!key) return;

    const unsubscribe = clientCache.subscribe((updatedKey, newData) => {
      if (updatedKey === key && newData !== null) {
        if (!fastDeepEqual(currentDataRef.current, newData)) {
          setData(newData);
          currentDataRef.current = newData;
        }
        setLoading(false);
      } else if (key.startsWith(updatedKey) && newData === null) {
        // Key was invalidated, revalidate in background silently
        performFetch({ showLoading: false, isManual: false });
      }
    });

    return unsubscribe;
  }, [key, performFetch]);

  // Background periodic auto-synchronization
  useEffect(() => {
    if (!actualInterval || actualInterval <= 0 || !key || !enabled) return;

    const intervalId = setInterval(() => {
      // Avoid syncing when tab is in background
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
        return;
      }
      // Avoid syncing when browser is offline
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        return;
      }
      performFetch({ showLoading: false, isManual: false });
    }, actualInterval);

    return () => clearInterval(intervalId);
  }, [key, enabled, actualInterval, performFetch]);

  // Revalidate on window focus
  useEffect(() => {
    if (!revalidateOnFocus || !key || !enabled) return;

    const onFocus = () => {
      if (Date.now() - lastFetchTimeRef.current >= minStaleTime) {
        performFetch({ showLoading: false, isManual: false });
      }
    };

    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [key, enabled, revalidateOnFocus, minStaleTime, performFetch]);

  // Revalidate on tab visibility change
  useEffect(() => {
    if (!revalidateOnVisibility || !key || !enabled) return;

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible' && Date.now() - lastFetchTimeRef.current >= minStaleTime) {
        performFetch({ showLoading: false, isManual: false });
      }
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, [key, enabled, revalidateOnVisibility, minStaleTime, performFetch]);

  // Revalidate on network reconnect
  useEffect(() => {
    if (!revalidateOnReconnect || !key || !enabled) return;

    const onOnline = () => {
      performFetch({ showLoading: false, isManual: false });
    };

    window.addEventListener('online', onOnline);
    return () => window.removeEventListener('online', onOnline);
  }, [key, enabled, revalidateOnReconnect, performFetch]);

  const mutate = useCallback(
    (newData: T | ((prev: T | null) => T | null), shouldRevalidate = false) => {
      setData((prev) => {
        const resolved = typeof newData === 'function' ? (newData as any)(prev) : newData;
        if (key && resolved !== null) {
          clientCache.set(key, resolved, ttl);
        }
        currentDataRef.current = resolved;
        return resolved;
      });

      if (shouldRevalidate) {
        performFetch({ showLoading: false, isManual: false });
      }
    },
    [key, ttl, performFetch]
  );

  return {
    data,
    loading,
    isValidating,
    isSyncing,
    error,
    mutate,
    refresh: () => performFetch({ isManual: true, showLoading: false }),
    revalidate: (showLoading = false) => performFetch({ isManual: false, showLoading }),
  };
}

/**
 * Dedicated semantic alias for background auto-synchronization.
 */
export const useBackgroundSync = useCachedData;
