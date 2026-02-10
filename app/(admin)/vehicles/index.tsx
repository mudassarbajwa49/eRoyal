/**
 * Admin Vehicle Logs Screen
 * Enhanced view with statistics, tabs, and house grouping
 * 
 * Features:
 * - Today's statistics (entries, exits, currently inside)
 * - Tabs: Currently Inside / All Logs / By House
 * - Pull to refresh
 */

import React from 'react';
import { FlatList, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Card } from '../../../src/components/common/Card';
import { LoadingSpinner } from '../../../src/components/common/LoadingSpinner';
import { getActiveVehicles, getAllVehicleLogs, getLogsByHouse, getTodayStats } from '../../../src/services/VehicleEntryLogService';
import { VehicleLog } from '../../../src/types';
import { borderRadius, fontSize, spacing } from '../../../src/utils/responsive';

type TabType = 'inside' | 'logs' | 'byHouse';

function getTypeColor(type: string): string {
    switch (type) {
        case 'Resident': return '#34C759';
        case 'Visitor': return '#FF9500';
        case 'Service': return '#007AFF';
        default: return '#8E8E93';
    }
}

function formatTime(timestamp: any): string {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString();
}

export default function VehiclesIndex() {
    const [activeTab, setActiveTab] = React.useState<TabType>('inside');
    const [allLogs, setAllLogs] = React.useState<VehicleLog[]>([]);
    const [activeVehicles, setActiveVehicles] = React.useState<VehicleLog[]>([]);
    const [byHouse, setByHouse] = React.useState<Map<string, VehicleLog[]>>(new Map());
    const [stats, setStats] = React.useState({ entries: 0, exits: 0, inside: 0 });
    const [loading, setLoading] = React.useState(true);
    const [refreshing, setRefreshing] = React.useState(false);

    const loadData = async () => {
        const [all, active, grouped, todayStats] = await Promise.all([
            getAllVehicleLogs(),
            getActiveVehicles(),
            getLogsByHouse(),
            getTodayStats()
        ]);

        setAllLogs(all.slice(0, 100));
        setActiveVehicles(active);
        setByHouse(grouped);
        setStats(todayStats);
    };

    React.useEffect(() => {
        loadData().then(() => setLoading(false));
    }, []);

    const onRefresh = async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    };

    const renderVehicleCard = React.useCallback((log: VehicleLog, showExit = true) => (
        <Card key={log.id} style={{ marginBottom: spacing.md }}>
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
                <Text style={[styles.residentInfo, { fontSize: fontSize.sm }]}>
                    🏠 {log.residentName} - House {log.houseNo}
                </Text>
            )}

            {log.visitorName && (
                <Text style={[styles.visitorInfo, { fontSize: fontSize.sm }]}>
                    👤 Visitor: {log.visitorName}
                    {log.purpose && `\nPurpose: ${log.purpose}`}
                </Text>
            )}

            <View style={styles.timeContainer}>
                <View style={styles.timeRow}>
                    <Text style={[styles.label, { fontSize: fontSize.xs }]}>📥 Entry:</Text>
                    <Text style={[styles.time, { fontSize: fontSize.xs }]}>
                        {formatTime(log.entryTime)}
                    </Text>
                </View>
                {showExit && log.exitTime && (
                    <View style={styles.timeRow}>
                        <Text style={[styles.label, { fontSize: fontSize.xs }]}>📤 Exit:</Text>
                        <Text style={[styles.time, { fontSize: fontSize.xs }]}>
                            {formatTime(log.exitTime)}
                        </Text>
                    </View>
                )}
            </View>

            <Text style={[styles.loggedBy, { fontSize: fontSize.xs }]}>
                Logged by: {log.loggedByName}
            </Text>
        </Card>
    ), []);

    const renderLog = React.useCallback(({ item: log }: { item: VehicleLog }) =>
        renderVehicleCard(log, true), [renderVehicleCard]);

    const keyExtractor = React.useCallback((log: VehicleLog) => log.id || '', []);

    if (loading) {
        return <LoadingSpinner message="Loading vehicle logs..." />;
    }

    return (
        <View style={styles.container}>
            {/* Statistics Header */}
            <View style={styles.statsContainer}>
                <View style={styles.statBox}>
                    <Text style={styles.statNumber}>{stats.entries}</Text>
                    <Text style={styles.statLabel}>Today's Entries</Text>
                </View>
                <View style={styles.statBox}>
                    <Text style={styles.statNumber}>{stats.exits}</Text>
                    <Text style={styles.statLabel}>Today's Exits</Text>
                </View>
                <View style={[styles.statBox, styles.statBoxActive]}>
                    <Text style={[styles.statNumber, styles.statNumberActive]}>{stats.inside}</Text>
                    <Text style={styles.statLabel}>Currently Inside</Text>
                </View>
            </View>

            {/* Tab Bar */}
            <View style={styles.tabBar}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'inside' && styles.tabActive]}
                    onPress={() => setActiveTab('inside')}
                >
                    <Text style={[styles.tabText, activeTab === 'inside' && styles.tabTextActive]}>
                        🚗 Inside ({activeVehicles.length})
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'logs' && styles.tabActive]}
                    onPress={() => setActiveTab('logs')}
                >
                    <Text style={[styles.tabText, activeTab === 'logs' && styles.tabTextActive]}>
                        📋 All Logs
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'byHouse' && styles.tabActive]}
                    onPress={() => setActiveTab('byHouse')}
                >
                    <Text style={[styles.tabText, activeTab === 'byHouse' && styles.tabTextActive]}>
                        🏠 By House
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Currently Inside Tab */}
            {activeTab === 'inside' && (
                <FlatList
                    data={activeVehicles}
                    renderItem={({ item }) => renderVehicleCard(item, false)}
                    keyExtractor={keyExtractor}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
                    ListEmptyComponent={
                        <Card>
                            <Text style={styles.emptyText}>🅿️ No vehicles currently inside</Text>
                        </Card>
                    }
                />
            )}

            {/* All Logs Tab */}
            {activeTab === 'logs' && (
                <FlatList
                    data={allLogs}
                    renderItem={renderLog}
                    keyExtractor={keyExtractor}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
                    removeClippedSubviews
                    maxToRenderPerBatch={10}
                    windowSize={10}
                />
            )}

            {/* By House Tab */}
            {activeTab === 'byHouse' && (
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
                >
                    {byHouse.size === 0 ? (
                        <Card>
                            <Text style={styles.emptyText}>No vehicle logs by house</Text>
                        </Card>
                    ) : (
                        Array.from(byHouse.entries()).map(([house, logs]) => (
                            <View key={house} style={styles.houseSection}>
                                <View style={styles.houseHeader}>
                                    <Text style={styles.houseTitle}>🏠 House {house}</Text>
                                    <Text style={styles.houseCount}>{logs.length} logs</Text>
                                </View>
                                {logs.slice(0, 5).map(log => renderVehicleCard(log, true))}
                                {logs.length > 5 && (
                                    <Text style={styles.moreText}>+ {logs.length - 5} more logs</Text>
                                )}
                            </View>
                        ))
                    )}
                </ScrollView>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F7FA',
    },
    statsContainer: {
        flexDirection: 'row',
        padding: 16,
        gap: 8,
    },
    statBox: {
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 12,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    statBoxActive: {
        backgroundColor: '#007AFF',
    },
    statNumber: {
        fontSize: 24,
        fontWeight: '700',
        color: '#007AFF',
        marginBottom: 4,
    },
    statNumberActive: {
        color: '#fff',
    },
    statLabel: {
        fontSize: 11,
        color: '#666',
        textAlign: 'center',
    },
    tabBar: {
        flexDirection: 'row',
        marginHorizontal: 16,
        marginBottom: 12,
        backgroundColor: '#E5E5EA',
        borderRadius: 10,
        padding: 4,
    },
    tab: {
        flex: 1,
        paddingVertical: 8,
        alignItems: 'center',
        borderRadius: 8,
    },
    tabActive: {
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    tabText: {
        fontSize: 12,
        fontWeight: '500',
        color: '#666',
    },
    tabTextActive: {
        color: '#007AFF',
        fontWeight: '600',
    },
    scrollView: {
        flex: 1,
    },
    listContent: {
        padding: 16,
        paddingTop: 0,
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
    loggedBy: {
        color: '#999',
        marginTop: 8,
        fontStyle: 'italic'
    },
    emptyText: {
        color: '#999',
        textAlign: 'center',
        paddingVertical: 20,
        fontSize: 14,
    },
    houseSection: {
        marginBottom: 24,
    },
    houseHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
        paddingBottom: 8,
        borderBottomWidth: 2,
        borderBottomColor: '#007AFF',
    },
    houseTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#333',
    },
    houseCount: {
        fontSize: 13,
        color: '#666',
    },
    moreText: {
        textAlign: 'center',
        color: '#007AFF',
        fontSize: 13,
        paddingVertical: 8,
    },
});
