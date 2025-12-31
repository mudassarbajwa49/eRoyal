// Common Components - Status Badge
// Status indicator with color coding

import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';

type Status = 'Unpaid' | 'Pending' | 'Paid' | 'Resolved' | 'In Progress' | 'Approved' | 'Rejected';

interface StatusBadgeProps {
    status: Status | string;
    style?: ViewStyle;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, style }) => {
    const getStatusColor = (): string => {
        switch (status) {
            case 'Paid':
            case 'Resolved':
            case 'Approved':
                return '#34C759'; // Green
            case 'Pending':
            case 'In Progress':
                return '#FF9500'; // Orange
            case 'Unpaid':
            case 'Rejected':
                return '#FF3B30'; // Red
            default:
                return '#8E8E93'; // Gray
        }
    };

    const backgroundColor = getStatusColor();

    return (
        <View style={[styles.badge, { backgroundColor }, style]}>
            <Text style={styles.text}>{status}</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    badge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        alignSelf: 'flex-start'
    },
    text: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '600'
    }
});
