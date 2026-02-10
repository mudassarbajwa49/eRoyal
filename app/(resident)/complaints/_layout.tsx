// Complaints Layout (Resident)
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { TouchableOpacity } from 'react-native';

export default function ComplaintsLayout() {
    const router = useRouter();

    return (
        <Stack
            screenOptions={{
                headerShown: true,
                headerStyle: { backgroundColor: '#007AFF' },
                headerTintColor: '#fff',
                headerTitleStyle: { fontWeight: '600' },
                headerLeft: () => (
                    <TouchableOpacity onPress={() => router.back()} style={{ paddingLeft: 8 }}>
                        <Ionicons name="chevron-back" size={28} color="#fff" />
                    </TouchableOpacity>
                ),
            }}
        >
            <Stack.Screen name="index" options={{ title: 'My Complaints', headerShown: true }} />
            <Stack.Screen name="create" options={{ title: 'Submit Complaint', headerShown: true }} />
            <Stack.Screen name="[id]" options={{ title: 'Complaint Details', headerShown: true }} />
        </Stack>
    );
}
