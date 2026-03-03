// Admin Marketplace Index
// Approve or reject property listings — reads live data from AdminDataContext

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { ListingCard } from '../../../src/components/marketplace/ListingCard';
import { useAdminData } from '../../../src/contexts/AdminDataContext';
import { useAuth } from '../../../src/contexts/AuthContext';
import {
    approveListing,
    rejectListing,
} from '../../../src/services/MarketplaceListingService';

export default function MarketplaceIndex() {
    const router = useRouter();
    const { userProfile } = useAuth();
    const { pendingListings, approvedListings, rejectedListings, refresh } = useAdminData();

    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected'>('pending');

    // ── Inline confirmation state (replaces window.confirm / prompt) ──────────
    const [confirmId, setConfirmId] = useState<string | null>(null);
    const [confirmType, setConfirmType] = useState<'approve' | 'reject' | null>(null);
    const [rejectReason, setRejectReason] = useState('');
    const [busy, setBusy] = useState(false);
    const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null);

    const onRefresh = async () => {
        setRefreshing(true);
        refresh();
        setTimeout(() => setRefreshing(false), 500);
    };

    // Pressing Approve on a card → open confirm panel
    const handleApprove = (listingId: string) => {
        setConfirmId(listingId);
        setConfirmType('approve');
        setRejectReason('');
        setFeedback(null);
    };

    // Pressing Reject on a card → open reject panel with reason input
    const handleReject = (listingId: string) => {
        setConfirmId(listingId);
        setConfirmType('reject');
        setRejectReason('');
        setFeedback(null);
    };

    const cancelConfirm = () => {
        setConfirmId(null);
        setConfirmType(null);
        setRejectReason('');
    };

    const executeApprove = async () => {
        if (!confirmId) return;
        setBusy(true);
        const res = await approveListing(confirmId, userProfile!.uid);
        setBusy(false);
        if (res.success) {
            setFeedback({ ok: true, msg: 'Listing approved successfully ✓' });
            cancelConfirm();
            setTimeout(() => setFeedback(null), 3000);
        } else {
            setFeedback({ ok: false, msg: res.error || 'Failed to approve listing' });
        }
    };

    const executeReject = async () => {
        if (!rejectReason.trim()) {
            setFeedback({ ok: false, msg: 'Please enter a rejection reason' });
            return;
        }
        if (!confirmId) return;
        setBusy(true);
        const res = await rejectListing(confirmId, userProfile!.uid, rejectReason.trim());
        setBusy(false);
        if (res.success) {
            setFeedback({ ok: true, msg: 'Listing rejected' });
            cancelConfirm();
            setTimeout(() => setFeedback(null), 3000);
        } else {
            setFeedback({ ok: false, msg: res.error || 'Failed to reject listing' });
        }
    };

    return (
        <View style={styles.container}>

            {/* ── Global feedback banner ── */}
            {feedback && !confirmId && (
                <View style={[styles.banner, { backgroundColor: feedback.ok ? '#DCFCE7' : '#FEE2E2' }]}>
                    <Text style={[styles.bannerTxt, { color: feedback.ok ? '#16A34A' : '#DC2626' }]}>
                        {feedback.ok ? '✅' : '⚠️'} {feedback.msg}
                    </Text>
                </View>
            )}

            {/* ── Inline confirm / reject overlay ── */}
            {confirmId && (
                <View style={styles.overlay}>
                    {feedback && (
                        <View style={[styles.overlayFeedback, { backgroundColor: feedback.ok ? '#DCFCE7' : '#FEE2E2' }]}>
                            <Text style={[styles.overlayFeedbackTxt, { color: feedback.ok ? '#16A34A' : '#DC2626' }]}>
                                {feedback.msg}
                            </Text>
                        </View>
                    )}

                    {confirmType === 'approve' && (
                        <>
                            <Text style={styles.overlayQ}>Approve this listing? It will go live immediately.</Text>
                            <View style={styles.overlayBtns}>
                                <TouchableOpacity style={[styles.overlayBtn, styles.approveBtn]} onPress={executeApprove} disabled={busy}>
                                    {busy
                                        ? <ActivityIndicator color="#fff" size="small" />
                                        : <Text style={styles.overlayBtnTxt}>✅ Yes, Approve</Text>}
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.overlayBtn, styles.cancelBtn]} onPress={cancelConfirm} disabled={busy}>
                                    <Text style={styles.overlayBtnTxt}>Cancel</Text>
                                </TouchableOpacity>
                            </View>
                        </>
                    )}

                    {confirmType === 'reject' && (
                        <>
                            <Text style={styles.overlayQ}>Rejection reason (required):</Text>
                            <TextInput
                                style={styles.reasonInput}
                                placeholder="Enter reason for rejection..."
                                placeholderTextColor="#9CA3AF"
                                value={rejectReason}
                                onChangeText={setRejectReason}
                                multiline
                                numberOfLines={3}
                                textAlignVertical="top"
                                autoFocus
                            />
                            <View style={styles.overlayBtns}>
                                <TouchableOpacity style={[styles.overlayBtn, styles.rejectBtn]} onPress={executeReject} disabled={busy}>
                                    {busy
                                        ? <ActivityIndicator color="#fff" size="small" />
                                        : <Text style={styles.overlayBtnTxt}>❌ Confirm Reject</Text>}
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.overlayBtn, styles.cancelBtn]} onPress={cancelConfirm} disabled={busy}>
                                    <Text style={styles.overlayBtnTxt}>Cancel</Text>
                                </TouchableOpacity>
                            </View>
                        </>
                    )}
                </View>
            )}

            {/* ── Tabs (original structure) ── */}
            <View style={styles.tabContainer}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'pending' && styles.activeTab]}
                    onPress={() => setActiveTab('pending')}
                >
                    <Text style={[styles.tabText, activeTab === 'pending' && styles.activeTabText]}>
                        Pending ({pendingListings.length})
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'approved' && styles.activeTab]}
                    onPress={() => setActiveTab('approved')}
                >
                    <Text style={[styles.tabText, activeTab === 'approved' && styles.activeTabText]}>
                        Approved ({approvedListings.length})
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'rejected' && styles.activeTab]}
                    onPress={() => setActiveTab('rejected')}
                >
                    <Text style={[styles.tabText, activeTab === 'rejected' && styles.activeTabText]}>
                        Rejected ({rejectedListings.length})
                    </Text>
                </TouchableOpacity>
            </View>

            {/* ── Content (original structure) ── */}
            <ScrollView
                style={styles.content}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                {activeTab === 'pending' ? (
                    pendingListings.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyIcon}>✅</Text>
                            <Text style={styles.emptyText}>No pending listings to review</Text>
                        </View>
                    ) : (
                        pendingListings.map(listing => (
                            <ListingCard
                                key={listing.id}
                                listing={listing}
                                onApprove={handleApprove}
                                onReject={handleReject}
                                isAdmin
                            />
                        ))
                    )
                ) : activeTab === 'approved' ? (
                    approvedListings.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyIcon}>🏘️</Text>
                            <Text style={styles.emptyText}>No approved listings yet</Text>
                        </View>
                    ) : (
                        approvedListings.map(listing => (
                            <ListingCard
                                key={listing.id}
                                listing={listing}
                                isAdmin
                            />
                        ))
                    )
                ) : (
                    rejectedListings.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyIcon}>❌</Text>
                            <Text style={styles.emptyText}>No rejected listings</Text>
                        </View>
                    ) : (
                        rejectedListings.map(listing => (
                            <ListingCard
                                key={listing.id}
                                listing={listing}
                                isAdmin
                            />
                        ))
                    )
                )}
            </ScrollView>

            {/* Floating Action Button */}
            <TouchableOpacity
                style={styles.fab}
                onPress={() => router.push('/(admin)/marketplace/create')}
            >
                <Ionicons name="add" size={28} color="#fff" />
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F7FA'
    },
    // Feedback banner (global, shows after confirm panel closes)
    banner: {
        paddingHorizontal: 16, paddingVertical: 10,
    },
    bannerTxt: { fontSize: 14, fontWeight: '600' },

    // Inline confirm/reject overlay
    overlay: {
        backgroundColor: '#1F2937',
        margin: 12,
        borderRadius: 14,
        padding: 16,
    },
    overlayFeedback: { borderRadius: 8, padding: 8, marginBottom: 10 },
    overlayFeedbackTxt: { fontSize: 13, fontWeight: '600' },
    overlayQ: { color: '#F9FAFB', fontSize: 15, fontWeight: '600', marginBottom: 12 },
    reasonInput: {
        backgroundColor: '#374151',
        color: '#F9FAFB',
        borderRadius: 10,
        padding: 12,
        fontSize: 14,
        minHeight: 90,
        marginBottom: 12,
    },
    overlayBtns: { flexDirection: 'row', gap: 10 },
    overlayBtn: { flex: 1, paddingVertical: 11, borderRadius: 10, alignItems: 'center' },
    overlayBtnTxt: { color: '#fff', fontSize: 14, fontWeight: '700' },
    approveBtn: { backgroundColor: '#16A34A' },
    rejectBtn: { backgroundColor: '#DC2626' },
    cancelBtn: { backgroundColor: '#4B5563' },

    // Original styles preserved exactly
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#EEE'
    },
    tab: {
        flex: 1,
        paddingVertical: 16,
        alignItems: 'center',
        borderBottomWidth: 2,
        borderBottomColor: 'transparent'
    },
    activeTab: {
        borderBottomColor: '#007AFF'
    },
    tabText: {
        fontSize: 16,
        color: '#666',
        fontWeight: '500'
    },
    activeTabText: {
        color: '#007AFF',
        fontWeight: '600'
    },
    content: {
        flex: 1,
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
    emptyText: {
        fontSize: 16,
        color: '#999'
    },
    fab: {
        position: 'absolute',
        bottom: 20,
        right: 20,
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#007AFF',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 4
    }
});
