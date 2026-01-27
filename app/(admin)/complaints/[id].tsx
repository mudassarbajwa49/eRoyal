// Admin Complaint Detail Screen
// View and update complaint status

import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { db } from '../../../firebaseConfig';
import { Button } from '../../../src/components/common/Button';
import { Card } from '../../../src/components/common/Card';
import { LoadingSpinner } from '../../../src/components/common/LoadingSpinner';
import { useAuth } from '../../../src/contexts/AuthContext';
import { resolveComplaintWithCharge, updateComplaintStatus } from '../../../src/services/ComplaintManagementService';
import { Complaint, ComplaintStatus } from '../../../src/types';

export default function ComplaintDetailScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const { userProfile } = useAuth();
    const [complaint, setComplaint] = useState<Complaint | null>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [notes, setNotes] = useState('');
    const [chargeAmount, setChargeAmount] = useState('');

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

    const handleStatusUpdate = async (status: ComplaintStatus) => {
        if (!userProfile || !complaint) return;

        const confirmed = window.confirm(
            `Mark this complaint as ${status}?${status === 'Resolved' && !notes.trim()
                ? '\n\nConsider adding resolution notes below first.'
                : ''
            }`
        );

        if (!confirmed) return;

        setUpdating(true);

        const result = await updateComplaintStatus(
            complaint.id!,
            status,
            userProfile.uid,
            notes.trim() || undefined
        );

        setUpdating(false);

        if (result.success) {
            window.alert(`Complaint marked as ${status}!`);
            router.back();
        } else {
            window.alert(result.error || 'Failed to update complaint');
        }
    };

    const handleResolveWithCharge = async () => {
        if (!userProfile || !complaint) return;

        const charge = chargeAmount.trim() ? parseFloat(chargeAmount) : 0;

        if (chargeAmount.trim() && (isNaN(charge) || charge < 0)) {
            window.alert('Please enter a valid charge amount');
            return;
        }

        const confirmMsg = charge > 0
            ? `Resolve this complaint and add Rs. ${charge.toLocaleString()} to the resident's monthly bill?`
            : 'Resolve this complaint without adding any charge?';

        const confirmed = window.confirm(confirmMsg);
        if (!confirmed) return;

        setUpdating(true);

        const result = await resolveComplaintWithCharge(
            complaint.id!,
            notes.trim(),
            charge > 0 ? charge : null,
            userProfile.uid,
            complaint.residentId,
            complaint.residentName
        );

        setUpdating(false);

        if (result.success) {
            window.alert(result.message || 'Complaint resolved!');
            router.back();
        } else {
            window.alert(result.error || 'Failed to resolve complaint');
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

    const getStatusColor = (status: ComplaintStatus) => {
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

    const isResolved = complaint.status === 'Resolved';

    return (
        <>
            <Stack.Screen options={{ title: 'Complaint Details' }} />
            <ScrollView style={styles.container}>
                <Card style={styles.card}>
                    {/* Status Badge */}
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(complaint.status) }]}>
                        <Text style={styles.statusText}>{complaint.status}</Text>
                    </View>

                    {/* Complaint Info */}
                    <Text style={styles.title}>{complaint.title}</Text>
                    <Text style={styles.category}>Category: {complaint.category}</Text>

                    <View style={styles.metaRow}>
                        <Text style={styles.metaText}>👤 {complaint.residentName}</Text>
                        {complaint.houseNo && (
                            <Text style={styles.metaText}>🏠 House {complaint.houseNo}</Text>
                        )}
                    </View>

                    <Text style={styles.label}>Description:</Text>
                    <Text style={styles.description}>{complaint.description}</Text>

                    {/* Image if exists */}
                    {complaint.imageUrl && (
                        <View style={styles.imageSection}>
                            <Text style={styles.label}>Photo:</Text>
                            <Image source={{ uri: complaint.imageUrl }} style={styles.image} />
                        </View>
                    )}

                    {/* Resolution Notes (if resolved) */}
                    {isResolved && complaint.resolutionNotes && (
                        <View style={styles.resolutionSection}>
                            <Text style={styles.label}>Resolution Notes:</Text>
                            <Text style={styles.resolutionNotes}>{complaint.resolutionNotes}</Text>
                        </View>
                    )}

                    {/* Show charge if added to bill */}
                    {isResolved && complaint.chargeAmount && complaint.chargeAmount > 0 && (
                        <View style={styles.chargeSection}>
                            <Text style={styles.label}>Service Charge:</Text>
                            <Text style={styles.chargeAmount}>Rs. {complaint.chargeAmount.toLocaleString()}</Text>
                            <Text style={styles.chargeNote}>✓ Added to Monthly Bill</Text>
                        </View>
                    )}
                </Card>

                {/* Admin Actions */}
                {!isResolved && (
                    <Card style={styles.card}>
                        <Text style={styles.sectionTitle}>Admin Actions</Text>

                        {/* Resolution Notes Input */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Resolution Notes (Optional):</Text>
                            <TextInput
                                style={styles.textInput}
                                placeholder="Add notes about how this was resolved..."
                                value={notes}
                                onChangeText={setNotes}
                                multiline
                                numberOfLines={4}
                                textAlignVertical="top"
                            />
                        </View>

                        {/* Charge Amount Input */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Service Charge (Optional):</Text>
                            <TextInput
                                style={styles.textInput}
                                placeholder="Enter amount in PKR (e.g., 1500)"
                                value={chargeAmount}
                                onChangeText={setChargeAmount}
                                keyboardType="numeric"
                            />
                            <Text style={styles.helperText}>
                                This amount will be added to the resident monthly bill
                            </Text>
                        </View>

                        {/* Action Buttons */}
                        <View style={styles.buttonGroup}>
                            {complaint.status === 'Pending' && (
                                <Button
                                    title="Accept & Start"
                                    onPress={() => handleStatusUpdate('In Progress')}
                                    loading={updating}
                                    fullWidth
                                    style={styles.button}
                                />
                            )}

                            <Button
                                title="Resolve & Add Charge"
                                onPress={handleResolveWithCharge}
                                loading={updating}
                                fullWidth
                                variant="success"
                                style={styles.button}
                            />
                        </View>
                    </Card>
                )}
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
        marginBottom: 12,
    },
    metaRow: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 16,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#EEE',
    },
    metaText: {
        fontSize: 13,
        color: '#666',
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
    resolutionSection: {
        marginTop: 16,
        padding: 12,
        backgroundColor: '#E8F5E9',
        borderRadius: 8,
    },
    resolutionNotes: {
        fontSize: 14,
        color: '#2E7D32',
        lineHeight: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginBottom: 16,
    },
    inputContainer: {
        marginBottom: 16,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '500',
        color: '#333',
        marginBottom: 8,
    },
    textInput: {
        borderWidth: 1,
        borderColor: '#DDD',
        borderRadius: 8,
        padding: 12,
        fontSize: 14,
        backgroundColor: '#FFF',
        minHeight: 100,
    },
    buttonGroup: {
        gap: 12,
    },
    button: {
        marginTop: 8,
    },
    errorText: {
        fontSize: 16,
        color: '#999',
        textAlign: 'center',
        marginTop: 40,
    },
    chargeSection: {
        marginTop: 16,
        padding: 12,
        backgroundColor: '#FFF3E0',
        borderRadius: 8,
        borderLeftWidth: 4,
        borderLeftColor: '#FF9800',
    },
    chargeAmount: {
        fontSize: 24,
        fontWeight: '700',
        color: '#F57C00',
        marginVertical: 4,
    },
    chargeNote: {
        fontSize: 13,
        color: '#66BB6A',
        fontWeight: '600',
    },
    helperText: {
        fontSize: 12,
        color: '#666',
        marginTop: 6,
        fontStyle: 'italic',
    },
});
