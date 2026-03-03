// Admin Bill Detail Screen
// Shows full bill breakdown + approve/reject payment proof

import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Image,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { Button } from '../../../src/components/common/Button';
import { Card } from '../../../src/components/common/Card';
import { LoadingSpinner } from '../../../src/components/common/LoadingSpinner';
import { StatusBadge } from '../../../src/components/common/StatusBadge';
import { useAuth } from '../../../src/contexts/AuthContext';
import {
    getBillById,
    rejectPaymentProof,
    verifyPayment,
} from '../../../src/services/MonthlyBillingService';
import { Bill } from '../../../src/types';

export default function AdminBillDetailScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const { userProfile, currentUser } = useAuth();

    const [bill, setBill] = useState<Bill | null>(null);
    const [loading, setLoading] = useState(true);
    const [approving, setApproving] = useState(false);
    const [rejecting, setRejecting] = useState(false);
    const [proofVisible, setProofVisible] = useState(false);

    useEffect(() => { loadBill(); }, [id]);

    const loadBill = async () => {
        if (!id) return;
        setLoading(true);
        const result = await getBillById(id as string);
        setBill(result);
        setLoading(false);
    };

    // ── Approve payment ──────────────────────────────────────────
    const handleApprove = async () => {
        if (!bill?.id || !currentUser?.uid) return;
        console.log('Approve clicked for bill:', bill.id, 'by admin:', currentUser.uid);
        const confirmed = window.confirm(
            `Approve payment from ${bill.residentName} for ${bill.month}?\n\nThis will mark the bill as Paid.`
        );
        if (!confirmed) return;
        setApproving(true);
        try {
            const result = await verifyPayment(bill.id!, currentUser.uid!);
            if (result.success) {
                window.alert('✅ Payment approved and bill marked as Paid.');
                loadBill();
            } else {
                window.alert('Error: ' + (result.error || 'Failed to approve payment.'));
            }
        } catch (e) {
            window.alert('Error: An unexpected error occurred.');
        } finally {
            setApproving(false);
        }
    };

    // ── Reject payment ───────────────────────────────────────────
    const handleReject = async () => {
        if (!bill?.id) return;
        const confirmed = window.confirm(
            `Reject the payment proof from ${bill.residentName}?\n\nThe bill will revert to Unpaid and the resident must re-submit.`
        );
        if (!confirmed) return;
        setRejecting(true);
        try {
            const result = await rejectPaymentProof(bill.id!);
            if (result.success) {
                window.alert('❌ Payment proof rejected. Resident must re-submit.');
                loadBill();
            } else {
                window.alert('Error: ' + (result.error || 'Failed to reject payment.'));
            }
        } catch (e) {
            window.alert('Error: An unexpected error occurred.');
        } finally {
            setRejecting(false);
        }
    };

    // ── Send notification to resident ────────────────────────────
    const handleSendBill = async () => {
        if (!bill?.id || !userProfile?.uid) return;
        const confirmed = window.confirm(`Send bill notification to ${bill.residentName}?`);
        if (!confirmed) return;
        try {
            const { sendBillToResident } = await import('../../../src/services/MonthlyBillingService');
            const result = await sendBillToResident(bill.id!, userProfile.uid);
            window.alert(result.success ? '✅ Bill sent to resident.' : 'Error: ' + (result.error || 'Failed.'));
            if (result.success) loadBill();
        } catch {
            window.alert('Error: An unexpected error occurred.');
        }
    };

    const formatDate = (ts: any): string => {
        if (!ts) return 'N/A';
        const d = ts.toDate ? ts.toDate() : new Date(ts);
        return d.toLocaleDateString();
    };

    // ── Guard states ─────────────────────────────────────────────
    if (loading) return <LoadingSpinner message="Loading bill details..." />;
    if (!bill) {
        return (
            <View style={styles.container}>
                <Text style={styles.errorText}>Bill not found</Text>
            </View>
        );
    }

    const hasPendingProof = bill.status === 'Pending' && !!bill.proofUrl;

    return (
        <>
            <Stack.Screen options={{ title: `Bill – ${bill.month}` }} />

            {/* ── Payment proof full-screen modal ── */}
            <Modal visible={proofVisible} transparent animationType="fade">
                <Pressable style={styles.modalBackdrop} onPress={() => setProofVisible(false)}>
                    <View style={styles.modalContent}>
                        <Image
                            source={{ uri: bill.proofUrl ?? undefined }}
                            style={styles.proofImage}
                            resizeMode="contain"
                        />
                        <TouchableOpacity style={styles.closeBtn} onPress={() => setProofVisible(false)}>
                            <Text style={styles.closeBtnText}>✕  Close</Text>
                        </TouchableOpacity>
                    </View>
                </Pressable>
            </Modal>

            <ScrollView style={styles.container}>
                <View style={styles.content}>

                    {/* ── Header Card ── */}
                    <Card>
                        <View style={styles.header}>
                            <View>
                                <Text style={styles.month}>{bill.month}</Text>
                                <Text style={styles.residentInfo}>
                                    {bill.residentName} · House {bill.houseNo}
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

                    {/* ── Charges Breakdown ── */}
                    <Card>
                        <Text style={styles.sectionTitle}>📊 Charges Breakdown</Text>

                        <View style={styles.chargeRow}>
                            <Text style={styles.chargeLabel}>Base Charges (Maintenance)</Text>
                            <Text style={styles.chargeValue}>Rs. {bill.breakdown.baseCharges.toLocaleString()}</Text>
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
                                {bill.breakdown.complaintCharges.map((charge, i) => (
                                    <View key={i} style={styles.complaintCharge}>
                                        <View style={styles.complaintInfo}>
                                            <Text style={styles.complaintNumber}>{charge.complaintNumber}</Text>
                                            <Text style={styles.complaintDesc}>{charge.description}</Text>
                                        </View>
                                        <Text style={styles.complaintAmount}>Rs. {charge.amount.toLocaleString()}</Text>
                                    </View>
                                ))}
                            </>
                        )}

                        <View style={styles.divider} />
                        <View style={styles.totalRow}>
                            <Text style={styles.totalRowLabel}>Total</Text>
                            <Text style={styles.totalRowValue}>Rs. {bill.amount.toLocaleString()}</Text>
                        </View>
                    </Card>

                    {/* ── Payment Proof Card (shown when proof exists) ── */}
                    {bill.proofUrl && (
                        <Card>
                            <Text style={styles.sectionTitle}>💳 Payment Proof</Text>

                            <View style={styles.infoRow}>
                                <Text style={styles.label}>Uploaded:</Text>
                                <Text style={styles.value}>{formatDate(bill.proofUploadedAt)}</Text>
                            </View>

                            {/* Proof thumbnail */}
                            <TouchableOpacity
                                onPress={() => setProofVisible(true)}
                                activeOpacity={0.85}
                                style={styles.proofThumbWrapper}
                            >
                                <Image
                                    source={{ uri: bill.proofUrl }}
                                    style={styles.proofThumb}
                                    resizeMode="cover"
                                />
                                <View style={styles.proofTapHint}>
                                    <Text style={styles.proofTapText}>🔍 Tap to enlarge</Text>
                                </View>
                            </TouchableOpacity>

                            {/* ── APPROVE / REJECT ── shown only when status = Pending */}
                            {hasPendingProof && (
                                <View style={styles.actionRow}>
                                    <TouchableOpacity
                                        style={[styles.actionBtn, styles.approveBtn, approving && styles.btnDisabled]}
                                        onPress={handleApprove}
                                        disabled={approving || rejecting}
                                        activeOpacity={0.85}
                                    >
                                        <Text style={styles.actionBtnText}>
                                            {approving ? '⏳ Approving...' : '✅ Approve Payment'}
                                        </Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={[styles.actionBtn, styles.rejectBtn, rejecting && styles.btnDisabled]}
                                        onPress={handleReject}
                                        disabled={approving || rejecting}
                                        activeOpacity={0.85}
                                    >
                                        <Text style={styles.actionBtnText}>
                                            {rejecting ? '⏳ Rejecting...' : '❌ Reject Proof'}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            )}

                            {/* Already verified banner */}
                            {bill.status === 'Paid' && (
                                <View style={styles.paidBanner}>
                                    <Text style={styles.paidBannerText}>✅ Payment verified and approved</Text>
                                </View>
                            )}
                        </Card>
                    )}

                    {/* ── Other Actions ── */}
                    <Card>
                        <Button
                            title="📧 Send Bill Notification"
                            onPress={handleSendBill}
                            variant="primary"
                            fullWidth
                            style={styles.actionButton}
                        />
                    </Card>

                </View>
            </ScrollView>
        </>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F5F7FA' },
    content: { padding: 16 },

    // Header
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 20,
    },
    month: { fontSize: 20, fontWeight: '700', color: '#333', marginBottom: 4 },
    residentInfo: { fontSize: 15, color: '#666' },
    totalAmount: {
        backgroundColor: '#E3F2FD',
        padding: 16,
        borderRadius: 12,
        marginBottom: 16,
        alignItems: 'center',
    },
    totalLabel: { fontSize: 14, color: '#666', marginBottom: 4 },
    totalValue: { fontSize: 32, fontWeight: '700', color: '#1976D2' },
    infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
    label: { fontSize: 14, color: '#666' },
    value: { fontSize: 14, fontWeight: '500', color: '#333' },

    // Breakdown
    sectionTitle: { fontSize: 18, fontWeight: '600', color: '#333', marginBottom: 16 },
    subsectionTitle: { fontSize: 15, fontWeight: '600', color: '#333', marginBottom: 12, marginTop: 8 },
    chargeRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
    chargeLabel: { fontSize: 14, color: '#333' },
    chargeValue: { fontSize: 14, fontWeight: '600', color: '#333' },
    duesText: { color: '#FF3B30' },
    divider: { height: 1, backgroundColor: '#E0E0E0', marginVertical: 16 },
    complaintCharge: {
        backgroundColor: '#FFF3E0',
        padding: 12,
        borderRadius: 8,
        marginBottom: 8,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    complaintInfo: { flex: 1, marginRight: 12 },
    complaintNumber: { fontSize: 12, fontWeight: '600', color: '#F57C00', marginBottom: 2 },
    complaintDesc: { fontSize: 13, color: '#666' },
    complaintAmount: { fontSize: 15, fontWeight: '700', color: '#F57C00' },
    totalRow: { flexDirection: 'row', justifyContent: 'space-between' },
    totalRowLabel: { fontSize: 16, fontWeight: '700', color: '#333' },
    totalRowValue: { fontSize: 16, fontWeight: '700', color: '#1976D2' },

    // Proof thumbnail
    proofThumbWrapper: {
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 16,
        position: 'relative',
    },
    proofThumb: { width: '100%', height: 200, backgroundColor: '#eee' },
    proofTapHint: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(0,0,0,0.45)',
        paddingVertical: 6,
        alignItems: 'center',
    },
    proofTapText: { color: '#fff', fontSize: 13, fontWeight: '600' },

    // Approve / Reject row
    actionRow: { flexDirection: 'row', gap: 10, marginBottom: 4 },
    actionBtn: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    approveBtn: { backgroundColor: '#10b981' },
    rejectBtn: { backgroundColor: '#ef4444' },
    btnDisabled: { opacity: 0.55 },
    actionBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

    // Paid banner
    paidBanner: {
        backgroundColor: '#d1fae5',
        borderRadius: 10,
        padding: 12,
        alignItems: 'center',
        marginTop: 4,
    },
    paidBannerText: { color: '#065f46', fontWeight: '600', fontSize: 14 },

    // Other actions
    actionButton: { marginTop: 0 },

    // Proof modal
    modalBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.9)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: { width: '95%', alignItems: 'center' },
    proofImage: { width: '100%', height: 500, borderRadius: 12 },
    closeBtn: {
        marginTop: 20,
        backgroundColor: 'rgba(255,255,255,0.15)',
        paddingHorizontal: 28,
        paddingVertical: 12,
        borderRadius: 25,
    },
    closeBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },

    // Error
    errorText: { fontSize: 16, color: '#666', textAlign: 'center', marginTop: 40 },
});
