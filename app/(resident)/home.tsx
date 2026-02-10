/**
 * Resident Home Screen
 * Modern dashboard with quick access to all resident features
 * 
 * This screen shows:
 * - Greeting with resident name and house number
 * - Quick status cards (bills, complaints, vehicles)
 * - Service menu grid for navigation
 */

import { useRouter } from 'expo-router';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import React from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { db } from '../../firebaseConfig';
import { Avatar } from '../../src/components/common/Avatar';
import { Card } from '../../src/components/common/Card';
import { useAuth } from '../../src/contexts/AuthContext';
import { useBreakpoint } from '../../src/hooks/useResponsive';
import { borderRadius, fontSize, spacing } from '../../src/utils/responsive';

/**
 * Get appropriate greeting based on time of day
 */
function getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
}

export default function ResidentHome() {
    const { userProfile } = useAuth();
    const router = useRouter();
    const breakpoint = useBreakpoint();

    // State for quick stats
    const [stats, setStats] = React.useState({
        unpaidBills: 0,
        pendingComplaints: 0,
        vehiclesInside: 0
    });
    const [refreshing, setRefreshing] = React.useState(false);

    // Set up real-time listeners for resident stats
    React.useEffect(() => {
        if (!userProfile) return;

        // Listen to unpaid bills
        const billsUnsub = onSnapshot(
            query(
                collection(db, 'bills'),
                where('residentId', '==', userProfile.uid),
                where('status', '==', 'Unpaid')
            ),
            (snapshot) => {
                setStats(prev => ({ ...prev, unpaidBills: snapshot.size }));
            }
        );

        // Listen to pending complaints
        const complaintsUnsub = onSnapshot(
            query(
                collection(db, 'complaints'),
                where('userId', '==', userProfile.uid),
                where('status', '==', 'Pending')
            ),
            (snapshot) => {
                setStats(prev => ({ ...prev, pendingComplaints: snapshot.size }));
            }
        );

        // Cleanup listeners on unmount
        return () => {
            billsUnsub();
            complaintsUnsub();
        };
    }, [userProfile]);

    /**
     * Refresh data when user pulls down
     */
    const onRefresh = async () => {
        setRefreshing(true);
        // Just toggle refresh state - real-time listeners handle actual updates
        setTimeout(() => setRefreshing(false), 500);
    };

    // Quick status card configuration
    const statusCards = [
        {
            title: 'Pending Bills',
            value: stats.unpaidBills,
            icon: '💳',
            // Red if unpaid bills exist, green otherwise
            color: stats.unpaidBills > 0 ? '#EF4444' : '#10B981',
            bgColor: stats.unpaidBills > 0 ? '#FEE2E2' : '#D1FAE5',
            route: '/(resident)/bills'
        },
        {
            title: 'Open Complaints',
            value: stats.pendingComplaints,
            icon: '🛠',
            color: '#F59E0B',
            bgColor: '#FEF3C7',
            route: '/(resident)/complaints'
        },
        {
            title: 'Vehicles Inside',
            value: stats.vehiclesInside,
            icon: '🚗',
            color: '#3B82F6',
            bgColor: '#DBEAFE',
            route: '/(resident)/vehicles'
        },
    ];

    // Main service menu configuration
    const menuItems = [
        {
            title: 'Announcements',
            icon: '📢',
            route: '/(resident)/announcements',
            color: '#3B82F6',
        },
        {
            title: 'Bills & Payments',
            icon: '💳',
            route: '/(resident)/bills',
            color: '#10B981',
        },
        {
            title: 'Complaints',
            icon: '🛠',
            route: '/(resident)/complaints',
            color: '#F59E0B',
        },
        {
            title: 'Vehicles',
            icon: '🚗',
            route: '/(resident)/vehicles',
            color: '#8B5CF6',
        },
        {
            title: 'Marketplace',
            icon: '🏪',
            route: '/(resident)/marketplace',
            color: '#6B7280',
        },
        {
            title: 'Change Password',
            icon: '🔑',
            route: '/(resident)/change-password',
            color: '#1E40AF',
        },
    ];

    return (
        <ScrollView
            style={styles.container}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
            <View style={[styles.content, { padding: spacing.lg }]}>

                {/* Header Section - Avatar and Greeting */}
                <View style={[styles.header, { marginBottom: spacing['2xl'] }]}>
                    <View style={styles.headerLeft}>
                        <Avatar
                            name={userProfile?.name || 'User'}
                            size="lg"
                        />
                        <View style={[styles.headerText, { marginLeft: spacing.md }]}>
                            <Text style={[styles.greeting, { fontSize: fontSize.sm }]}>
                                {getGreeting()} 👋
                            </Text>
                            <Text style={[styles.userName, { fontSize: breakpoint.mobile ? fontSize['2xl'] : fontSize['3xl'] }]}>
                                {userProfile?.name}
                            </Text>
                            <Text style={[styles.houseNo, { fontSize: fontSize.base }]}>
                                House: {userProfile?.houseNo}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Quick Status Cards Section */}
                <Text style={[styles.sectionTitle, { fontSize: fontSize.lg, marginBottom: spacing.md }]}>
                    Quick Overview
                </Text>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={[styles.statusCardsContainer, { gap: spacing.md, marginBottom: spacing.xl }]}
                >
                    {statusCards.map((card, index) => (
                        <TouchableOpacity
                            key={index}
                            style={[
                                styles.statusCard,
                                {
                                    backgroundColor: card.bgColor,
                                    borderColor: card.color,
                                    borderRadius: borderRadius.xl,
                                    padding: spacing.lg
                                }
                            ]}
                            onPress={() => router.push(card.route as any)}
                            activeOpacity={0.7}
                        >
                            <Text style={[styles.statusIcon, { marginBottom: spacing.sm }]}>
                                {card.icon}
                            </Text>
                            <Text style={[styles.statusValue, { color: card.color, fontSize: fontSize['3xl'] }]}>
                                {card.value}
                            </Text>
                            <Text style={[styles.statusTitle, { fontSize: fontSize.xs }]}>
                                {card.title}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {/* Service Menu Grid */}
                <Text style={[styles.sectionTitle, { fontSize: fontSize.lg, marginBottom: spacing.md }]}>
                    Services
                </Text>
                <View style={[styles.menuGrid, { gap: spacing.md }]}>
                    {menuItems.map((item, index) => (
                        <TouchableOpacity
                            key={index}
                            style={styles.menuItem}
                            onPress={() => router.push(item.route as any)}
                            activeOpacity={0.7}
                        >
                            <Card style={[styles.menuCard, { padding: spacing.lg }]}>
                                {/* Icon container with colored background */}
                                <View
                                    style={[
                                        styles.iconContainer,
                                        {
                                            backgroundColor: `${item.color}15`, // 15 = 8% opacity
                                            borderRadius: borderRadius.xl,
                                            marginBottom: spacing.md
                                        }
                                    ]}
                                >
                                    <Text style={styles.menuIcon}>{item.icon}</Text>
                                </View>
                                <Text style={[styles.menuTitle, { fontSize: fontSize.base }]}>
                                    {item.title}
                                </Text>
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
        backgroundColor: '#F5F7FA',
    },
    content: {
        // Padding handled inline
    },
    header: {
        // Margin handled inline
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerText: {
        flex: 1,
        // Margin handled inline
    },
    greeting: {
        color: '#6B7280',
        marginBottom: 2,
    },
    userName: {
        fontWeight: '700',
        color: '#111827',
        marginBottom: 2,
    },
    houseNo: {
        color: '#6B7280',
    },
    sectionTitle: {
        fontWeight: '600',
        color: '#111827',
        // Font size and margin handled inline
    },
    statusCardsContainer: {
        paddingBottom: 4,
        // Gap and margin handled inline
    },
    statusCard: {
        width: 140,
        borderWidth: 2,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
        // Colors, padding, and border radius handled inline
    },
    statusIcon: {
        fontSize: 32,
        // Margin handled inline
    },
    statusValue: {
        fontWeight: '700',
        marginBottom: 4,
        // Color and font size handled inline
    },
    statusTitle: {
        color: '#6B7280',
        textAlign: 'center',
        // Font size handled inline
    },
    menuGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        // Gap handled inline
    },
    menuItem: {
        width: '48%',
    },
    menuCard: {
        alignItems: 'center',
        // Padding handled inline
    },
    iconContainer: {
        width: 64,
        height: 64,
        justifyContent: 'center',
        alignItems: 'center',
        // Background, border radius, and margin handled inline
    },
    menuIcon: {
        fontSize: 32,
    },
    menuTitle: {
        fontWeight: '600',
        color: '#111827',
        textAlign: 'center',
        // Font size handled inline
    },
});
