// Admin Bill Generation Screen
// Generate monthly bills for one or all residents

import { Picker } from '@react-native-picker/picker';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Button } from '../../../src/components/common/Button';
import { LoadingSpinner } from '../../../src/components/common/LoadingSpinner';
import { useAuth } from '../../../src/contexts/AuthContext';
import { useBreakpoint } from '../../../src/hooks/useResponsive';
import { generateMonthlyBills, generateSingleBill } from '../../../src/services/MonthlyBillingService';
import { getAllUsers } from '../../../src/services/UserManagementService';
import { UserProfile } from '../../../src/types';
import { borderRadius, fontSize, spacing } from '../../../src/utils/responsive';

export default function GenerateBillsScreen() {
    const router = useRouter();
    const { userProfile } = useAuth();
    const breakpoint = useBreakpoint();
    const [residents, setResidents] = useState<UserProfile[]>([]);
    const [selectedResident, setSelectedResident] = useState<string>('all');
    const [baseCharges, setBaseCharges] = useState('5000');
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);

    // Get current month
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const [month, setMonth] = useState(currentMonth);

    useEffect(() => {
        loadResidents();
    }, []);

    const loadResidents = async () => {
        try {
            const users = await getAllUsers();
            const residentUsers = users.filter((u: UserProfile) => u.role === 'resident');
            setResidents(residentUsers);
        } catch (error) {
            console.error('Error loading residents:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleGenerate = async () => {
        if (!userProfile) return;

        const charges = parseFloat(baseCharges);
        if (isNaN(charges) || charges < 0) {
            Alert.alert('Invalid Amount', 'Please enter a valid base charge amount');
            return;
        }

        setGenerating(true);

        try {
            if (selectedResident === 'all') {
                // Generate for all residents
                const result = await generateMonthlyBills(month, charges, userProfile.uid);

                if (result.success) {
                    const data = result.data as any;
                    const created = data?.billsCreated || 0;
                    const skipped = data?.billsSkipped || 0;

                    let message = '';
                    if (skipped > 0) {
                        message = `✅ ${created} bill${created !== 1 ? 's' : ''} created successfully\n⚠️ ${skipped} bill${skipped !== 1 ? 's' : ''} already existed (skipped)\n\nTotal residents: ${created + skipped}`;
                    } else {
                        message = `✅ ${created} bill${created !== 1 ? 's' : ''} created successfully for ${month}`;
                    }

                    Alert.alert(
                        'Generation Complete',
                        message,
                        [{ text: 'OK', onPress: () => router.back() }]
                    );
                } else {
                    Alert.alert('Error', result.error || 'Failed to generate bills');
                }
            } else {
                // Generate for single resident
                const resident = residents.find(r => r.uid === selectedResident);
                if (!resident) {
                    Alert.alert('Error', 'Selected resident not found');
                    return;
                }

                const result = await generateSingleBill(
                    selectedResident,
                    resident.name,
                    resident.houseNo || '',
                    month,
                    charges,
                    userProfile.uid
                );

                if (result.success) {
                    Alert.alert(
                        'Bill Created',
                        `✅ Bill created successfully for:\n\n${resident.name}\nHouse: ${resident.houseNo}\nMonth: ${month}\nAmount: Rs. ${charges.toLocaleString()}`,
                        [{ text: 'OK', onPress: () => router.back() }]
                    );
                } else {
                    // Check if it's a duplicate error
                    if (result.error?.includes('already exists')) {
                        Alert.alert(
                            'Bill Already Exists',
                            `⚠️ A bill already exists for:\n\n${resident.name}\nHouse: ${resident.houseNo}\nMonth: ${month}\n\nPlease check the bills list.`,
                            [{ text: 'OK' }]
                        );
                    } else {
                        Alert.alert('Error', result.error || 'Failed to generate bill');
                    }
                }
            }
        } catch (error) {
            Alert.alert('Error', 'An unexpected error occurred');
            console.error('Bill generation error:', error);
        } finally {
            setGenerating(false);
        }
    };

    if (loading) {
        return <LoadingSpinner message="Loading residents..." />;
    }

    return (
        <ScrollView style={styles.container}>
            <View style={[styles.content, { padding: spacing.lg }]}>
                <Text style={[styles.title, { fontSize: breakpoint.mobile ? fontSize['2xl'] : fontSize['3xl'] }]}>
                    Generate Monthly Bills
                </Text>
                <Text style={[styles.subtitle, { fontSize: fontSize.sm }]}>
                    Create bills for residents with automatic duplicate detection
                </Text>

                {/* Month Selection */}
                <View style={[styles.section, { marginBottom: spacing.xl }]}>
                    <Text style={[styles.label, { fontSize: fontSize.base, marginBottom: spacing.sm }]}>
                        Billing Month
                    </Text>
                    <TextInput
                        style={[
                            styles.input,
                            {
                                borderRadius: borderRadius.md,
                                padding: spacing.md,
                                fontSize: fontSize.base
                            }
                        ]}
                        value={month}
                        onChangeText={setMonth}
                        placeholder="YYYY-MM (e.g., 2026-01)"
                    />
                    <Text style={[styles.helperText, { fontSize: fontSize.xs, marginTop: spacing.xs }]}>
                        Format: YYYY-MM
                    </Text>
                </View>

                {/* Base Charges */}
                <View style={[styles.section, { marginBottom: spacing.xl }]}>
                    <Text style={[styles.label, { fontSize: fontSize.base, marginBottom: spacing.sm }]}>
                        Base Monthly Charges (PKR)
                    </Text>
                    <TextInput
                        style={[
                            styles.input,
                            {
                                borderRadius: borderRadius.md,
                                padding: spacing.md,
                                fontSize: fontSize.base
                            }
                        ]}
                        value={baseCharges}
                        onChangeText={setBaseCharges}
                        placeholder="5000"
                        keyboardType="numeric"
                    />
                    <Text style={[styles.helperText, { fontSize: fontSize.xs, marginTop: spacing.xs }]}>
                        Standard monthly maintenance fee
                    </Text>
                </View>

                {/* Resident Selection - DROPDOWN */}
                <View style={[styles.section, { marginBottom: spacing.xl }]}>
                    <Text style={[styles.label, { fontSize: fontSize.base, marginBottom: spacing.sm }]}>
                        Select Resident(s)
                    </Text>
                    <View style={[styles.pickerContainer, { borderRadius: borderRadius.md }]}>
                        <Picker
                            selectedValue={selectedResident}
                            onValueChange={(value) => setSelectedResident(value)}
                            style={styles.picker}
                        >
                            <Picker.Item
                                label={`All Residents (${residents.length})`}
                                value="all"
                            />
                            {residents.map((resident) => (
                                <Picker.Item
                                    key={resident.uid}
                                    label={`${resident.name} - House ${resident.houseNo}`}
                                    value={resident.uid}
                                />
                            ))}
                        </Picker>
                    </View>
                    <Text style={[styles.helperText, { fontSize: fontSize.xs, marginTop: spacing.xs }]}>
                        {selectedResident === 'all'
                            ? `Generate bills for all ${residents.length} residents`
                            : 'Generate bill for selected resident only'}
                    </Text>
                </View>

                {/* Info Box */}
                <View style={[styles.infoBox, { padding: spacing.lg, borderRadius: borderRadius.md, marginBottom: spacing.xl }]}>
                    <Text style={styles.infoIcon}>ℹ️</Text>
                    <View style={styles.infoContent}>
                        <Text style={[styles.infoTitle, { fontSize: fontSize.sm }]}>
                            Auto-Duplicate Detection
                        </Text>
                        <Text style={[styles.infoText, { fontSize: fontSize.xs }]}>
                            • Checks if bill already exists{'\n'}
                            • Skips residents with existing bills{'\n'}
                            • Carries forward previous unpaid dues{'\n'}
                            • Bills created in Draft status
                        </Text>
                    </View>
                </View>

                {/* Action Buttons */}
                <View style={[styles.actions, { gap: spacing.md }]}>
                    <Button
                        title="Cancel"
                        onPress={() => router.back()}
                        variant="secondary"
                        style={styles.button}
                    />
                    <Button
                        title={generating ? 'Generating...' : 'Generate Bills'}
                        onPress={handleGenerate}
                        variant="primary"
                        loading={generating}
                        style={styles.button}
                    />
                </View>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F7FA',
    },
    content: {
        // padding handled by responsive spacing
    },
    title: {
        fontWeight: '700',
        color: '#333',
        marginBottom: 8,
    },
    subtitle: {
        color: '#666',
        marginBottom: 24,
    },
    section: {
        // marginBottom handled by responsive spacing
    },
    label: {
        fontWeight: '600',
        color: '#333',
    },
    input: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#DDD',
        color: '#333',
    },
    helperText: {
        color: '#999',
    },
    pickerContainer: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#DDD',
        overflow: 'hidden',
    },
    picker: {
        height: 50,
    },
    infoBox: {
        flexDirection: 'row',
        backgroundColor: '#E3F2FD',
    },
    infoIcon: {
        fontSize: 24,
        marginRight: 12,
    },
    infoContent: {
        flex: 1,
    },
    infoTitle: {
        fontWeight: '600',
        color: '#1976D2',
        marginBottom: 4,
    },
    infoText: {
        color: '#555',
        lineHeight: 20,
    },
    actions: {
        flexDirection: 'row',
    },
    button: {
        flex: 1,
    },
});
