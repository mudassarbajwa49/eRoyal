// Resident Bills Index
// Modern bills interface with tabs and enhanced cards

import { Stack, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BillCard } from '../../../src/components/bills/BillCard';
import { SkeletonLoader } from '../../../src/components/common/SkeletonLoader';
import { useAuth } from '../../../src/contexts/AuthContext';
import { useBreakpoint, useResponsive } from '../../../src/hooks/useResponsive';
import { getResidentBills } from '../../../src/services/MonthlyBillingService';
import { Bill } from '../../../src/types';
import { borderRadius, fontSize, spacing } from '../../../src/utils/responsive';

export default function BillsIndex() {
    const { userProfile } = useAuth();
    const router = useRouter();
    const responsive = useResponsive();
    const breakpoint = useBreakpoint();
    const [bills, setBills] = useState<Bill[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [filter, setFilter] = useState<'all' | 'unpaid' | 'pending' | 'paid'>('all');

    useEffect(() => {
        loadBills();
    }, []);

    const loadBills = async (forceRefresh = false) => {
        if (!userProfile) return;

        setLoading(true);
        const result = await getResidentBills(userProfile.uid, false, forceRefresh);
        setBills(result);
        setLoading(false);
    };

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await loadBills(true); // Force refresh to bypass cache
        setRefreshing(false);
    }, [userProfile]);

    const handlePayPress = useCallback((billId: string) => {
        router.push(`/(resident)/bills/${billId}` as any);
    }, [router]);

    // Memoize filtered bills to prevent recalculation on every render
    const filteredBills = useMemo(() => {
        return bills.filter(bill => {
            if (filter === 'all') return true;
            return bill.status.toLowerCase() === filter;
        });
    }, [bills, filter]);

    // Memoize render function
    const renderBill = useCallback(({ item }: { item: Bill }) => (
        <BillCard
            bill={item}
            onPayPress={handlePayPress}
        />
    ), [handlePayPress]);

    const keyExtractor = useCallback((item: Bill) => item.id!, []);

    // Optimize FlatList with getItemLayout
    const getItemLayout = useCallback((data: any, index: number) => ({
        length: 180, // Approximate height of BillCard
        offset: 180 * index,
        index,
    }), []);

    if (loading) {
        return (
            <View style={styles.container}>
                <View style={styles.filterContainer}>
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
            <Stack.Screen options={{ title: 'My Bills' }} />
            <View style={styles.container}>
                {/* Modern Filter Tabs */}
                <View style={styles.filterContainer}>
                    {(['all', 'unpaid', 'pending', 'paid'] as const).map((f) => (
                        <TouchableOpacity
                            key={f}
                            style={[styles.filterTab, filter === f && styles.activeTab]}
                            onPress={() => setFilter(f)}
                            activeOpacity={0.7}
                        >
                            <Text style={[
                                styles.filterText,
                                { fontSize: breakpoint.mobile ? fontSize.sm : fontSize.base },
                                filter === f && styles.activeFilterText
                            ]}>
                                {f.charAt(0).toUpperCase() + f.slice(1)}
                            </Text>
                            {filter === f && <View style={styles.activeIndicator} />}
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Bills List */}
                <FlatList
                    data={filteredBills}
                    renderItem={renderBill}
                    keyExtractor={keyExtractor}
                    getItemLayout={getItemLayout}
                    contentContainerStyle={[styles.list, { padding: spacing.lg }]}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyIcon}>💳</Text>
                            <Text style={[styles.emptyText, { fontSize: fontSize.xl }]}>No bills found</Text>
                            <Text style={[styles.emptySubtext, { fontSize: fontSize.base }]}>
                                {filter !== 'all'
                                    ? `No ${filter} bills at the moment`
                                    : 'Your bills will appear here'}
                            </Text>
                        </View>
                    }
                    removeClippedSubviews
                    maxToRenderPerBatch={10}
                    windowSize={10}
                    initialNumToRender={8}
                />
            </View>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F7FA',
    },
    filterContainer: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: '#EEE',
    },
    filterTab: {
        flex: 1,
        paddingVertical: spacing.md,
        alignItems: 'center',
        position: 'relative',
    },
    activeTab: {
        // Active state handled by indicator
    },
    filterText: {
        color: '#666',
        fontWeight: '500',
    },
    activeFilterText: {
        color: '#007AFF',
        fontWeight: '600',
    },
    activeIndicator: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 3,
        backgroundColor: '#007AFF',
        borderTopLeftRadius: borderRadius.sm,
        borderTopRightRadius: borderRadius.sm,
    },
    list: {
        flexGrow: 1,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing['5xl'],
    },
    emptyIcon: {
        fontSize: 64,
        marginBottom: spacing.lg,
    },
    emptyText: {
        fontWeight: '600',
        color: '#333',
        marginBottom: spacing.xs,
    },
    emptySubtext: {
        color: '#999',
        textAlign: 'center',
    },
});
