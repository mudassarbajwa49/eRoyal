// Common Components - Input
// Reusable text input component with label and validation

import React from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View, ViewStyle } from 'react-native';

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
                placeholderTextColor="#999"
                {...textInputProps}
            />
            {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 16
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        color: '#333',
        marginBottom: 8
    },
    required: {
        color: '#FF3B30'
    },
    input: {
        borderWidth: 1,
        borderColor: '#DDD',
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        backgroundColor: '#FFFFFF',
        minHeight: 48
    },
    inputError: {
        borderColor: '#FF3B30'
    },
    errorText: {
        color: '#FF3B30',
        fontSize: 12,
        marginTop: 4
    }
});
