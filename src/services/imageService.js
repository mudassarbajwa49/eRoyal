// Firebase Storage Service for Image Management
// This service handles all image uploads for the eRoyal system

import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { storage } from '../../firebaseConfig';

/**
 * Upload an image to Firebase Storage
 * 
 * @param {string} imageUri - Local file URI or blob
 * @param {string} folder - Storage folder path (e.g., 'payment-proofs', 'complaints', 'listings')
 * @param {string} fileName - Optional custom file name (auto-generated if not provided)
 * @returns {Promise<{success: boolean, url?: string, error?: any}>}
 */
export const uploadImage = async (imageUri, folder, fileName = null) => {
    try {
        // Generate unique file name if not provided
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(7);
        const finalFileName = fileName || `${timestamp}_${randomString}.jpg`;

        // Create storage reference
        const storageRef = ref(storage, `${folder}/${finalFileName}`);

        // Convert image URI to blob (for web and mobile compatibility)
        const response = await fetch(imageUri);
        const blob = await response.blob();

        // Upload to Firebase Storage
        const snapshot = await uploadBytes(storageRef, blob);

        // Get download URL
        const downloadURL = await getDownloadURL(snapshot.ref);

        console.log('Image uploaded successfully:', downloadURL);

        return {
            success: true,
            url: downloadURL,
            path: snapshot.ref.fullPath
        };
    } catch (error) {
        console.error('Error uploading image:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

/**
 * Upload multiple images to Firebase Storage
 * 
 * @param {Array<string>} imageUris - Array of local file URIs
 * @param {string} folder - Storage folder path
 * @returns {Promise<{success: boolean, urls?: Array<string>, error?: any}>}
 */
export const uploadMultipleImages = async (imageUris, folder) => {
    try {
        const uploadPromises = imageUris.map((uri, index) =>
            uploadImage(uri, folder, `image_${index}_${Date.now()}.jpg`)
        );

        const results = await Promise.all(uploadPromises);

        // Check if all uploads succeeded
        const allSuccessful = results.every(result => result.success);

        if (allSuccessful) {
            const urls = results.map(result => result.url);
            return {
                success: true,
                urls: urls
            };
        } else {
            throw new Error('Some images failed to upload');
        }
    } catch (error) {
        console.error('Error uploading multiple images:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

/**
 * Delete an image from Firebase Storage
 * 
 * @param {string} imageUrl - Full Firebase Storage download URL
 * @returns {Promise<{success: boolean, error?: any}>}
 */
export const deleteImage = async (imageUrl) => {
    try {
        // Extract path from URL
        const path = extractPathFromUrl(imageUrl);

        if (!path) {
            throw new Error('Invalid Firebase Storage URL');
        }

        const storageRef = ref(storage, path);
        await deleteObject(storageRef);

        console.log('Image deleted successfully:', path);

        return { success: true };
    } catch (error) {
        console.error('Error deleting image:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

/**
 * Extract storage path from Firebase Storage URL
 * 
 * @param {string} url - Firebase Storage download URL
 * @returns {string|null} - Storage path or null
 */
const extractPathFromUrl = (url) => {
    try {
        // Firebase Storage URL format:
        // https://firebasestorage.googleapis.com/v0/b/[bucket]/o/[path]?alt=media&token=[token]
        const regex = /\/o\/(.+?)\?/;
        const match = url.match(regex);

        if (match && match[1]) {
            // Decode URL-encoded path
            return decodeURIComponent(match[1]);
        }

        return null;
    } catch (error) {
        console.error('Error extracting path from URL:', error);
        return null;
    }
};

/**
 * Storage folder constants
 * Centralized folder structure for better organization
 */
export const STORAGE_FOLDERS = {
    PAYMENT_PROOFS: 'payment-proofs',
    COMPLAINTS: 'complaints',
    MARKETPLACE: 'marketplace',
    PROFILES: 'user-profiles',
    DOCUMENTS: 'documents'
};

/**
 * Example usage:
 * 
 * // Upload single image (payment proof)
 * const result = await uploadImage(imageUri, STORAGE_FOLDERS.PAYMENT_PROOFS);
 * if (result.success) {
 *   console.log('Image URL:', result.url);
 *   // Save result.url to Firestore
 * }
 * 
 * // Upload multiple images (marketplace listing)
 * const multiResult = await uploadMultipleImages(
 *   [uri1, uri2, uri3], 
 *   STORAGE_FOLDERS.MARKETPLACE
 * );
 * if (multiResult.success) {
 *   console.log('Image URLs:', multiResult.urls);
 *   // Save multiResult.urls array to Firestore
 * }
 * 
 * // Delete image
 * await deleteImage(existingImageUrl);
 */
