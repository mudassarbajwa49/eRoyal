/**
 * eRoyal Design System
 * Modern, premium design system for housing society app
 */

export const Colors = {
    // Primary Colors - Deep Teal (#0D9488)
    primary: {
        50: '#F0FDFA',
        100: '#CCFBF1',
        200: '#99F6E4',
        300: '#5EEAD4',
        400: '#2DD4BF',
        500: '#14B8A6',
        600: '#0D9488', // Main primary (Requested Teal)
        700: '#0F766E', // Deeper premium teal
        800: '#115E59',
        900: '#134E4A',
    },

    // Secondary Colors - Refined Greys
    secondary: {
        50: '#F8FAFC',
        100: '#F1F5F9',
        200: '#E2E8F0',
        300: '#CBD5E1',
        400: '#94A3B8',
        500: '#64748B',
        600: '#475569',
        700: '#334155',
        800: '#1E293B',
        900: '#0F172A',
    },

    // Semantic Colors (Softer for premium feel)
    success: {
        light: '#ECFDF5',
        main: '#10B981',
        dark: '#047857',
    },
    warning: {
        light: '#FFFBEB',
        main: '#F59E0B',
        dark: '#B45309',
    },
    error: {
        light: '#FEF2F2',
        main: '#EF4444',
        dark: '#B91C1C',
    },
    info: {
        light: '#EFF6FF',
        main: '#3B82F6',
        dark: '#1D4ED8',
    },

    // UI Colors
    background: {
        primary: '#FFFFFF', // Pure white for cards/surfaces
        secondary: '#F8FAFC', // Very soft blue-grey for main background
        tertiary: '#F1F5F9',
        surface: '#FFFFFF',
        surfaceVariant: '#F8FAFC',
    },

    text: {
        primary: '#0F172A', // Slate 900
        secondary: '#475569', // Slate 600
        tertiary: '#94A3B8', // Slate 400
        inverse: '#FFFFFF',
    },

    border: {
        light: '#F1F5F9',
        main: '#E2E8F0',
        dark: '#CBD5E1',
    },

    // Feature-specific colors
    bills: '#10B981',
    complaints: '#F59E0B',
    vehicles: '#8B5CF6',
    marketplace: '#6B7280',
    announcements: '#3B82F6',
};

export const Typography = {
    fontFamily: {
        heading: 'System', // Will use system font
        body: 'System',
    },

    fontSize: {
        xs: 12,
        sm: 14,
        base: 16,
        lg: 18,
        xl: 20,
        '2xl': 24,
        '3xl': 30,
        '4xl': 36,
    },

    fontWeight: {
        regular: '400' as const,
        medium: '500' as const,
        semibold: '600' as const,
        bold: '700' as const,
    },

    lineHeight: {
        tight: 1.25,
        normal: 1.5,
        relaxed: 1.75,
    },
};

export const Spacing = {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    '2xl': 32,
    '3xl': 40,
    '4xl': 48,
    '5xl': 64,
};

export const BorderRadius = {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    '2xl': 32,
    full: 9999,
};

export const Shadows = {
    sm: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 2,
        elevation: 1,
    },
    md: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
        elevation: 2,
    },
    lg: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.08,
        shadowRadius: 15,
        elevation: 4,
    },
    xl: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.1,
        shadowRadius: 25,
        elevation: 8,
    },
};

export const Gradients = {
    primary: ['#1E40AF', '#3B82F6'],
    success: ['#047857', '#10B981'],
    warning: ['#B45309', '#F59E0B'],
    error: ['#B91C1C', '#EF4444'],
};

// Helper function to get time-based greeting
export const getGreeting = (): string => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
};
