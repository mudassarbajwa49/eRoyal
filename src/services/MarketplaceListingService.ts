// Listing Service (Marketplace)
// Business logic for property marketplace with admin approval

import { addDoc, collection, deleteDoc, doc, getDocs, orderBy, query, serverTimestamp, updateDoc, where } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { ApiResponse, CreateListingFormData, Listing } from '../types';
import { STORAGE_FOLDERS, uploadMultipleImages } from './imageService';

/**
 * Create a new property listing (Resident)
 * Status starts as 'Pending' - requires admin approval
 */
export const createListing = async (
    listingData: CreateListingFormData,
    postedBy: string,
    postedByName: string,
    postedByHouse: string
): Promise<ApiResponse> => {
    try {
        // Validate images
        if (!listingData.photoUris || listingData.photoUris.length === 0) {
            return {
                success: false,
                error: 'At least one photo is required'
            };
        }

        // Create listing document first to get listingId
        const listingRef = await addDoc(collection(db, 'listings'), {
            type: listingData.type,
            price: listingData.price,
            size: listingData.size,
            location: listingData.location,
            contact: listingData.contact,
            description: listingData.description.trim(),
            photos: [], // Will update after upload
            status: 'Pending', // Awaiting admin approval
            postedBy: postedBy,
            postedByName: postedByName,
            postedByHouse: postedByHouse,
            createdAt: serverTimestamp(),
            reviewedBy: null,
            reviewedAt: null,
            rejectionReason: null
        });

        // Upload images to Firebase Storage with user-specific folder
        const uploadResult = await uploadMultipleImages(
            listingData.photoUris,
            STORAGE_FOLDERS.MARKETPLACE,
            postedBy,
            listingRef.id
        );

        if (!uploadResult.success || !uploadResult.urls) {
            // Delete the listing if image upload fails
            await deleteDoc(doc(db, 'listings', listingRef.id));
            return {
                success: false,
                error: 'Failed to upload property images'
            };
        }

        // Update listing with photo URLs
        await updateDoc(doc(db, 'listings', listingRef.id), {
            photos: uploadResult.urls
        });

        return {
            success: true,
            data: { listingId: listingRef.id },
            message: 'Listing submitted for admin approval'
        };
    } catch (error) {
        console.error('Error creating listing:', error);
        return {
            success: false,
            error: 'Failed to create listing'
        };
    }
};

/**
 * Get approved listings (visible to all residents)
 */
export const getApprovedListings = async (): Promise<Listing[]> => {
    try {
        const listingsQuery = query(
            collection(db, 'listings'),
            where('status', '==', 'Approved'),
            orderBy('createdAt', 'desc')
        );

        const snapshot = await getDocs(listingsQuery);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Listing));
    } catch (error) {
        console.error('Error fetching approved listings:', error);
        return [];
    }
};

/**
 * Get pending listings (Admin only)
 */
export const getPendingListings = async (): Promise<Listing[]> => {
    try {
        const listingsQuery = query(
            collection(db, 'listings'),
            where('status', '==', 'Pending'),
            orderBy('createdAt', 'desc')
        );

        const snapshot = await getDocs(listingsQuery);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Listing));
    } catch (error) {
        console.error('Error fetching pending listings:', error);
        return [];
    }
};

/**
 * Get resident's own listings
 */
export const getMyListings = async (residentId: string): Promise<Listing[]> => {
    try {
        const listingsQuery = query(
            collection(db, 'listings'),
            where('postedBy', '==', residentId),
            orderBy('createdAt', 'desc')
        );

        const snapshot = await getDocs(listingsQuery);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Listing));
    } catch (error) {
        console.error('Error fetching my listings:', error);
        return [];
    }
};

/**
 * Approve a listing (Admin)
 */
export const approveListing = async (
    listingId: string,
    adminUid: string
): Promise<ApiResponse> => {
    try {
        await updateDoc(doc(db, 'listings', listingId), {
            status: 'Approved',
            reviewedBy: adminUid,
            reviewedAt: serverTimestamp()
        });

        return {
            success: true,
            message: 'Listing approved successfully'
        };
    } catch (error) {
        console.error('Error approving listing:', error);
        return {
            success: false,
            error: 'Failed to approve listing'
        };
    }
};

/**
 * Reject a listing (Admin)
 */
export const rejectListing = async (
    listingId: string,
    adminUid: string,
    reason: string
): Promise<ApiResponse> => {
    try {
        await updateDoc(doc(db, 'listings', listingId), {
            status: 'Rejected',
            reviewedBy: adminUid,
            reviewedAt: serverTimestamp(),
            rejectionReason: reason
        });

        return {
            success: true,
            message: 'Listing rejected'
        };
    } catch (error) {
        console.error('Error rejecting listing:', error);
        return {
            success: false,
            error: 'Failed to reject listing'
        };
    }
};
