// Image Service
// Centralized image upload service with folder constants and multi-upload support

import { uploadImage, uriToBlob } from './FirebaseStorageService';

/**
 * Storage folder constants for different resource types
 */
export const STORAGE_FOLDERS = {
    BILLS: 'bills',
    VEHICLES: 'vehicles',
    MARKETPLACE: 'marketplace',
    COMPLAINTS: 'complaints',
    ANNOUNCEMENTS: 'announcements',
    PROFILES: 'profiles'
} as const;

/**
 * Upload multiple images with user-specific folder structure
 * 
 * @param imageUris Array of image URIs to upload
 * @param baseFolder Base folder name (from STORAGE_FOLDERS)
 * @param userId User ID for folder organization
 * @param resourceId Resource ID (billId, vehicleId, listingId, etc.)
 * @returns Promise with success status and uploaded URLs
 */
export const uploadMultipleImages = async (
    imageUris: string[],
    baseFolder: string,
    userId?: string,
    resourceId?: string
): Promise<{ success: boolean; urls?: string[]; error?: string }> => {
    try {
        if (!imageUris || imageUris.length === 0) {
            return {
                success: false,
                error: 'No images provided'
            };
        }

        // Convert all URIs to blobs
        const blobs = await Promise.all(
            imageUris.map(uri => uriToBlob(uri))
        );

        const timestamp = Date.now();

        // Upload all images in parallel
        const results = await Promise.all(
            blobs.map((blob, index) => {
                // Create folder path based on whether userId/resourceId provided
                let folder: string;
                if (userId && resourceId) {
                    // User-specific folder: marketplace/userId/listingId_0_timestamp
                    folder = `${baseFolder}/${userId}/${resourceId}_${index}_${timestamp}`;
                } else if (userId) {
                    // User folder only: profiles/userId/timestamp_index
                    folder = `${baseFolder}/${userId}/${timestamp}_${index}`;
                } else {
                    // Legacy flat structure: marketplace/timestamp_index
                    folder = `${baseFolder}/${timestamp}_${index}`;
                }

                return uploadImage(blob, folder);
            })
        );

        return {
            success: true,
            urls: results.map(r => r.url)
        };
    } catch (error) {
        console.error('Error uploading multiple images:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to upload images'
        };
    }
};

/**
 * Upload single image with user-specific folder structure
 * 
 * @param imageUri Image URI to upload
 * @param baseFolder Base folder name
 * @param userId Optional user ID for folder organization
 * @param resourceId Optional resource ID
 * @returns Promise with success status and uploaded URL
 */
export const uploadSingleImage = async (
    imageUri: string,
    baseFolder: string,
    userId?: string,
    resourceId?: string
): Promise<{ success: boolean; url?: string; error?: string }> => {
    const result = await uploadMultipleImages([imageUri], baseFolder, userId, resourceId);

    if (result.success && result.urls) {
        return {
            success: true,
            url: result.urls[0]
        };
    }

    return {
        success: false,
        error: result.error
    };
};
