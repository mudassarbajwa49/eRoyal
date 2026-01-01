/**
 * Admin Vehicle Logs Screen
 * View all vehicle entry/exit logs
 * 
 * This screen shows:
 * - Currently active vehicles (inside the society)
 * - Recent vehicle logs (last 50)
 * - Pull to refresh for latest data
 */

import React from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { Card } from '../../../src/components/common/Card';
import { LoadingSpinner } from '../../../src/components/common/LoadingSpinner';
import { useBreakpoint } from '../../../src/hooks/useResponsive';
import { getActiveVehicles, getAllVehicleLogs } from '../../../src/services/VehicleEntryLogService';
import { VehicleLog } from '../../../src/types';
import { borderRadius, fontSize, spacing } from '../../../src/utils/responsive';

/**
 * Get color for vehicle type badge
 */
function getTypeColor(type: string): string {
    switch (type) {
        case 'Resident': return '#34C759';
        case 'Visitor': return '#FF9500';
        case 'Service': return '#007AFF';
        default: return '#8E8E93';
    }
}

/**
 * Format timestamp to readable date/time
 */
function formatTime(timestamp: any): string {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString();
}

export default function VehiclesIndex() {
    const breakpoint = useBreakpoint();
    const [allLogs, setAllLogs] = React.useState<VehicleLog[]>([]);
    const [activeVehicles, setActiveVehicles] = React.useState<VehicleLog[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [refreshing, setRefreshing] = React.useState(false);

    /**
     * Load vehicle logs
     * Fetches both active vehicles and recent logs in parallel
     */
    const loadLogs = async () => {
        const [all, active] = await Promise.all([
            getAllVehicleLogs(),
            getActiveVehicles()
        ]);

        // Show last 50 logs for performance
        setAllLogs(all.slice(0, 50));
        setActiveVehicles(active);
    };

    // Load logs on mount
    React.useEffect(() => {
        loadLogs().then(() => setLoading(false));
    }, []);

    /**
     * Refresh data when user pulls down
     */
    const onRefresh = async () => {
        setRefreshing(true);
        await loadLogs();
        setRefreshing(false);
    };

    /**
     * Render a single vehicle log entry
     */
    const renderLog = React.useCallback(({ item: log }: { item: VehicleLog }) => (
        <Card style={{ ...styles.logCard, marginBottom: spacing.md }}>
            {/* Header with vehicle number and type */}
            <View style={styles.logHeader}>
                <Text style={{ ...styles.vehicleNo, fontSize: fontSize.lg }}>
                    {log.vehicleNo}
                </Text>
                <View style={{
                    ...styles.typeBadge,
                    backgroundColor: getTypeColor(log.type),
                    borderRadius: borderRadius.lg
                }}>
                    <Text style={{ ...styles.typeText, fontSize: fontSize.xs }}>
                        {log.type}
                    </Text>
                </View>
            </View>

            {/* Resident info (if applicable) */}
            {log.residentName && (
                <Text style={[styles.residentInfo, { fontSize: fontSize.sm }]}>
                    {log.residentName} - {log.houseNo}
                </Text>
            )}

            {/* Visitor info (if applicable) */}
            {log.visitorName && (
                <Text style={[styles.visitorInfo, { fontSize: fontSize.sm }]}>
                    Visitor: {log.visitorName}
                    {log.purpose && `\nPurpose: ${log.purpose}`}
                </Text>
            )}

            {/* Entry/Exit times */}
            <View style={styles.timeContainer}>
                <View style={styles.timeRow}>
                    <Text style={[styles.label, { fontSize: fontSize.xs }]}>
                        Entry:
                    </Text>
                    <Text style={[styles.time, { fontSize: fontSize.xs }]}>
                        {formatTime(log.entryTime)}
                    </Text>
                </View>
                {log.exitTime && (
                    <View style={styles.timeRow}>
                        <Text style={[styles.label, { fontSize: fontSize.xs }]}>
                            Exit:
                        </Text>
                        <Text style={[styles.time, { fontSize: fontSize.xs }]}>
                            {formatTime(log.exitTime)}
                        </Text>
                    </View>
                )}
            </View>

            {/* Logged by info */}
            <Text style={[styles.loggedBy, { fontSize: fontSize.xs }]}>
                Logged by: {log.loggedByName}
            </Text>
        </Card>
    ), []);

    const keyExtractor = React.useCallback((log: VehicleLog) => log.id || '', []);

    if (loading) {
        return <LoadingSpinner message="Loading vehicle logs..." />;
    }

    return (
        <View style={styles.container}>
            {/* Active Vehicles Section */}
            <View style={{ ...styles.section, padding: spacing.lg, paddingBottom: spacing.md }}>
                <Text style={{ ...styles.sectionTitle, fontSize: fontSize.lg, marginBottom: spacing.md }}>
                    🚗 Currently Inside ({activeVehicles.length})
                </Text>

                {activeVehicles.length === 0 ? (
                    <Card>
                        <Text style={{ ...styles.emptyText, fontSize: fontSize.sm }}>
                            No vehicles currently inside
                        </Text>
                    </Card>
                ) : (
                    activeVehicles.map(log => (
                        <Card key={log.id} style={{ ...styles.logCard, marginBottom: spacing.md }}>
                            <View style={styles.logHeader}>
                                <Text style={{ ...styles.vehicleNo, fontSize: fontSize.lg }}>
                                    {log.vehicleNo}
                                </Text>
                                <View style={{
                                    ...styles.typeBadge,
                                    backgroundColor: getTypeColor(log.type),
                                    borderRadius: borderRadius.lg
                                }}>
                                    <Text style={{ ...styles.typeText, fontSize: fontSize.xs }}>
                                        {log.type}
                                    </Text>
                                </View>
                            </View>

                            {log.residentName && (
                                <Text style={{ ...styles.residentInfo, fontSize: fontSize.sm }}>
                                    {log.residentName} - {log.houseNo}
                                </Text>
                            )}

                            {log.visitorName && (
                                <Text style={{ ...styles.visitorInfo, fontSize: fontSize.sm }}>
                                    Visitor: {log.visitorName}
                                    {log.purpose && `\nPurpose: ${log.purpose}`}
                                </Text>
                            )}

                            <Text style={{ ...styles.timeText, fontSize: fontSize.xs }}>
                                Entry: {formatTime(log.entryTime)}
                            </Text>
                        </Card>
                    ))
                )}
            </View>

            {/* Recent Logs Section - Virtualized FlatList for performance */}
            <View style={{ ...styles.section, flex: 1 }}>
                <Text style={{ ...styles.sectionTitle, fontSize: fontSize.lg, marginBottom: spacing.md, paddingHorizontal: spacing.lg }}>
                    📋 Recent Logs (Last 50)
                </Text>

                <FlatList
                    data={allLogs}
                    renderItem={renderLog}
                    keyExtractor={keyExtractor}
                    contentContainerStyle={{ paddingHorizontal: spacing.lg }}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
                    // Performance optimizations
                    removeClippedSubviews
                    maxToRenderPerBatch={10}
                    windowSize={10}
                    initialNumToRender={8}
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F7FA',
    },
    section: {
        // Padding handled inline
    },
    sectionTitle: {
        fontWeight: '600',
        color: '#333',
        // Font size and margin handled inline
    },
    logCard: {
        // Margin handled inline
    },
    emptyText: {
        color: '#999',
        textAlign: 'center',
        paddingVertical: 20
    },
    logHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12
    },
    vehicleNo: {
        fontWeight: '700',
        color: '#333'
    },
    typeBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
    },
    typeText: {
        color: '#fff',
        fontWeight: '600'
    },
    residentInfo: {
        color: '#007AFF',
        marginBottom: 8,
        fontWeight: '500'
    },
    visitorInfo: {
        color: '#666',
        marginBottom: 8,
        lineHeight: 20
    },
    timeContainer: {
        marginTop: 8,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#EEE'
    },
    timeRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4
    },
    label: {
        color: '#666'
    },
    time: {
        color: '#333'
    },
    timeText: {
        color: '#666',
        marginTop: 8
    },
    loggedBy: {
        color: '#999',
        marginTop: 8,
        fontStyle: 'italic'
    }
});
