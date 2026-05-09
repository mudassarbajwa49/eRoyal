// Bills Layout (Resident)
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { TouchableOpacity } from 'react-native';
import { Colors, Typography } from '../../../constants/designSystem';

export default function BillsLayout() {
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
            {/* index = My Bills list */}
            <Stack.Screen name="index" options={{ title: 'My Bills', headerLeft: () => <BackButton /> }} />
            {/* Bill detail — always show back button */}
            <Stack.Screen name="[id]" options={{ title: 'Bill Details', headerLeft: BackButton }} />
            <Stack.Screen name="payment/[id]" options={{ title: 'Make Payment', headerLeft: BackButton }} />
        </Stack>
    );
}
