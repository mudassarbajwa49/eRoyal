/**
 * useDataFetch Hook
 * 
 * A simple hook to fetch and cache data with loading states.
 * This eliminates duplicate code across screens.
 * 
 * What it does:
 * - Fetches data when component loads
 * - Shows loading state while fetching
 * - Caches data for fast repeat loads
 * - Provides refresh function to get fresh data
 * 
 * Usage:
 * ```typescript
 * const { data, loading, error, refresh } = useDataFetch(
 *     () => getAllUsers(),  // Function to fetch data
 *     'users:all'          // Cache key
 * );
 * 
 * // data - The fetched data
 * // loading - true while fetching
 * // error - Error message if fetch failed
 * // refresh() - Call this to reload data
 * ```
 */

import { useCallback, useEffect, useState } from 'react';
import { dataCache } from '../services/DataCache';

interface UseDataFetchResult<T> {
    data: T | null;
    loading: boolean;
    error: string | null;
    refresh: () => Promise<void>;
}

/**
 * Hook to fetch and cache data
 * 
 * @param fetchFunction - Async function that fetches your data
 * @param cacheKey - Unique key for caching this data
 * @param options - Optional configuration
 */
export function useDataFetch<T>(
    fetchFunction: () => Promise<T>,
    cacheKey: string,
    options?: {
        // Skip initial fetch (useful if you only want manual refresh)
        skipInitialFetch?: boolean;
        // Custom cache expiry in milliseconds
        cacheExpiry?: number;
    }
): UseDataFetchResult<T> {
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState(!options?.skipInitialFetch);
    const [error, setError] = useState<string | null>(null);

    /**
     * Load data - checks cache first, then fetches if needed
     */
    const loadData = useCallback(async (forceRefresh: boolean = false) => {
        try {
            setLoading(true);
            setError(null);

            // Check cache first (unless forcing refresh)
            if (!forceRefresh) {
                const cached = dataCache.get<T>(cacheKey);
                if (cached) {
                    console.log(`✅ Using cached data for ${cacheKey}`);
                    setData(cached);
                    setLoading(false);
                    return;
                }
            }

            // Fetch fresh data
            console.log(`🔄 Fetching fresh data for ${cacheKey}`);
            const result = await fetchFunction();

            // Cache the result
            dataCache.set(cacheKey, result, options?.cacheExpiry);

            // Update state
            setData(result);
            setError(null);
        } catch (err) {
            console.error(`❌ Error fetching ${cacheKey}:`, err);
            setError(err instanceof Error ? err.message : 'Failed to load data');
            setData(null);
        } finally {
            setLoading(false);
        }
    }, [fetchFunction, cacheKey, options?.cacheExpiry]);

    /**
     * Refresh data - forces a fresh fetch, bypassing cache
     */
    const refresh = useCallback(async () => {
        await loadData(true);
    }, [loadData]);

    // Load data when component mounts
    useEffect(() => {
        if (!options?.skipInitialFetch) {
            loadData();
        }
    }, [loadData, options?.skipInitialFetch]);

    return {
        data,
        loading,
        error,
        refresh,
    };
}
