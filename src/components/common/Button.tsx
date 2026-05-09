// Common Components - Button
// Reusable button component with consistent styling

import * as Haptics from 'expo-haptics';
import React, { useCallback } from 'react';
import {
    ActivityIndicator,
    InteractionManager,
    Platform,
    StyleProp,
    StyleSheet,
    Text,
    TextStyle,
    TouchableOpacity,
    ViewStyle,
} from 'react-native';
import { BorderRadius, Colors, Shadows, Spacing, Typography } from '../../../constants/designSystem';

interface ButtonProps {
    title: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'success';
    loading?: boolean;
    disabled?: boolean;
    fullWidth?: boolean;
    style?: StyleProp<ViewStyle>;
    textStyle?: StyleProp<TextStyle>;
    /**
     * If true, the onPress callback runs AFTER the current animation frame
     * finishes (via InteractionManager). Use this on navigation buttons so
     * the haptic + opacity animation plays smoothly before the new screen
     * starts mounting. Default: false (fires immediately, good for form submits).
     */
    deferPress?: boolean;
}

export const Button: React.FC<ButtonProps> = React.memo(({
    title,
    onPress,
    variant = 'primary',
    loading = false,
    disabled = false,
    fullWidth = false,
    style,
    textStyle,
    deferPress = false,
}) => {
    const handlePress = useCallback(() => {
        if (disabled || loading) return;

        // Instant haptic feedback so user knows the tap registered
        if (Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }

        if (deferPress) {
            // Let the animation frame complete before heavy work
            InteractionManager.runAfterInteractions(() => {
                onPress();
            });
        } else {
            onPress();
        }
    }, [disabled, loading, deferPress, onPress]);

    const buttonStyle = useCallback((): StyleProp<ViewStyle> => {
        const baseStyle = [
            styles.button,
            fullWidth && styles.fullWidth
        ];

        switch (variant) {
            case 'primary':   return [...baseStyle, styles.primaryButton];
            case 'secondary': return [...baseStyle, styles.secondaryButton];
            case 'outline':   return [...baseStyle, styles.outlineButton];
            case 'danger':    return [...baseStyle, styles.dangerButton];
            case 'success':   return [...baseStyle, styles.successButton];
            default:          return [...baseStyle, styles.primaryButton];
        }
    }, [variant, fullWidth]);

    const textStyleForVariant = useCallback((): TextStyle => {
        switch (variant) {
            case 'secondary': return styles.secondaryText;
            case 'outline':   return styles.outlineText;
            default:          return styles.buttonText;
        }
    }, [variant]);

    return (
        <TouchableOpacity
            style={[
                buttonStyle(),
                (disabled || loading) && styles.disabledButton,
                style
            ]}
            onPress={handlePress}
            disabled={disabled || loading}
            activeOpacity={0.55}
        >
            {loading ? (
                <ActivityIndicator
                    color={
                        variant === 'secondary' || variant === 'outline'
                            ? Colors.primary[600]
                            : Colors.text.inverse
                    }
                />
            ) : (
                <Text style={[textStyleForVariant(), textStyle]}>{title}</Text>
            )}
        </TouchableOpacity>
    );
});

Button.displayName = 'Button';

const styles = StyleSheet.create({
    button: {
        paddingVertical: Spacing.md + 2,
        paddingHorizontal: Spacing.xl,
        borderRadius: BorderRadius.full, // Pill-shaped buttons look more premium
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 52,
    },
    fullWidth: {
        width: '100%',
    },
    primaryButton: {
        backgroundColor: Colors.primary[600],
        ...Shadows.sm,
    },
    secondaryButton: {
        backgroundColor: Colors.background.surface,
        borderWidth: 1.5,
        borderColor: Colors.border.main,
    },
    dangerButton: {
        backgroundColor: Colors.error.main,
    },
    successButton: {
        backgroundColor: Colors.success.main,
    },
    disabledButton: {
        opacity: 0.6,
    },
    buttonText: {
        color: Colors.text.inverse,
        fontSize: Typography.fontSize.base,
        fontWeight: Typography.fontWeight.semibold,
        letterSpacing: 0.3,
    },
    secondaryText: {
        color: Colors.text.primary,
        fontSize: Typography.fontSize.base,
        fontWeight: Typography.fontWeight.semibold,
        letterSpacing: 0.3,
    },
    outlineButton: {
        backgroundColor: 'transparent',
        borderWidth: 1.5,
        borderColor: Colors.primary[600],
    },
    outlineText: {
        color: Colors.primary[600],
        fontSize: Typography.fontSize.base,
        fontWeight: Typography.fontWeight.semibold,
        letterSpacing: 0.3,
    },
});
