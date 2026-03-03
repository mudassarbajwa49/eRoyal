// Common Components - Button
// Reusable button component with consistent styling

import React from 'react';
import { ActivityIndicator, StyleProp, StyleSheet, Text, TextStyle, TouchableOpacity, ViewStyle } from 'react-native';
import { BorderRadius, Colors, Spacing, Typography } from '../../../constants/designSystem';

interface ButtonProps {
    title: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary' | 'danger' | 'success';
    loading?: boolean;
    disabled?: boolean;
    fullWidth?: boolean;
    style?: StyleProp<ViewStyle>;
}

export const Button: React.FC<ButtonProps> = ({
    title,
    onPress,
    variant = 'primary',
    loading = false,
    disabled = false,
    fullWidth = false,
    style
}) => {
    const getButtonStyle = (): StyleProp<ViewStyle> => {
        const baseStyle = [
            styles.button,
            fullWidth && styles.fullWidth
        ];

        switch (variant) {
            case 'primary':
                return [...baseStyle, styles.primaryButton];
            case 'secondary':
                return [...baseStyle, styles.secondaryButton];
            case 'danger':
                return [...baseStyle, styles.dangerButton];
            case 'success':
                return [...baseStyle, styles.successButton];
            default:
                return [...baseStyle, styles.primaryButton];
        }
    };

    const getTextStyle = (): TextStyle => {
        switch (variant) {
            case 'secondary':
                return styles.secondaryText;
            default:
                return styles.buttonText;
        }
    };

    return (
        <TouchableOpacity
            style={[
                getButtonStyle(),
                (disabled || loading) && styles.disabledButton,
                style
            ]}
            onPress={onPress}
            disabled={disabled || loading}
            activeOpacity={0.7}
        >
            {loading ? (
                <ActivityIndicator color={variant === 'secondary' ? Colors.primary[600] : Colors.text.inverse} />
            ) : (
                <Text style={getTextStyle()}>{title}</Text>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.xl,
        borderRadius: BorderRadius.md,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 48,
    },
    fullWidth: {
        width: '100%',
    },
    primaryButton: {
        backgroundColor: Colors.primary[600],
    },
    secondaryButton: {
        backgroundColor: Colors.background.primary,
        borderWidth: 1,
        borderColor: Colors.primary[600],
    },
    dangerButton: {
        backgroundColor: Colors.error.main,
    },
    successButton: {
        backgroundColor: Colors.success.main,
    },
    disabledButton: {
        opacity: 0.5,
    },
    buttonText: {
        color: Colors.text.inverse,
        fontSize: Typography.fontSize.base,
        fontWeight: Typography.fontWeight.semibold,
    },
    secondaryText: {
        color: Colors.primary[600],
        fontSize: Typography.fontSize.base,
        fontWeight: Typography.fontWeight.semibold,
    },
});
