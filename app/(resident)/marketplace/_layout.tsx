// Marketplace Layout (Resident)
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { TouchableOpacity } from 'react-native';
import { Colors, Typography } from '../../../constants/designSystem';

export default function MarketplaceLayout() {
    const router = useRouter();

    const BackButton = () => (
        <TouchableOpacity onPress={() => router.back()} style={{ paddingLeft: 8, paddingRight: 12, paddingVertical: 4 }}>
            <Ionicons name="chevron-back" size={28} color={Colors.text.inverse} />
        </TouchableOpacity>
    );

    return (
        <Stack
            screenOptions={{
                headerShown: true,
                headerStyle: { backgroundColor: Colors.primary[600] },
                headerTintColor: Colors.text.inverse,
                headerTitleStyle: { fontWeight: Typography.fontWeight.semibold },
                gestureEnabled: true,
                fullScreenGestureEnabled: true,
                animation: 'slide_from_right',
            }}
        >
            <Stack.Screen name="create" options={{ title: 'Post Listing', headerLeft: BackButton }} />
        </Stack>
    );
}
