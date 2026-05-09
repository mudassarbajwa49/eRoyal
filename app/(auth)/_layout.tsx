// Auth Group Layout
// Layout for authentication screens

import { Stack } from 'expo-router';

export default function AuthLayout() {
    return (
        <Stack
            screenOptions={{
                headerShown: false,
                animation: 'fade',
                animationDuration: 200,
                gestureEnabled: false,
            }}
        >
            <Stack.Screen name="login" />
            <Stack.Screen name="forgot-password" options={{ animation: 'slide_from_bottom' }} />
        </Stack>
    );
}
