import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import * as NativeSplashScreen from 'expo-splash-screen';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { SplashScreen } from '../src/components/common/SplashScreen';
import { AppDataProvider } from '../src/contexts/AppDataContext';
import { AuthProvider, useAuth } from '../src/contexts/AuthContext';
import { logger } from '../src/utils/logger';

// Prevent the splash screen from auto-hiding before auth is loaded.
NativeSplashScreen.preventAutoHideAsync();

// Protected Route Handler
function RootLayoutNav() {
  const { currentUser, userRole, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const [minTimePassed, setMinTimePassed] = useState(false);

  // Force splash screen to show for at least 2 seconds
  useEffect(() => {
    // Hide the native splash screen immediately to reveal our custom JS splash screen
    NativeSplashScreen.hideAsync();
    
    const timer = setTimeout(() => {
      setMinTimePassed(true);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    logger.log('RootLayout: Auth state changed', {
      loading,
      currentUser: currentUser?.email,
      userRole,
      segments
    });

    if (loading || !minTimePassed) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inAdminGroup = segments[0] === '(admin)';
    const inResidentGroup = segments[0] === '(resident)';
    const inSecurityGroup = segments[0] === '(security)';

    if (!currentUser && !inAuthGroup) {
      // User not logged in, redirect to login
      logger.log('Not logged in, redirecting to login');
      router.replace('/(auth)/login');
    } else if (currentUser && userRole) {
      // User logged in, redirect based on role
      logger.log('User logged in with role:', userRole);

      if (inAuthGroup) {
        // Logged in but on auth screen, redirect to appropriate dashboard
        logger.log('On auth screen, redirecting to dashboard...');
        switch (userRole) {
          case 'admin':
            logger.log('Redirecting to admin dashboard');
            router.replace('/(admin)/dashboard');
            break;
          case 'resident':
            logger.log('Redirecting to resident home');
            router.replace('/(resident)/home');
            break;
          case 'security':
            logger.log('Redirecting to security gate');
            router.replace('/(security)/gate-entry');
            break;
        }
      } else {
        // Check if user is in the correct group for their role
        if (userRole === 'admin' && !inAdminGroup) {
          logger.warn('Admin not in admin group, redirecting');
          router.replace('/(admin)/dashboard');
        } else if (userRole === 'resident' && !inResidentGroup) {
          logger.warn('Resident not in resident group, redirecting');
          router.replace('/(resident)/home');
        } else if (userRole === 'security' && !inSecurityGroup) {
          logger.warn('Security not in security group, redirecting');
          router.replace('/(security)/gate-entry');
        }
      }
    } else if (currentUser && !userRole) {
      logger.warn('User logged in but role not loaded yet');
    }
  }, [currentUser, userRole, loading, minTimePassed, segments, router]);

  if (loading || !minTimePassed) {
    return <SplashScreen />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        animationDuration: 280,
        gestureEnabled: true,
        fullScreenGestureEnabled: true,
        contentStyle: { backgroundColor: '#F5F7FA' }
      }}
    >
      <Stack.Screen name="(auth)" options={{ gestureEnabled: false }} />
      <Stack.Screen name="(admin)" />
      <Stack.Screen name="(resident)" />
      <Stack.Screen name="(security)" options={{ gestureEnabled: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <AuthProvider>
      <AppDataProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <RootLayoutNav />
          <StatusBar style="auto" />
        </ThemeProvider>
      </AppDataProvider>
    </AuthProvider>
  );
}
