// Vehicle Registration Service
// User-side vehicle registration with case-insensitive handling

import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDocs,
    orderBy,
    query,
    serverTimestamp,
    updateDoc,
    where
} from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { ApiResponse, RegisteredVehicle, RegisteredVehicleType } from '../types';
import { uploadImage, uriToBlob } from './FirebaseStorageService';

/**
 * Normalize vehicle number (uppercase + trim)
 */
export const normalizeVehicleNumber = (vehicleNo: string): string => {
    return vehicleNo.trim().toUpperCase();
};

/**
 * Check if vehicle number already exists (case-insensitive)
 */
const checkDuplicateVehicle = async (
    normalizedVehicleNo: string,
    excludeVehicleId?: string
): Promise<boolean> => {
    try {
        const q = query(
            collection(db, 'registeredVehicles'),
            where('vehicleNo', '==', normalizedVehicleNo)
        );

        const querySnapshot = await getDocs(q);

        // If excluding a vehicle (for updates), check if any other vehicle has this number
        if (excludeVehicleId) {
            return querySnapshot.docs.some(doc => doc.id !== excludeVehicleId);
        }

        return !querySnapshot.empty;
    } catch (error) {
        console.error('Error checking duplicate vehicle:', error);
        return false;
    }
};

/**
 * Register a new vehicle (resident only)
 */
export const registerVehicle = async (
    vehicleNo: string,
    type: RegisteredVehicleType,
    residentId: string,
    residentName: string,
    houseNo: string,
    color?: string,
    imageUri?: string
): Promise<ApiResponse> => {
    try {
        // Normalize vehicle number
        const normalizedVehicleNo = normalizeVehicleNumber(vehicleNo);

        if (!normalizedVehicleNo) {
            return {
                success: false,
                error: 'Vehicle number is required',
            };
        }

        // Check for duplicates
        const isDuplicate = await checkDuplicateVehicle(normalizedVehicleNo);
        if (isDuplicate) {
            return {
                success: false,
                error: `Vehicle ${normalizedVehicleNo} is already registered`,
            };
        }

        let imageUrl: string | undefined;

        // Upload image if provided
        if (imageUri) {
            const blob = await uriToBlob(imageUri);
            const uploadResult = await uploadImage(blob, 'vehicles');
            imageUrl = uploadResult.url;
        }

        // Create vehicle document
        const vehicleData: Omit<RegisteredVehicle, 'id'> = {
            vehicleNo: normalizedVehicleNo,
            type,
            color,
            imageUrl,
            residentId,
            residentName,
            houseNo,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        };

        const docRef = await addDoc(collection(db, 'registeredVehicles'), vehicleData);

        return {
            success: true,
            data: { vehicleId: docRef.id },
            message: `Vehicle ${normalizedVehicleNo} registered successfully`,
        };
    } catch (error) {
        console.error('Error registering vehicle:', error);
        return {
            success: false,
            error: 'Failed to register vehicle',
        };
    }
};

/**
 * Get resident's registered vehicles
 */
export const getResidentVehicles = async (residentId: string): Promise<RegisteredVehicle[]> => {
    try {
        const q = query(
            collection(db, 'registeredVehicles'),
            where('residentId', '==', residentId),
            orderBy('createdAt', 'desc')
        );

        const querySnapshot = await getDocs(q);
        const vehicles: RegisteredVehicle[] = [];

        querySnapshot.forEach((doc) => {
            vehicles.push({
                id: doc.id,
                ...doc.data(),
            } as RegisteredVehicle);
        });

        return vehicles;
    } catch (error) {
        console.error('Error fetching resident vehicles:', error);
        return [];
    }
};

/**
 * Update vehicle (only by owner)
 */
export const updateVehicle = async (
    vehicleId: string,
    residentId: string,
    updates: {
        vehicleNo?: string;
        type?: RegisteredVehicleType;
        color?: string;
        imageUri?: string;
    }
): Promise<ApiResponse> => {
    try {
        const vehicleRef = doc(db, 'registeredVehicles', vehicleId);

        // Build update object
        const updateData: any = {
            updatedAt: serverTimestamp(),
        };

        // If updating vehicle number, normalize and check duplicates
        if (updates.vehicleNo) {
            const normalizedVehicleNo = normalizeVehicleNumber(updates.vehicleNo);

            if (!normalizedVehicleNo) {
                return {
                    success: false,
                    error: 'Vehicle number is required',
                };
            }

            // Check for duplicates (excluding current vehicle)
            const isDuplicate = await checkDuplicateVehicle(normalizedVehicleNo, vehicleId);
            if (isDuplicate) {
                return {
                    success: false,
                    error: `Vehicle ${normalizedVehicleNo} is already registered`,
                };
            }

            updateData.vehicleNo = normalizedVehicleNo;
        }

        if (updates.type) {
            updateData.type = updates.type;
        }

        if (updates.color !== undefined) {
            updateData.color = updates.color;
        }

        // Upload new image if provided
        if (updates.imageUri) {
            const blob = await uriToBlob(updates.imageUri);
            const uploadResult = await uploadImage(blob, 'vehicles');
            updateData.imageUrl = uploadResult.url;
        }

        await updateDoc(vehicleRef, updateData);

        return {
            success: true,
            message: 'Vehicle updated successfully',
        };
    } catch (error) {
        console.error('Error updating vehicle:', error);
        return {
            success: false,
            error: 'Failed to update vehicle',
        };
    }
};

/**
 * Delete vehicle (only by owner)
 */
export const deleteVehicle = async (
    vehicleId: string,
    residentId: string
): Promise<ApiResponse> => {
    try {
        const vehicleRef = doc(db, 'registeredVehicles', vehicleId);
        await deleteDoc(vehicleRef);

        return {
            success: true,
            message: 'Vehicle deleted successfully',
        };
    } catch (error) {
        console.error('Error deleting vehicle:', error);
        return {
            success: false,
            error: 'Failed to delete vehicle',
        };
    }
};

/**
 * Get all registered vehicles (admin)
 */
export const getAllRegisteredVehicles = async (): Promise<RegisteredVehicle[]> => {
    try {
        const q = query(
            collection(db, 'registeredVehicles'),
            orderBy('createdAt', 'desc')
        );

        const querySnapshot = await getDocs(q);
        const vehicles: RegisteredVehicle[] = [];

        querySnapshot.forEach((doc) => {
            vehicles.push({
                id: doc.id,
                ...doc.data(),
            } as RegisteredVehicle);
        });

        return vehicles;
    } catch (error) {
        console.error('Error fetching all vehicles:', error);
        return [];
    }
};
