// Resident Vehicles Index
// View vehicle entry/exit logs

import { Stack } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { Card } from '../../../src/components/common/Card';
import { LoadingSpinner } from '../../../src/components/common/LoadingSpinner';
import { useAuth } from '../../../src/contexts/AuthContext';
import { getResidentVehicleLogs } from '../../../src/services/vehicleService';
import { VehicleLog } from '../../../src/types';

export default function VehiclesIndex() {
    const { userProfile } = useAuth();
    const [logs, setLogs] = useState<VehicleLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        loadLogs();
    }, []);

    const loadLogs = async () => {
        if (!userProfile) return;

        setLoading(true);
        const result = await getResidentVehicleLogs(userProfile.uid);
        setLogs(result);
        setLoading(false);
    };

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await loadLogs();
        setRefreshing(false);
    }, [userProfile]);

    const formatTime = (timestamp: any): string => {
        if (!timestamp) return 'N/A';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleString();
    };

    const renderLog = useCallback(({ item }: { item: VehicleLog }) => (
        <Card>
            <View style={styles.logHeader}>
                <Text style={styles.vehicleNo}>{item.vehicleNo}</Text>
                <View style={[styles.statusBadge, { backgroundColor: item.exitTime ? '#8E8E93' : '#34C759' }]}>
                    <Text style={styles.statusText}>
                        {item.exitTime ? 'Exited' : 'Inside'}
                    </Text>
                </View>
            </View>

            <View style={styles.timeContainer}>
                <View style={styles.timeRow}>
                    <Text style={styles.label}>Entry:</Text>
                    <Text style={styles.time}>{formatTime(item.entryTime)}</Text>
                </View>
                {item.exitTime && (
                    <View style={styles.timeRow}>
                        <Text style={styles.label}>Exit:</Text>
                        <Text style={styles.time}>{formatTime(item.exitTime)}</Text>
                    </View>
                )}
            </View>

            <Text style={styles.loggedBy}>
                Logged by: {item.loggedByName}
            </Text>
        </Card>
    ), []);

    const keyExtractor = useCallback((item: VehicleLog) => item.id!, []);

    if (loading) {
        return <LoadingSpinner message="Loading vehicle logs..." />;
    }

    return (
        <>
            <Stack.Screen options={{ title: 'My Vehicles' }} />
            <FlatList
                data={logs}
                renderItem={renderLog}
                keyExtractor={keyExtractor}
                contentContainerStyle={styles.list}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyIcon}>🚗</Text>
                        <Text style={styles.emptyText}>No vehicle logs yet</Text>
                    </View>
                }
                removeClippedSubviews
                maxToRenderPerBatch={15}
            />
        </>
    );
}

const styles = StyleSheet.create({
    list: {
        padding: 16,
        backgroundColor: '#F5F7FA'
    },
    emptyState: {
        alignItems: 'center',
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
    logHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12
    },
    vehicleNo: {
        fontSize: 18,
        fontWeight: '700',
        color: '#333'
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12
    },
    statusText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600'
    },
    timeContainer: {
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#EEE'
    },
    timeRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 6
    },
    label: {
        fontSize: 13,
        color: '#666'
    },
    time: {
        fontSize: 13,
        color: '#333'
    },
    loggedBy: {
        fontSize: 12,
        color: '#999',
        marginTop: 8,
        fontStyle: 'italic'
    }
});
