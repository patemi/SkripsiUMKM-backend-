/**
 * Simple in-memory cache for API responses
 * TTL-based caching untuk statistik dan data yang jarang berubah
 */

class SimpleCache {
    constructor() {
        this.cache = new Map();
        this.timers = new Map();
    }

    /**
     * Set a value in cache with TTL
     * @param {string} key - Cache key
     * @param {any} value - Value to cache
     * @param {number} ttlMs - Time to live in milliseconds (default: 5 minutes)
     */
    set(key, value, ttlMs = 5 * 60 * 1000) {
        // Clear existing timer if any
        if (this.timers.has(key)) {
            clearTimeout(this.timers.get(key));
        }

        // Set the value
        this.cache.set(key, {
            value,
            timestamp: Date.now(),
            ttl: ttlMs
        });

        // Set expiration timer
        const timer = setTimeout(() => {
            this.cache.delete(key);
            this.timers.delete(key);
        }, ttlMs);

        this.timers.set(key, timer);
    }

    /**
     * Get a value from cache
     * @param {string} key - Cache key
     * @returns {any} - Cached value or null if not found/expired
     */
    get(key) {
        const item = this.cache.get(key);

        if (!item) {
            return null;
        }

        // Check if expired (extra safety)
        if (Date.now() - item.timestamp > item.ttl) {
            this.cache.delete(key);
            return null;
        }

        return item.value;
    }

    /**
     * Check if key exists in cache
     * @param {string} key - Cache key
     * @returns {boolean}
     */
    has(key) {
        return this.cache.has(key) && this.get(key) !== null;
    }

    /**
     * Delete a key from cache
     * @param {string} key - Cache key
     */
    delete(key) {
        if (this.timers.has(key)) {
            clearTimeout(this.timers.get(key));
            this.timers.delete(key);
        }
        this.cache.delete(key);
    }

    /**
     * Clear all cached data
     */
    clear() {
        this.timers.forEach(timer => clearTimeout(timer));
        this.timers.clear();
        this.cache.clear();
    }

    /**
     * Invalidate cache entries that match a pattern
     * @param {string} pattern - Key pattern (prefix)
     */
    invalidatePattern(pattern) {
        const keysToDelete = [];
        this.cache.forEach((_, key) => {
            if (key.startsWith(pattern)) {
                keysToDelete.push(key);
            }
        });
        keysToDelete.forEach(key => this.delete(key));
    }

    /**
     * Get cache stats
     * @returns {object}
     */
    getStats() {
        return {
            size: this.cache.size,
            keys: Array.from(this.cache.keys())
        };
    }
}

// Singleton instance
const cache = new SimpleCache();

// Cache keys constants
const CACHE_KEYS = {
    UMKM_STATS: 'umkm:stats',
    USER_STATS: 'user:stats',
    TOP_UMKM: 'umkm:top',
    GROWTH_DATA: 'growth:data'
};

// Cache TTLs (in milliseconds)
const CACHE_TTLS = {
    STATS: 5 * 60 * 1000,      // 5 minutes
    TOP_UMKM: 10 * 60 * 1000,  // 10 minutes
    GROWTH: 30 * 60 * 1000     // 30 minutes
};

module.exports = {
    cache,
    CACHE_KEYS,
    CACHE_TTLS
};
