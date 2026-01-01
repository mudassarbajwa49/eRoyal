// Responsive Design Utilities
// Automatic scaling based on screen dimensions

import { Dimensions, Platform, ScaledSize } from 'react-native';

// Base dimensions (design reference)
const BASE_WIDTH = 375; // iPhone SE/8 width
const BASE_HEIGHT = 667;

/**
 * Get current screen dimensions
 */
export const getScreenDimensions = (): ScaledSize => {
    return Dimensions.get('window');
};

/**
 * Scale value based on screen width
 */
export const scaleWidth = (size: number): number => {
    const { width } = getScreenDimensions();
    return (width / BASE_WIDTH) * size;
};

/**
 * Scale value based on screen height
 */
export const scaleHeight = (size: number): number => {
    const { height } = getScreenDimensions();
    return (height / BASE_HEIGHT) * size;
};

/**
 * Scale font size with min/max bounds
 */
export const scaleFontSize = (size: number, minSize?: number, maxSize?: number): number => {
    const { width } = getScreenDimensions();
    const scale = width / BASE_WIDTH;
    let scaled = size * scale;

    if (minSize && scaled < minSize) {
        scaled = minSize;
    }
    if (maxSize && scaled > maxSize) {
        scaled = maxSize;
    }

    return Math.round(scaled);
};

/**
 * Moderate scale - less aggressive scaling for better consistency
 */
export const moderateScale = (size: number, factor: number = 0.5): number => {
    const { width } = getScreenDimensions();
    const scale = width / BASE_WIDTH;
    return size + (scale - 1) * factor * size;
};

/**
 * Get responsive spacing
 */
export const spacing = {
    xs: moderateScale(4),
    sm: moderateScale(8),
    md: moderateScale(12),
    lg: moderateScale(16),
    xl: moderateScale(24),
    '2xl': moderateScale(32),
    '3xl': moderateScale(40),
    '4xl': moderateScale(48),
    '5xl': moderateScale(64),
};

/**
 * Get responsive font sizes
 */
export const fontSize = {
    xs: scaleFontSize(12, 10, 14),
    sm: scaleFontSize(14, 12, 16),
    base: scaleFontSize(16, 14, 18),
    lg: scaleFontSize(18, 16, 20),
    xl: scaleFontSize(20, 18, 24),
    '2xl': scaleFontSize(24, 20, 28),
    '3xl': scaleFontSize(30, 24, 36),
    '4xl': scaleFontSize(36, 28, 44),
};

/**
 * Get device type
 */
export const getDeviceType = (): 'phone' | 'tablet' | 'desktop' => {
    const { width, height } = getScreenDimensions();
    const aspectRatio = height / width;

    if (Platform.OS === 'web') {
        if (width >= 1024) return 'desktop';
        if (width >= 768) return 'tablet';
        return 'phone';
    }

    // Mobile/tablet detection
    if (width >= 768) {
        return 'tablet';
    }
    return 'phone';
};

/**
 * Check if device is in portrait mode
 */
export const isPortrait = (): boolean => {
    const { width, height } = getScreenDimensions();
    return height >= width;
};

/**
 * Check if device is in landscape mode
 */
export const isLandscape = (): boolean => {
    return !isPortrait();
};

/**
 * Get responsive border radius
 */
export const borderRadius = {
    sm: moderateScale(4),
    md: moderateScale(8),
    lg: moderateScale(12),
    xl: moderateScale(16),
    '2xl': moderateScale(24),
    full: 9999,
};

/**
 * Get platform-specific values
 */
export const platformValue = <T,>(values: {
    ios?: T;
    android?: T;
    web?: T;
    default: T;
}): T => {
    if (Platform.OS === 'ios' && values.ios !== undefined) {
        return values.ios;
    }
    if (Platform.OS === 'android' && values.android !== undefined) {
        return values.android;
    }
    if (Platform.OS === 'web' && values.web !== undefined) {
        return values.web;
    }
    return values.default;
};

/**
 * Responsive layout helper
 */
export const layout = {
    /**
     * Get responsive container width
     */
    containerWidth: (maxWidth: number = 1200): number => {
        const { width } = getScreenDimensions();
        return Math.min(width - spacing.lg * 2, maxWidth);
    },

    /**
     * Get column count based on screen width
     */
    getColumns: (breakpoints: { phone: number; tablet: number; desktop: number }): number => {
        const deviceType = getDeviceType();
        return breakpoints[deviceType];
    },

    /**
     * Get grid gap
     */
    gridGap: (): number => {
        const deviceType = getDeviceType();
        if (deviceType === 'desktop') return spacing.xl;
        if (deviceType === 'tablet') return spacing.lg;
        return spacing.md;
    },
};
