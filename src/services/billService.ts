// Bill Service
// Business logic for billing operations
// Now using MySQL via Cloud Functions

import { httpsCallable } from 'firebase/functions';
import { functions } from '../../firebaseConfig';
import { ApiResponse, Bill } from '../types';

/**
 * Get all bills for a specific resident from MySQL
 */
export const getResidentBills = async (residentId: string, status?: 'unpaid' | 'pending' | 'paid'): Promise<Bill[]> => {
    try {
        const getBillsFn = httpsCallable(functions, 'getUserBills');
        const result = await getBillsFn({ status });
        return result.data as Bill[];
    } catch (error) {
        console.error('Error fetching resident bills:', error);
        return [];
    }
};

// Legacy function stubs for compatibility - these use the old Firestore implementation
// You may need to create new Cloud Functions if these are actively used

export const createBill = async (billData: any): Promise<ApiResponse> => {
    console.warn('createBill not yet implemented for MySQL');
    return {
        success: false,
        error: 'Feature not yet migrated to MySQL',
    };
};

export const getAllBills = async (): Promise<Bill[]> => {
    console.warn('getAllBills not yet implemented for MySQL');
    return [];
};

export const getPendingBills = async (): Promise<Bill[]> => {
    console.warn('getPendingBills not yet implemented for MySQL');
    return [];
};

export const uploadPaymentProof = async (
    billId: string,
    imageUri: string
): Promise<ApiResponse> => {
    console.warn('uploadPaymentProof not yet implemented for MySQL');
    return {
        success: false,
        error: 'Feature not yet migrated to MySQL',
    };
};

export const verifyPayment = async (
    billId: string,
    adminUid: string
): Promise<ApiResponse> => {
    console.warn('verifyPayment not yet implemented for MySQL');
    return {
        success: false,
        error: 'Feature not yet migrated to MySQL',
    };
};

export const rejectPaymentProof = async (billId: string): Promise<ApiResponse> => {
    console.warn('rejectPaymentProof not yet implemented for MySQL');
    return {
        success: false,
        error: 'Feature not yet migrated to MySQL',
    };
};

