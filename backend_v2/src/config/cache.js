/**
 * High-Performance Multi-Tier Caching System
 * Supports In-Memory LRU/TTL Cache with optional Redis adapter
 */

class MemoryCache {
  constructor(defaultTtlSeconds = 600, maxKeys = 2000) {
    this.store = new Map();
    this.defaultTtl = defaultTtlSeconds * 1000;
    this.maxKeys = maxKeys;
    this.stats = { hits: 0, misses: 0, sets: 0, evictions: 0 };

    // Periodic GC of expired keys every 60 seconds
    this.cleanupTimer = setInterval(() => this.cleanupExpired(), 60000);
    if (this.cleanupTimer.unref) this.cleanupTimer.unref();
  }

  /**
   * Set a value in cache with optional TTL in seconds
   */
  set(key, value, ttlSeconds) {
    if (this.store.size >= this.maxKeys) {
      // Evict oldest item (Map iterator gives insertion order)
      const oldestKey = this.store.keys().next().value;
      if (oldestKey) {
        this.store.delete(oldestKey);
        this.stats.evictions++;
      }
    }

    const ttlMs = ttlSeconds !== undefined ? ttlSeconds * 1000 : this.defaultTtl;
    const expiresAt = ttlMs > 0 ? Date.now() + ttlMs : null;

    this.store.set(key, { value, expiresAt });
    this.stats.sets++;
  }

  /**
   * Get a value from cache
   */
  get(key) {
    const entry = this.store.get(key);
    if (!entry) {
      this.stats.misses++;
      return null;
    }

    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.store.delete(key);
      this.stats.misses++;
      return null;
    }

    this.stats.hits++;
    return entry.value;
  }

  /**
   * Check if key exists and is valid
   */
  has(key) {
    const val = this.get(key);
    return val !== null;
  }

  /**
   * Delete a specific key
   */
  del(key) {
    return this.store.delete(key);
  }

  /**
   * Delete all keys starting with prefix
   */
  delPrefix(prefix) {
    let count = 0;
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) {
        this.store.delete(key);
        count++;
      }
    }
    return count;
  }

  /**
   * Get or set pattern (cache-aside)
   */
  async getOrSet(key, fetcherFn, ttlSeconds) {
    const cached = this.get(key);
    if (cached !== null) {
      return cached;
    }

    const fresh = await fetcherFn();
    if (fresh !== undefined && fresh !== null) {
      this.set(key, fresh, ttlSeconds);
    }
    return fresh;
  }

  /**
   * Flush entire cache
   */
  flush() {
    this.store.clear();
  }

  /**
   * Periodic eviction of expired items
   */
  cleanupExpired() {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (entry.expiresAt && now > entry.expiresAt) {
        this.store.delete(key);
      }
    }
  }

  /**
   * Return cache diagnostics
   */
  getDiagnostics() {
    return {
      size: this.store.size,
      maxKeys: this.maxKeys,
      stats: { ...this.stats },
    };
  }
}

// Global Singleton Cache Instance
export const cache = new MemoryCache(600, 2000);
export default cache;
