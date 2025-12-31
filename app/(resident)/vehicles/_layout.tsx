// Vehicles Layout (Resident)
import { Stack } from 'expo-router';

export default function VehiclesLayout() {
    return (
        <Stack
            screenOptions={{
                headerStyle: { backgroundColor: '#007AFF' },
                headerTintColor: '#fff',
                headerTitleStyle: { fontWeight: '600' }
            }}
        >
            <Stack.Screen name="index" options={{ title: 'My Vehicles' }} />
        </Stack>
    );
}
