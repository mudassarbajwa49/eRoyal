// Admin Group Layout
// Layout for admin screens with navigation

import { Stack, useRouter } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { Colors, Typography } from '../../constants/designSystem';
import { AdminDataProvider } from '../../src/contexts/AdminDataContext';
import { useAuth } from '../../src/contexts/AuthContext';

export default function AdminLayout() {
    const { logout } = useAuth();
    const router = useRouter();

    const handleLogout = async () => {
        await logout();
        router.replace('/(auth)/login');
    };

    return (
        <AdminDataProvider>
            <Stack
                screenOptions={{
                    headerShown: true,
                    animation: 'slide_from_right',
                    animationDuration: 260,
                    gestureEnabled: true,
                    fullScreenGestureEnabled: true,
                    headerStyle: {
                        backgroundColor: Colors.primary[600]
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
                    )
                }}
            >
                <Stack.Screen
                    name="dashboard"
                    options={{ title: 'Admin Dashboard', gestureEnabled: false }}
                />
                <Stack.Screen
                    name="users/index"
                    options={{ title: 'User Management' }}
                />
                <Stack.Screen
                    name="users/create"
                    options={{ title: 'Create User' }}
                />
                <Stack.Screen
                    name="users/[uid]"
                    options={{ title: 'User Profile', headerShown: true }}
                />
                <Stack.Screen
                    name="bills/index"
                    options={{ title: 'Bills Management' }}
                />
                <Stack.Screen
                    name="bills/create"
                    options={{ title: 'Create Bill' }}
                />
                <Stack.Screen
                    name="bills/generate"
                    options={{ title: 'Generate Bills' }}
                />
                <Stack.Screen
                    name="bills/[id]"
                    options={{ title: 'Bill Details' }}
                />
                <Stack.Screen
                    name="complaints/index"
                    options={{ title: 'Complaints' }}
                />
                <Stack.Screen
                    name="complaints/[id]"
                    options={{ title: 'Complaint Details' }}
                />
                <Stack.Screen
                    name="marketplace/index"
                    options={{ title: 'Marketplace Management' }}
                />
                <Stack.Screen
                    name="marketplace/create"
                    options={{ title: 'Create Listing' }}
                />
                <Stack.Screen
                    name="announcements/create"
                    options={{ title: 'Create Announcement' }}
                />
                <Stack.Screen
                    name="vehicles/index"
                    options={{ title: 'Vehicle Logs' }}
                />
            </Stack>
        </AdminDataProvider>
    );
}

const styles = StyleSheet.create({
    logoutButton: {
        marginRight: 12,
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 8,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
    logoutText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600'
    }
});
