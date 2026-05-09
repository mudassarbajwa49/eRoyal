/**
 * Normalize a house/plot number by stripping all special characters
 * and converting to uppercase.
 *
 * Examples:
 *   "A-12"  → "A12"
 *   "B_12"  → "B12"
 *   "a.12"  → "A12"
 *   " C 5 " → "C5"
 *   "D,12"  → "D12"
 */
export const normalizeHouseNo = (raw: string): string => {
    if (!raw) return '';
    // Remove everything that is NOT a letter or digit, then uppercase
    return raw.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
};
