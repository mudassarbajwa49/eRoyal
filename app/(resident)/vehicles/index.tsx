// Resident Vehicles Index
// Tab view: My Registered Vehicles + Entry Logs

import { Stack, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors, Spacing, Typography } from '../../../constants/designSystem';
import { Button } from '../../../src/components/common/Button';
import { Card } from '../../../src/components/common/Card';
import { SkeletonLoader } from '../../../src/components/common/SkeletonLoader';
import { StatusBadge } from '../../../src/components/common/StatusBadge';
import { useAuth } from '../../../src/contexts/AuthContext';
import { getResidentVehicleLogs } from '../../../src/services/VehicleEntryLogService';
import { deleteVehicle, getResidentVehicles } from '../../../src/services/vehicleRegistrationService';
import { RegisteredVehicle, VehicleLog } from '../../../src/types';

type TabType = 'vehicles' | 'logs';

export default function VehiclesIndex() {
    const router = useRouter();
    const { userProfile } = useAuth();
    const [activeTab, setActiveTab] = useState<TabType>('vehicles');
    const [vehicles, setVehicles] = useState<RegisteredVehicle[]>([]);
    const [logs, setLogs] = useState<VehicleLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        if (!userProfile) return;

        setLoading(true);
        const [vehiclesResult, logsResult] = await Promise.all([
            getResidentVehicles(userProfile.uid),
            getResidentVehicleLogs(userProfile.uid)
        ]);
        setVehicles(vehiclesResult);
        setLogs(logsResult);
        setLoading(false);
    };

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    }, [userProfile]);

    const handleAddVehicle = () => {
        router.push('/(resident)/vehicles/add' as any);
    };

    const handleDeleteVehicle = async (vehicle: RegisteredVehicle) => {
        if (!userProfile || !vehicle.id) return;

        const confirmed = window.confirm(`Delete vehicle ${vehicle.vehicleNo}?`);
        if (confirmed) {
            const result = await deleteVehicle(vehicle.id, userProfile.uid);
            if (result.success) {
                window.alert('Vehicle deleted successfully');
                loadData();
            } else {
                window.alert('Error: ' + (result.error || 'Failed to delete vehicle'));
            }
        }
    };

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

    const getVehicleIcon = (type: string) => {
        switch (type) {
            case 'Car': return '🚗';
            case 'Bike': return '🏍️';
            default: return '🚙';
        }
    };

    const renderVehicle = useCallback(({ item }: { item: RegisteredVehicle }) => (
        <Card style={styles.card}>
            <View style={styles.vehicleHeader}>
                <View style={styles.vehicleInfo}>
                    <Text style={styles.vehicleIcon}>{getVehicleIcon(item.type)}</Text>
                    <View>
                        <Text style={styles.vehicleNo}>{item.vehicleNo}</Text>
                        <Text style={styles.vehicleType}>{item.type}{item.color ? ` • ${item.color}` : ''}</Text>
                    </View>
                </View>
                <StatusBadge status={item.type} />
            </View>
            <View style={styles.vehicleActions}>
                <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDeleteVehicle(item)}
                >
                    <Text style={styles.deleteButtonText}>🗑️ Delete</Text>
                </TouchableOpacity>
            </View>
        </Card>
    ), [userProfile]);

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

    const keyExtractor = useCallback((item: RegisteredVehicle | VehicleLog) => item.id!, []);

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
                {/* Tab Bar */}
                <View style={styles.tabBar}>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'vehicles' && styles.activeTab]}
                        onPress={() => setActiveTab('vehicles')}
                    >
                        <Text style={[styles.tabText, activeTab === 'vehicles' && styles.activeTabText]}>
                            My Vehicles ({vehicles.length})
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'logs' && styles.activeTab]}
                        onPress={() => setActiveTab('logs')}
                    >
                        <Text style={[styles.tabText, activeTab === 'logs' && styles.activeTabText]}>
                            Entry Logs ({logs.length})
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Add Vehicle Button (only on vehicles tab) */}
                {activeTab === 'vehicles' && (
                    <View style={styles.addButtonContainer}>
                        <Button
                            title="+ Add Vehicle"
                            onPress={handleAddVehicle}
                            variant="primary"
                        />
                    </View>
                )}

                {/* Content */}
                {activeTab === 'vehicles' ? (
                    <FlatList
                        data={vehicles}
                        renderItem={renderVehicle}
                        keyExtractor={keyExtractor}
                        contentContainerStyle={styles.list}
                        refreshControl={
                            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                        }
                        ListEmptyComponent={
                            <View style={styles.emptyState}>
                                <Text style={styles.emptyIcon}>🚗</Text>
                                <Text style={styles.emptyText}>No vehicles registered</Text>
                                <Text style={styles.emptySubtext}>
                                    Add your vehicles to track them easily
                                </Text>
                            </View>
                        }
                        removeClippedSubviews
                        maxToRenderPerBatch={15}
                    />
                ) : (
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
                                <Text style={styles.emptyIcon}>📋</Text>
                                <Text style={styles.emptyText}>No entry logs yet</Text>
                                <Text style={styles.emptySubtext}>
                                    Vehicle entry/exit records will appear here
                                </Text>
                            </View>
                        }
                        removeClippedSubviews
                        maxToRenderPerBatch={15}
                    />
                )}
            </View>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background.secondary,
    },
    tabBar: {
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
        borderBottomColor: Colors.primary[500],
    },
    tabText: {
        fontSize: Typography.fontSize.sm,
        fontWeight: Typography.fontWeight.medium,
        color: Colors.text.secondary,
    },
    activeTabText: {
        color: Colors.primary[500],
        fontWeight: Typography.fontWeight.semibold,
    },
    addButtonContainer: {
        padding: Spacing.md,
        backgroundColor: Colors.background.primary,
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
    vehicleHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.md,
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
    vehicleType: {
        fontSize: Typography.fontSize.sm,
        color: Colors.text.secondary,
        marginTop: 2,
    },
    vehicleActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        borderTopWidth: 1,
        borderTopColor: Colors.border.light,
        paddingTop: Spacing.md,
    },
    deleteButton: {
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.md,
    },
    deleteButtonText: {
        fontSize: Typography.fontSize.sm,
        color: Colors.error.main,
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
