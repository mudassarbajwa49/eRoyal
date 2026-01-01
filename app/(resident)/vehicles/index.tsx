// Resident Vehicles Index
// Modern vehicle tracking with status badges

import { Stack } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { Colors, Spacing, Typography } from '../../../constants/designSystem';
import { Card } from '../../../src/components/common/Card';
import { SkeletonLoader } from '../../../src/components/common/SkeletonLoader';
import { StatusBadge } from '../../../src/components/common/StatusBadge';
import { useAuth } from '../../../src/contexts/AuthContext';
import { getResidentVehicleLogs } from '../../../src/services/VehicleEntryLogService';
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
        return date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const renderLog = useCallback(({ item }: { item: VehicleLog }) => (
        <Card style={styles.card}>
            <View style={styles.logHeader}>
                <View style={styles.vehicleInfo}>
                    <Text style={styles.vehicleIcon}>🚗</Text>
                    <Text style={styles.vehicleNo}>{item.vehicleNo}</Text>
                </View>
                <StatusBadge
                    status={item.exitTime ? 'Outside' : 'Inside'}
                />
            </View>

            <View style={styles.timelineContainer}>
                <View style={styles.timelineItem}>
                    <View style={[styles.timelineDot, { backgroundColor: Colors.success.main }]} />
                    <View style={styles.timelineContent}>
                        <Text style={styles.timelineLabel}>Entry Time</Text>
                        <Text style={styles.timelineValue}>{formatTime(item.entryTime)}</Text>
                    </View>
                </View>

                {item.exitTime && (
                    <View style={styles.timelineItem}>
                        <View style={[styles.timelineDot, { backgroundColor: Colors.error.main }]} />
                        <View style={styles.timelineContent}>
                            <Text style={styles.timelineLabel}>Exit Time</Text>
                            <Text style={styles.timelineValue}>{formatTime(item.exitTime)}</Text>
                        </View>
                    </View>
                )}
            </View>

            <View style={styles.footer}>
                <Text style={styles.loggedBy}>Logged by {item.loggedByName}</Text>
            </View>
        </Card>
    ), []);

    const keyExtractor = useCallback((item: VehicleLog) => item.id!, []);

    if (loading) {
        return (
            <View style={styles.container}>
                <View style={styles.list}>
                    <SkeletonLoader variant="card" count={4} />
                </View>
            </View>
        );
    }

    return (
        <>
            <Stack.Screen options={{ title: 'My Vehicles' }} />
            <View style={styles.container}>
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
                            <Text style={styles.emptySubtext}>
                                Vehicle entry/exit records will appear here
                            </Text>
                        </View>
                    }
                    removeClippedSubviews
                    maxToRenderPerBatch={15}
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
    list: {
        padding: Spacing.lg,
    },
    card: {
        marginBottom: Spacing.md,
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: Spacing['5xl'],
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
    },
    logHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.lg,
    },
    vehicleInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    vehicleIcon: {
        fontSize: 24,
        marginRight: Spacing.sm,
    },
    vehicleNo: {
        fontSize: Typography.fontSize.xl,
        fontWeight: Typography.fontWeight.bold,
        color: Colors.text.primary,
    },
    timelineContainer: {
        paddingLeft: Spacing.sm,
        marginBottom: Spacing.md,
    },
    timelineItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: Spacing.md,
    },
    timelineDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginTop: 4,
        marginRight: Spacing.md,
    },
    timelineContent: {
        flex: 1,
    },
    timelineLabel: {
        fontSize: Typography.fontSize.sm,
        color: Colors.text.secondary,
        marginBottom: 2,
    },
    timelineValue: {
        fontSize: Typography.fontSize.base,
        color: Colors.text.primary,
        fontWeight: Typography.fontWeight.medium,
    },
    footer: {
        borderTopWidth: 1,
        borderTopColor: Colors.border.light,
        paddingTop: Spacing.md,
    },
    loggedBy: {
        fontSize: Typography.fontSize.sm,
        color: Colors.text.tertiary,
        fontStyle: 'italic',
    },
});
