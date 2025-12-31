// Resident Complaint Detail Screen
// View complaint details and admin resolution notes

import { Stack, useLocalSearchParams } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { db } from '../../../firebaseConfig';
import { Card } from '../../../src/components/common/Card';
import { LoadingSpinner } from '../../../src/components/common/LoadingSpinner';
import { Complaint } from '../../../src/types';

export default function ResidentComplaintDetailScreen() {
    const { id } = useLocalSearchParams();
    const [complaint, setComplaint] = useState<Complaint | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadComplaint();
    }, [id]);

    const loadComplaint = async () => {
        try {
            const complaintDoc = await getDoc(doc(db, 'complaints', id as string));
            if (complaintDoc.exists()) {
                setComplaint({
                    id: complaintDoc.id,
                    ...complaintDoc.data(),
                } as Complaint);
            }
        } catch (error) {
            console.error('Error loading complaint:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <LoadingSpinner message="Loading complaint..." />;
    }

    if (!complaint) {
        return (
            <View style={styles.container}>
                <Text style={styles.errorText}>Complaint not found</Text>
            </View>
        );
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Pending':
                return '#FFA726';
            case 'In Progress':
                return '#42A5F5';
            case 'Resolved':
                return '#66BB6A';
            default:
                return '#999';
        }
    };

    const formatDate = (timestamp: any): string => {
        if (!timestamp) return '';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    };

    return (
        <>
            <Stack.Screen options={{ title: 'Complaint Details' }} />
            <ScrollView style={styles.container}>
                <Card style={styles.card}>
                    {/* Complaint Number */}
                    {complaint.complaintNumber && (
                        <Text style={styles.complaintNumber}>#{complaint.complaintNumber}</Text>
                    )}

                    {/* Status Badge */}
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(complaint.status) }]}>
                        <Text style={styles.statusText}>{complaint.status}</Text>
                    </View>

                    {/* Title and Category */}
                    <Text style={styles.title}>{complaint.title}</Text>
                    <Text style={styles.category}>Category: {complaint.category}</Text>

                    {/* Description */}
                    <Text style={styles.label}>Description:</Text>
                    <Text style={styles.description}>{complaint.description}</Text>

                    {/* Image if exists */}
                    {(complaint.imageUrl || complaint.photoUrl) && (
                        <View style={styles.imageSection}>
                            <Text style={styles.label}>Photo:</Text>
                            <Image
                                source={{ uri: complaint.imageUrl || complaint.photoUrl || '' }}
                                style={styles.image}
                            />
                        </View>
                    )}

                    {/* Submitted Date */}
                    <View style={styles.metaSection}>
                        <Text style={styles.metaLabel}>Submitted:</Text>
                        <Text style={styles.metaValue}>{formatDate(complaint.createdAt)}</Text>
                    </View>

                    {/* Updated Date */}
                    {complaint.updatedAt && (
                        <View style={styles.metaSection}>
                            <Text style={styles.metaLabel}>Last Updated:</Text>
                            <Text style={styles.metaValue}>{formatDate(complaint.updatedAt)}</Text>
                        </View>
                    )}
                </Card>

                {/* Admin Resolution Notes (if complaint is resolved or in progress) */}
                {(complaint.status === 'In Progress' || complaint.status === 'Resolved') && complaint.resolutionNotes && (
                    <Card style={styles.card}>
                        <Text style={styles.sectionTitle}>
                            {complaint.status === 'Resolved' ? '✅ Resolution Notes' : '📝 Admin Notes'}
                        </Text>
                        <View style={styles.notesContainer}>
                            <Text style={styles.notesText}>{complaint.resolutionNotes}</Text>
                        </View>
                        {complaint.status === 'Resolved' && complaint.updatedAt && (
                            <Text style={styles.resolvedDate}>
                                Resolved on {formatDate(complaint.updatedAt)}
                            </Text>
                        )}
                    </Card>
                )}

                {/* Status Information */}
                <Card style={styles.card}>
                    <Text style={styles.sectionTitle}>Status Information</Text>
                    {complaint.status === 'Pending' && (
                        <Text style={styles.infoText}>
                            ⏳ Your complaint has been submitted and is waiting for admin review.
                        </Text>
                    )}
                    {complaint.status === 'In Progress' && (
                        <Text style={styles.infoText}>
                            🔄 Your complaint is being worked on by the admin team.
                        </Text>
                    )}
                    {complaint.status === 'Resolved' && (
                        <Text style={styles.infoText}>
                            ✅ Your complaint has been resolved. Thank you for your patience!
                        </Text>
                    )}
                </Card>
            </ScrollView>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F7FA',
    },
    card: {
        margin: 16,
    },
    complaintNumber: {
        fontSize: 14,
        fontWeight: '700',
        color: '#007AFF',
        marginBottom: 8,
        letterSpacing: 0.5,
    },
    statusBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        marginBottom: 16,
    },
    statusText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 12,
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: '#333',
        marginBottom: 8,
    },
    category: {
        fontSize: 14,
        color: '#666',
        marginBottom: 16,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#EEE',
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
        marginTop: 8,
    },
    description: {
        fontSize: 15,
        color: '#555',
        lineHeight: 22,
    },
    imageSection: {
        marginTop: 16,
    },
    image: {
        width: '100%',
        height: 200,
        borderRadius: 8,
        backgroundColor: '#F0F0F0',
    },
    metaSection: {
        flexDirection: 'row',
        marginTop: 12,
    },
    metaLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#666',
        width: 100,
    },
    metaValue: {
        fontSize: 13,
        color: '#333',
        flex: 1,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginBottom: 12,
    },
    notesContainer: {
        backgroundColor: '#E8F5E9',
        padding: 12,
        borderRadius: 8,
    },
    notesText: {
        fontSize: 14,
        color: '#2E7D32',
        lineHeight: 20,
    },
    resolvedDate: {
        fontSize: 12,
        color: '#666',
        marginTop: 8,
        fontStyle: 'italic',
    },
    infoText: {
        fontSize: 14,
        color: '#666',
        lineHeight: 20,
    },
    errorText: {
        fontSize: 16,
        color: '#999',
        textAlign: 'center',
        marginTop: 40,
    },
});
