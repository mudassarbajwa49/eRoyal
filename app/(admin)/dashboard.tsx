/**
 * Admin Dashboard
 * Main dashboard with navigation to all admin features
 * 
 * This screen shows:
 * - Welcome message with admin name
 * - Quick stats (pending bills, complaints, listings)
 * - Menu grid to navigate to all admin features
 */

import { useRouter } from 'expo-router';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { db } from '../../firebaseConfig';
import { Card } from '../../src/components/common/Card';
import { LoadingSpinner } from '../../src/components/common/LoadingSpinner';
import { useAuth } from '../../src/contexts/AuthContext';
import { useBreakpoint } from '../../src/hooks/useResponsive';
import { borderRadius, fontSize, spacing } from '../../src/utils/responsive';

export default function AdminDashboard() {
    const { userProfile } = useAuth();
    const router = useRouter();
    const breakpoint = useBreakpoint();

    // Real-time dashboard statistics
    const [stats, setStats] = React.useState({
        pendingBills: 0,
        pendingComplaints: 0,
        pendingListings: 0
    });
    const [loading, setLoading] = React.useState(true);

    // Set up real-time listeners for all stats
    React.useEffect(() => {
        // Listen to unpaid bills
        const billsUnsub = onSnapshot(
            query(collection(db, 'bills'), where('status', '==', 'Unpaid')),
            (snapshot) => {
                setStats(prev => ({ ...prev, pendingBills: snapshot.size }));
                setLoading(false);
            }
        );

        // Listen to pending complaints
        const complaintsUnsub = onSnapshot(
            query(collection(db, 'complaints'), where('status', '==', 'Pending')),
            (snapshot) => {
                setStats(prev => ({ ...prev, pendingComplaints: snapshot.size }));
            }
        );

        // Listen to pending marketplace listings
        const listingsUnsub = onSnapshot(
            query(collection(db, 'marketplaceListings'), where('status', '==', 'Pending')),
            (snapshot) => {
                setStats(prev => ({ ...prev, pendingListings: snapshot.size }));
            }
        );

        // Cleanup listeners on unmount
        return () => {
            billsUnsub();
            complaintsUnsub();
            listingsUnsub();
        };
    }, []);

    // Menu item configuration
    // Each item has icon, title, description, route, and color
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
            <View style={[styles.content, { padding: spacing.lg }]}>

                {/* Welcome Card */}
                <Card style={[styles.welcomeCard, { marginBottom: spacing.xl }]}>
                    <Text style={[styles.welcome, { fontSize: breakpoint.mobile ? fontSize['2xl'] : fontSize['3xl'] }]}>
                        Welcome, {userProfile?.name}!
                    </Text>
                    <Text style={[styles.role, { fontSize: fontSize.base }]}>
                        Administrator
                    </Text>
                </Card>

                {/* Quick Statistics */}
                <View style={[styles.statsContainer, { gap: spacing.md, marginBottom: spacing.xl }]}>
                    <View style={[styles.statBox, { borderRadius: borderRadius.lg, padding: spacing.lg }]}>
                        <Text style={[styles.statNumber, { fontSize: breakpoint.mobile ? fontSize['2xl'] : fontSize['3xl'] }]}>
                            {stats.pendingBills}
                        </Text>
                        <Text style={[styles.statLabel, { fontSize: fontSize.xs }]}>
                            Pending Payments
                        </Text>
                    </View>

                    <View style={[styles.statBox, { borderRadius: borderRadius.lg, padding: spacing.lg }]}>
                        <Text style={[styles.statNumber, { fontSize: breakpoint.mobile ? fontSize['2xl'] : fontSize['3xl'] }]}>
                            {stats.pendingComplaints}
                        </Text>
                        <Text style={[styles.statLabel, { fontSize: fontSize.xs }]}>
                            Open Complaints
                        </Text>
                    </View>

                    <View style={[styles.statBox, { borderRadius: borderRadius.lg, padding: spacing.lg }]}>
                        <Text style={[styles.statNumber, { fontSize: breakpoint.mobile ? fontSize['2xl'] : fontSize['3xl'] }]}>
                            {stats.pendingListings}
                        </Text>
                        <Text style={[styles.statLabel, { fontSize: fontSize.xs }]}>
                            Pending Listings
                        </Text>
                    </View>
                </View>

                {/* Menu Grid - Responsive layout */}
                <View style={[styles.menuGrid, { gap: spacing.md }]}>
                    {menuItems.map((item, index) => (
                        <TouchableOpacity
                            key={index}
                            style={styles.menuItem}
                            onPress={() => router.push(item.route as any)}
                            activeOpacity={0.7}
                        >
                            <Card style={[styles.menuCard, { padding: spacing.lg }]}>
                                <Text style={styles.menuIcon}>{item.icon}</Text>
                                <Text style={[styles.menuTitle, { fontSize: fontSize.lg }]}>
                                    {item.title}
                                </Text>
                                <Text style={[styles.menuDescription, { fontSize: fontSize.sm }]}>
                                    {item.description}
                                </Text>

                                {/* Badge for pending items */}
                                {item.badge !== undefined && (
                                    <View style={[
                                        styles.badge,
                                        { backgroundColor: item.color, borderRadius: borderRadius.full }
                                    ]}>
                                        <Text style={[styles.badgeText, { fontSize: fontSize.xs }]}>
                                            {item.badge}
                                        </Text>
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
        // Padding handled by responsive spacing
    },
    welcomeCard: {
        // Margin handled inline with responsive spacing
    },
    welcome: {
        fontWeight: '700',
        color: '#333',
        marginBottom: 4
    },
    role: {
        color: '#666'
    },
    statsContainer: {
        flexDirection: 'row',
        // Gap and margin handled inline
    },
    statBox: {
        flex: 1,
        backgroundColor: '#fff',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3
    },
    statNumber: {
        fontWeight: '700',
        color: '#007AFF',
        marginBottom: 4
    },
    statLabel: {
        color: '#666',
        textAlign: 'center'
    },
    menuGrid: {
        // Gap handled inline
    },
    menuItem: {
        marginBottom: 4
    },
    menuCard: {
        position: 'relative'
        // Padding handled inline
    },
    menuIcon: {
        fontSize: 36,
        marginBottom: 12
    },
    menuTitle: {
        fontWeight: '600',
        color: '#333',
        marginBottom: 4
    },
    menuDescription: {
        color: '#666'
    },
    badge: {
        position: 'absolute',
        top: 12,
        right: 12,
        width: 28,
        height: 28,
        justifyContent: 'center',
        alignItems: 'center'
    },
    badgeText: {
        color: '#fff',
        fontWeight: '700'
    }
});
