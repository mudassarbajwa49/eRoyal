// Storage Service
// Handle image uploads to Firebase Storage

import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { storage } from '../../firebaseConfig';
import { logger } from '../utils/logger';

/**
 * Convert URI to Blob for upload
 */
export const uriToBlob = async (uri: string): Promise<Blob> => {
    const response = await fetch(uri);
    const blob = await response.blob();
    return blob;
};

/**
 * Upload single image to Firebase Storage
 */
export const uploadImage = async (
    blob: Blob,
    folder: string = 'images'
): Promise<{ url: string; fileName: string }> => {
    try {
        const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).substring(7)}`;
        const storageRef = ref(storage, fileName);

        // Upload to Firebase Storage
        await uploadBytes(storageRef, blob);

        // Get download URL
        const url = await getDownloadURL(storageRef);

        return {
            url,
            fileName,
        };
    } catch (error) {
        logger.error('Error uploading image:', error);
        throw error;
    }
};

/**
 * Upload multiple images
 */
export const uploadMultipleImages = async (
    blobs: Blob[],
    folder: string = 'images'
): Promise<{ url: string; fileName: string }[]> => {
    try {
        const uploadPromises = blobs.map((blob) => uploadImage(blob, folder));
        const results = await Promise.all(uploadPromises);
        return results;
    } catch (error) {
        logger.error('Error uploading multiple images:', error);
        throw error;
    }
};

/**
 * Upload image from URI
 */
export const uploadImageFromUri = async (
    imageUri: string,
    folder: string = 'images'
): Promise<{ url: string; fileName: string }> => {
    const blob = await uriToBlob(imageUri);
    return uploadImage(blob, folder);
};

/**
 * Upload bill payment proof with user-specific folder structure
 * Folder: bills/residentId/billId_timestamp
 */
export const uploadBillPaymentProof = async (
    imageUri: string,
    residentId: string,
    billId: string
): Promise<{ url: string; fileName: string }> => {
    const blob = await uriToBlob(imageUri);
    const timestamp = Date.now();
    const folder = `bills/${residentId}/${billId}_${timestamp}`;
    return uploadImage(blob, folder);
};

/**
 * Upload vehicle image with user-specific folder structure
 * Folder: vehicles/residentId/vehicleId_timestamp
 */
export const uploadVehicleImage = async (
    imageUri: string,
    residentId: string,
    vehicleId: string
): Promise<{ url: string; fileName: string }> => {
    const blob = await uriToBlob(imageUri);
    const timestamp = Date.now();
    const folder = `vehicles/${residentId}/${vehicleId}_${timestamp}`;
    return uploadImage(blob, folder);
};

/**
 * Upload complaint image with user-specific folder structure
 * Folder: complaints/residentId/complaintId_index_timestamp
 */
export const uploadComplaintImage = async (
    imageUri: string,
    residentId: string,
    complaintId: string,
    index: number = 0
): Promise<{ url: string; fileName: string }> => {
    const blob = await uriToBlob(imageUri);
    const timestamp = Date.now();
    const folder = `complaints/${residentId}/${complaintId}_${index}_${timestamp}`;
    return uploadImage(blob, folder);
};

