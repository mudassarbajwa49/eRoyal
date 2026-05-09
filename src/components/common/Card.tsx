// Common Components - Card
// Reusable card container component

import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { BorderRadius, Colors, Shadows, Spacing } from '../../../constants/designSystem';

interface CardProps {
    children: React.ReactNode;
    style?: StyleProp<ViewStyle>;
}

export const Card: React.FC<CardProps> = ({ children, style }) => {
    return (
        <View style={[styles.card, style]}>
            {children}
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: Colors.background.surface,
        borderRadius: BorderRadius.xl,
        padding: Spacing.lg,
        marginBottom: Spacing.lg,
        ...Shadows.md,
        borderWidth: 1,
        borderColor: Colors.border.light,
    }
});
