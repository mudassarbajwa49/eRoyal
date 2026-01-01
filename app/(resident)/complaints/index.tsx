/**
 * Resident Complaints
 * Track and manage your submitted complaints
 * 
 * This screen shows:
 * - All your complaints with real-time updates
 * - Filter by status (All, Pending, In Progress, Resolved)
 * - Create new complaint button
 */

import { Stack, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors, Spacing, Typography } from '../../../constants/designSystem';
import { Button } from '../../../src/components/common/Button';
import { SkeletonLoader } from '../../../src/components/common/SkeletonLoader';
import { ComplaintCard } from '../../../src/components/complaints/ComplaintCard';
import { useAuth } from '../../../src/contexts/AuthContext';
import { useBreakpoint } from '../../../src/hooks/useResponsive';
import { Complaint } from '../../../src/types';

export default function ComplaintsIndex() {
    const { userProfile } = useAuth();
    const router = useRouter();
    const breakpoint = useBreakpoint();
    const [complaints, setComplaints] = useState<Complaint[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [statusFilter, setStatusFilter] = useState<'all' | 'Pending' | 'In Progress' | 'Resolved'>('all');

    /**
     * Set up real-time listener for resident's complaints
     * Updates automatically when complaints change
     */
    useEffect(() => {
        if (!userProfile) {
            console.log('⚠️ No user profile yet, skipping complaints listener');
            return;
        }

        console.log('🔄 Setting up real-time listener for complaints');
        console.log('   User ID:', userProfile.uid);
        console.log('   User Name:', userProfile.name);
        console.log('   User Role:', userProfile.role);

        const { onSnapshot, collection, query, where, orderBy } = require('firebase/firestore');
        const { db } = require('../../../firebaseConfig');

        const q = query(
            collection(db, 'complaints'),
            where('residentId', '==', userProfile.uid),
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(q,
            (snapshot: any) => {
                const complaintsData: Complaint[] = [];
                snapshot.forEach((doc: any) => {
                    const data = doc.data();
                    complaintsData.push({
                        id: doc.id,
                        ...data,
                    } as Complaint);
                    console.log('   📄 Complaint found:', {
                        id: doc.id,
                        title: data.title,
                        residentId: data.residentId,
                        status: data.status
                    });
                });
                console.log(`✅ Complaints updated: ${complaintsData.length} total complaints`);
                if (complaintsData.length === 0) {
                    console.log('   ℹ️ No complaints found for user:', userProfile.uid);
                    console.log('   ℹ️ Make sure complaints in Firebase have residentId field matching this UID');
                }
                setComplaints(complaintsData);
                setLoading(false);
            },
            (error: any) => {
                console.error('❌ Error listening to complaints:', error);
                console.error('   Error code:', error.code);
                console.error('   Error message:', error.message);
                setLoading(false);
            }
        );

        return () => {
            console.log('🧹 Cleaning up complaints listener');
            unsubscribe();
        };
    }, [userProfile]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        // Data refreshes automatically via listener
        setTimeout(() => setRefreshing(false), 500);
    }, []);

    const handleComplaintPress = useCallback((complaint: Complaint) => {
        router.push(`/(resident)/complaints/${complaint.id}` as any);
    }, [router]);

    // Filter complaints by status (memoized for performance)
    const filteredComplaints = useMemo(() => {
        if (statusFilter === 'all') return complaints;
        return complaints.filter(complaint => complaint.status === statusFilter);
    }, [complaints, statusFilter]);

    // Count complaints by status (memoized for tab badges)
    const counts = useMemo(() => ({
        all: complaints.length,
        pending: complaints.filter(c => c.status === 'Pending').length,
        inProgress: complaints.filter(c => c.status === 'In Progress').length,
        resolved: complaints.filter(c => c.status === 'Resolved').length,
    }), [complaints]);

    const renderComplaint = useCallback(({ item }: { item: Complaint }) => (
        <ComplaintCard complaint={item} onPress={handleComplaintPress} />
    ), [handleComplaintPress]);

    const keyExtractor = useCallback((item: Complaint) => item.id!, []);

    if (loading) {
        return (
            <View style={styles.container}>
                <View style={styles.header}>
                    <SkeletonLoader variant="text" />
                </View>
                <View style={styles.list}>
                    <SkeletonLoader variant="card" count={4} />
                </View>
            </View>
        );
    }

    return (
        <>
            <Stack.Screen options={{ title: 'My Complaints' }} />
            <View style={styles.container}>
                {/* Header with CTA */}
                <View style={styles.header}>
                    <View style={styles.headerContent}>
                        <Text style={styles.headerTitle}>Track Your Complaints</Text>
                        <Text style={styles.headerSubtitle}>
                            {complaints.length} total complaint{complaints.length !== 1 ? 's' : ''}
                        </Text>
                    </View>
                    <Button
                        title="+ New Complaint"
                        onPress={() => router.push('/(resident)/complaints/create')}
                        fullWidth
                    />
                </View>

                {/* Status Filter Tabs */}
                <View style={styles.tabsContainer}>
                    <TouchableOpacity
                        style={[styles.tab, statusFilter === 'all' && styles.activeTab]}
                        onPress={() => setStatusFilter('all')}
                    >
                        <Text style={[styles.tabText, statusFilter === 'all' && styles.activeTabText]}>
                            All ({counts.all})
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tab, statusFilter === 'Pending' && styles.activeTab]}
                        onPress={() => setStatusFilter('Pending')}
                    >
                        <Text style={[styles.tabText, statusFilter === 'Pending' && styles.activeTabText]}>
                            Pending ({counts.pending})
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tab, statusFilter === 'In Progress' && styles.activeTab]}
                        onPress={() => setStatusFilter('In Progress')}
                    >
                        <Text style={[styles.tabText, statusFilter === 'In Progress' && styles.activeTabText]}>
                            In Progress ({counts.inProgress})
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tab, statusFilter === 'Resolved' && styles.activeTab]}
                        onPress={() => setStatusFilter('Resolved')}
                    >
                        <Text style={[styles.tabText, statusFilter === 'Resolved' && styles.activeTabText]}>
                            Resolved ({counts.resolved})
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Complaints List */}
                <FlatList
                    data={filteredComplaints}
                    renderItem={renderComplaint}
                    keyExtractor={keyExtractor}
                    contentContainerStyle={styles.list}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyIcon}>🛠</Text>
                            <Text style={styles.emptyText}>No complaints submitted</Text>
                            <Text style={styles.emptySubtext}>
                                Tap the button above to submit your first complaint
                            </Text>
                        </View>
                    }
                    removeClippedSubviews
                    maxToRenderPerBatch={10}
                />
            </View>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background.secondary,
    },
    header: {
        padding: Spacing.lg,
        backgroundColor: Colors.background.primary,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border.light,
    },
    headerContent: {
        marginBottom: Spacing.md,
    },
    headerTitle: {
        fontSize: Typography.fontSize.xl,
        fontWeight: Typography.fontWeight.bold,
        color: Colors.text.primary,
        marginBottom: Spacing.xs,
    },
    headerSubtitle: {
        fontSize: Typography.fontSize.base,
        color: Colors.text.secondary,
    },
    list: {
        padding: Spacing.lg,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: Spacing['5xl'],
    },
    tabsContainer: {
        flexDirection: 'row',
        backgroundColor: Colors.background.primary,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border.light,
    },
    tab: {
        flex: 1,
        paddingVertical: Spacing.md,
        alignItems: 'center',
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    activeTab: {
        borderBottomColor: Colors.primary[600],
    },
    tabText: {
        fontSize: 13,
        fontWeight: '500',
        color: Colors.text.secondary,
    },
    activeTabText: {
        color: Colors.primary[600],
        fontWeight: '600',
    },
    resolvedTag: {
        fontSize: 12,
        color: '#66BB6A',
        fontWeight: '600',
    },
    chargeContainer: {
        marginTop: 12,
        padding: 12,
        backgroundColor: '#FFF3E0',
        borderRadius: 8,
        borderLeftWidth: 3,
        borderLeftColor: '#FF9800',
    },
    chargeRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    chargeLabel: {
        fontSize: 13,
        color: '#666',
        fontWeight: '500',
    },
    chargeAmount: {
        fontSize: 18,
        fontWeight: '700',
        color: '#F57C00',
    },
    billNote: {
        fontSize: 11,
        color: '#66BB6A',
        fontWeight: '600',
    },
    emptyIcon: {
        fontSize: 64,
        marginBottom: Spacing.lg,
    },
    emptyText: {
        fontSize: Typography.fontSize.xl,
        fontWeight: Typography.fontWeight.semibold,
        color: Colors.text.primary,
        marginBottom: Spacing.xs,
    },
    emptySubtext: {
        fontSize: Typography.fontSize.base,
        color: Colors.text.tertiary,
        textAlign: 'center',
        paddingHorizontal: Spacing['2xl'],
    },
});
