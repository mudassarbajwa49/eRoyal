// Login Screen
// Universal login for all user roles (admin, resident, security)

import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from '../../src/components/common/Button';
import { Input } from '../../src/components/common/Input';
import { useAuth } from '../../src/contexts/AuthContext';

export default function LoginScreen() {
    const { login } = useAuth();
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
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

        try {
            const result = await login(email.trim(), password);
            console.log('Login result:', result);

            setLoading(false);

            if (!result.success) {
                console.error('Login failed:', result.error);
                Alert.alert('Login Failed', result.error || 'Invalid credentials');
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
            Alert.alert('Error', 'An unexpected error occurred. Check console for details.');
        }
        // Navigation handled automatically by AuthContext + RootLayout
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
            >
                <View style={styles.content}>
                    {/* Logo/Header */}
                    <View style={styles.header}>
                        <Text style={styles.logo}>🏘️</Text>
                        <Text style={styles.title}>eRoyal</Text>
                        <Text style={styles.subtitle}>Housing Society Management</Text>
                    </View>

                    {/* Login Form */}
                    <View style={styles.form}>
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

                        <Button
                            title="Sign In"
                            onPress={handleLogin}
                            loading={loading}
                            fullWidth
                            style={styles.loginButton}
                        />
                    </View>

                    {/* Footer */}
                    <View style={styles.footer}>
                        <Text style={styles.footerText}>
                            Don't have an account? Contact your administrator.
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
        backgroundColor: '#F5F7FA'
    },
    scrollContent: {
        flexGrow: 1
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 24,
        paddingVertical: 40
    },
    header: {
        alignItems: 'center',
        marginBottom: 48
    },
    logo: {
        fontSize: 72,
        marginBottom: 16
    },
    title: {
        fontSize: 32,
        fontWeight: '700',
        color: '#333',
        marginBottom: 8
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center'
    },
    form: {
        width: '100%',
        maxWidth: 400,
        alignSelf: 'center'
    },
    loginButton: {
        marginTop: 8
    },
    footer: {
        marginTop: 40,
        alignItems: 'center'
    },
    footerText: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginBottom: 16
    },
    versionText: {
        fontSize: 12,
        color: '#999'
    }
});
