// Admin Dashboard
// Main dashboard with navigation to all admin features

import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Card } from '../../src/components/common/Card';
import { LoadingSpinner } from '../../src/components/common/LoadingSpinner';
import { useAuth } from '../../src/contexts/AuthContext';
import { getPendingBills } from '../../src/services/billService';
import { getPendingComplaints } from '../../src/services/complaintService';
import { getPendingListings } from '../../src/services/listingService';

export default function AdminDashboard() {
    const { userProfile } = useAuth();
    const router = useRouter();
    const [stats, setStats] = useState({
        pendingBills: 0,
        pendingComplaints: 0,
        pendingListings: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        try {
            const [bills, complaints, listings] = await Promise.all([
                getPendingBills(),
                getPendingComplaints(),
                getPendingListings()
            ]);

            setStats({
                pendingBills: bills.length,
                pendingComplaints: complaints.length,
                pendingListings: listings.length
            });
        } catch (error) {
            console.error('Error loading stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const menuItems = [
        {
            title: 'User Management',
            icon: '👥',
            description: 'Create and manage user accounts',
            route: '/(admin)/users',
            color: '#007AFF'
        },
        {
            title: 'Bills Management',
            icon: '💰',
            description: 'Generate bills and verify payments',
            route: '/(admin)/bills',
            color: '#34C759',
            badge: stats.pendingBills > 0 ? stats.pendingBills : undefined
        },
        {
            title: 'Complaints',
            icon: '📋',
            description: 'View and resolve complaints',
            route: '/(admin)/complaints',
            color: '#FF9500',
            badge: stats.pendingComplaints > 0 ? stats.pendingComplaints : undefined
        },
        {
            title: 'Marketplace',
            icon: '🏘️',
            description: 'Approve property listings',
            route: '/(admin)/marketplace',
            color: '#AF52DE',
            badge: stats.pendingListings > 0 ? stats.pendingListings : undefined
        },
        {
            title: 'Vehicle Logs',
            icon: '🚗',
            description: 'View vehicle entry/exit logs',
            route: '/(admin)/vehicles',
            color: '#FF3B30'
        },
        {
            title: 'Announcements',
            icon: '📢',
            description: 'Send notices to all residents',
            route: '/(admin)/announcements/create',
            color: '#5856D6'
        }
    ];

    if (loading) {
        return <LoadingSpinner message="Loading dashboard..." />;
    }

    return (
        <ScrollView style={styles.container}>
            <View style={styles.content}>
                {/* Welcome Section */}
                <Card style={styles.welcomeCard}>
                    <Text style={styles.welcome}>Welcome, {userProfile?.name}!</Text>
                    <Text style={styles.role}>Administrator</Text>
                </Card>

                {/* Quick Stats */}
                <View style={styles.statsContainer}>
                    <View style={styles.statBox}>
                        <Text style={styles.statNumber}>{stats.pendingBills}</Text>
                        <Text style={styles.statLabel}>Pending Payments</Text>
                    </View>
                    <View style={styles.statBox}>
                        <Text style={styles.statNumber}>{stats.pendingComplaints}</Text>
                        <Text style={styles.statLabel}>Open Complaints</Text>
                    </View>
                    <View style={styles.statBox}>
                        <Text style={styles.statNumber}>{stats.pendingListings}</Text>
                        <Text style={styles.statLabel}>Pending Listings</Text>
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
                                {item.badge !== undefined && (
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
        marginBottom: 20
    },
    welcome: {
        fontSize: 24,
        fontWeight: '700',
        color: '#333',
        marginBottom: 4
    },
    role: {
        fontSize: 16,
        color: '#666'
    },
    statsContainer: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 20
    },
    statBox: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3
    },
    statNumber: {
        fontSize: 28,
        fontWeight: '700',
        color: '#007AFF',
        marginBottom: 4
    },
    statLabel: {
        fontSize: 12,
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
