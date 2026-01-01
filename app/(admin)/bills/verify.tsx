// Verify Payments Screen (Admin)
// View and approve payment proofs

import React, { useEffect, useState } from 'react';
import { Alert, Image, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Button } from '../../../src/components/common/Button';
import { Card } from '../../../src/components/common/Card';
import { LoadingSpinner } from '../../../src/components/common/LoadingSpinner';
import { StatusBadge } from '../../../src/components/common/StatusBadge';
import { useAuth } from '../../../src/contexts/AuthContext';
import { getPendingBills, rejectPaymentProof, verifyPayment } from '../../../src/services/MonthlyBillingService';
import { Bill } from '../../../src/types';

export default function VerifyPaymentsScreen() {
    const { userProfile } = useAuth();
    const [bills, setBills] = useState<Bill[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [processingId, setProcessingId] = useState<string | null>(null);

    useEffect(() => {
        loadPendingBills();
    }, []);

    const loadPendingBills = async () => {
        setLoading(true);
        const result = await getPendingBills();
        setBills(result);
        setLoading(false);
    };

    const handleApprove = async (billId: string) => {
        Alert.alert(
            'Confirm Payment',
            'Are you sure you want to approve this payment?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Approve',
                    onPress: async () => {
                        setProcessingId(billId);
                        const result = await verifyPayment(billId, userProfile!.uid);
                        setProcessingId(null);

                        if (result.success) {
                            Alert.alert('Success', 'Payment approved successfully');
                            loadPendingBills();
                        } else {
                            Alert.alert('Error', result.error || 'Failed to approve payment');
                        }
                    }
                }
            ]
        );
    };

    const handleReject = async (billId: string) => {
        Alert.alert(
            'Reject Payment',
            'Are you sure you want to reject this payment proof?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Reject',
                    style: 'destructive',
                    onPress: async () => {
                        setProcessingId(billId);
                        const result = await rejectPaymentProof(billId);
                        setProcessingId(null);

                        if (result.success) {
                            Alert.alert('Rejected', 'Payment proof rejected. Resident will need to upload again.');
                            loadPendingBills();
                        } else {
                            Alert.alert('Error', result.error || 'Failed to reject payment');
                        }
                    }
                }
            ]
        );
    };

    if (loading) {
        return <LoadingSpinner message="Loading pending payments..." />;
    }

    return (
        <View style={styles.container}>
            <ScrollView style={styles.content}>
                {bills.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyIcon}>✅</Text>
                        <Text style={styles.emptyTitle}>All Caught Up!</Text>
                        <Text style={styles.emptyText}>No pending payments to verify</Text>
                    </View>
                ) : (
                    bills.map(bill => (
                        <Card key={bill.id}>
                            <View style={styles.header}>
                                <View>
                                    <Text style={styles.residentName}>{bill.residentName}</Text>
                                    <Text style={styles.houseNo}>{bill.houseNo}</Text>
                                </View>
                                <StatusBadge status={bill.status} />
                            </View>

                            <View style={styles.billInfo}>
                                <View style={styles.row}>
                                    <Text style={styles.label}>Month:</Text>
                                    <Text style={styles.value}>{bill.month}</Text>
                                </View>
                                <View style={styles.row}>
                                    <Text style={styles.label}>Amount:</Text>
                                    <Text style={styles.amount}>Rs. {bill.amount.toLocaleString()}</Text>
                                </View>
                            </View>

                            {bill.proofUrl && (
                                <TouchableOpacity onPress={() => setSelectedImage(bill.proofUrl!)}>
                                    <Image
                                        source={{ uri: bill.proofUrl }}
                                        style={styles.proofImage}
                                        resizeMode="cover"
                                    />
                                    <Text style={styles.tapToEnlarge}>Tap to enlarge</Text>
                                </TouchableOpacity>
                            )}

                            <View style={styles.actions}>
                                <Button
                                    title="Reject"
                                    onPress={() => handleReject(bill.id!)}
                                    variant="danger"
                                    loading={processingId === bill.id}
                                    style={styles.actionButton}
                                />
                                <Button
                                    title="Approve"
                                    onPress={() => handleApprove(bill.id!)}
                                    variant="success"
                                    loading={processingId === bill.id}
                                    style={styles.actionButton}
                                />
                            </View>
                        </Card>
                    ))
                )}
            </ScrollView>

            {/* Image Modal */}
            <Modal
                visible={selectedImage !== null}
                transparent
                animationType="fade"
                onRequestClose={() => setSelectedImage(null)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setSelectedImage(null)}
                >
                    <View style={styles.modalContent}>
                        {selectedImage && (
                            <Image
                                source={{ uri: selectedImage }}
                                style={styles.fullImage}
                                resizeMode="contain"
                            />
                        )}
                        <Button
                            title="Close"
                            onPress={() => setSelectedImage(null)}
                            variant="secondary"
                            style={styles.closeButton}
                        />
                    </View>
                </TouchableOpacity>
            </Modal>
        </View>
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
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60
    },
    emptyIcon: {
        fontSize: 64,
        marginBottom: 16
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8
    },
    emptyText: {
        fontSize: 16,
        color: '#999'
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16
    },
    residentName: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333'
    },
    houseNo: {
        fontSize: 14,
        color: '#666',
        marginTop: 4
    },
    billInfo: {
        marginBottom: 16
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8
    },
    label: {
        fontSize: 14,
        color: '#666'
    },
    value: {
        fontSize: 14,
        color: '#333',
        fontWeight: '500'
    },
    amount: {
        fontSize: 16,
        fontWeight: '700',
        color: '#007AFF'
    },
    proofImage: {
        width: '100%',
        height: 200,
        borderRadius: 8,
        marginBottom: 8
    },
    tapToEnlarge: {
        fontSize: 12,
        color: '#007AFF',
        textAlign: 'center',
        marginBottom: 16
    },
    actions: {
        flexDirection: 'row',
        gap: 12
    },
    actionButton: {
        flex: 1
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.9)',
        justifyContent: 'center',
        alignItems: 'center'
    },
    modalContent: {
        width: '90%',
        maxHeight: '80%'
    },
    fullImage: {
        width: '100%',
        height: 500,
        marginBottom: 20
    },
    closeButton: {
        alignSelf: 'center'
    }
});
