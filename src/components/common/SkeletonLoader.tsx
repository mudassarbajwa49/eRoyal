// SkeletonLoader Component
// Animated loading skeleton for better UX

import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, ViewStyle } from 'react-native';
import { BorderRadius, Colors, Spacing } from '../../../constants/designSystem';

interface SkeletonLoaderProps {
    variant?: 'card' | 'list' | 'text' | 'circle';
    count?: number;
    style?: ViewStyle;
}

export function SkeletonLoader({ variant = 'card', count = 1, style }: SkeletonLoaderProps) {
    const opacity = useRef(new Animated.Value(0.3)).current;

    useEffect(() => {
        const animation = Animated.loop(
            Animated.sequence([
                Animated.timing(opacity, {
                    toValue: 0.7,
                    duration: 800,
                    useNativeDriver: true,
                }),
                Animated.timing(opacity, {
                    toValue: 0.3,
                    duration: 800,
                    useNativeDriver: true,
                }),
            ])
        );
        animation.start();
        return () => animation.stop();
    }, [opacity]);

    const renderSkeleton = () => {
        switch (variant) {
            case 'card':
                return (
                    <Animated.View style={[styles.card, { opacity }, style]}>
                        <View style={styles.cardHeader} />
                        <View style={styles.cardLine} />
                        <View style={[styles.cardLine, { width: '60%' }]} />
                    </Animated.View>
                );
            case 'list':
                return (
                    <Animated.View style={[styles.listItem, { opacity }, style]}>
                        <View style={styles.circle} />
                        <View style={styles.listContent}>
                            <View style={styles.listLine} />
                            <View style={[styles.listLine, { width: '70%' }]} />
                        </View>
                    </Animated.View>
                );
            case 'text':
                return <Animated.View style={[styles.text, { opacity }, style]} />;
            case 'circle':
                return <Animated.View style={[styles.circle, { opacity }, style]} />;
            default:
                return null;
        }
    };

    return (
        <>
            {Array.from({ length: count }).map((_, index) => (
                <View key={index} style={index > 0 ? { marginTop: Spacing.md } : undefined}>
                    {renderSkeleton()}
                </View>
            ))}
        </>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: Colors.secondary[200],
        borderRadius: BorderRadius.lg,
        padding: Spacing.lg,
        marginBottom: Spacing.md,
    },
    cardHeader: {
        height: 20,
        backgroundColor: Colors.secondary[300],
        borderRadius: BorderRadius.sm,
        marginBottom: Spacing.md,
    },
    cardLine: {
        height: 14,
        backgroundColor: Colors.secondary[300],
        borderRadius: BorderRadius.sm,
        marginBottom: Spacing.sm,
    },
    listItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.lg,
        backgroundColor: Colors.background.primary,
        borderRadius: BorderRadius.lg,
    },
    circle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: Colors.secondary[200],
    },
    listContent: {
        flex: 1,
        marginLeft: Spacing.md,
    },
    listLine: {
        height: 12,
        backgroundColor: Colors.secondary[200],
        borderRadius: BorderRadius.sm,
        marginBottom: Spacing.xs,
    },
    text: {
        height: 14,
        backgroundColor: Colors.secondary[200],
        borderRadius: BorderRadius.sm,
    },
});
