/**
 * Unified Data Cache Service
 * 
 * This service provides centralized caching for all app data.
 * It helps make the app faster by storing data in memory instead of
 * constantly fetching from the database.
 * 
 * How it works:
 * 1. When you request data, it checks the cache first
 * 2. If data exists and isn't expired, return it instantly
 * 3. If not in cache, fetch from database and cache it
 * 4. When data changes, invalidate the cache so fresh data is fetched
 * 
 * Usage:
 * ```typescript
 * // Get data from cache
 * const users = dataCache.get<User[]>('users:all');
 * 
 * // Save data to cache (expires in 2 minutes by default)
 * dataCache.set('users:all', users);
 * 
 * // Clear cache when data changes
 * dataCache.invalidate('users:all');
 * ```
 */

interface CacheEntry<T> {
    data: T;
    timestamp: number;
    expiresIn: number; // milliseconds
}

class DataCacheService {
    private cache: Map<string, CacheEntry<any>> = new Map();

    // Default cache duration: 2 minutes
    // You can customize this when setting data
    private readonly DEFAULT_EXPIRY = 2 * 60 * 1000;

    /**
     * Get data from cache if it exists and hasn't expired
     * Returns null if data is not cached or has expired
     */
    get<T>(key: string): T | null {
        const entry = this.cache.get(key);

        // No cached data found
        if (!entry) {
            return null;
        }

        // Check if data has expired
        const now = Date.now();
        const isExpired = now - entry.timestamp > entry.expiresIn;

        if (isExpired) {
            // Remove expired data and return null
            this.cache.delete(key);
            return null;
        }

        // Return cached data
        return entry.data as T;
    }

    /**
     * Save data to cache with optional expiry time
     * 
     * @param key - Unique identifier for this data (e.g., 'users:all', 'bills:resident:123')
     * @param data - The data to cache
     * @param expiresIn - How long to keep data (milliseconds), defaults to 2 minutes
     */
    set<T>(key: string, data: T, expiresIn: number = this.DEFAULT_EXPIRY): void {
        this.cache.set(key, {
            data,
            timestamp: Date.now(),
            expiresIn,
        });
    }

    /**
     * Remove specific data from cache
     * Use this when data changes and you need fresh data on next request
     */
    invalidate(key: string): void {
        this.cache.delete(key);
    }

    /**
     * Remove multiple cache entries that match a pattern
     * Useful for clearing related data
     * 
     * Example: invalidatePattern(/^users:/) clears all user-related cache
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
     * Clear ALL cached data
     * Use sparingly - only when you need to completely reset cache
     */
    clear(): void {
        this.cache.clear();
    }

    /**
     * Get information about current cache state
     * Useful for debugging
     */
    getStats(): { size: number; keys: string[] } {
        return {
            size: this.cache.size,
            keys: Array.from(this.cache.keys()),
        };
    }

    // ========================================
    // Convenient methods for common data types
    // ========================================

    /**
     * Clear all bill-related cache
     * Call this after creating, updating, or deleting bills
     */
    invalidateAllBills(): void {
        this.invalidatePattern(/^bills:/);
    }

    /**
     * Clear cache for a specific resident's bills
     */
    invalidateResidentBills(residentId: string): void {
        this.invalidate(`bills:resident:${residentId}`);
    }

    /**
     * Clear all admin bills cache
     */
    invalidateAdminBills(): void {
        this.invalidate('bills:admin:all');
    }

    /**
     * Clear all user-related cache
     * Call this after creating, updating, or deleting users
     */
    invalidateAllUsers(): void {
        this.invalidatePattern(/^users:/);
    }

    /**
     * Clear all complaint-related cache
     * Call this after creating, updating, or deleting complaints
     */
    invalidateAllComplaints(): void {
        this.invalidatePattern(/^complaints:/);
    }

    /**
     * Clear all vehicle-related cache
     * Call this after creating, updating, or deleting vehicles
     */
    invalidateAllVehicles(): void {
        this.invalidatePattern(/^vehicles:/);
    }

    /**
     * Clear all announcement-related cache
     * Call this after creating, updating, or deleting announcements
     */
    invalidateAllAnnouncements(): void {
        this.invalidatePattern(/^announcements:/);
    }

    /**
     * Clear all marketplace listing cache
     * Call this after creating, updating, or deleting listings
     */
    invalidateAllListings(): void {
        this.invalidatePattern(/^listings:/);
    }
}

// Export a single instance to use throughout the app
// This ensures all parts of the app share the same cache
export const dataCache = new DataCacheService();

// Also export for backwards compatibility with existing code
export { dataCache as billsCache };
