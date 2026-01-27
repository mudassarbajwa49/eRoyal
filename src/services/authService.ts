// Authentication Service
// Business logic for user authentication and account creation

import { deleteApp, initializeApp } from 'firebase/app';
import { createUserWithEmailAndPassword, initializeAuth, inMemoryPersistence } from 'firebase/auth';
import { doc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { db, firebaseConfig } from '../../firebaseConfig';
import { ApiResponse, CreateUserFormData } from '../types';

/**
 * Create a new user account (Admin only)
 * Creates both Firebase Auth account and Firestore user profile
 * Saves to role-specific collection (residents, admins, security_staff)
 * Uses a unique temporary app instance with IN-MEMORY persistence for complete isolation
 */
export const createUserAccount = async (
    userData: CreateUserFormData,
    createdByUid: string
): Promise<ApiResponse> => {
    let secondaryApp;
    try {
        console.log('🚀 Starting createUserAccount service...');
        const { email, password, name, role, houseNo, cnic } = userData;

        // Validate required fields
        if (!email || !password || !name || !role) {
            console.error('❌ Missing required fields');
            return {
                success: false,
                error: 'All required fields must be provided'
            };
        }

        // Validate resident has house number
        if (role === 'resident' && !houseNo) {
            console.error('❌ Resident missing houseNo');
            return {
                success: false,
                error: 'House number is required for residents'
            };
        }

        // Initialize a unique temporary app to ensure no persistence conflicts
        const appName = `TempApp-${Date.now()}`;
        console.log(`✅ Initializing temporary app: ${appName}`);
        secondaryApp = initializeApp(firebaseConfig, appName);

        // Initialize auth for secondary app with IN-MEMORY persistence
        const secondaryAuth = initializeAuth(secondaryApp, {
            persistence: inMemoryPersistence
        });
        console.log('✅ Secondary Auth initialized with inMemoryPersistence');

        // Create Firebase Auth account
        console.log('Creating user in Firebase Auth...');
        const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
        const user = userCredential.user;
        console.log('✅ Firebase Auth user created:', user.uid);

        // Determine collection based on role
        const collectionName = getCollectionNameByRole(role);
        console.log(`📁 Saving user to collection: ${collectionName}`);

        // Create Firestore user profile in role-specific collection
        const userProfileData = {
            uid: user.uid,
            name: name.trim(),
            email: email.toLowerCase().trim(),
            houseNo: role === 'resident' ? houseNo?.trim() : null,
            cnic: cnic?.trim() || null,
            role: role,
            createdAt: serverTimestamp(),
            createdBy: createdByUid
        };

        // Use batch write for atomicity - both writes succeed or both fail
        // This prevents data inconsistency if network fails between writes
        const batch = writeBatch(db);

        // Add write to role-specific collection
        batch.set(doc(db, collectionName, user.uid), userProfileData);

        // Add write to main 'users' collection for backward compatibility
        batch.set(doc(db, 'users', user.uid), userProfileData);

        // Commit both writes atomically
        await batch.commit();
        console.log(`✅ User profile created atomically in ${collectionName} and users collections`);

        // Retrieve token or simple success before cleanup
        const userId = user.uid;

        // Cleanup: delete the temporary app
        await signOutAndDeleteApp(secondaryAuth, secondaryApp);

        return {
            success: true,
            data: {
                uid: userId,
                email: email
            },
            message: `${role.charAt(0).toUpperCase() + role.slice(1)} account created successfully`
        };
    } catch (error: any) {
        console.error('❌ Error creating user account:', error);

        // Attempt cleanup if it exists
        if (secondaryApp) {
            try { await deleteApp(secondaryApp); } catch (e) { console.error('Cleanup error:', e); }
        }

        let errorMessage = 'Failed to create user account';

        if (error.code === 'auth/email-already-in-use') {
            errorMessage = 'This email is already registered';
        } else if (error.code === 'auth/invalid-email') {
            errorMessage = 'Invalid email address';
        } else if (error.code === 'auth/weak-password') {
            errorMessage = 'Password should be at least 6 characters';
        }

        return {
            success: false,
            error: errorMessage
        };
    }
};

/**
 * Get Firestore collection name based on user role
 */
const getCollectionNameByRole = (role: string): string => {
    switch (role) {
        case 'resident':
            return 'residents';
        case 'admin':
            return 'admins';
        case 'security':
            return 'security_staff';
        default:
            return 'users'; // fallback
    }
};

const signOutAndDeleteApp = async (authInstance: any, appInstance: any) => {
    try {
        await authInstance.signOut();
        await deleteApp(appInstance);
        console.log('🧹 Temporary app cleaned up');
    } catch (e) {
        console.error('⚠️ Cleanup warning:', e);
    }
};

/**
 * Generate a random temporary password
 */
export const generateTemporaryPassword = (): string => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
    let password = '';

    for (let i = 0; i < 8; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return password;
};

/**
 * Validate email format
 */
export const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

/**
 * Validate password strength
 */
export const validatePassword = (password: string): { valid: boolean; message?: string } => {
    if (password.length < 6) {
        return {
            valid: false,
            message: 'Password must be at least 6 characters'
        };
    }

    return { valid: true };
};
