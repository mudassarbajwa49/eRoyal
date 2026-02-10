// Vehicle Entry Log Service
// Business logic for vehicle entry/exit logging
// Uses Firestore for entry logs + registered vehicles lookup

import {
    addDoc,
    collection,
    doc,
    getDocs,
    orderBy,
    query,
    serverTimestamp,
    updateDoc,
    where
} from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { ApiResponse, VehicleLog, VehicleType } from '../types';

/**
 * Log vehicle entry at the gate
 */
export const logVehicleEntry = async (
    vehicleData: {
        vehicleNo: string;
        type: VehicleType;
        residentId?: string;
        residentName?: string;
        houseNo?: string;
        visitorName?: string;
        purpose?: string | null;
    },
    loggedBy: string,
    loggedByName: string
): Promise<ApiResponse> => {
    try {
        const entryLog: any = {
            vehicleNo: vehicleData.vehicleNo.toUpperCase(),
            type: vehicleData.type,
            entryTime: serverTimestamp(),
            exitTime: null,
            loggedBy,
            loggedByName,
            createdAt: serverTimestamp(),
        };

        // Add resident info if available
        if (vehicleData.residentId) {
            entryLog.residentId = vehicleData.residentId;
        }
        if (vehicleData.residentName) {
            entryLog.residentName = vehicleData.residentName;
        }
        if (vehicleData.houseNo) {
            entryLog.houseNo = vehicleData.houseNo;
        }

        // Add visitor info if available
        if (vehicleData.visitorName) {
            entryLog.visitorName = vehicleData.visitorName;
        }
        if (vehicleData.purpose) {
            entryLog.purpose = vehicleData.purpose;
        }

        const docRef = await addDoc(collection(db, 'vehicleLogs'), entryLog);

        return {
            success: true,
            data: { logId: docRef.id },
            message: 'Vehicle entry logged successfully',
        };
    } catch (error) {
        console.error('Error logging vehicle entry:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return {
            success: false,
            error: `Failed to log vehicle entry: ${errorMessage}`,
        };
    }
};

/**
 * Log vehicle exit (update existing entry)
 */
export const logVehicleExit = async (logId: string): Promise<ApiResponse> => {
    try {
        const logRef = doc(db, 'vehicleLogs', logId);
        await updateDoc(logRef, {
            exitTime: serverTimestamp(),
        });

        return {
            success: true,
            message: 'Vehicle exit logged successfully',
        };
    } catch (error) {
        console.error('Error logging vehicle exit:', error);
        return {
            success: false,
            error: 'Failed to log vehicle exit',
        };
    }
};

/**
 * Search resident by house number
 */
export const searchResidentByHouse = async (houseNo: string): Promise<any | null> => {
    try {
        const normalizedHouseNo = houseNo.trim().toUpperCase();

        if (!normalizedHouseNo) return null;

        const q = query(
            collection(db, 'users'),
            where('houseNo', '==', normalizedHouseNo),
            where('role', '==', 'resident')
        );

        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) return null;

        const docData = querySnapshot.docs[0];
        return {
            uid: docData.id,
            name: docData.data().name,
            houseNo: docData.data().houseNo,
            email: docData.data().email,
        };
    } catch (error) {
        console.error('Error searching resident:', error);
        return null;
    }
};

/**
 * Get resident's vehicle logs
 */
export const getResidentVehicleLogs = async (residentId: string): Promise<VehicleLog[]> => {
    try {
        const q = query(
            collection(db, 'vehicleLogs'),
            where('residentId', '==', residentId),
            orderBy('entryTime', 'desc')
        );

        const querySnapshot = await getDocs(q);
        const logs: VehicleLog[] = [];

        querySnapshot.forEach((doc) => {
            logs.push({
                id: doc.id,
                ...doc.data(),
            } as VehicleLog);
        });

        return logs;
    } catch (error) {
        console.error('Error fetching resident vehicle logs:', error);
        return [];
    }
};

