// Root Index - Redirects to appropriate screen
// This is the entry point when visiting http://localhost:8081

import { Redirect } from 'expo-router';
import { LoadingSpinner } from '../src/components/common/LoadingSpinner';
import { useAuth } from '../src/contexts/AuthContext';

export default function Index() {
    const { currentUser, userRole, loading } = useAuth();

    if (loading) {
        return <LoadingSpinner message="Loading eRoyal..." />;
    }

    // If user is logged in, redirect to their dashboard
    if (currentUser && userRole) {
        switch (userRole) {
            case 'admin':
                return <Redirect href="/(admin)/dashboard" />;
            case 'resident':
                return <Redirect href="/(resident)/home" />;
            case 'security':
                return <Redirect href="/(security)/gate-entry" />;
            default:
                return <Redirect href="/(auth)/login" />;
        }
    }

    // Not logged in, redirect to login
    return <Redirect href="/(auth)/login" />;
}
