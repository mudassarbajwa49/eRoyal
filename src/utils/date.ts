// Date formatting utilities
// Centralized date handling to avoid duplication

import { Timestamp } from 'firebase/firestore';

/**
 * Format a Firestore Timestamp or Date object to localized date string
 * @param timestamp - Firestore Timestamp, Date object, or null/undefined
 * @param fallback - String to return if timestamp is null/undefined
 * @returns Formatted date string or fallback
 */
export const formatTimestamp = (
    timestamp: Timestamp | Date | null | undefined,
    fallback = 'N/A'
): string => {
    if (!timestamp) return fallback;

    try {
        const date = timestamp instanceof Timestamp ? timestamp.toDate() : timestamp;
        return date.toLocaleDateString();
    } catch (error) {
        console.error('Error formatting timestamp:', error);
        return fallback;
    }
};

/**
 * Format timestamp to date and time
 */
export const formatTimestampWithTime = (
    timestamp: Timestamp | Date | null | undefined,
    fallback = 'N/A'
): string => {
    if (!timestamp) return fallback;

    try {
        const date = timestamp instanceof Timestamp ? timestamp.toDate() : timestamp;
        return date.toLocaleString();
    } catch (error) {
        console.error('Error formatting timestamp with time:', error);
        return fallback;
    }
};

/**
 * Format timestamp to relative time (e.g., "2 hours ago")
 */
export const formatRelativeTime = (
    timestamp: Timestamp | Date | null | undefined
): string => {
    if (!timestamp) return 'Unknown';

    try {
        const date = timestamp instanceof Timestamp ? timestamp.toDate() : timestamp;
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
        if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        if (diffDays < 30) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

        return date.toLocaleDateString();
    } catch (error) {
        console.error('Error formatting relative time:', error);
        return 'Unknown';
    }
};

/**
 * Get current month in YYYY-MM format
 */
export const getCurrentMonth = (): string => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
};

/**
 * Format month string (YYYY-MM) to readable format (e.g., "January 2026")
 */
export const formatMonthString = (monthString: string): string => {
    try {
        const [year, month] = monthString.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1, 1);
        return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    } catch (error) {
        return monthString;
    }
};
