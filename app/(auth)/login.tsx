// Login Screen
// Universal login for all user roles (admin, resident, security)

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Image, KeyboardAvoidingView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants/designSystem';
import { Button } from '../../src/components/common/Button';
import { Card } from '../../src/components/common/Card';
import { Input } from '../../src/components/common/Input';
import { useAuth } from '../../src/contexts/AuthContext';

export default function LoginScreen() {
    const { login } = useAuth();
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [loginError, setLoginError] = useState('');
    const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

    const validateForm = (): boolean => {
        const newErrors: { email?: string; password?: string } = {};

        if (!email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(email)) {
            newErrors.email = 'Email is invalid';
        }

        if (!password) {
            newErrors.password = 'Password is required';
        } else if (password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleLogin = async () => {
        console.log('Login button clicked');

        if (!validateForm()) {
            console.log('Form validation failed', errors);
            return;
        }

        console.log('Attempting login with:', email);
        setLoading(true);
        setErrors({});
        setLoginError('');

        try {
            const result = await login(email.trim(), password);
            console.log('Login result:', result);

            setLoading(false);

            if (!result.success) {
                console.error('Login failed:', result.error);
                const msg = result.error || 'Invalid credentials';
                setLoginError(msg);
                Alert.alert('Login Failed', msg);
            } else {
                console.log('Login successful!');

                // Force navigation based on role
                const profile = result.data?.profile;
                if (profile?.role) {
                    console.log('📱 Manually navigating to dashboard for role:', profile.role);
                    const role = profile.role.toLowerCase(); // Make case-insensitive
                    switch (role) {
                        case 'admin':
                            router.replace('/(admin)/dashboard');
                            break;
                        case 'resident':
                            router.replace('/(resident)/home');
                            break;
                        case 'security':
                            router.replace('/(security)/gate-entry');
                            break;
                        default:
                            Alert.alert('Error', 'Unknown user role: ' + profile.role);
                    }
                } else {
                    Alert.alert('Error', 'User role not found');
                }
            }
        } catch (error) {
            console.error('Login error caught:', error);
            setLoading(false);
            const msg = 'An unexpected error occurred.';
            setLoginError(msg);
            Alert.alert('Error', msg);
        }
        // Navigation handled automatically by AuthContext + RootLayout
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior="padding"
        >
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="always"
            >
                <View style={styles.content}>
                    {/* Logo/Header */}
                    <View style={styles.header}>
                        <View style={styles.logoContainer}>
                            <Image 
                                source={require('../../assets/images/app-logo.png')} 
                                style={styles.logoImage}
                                resizeMode="contain"
                            />
                        </View>
                        <Text style={styles.title}>eRoyal</Text>
                        <Text style={styles.subtitle}>Royal City</Text>
                        <Text style={styles.subtitle}>Housing Society Management</Text>
                    </View>

                    {/* Login Form in a Card */}
                    <Card style={styles.formCard}>
                        <Input
                            label="Email"
                            placeholder="Enter your email"
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoCorrect={false}
                            error={errors.email}
                            required
                        />

                        <Input
                            label="Password"
                            placeholder="Enter your password"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                            error={errors.password}
                            required
                        />

                        <TouchableOpacity 
                            onPress={() => router.push('/(auth)/forgot-password')}
                            style={styles.forgotPasswordContainer}
                        >
                            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                        </TouchableOpacity>

                        <Button
                            title="Sign In"
                            onPress={handleLogin}
                            loading={loading}
                            fullWidth
                            style={styles.loginButton}
                        />

                        {/* Visible error banner — works even if Alert is blocked on web */}
                        {loginError ? (
                            <View style={styles.errorBanner}>
                                <Text style={styles.errorBannerText}>⚠️ {loginError}</Text>
                            </View>
                        ) : null}
                    </Card>

                    {/* Footer */}
                    <View style={styles.footer}>
                        <Text style={styles.footerText}>
                            No account? Contact your administrator.
                        </Text>
                        <Text style={styles.versionText}>Version 1.0.0</Text>
                    </View>
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
        flexGrow: 1
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: Spacing.xl,
        paddingVertical: Spacing['4xl']
    },
    header: {
        alignItems: 'center',
        marginBottom: Spacing['3xl']
    },
    logoContainer: {
        width: 100,
        height: 100,
        backgroundColor: Colors.background.surface,
        borderRadius: BorderRadius.full,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.lg,
        shadowColor: Colors.primary[900],
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1,
        shadowRadius: 16,
        elevation: 8,
    },
    logoImage: {
        width: 80,
        height: 80,
    },
    title: {
        fontSize: Typography.fontSize['3xl'],
        fontWeight: Typography.fontWeight.bold,
        color: Colors.text.primary,
        marginBottom: Spacing.xs
    },
    subtitle: {
        fontSize: Typography.fontSize.base,
        color: Colors.text.secondary,
        textAlign: 'center'
    },
    formCard: {
        width: '100%',
        maxWidth: 420,
        alignSelf: 'center',
        padding: Spacing['2xl'],
    },
    forgotPasswordContainer: {
        alignSelf: 'flex-end',
        marginBottom: Spacing.xl,
        marginTop: -Spacing.xs,
    },
    forgotPasswordText: {
        color: Colors.primary[600],
        fontSize: Typography.fontSize.sm,
        fontWeight: Typography.fontWeight.semibold,
    },
    loginButton: {
        marginTop: Spacing.md
    },
    footer: {
        marginTop: Spacing['3xl'],
        alignItems: 'center'
    },
    footerText: {
        fontSize: Typography.fontSize.sm,
        color: Colors.text.secondary,
        textAlign: 'center',
        marginBottom: Spacing.lg
    },
    versionText: {
        fontSize: Typography.fontSize.xs,
        color: Colors.text.tertiary
    },
    errorBanner: {
        marginTop: Spacing.md,
        backgroundColor: Colors.error.light,
        borderRadius: BorderRadius.md,
        padding: Spacing.md,
        borderLeftWidth: 4,
        borderLeftColor: Colors.error.main
    },
    errorBannerText: {
        color: Colors.error.main,
        fontSize: Typography.fontSize.sm,
        fontWeight: Typography.fontWeight.medium
    }
});
