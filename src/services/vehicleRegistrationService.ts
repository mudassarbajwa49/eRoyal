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
import { uploadVehicleImage } from './FirebaseStorageService';

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

        // Create vehicle document first to get vehicleId
        const vehicleData: any = {
            vehicleNo: normalizedVehicleNo,
            type,
            residentId,
            residentName,
            houseNo,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        };

        // Only add optional fields if they have values
        if (color) {
            vehicleData.color = color;
        }

        const docRef = await addDoc(collection(db, 'registeredVehicles'), vehicleData);

        // Upload image after creating document (if provided)
        if (imageUri) {
            try {
                const uploadResult = await uploadVehicleImage(imageUri, residentId, docRef.id);
                // Update vehicle with image URL
                await updateDoc(doc(db, 'registeredVehicles', docRef.id), {
                    imageUrl: uploadResult.url
                });
            } catch (uploadError) {
                console.error('Error uploading vehicle image:', uploadError);
                // Don't fail registration if image upload fails
            }
        }

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
            try {
                const uploadResult = await uploadVehicleImage(updates.imageUri, residentId, vehicleId);
                updateData.imageUrl = uploadResult.url;
            } catch (uploadError) {
                console.error('Error uploading vehicle image:', uploadError);
                // Continue with other updates even if image upload fails
            }
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

/**
 * Lookup vehicle by number (for security verification)
 */
export const lookupVehicleByNumber = async (vehicleNo: string): Promise<RegisteredVehicle | null> => {
    try {
        const normalizedNo = normalizeVehicleNumber(vehicleNo);

        if (!normalizedNo) return null;

        const q = query(
            collection(db, 'registeredVehicles'),
            where('vehicleNo', '==', normalizedNo)
        );

        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) return null;

        const doc = querySnapshot.docs[0];
        return {
            id: doc.id,
            ...doc.data(),
        } as RegisteredVehicle;
    } catch (error) {
        console.error('Error looking up vehicle:', error);
        return null;
    }
};
