/**
 * Admin Complaints Management
 * View and manage all resident complaints
 * 
 * This screen shows:
 * - All complaints with real-time updates
 * - Filter by status (All, Pending, In Progress, Resolved)
 * - Tap complaint to view/edit details  
 */

import { useRouter } from 'expo-router';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import React, { useCallback, useMemo } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { db } from '../../../firebaseConfig';
import { LoadingSpinner } from '../../../src/components/common/LoadingSpinner';
import { ComplaintCard } from '../../../src/components/complaints/ComplaintCard';
import { useBreakpoint } from '../../../src/hooks/useResponsive';
import { Complaint } from '../../../src/types';
import { fontSize, spacing } from '../../../src/utils/responsive';

export default function ComplaintsIndex() {
    const router = useRouter();
    const breakpoint = useBreakpoint();
    const [complaints, setComplaints] = React.useState<Complaint[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [refreshing, setRefreshing] = React.useState(false);
    const [statusFilter, setStatusFilter] = React.useState<'all' | 'Pending' | 'In Progress' | 'Resolved'>('all');

    /**
     * Set up real-time listener for complaints
     * Updates automatically when complaints are created/updated
     */
    React.useEffect(() => {
        console.log('🔄 Setting up real-time listener for all complaints');

        const q = query(collection(db, 'complaints'), orderBy('createdAt', 'desc'));

        const unsubscribe = onSnapshot(
            q,
            (snapshot) => {
                const complaintsData: Complaint[] = [];
                snapshot.forEach((doc) => {
                    complaintsData.push({
                        id: doc.id,
                        ...doc.data(),
                    } as Complaint);
                });
                console.log(`✅ Complaints updated: ${complaintsData.length} complaints`);
                setComplaints(complaintsData);
                setLoading(false);
            },
            (error) => {
                console.error('❌ Error listening to complaints:', error);
                setLoading(false);
            }
        );

        return () => {
            console.log('🧹 Cleaning up complaints listener');
            unsubscribe();
        };
    }, []);

    /**
     * Handle pull-to-refresh
     * Data updates automatically via real-time listener
     */
    const onRefresh = async () => {
        setRefreshing(true);
        // Just show animation - data refreshes automatically
        setTimeout(() => setRefreshing(false), 500);
    };

    /**
     * Navigate to complaint detail screen
     */
    const handleComplaintPress = useCallback((complaint: Complaint) => {
        router.push(`/(admin)/complaints/${complaint.id}` as any);
    }, [router]);

    // Filter complaints by status (memoized for performance)
    const filteredComplaints = useMemo(() => {
        if (statusFilter === 'all') return complaints;
        return complaints.filter(c => c.status === statusFilter);
    }, [complaints, statusFilter]);

    // Count complaints by status  (memoized for tab badges)
    const counts = useMemo(() => ({
        all: complaints.length,
        pending: complaints.filter(c => c.status === 'Pending').length,
        inProgress: complaints.filter(c => c.status === 'In Progress').length,
        resolved: complaints.filter(c => c.status === 'Resolved').length,
    }), [complaints]);

    /**
     * Render a single complaint card
     * Memoized to prevent unnecessary re-renders
     */
    const renderComplaint = useCallback(({ item }: { item: Complaint }) => (
        <ComplaintCard
            complaint={item}
            onPress={handleComplaintPress}
            isAdmin
        />
    ), [handleComplaintPress]);

    const keyExtractor = useCallback((item: Complaint) => item.id || '', []);

    if (loading) {
        return <LoadingSpinner message="Loading complaints..." />;
    }

    return (
        <>
            {/* Header */}
            <View style={{ ...styles.header, padding: spacing.lg }}>
                <Text style={{ ...styles.headerTitle, fontSize: breakpoint.mobile ? fontSize['2xl'] : fontSize['3xl'] }}>
                    Complaints
                </Text>
                <Text style={{ ...styles.subtitle, fontSize: fontSize.sm }}>
                    {complaints.length} total
                </Text>
            </View>

            {/* Status Filter Tabs */}
            <View style={styles.tabsContainer}>
                <TouchableOpacity
                    style={{ ...styles.tab, ...(statusFilter === 'all' && styles.activeTab) }}
                    onPress={() => setStatusFilter('all')}
                >
                    <Text style={{
                        ...styles.tabText,
                        ...(statusFilter === 'all' && styles.activeTabText),
                        fontSize: breakpoint.mobile ? fontSize.xs : fontSize.sm
                    }}>
                        All ({counts.all})
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={{ ...styles.tab, ...(statusFilter === 'Pending' && styles.activeTab) }}
                    onPress={() => setStatusFilter('Pending')}
                >
                    <Text style={{
                        ...styles.tabText,
                        ...(statusFilter === 'Pending' && styles.activeTabText),
                        fontSize: breakpoint.mobile ? fontSize.xs : fontSize.sm
                    }}>
                        Pending ({counts.pending})
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={{ ...styles.tab, ...(statusFilter === 'In Progress' && styles.activeTab) }}
                    onPress={() => setStatusFilter('In Progress')}
                >
                    <Text style={{
                        ...styles.tabText,
                        ...(statusFilter === 'In Progress' && styles.activeTabText),
                        fontSize: breakpoint.mobile ? fontSize.xs : fontSize.sm
                    }}>
                        In Progress ({counts.inProgress})
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={{ ...styles.tab, ...(statusFilter === 'Resolved' && styles.activeTab) }}
                    onPress={() => setStatusFilter('Resolved')}
                >
                    <Text style={{
                        ...styles.tabText,
                        ...(statusFilter === 'Resolved' && styles.activeTabText),
                        fontSize: breakpoint.mobile ? fontSize.xs : fontSize.sm
                    }}>
                        Resolved ({counts.resolved})
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Complaints List - Now using FlatList for virtualization */}
            <FlatList
                data={filteredComplaints}
                renderItem={renderComplaint}
                keyExtractor={keyExtractor}
                contentContainerStyle={{ padding: spacing.lg }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyIcon}>📋</Text>
                        <Text style={{ ...styles.emptyText, fontSize: fontSize.base }}>
                            {statusFilter === 'all'
                                ? 'No complaints yet'
                                : `No ${statusFilter.toLowerCase()} complaints`}
                        </Text>
                    </View>
                }
                // Performance optimizations
                removeClippedSubviews
                maxToRenderPerBatch={10}
                windowSize={10}
                initialNumToRender={8}
            />
        </>
    );
}

const styles = StyleSheet.create({
    header: {
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#EEE',
    },
    headerTitle: {
        fontWeight: '700',
        color: '#333',
        marginBottom: 4,
    },
    subtitle: {
        color: '#999',
    },
    tabsContainer: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#EEE',
    },
    tab: {
        flex: 1,
        paddingVertical: 14,
        alignItems: 'center',
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    activeTab: {
        borderBottomColor: '#007AFF',
    },
    tabText: {
        fontWeight: '500',
        color: '#666',
    },
    activeTabText: {
        color: '#007AFF',
        fontWeight: '600',
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
        color: '#999'
    },
});
