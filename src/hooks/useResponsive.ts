// Responsive Hook
// React hook for responsive design with dimension updates

import { useEffect, useState } from 'react';
import { Dimensions, Platform, ScaledSize } from 'react-native';

interface ResponsiveState {
    width: number;
    height: number;
    isPortrait: boolean;
    isLandscape: boolean;
    deviceType: 'phone' | 'tablet' | 'desktop';
}

/**
 * Hook for responsive design with real-time updates
 */
export const useResponsive = (): ResponsiveState => {
    const [dimensions, setDimensions] = useState<ScaledSize>(Dimensions.get('window'));

    useEffect(() => {
        const subscription = Dimensions.addEventListener('change', ({ window }) => {
            setDimensions(window);
        });

        return () => subscription?.remove();
    }, []);

    // Derive reactively from dimensions so web resize works correctly
    const portrait = dimensions.height >= dimensions.width;
    const deviceType: 'phone' | 'tablet' | 'desktop' = (() => {
        if (Platform.OS === 'web') {
            if (dimensions.width >= 1024) return 'desktop';
            if (dimensions.width >= 768) return 'tablet';
            return 'phone';
        }
        return dimensions.width >= 768 ? 'tablet' : 'phone';
    })();

    return {
        width: dimensions.width,
        height: dimensions.height,
        isPortrait: portrait,
        isLandscape: !portrait,
        deviceType,
    };
};

/**
 * Hook for media query-like breakpoints
 */
export const useBreakpoint = () => {
    const { width } = useResponsive();

    return {
        isXs: width < 480,
        isSm: width >= 480 && width < 768,
        isMd: width >= 768 && width < 1024,
        isLg: width >= 1024 && width < 1280,
        isXl: width >= 1280,
        // Helper functions
        mobile: width < 768,
        tablet: width >= 768 && width < 1024,
        desktop: width >= 1024,
    };
};
