// Authentication Context Provider
// Manages user authentication state and user profile across the app

import { User as FirebaseUser, onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../../firebaseConfig';
import { ApiResponse, AuthContextType, User, UserRole } from '../types';

// Create Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider Component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
    const [userProfile, setUserProfile] = useState<User | null>(null);
    const [userRole, setUserRole] = useState<UserRole | null>(null);
    const [loading, setLoading] = useState(true);

    // Fetch user profile from Firestore (checks role-specific collections)
    const fetchUserProfile = async (uid: string): Promise<User | null> => {
        try {
            // Try role-specific collections first
            const collections = ['residents', 'admins', 'security_staff', 'users'];

            for (const collectionName of collections) {
                const userDoc = await getDoc(doc(db, collectionName, uid));

                if (userDoc.exists()) {
                    const userData = userDoc.data() as User;
                    console.log(`✅ User profile found in ${collectionName} collection`);
                    return userData;
                }
            }

            console.error('❌ User profile not found in any collection');
            return null;
        } catch (error) {
            console.error('Error fetching user profile:', error);
            return null;
        }
    };

    // Login Function
    const login = async (email: string, password: string): Promise<ApiResponse> => {
        try {
            console.log('🔐 AuthContext: Starting login for:', email);

            // Sign in with Firebase Auth
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            console.log('✅ Firebase Auth successful, UID:', user.uid);

            // Fetch user profile from Firestore
            console.log('📄 Fetching user profile from Firestore...');
            const profile = await fetchUserProfile(user.uid);

            if (!profile) {
                console.error('❌ User profile not found in Firestore for UID:', user.uid);
                await signOut(auth);
                return {
                    success: false,
                    error: 'User profile not found in database. Please contact administrator.'
                };
            }

            console.log('✅ User profile found:', profile);
            setUserProfile(profile);
            setUserRole(profile.role);
            console.log('✅ Login successful! Role:', profile.role);

            return {
                success: true,
                data: { user, profile },
                message: 'Login successful'
            };
        } catch (error: any) {
            console.error('❌ Login error:', error);
            console.error('Error code:', error.code);
            console.error('Error message:', error.message);

            let errorMessage = 'Login failed';

            if (error.code === 'auth/invalid-credential') {
                errorMessage = 'Invalid email or password';
            } else if (error.code === 'auth/user-not-found') {
                errorMessage = 'No account found with this email';
            } else if (error.code === 'auth/wrong-password') {
                errorMessage = 'Incorrect password';
            } else if (error.code === 'auth/too-many-requests') {
                errorMessage = 'Too many failed attempts. Please try again later.';
            } else if (error.code === 'auth/network-request-failed') {
                errorMessage = 'Network error. Check your internet connection.';
            } else if (error.code === 'auth/invalid-email') {
                errorMessage = 'Invalid email format';
            } else {
                errorMessage = `Login failed: ${error.message}`;
            }

            return {
                success: false,
                error: errorMessage
            };
        }
    };

    // Logout Function
    const logout = async (): Promise<void> => {
        try {
            await signOut(auth);
            setUserProfile(null);
            setUserRole(null);
            setCurrentUser(null);
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    // Listen to auth state changes
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setCurrentUser(user);

            if (user) {
                // User is logged in, fetch profile
                const profile = await fetchUserProfile(user.uid);
                setUserProfile(profile);
                setUserRole(profile?.role || null);
            } else {
                // User is logged out
                setUserProfile(null);
                setUserRole(null);
            }

            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const value: AuthContextType = {
        currentUser,
        userProfile,
        userRole,
        loading,
        login,
        logout
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

// Custom Hook to use Auth Context
export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);

    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }

    return context;
};
