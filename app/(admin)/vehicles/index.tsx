// Admin Vehicle Logs Index
// View all vehicle entry/exit logs

import React, { useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Card } from '../../../src/components/common/Card';
import { LoadingSpinner } from '../../../src/components/common/LoadingSpinner';
import { getActiveVehicles, getAllVehicleLogs } from '../../../src/services/vehicleService';
import { VehicleLog } from '../../../src/types';

export default function VehiclesIndex() {
    const [allLogs, setAllLogs] = useState<VehicleLog[]>([]);
    const [activeVehicles, setActiveVehicles] = useState<VehicleLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        loadLogs();
    }, []);

    const loadLogs = async () => {
        setLoading(true);
        const [all, active] = await Promise.all([
            getAllVehicleLogs(),
            getActiveVehicles()
        ]);
        setAllLogs(all.slice(0, 50)); // Show last 50 logs
        setActiveVehicles(active);
        setLoading(false);
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadLogs();
        setRefreshing(false);
    };

    const formatTime = (timestamp: any): string => {
        if (!timestamp) return 'N/A';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleString();
    };

    if (loading) {
        return <LoadingSpinner message="Loading vehicle logs..." />;
    }

    return (
        <ScrollView
            style={styles.container}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
            {/* Active Vehicles Section */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                    🚗 Currently Inside ({activeVehicles.length})
                </Text>
                {activeVehicles.length === 0 ? (
                    <Card>
                        <Text style={styles.emptyText}>No vehicles currently inside</Text>
                    </Card>
                ) : (
                    activeVehicles.map(log => (
                        <Card key={log.id}>
                            <View style={styles.logHeader}>
                                <Text style={styles.vehicleNo}>{log.vehicleNo}</Text>
                                <View style={[styles.typeBadge, { backgroundColor: getTypeColor(log.type) }]}>
                                    <Text style={styles.typeText}>{log.type}</Text>
                                </View>
                            </View>

                            {log.residentName && (
                                <Text style={styles.residentInfo}>
                                    {log.residentName} - {log.houseNo}
                                </Text>
                            )}

                            {log.visitorName && (
                                <Text style={styles.visitorInfo}>
                                    Visitor: {log.visitorName}
                                    {log.purpose && `\nPurpose: ${log.purpose}`}
                                </Text>
                            )}

                            <Text style={styles.timeText}>
                                Entry: {formatTime(log.entryTime)}
                            </Text>
                        </Card>
                    ))
                )}
            </View>

            {/* Recent Logs Section */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                    📋 Recent Logs (Last 50)
                </Text>
                {allLogs.map(log => (
                    <Card key={log.id}>
                        <View style={styles.logHeader}>
                            <Text style={styles.vehicleNo}>{log.vehicleNo}</Text>
                            <View style={[styles.typeBadge, { backgroundColor: getTypeColor(log.type) }]}>
                                <Text style={styles.typeText}>{log.type}</Text>
                            </View>
                        </View>

                        {log.residentName && (
                            <Text style={styles.residentInfo}>
                                {log.residentName} - {log.houseNo}
                            </Text>
                        )}

                        {log.visitorName && (
                            <Text style={styles.visitorInfo}>
                                Visitor: {log.visitorName}
                            </Text>
                        )}

                        <View style={styles.timeContainer}>
                            <View style={styles.timeRow}>
                                <Text style={styles.label}>Entry:</Text>
                                <Text style={styles.time}>{formatTime(log.entryTime)}</Text>
                            </View>
                            {log.exitTime && (
                                <View style={styles.timeRow}>
                                    <Text style={styles.label}>Exit:</Text>
                                    <Text style={styles.time}>{formatTime(log.exitTime)}</Text>
                                </View>
                            )}
                        </View>

                        <Text style={styles.loggedBy}>
                            Logged by: {log.loggedByName}
                        </Text>
                    </Card>
                ))}
            </View>
        </ScrollView>
    );
}

const getTypeColor = (type: string): string => {
    switch (type) {
        case 'Resident':
            return '#34C759';
        case 'Visitor':
            return '#FF9500';
        case 'Service':
            return '#007AFF';
        default:
            return '#8E8E93';
    }
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F7FA',
        padding: 16
    },
    section: {
        marginBottom: 24
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginBottom: 12
    },
    emptyText: {
        fontSize: 14,
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
        fontSize: 18,
        fontWeight: '700',
        color: '#333'
    },
    typeBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12
    },
    typeText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600'
    },
    residentInfo: {
        fontSize: 15,
        color: '#007AFF',
        marginBottom: 8,
        fontWeight: '500'
    },
    visitorInfo: {
        fontSize: 14,
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
        fontSize: 13,
        color: '#666'
    },
    time: {
        fontSize: 13,
        color: '#333'
    },
    timeText: {
        fontSize: 13,
        color: '#666',
        marginTop: 8
    },
    loggedBy: {
        fontSize: 12,
        color: '#999',
        marginTop: 8,
        fontStyle: 'italic'
    }
});
