// Change Password Screen (Resident Only)
// Residents can update their password

import { useRouter } from 'expo-router';
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { auth } from '../../firebaseConfig';
import { Button } from '../../src/components/common/Button';
import { Card } from '../../src/components/common/Card';
import { Input } from '../../src/components/common/Input';

export default function ChangePasswordScreen() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    const validateForm = (): boolean => {
        const newErrors: { [key: string]: string } = {};

        if (!formData.currentPassword) {
            newErrors.currentPassword = 'Current password is required';
        }

        if (!formData.newPassword) {
            newErrors.newPassword = 'New password is required';
        } else if (formData.newPassword.length < 6) {
            newErrors.newPassword = 'Password must be at least 6 characters';
        }

        if (formData.newPassword !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }

        if (formData.currentPassword === formData.newPassword) {
            newErrors.newPassword = 'New password must be different from current password';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChangePassword = async () => {
        if (!validateForm()) return;

        const user = auth.currentUser;
        if (!user || !user.email) {
            Alert.alert('Error', 'User not found');
            return;
        }

        setLoading(true);

        try {
            // Re-authenticate user with current password
            const credential = EmailAuthProvider.credential(user.email, formData.currentPassword);
            await reauthenticateWithCredential(user, credential);

            // Update password
            await updatePassword(user, formData.newPassword);

            setLoading(false);

            Alert.alert(
                'Success',
                'Password changed successfully!',
                [{ text: 'OK', onPress: () => router.back() }]
            );
        } catch (error: any) {
            setLoading(false);

            let errorMessage = 'Failed to change password';

            if (error.code === 'auth/wrong-password') {
                errorMessage = 'Current password is incorrect';
            } else if (error.code === 'auth/weak-password') {
                errorMessage = 'New password is too weak';
            } else if (error.code === 'auth/requires-recent-login') {
                errorMessage = 'Please logout and login again, then try changing password';
            }

            Alert.alert('Error', errorMessage);
            console.error('Change password error:', error);
        }
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.content}>
                <Card>
                    <Text style={styles.title}>Change Password</Text>
                    <Text style={styles.subtitle}>
                        Please enter your current password and choose a new password.
                    </Text>

                    <Input
                        label="Current Password"
                        placeholder="Enter current password"
                        value={formData.currentPassword}
                        onChangeText={(value) => setFormData({ ...formData, currentPassword: value })}
                        secureTextEntry
                        error={errors.currentPassword}
                        required
                    />

                    <Input
                        label="New Password"
                        placeholder="Enter new password (min 6 characters)"
                        value={formData.newPassword}
                        onChangeText={(value) => setFormData({ ...formData, newPassword: value })}
                        secureTextEntry
                        error={errors.newPassword}
                        required
                    />

                    <Input
                        label="Confirm New Password"
                        placeholder="Re-enter new password"
                        value={formData.confirmPassword}
                        onChangeText={(value) => setFormData({ ...formData, confirmPassword: value })}
                        secureTextEntry
                        error={errors.confirmPassword}
                        required
                    />

                    <Button
                        title="Change Password"
                        onPress={handleChangePassword}
                        loading={loading}
                        fullWidth
                        style={styles.submitButton}
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
    title: {
        fontSize: 20,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8
    },
    subtitle: {
        fontSize: 14,
        color: '#666',
        marginBottom: 24,
        lineHeight: 20
    },
    submitButton: {
        marginTop: 8
    }
});
