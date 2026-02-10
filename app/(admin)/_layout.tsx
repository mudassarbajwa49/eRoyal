// Admin Group Layout
// Layout for admin screens with navigation

import { Stack, useRouter } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useAuth } from '../../src/contexts/AuthContext';

export default function AdminLayout() {
    const { logout } = useAuth();
    const router = useRouter();

    const handleLogout = async () => {
        await logout();
        router.replace('/(auth)/login');
    };

    return (
        <Stack
            screenOptions={{
                headerShown: true,
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
                )
            }}
        >
            <Stack.Screen
                name="dashboard"
                options={{ title: 'Admin Dashboard' }}
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
                name="complaints/create"
                options={{ title: 'Create Complaint' }}
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
