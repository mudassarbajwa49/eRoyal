import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { LoadingSpinner } from '../src/components/common/LoadingSpinner';
import { AuthProvider, useAuth } from '../src/contexts/AuthContext';

// Protected Route Handler
function RootLayoutNav() {
  const { currentUser, userRole, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    console.log('🔄 RootLayout: Auth state changed', {
      loading,
      currentUser: currentUser?.email,
      userRole,
      segments
    });

    if (loading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inAdminGroup = segments[0] === '(admin)';
    const inResidentGroup = segments[0] === '(resident)';
    const inSecurityGroup = segments[0] === '(security)';

    if (!currentUser && !inAuthGroup) {
      // User not logged in, redirect to login
      console.log('🔒 Not logged in, redirecting to login');
      router.replace('/(auth)/login');
    } else if (currentUser && userRole) {
      // User logged in, redirect based on role
      console.log('✅ User logged in with role:', userRole);

      if (inAuthGroup) {
        // Logged in but on auth screen, redirect to appropriate dashboard
        console.log('📍 On auth screen, redirecting to dashboard...');
        switch (userRole) {
          case 'admin':
            console.log('➡️ Redirecting to admin dashboard');
            router.replace('/(admin)/dashboard');
            break;
          case 'resident':
            console.log('➡️ Redirecting to resident home');
            router.replace('/(resident)/home');
            break;
          case 'security':
            console.log('➡️ Redirecting to security gate');
            router.replace('/(security)/gate-entry');
            break;
        }
      } else {
        // Check if user is in the correct group for their role
        if (userRole === 'admin' && !inAdminGroup) {
          console.log('⚠️ Admin not in admin group, redirecting');
          router.replace('/(admin)/dashboard');
        } else if (userRole === 'resident' && !inResidentGroup) {
          console.log('⚠️ Resident not in resident group, redirecting');
          router.replace('/(resident)/home');
        } else if (userRole === 'security' && !inSecurityGroup) {
          console.log('⚠️ Security not in security group, redirecting');
          router.replace('/(security)/gate-entry');
        }
      }
    } else if (currentUser && !userRole) {
      console.log('⚠️ User logged in but role not loaded yet');
    }
  }, [currentUser, userRole, loading, segments]);

  if (loading) {
    return <LoadingSpinner message="Loading eRoyal..." />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        animationDuration: 250,
        contentStyle: { backgroundColor: '#F5F7FA' }
      }}
    >
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(admin)" />
      <Stack.Screen name="(resident)" />
      <Stack.Screen name="(security)" />
    </Stack>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <AuthProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <RootLayoutNav />
        <StatusBar style="auto" />
      </ThemeProvider>
    </AuthProvider>
  );
}
