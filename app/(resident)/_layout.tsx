// Resident Group Layout
// Modern layout with clean bottom tab navigation

import { Tabs, useRouter } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { Colors, Spacing, Typography } from '../../constants/designSystem';
import { useAuth } from '../../src/contexts/AuthContext';

export default function ResidentLayout() {
    const { logout } = useAuth();
    const router = useRouter();

    const handleLogout = async () => {
        await logout();
        router.replace('/(auth)/login');
    };

    return (
        <Tabs
            screenOptions={{
                headerStyle: {
                    backgroundColor: Colors.primary[600],
                },
                headerTintColor: Colors.text.inverse,
                headerTitleStyle: {
                    fontWeight: Typography.fontWeight.semibold,
                    fontSize: Typography.fontSize.lg,
                },
                headerRight: () => (
                    <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
                        <Text style={styles.logoutText}>Logout</Text>
                    </TouchableOpacity>
                ),
                tabBarActiveTintColor: Colors.primary[600],
                tabBarInactiveTintColor: Colors.text.tertiary,
                tabBarStyle: {
                    backgroundColor: Colors.background.primary,
                    borderTopColor: Colors.border.light,
                    borderTopWidth: 1,
                    height: 60,
                    paddingBottom: 8,
                    paddingTop: 8,
                },
                tabBarLabelStyle: {
                    fontSize: Typography.fontSize.xs,
                    fontWeight: Typography.fontWeight.medium,
                },
            }}
        >
            <Tabs.Screen
                name="home"
                options={{
                    title: 'Home',
                    tabBarIcon: ({ color, focused }) => (
                        <Text style={[styles.icon, { opacity: focused ? 1 : 0.6 }]}>🏠</Text>
                    ),
                }}
            />
            <Tabs.Screen
                name="announcements"
                options={{
                    title: 'Announcements',
                    href: null,
                    headerShown: false,
                }}
            />
            <Tabs.Screen
                name="bills"
                options={{
                    title: 'Bills',
                    href: null,
                    headerShown: false,
                }}
            />
            <Tabs.Screen
                name="complaints"
                options={{
                    title: 'Complaints',
                    href: null,
                    headerShown: false,
                }}
            />
            <Tabs.Screen
                name="marketplace"
                options={{
                    title: 'Marketplace',
                    href: null,
                    headerShown: false,
                }}
            />
            <Tabs.Screen
                name="vehicles"
                options={{
                    title: 'Vehicles',
                    href: null,
                    headerShown: false,
                }}
            />
            <Tabs.Screen
                name="change-password"
                options={{
                    title: 'Change Password',
                    href: null,
                    headerShown: true,
                }}
            />
        </Tabs>
    );
}

const styles = StyleSheet.create({
    logoutButton: {
        marginRight: Spacing.lg,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.xs,
        borderRadius: 6,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
    logoutText: {
        color: Colors.text.inverse,
        fontSize: Typography.fontSize.base,
        fontWeight: Typography.fontWeight.medium,
    },
    icon: {
        fontSize: 24,
    },
});
