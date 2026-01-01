/**
 * useList Hook
 * 
 * A simple hook to manage lists with filtering.
 * Eliminates duplicate filtering code across screens.
 * 
 * What it does:
 * - Manages filter state
 * - Automatically filters items when filter changes
 * - Uses memoization for performance
 * 
 * Usage:
 * ```typescript
 * const { 
 *     filter, 
 *     setFilter, 
 *     filteredItems 
 * } = useList(
 *     allBills,  // Your full list
 *     'all',     // Initial filter value
 *     (bill, filter) => {  // Filter function
 *         if (filter === 'all') return true;
 *         return bill.status === filter;
 *     }
 * );
 * ```
 */

import { useMemo, useState } from 'react';

/**
 * Hook to manage filtered lists
 * 
 * @param items - The full list of items
 * @param initialFilter - Initial filter value (e.g., 'all', 'active')
 * @param filterFunction - Function that returns true if item should be shown
 */
export function useList<T, F = string>(
    items: T[],
    initialFilter: F,
    filterFunction: (item: T, filter: F) => boolean
) {
    // Current filter value
    const [filter, setFilter] = useState<F>(initialFilter);

    /**
     * Filtered items - automatically recalculates when items or filter changes
     * Uses memoization to avoid unnecessary filtering
     */
    const filteredItems = useMemo(() => {
        return items.filter(item => filterFunction(item, filter));
    }, [items, filter, filterFunction]);

    return {
        filter,
        setFilter,
        filteredItems,
    };
}

/**
 * Simpler version for common case: filtering by status
 * 
 * Usage:
 * ```typescript
 * const { filter, setFilter, filteredItems } = useListByStatus(
 *     bills,
 *     'all',
 *     'status'  // Field name to filter by
 * );
 * ```
 */
export function useListByStatus<T>(
    items: T[],
    initialFilter: string = 'all',
    statusField: keyof T = 'status' as keyof T
) {
    return useList(
        items,
        initialFilter,
        (item, filter) => {
            if (filter === 'all') return true;
            return String(item[statusField]).toLowerCase() === filter.toLowerCase();
        }
    );
}

/**
 * Version for searching/filtering by text
 * 
 * Usage:
 * ```typescript
 * const { filter, setFilter, filteredItems } = useListBySearch(
 *     users,
 *     '',
 *     (user, search) => {
 *         return user.name.toLowerCase().includes(search.toLowerCase());
 *     }
 * );
 * ```
 */
export function useListBySearch<T>(
    items: T[],
    initialSearch: string = '',
    searchFunction: (item: T, search: string) => boolean
) {
    return useList(items, initialSearch, searchFunction);
}
