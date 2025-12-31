// Bills Layout (Resident)
import { Stack } from 'expo-router';

export default function BillsLayout() {
    return (
        <Stack
            screenOptions={{
                headerStyle: { backgroundColor: '#007AFF' },
                headerTintColor: '#fff',
                headerTitleStyle: { fontWeight: '600' }
            }}
        >
            <Stack.Screen name="index" options={{ title: 'My Bills' }} />
            <Stack.Screen name="[id]" options={{ title: 'Bill Details' }} />
        </Stack>
    );
}
