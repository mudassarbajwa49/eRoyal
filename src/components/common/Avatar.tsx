// Avatar Component
// Display user profile picture or initials

import React from 'react';
import { Image, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Colors, Shadows } from '../../../constants/designSystem';

interface AvatarProps {
    name: string;
    imageUrl?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    style?: ViewStyle;
}

export function Avatar({ name, imageUrl, size = 'md', style }: AvatarProps) {
    const sizeStyles = {
        sm: { width: 32, height: 32, fontSize: 14 },
        md: { width: 40, height: 40, fontSize: 16 },
        lg: { width: 56, height: 56, fontSize: 22 },
        xl: { width: 80, height: 80, fontSize: 32 },
    };

    const currentSize = sizeStyles[size];

    // Get initials from name
    const getInitials = (fullName: string): string => {
        const parts = fullName.trim().split(' ');
        if (parts.length >= 2) {
            return (parts[0][0] + parts[1][0]).toUpperCase();
        }
        return fullName.slice(0, 2).toUpperCase();
    };

    return (
        <View
            style={[
                styles.container,
                {
                    width: currentSize.width,
                    height: currentSize.height,
                    borderRadius: currentSize.width / 2,
                },
                style,
            ]}
        >
            {imageUrl ? (
                <Image
                    source={{ uri: imageUrl }}
                    style={[
                        styles.image,
                        {
                            width: currentSize.width,
                            height: currentSize.height,
                            borderRadius: currentSize.width / 2,
                        },
                    ]}
                />
            ) : (
                <View
                    style={[
                        styles.placeholder,
                        {
                            width: currentSize.width,
                            height: currentSize.height,
                            borderRadius: currentSize.width / 2,
                        },
                    ]}
                >
                    <Text style={[styles.initials, { fontSize: currentSize.fontSize }]}>
                        {getInitials(name)}
                    </Text>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        overflow: 'hidden',
        ...Shadows.sm,
    },
    image: {
        width: '100%',
        height: '100%',
    },
    placeholder: {
        backgroundColor: Colors.primary[600],
        justifyContent: 'center',
        alignItems: 'center',
    },
    initials: {
        color: Colors.text.inverse,
        fontWeight: '600',
    },
});
