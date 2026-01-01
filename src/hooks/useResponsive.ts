// Responsive Hook
// React hook for responsive design with dimension updates

import { useEffect, useState } from 'react';
import { Dimensions, ScaledSize } from 'react-native';
import { getDeviceType, isPortrait } from '../utils/responsive';

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

    return {
        width: dimensions.width,
        height: dimensions.height,
        isPortrait: isPortrait(),
        isLandscape: !isPortrait(),
        deviceType: getDeviceType(),
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
