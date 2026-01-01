// Admin Bills Index
// View and manage all bills

import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BillCard } from '../../../src/components/bills/BillCard';
import { Button } from '../../../src/components/common/Button';
import { LoadingSpinner } from '../../../src/components/common/LoadingSpinner';
import { useAuth } from '../../../src/contexts/AuthContext';
import { useBreakpoint } from '../../../src/hooks/useResponsive';
import { getAllBills } from '../../../src/services/MonthlyBillingService';
import { Bill } from '../../../src/types';
import { fontSize, spacing } from '../../../src/utils/responsive';

// Memoize BillCard to prevent unnecessary re-renders
const MemoizedBillCard = React.memo(BillCard);

export default function BillsIndex() {
    const router = useRouter();
    const { userProfile } = useAuth();
    const breakpoint = useBreakpoint();
    const [bills, setBills] = useState<Bill[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [filter, setFilter] = useState<'all' | 'unpaid' | 'pending' | 'paid'>('all');

    useEffect(() => {
        loadBills();
    }, []);

    const loadBills = async (forceRefresh = false) => {
        setLoading(true);
        const result = await getAllBills(true, forceRefresh);
        setBills(result);
        setLoading(false);
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadBills(true); // Force refresh to bypass cache
        setRefreshing(false);
    };

    // Memoize filtered bills
    const filteredBills = useMemo(() => {
        if (filter === 'all') return bills;
        return bills.filter(b => b.status.toLowerCase() === filter);
    }, [bills, filter]);

    // Memoize counts for filter tabs
    const counts = useMemo(() => ({
        all: bills.length,
        unpaid: bills.filter(b => b.status === 'Unpaid').length,
        pending: bills.filter(b => b.status === 'Pending').length,
        paid: bills.filter(b => b.status === 'Paid').length,
    }), [bills]);

    const handleBillPress = useCallback((bill: Bill) => {
        router.push(`/(admin)/bills/${bill.id}` as any);
    }, [router]);

    const handleGenerateBills = useCallback(() => {
        router.push('/(admin)/bills/generate' as any);
    }, [router]);

    const handleVerifyPayments = useCallback(() => {
        router.push('/(admin)/bills/verify' as any);
    }, [router]);

    // Memoize render function
    const renderBill = useCallback(({ item }: { item: Bill }) => (
        <MemoizedBillCard
            key={item.id}
            bill={item}
            isAdmin
            onPress={handleBillPress}
        />
    ), [handleBillPress]);

    const keyExtractor = useCallback((item: Bill) => item.id!, []);

    // Optimize FlatList with getItemLayout
    const getItemLayout = useCallback((data: any, index: number) => ({
        length: 180, // Approximate height of BillCard
        offset: 180 * index,
        index,
    }), []);

    if (loading) {
        return <LoadingSpinner message="Loading bills..." />;
    }

    return (
        <View style={styles.container}>
            {/* Header Actions */}
            <View style={[styles.header, { padding: spacing.lg, gap: spacing.md }]}>
                <Button
                    title="Generate Monthly Bills"
                    onPress={handleGenerateBills}
                    loading={generating}
                    variant="primary"
                    style={styles.generateButton}
                />
                <Button
                    title="Verify Payments"
                    onPress={handleVerifyPayments}
                    variant="success"
                    style={styles.verifyButton}
                />
            </View>

            {/* Filter Tabs */}
            <View style={[styles.filterContainer, { paddingHorizontal: spacing.lg }]}>
                <TouchableOpacity
                    style={[styles.filterTab, filter === 'all' && styles.activeTab]}
                    onPress={() => setFilter('all')}
                >
                    <Text style={[
                        styles.filterText,
                        { fontSize: breakpoint.mobile ? fontSize.sm : fontSize.base },
                        filter === 'all' && styles.activeFilterText
                    ]}>
                        All ({counts.all})
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.filterTab, filter === 'unpaid' && styles.activeTab]}
                    onPress={() => setFilter('unpaid')}
                >
                    <Text style={[
                        styles.filterText,
                        { fontSize: breakpoint.mobile ? fontSize.sm : fontSize.base },
                        filter === 'unpaid' && styles.activeFilterText
                    ]}>
                        Unpaid ({counts.unpaid})
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.filterTab, filter === 'pending' && styles.activeTab]}
                    onPress={() => setFilter('pending')}
                >
                    <Text style={[
                        styles.filterText,
                        { fontSize: breakpoint.mobile ? fontSize.sm : fontSize.base },
                        filter === 'pending' && styles.activeFilterText
                    ]}>
                        Pending ({counts.pending})
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.filterTab, filter === 'paid' && styles.activeTab]}
                    onPress={() => setFilter('paid')}
                >
                    <Text style={[
                        styles.filterText,
                        { fontSize: breakpoint.mobile ? fontSize.sm : fontSize.base },
                        filter === 'paid' && styles.activeFilterText
                    ]}>
                        Paid ({counts.paid})
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Bills List - Now using FlatList for virtualization */}
            <FlatList
                data={filteredBills}
                renderItem={renderBill}
                keyExtractor={keyExtractor}
                getItemLayout={getItemLayout}
                contentContainerStyle={[styles.list, { padding: spacing.lg }]}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyIcon}>📋</Text>
                        <Text style={[styles.emptyText, { fontSize: fontSize.lg }]}>No bills found</Text>
                    </View>
                }
                removeClippedSubviews
                maxToRenderPerBatch={10}
                windowSize={10}
                initialNumToRender={8}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F7FA'
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    generateButton: {
        flex: 2
    },
    verifyButton: {
        flex: 1
    },
    filterContainer: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#EEE'
    },
    filterTab: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        borderBottomWidth: 2,
        borderBottomColor: 'transparent'
    },
    activeTab: {
        borderBottomColor: '#007AFF'
    },
    filterText: {
        color: '#666',
        fontWeight: '500'
    },
    activeFilterText: {
        color: '#007AFF',
        fontWeight: '600'
    },
    list: {
        flexGrow: 1,
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
    }
});
