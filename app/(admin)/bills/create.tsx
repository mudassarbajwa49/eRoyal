// Create Bill Screen (Admin)
// Generate monthly bills for residents

import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ResidentPicker } from '../../../src/components/admin/ResidentPicker';
import { Button } from '../../../src/components/common/Button';
import { Card } from '../../../src/components/common/Card';
import { Input } from '../../../src/components/common/Input';
import { createBill } from '../../../src/services/MonthlyBillingService';
import { UserProfile } from '../../../src/types';

export default function CreateBillScreen() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [selectedResident, setSelectedResident] = useState<UserProfile | null>(null);
    const [formData, setFormData] = useState({
        month: `${new Date().toLocaleString('default', { month: 'long' })} ${new Date().getFullYear()}`,
        amount: '',
        dueDate: ''
    });
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    useEffect(() => {
        // Set default due date to end of current month
        const date = new Date();
        const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        setFormData(prev => ({ ...prev, dueDate: lastDay.toISOString().split('T')[0] }));
    }, []);

    const handleResidentSelect = (resident: UserProfile | null) => {
        setSelectedResident(resident);
        // Clear resident error when selected
        if (resident && errors.resident) {
            setErrors({ ...errors, resident: '' });
        }
    };

    const validateForm = (): boolean => {
        const newErrors: { [key: string]: string } = {};

        if (!selectedResident) {
            newErrors.resident = 'Please select a resident';
        }

        if (!formData.amount || parseFloat(formData.amount) <= 0) {
            newErrors.amount = 'Please enter a valid amount';
        }

        if (!formData.dueDate) {
            newErrors.dueDate = 'Please select a due date';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validateForm() || !selectedResident) return;

        setLoading(true);

        const result = await createBill({
            residentId: selectedResident.uid,
            residentName: selectedResident.name,
            houseNo: selectedResident.houseNo || '',
            month: formData.month,
            amount: parseFloat(formData.amount),
            dueDate: new Date(formData.dueDate)
        });

        setLoading(false);

        if (result.success) {
            Alert.alert('Success', 'Bill created successfully', [
                { text: 'OK', onPress: () => router.back() }
            ]);
        } else {
            Alert.alert('Error', result.error || 'Failed to create bill');
        }
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.content}>
                <Card>
                    <Text style={styles.sectionTitle}>Bill Information</Text>

                    <ResidentPicker
                        selectedResident={selectedResident}
                        onSelectResident={handleResidentSelect}
                        placeholder="Select a resident to generate bill"
                        error={errors.resident}
                    />

                    {selectedResident && (
                        <View style={styles.residentInfo}>
                            <Text style={styles.infoLabel}>Selected Resident:</Text>
                            <Text style={styles.infoText}>
                                {selectedResident.name} - House {selectedResident.houseNo}
                            </Text>
                        </View>
                    )}

                    <Input
                        label="Billing Month"
                        placeholder="e.g., December 2025"
                        value={formData.month}
                        onChangeText={(value) => setFormData({ ...formData, month: value })}
                        required
                    />

                    <Input
                        label="Amount (PKR)"
                        placeholder="Enter bill amount"
                        value={formData.amount}
                        onChangeText={(value) => setFormData({ ...formData, amount: value })}
                        keyboardType="numeric"
                        error={errors.amount}
                        required
                    />

                    <Input
                        label="Due Date"
                        placeholder="YYYY-MM-DD"
                        value={formData.dueDate}
                        onChangeText={(value) => setFormData({ ...formData, dueDate: value })}
                        error={errors.dueDate}
                        required
                    />

                    <Button
                        title="Create Bill"
                        onPress={handleSubmit}
                        loading={loading}
                        fullWidth
                        style={styles.submitButton}
                    />

                    <Button
                        title="Cancel"
                        onPress={() => router.back()}
                        variant="secondary"
                        fullWidth
                        style={styles.cancelButton}
                    />
                </Card>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F7FA'
    },
    content: {
        padding: 16
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginBottom: 16
    },
    residentInfo: {
        backgroundColor: '#F0F8FF',
        padding: 12,
        borderRadius: 8,
        marginBottom: 16,
        borderLeftWidth: 3,
        borderLeftColor: '#007AFF'
    },
    infoLabel: {
        fontSize: 12,
        color: '#666',
        marginBottom: 4
    },
    infoText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333'
    },
    submitButton: {
        marginTop: 8
    },
    cancelButton: {
        marginTop: 12
    }
});

