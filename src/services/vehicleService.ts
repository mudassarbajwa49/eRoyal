// Vehicle Service
// Business logic for vehicle entry/exit logging
// Now using MySQL via Cloud Functions

import { httpsCallable } from 'firebase/functions';
import { functions } from '../../firebaseConfig';
import { ApiResponse, VehicleLog } from '../types';

/**
 * Get resident's vehicle logs from MySQL
 */
export const getResidentVehicleLogs = async (residentId: string): Promise<VehicleLog[]> => {
    try {
        const getVehiclesFn = httpsCallable(functions, 'getUserVehicles');
        const result = await getVehiclesFn();
        return result.data as VehicleLog[];
    } catch (error) {
        console.error('Error fetching resident vehicle logs:', error);
        return [];
    }
};

/**
 * Add a new vehicle (Resident or Security)
 */
export const addVehicle = async (
    vehicleNo: string,
    vehicleType?: string,
    make?: string,
    model?: string,
    year?: number,
    color?: string,
    imageUrl?: string,
    entryTime?: string,
    exitTime?: string,
    loggedBy?: string,
    loggedByName?: string,
    notes?: string
): Promise<ApiResponse> => {
    try {
        const addVehicleFn = httpsCallable(functions, 'addVehicle');
        const result = await addVehicleFn({
            vehicleNo,
            vehicleType,
            make,
            model,
            year,
            color,
            imageUrl,
            entryTime,
            exitTime,
            loggedBy,
            loggedByName,
            notes,
        });

        const data = result.data as { success: boolean; vehicleId: number };

        return {
            success: true,
            data: { vehicleId: data.vehicleId },
            message: 'Vehicle added successfully',
        };
    } catch (error) {
        console.error('Error adding vehicle:', error);
        return {
            success: false,
            error: 'Failed to add vehicle',
        };
    }
};

// Legacy function stubs for compatibility - these use the old Firestore implementation
// You may need to create new Cloud Functions if these are actively used

export const logVehicleEntry = async (
    vehicleData: any,
    loggedBy: string,
    loggedByName: string
): Promise<ApiResponse> => {
    // This function would need a new Cloud Function implementation
    console.warn('logVehicleEntry not yet implemented for MySQL');
    return {
        success: false,
        error: 'Feature not yet migrated to MySQL',
    };
};

export const logVehicleExit = async (logId: string): Promise<ApiResponse> => {
    console.warn('logVehicleExit not yet implemented for MySQL');
    return {
        success: false,
        error: 'Feature not yet migrated to MySQL',
    };
};

export const getAllVehicleLogs = async (): Promise<VehicleLog[]> => {
    console.warn('getAllVehicleLogs not yet implemented for MySQL');
    return [];
};

export const getActiveVehicles = async (): Promise<VehicleLog[]> => {
    console.warn('getActiveVehicles not yet implemented for MySQL');
    return [];
};

export const searchResidentByHouse = async (houseNo: string): Promise<any | null> => {
    console.warn('searchResidentByHouse not yet implemented for MySQL');
    return null;
};

