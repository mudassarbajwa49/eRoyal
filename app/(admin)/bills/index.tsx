// Admin Bills Index
// View and manage all bills

import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BillCard } from '../../../src/components/bills/BillCard';
import { Button } from '../../../src/components/common/Button';
import { LoadingSpinner } from '../../../src/components/common/LoadingSpinner';
import { getAllBills } from '../../../src/services/billService';
import { Bill } from '../../../src/types';

export default function BillsIndex() {
    const router = useRouter();
    const [bills, setBills] = useState<Bill[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [filter, setFilter] = useState<'all' | 'unpaid' | 'pending' | 'paid'>('all');

    useEffect(() => {
        loadBills();
    }, []);

    const loadBills = async () => {
        setLoading(true);
        const result = await getAllBills();
        setBills(result);
        setLoading(false);
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadBills();
        setRefreshing(false);
    };

    const filteredBills = bills.filter(bill => {
        if (filter === 'all') return true;
        return bill.status.toLowerCase() === filter;
    });

    if (loading) {
        return <LoadingSpinner message="Loading bills..." />;
    }

    return (
        <View style={styles.container}>
            {/* Header Actions */}
            <View style={styles.header}>
                <Button
                    title="Create Bill"
                    onPress={() => router.push('/(admin)/bills/create')}
                    style={styles.createButton}
                />
                <Button
                    title="Verify Payments"
                    onPress={() => router.push('/(admin)/bills/verify')}
                    variant="success"
                    style={styles.verifyButton}
                />
            </View>

            {/* Filter Tabs */}
            <View style={styles.filterContainer}>
                <TouchableOpacity
                    style={[styles.filterTab, filter === 'all' && styles.activeTab]}
                    onPress={() => setFilter('all')}
                >
                    <Text style={[styles.filterText, filter === 'all' && styles.activeFilterText]}>
                        All ({bills.length})
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.filterTab, filter === 'unpaid' && styles.activeTab]}
                    onPress={() => setFilter('unpaid')}
                >
                    <Text style={[styles.filterText, filter === 'unpaid' && styles.activeFilterText]}>
                        Unpaid ({bills.filter(b => b.status === 'Unpaid').length})
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.filterTab, filter === 'pending' && styles.activeTab]}
                    onPress={() => setFilter('pending')}
                >
                    <Text style={[styles.filterText, filter === 'pending' && styles.activeFilterText]}>
                        Pending ({bills.filter(b => b.status === 'Pending').length})
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.filterTab, filter === 'paid' && styles.activeTab]}
                    onPress={() => setFilter('paid')}
                >
                    <Text style={[styles.filterText, filter === 'paid' && styles.activeFilterText]}>
                        Paid ({bills.filter(b => b.status === 'Paid').length})
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Bills List */}
            <ScrollView
                style={styles.list}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                {filteredBills.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyIcon}>📋</Text>
                        <Text style={styles.emptyText}>No bills found</Text>
                    </View>
                ) : (
                    filteredBills.map(bill => (
                        <BillCard key={bill.id} bill={bill} isAdmin />
                    ))
                )}
            </ScrollView>
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
        padding: 16,
        gap: 12
    },
    createButton: {
        flex: 1
    },
    verifyButton: {
        flex: 1
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
    }
});
