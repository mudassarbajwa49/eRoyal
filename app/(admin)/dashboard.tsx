/**
 * Admin Dashboard
 * Main dashboard with navigation to all admin features
 *
 * Reads live stats from AdminDataContext — no cold Firestore fetches.
 */

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Card } from '../../src/components/common/Card';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../constants/designSystem';
import { useAdminData } from '../../src/contexts/AdminDataContext';
import { useAuth } from '../../src/contexts/AuthContext';
import { useBreakpoint } from '../../src/hooks/useResponsive';
import { borderRadius, fontSize, spacing } from '../../src/utils/responsive';

export default function AdminDashboard() {
    const { userProfile } = useAuth();
    const router = useRouter();
    const breakpoint = useBreakpoint();
    const { bills, complaints, pendingListings } = useAdminData();

    // Derive live dashboard statistics from context — zero extra Firestore reads
    const stats = useMemo(() => ({
        pendingBills: bills.filter(b => b.status === 'Unpaid').length,
        pendingComplaints: complaints.filter(c => c.status === 'Pending').length,
        pendingListings: pendingListings.length,
    }), [bills, complaints, pendingListings]);

    // Menu item configuration
    const menuItems = [
        {
            title: 'User Management',
            icon: <Ionicons name="people" size={28} color={Colors.info.main} />,
            description: 'Create and manage user accounts',
            route: '/(admin)/users',
            color: Colors.info.main
        },
        {
            title: 'Bills Management',
            icon: <Ionicons name="cash" size={28} color={Colors.success.main} />,
            description: 'Generate bills and verify payments',
            route: '/(admin)/bills',
            color: Colors.success.main,
            badge: stats.pendingBills > 0 ? stats.pendingBills : undefined
        },
        {
            title: 'Complaints',
            icon: <Ionicons name="construct" size={28} color={Colors.warning.main} />,
            description: 'View and resolve complaints',
            route: '/(admin)/complaints',
            color: Colors.warning.main,
            badge: stats.pendingComplaints > 0 ? stats.pendingComplaints : undefined
        },
        {
            title: 'Marketplace',
            icon: <Ionicons name="storefront" size={28} color={Colors.info.dark} />,
            description: 'Approve property listings',
            route: '/(admin)/marketplace',
            color: Colors.info.dark,
            badge: stats.pendingListings > 0 ? stats.pendingListings : undefined
        },
        {
            title: 'Vehicle Logs',
            icon: <Ionicons name="car" size={28} color={Colors.secondary[600]} />,
            description: 'View vehicle entry/exit logs',
            route: '/(admin)/vehicles',
            color: Colors.secondary[600]
        },
        {
            title: 'Announcements',
            icon: <Ionicons name="megaphone" size={28} color={Colors.primary[500]} />,
            description: 'Send notices to all residents',
            route: '/(admin)/announcements/create',
            color: Colors.primary[500]
        }
    ];

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
                        <Text style={[styles.statNumber, { fontSize: breakpoint.mobile ? fontSize['2xl'] : fontSize['3xl'], color: stats.pendingBills > 0 ? Colors.error.main : Colors.success.main }]}>
                            {stats.pendingBills}
                        </Text>
                        <Text style={[styles.statLabel, { fontSize: fontSize.xs }]}>
                            Pending Payments
                        </Text>
                    </View>

                    <View style={[styles.statBox, { borderRadius: borderRadius.lg, padding: spacing.lg }]}>
                        <Text style={[styles.statNumber, { fontSize: breakpoint.mobile ? fontSize['2xl'] : fontSize['3xl'], color: Colors.warning.main }]}>
                            {stats.pendingComplaints}
                        </Text>
                        <Text style={[styles.statLabel, { fontSize: fontSize.xs }]}>
                            Open Complaints
                        </Text>
                    </View>

                    <View style={[styles.statBox, { borderRadius: borderRadius.lg, padding: spacing.lg }]}>
                        <Text style={[styles.statNumber, { fontSize: breakpoint.mobile ? fontSize['2xl'] : fontSize['3xl'], color: Colors.secondary[600] }]}>
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
                            style={[
                                styles.menuItem,
                                {
                                    width: breakpoint.desktop
                                        ? '31%'
                                        : breakpoint.tablet
                                        ? '48%'
                                        : '100%',
                                }
                            ]}
                            onPress={() => router.push(item.route as any)}
                            activeOpacity={0.7}
                        >
                            <Card style={[styles.menuCard, { padding: spacing.lg }]}>
                                <View style={[styles.iconContainer, { backgroundColor: `${item.color}15`, marginBottom: spacing.md }]}>
                                    {item.icon}
                                </View>
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
        backgroundColor: Colors.background.secondary
    },
    content: {
        // Padding handled by responsive spacing
    },
    welcomeCard: {
        // Margin handled inline with responsive spacing
    },
    welcome: {
        fontWeight: Typography.fontWeight.bold,
        color: Colors.text.primary,
        marginBottom: 4
    },
    role: {
        color: Colors.text.secondary
    },
    statsContainer: {
        flexDirection: 'row',
        // Gap and margin handled inline
    },
    statBox: {
        flex: 1,
        backgroundColor: Colors.background.surface,
        alignItems: 'center',
        ...Shadows.sm,
        borderWidth: 1,
        borderColor: Colors.border.light,
    },
    statNumber: {
        fontWeight: Typography.fontWeight.bold,
        marginBottom: 4
        // Color is handled inline based on stat type
    },
    statLabel: {
        color: Colors.text.secondary,
        textAlign: 'center'
    },
    menuGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        // Gap handled inline
    },
    menuItem: {
        // Width controlled inline via breakpoint
        marginBottom: 4
    },
    menuCard: {
        position: 'relative',
        alignItems: 'flex-start',
        // Padding handled inline
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: BorderRadius.lg,
        justifyContent: 'center',
        alignItems: 'center',
    },
    menuIcon: {
        fontSize: 24,
    },
    menuTitle: {
        fontWeight: Typography.fontWeight.semibold,
        color: Colors.text.primary,
        marginBottom: 4
    },
    menuDescription: {
        color: Colors.text.secondary
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
        color: Colors.text.inverse,
        fontWeight: Typography.fontWeight.bold
    }
});
