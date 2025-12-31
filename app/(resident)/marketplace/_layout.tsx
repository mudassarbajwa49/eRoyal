// Marketplace Layout (Resident)
import { Stack } from 'expo-router';

export default function MarketplaceLayout() {
    return (
        <Stack
            screenOptions={{
                headerStyle: { backgroundColor: '#007AFF' },
                headerTintColor: '#fff',
                headerTitleStyle: { fontWeight: '600' }
            }}
        >
            <Stack.Screen name="index" options={{ title: 'Marketplace' }} />
            <Stack.Screen name="create" options={{ title: 'Post Listing' }} />
        </Stack>
    );
}
