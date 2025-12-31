// Resident Bills Index
// View all bills and navigate to payment

import { Stack, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BillCard } from '../../../src/components/bills/BillCard';
import { LoadingSpinner } from '../../../src/components/common/LoadingSpinner';
import { useAuth } from '../../../src/contexts/AuthContext';
import { getResidentBills } from '../../../src/services/billService';
import { Bill } from '../../../src/types';

export default function BillsIndex() {
    const { userProfile } = useAuth();
    const router = useRouter();
    const [bills, setBills] = useState<Bill[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [filter, setFilter] = useState<'all' | 'unpaid' | 'pending' | 'paid'>('all');

    useEffect(() => {
        loadBills();
    }, []);

    const loadBills = async () => {
        if (!userProfile) return;

        setLoading(true);
        const result = await getResidentBills(userProfile.uid);
        setBills(result);
        setLoading(false);
    };

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await loadBills();
        setRefreshing(false);
    }, [userProfile]);

    const handlePayPress = useCallback((billId: string) => {
        router.push(`/(resident)/bills/${billId}` as any);
    }, [router]);

    const filteredBills = bills.filter(bill => {
        if (filter === 'all') return true;
        return bill.status.toLowerCase() === filter;
    });

    const renderBill = useCallback(({ item }: { item: Bill }) => (
        <BillCard
            bill={item}
            onPayPress={handlePayPress}
        />
    ), [handlePayPress]);

    const keyExtractor = useCallback((item: Bill) => item.id!, []);

    if (loading) {
        return <LoadingSpinner message="Loading bills..." />;
    }

    return (
        <>
            <Stack.Screen options={{ title: 'My Bills' }} />
            <View style={styles.container}>
                {/* Filter Tabs */}
                <View style={styles.filterContainer}>
                    {(['all', 'unpaid', 'pending', 'paid'] as const).map((f) => (
                        <TouchableOpacity
                            key={f}
                            style={[styles.filterTab, filter === f && styles.activeTab]}
                            onPress={() => setFilter(f)}
                        >
                            <Text style={[styles.filterText, filter === f && styles.activeFilterText]}>
                                {f.charAt(0).toUpperCase() + f.slice(1)}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Bills List - Using FlatList for performance */}
                <FlatList
                    data={filteredBills}
                    renderItem={renderBill}
                    keyExtractor={keyExtractor}
                    contentContainerStyle={styles.list}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyIcon}>📋</Text>
                            <Text style={styles.emptyText}>No bills found</Text>
                        </View>
                    }
                    removeClippedSubviews
                    maxToRenderPerBatch={10}
                    windowSize={10}
                />
            </View>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F7FA'
    },
    filterContainer: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        paddingHorizontal: 16,
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
        fontSize: 14,
        color: '#666',
        fontWeight: '500'
    },
    activeFilterText: {
        color: '#007AFF',
        fontWeight: '600'
    },
    list: {
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
    }
});