/**
 * Get all vehicle logs (for security/admin)
 */
export const getAllVehicleLogs = async (): Promise<VehicleLog[]> => {
    try {
        const q = query(
            collection(db, 'vehicleLogs'),
            orderBy('entryTime', 'desc')
        );

        const querySnapshot = await getDocs(q);
        const logs: VehicleLog[] = [];

        querySnapshot.forEach((doc) => {
            logs.push({
                id: doc.id,
                ...doc.data(),
            } as VehicleLog);
        });

        return logs;
    } catch (error) {
        console.error('Error fetching all vehicle logs:', error);
        return [];
    }
};

/**
 * Get currently active vehicles (entered but not exited)
 */
export const getActiveVehicles = async (): Promise<VehicleLog[]> => {
    try {
        const q = query(
            collection(db, 'vehicleLogs'),
            where('exitTime', '==', null),
            orderBy('entryTime', 'desc')
        );

        const querySnapshot = await getDocs(q);
        const logs: VehicleLog[] = [];

        querySnapshot.forEach((doc) => {
            logs.push({
                id: doc.id,
                ...doc.data(),
            } as VehicleLog);
        });

        return logs;
    } catch (error) {
        console.error('Error fetching active vehicles:', error);
        return [];
    }
};

/**
 * Find an active vehicle by its number (for exit processing)
 * Returns the log entry if the vehicle is currently inside
 */
export const findActiveVehicle = async (vehicleNo: string): Promise<VehicleLog | null> => {
    try {
        const normalizedNo = vehicleNo.trim().toUpperCase();
        if (!normalizedNo) return null;

        const q = query(
            collection(db, 'vehicleLogs'),
            where('vehicleNo', '==', normalizedNo),
            where('exitTime', '==', null)
        );

        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) return null;

        const docData = querySnapshot.docs[0];
        return {
            id: docData.id,
            ...docData.data(),
        } as VehicleLog;
    } catch (error) {
        console.error('Error finding active vehicle:', error);
        return null;
    }
};

/**
 * Get vehicle logs grouped by house number (for admin)
 */
export const getLogsByHouse = async (): Promise<Map<string, VehicleLog[]>> => {
    try {
        const q = query(
            collection(db, 'vehicleLogs'),
            where('houseNo', '!=', null),
            orderBy('houseNo'),
            orderBy('entryTime', 'desc')
        );

        const querySnapshot = await getDocs(q);
        const grouped = new Map<string, VehicleLog[]>();

        querySnapshot.forEach((doc) => {
            const log = { id: doc.id, ...doc.data() } as VehicleLog;
            const house = log.houseNo || 'Unknown';
            if (!grouped.has(house)) {
                grouped.set(house, []);
            }
            grouped.get(house)!.push(log);
        });

        return grouped;
    } catch (error) {
        console.error('Error fetching logs by house:', error);
        return new Map();
    }
};

/**
 * Get today's statistics
 */
export const getTodayStats = async (): Promise<{ entries: number; exits: number; inside: number }> => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const allLogs = await getAllVehicleLogs();
        const activeLogs = await getActiveVehicles();

        let entries = 0;
        let exits = 0;

        allLogs.forEach((log) => {
            const entryTime = log.entryTime as any;
            const entryDate = entryTime?.toDate ? entryTime.toDate() : new Date(entryTime);
            if (entryDate >= today) {
                entries++;
            }
            if (log.exitTime) {
                const exitTime = log.exitTime as any;
                const exitDate = exitTime?.toDate ? exitTime.toDate() : new Date(exitTime);
                if (exitDate >= today) {
                    exits++;
                }
            }
        });

        return {
            entries,
            exits,
            inside: activeLogs.length
        };
    } catch (error) {
        console.error('Error getting today stats:', error);
        return { entries: 0, exits: 0, inside: 0 };
    }
};

