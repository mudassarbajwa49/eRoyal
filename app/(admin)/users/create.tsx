// Create User Screen (Admin)
// Admin creates resident or security accounts

import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from '../../../src/components/common/Button';
import { Card } from '../../../src/components/common/Card';
import { Input } from '../../../src/components/common/Input';
import { useAuth } from '../../../src/contexts/AuthContext';
import { createUserAccount, generateTemporaryPassword } from '../../../src/services/authService';
import { UserRole } from '../../../src/types';

export default function CreateUserScreen() {
    const { userProfile } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'resident' as UserRole,
        houseNo: '',
        cnic: ''
    });

    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    const validateForm = (): boolean => {
        const newErrors: { [key: string]: string } = {};

        if (!formData.name.trim()) {
            newErrors.name = 'Name is required';
        }

        if (!formData.email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Email is invalid';
        }

        if (!formData.password) {
            newErrors.password = 'Password is required';
        } else if (formData.password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters';
        }

        if (formData.role === 'resident' && !formData.houseNo.trim()) {
            newErrors.houseNo = 'House number is required for residents';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const downloadCredentials = async (name: string, email: string, password: string, role: string) => {
        const content = `eRoyal Housing Society - User Credentials
========================================

Name: ${name}
Email: ${email}
Password: ${password}
Role: ${role.charAt(0).toUpperCase() + role.slice(1)}

Created on: ${new Date().toLocaleDateString()}

IMPORTANT: Please change this password after first login.

---
eRoyal Housing Society Management System
`;

        if (Platform.OS === 'web') {
            // Web Download
            const blob = new Blob([content], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${name.replace(/ /g, '_')}_credentials.txt`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } else {
            // Mobile: Just show alert (or could use expo-file-system/sharing)
            Alert.alert('Credentials', content);
        }
    };

    const handleSubmit = async () => {
        if (!userProfile?.uid) {
            Alert.alert('Error', 'Admin session invalid. Please login again.');
            return;
        }

        if (!validateForm()) return;

        setLoading(true);

        // Uses the robust, isolated auth service
        const result = await createUserAccount(formData, userProfile.uid);

        setLoading(false);

        if (result.success) {
            // Download credentials as TXT file
            downloadCredentials(formData.name, formData.email, formData.password, formData.role);

            // Show success message
            Alert.alert(
                'Success',
                `${formData.role.charAt(0).toUpperCase() + formData.role.slice(1)} account created successfully!\n\nCredentials have been downloaded as a text file.\n\nEmail: ${formData.email}\nPassword: ${formData.password}`
            );

            // Navigate back immediately (web-friendly)
            setTimeout(() => {
                if (router.canGoBack()) {
                    router.back();
                } else {
                    router.replace('/(admin)/users');
                }
            }, 100);

        } else {
            Alert.alert('Error', result.error || 'Failed to create user account');
        }
    };

    const handleGeneratePassword = () => {
        const generatedPassword = generateTemporaryPassword();
        setFormData({ ...formData, password: generatedPassword });
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.content}>
                <Card>
                    <Text style={styles.sectionTitle}>User Information</Text>

                    <Input
                        label="Full Name"
                        placeholder="Enter full name"
                        value={formData.name}
                        onChangeText={(value) => setFormData({ ...formData, name: value })}
                        error={errors.name}
                        required
                    />

                    <Input
                        label="Email"
                        placeholder="Enter email address"
                        value={formData.email}
                        onChangeText={(value) => setFormData({ ...formData, email: value })}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        error={errors.email}
                        required
                    />

                    <View style={styles.passwordContainer}>
                        <Input
                            label="Temporary Password"
                            placeholder="Enter password"
                            value={formData.password}
                            onChangeText={(value) => setFormData({ ...formData, password: value })}
                            error={errors.password}
                            required
                            containerStyle={styles.passwordInput}
                        />
                        <Button
                            title="Generate"
                            onPress={handleGeneratePassword}
                            variant="secondary"
                            style={styles.generateButton}
                        />
                    </View>

                    <View style={styles.roleSelector}>
                        <Text style={styles.label}>User Role *</Text>
                        <View style={styles.roleButtons}>
                            <Button
                                title="Resident"
                                onPress={() => setFormData({ ...formData, role: 'resident' })}
                                variant={formData.role === 'resident' ? 'primary' : 'secondary'}
                                style={styles.roleButton}
                            />
                            <Button
                                title="Security"
                                onPress={() => setFormData({ ...formData, role: 'security' })}
                                variant={formData.role === 'security' ? 'primary' : 'secondary'}
                                style={styles.roleButton}
                            />
                        </View>
                    </View>

                    {formData.role === 'resident' && (
                        <>
                            <Input
                                label="House Number"
                                placeholder="e.g., A-12"
                                value={formData.houseNo}
                                onChangeText={(value) => setFormData({ ...formData, houseNo: value })}
                                autoCapitalize="characters"
                                error={errors.houseNo}
                                required
                            />

                            <Input
                                label="CNIC (Optional)"
                                placeholder="e.g., 12345-1234567-1"
                                value={formData.cnic}
                                onChangeText={(value) => setFormData({ ...formData, cnic: value })}
                                keyboardType="numeric"
                            />
                        </>
                    )}

                    <Button
                        title="Create Account"
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
    passwordContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12
    },
    passwordInput: {
        flex: 1,
        marginBottom: 0
    },
    generateButton: {
        marginTop: 28,
        paddingHorizontal: 16
    },
    roleSelector: {
        marginBottom: 16
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        color: '#333',
        marginBottom: 8
    },
    roleButtons: {
        flexDirection: 'row',
        gap: 12
    },
    roleButton: {
        flex: 1
    },
    submitButton: {
        marginTop: 8
    },
    cancelButton: {
        marginTop: 12
    }
});
