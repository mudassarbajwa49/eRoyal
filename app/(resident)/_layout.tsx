// Resident Group Layout
// Layout for resident screens with bottom tab navigation

import { Tabs, useRouter } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
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
                    backgroundColor: '#007AFF'
                },
                headerTintColor: '#fff',
                headerTitleStyle: {
                    fontWeight: '600'
                },
                headerRight: () => (
                    <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
                        <Text style={styles.logoutText}>Logout</Text>
                    </TouchableOpacity>
                ),
                tabBarActiveTintColor: '#007AFF',
                tabBarInactiveTintColor: '#8E8E93',
                tabBarStyle: {
                    backgroundColor: '#fff',
                    borderTopColor: '#EEE',
                    borderTopWidth: 1
                }
            }}
        >
            <Tabs.Screen
                name="home"
                options={{
                    title: 'Home',
                    tabBarIcon: ({ color }) => <Text style={{ fontSize: 24 }}>🏠</Text>
                }}
            />
            <Tabs.Screen
                name="bills"
                options={{
                    title: 'Bills',
                    href: null, // Hide from tab bar, accessible via navigation
                    headerShown: false
                }}
            />
            <Tabs.Screen
                name="complaints"
                options={{
                    title: 'Complaints',
                    href: null,
                    headerShown: false
                }}
            />
            <Tabs.Screen
                name="marketplace"
                options={{
                    title: 'Marketplace',
                    href: null,
                    headerShown: false
                }}
            />
            <Tabs.Screen
                name="vehicles"
                options={{
                    title: 'Vehicles',
                    href: null,
                    headerShown: false
                }}
            />
        </Tabs>
    );
}

const styles = StyleSheet.create({
    logoutButton: {
        marginRight: 16
    },
    logoutText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '500'
    }
});
