// Resident Home Screen
// Dashboard with quick access to all features

import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Card } from '../../src/components/common/Card';
import { useAuth } from '../../src/contexts/AuthContext';
import { getResidentBills } from '../../src/services/billService';
import { getResidentComplaints } from '../../src/services/complaintService';

export default function ResidentHome() {
    const { userProfile } = useAuth();
    const router = useRouter();
    const [stats, setStats] = useState({
        unpaidBills: 0,
        pendingComplaints: 0
    });
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        if (!userProfile) return;

        const [bills, complaints] = await Promise.all([
            getResidentBills(userProfile.uid),
            getResidentComplaints(userProfile.uid)
        ]);

        setStats({
            unpaidBills: bills.filter(b => b.status === 'Unpaid').length,
            pendingComplaints: complaints.filter(c => c.status === 'Pending').length
        });
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadStats();
        setRefreshing(false);
    };

    const menuItems = [
        {
            title: 'Bills',
            icon: '💰',
            description: 'View and pay bills',
            route: '/(resident)/bills',
            badge: stats.unpaidBills,
            color: '#34C759'
        },
        {
            title: 'Complaints',
            icon: '📋',
            description: 'Submit and track complaints',
            route: '/(resident)/complaints',
            badge: stats.pendingComplaints,
            color: '#FF9500'
        },
        {
            title: 'Marketplace',
            icon: '🏘️',
            description: 'Buy, sell, or rent properties',
            route: '/(resident)/marketplace',
            color: '#AF52DE'
        },
        {
            title: 'My Vehicles',
            icon: '🚗',
            description: 'View vehicle entry logs',
            route: '/(resident)/vehicles',
            color: '#FF3B30'
        },
        {
            title: 'Change Password',
            icon: '🔑',
            description: 'Update your password',
            route: '/(resident)/change-password',
            color: '#5856D6'
        },
        {
            title: 'Announcements',
            icon: '📢',
            description: 'View society notices',
            route: '/(resident)/announcements',
            color: '#007AFF'
        }
    ];

    return (
        <ScrollView
            style={styles.container}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
            <View style={styles.content}>
                {/* Welcome Card */}
                <Card style={styles.welcomeCard}>
                    <Text style={styles.welcome}>Welcome back!</Text>
                    <Text style={styles.name}>{userProfile?.name}</Text>
                    <Text style={styles.houseNo}>House: {userProfile?.houseNo}</Text>
                </Card>

                {/* Quick Stats */}
                <View style={styles.statsContainer}>
                    <View style={[styles.statBox, { backgroundColor: '#FFF3E0' }]}>
                        <Text style={styles.statNumber}>{stats.unpaidBills}</Text>
                        <Text style={styles.statLabel}>Unpaid Bills</Text>
                    </View>
                    <View style={[styles.statBox, { backgroundColor: '#FFE5E5' }]}>
                        <Text style={styles.statNumber}>{stats.pendingComplaints}</Text>
                        <Text style={styles.statLabel}>Pending Complaints</Text>
                    </View>
                </View>

                {/* Menu Grid */}
                <View style={styles.menuGrid}>
                    {menuItems.map((item, index) => (
                        <TouchableOpacity
                            key={index}
                            style={styles.menuItem}
                            onPress={() => router.push(item.route as any)}
                            activeOpacity={0.7}
                        >
                            <Card style={styles.menuCard}>
                                <Text style={styles.menuIcon}>{item.icon}</Text>
                                <Text style={styles.menuTitle}>{item.title}</Text>
                                <Text style={styles.menuDescription}>{item.description}</Text>
                                {item.badge !== undefined && item.badge > 0 && (
                                    <View style={[styles.badge, { backgroundColor: item.color }]}>
                                        <Text style={styles.badgeText}>{item.badge}</Text>
                                    </View>
                                )}
                            </Card>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F7FA'
    },
    content: {
        padding: 16
    },
    welcomeCard: {
        marginBottom: 20,
        backgroundColor: '#007AFF'
    },
    welcome: {
        fontSize: 16,
        color: '#fff',
        marginBottom: 4
    },
    name: {
        fontSize: 24,
        fontWeight: '700',
        color: '#fff',
        marginBottom: 4
    },
    houseNo: {
        fontSize: 16,
        color: '#fff',
        opacity: 0.9
    },
    statsContainer: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 20
    },
    statBox: {
        flex: 1,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center'
    },
    statNumber: {
        fontSize: 32,
        fontWeight: '700',
        color: '#333',
        marginBottom: 4
    },
    statLabel: {
        fontSize: 13,
        color: '#666',
        textAlign: 'center'
    },
    menuGrid: {
        gap: 12
    },
    menuItem: {
        marginBottom: 4
    },
    menuCard: {
        position: 'relative'
    },
    menuIcon: {
        fontSize: 36,
        marginBottom: 12
    },
    menuTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4
    },
    menuDescription: {
        fontSize: 14,
        color: '#666'
    },
    badge: {
        position: 'absolute',
        top: 12,
        right: 12,
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center'
    },
    badgeText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '700'
    }
});
