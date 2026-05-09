// Resident Vehicles Index
// Tab view: My Registered Vehicles + Entry Logs

import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Alert, FlatList, Image, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors, Spacing, Typography } from '../../../constants/designSystem';
import { Button } from '../../../src/components/common/Button';
import { Card } from '../../../src/components/common/Card';
import { SkeletonLoader } from '../../../src/components/common/SkeletonLoader';
import { StatusBadge } from '../../../src/components/common/StatusBadge';
import { useAppData } from '../../../src/contexts/AppDataContext';
import { useAuth } from '../../../src/contexts/AuthContext';
import { deleteVehicle } from '../../../src/services/vehicleRegistrationService';
import { RegisteredVehicle, VehicleLog } from '../../../src/types';

type TabType = 'vehicles' | 'logs';

export default function VehiclesIndex() {
    const router = useRouter();
    const { userProfile } = useAuth();
    const { vehicles, vehicleLogs: logs, initializing } = useAppData();
    const [activeTab, setActiveTab] = useState<TabType>('vehicles');
    const [refreshing, setRefreshing] = useState(false);

    // onSnapshot keeps data live — pull-to-refresh is cosmetic feedback only
    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        setTimeout(() => setRefreshing(false), 500);
    }, []);

    const handleAddVehicle = () => {
        router.push('/(resident)/vehicles/add' as any);
    };

    const handleDeleteVehicle = async (vehicle: RegisteredVehicle) => {
        if (!userProfile || !vehicle.id) return;

        Alert.alert(
            'Delete Vehicle',
            `Delete vehicle ${vehicle.vehicleNo}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        const result = await deleteVehicle(vehicle.id!, userProfile.uid);
                        if (result.success) {
                            Alert.alert('Success', 'Vehicle deleted successfully');
                        } else {
                            Alert.alert('Error', result.error || 'Failed to delete vehicle');
                        }
                    }
                }
            ]
        );
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
            case 'Car': return <Ionicons name="car" size={24} color={Colors.text.primary} />;
            case 'Bike': return <Ionicons name="bicycle" size={24} color={Colors.text.primary} />;
            default: return <Ionicons name="car" size={24} color={Colors.text.primary} />;
        }
    };

    const renderVehicle = useCallback(({ item }: { item: RegisteredVehicle }) => (
        <Card style={styles.card}>
            <View style={styles.vehicleHeader}>
                <View style={styles.vehicleInfo}>
                    <View style={{ marginRight: Spacing.sm }}>{getVehicleIcon(item.type)}</View>
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
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Ionicons name="trash-outline" size={16} color={Colors.error.main} style={{ marginRight: 4 }} />
                        <Text style={styles.deleteButtonText}>Delete</Text>
                    </View>
                </TouchableOpacity>
            </View>
        </Card>
    ), [userProfile]);

    const renderLog = useCallback(({ item }: { item: VehicleLog }) => (
        <Card style={styles.card}>
            <View style={styles.logHeader}>
                <View style={styles.vehicleInfo}>
                    <Ionicons name="car" size={24} color={Colors.text.primary} style={{ marginRight: Spacing.sm }} />
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
                    {item.photoUrl && (
                        <Image source={{ uri: item.photoUrl }} style={styles.logPhoto} />
                    )}
                </View>

                {item.exitTime && (
                    <View style={styles.timelineItem}>
                        <View style={[styles.timelineDot, { backgroundColor: Colors.error.main }]} />
                        <View style={styles.timelineContent}>
                            <Text style={styles.timelineLabel}>Exit Time</Text>
                            <Text style={styles.timelineValue}>{formatTime(item.exitTime)}</Text>
                        </View>
                        {item.exitPhotoUrl && (
                            <Image source={{ uri: item.exitPhotoUrl }} style={styles.logPhoto} />
                        )}
                    </View>
                )}
            </View>

            <View style={styles.footer}>
                <Text style={styles.loggedBy}>Logged by {item.loggedByName}</Text>
            </View>
        </Card>
    ), []);

    const keyExtractor = useCallback((item: RegisteredVehicle | VehicleLog) => item.id!, []);

    if (initializing) {
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
                                <Ionicons name="car" size={48} color={Colors.text.tertiary} style={{ marginBottom: 12 }} />
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
                                <Ionicons name="list" size={48} color={Colors.text.tertiary} style={{ marginBottom: 12 }} />
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
    logPhoto: {
        width: 50,
        height: 50,
        borderRadius: 8,
        marginLeft: Spacing.md,
        backgroundColor: Colors.background.primary,
        borderWidth: 1,
        borderColor: Colors.border.light,
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
