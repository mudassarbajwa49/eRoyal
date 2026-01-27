// Error Boundary Component
// Catches React errors and gracefully displays fallback UI

import React, { ErrorInfo, ReactNode } from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';
import { logger } from '../../utils/logger';

interface ErrorBoundaryProps {
    children: ReactNode;
    fallback?: ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
        };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return {
            hasError: true,
            error,
        };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
        // Log error to console in development
        logger.error('Error caught by Error Boundary:', error);
        logger.debug('Error Info:', errorInfo);

        // In production, you would send this to an error tracking service
        // Example: Sentry.captureException(error, { extra: errorInfo });
    }

    handleReset = (): void => {
        this.setState({
            hasError: false,
            error: null,
        });
    };

    render(): ReactNode {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <View style={styles.container}>
                    <Text style={styles.emoji}>😕</Text>
                    <Text style={styles.title}>Oops! Something went wrong</Text>
                    <Text style={styles.message}>
                        Sorry for the inconvenience. Please try reloading.
                    </Text>
                    {__DEV__ && this.state.error && (
                        <View style={styles.errorDetails}>
                            <Text style={styles.errorTitle}>Error Details (Dev Only):</Text>
                            <Text style={styles.errorText}>{this.state.error.message}</Text>
                        </View>
                    )}
                    <Button title="Reload" onPress={this.handleReset} />
                </View>
            );
        }

        return this.props.children;
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#F5F7FA',
    },
    emoji: {
        fontSize: 64,
        marginBottom: 16,
    },
    title: {
        fontSize: 20,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
        textAlign: 'center',
    },
    message: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginBottom: 24,
        paddingHorizontal: 20,
    },
    errorDetails: {
        backgroundColor: '#FFF3CD',
        padding: 16,
        borderRadius: 8,
        marginBottom: 16,
        borderLeftWidth: 4,
        borderLeftColor: '#FF9800',
        maxWidth: '100%',
    },
    errorTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#856404',
        marginBottom: 8,
    },
    errorText: {
        fontSize: 12,
        color: '#856404',
        fontFamily: 'monospace',
    },
});
