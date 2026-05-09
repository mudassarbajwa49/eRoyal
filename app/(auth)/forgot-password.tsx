import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../constants/designSystem';
import { Button } from '../../src/components/common/Button';
import { Card } from '../../src/components/common/Card';
import { Input } from '../../src/components/common/Input';
import { useAuth } from '../../src/contexts/AuthContext';

export default function ForgotPasswordScreen() {
    const { sendPasswordReset } = useAuth();
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleReset = async () => {
        if (!email.trim()) {
            setError('Please enter your email address');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const result = await sendPasswordReset(email.trim());
            if (result.success) {
                setSuccess(true);
            } else {
                setError(result.error || 'Failed to send reset email');
            }
        } catch (err) {
            setError('An unexpected error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView style={styles.container} behavior="padding">
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.content}>
                    {/* Back Button */}
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color={Colors.primary[600]} />
                        <Text style={styles.backText}>Back to Login</Text>
                    </TouchableOpacity>

                    <View style={styles.header}>
                        <View style={styles.iconContainer}>
                            <Ionicons name="key-outline" size={40} color={Colors.primary[600]} />
                        </View>
                        <Text style={styles.title}>Forgot Password?</Text>
                        <Text style={styles.subtitle}>
                            Enter your email and we'll send you a link to reset your password.
                        </Text>
                    </View>

                    <Card style={styles.formCard}>
                        {!success ? (
                            <>
                                <Input
                                    label="Email Address"
                                    placeholder="your@email.com"
                                    value={email}
                                    onChangeText={setEmail}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    error={error || undefined}
                                />
                                <Button
                                    title="Send Reset Link"
                                    onPress={handleReset}
                                    loading={loading}
                                    fullWidth
                                    style={styles.resetButton}
                                />
                            </>
                        ) : (
                            <View style={styles.successContainer}>
                                <View style={styles.successIcon}>
                                    <Ionicons name="checkmark-circle" size={64} color="#22C55E" />
                                </View>
                                <Text style={styles.successTitle}>Email Sent!</Text>
                                <Text style={styles.successText}>
                                    We've sent a password reset link to:{"\n"}
                                    <Text style={styles.emailText}>{email}</Text>
                                </Text>
                                <Button
                                    title="Back to Login"
                                    onPress={() => router.replace('/(auth)/login')}
                                    variant="outline"
                                    fullWidth
                                    style={styles.backToLoginButton}
                                />
                            </View>
                        )}
                    </Card>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background.secondary,
    },
    scrollContent: {
        flexGrow: 1,
    },
    content: {
        flex: 1,
        paddingHorizontal: Spacing.xl,
        paddingTop: 60,
        paddingBottom: Spacing.xl,
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Spacing['3xl'],
    },
    backText: {
        marginLeft: 8,
        fontSize: Typography.fontSize.base,
        color: Colors.primary[600],
        fontWeight: Typography.fontWeight.medium,
    },
    header: {
        alignItems: 'center',
        marginBottom: Spacing['3xl'],
    },
    iconContainer: {
        width: 80,
        height: 80,
        backgroundColor: 'rgba(15, 118, 110, 0.1)',
        borderRadius: BorderRadius.full,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Spacing.lg,
    },
    title: {
        fontSize: Typography.fontSize['2xl'],
        fontWeight: Typography.fontWeight.bold,
        color: Colors.text.primary,
        marginBottom: Spacing.xs,
    },
    subtitle: {
        fontSize: Typography.fontSize.base,
        color: Colors.text.secondary,
        textAlign: 'center',
        paddingHorizontal: Spacing.lg,
        lineHeight: 22,
    },
    formCard: {
        padding: Spacing['2xl'],
        ...Shadows.md,
    },
    resetButton: {
        marginTop: Spacing.lg,
    },
    successContainer: {
        alignItems: 'center',
        paddingVertical: Spacing.md,
    },
    successIcon: {
        marginBottom: Spacing.lg,
    },
    successTitle: {
        fontSize: Typography.fontSize.xl,
        fontWeight: Typography.fontWeight.bold,
        color: Colors.text.primary,
        marginBottom: Spacing.sm,
    },
    successText: {
        fontSize: Typography.fontSize.base,
        color: Colors.text.secondary,
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: Spacing['2xl'],
    },
    emailText: {
        color: Colors.text.primary,
        fontWeight: Typography.fontWeight.semibold,
    },
    backToLoginButton: {
        marginTop: Spacing.sm,
    },
});
