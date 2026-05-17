// Resident Group Layout
// Uses Stack navigation to enable native swipe-to-go-back gestures across all screens

import { Stack, useRouter } from 'expo-router';
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
        <Stack
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
                gestureEnabled: true,
                fullScreenGestureEnabled: true,
                animation: 'slide_from_right',
                animationDuration: 260,
            }}
        >
            <Stack.Screen
                name="home"
                options={{
                    title: 'Home',
                    headerLeft: () => null, // Root screen has no back button
                }}
            />
            
            {/* All nested routes are stacks themselves, so we hide the parent stack header here 
                to avoid double headers. The swipe back will work because they are pushed onto 
                this parent stack. */}
            <Stack.Screen
                name="bills"
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="complaints"
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="marketplace"
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="vehicles"
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="announcements"
                options={{ headerShown: false }}
            />

            {/* Direct screens */}
            <Stack.Screen
                name="chatbot"
                options={{
                    title: 'AI Assistant',
                    headerShown: false,
                }}
            />
            <Stack.Screen
                name="change-password"
                options={{
                    title: 'Change Password',
                    headerShown: true,
                }}
            />
        </Stack>
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
        fontWeight: '600',
    },
});
