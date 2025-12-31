// Security Group Layout
// Layout for security screens

import { Stack, useRouter } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useAuth } from '../../src/contexts/AuthContext';

export default function SecurityLayout() {
    const { logout } = useAuth();
    const router = useRouter();

    const handleLogout = async () => {
        await logout();
        router.replace('/(auth)/login');
    };

    return (
        <Stack
            screenOptions={{
                headerStyle: {
                    backgroundColor: '#FF9500'
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
                name="gate-entry"
                options={{ title: 'Gate Entry System' }}
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
