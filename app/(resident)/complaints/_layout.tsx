// Complaints Layout (Resident)
import { Stack } from 'expo-router';

export default function ComplaintsLayout() {
    return (
        <Stack
            screenOptions={{
                headerStyle: { backgroundColor: '#007AFF' },
                headerTintColor: '#fff',
                headerTitleStyle: { fontWeight: '600' }
            }}
        >
            <Stack.Screen name="index" options={{ title: 'My Complaints' }} />
            <Stack.Screen name="create" options={{ title: 'Submit Complaint' }} />
        </Stack>
    );
}
