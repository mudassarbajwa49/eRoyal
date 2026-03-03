/**
 * Admin — User Detail Screen
 *
 * Shows a complete profile of any user and ALL their related records:
 *  - Profile info (name, email, house, role, CNIC, joined date)
 *  - Bills   (all, with status badges)
 *  - Complaints (all, with status badges)
 *  - Registered Vehicles (for residents)
 *  - Vehicle Entry / Exit Logs (for residents)
 *
 * Data is fetched via four targeted onSnapshot listeners so the admin
 * always sees live data without any manual refresh.
 */

import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import {
    collection,
    onSnapshot,
    orderBy,
    query,
    where,
} from 'firebase/firestore';
import React, { useEffect, useRef, useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { db } from '../../../firebaseConfig';
import { Card } from '../../../src/components/common/Card';
import { LoadingSpinner } from '../../../src/components/common/LoadingSpinner';
import { useAdminData } from '../../../src/contexts/AdminDataContext';
import { Bill, Complaint, RegisteredVehicle, VehicleLog } from '../../../src/types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTs(ts: any): string {
    if (!ts) return 'N/A';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatDateTime(ts: any): string {
    if (!ts) return 'N/A';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleString('en-US', {
        month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });
}

function StatusPill({ label, color, bg }: { label: string; color: string; bg: string }) {
    return (
        <View style={[styles.pill, { backgroundColor: bg }]}>
            <Text style={[styles.pillText, { color }]}>{label}</Text>
        </View>
    );
}

function billStatusStyle(status: string) {
    switch (status) {
        case 'Paid': return { color: '#16A34A', bg: '#DCFCE7' };
        case 'Unpaid': return { color: '#DC2626', bg: '#FEE2E2' };
        case 'Pending': return { color: '#D97706', bg: '#FEF3C7' };
        default: return { color: '#6B7280', bg: '#F3F4F6' };
    }
}

function complaintStatusStyle(status: string) {
    switch (status) {
        case 'Resolved': return { color: '#16A34A', bg: '#DCFCE7' };
        case 'In Progress': return { color: '#2563EB', bg: '#DBEAFE' };
        case 'Pending': return { color: '#D97706', bg: '#FEF3C7' };
        default: return { color: '#6B7280', bg: '#F3F4F6' };
    }
}

// ─── Section Header ───────────────────────────────────────────────────────────

function SectionHeader({ icon, title, count }: { icon: string; title: string; count: number }) {
    return (
        <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>{icon}</Text>
            <Text style={styles.sectionTitle}>{title}</Text>
            <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>{count}</Text>
            </View>
        </View>
    );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function UserDetailScreen() {
    const { uid } = useLocalSearchParams<{ uid: string }>();
    const router = useRouter();

    // Pull the user profile from AdminDataContext (already in memory from list)
    // We merge residents + security from the admin data. Since AdminDataContext
    // doesn't expose the users list, we fetch the user doc directly from the
    // collections used by the users index screen.
    const { bills: allBills, complaints: allComplaints, registeredVehicles: allVehicles } = useAdminData();

    // ── Live data scoped to this user ─────────────────────────────────────────
    const [userDoc, setUserDoc] = useState<any>(null);
    const [bills, setBills] = useState<Bill[]>([]);
    const [complaints, setComplaints] = useState<Complaint[]>([]);
    const [vehicles, setVehicles] = useState<RegisteredVehicle[]>([]);
    const [logs, setLogs] = useState<VehicleLog[]>([]);
    const [loading, setLoading] = useState(true);

    // Active tab
    const [tab, setTab] = useState<'bills' | 'complaints' | 'vehicles' | 'logs'>('bills');

    // Track ready count
    const ready = useRef(0);
    const TOTAL = 5; // profile + bills + complaints + vehicles + logs
    const markReady = () => {
        ready.current += 1;
        if (ready.current >= TOTAL) setLoading(false);
    };

    useEffect(() => {
        if (!uid) return;
        ready.current = 0;
        setLoading(true);

        const unsubs: (() => void)[] = [];

        // ── 1. User profile (try residents first, then security_staff) ─────────
        const resQ = query(collection(db, 'residents'), where('uid', '==', uid));
        unsubs.push(
            onSnapshot(resQ, (snap) => {
                if (!snap.empty) setUserDoc({ ...snap.docs[0].data(), id: snap.docs[0].id });
                markReady();
            }, () => markReady())
        );
        // Also check security_staff in parallel
        const secQ = query(collection(db, 'security_staff'), where('uid', '==', uid));
        unsubs.push(
            onSnapshot(secQ, (snap) => {
                if (!snap.empty) setUserDoc((prev: any) => prev ?? { ...snap.docs[0].data(), id: snap.docs[0].id });
                // Don't call markReady here — this is bonus, profile ready counted above
            }, () => { })
        );

        // ── 2. Bills ──────────────────────────────────────────────────────────
        unsubs.push(
            onSnapshot(
                query(collection(db, 'bills'), where('residentId', '==', uid), orderBy('createdAt', 'desc')),
                (snap) => { setBills(snap.docs.map(d => ({ id: d.id, ...d.data() } as Bill))); markReady(); },
                () => markReady()
            )
        );

        // ── 3. Complaints ─────────────────────────────────────────────────────
        unsubs.push(
            onSnapshot(
                query(collection(db, 'complaints'), where('residentId', '==', uid), orderBy('createdAt', 'desc')),
                (snap) => { setComplaints(snap.docs.map(d => ({ id: d.id, ...d.data() } as Complaint))); markReady(); },
                () => markReady()
            )
        );

        // ── 4. Registered vehicles ────────────────────────────────────────────
        unsubs.push(
            onSnapshot(
                query(collection(db, 'registeredVehicles'), where('residentId', '==', uid), orderBy('createdAt', 'desc')),
                (snap) => { setVehicles(snap.docs.map(d => ({ id: d.id, ...d.data() } as RegisteredVehicle))); markReady(); },
                () => markReady()
            )
        );

        // ── 5. Vehicle entry / exit logs ──────────────────────────────────────
        unsubs.push(
            onSnapshot(
                query(collection(db, 'vehicleLogs'), where('residentId', '==', uid), orderBy('entryTime', 'desc')),
                (snap) => { setLogs(snap.docs.map(d => ({ id: d.id, ...d.data() } as VehicleLog))); markReady(); },
                () => markReady()
            )
        );

        return () => unsubs.forEach(u => u());
    }, [uid]);

    if (loading) return <LoadingSpinner message="Loading user profile..." />;

    const profile = userDoc;
    const isResident = profile?.role === 'resident';

    // ── Summary stats ─────────────────────────────────────────────────────────
    const totalBilled = bills.reduce((s, b) => s + (b.amount || 0), 0);
    const unpaidAmount = bills.filter(b => b.status === 'Unpaid').reduce((s, b) => s + (b.amount || 0), 0);

    return (
        <>
            <Stack.Screen options={{ title: profile?.name || 'User Profile', headerShown: true }} />
            <ScrollView style={styles.container} contentContainerStyle={styles.content}>

                {/* ── Profile Card ─────────────────────────────────────────── */}
                <Card style={styles.profileCard}>
                    <View style={styles.profileHeader}>
                        <View style={[styles.avatar, { backgroundColor: isResident ? '#DCFCE7' : '#FFF3E0' }]}>
                            <Text style={[styles.avatarLetter, { color: isResident ? '#16A34A' : '#EF6C00' }]}>
                                {profile?.name?.charAt(0)?.toUpperCase() || '?'}
                            </Text>
                        </View>
                        <View style={styles.profileMeta}>
                            <Text style={styles.profileName}>{profile?.name || 'Unknown'}</Text>
                            <Text style={styles.profileEmail}>{profile?.email}</Text>
                            <StatusPill
                                label={profile?.role?.toUpperCase() || 'UNKNOWN'}
                                color={isResident ? '#16A34A' : '#D97706'}
                                bg={isResident ? '#DCFCE7' : '#FEF3C7'}
                            />
                        </View>
                    </View>

                    <View style={styles.profileFields}>
                        {isResident && (
                            <View style={styles.fieldRow}>
                                <Text style={styles.fieldLabel}>🏠 House No</Text>
                                <Text style={styles.fieldValue}>{profile?.houseNo || '—'}</Text>
                            </View>
                        )}
                        {profile?.cnic && (
                            <View style={styles.fieldRow}>
                                <Text style={styles.fieldLabel}>🪪 CNIC</Text>
                                <Text style={styles.fieldValue}>{profile.cnic}</Text>
                            </View>
                        )}
                        <View style={styles.fieldRow}>
                            <Text style={styles.fieldLabel}>📅 Joined</Text>
                            <Text style={styles.fieldValue}>{formatTs(profile?.createdAt)}</Text>
                        </View>
                        <View style={styles.fieldRow}>
                            <Text style={styles.fieldLabel}>🔑 UID</Text>
                            <Text style={[styles.fieldValue, styles.monospace]} numberOfLines={1}>{uid}</Text>
                        </View>
                    </View>

                    {/* Quick stat summary (residents only) */}
                    {isResident && (
                        <View style={styles.statRow}>
                            <View style={styles.statBox}>
                                <Text style={styles.statNum}>{bills.length}</Text>
                                <Text style={styles.statLbl}>Bills</Text>
                            </View>
                            <View style={styles.statBox}>
                                <Text style={[styles.statNum, { color: '#DC2626' }]}>
                                    PKR {unpaidAmount.toLocaleString()}
                                </Text>
                                <Text style={styles.statLbl}>Unpaid</Text>
                            </View>
                            <View style={styles.statBox}>
                                <Text style={styles.statNum}>{complaints.length}</Text>
                                <Text style={styles.statLbl}>Complaints</Text>
                            </View>
                            <View style={styles.statBox}>
                                <Text style={styles.statNum}>{vehicles.length}</Text>
                                <Text style={styles.statLbl}>Vehicles</Text>
                            </View>
                        </View>
                    )}
                </Card>

                {/* ── Tab Bar ──────────────────────────────────────────────── */}
                {isResident && (
                    <View style={styles.tabBar}>
                        {([
                            { key: 'bills', label: `💳 Bills (${bills.length})` },
                            { key: 'complaints', label: `🛠 Cases (${complaints.length})` },
                            { key: 'vehicles', label: `🚗 Cars (${vehicles.length})` },
                            { key: 'logs', label: `📋 Logs (${logs.length})` },
                        ] as const).map(t => (
                            <TouchableOpacity
                                key={t.key}
                                style={[styles.tabBtn, tab === t.key && styles.tabBtnActive]}
                                onPress={() => setTab(t.key)}
                            >
                                <Text style={[styles.tabText, tab === t.key && styles.tabTextActive]}>
                                    {t.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

                {/* ── Bills Tab ────────────────────────────────────────────── */}
                {(!isResident || tab === 'bills') && isResident && (
                    <View style={styles.section}>
                        <SectionHeader icon="💳" title="Bills" count={bills.length} />
                        {bills.length === 0 ? (
                            <Text style={styles.empty}>No bills found</Text>
                        ) : (
                            bills.map(bill => {
                                const s = billStatusStyle(bill.status);
                                return (
                                    <Card key={bill.id} style={styles.itemCard}>
                                        <View style={styles.itemRow}>
                                            <View>
                                                <Text style={styles.itemTitle}>{bill.month}</Text>
                                                <Text style={styles.itemSub}>Due: {formatTs(bill.dueDate)}</Text>
                                                {bill.breakdown?.complaintCharges?.length > 0 && (
                                                    <Text style={styles.itemSub}>
                                                        +{bill.breakdown.complaintCharges.length} complaint charge(s)
                                                    </Text>
                                                )}
                                            </View>
                                            <View style={styles.itemRight}>
                                                <Text style={styles.itemAmount}>PKR {bill.amount?.toLocaleString()}</Text>
                                                <StatusPill label={bill.status} color={s.color} bg={s.bg} />
                                            </View>
                                        </View>
                                    </Card>
                                );
                            })
                        )}
                        <View style={styles.totalRow}>
                            <Text style={styles.totalLabel}>Total Billed</Text>
                            <Text style={styles.totalValue}>PKR {totalBilled.toLocaleString()}</Text>
                        </View>
                    </View>
                )}

                {/* ── Complaints Tab ───────────────────────────────────────── */}
                {isResident && tab === 'complaints' && (
                    <View style={styles.section}>
                        <SectionHeader icon="🛠" title="Complaints" count={complaints.length} />
                        {complaints.length === 0 ? (
                            <Text style={styles.empty}>No complaints filed</Text>
                        ) : (
                            complaints.map(c => {
                                const s = complaintStatusStyle(c.status);
                                return (
                                    <Card key={c.id} style={styles.itemCard}>
                                        <View style={styles.itemRow}>
                                            <View style={{ flex: 1 }}>
                                                <Text style={styles.itemTitle}>{c.title}</Text>
                                                <Text style={styles.itemSub}>{c.category} • {formatTs(c.createdAt)}</Text>
                                                {c.chargeAmount ? (
                                                    <Text style={[styles.itemSub, { color: '#DC2626' }]}>
                                                        Charge: PKR {c.chargeAmount.toLocaleString()}
                                                    </Text>
                                                ) : null}
                                            </View>
                                            <StatusPill label={c.status} color={s.color} bg={s.bg} />
                                        </View>
                                        {c.description ? (
                                            <Text style={styles.itemDesc} numberOfLines={2}>{c.description}</Text>
                                        ) : null}
                                    </Card>
                                );
                            })
                        )}
                    </View>
                )}

                {/* ── Vehicles Tab ─────────────────────────────────────────── */}
                {isResident && tab === 'vehicles' && (
                    <View style={styles.section}>
                        <SectionHeader icon="🚗" title="Registered Vehicles" count={vehicles.length} />
                        {vehicles.length === 0 ? (
                            <Text style={styles.empty}>No vehicles registered</Text>
                        ) : (
                            vehicles.map(v => (
                                <Card key={v.id} style={styles.itemCard}>
                                    <View style={styles.itemRow}>
                                        <View>
                                            <Text style={styles.vehicleNo}>{v.vehicleNo}</Text>
                                            <Text style={styles.itemSub}>
                                                {v.type}{v.color ? ` • ${v.color}` : ''}
                                            </Text>
                                            <Text style={styles.itemSub}>Added: {formatTs(v.createdAt)}</Text>
                                        </View>
                                        <Text style={styles.vehicleIcon}>
                                            {v.type === 'Car' ? '🚗' : '🏍️'}
                                        </Text>
                                    </View>
                                </Card>
                            ))
                        )}
                    </View>
                )}

                {/* ── Logs Tab ─────────────────────────────────────────────── */}
                {isResident && tab === 'logs' && (
                    <View style={styles.section}>
                        <SectionHeader icon="📋" title="Entry / Exit Logs" count={logs.length} />
                        {logs.length === 0 ? (
                            <Text style={styles.empty}>No entry logs found</Text>
                        ) : (
                            logs.map(log => (
                                <Card key={log.id} style={styles.itemCard}>
                                    <View style={styles.itemRow}>
                                        <View>
                                            <Text style={styles.vehicleNo}>{log.vehicleNo}</Text>
                                            <Text style={styles.itemSub}>📥 In: {formatDateTime(log.entryTime)}</Text>
                                            {log.exitTime ? (
                                                <Text style={styles.itemSub}>📤 Out: {formatDateTime(log.exitTime)}</Text>
                                            ) : (
                                                <Text style={[styles.itemSub, { color: '#16A34A', fontWeight: '600' }]}>
                                                    Currently Inside
                                                </Text>
                                            )}
                                        </View>
                                        <StatusPill
                                            label={log.exitTime ? 'Exited' : 'Inside'}
                                            color={log.exitTime ? '#6B7280' : '#16A34A'}
                                            bg={log.exitTime ? '#F3F4F6' : '#DCFCE7'}
                                        />
                                    </View>
                                    <Text style={styles.loggedBy}>Logged by: {log.loggedByName}</Text>
                                </Card>
                            ))
                        )}
                    </View>
                )}

                {/* For security users — just the profile card is shown */}
                {!isResident && (
                    <Card style={styles.itemCard}>
                        <Text style={styles.empty}>
                            Security personnel don't have bills, complaints, or vehicle records.
                        </Text>
                    </Card>
                )}

            </ScrollView>
        </>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F7FA',
    },
    content: {
        padding: 16,
        paddingBottom: 40,
    },

    // Profile
    profileCard: {
        marginBottom: 16,
    },
    profileHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    avatar: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    avatarLetter: {
        fontSize: 28,
        fontWeight: '700',
    },
    profileMeta: {
        flex: 1,
        gap: 4,
    },
    profileName: {
        fontSize: 20,
        fontWeight: '700',
        color: '#111827',
    },
    profileEmail: {
        fontSize: 13,
        color: '#6B7280',
        marginBottom: 4,
    },
    profileFields: {
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
        paddingTop: 12,
        gap: 8,
    },
    fieldRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    fieldLabel: {
        fontSize: 13,
        color: '#6B7280',
    },
    fieldValue: {
        fontSize: 13,
        fontWeight: '600',
        color: '#111827',
        maxWidth: '60%',
        textAlign: 'right',
    },
    monospace: {
        fontFamily: 'monospace',
        fontSize: 11,
        color: '#6B7280',
    },

    // Stats row
    statRow: {
        flexDirection: 'row',
        marginTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
        paddingTop: 12,
    },
    statBox: {
        flex: 1,
        alignItems: 'center',
    },
    statNum: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
    },
    statLbl: {
        fontSize: 11,
        color: '#6B7280',
        marginTop: 2,
    },

    // Pill
    pill: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 12,
        alignSelf: 'flex-start',
    },
    pillText: {
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 0.3,
    },

    // Tabs
    tabBar: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 10,
        marginBottom: 12,
        padding: 4,
        gap: 2,
    },
    tabBtn: {
        flex: 1,
        paddingVertical: 8,
        alignItems: 'center',
        borderRadius: 8,
    },
    tabBtnActive: {
        backgroundColor: '#007AFF',
    },
    tabText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#6B7280',
    },
    tabTextActive: {
        color: '#fff',
    },

    // Section
    section: {
        marginBottom: 16,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
        gap: 6,
    },
    sectionIcon: {
        fontSize: 18,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
        flex: 1,
    },
    countBadge: {
        backgroundColor: '#007AFF',
        borderRadius: 10,
        paddingHorizontal: 8,
        paddingVertical: 2,
    },
    countBadgeText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '700',
    },

    // Items
    itemCard: {
        marginBottom: 8,
    },
    itemRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: 8,
    },
    itemTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 2,
    },
    itemSub: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 1,
    },
    itemRight: {
        alignItems: 'flex-end',
        gap: 4,
    },
    itemAmount: {
        fontSize: 15,
        fontWeight: '700',
        color: '#111827',
    },
    itemDesc: {
        marginTop: 6,
        fontSize: 12,
        color: '#6B7280',
        lineHeight: 18,
    },
    vehicleNo: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
        letterSpacing: 0.5,
    },
    vehicleIcon: {
        fontSize: 28,
    },
    loggedBy: {
        marginTop: 6,
        fontSize: 11,
        color: '#9CA3AF',
        fontStyle: 'italic',
    },

    // Total row
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingTop: 12,
        marginTop: 4,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
    },
    totalLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
    },
    totalValue: {
        fontSize: 14,
        fontWeight: '700',
        color: '#111827',
    },
    empty: {
        textAlign: 'center',
        color: '#9CA3AF',
        paddingVertical: 24,
        fontSize: 14,
    },
});
