/**
 * ListingCard — Marketplace Property Card
 *
 * Modes:
 *  isAdmin  = true  → Approve / Reject buttons for Pending listings
 *  isOwner  = true  → Self-management actions (inline, no Alert popup):
 *                     Approved  → Mark Sold | Pause | Delete
 *                     Inactive  → Reactivate | Delete
 *                     Pending   → Withdraw (delete)
 *                     Rejected  → Delete
 *                     Sold      → Delete
 *  default          → Browse view with Contact button for Approved listings
 *
 * Each destructive action uses an inline "Confirm / Cancel" step
 * so there is no Alert.alert dependency (unreliable on Expo Web).
 */

import React, { useState } from 'react';
import {
    ActivityIndicator,
    Image,
    Linking,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import {
    deactivateListing,
    deleteListing,
    markAsSold,
    reactivateListing,
} from '../../services/MarketplaceListingService';
import { Listing } from '../../types';
import { Button } from '../common/Button';
import { Card } from '../common/Card';

// ─── Types ────────────────────────────────────────────────────────────────────

type ConfirmAction = 'sold' | 'pause' | 'reactivate' | 'delete' | null;

interface ListingCardProps {
    listing: Listing;
    isAdmin?: boolean;
    isOwner?: boolean;
    onApprove?: (listingId: string) => void;
    onReject?: (listingId: string) => void;
}

// ─── Status color map ─────────────────────────────────────────────────────────

const STATUS_META: Record<string, { bg: string; text: string; label: string }> = {
    Approved: { bg: '#DCFCE7', text: '#16A34A', label: '✅ Active' },
    Pending: { bg: '#FEF9C3', text: '#CA8A04', label: '⏳ Pending' },
    Rejected: { bg: '#FEE2E2', text: '#DC2626', label: '❌ Rejected' },
    Sold: { bg: '#EDE9FE', text: '#7C3AED', label: '🏷️ Sold' },
    Inactive: { bg: '#F3F4F6', text: '#6B7280', label: '⏸️ Paused' },
};

// ─── Component ────────────────────────────────────────────────────────────────

export const ListingCard: React.FC<ListingCardProps> = ({
    listing,
    isAdmin = false,
    isOwner = false,
    onApprove,
    onReject,
}) => {
    const [busy, setBusy] = useState(false);
    const [pending, setPending] = useState<ConfirmAction>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    const id = listing.id!;

    // ── Action execution ────────────────────────────────────────────────────

    const execute = async (fn: () => Promise<{ success: boolean; error?: string; message?: string }>, ok: string) => {
        setBusy(true);
        setErrorMsg(null);
        setSuccessMsg(null);
        const res = await fn();
        setBusy(false);
        setPending(null);
        if (res.success) {
            setSuccessMsg(ok);
            setTimeout(() => setSuccessMsg(null), 3000);
        } else {
            setErrorMsg(res.error || 'Something went wrong. Please try again.');
        }
    };

    const confirm = (action: ConfirmAction) => {
        setErrorMsg(null);
        setSuccessMsg(null);
        setPending(action);
    };

    const cancel = () => setPending(null);

    const runAction = () => {
        if (!id) return;
        switch (pending) {
            case 'sold': execute(() => markAsSold(id), 'Marked as sold!'); break;
            case 'pause': execute(() => deactivateListing(id), 'Listing paused.'); break;
            case 'reactivate': execute(() => reactivateListing(id), 'Resubmitted for admin approval!'); break;
            case 'delete': execute(() => deleteListing(id), 'Listing deleted.'); break;
        }
    };

    const handleContact = () => Linking.openURL(`tel:${listing.contact}`);
    const meta = STATUS_META[listing.status] ?? STATUS_META['Pending'];

    // ── Inline confirm bar ──────────────────────────────────────────────────

    const CONFIRM_LABELS: Record<NonNullable<ConfirmAction>, string> = {
        sold: 'Mark as sold?',
        pause: 'Pause this listing?',
        reactivate: 'Resubmit for admin approval?',
        delete: 'Delete permanently?',
    };

    const ConfirmBar = () => (
        <View style={styles.confirmBar}>
            <Text style={styles.confirmText}>{CONFIRM_LABELS[pending!]}</Text>
            <View style={styles.confirmBtns}>
                <TouchableOpacity style={styles.confirmYes} onPress={runAction} disabled={busy}>
                    {busy
                        ? <ActivityIndicator color="#fff" size="small" />
                        : <Text style={styles.confirmYesText}>Yes, confirm</Text>}
                </TouchableOpacity>
                <TouchableOpacity style={styles.confirmNo} onPress={cancel} disabled={busy}>
                    <Text style={styles.confirmNoText}>Cancel</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    // ── Render ───────────────────────────────────────────────────────────────

    return (
        <Card style={styles.card}>

            {/* Property Images */}
            {listing.photos && listing.photos.length > 0 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageScroll}>
                    {listing.photos.map((photo, idx) => (
                        <Image key={idx} source={{ uri: photo }} style={styles.image} resizeMode="cover" />
                    ))}
                </ScrollView>
            )}

            {/* Header — type + status badge */}
            <View style={styles.header}>
                <View style={styles.typeRow}>
                    <View style={[styles.typeBadge, { backgroundColor: listing.type === 'Rent' ? '#EFF6FF' : '#F0FDF4' }]}>
                        <Text style={[styles.typeText, { color: listing.type === 'Rent' ? '#1D4ED8' : '#15803D' }]}>
                            {listing.type === 'Rent' ? '🏠 For Rent' : '💰 For Sale'}
                        </Text>
                    </View>
                    <View style={styles.sizePill}>
                        <Text style={styles.sizeText}>{listing.size}</Text>
                    </View>
                </View>
                {(isOwner || isAdmin) && (
                    <View style={[styles.statusBadge, { backgroundColor: meta.bg }]}>
                        <Text style={[styles.statusText, { color: meta.text }]}>{meta.label}</Text>
                    </View>
                )}
            </View>

            {/* Price */}
            <Text style={styles.price}>Rs. {listing.price?.toLocaleString()}</Text>

            {/* Location */}
            <View style={styles.infoRow}>
                <Text style={styles.infoIcon}>📍</Text>
                <Text style={styles.infoText}>{listing.location}</Text>
            </View>

            {/* Description */}
            <Text style={styles.description} numberOfLines={3}>{listing.description}</Text>

            {/* Posted by */}
            <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Posted by</Text>
                <Text style={styles.metaValue}>{listing.postedByName} · House {listing.postedByHouse}</Text>
            </View>

            {/* ── Feedback msgs ───────────────────────────────────────────── */}
            {successMsg && (
                <View style={styles.successBox}>
                    <Text style={styles.successText}>✅ {successMsg}</Text>
                </View>
            )}
            {errorMsg && (
                <View style={styles.errorBox}>
                    <Text style={styles.errorText}>⚠️ {errorMsg}</Text>
                </View>
            )}

            {/* ── Inline confirm bar ──────────────────────────────────────── */}
            {pending && <ConfirmBar />}

            {/* ── Owner actions (My Listings tab) ─────────────────────────── */}
            {isOwner && !isAdmin && !pending && (
                <View style={styles.ownerSection}>

                    {listing.status === 'Approved' && (
                        <View style={styles.actionRow}>
                            <TouchableOpacity style={[styles.btn, styles.btnSold]} onPress={() => confirm('sold')} disabled={busy}>
                                <Text style={styles.btnTxt}>🏷️ Mark Sold</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.btn, styles.btnPause]} onPress={() => confirm('pause')} disabled={busy}>
                                <Text style={styles.btnTxt}>⏸️ Pause</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.btn, styles.btnDelete]} onPress={() => confirm('delete')} disabled={busy}>
                                <Text style={styles.btnTxt}>🗑️</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {listing.status === 'Inactive' && (
                        <View style={styles.actionRow}>
                            <TouchableOpacity style={[styles.btn, styles.btnReactivate, { flex: 1 }]} onPress={() => confirm('reactivate')} disabled={busy}>
                                <Text style={styles.btnTxt}>▶️ Reactivate listing</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.btn, styles.btnDelete]} onPress={() => confirm('delete')} disabled={busy}>
                                <Text style={styles.btnTxt}>🗑️</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {listing.status === 'Pending' && (
                        <View>
                            <View style={styles.pendingNote}>
                                <Text style={styles.pendingNoteText}>⏳ Under admin review — actions locked until decision</Text>
                            </View>
                            <TouchableOpacity style={[styles.btn, styles.btnDelete, { marginTop: 8 }]} onPress={() => confirm('delete')} disabled={busy}>
                                <Text style={styles.btnTxt}>↩️ Withdraw listing</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {listing.status === 'Rejected' && (
                        <View>
                            {listing.rejectionReason ? (
                                <View style={styles.rejectionBox}>
                                    <Text style={styles.rejectionLabel}>Admin feedback:</Text>
                                    <Text style={styles.rejectionText}>{listing.rejectionReason}</Text>
                                </View>
                            ) : null}
                            <TouchableOpacity style={[styles.btn, styles.btnDelete, { marginTop: 8 }]} onPress={() => confirm('delete')} disabled={busy}>
                                <Text style={styles.btnTxt}>🗑️ Delete listing</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {listing.status === 'Sold' && (
                        <View style={styles.actionRow}>
                            <View style={[styles.pendingNote, { flex: 1, backgroundColor: '#EDE9FE' }]}>
                                <Text style={[styles.pendingNoteText, { color: '#7C3AED' }]}>🎉 This property has been marked as sold</Text>
                            </View>
                            <TouchableOpacity style={[styles.btn, styles.btnDelete]} onPress={() => confirm('delete')} disabled={busy}>
                                <Text style={styles.btnTxt}>🗑️</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            )}

            {/* ── Admin actions ───────────────────────────────────────────── */}
            {isAdmin && listing.status === 'Pending' && (
                <View style={styles.adminRow}>
                    <Button title="✅ Approve" onPress={() => onApprove?.(id)} variant="success" style={styles.halfBtn} />
                    <Button title="❌ Reject" onPress={() => onReject?.(id)} variant="danger" style={styles.halfBtn} />
                </View>
            )}

            {/* ── Browse contact ──────────────────────────────────────────── */}
            {!isAdmin && !isOwner && listing.status === 'Approved' && (
                <Button title={`📞 Contact: ${listing.contact}`} onPress={handleContact} variant="primary" fullWidth style={styles.contactBtn} />
            )}

            {/* Rejection reason in admin view */}
            {isAdmin && listing.rejectionReason && (
                <View style={styles.rejectionBox}>
                    <Text style={styles.rejectionLabel}>Rejection Reason:</Text>
                    <Text style={styles.rejectionText}>{listing.rejectionReason}</Text>
                </View>
            )}
        </Card>
    );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    card: { marginBottom: 16 },

    // Images
    imageScroll: { marginBottom: 16, marginHorizontal: -16, paddingHorizontal: 16 },
    image: { width: 260, height: 185, borderRadius: 12, marginRight: 12 },

    // Header
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
    typeRow: { flexDirection: 'row', gap: 8, flexShrink: 1 },
    typeBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
    typeText: { fontSize: 13, fontWeight: '700' },
    sizePill: { backgroundColor: '#F3F4F6', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
    sizeText: { fontSize: 13, color: '#374151' },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
    statusText: { fontSize: 12, fontWeight: '700' },

    // Info
    price: { fontSize: 26, fontWeight: '800', color: '#16A34A', marginBottom: 10 },
    infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    infoIcon: { fontSize: 14, marginRight: 6 },
    infoText: { fontSize: 14, color: '#374151', fontWeight: '500' },
    description: { fontSize: 14, color: '#6B7280', lineHeight: 20, marginBottom: 12 },
    metaRow: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#E5E7EB', paddingTop: 10, marginBottom: 4 },
    metaLabel: { fontSize: 11, color: '#9CA3AF', marginBottom: 2 },
    metaValue: { fontSize: 13, color: '#374151', fontWeight: '500' },

    // Feedback
    successBox: { backgroundColor: '#DCFCE7', borderRadius: 8, padding: 10, marginTop: 10 },
    successText: { color: '#16A34A', fontSize: 13, fontWeight: '600' },
    errorBox: { backgroundColor: '#FEE2E2', borderRadius: 8, padding: 10, marginTop: 10 },
    errorText: { color: '#DC2626', fontSize: 13, fontWeight: '600' },

    // Inline confirm bar
    confirmBar: { backgroundColor: '#1F2937', borderRadius: 12, padding: 14, marginTop: 12 },
    confirmText: { color: '#F9FAFB', fontSize: 14, fontWeight: '600', marginBottom: 10 },
    confirmBtns: { flexDirection: 'row', gap: 8 },
    confirmYes: { flex: 1, backgroundColor: '#DC2626', paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
    confirmYesText: { color: '#fff', fontSize: 13, fontWeight: '700' },
    confirmNo: { backgroundColor: '#374151', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
    confirmNoText: { color: '#D1D5DB', fontSize: 13, fontWeight: '600' },

    // Owner section
    ownerSection: { marginTop: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#E5E7EB', paddingTop: 12 },
    actionRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
    btn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    btnTxt: { color: '#fff', fontSize: 13, fontWeight: '700' },
    btnSold: { backgroundColor: '#7C3AED', flex: 1 },
    btnPause: { backgroundColor: '#D97706', flex: 1 },
    btnReactivate: { backgroundColor: '#059669' },
    btnDelete: { backgroundColor: '#DC2626' },
    pendingNote: { backgroundColor: '#FEF3C7', borderRadius: 8, padding: 10, marginBottom: 4 },
    pendingNoteText: { fontSize: 12, color: '#92400E', fontWeight: '500' },

    // Admin
    adminRow: { flexDirection: 'row', gap: 12, marginTop: 14 },
    halfBtn: { flex: 1 },
    contactBtn: { marginTop: 12 },

    // Rejection
    rejectionBox: { backgroundColor: '#FFF1F2', padding: 12, borderRadius: 10, marginTop: 10 },
    rejectionLabel: { fontSize: 12, fontWeight: '700', color: '#BE123C', marginBottom: 4 },
    rejectionText: { fontSize: 13, color: '#374151' },
});
