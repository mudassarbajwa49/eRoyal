// Admin Bill Detail Screen
// Shows complete bill breakdown including all charges

import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from '../../../src/components/common/Button';
import { Card } from '../../../src/components/common/Card';
import { LoadingSpinner } from '../../../src/components/common/LoadingSpinner';
import { StatusBadge } from '../../../src/components/common/StatusBadge';
import { useAuth } from '../../../src/contexts/AuthContext';
import { getBillById } from '../../../src/services/MonthlyBillingService';
import { Bill } from '../../../src/types';

export default function AdminBillDetailScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const { userProfile } = useAuth();
    const [bill, setBill] = useState<Bill | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadBill();
    }, [id]);

    const loadBill = async () => {
        if (!id) return;

        setLoading(true);
        const result = await getBillById(id as string);
        setBill(result);
        setLoading(false);
    };

    const handleSendBill = async () => {
        console.log('Send Bill clicked');
        console.log('Bill:', bill);
        console.log('UserProfile:', userProfile);

        if (!bill?.id) {
            window.alert('Error: Bill not found');
            return;
        }

        if (!userProfile?.uid) {
            window.alert('Error: User session not found. Please log in again.');
            return;
        }

        const confirmed = window.confirm(`Send notification to ${bill?.residentName} about this bill?`);
        if (confirmed) {
            try {
                const { sendBillToResident } = await import('../../../src/services/MonthlyBillingService');
                const result = await sendBillToResident(bill.id!, userProfile.uid);
                if (result.success) {
                    window.alert('Success: Bill sent to resident!');
                    loadBill();
                } else {
                    window.alert('Error: ' + (result.error || 'Failed to send bill'));
                }
            } catch (error) {
                console.error('Error sending bill:', error);
                window.alert('Error: An unexpected error occurred');
            }
        }
    };

    const formatDate = (timestamp: any): string => {
        if (!timestamp) return 'N/A';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString();
    };

    if (loading) {
        return <LoadingSpinner message="Loading bill details..." />;
    }

    if (!bill) {
        return (
            <View style={styles.container}>
                <Text style={styles.errorText}>Bill not found</Text>
            </View>
        );
    }

    return (
        <>
            <Stack.Screen options={{ title: `Bill - ${bill.month}` }} />
            <ScrollView style={styles.container}>
                <View style={styles.content}>
                    {/* Header Card */}
                    <Card>
                        <View style={styles.header}>
                            <View>
                                <Text style={styles.month}>{bill.month}</Text>
                                <Text style={styles.residentInfo}>
                                    {bill.residentName} - House {bill.houseNo}
                                </Text>
                            </View>
                            <StatusBadge status={bill.status} />
                        </View>

                        <View style={styles.totalAmount}>
                            <Text style={styles.totalLabel}>Total Amount</Text>
                            <Text style={styles.totalValue}>Rs. {bill.amount.toLocaleString()}</Text>
                        </View>

                        <View style={styles.infoRow}>
                            <Text style={styles.label}>Due Date:</Text>
                            <Text style={styles.value}>{formatDate(bill.dueDate)}</Text>
                        </View>

                        <View style={styles.infoRow}>
                            <Text style={styles.label}>Generated:</Text>
                            <Text style={styles.value}>{formatDate(bill.createdAt)}</Text>
                        </View>
                    </Card>

                    {/* Charges Breakdown */}
                    <Card>
                        <Text style={styles.sectionTitle}>📊 Charges Breakdown</Text>

                        <View style={styles.chargeRow}>
                            <Text style={styles.chargeLabel}>Base Charges (Maintenance)</Text>
                            <Text style={styles.chargeValue}>
                                Rs. {bill.breakdown.baseCharges.toLocaleString()}
                            </Text>
                        </View>

                        {bill.breakdown.previousDues > 0 && (
                            <View style={styles.chargeRow}>
                                <Text style={styles.chargeLabel}>Previous Dues</Text>
                                <Text style={[styles.chargeValue, styles.duesText]}>
                                    Rs. {bill.breakdown.previousDues.toLocaleString()}
                                </Text>
                            </View>
                        )}

                        {bill.breakdown.complaintCharges && bill.breakdown.complaintCharges.length > 0 && (
                            <>
                                <View style={styles.divider} />
                                <Text style={styles.subsectionTitle}>Complaint Charges</Text>
                                {bill.breakdown.complaintCharges.map((charge, index) => (
                                    <View key={index} style={styles.complaintCharge}>
                                        <View style={styles.complaintInfo}>
                                            <Text style={styles.complaintNumber}>
                                                {charge.complaintNumber}
                                            </Text>
                                            <Text style={styles.complaintDesc}>
                                                {charge.description}
                                            </Text>
                                        </View>
                                        <Text style={styles.complaintAmount}>
                                            Rs. {charge.amount.toLocaleString()}
                                        </Text>
                                    </View>
                                ))}
                            </>
                        )}

                        <View style={styles.divider} />
                        <View style={styles.totalRow}>
                            <Text style={styles.totalRowLabel}>Total</Text>
                            <Text style={styles.totalRowValue}>
                                Rs. {bill.amount.toLocaleString()}
                            </Text>
                        </View>
                    </Card>

                    {/* Payment Information */}
                    {bill.proofUrl && (
                        <Card>
                            <Text style={styles.sectionTitle}>💳 Payment Information</Text>
                            <View style={styles.infoRow}>
                                <Text style={styles.label}>Proof Uploaded:</Text>
                                <Text style={styles.value}>{formatDate(bill.proofUploadedAt)}</Text>
                            </View>
                            {/* paidAt field not yet implemented in Bill type */}
                            <Button
                                title="View Payment Proof"
                                onPress={() => {
                                    // TODO: Open image viewer
                                    Alert.alert('View Proof', `URL: ${bill.proofUrl}`);
                                }}
                                variant="secondary"
                                fullWidth
                                style={styles.actionButton}
                            />
                        </Card>
                    )}

                    {/* Actions */}
                    <Card>
                        <Button
                            title="📧 Send Bill Notification"
                            onPress={handleSendBill}
                            variant="primary"
                            fullWidth
                            style={styles.actionButton}
                        />

                        {bill.status === 'Pending' && bill.proofUrl && (
                            <>
                                <Button
                                    title="✅ Mark as Paid"
                                    onPress={() => Alert.alert('TODO', 'Mark as paid functionality')}
                                    variant="primary"
                                    fullWidth
                                    style={styles.actionButton}
                                />
                                <Button
                                    title="❌ Reject Payment"
                                    onPress={() => Alert.alert('TODO', 'Reject payment functionality')}
                                    variant="danger"
                                    fullWidth
                                    style={styles.actionButton}
                                />
                            </>
                        )}
                    </Card>
                </View>
            </ScrollView>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F7FA'
    },
    content: {
        padding: 16
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 20
    },
    month: {
        fontSize: 20,
        fontWeight: '700',
        color: '#333',
        marginBottom: 4
    },
    residentInfo: {
        fontSize: 15,
        color: '#666'
    },
    totalAmount: {
        backgroundColor: '#E3F2FD',
        padding: 16,
        borderRadius: 12,
        marginBottom: 16,
        alignItems: 'center'
    },
    totalLabel: {
        fontSize: 14,
        color: '#666',
        marginBottom: 4
    },
    totalValue: {
        fontSize: 32,
        fontWeight: '700',
        color: '#1976D2'
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12
    },
    label: {
        fontSize: 14,
        color: '#666'
    },
    value: {
        fontSize: 14,
        fontWeight: '500',
        color: '#333'
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginBottom: 16
    },
    subsectionTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#333',
        marginBottom: 12,
        marginTop: 8
    },
    chargeRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12
    },
    chargeLabel: {
        fontSize: 14,
        color: '#333'
    },
    chargeValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333'
    },
    duesText: {
        color: '#FF3B30'
    },
    divider: {
        height: 1,
        backgroundColor: '#E0E0E0',
        marginVertical: 16
    },
    complaintCharge: {
        backgroundColor: '#FFF3E0',
        padding: 12,
        borderRadius: 8,
        marginBottom: 8,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    complaintInfo: {
        flex: 1,
        marginRight: 12
    },
    complaintNumber: {
        fontSize: 12,
        fontWeight: '600',
        color: '#F57C00',
        marginBottom: 2
    },
    complaintDesc: {
        fontSize: 13,
        color: '#666'
    },
    complaintAmount: {
        fontSize: 15,
        fontWeight: '700',
        color: '#F57C00'
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between'
    },
    totalRowLabel: {
        fontSize: 16,
        fontWeight: '700',
        color: '#333'
    },
    totalRowValue: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1976D2'
    },
    actionButton: {
        marginTop: 12
    },
    errorText: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginTop: 40
    }
});
