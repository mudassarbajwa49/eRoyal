// User Service
// Manage user profiles and data from role-specific collections

import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { UserProfile } from '../types';

/**
 * Get Firestore collection name based on user role
 */
export const getCollectionNameByRole = (role: 'resident' | 'security' | 'admin'): string => {
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

/**
 * Get all users from all role-specific collections
 */
export const getAllUsers = async (): Promise<UserProfile[]> => {
    try {
        console.log('🔄 Fetching all users from role-specific collections...');

        const residents = await getUsersByRole('resident');
        const admins = await getUsersByRole('admin');
        const security = await getUsersByRole('security');

        const allUsers = [...residents, ...admins, ...security];
        console.log(`✅ Found ${allUsers.length} total users`);

        return allUsers;
    } catch (error) {
        console.error('❌ Error fetching all users:', error);
        return [];
    }
};

/**
 * Get users by role from role-specific collection
 */
export const getUsersByRole = async (role: 'resident' | 'security' | 'admin'): Promise<UserProfile[]> => {
    try {
        const collectionName = getCollectionNameByRole(role);
        console.log(`📁 Fetching users from ${collectionName}...`);

        const q = query(
            collection(db, collectionName),
            orderBy('createdAt', 'desc')
        );
        const querySnapshot = await getDocs(q);

        const users: UserProfile[] = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            users.push({ ...data, uid: doc.id } as UserProfile);
        });

        console.log(`✅ Found ${users.length} ${role}s`);
        return users;
    } catch (error) {
        console.error(`❌ Error fetching ${role}s:`, error);
        return [];
    }
};

/**
 * Get all residents (most commonly used in admin screens)
 */
export const getAllResidents = async (): Promise<UserProfile[]> => {
    return getUsersByRole('resident');
};

/**
 * Get all admins
 */
export const getAllAdmins = async (): Promise<UserProfile[]> => {
    return getUsersByRole('admin');
};

/**
 * Get all security staff
 */
export const getAllSecurityStaff = async (): Promise<UserProfile[]> => {
    return getUsersByRole('security');
};

/**
 * Search users across all collections
 */
export const searchUsers = async (searchTerm: string, role?: 'resident' | 'security' | 'admin'): Promise<UserProfile[]> => {
    try {
        const users = role ? await getUsersByRole(role) : await getAllUsers();

        const lowerSearch = searchTerm.toLowerCase();
        return users.filter(user =>
            user.name?.toLowerCase().includes(lowerSearch) ||
            user.email?.toLowerCase().includes(lowerSearch) ||
            user.houseNo?.toLowerCase().includes(lowerSearch)
        );
    } catch (error) {
        console.error('❌ Error searching users:', error);
        return [];
    }
};

