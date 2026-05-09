// Security Group Layout
// Layout for security screens

import { Stack, useRouter } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { Colors, Typography } from '../../constants/designSystem';
import { useAuth } from '../../src/contexts/AuthContext';
import { SecurityDataProvider } from '../../src/contexts/SecurityDataContext';

export default function SecurityLayout() {
    const { logout } = useAuth();
    const router = useRouter();

    const handleLogout = async () => {
        await logout();
        router.replace('/(auth)/login');
    };

    return (
        <SecurityDataProvider>
            <Stack
                screenOptions={{
                    headerStyle: {
                        backgroundColor: Colors.primary[600]
                    },
                    headerTintColor: Colors.text.inverse,
                    headerTitleStyle: {
                        fontWeight: Typography.fontWeight.semibold,
                        fontSize: Typography.fontSize.lg,
                    },
                    gestureEnabled: false,
                    headerRight: () => (
                        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
                            <Text style={styles.logoutText}>Logout</Text>
                        </TouchableOpacity>
                    )
                }}
            >
                <Stack.Screen
                    name="gate-entry"
                    options={{ title: '🔐 Gate Control', gestureEnabled: false }}
                />
            </Stack>
        </SecurityDataProvider>
    );
}

const styles = StyleSheet.create({
    logoutButton: {
        marginRight: 12,
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 8,
        backgroundColor: 'rgba(255,255,255,0.2)',
    },
    logoutText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600'
    }
});
