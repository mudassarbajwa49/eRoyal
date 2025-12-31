// Common Components - Button
// Reusable button component with consistent styling

import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TextStyle, TouchableOpacity, ViewStyle } from 'react-native';

interface ButtonProps {
    title: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary' | 'danger' | 'success';
    loading?: boolean;
    disabled?: boolean;
    fullWidth?: boolean;
    style?: ViewStyle;
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
    const getButtonStyle = (): ViewStyle => {
        const baseStyle = [
            styles.button,
            fullWidth && styles.fullWidth
        ];

        switch (variant) {
            case 'primary':
                return [...baseStyle, styles.primaryButton] as ViewStyle;
            case 'secondary':
                return [...baseStyle, styles.secondaryButton] as ViewStyle;
            case 'danger':
                return [...baseStyle, styles.dangerButton] as ViewStyle;
            case 'success':
                return [...baseStyle, styles.successButton] as ViewStyle;
            default:
                return [...baseStyle, styles.primaryButton] as ViewStyle;
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
                <ActivityIndicator color={variant === 'secondary' ? '#007AFF' : '#FFFFFF'} />
            ) : (
                <Text style={getTextStyle()}>{title}</Text>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 48
    },
    fullWidth: {
        width: '100%'
    },
    primaryButton: {
        backgroundColor: '#007AFF'
    },
    secondaryButton: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#007AFF'
    },
    dangerButton: {
        backgroundColor: '#FF3B30'
    },
    successButton: {
        backgroundColor: '#34C759'
    },
    disabledButton: {
        opacity: 0.5
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600'
    },
    secondaryText: {
        color: '#007AFF',
        fontSize: 16,
        fontWeight: '600'
    }
});
