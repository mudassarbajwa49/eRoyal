// Bills Cache Service
// In-memory caching for improved performance


interface CacheEntry<T> {
    data: T;
    timestamp: number;
    expiresIn: number; // milliseconds
}

class BillsCacheService {
    private cache: Map<string, CacheEntry<any>> = new Map();
    private readonly DEFAULT_EXPIRY = 2 * 60 * 1000; // 2 minutes

    /**
     * Get cached data if valid, otherwise return null
     */
    get<T>(key: string): T | null {
        const entry = this.cache.get(key);

        if (!entry) {
            return null;
        }

        const now = Date.now();
        const isExpired = now - entry.timestamp > entry.expiresIn;

        if (isExpired) {
            this.cache.delete(key);
            return null;
        }

        return entry.data as T;
    }

    /**
     * Set cache data with optional custom expiry
     */
    set<T>(key: string, data: T, expiresIn: number = this.DEFAULT_EXPIRY): void {
        this.cache.set(key, {
            data,
            timestamp: Date.now(),
            expiresIn,
        });
    }

    /**
     * Invalidate specific cache key
     */
    invalidate(key: string): void {
        this.cache.delete(key);
    }

    /**
     * Invalidate all caches matching a pattern
     */
    invalidatePattern(pattern: RegExp): void {
        const keys = Array.from(this.cache.keys());
        keys.forEach(key => {
            if (pattern.test(key)) {
                this.cache.delete(key);
            }
        });
    }

    /**
     * Clear all cached data
     */
    clear(): void {
        this.cache.clear();
    }

    /**
     * Get cache statistics
     */
    getStats(): { size: number; keys: string[] } {
        return {
            size: this.cache.size,
            keys: Array.from(this.cache.keys()),
        };
    }

    /**
     * Invalidate all bills-related caches
     */
    invalidateAllBills(): void {
        this.invalidatePattern(/^bills:/);
    }

    /**
     * Invalidate resident-specific bills cache
     */
    invalidateResidentBills(residentId: string): void {
        this.invalidate(`bills:resident:${residentId}`);
    }

    /**
     * Invalidate admin bills cache
     */
    invalidateAdminBills(): void {
        this.invalidate('bills:admin:all');
    }
}

// Export singleton instance
export const billsCache = new BillsCacheService();
