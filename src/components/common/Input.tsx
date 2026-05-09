// Common Components - Input
// Reusable text input component with label and validation

import React from 'react';
import { Platform, StyleSheet, Text, TextInput, TextInputProps, View, ViewStyle } from 'react-native';
import { BorderRadius, Colors, Spacing, Typography } from '../../../constants/designSystem';

interface InputProps extends TextInputProps {
    label?: string;
    error?: string;
    containerStyle?: ViewStyle;
    required?: boolean;
}

export const Input: React.FC<InputProps> = ({
    label,
    error,
    containerStyle,
    required = false,
    ...textInputProps
}) => {
    return (
        <View style={[styles.container, containerStyle]}>
            {label && (
                <Text style={styles.label}>
                    {label}
                    {required && <Text style={styles.required}> *</Text>}
                </Text>
            )}
            <TextInput
                style={[
                    styles.input,
                    error && styles.inputError
                ]}
                placeholderTextColor={Colors.text.tertiary}
                // Remove browser default blue outline on web
                {...(Platform.OS === 'web' ? { outlineWidth: 0 } as any : {})}
                {...textInputProps}
            />
            {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: Spacing.lg
    },
    label: {
        fontSize: Typography.fontSize.sm,
        fontWeight: Typography.fontWeight.medium,
        color: Colors.text.primary,
        marginBottom: Spacing.sm
    },
    required: {
        color: Colors.error.main
    },
    input: {
        borderWidth: 1.5, // Slightly thicker for modern look
        borderColor: Colors.border.main,
        borderRadius: BorderRadius.lg,
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
        fontSize: Typography.fontSize.base,
        backgroundColor: Colors.background.surface,
        minHeight: 52, // Taller inputs are more premium
        color: Colors.text.primary,
    },
    inputError: {
        borderColor: Colors.error.main,
        backgroundColor: Colors.error.light,
    },
    errorText: {
        color: Colors.error.main,
        fontSize: Typography.fontSize.xs,
        marginTop: Spacing.xs,
        fontWeight: Typography.fontWeight.medium,
    }
});
