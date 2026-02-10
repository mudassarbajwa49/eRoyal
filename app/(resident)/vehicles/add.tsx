// Resident Add Vehicle Screen
// Register a new vehicle (Car/Bike)

import { Stack, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Colors, Spacing, Typography } from '../../../constants/designSystem';
import { Button } from '../../../src/components/common/Button';
import { Card } from '../../../src/components/common/Card';
import { useAuth } from '../../../src/contexts/AuthContext';
import { registerVehicle } from '../../../src/services/vehicleRegistrationService';
import { RegisteredVehicleType } from '../../../src/types';

const vehicleTypes: { value: RegisteredVehicleType; label: string; icon: string }[] = [
    { value: 'Car', label: 'Car', icon: '🚗' },
    { value: 'Bike', label: 'Bike', icon: '🏍️' },
];

export default function AddVehicleScreen() {
    const router = useRouter();
    const { userProfile } = useAuth();
    const [vehicleNo, setVehicleNo] = useState('');
    const [vehicleType, setVehicleType] = useState<RegisteredVehicleType>('Car');
    const [color, setColor] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async () => {
        if (!userProfile) return;

        // Validate
        if (!vehicleNo.trim()) {
            setError('Vehicle number is required');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const result = await registerVehicle(
                vehicleNo.trim(),
                vehicleType,
                userProfile.uid,
                userProfile.name,
                userProfile.houseNo || '',
                color.trim() || undefined
            );

            if (result.success) {
                window.alert('Success: ' + (result.message || 'Vehicle registered successfully!'));
                router.back();
            } else {
                setError(result.error || 'Failed to register vehicle');
            }
        } catch (err) {
            setError('An unexpected error occurred');
            console.error('Error registering vehicle:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Stack.Screen options={{ title: 'Add Vehicle' }} />
            <ScrollView style={styles.container} contentContainerStyle={styles.content}>
                <Card>
                    {/* Vehicle Number */}
                    <View style={styles.field}>
                        <Text style={styles.label}>Vehicle Number *</Text>
                        <TextInput
                            style={styles.input}
                            value={vehicleNo}
                            onChangeText={setVehicleNo}
                            placeholder="e.g., ABC-1234"
                            placeholderTextColor={Colors.text.tertiary}
                            autoCapitalize="characters"
                        />
                    </View>

                    {/* Vehicle Type */}
                    <View style={styles.field}>
                        <Text style={styles.label}>Vehicle Type *</Text>
                        <View style={styles.typeContainer}>
                            {vehicleTypes.map((type) => (
                                <TouchableOpacity
                                    key={type.value}
                                    style={[
                                        styles.typeOption,
                                        vehicleType === type.value && styles.typeOptionSelected
                                    ]}
                                    onPress={() => setVehicleType(type.value)}
                                >
                                    <Text style={styles.typeIcon}>{type.icon}</Text>
                                    <Text style={[
                                        styles.typeLabel,
                                        vehicleType === type.value && styles.typeLabelSelected
                                    ]}>
                                        {type.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Color (Optional) */}
                    <View style={styles.field}>
                        <Text style={styles.label}>Color (Optional)</Text>
                        <TextInput
                            style={styles.input}
                            value={color}
                            onChangeText={setColor}
                            placeholder="e.g., White, Black, Silver"
                            placeholderTextColor={Colors.text.tertiary}
                        />
                    </View>

                    {/* Error Message */}
                    {error ? (
                        <View style={styles.errorContainer}>
                            <Text style={styles.errorText}>{error}</Text>
                        </View>
                    ) : null}

                    {/* Submit Button */}
                    <Button
                        title="Register Vehicle"
                        onPress={handleSubmit}
                        loading={loading}
                        variant="primary"
                        style={styles.submitButton}
                    />
                </Card>
            </ScrollView>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background.secondary,
    },
    content: {
        padding: Spacing.lg,
    },
    field: {
        marginBottom: Spacing.lg,
    },
    label: {
        fontSize: Typography.fontSize.sm,
        fontWeight: Typography.fontWeight.medium,
        color: Colors.text.secondary,
        marginBottom: Spacing.sm,
    },
    input: {
        backgroundColor: Colors.background.secondary,
        borderRadius: 12,
        padding: Spacing.md,
        fontSize: Typography.fontSize.base,
        color: Colors.text.primary,
        borderWidth: 1,
        borderColor: Colors.border.light,
    },
    typeContainer: {
        flexDirection: 'row',
        gap: Spacing.md,
    },
    typeOption: {
        flex: 1,
        padding: Spacing.lg,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: Colors.border.light,
        alignItems: 'center',
        backgroundColor: Colors.background.secondary,
    },
    typeOptionSelected: {
        borderColor: Colors.primary[500],
        backgroundColor: Colors.primary[100] + '20',
    },
    typeIcon: {
        fontSize: 32,
        marginBottom: Spacing.sm,
    },
    typeLabel: {
        fontSize: Typography.fontSize.base,
        fontWeight: Typography.fontWeight.medium,
        color: Colors.text.secondary,
    },
    typeLabelSelected: {
        color: Colors.primary[500],
        fontWeight: Typography.fontWeight.semibold,
    },
    errorContainer: {
        backgroundColor: Colors.error.light + '20',
        padding: Spacing.md,
        borderRadius: 8,
        marginBottom: Spacing.lg,
    },
    errorText: {
        color: Colors.error.main,
        fontSize: Typography.fontSize.sm,
    },
    submitButton: {
        marginTop: Spacing.md,
    },
});
