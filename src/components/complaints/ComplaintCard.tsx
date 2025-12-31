// Complaint Card Component
// Displays individual complaint information

import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Complaint } from '../../types';
import { Card } from '../common/Card';
import { StatusBadge } from '../common/StatusBadge';

interface ComplaintCardProps {
    complaint: Complaint;
    onPress?: (complaint: Complaint) => void;
    isAdmin?: boolean;
}

export const ComplaintCard: React.FC<ComplaintCardProps> = ({
    complaint,
    onPress,
    isAdmin = false
}) => {
    const formatDate = (timestamp: any): string => {
        if (!timestamp) return '';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString();
    };

    const getCategoryIcon = (category: string): string => {
        const icons: Record<string, string> = {
            'Water': '💧',
            'Electricity': '⚡',
            'Maintenance': '🔧',
            'Security': '🔒',
            'Other': '📋'
        };
        return icons[category] || '📋';
    };

    return (
        <TouchableOpacity onPress={() => onPress?.(complaint)} disabled={!onPress}>
            <Card>
                <View style={styles.header}>
                    <View style={styles.titleRow}>
                        <Text style={styles.icon}>{getCategoryIcon(complaint.category)}</Text>
                        <View style={styles.titleContainer}>
                            {complaint.complaintNumber && (
                                <Text style={styles.complaintNumber}>#{complaint.complaintNumber}</Text>
                            )}
                            <Text style={styles.title}>{complaint.title}</Text>
                            <Text style={styles.category}>{complaint.category}</Text>
                        </View>
                    </View>
                    <StatusBadge status={complaint.status} />
                </View>

                <Text style={styles.description} numberOfLines={3}>
                    {complaint.description}
                </Text>

                {isAdmin && (
                    <Text style={styles.residentInfo}>
                        {complaint.residentName} - {complaint.houseNo}
                    </Text>
                )}

                {complaint.photoUrl && (
                    <Image
                        source={{ uri: complaint.photoUrl }}
                        style={styles.image}
                        resizeMode="cover"
                    />
                )}

                <View style={styles.footer}>
                    <Text style={styles.date}>
                        Submitted: {formatDate(complaint.createdAt)}
                    </Text>
                    {complaint.resolvedAt && (
                        <Text style={styles.date}>
                            Resolved: {formatDate(complaint.resolvedAt)}
                        </Text>
                    )}
                </View>

                {complaint.adminNotes && (
                    <View style={styles.notesContainer}>
                        <Text style={styles.notesLabel}>Admin Notes:</Text>
                        <Text style={styles.notesText}>{complaint.adminNotes}</Text>
                    </View>
                )}
            </Card>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        flex: 1
    },
    icon: {
        fontSize: 24,
        marginRight: 12
    },
    titleContainer: {
        flex: 1
    },
    complaintNumber: {
        fontSize: 11,
        fontWeight: '700',
        color: '#007AFF',
        marginBottom: 4,
        letterSpacing: 0.5
    },
    title: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4
    },
    category: {
        fontSize: 12,
        color: '#666'
    },
    description: {
        fontSize: 14,
        color: '#666',
        lineHeight: 20,
        marginBottom: 12
    },
    residentInfo: {
        fontSize: 13,
        color: '#007AFF',
        marginBottom: 12,
        fontWeight: '500'
    },
    image: {
        width: '100%',
        height: 200,
        borderRadius: 8,
        marginBottom: 12
    },
    footer: {
        borderTopWidth: 1,
        borderTopColor: '#EEE',
        paddingTop: 12
    },
    date: {
        fontSize: 12,
        color: '#999',
        marginBottom: 4
    },
    notesContainer: {
        backgroundColor: '#F0F8FF',
        padding: 12,
        borderRadius: 8,
        marginTop: 12
    },
    notesLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#007AFF',
        marginBottom: 4
    },
    notesText: {
        fontSize: 13,
        color: '#333'
    }
});
