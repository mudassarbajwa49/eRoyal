// Listing Service (Marketplace)
// Business logic for property marketplace with admin approval

import { addDoc, collection, deleteDoc, doc, getDocs, orderBy, query, serverTimestamp, updateDoc, where } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { ApiResponse, CreateListingFormData, Listing } from '../types';
import { STORAGE_FOLDERS, uploadMultipleImages } from './imageService';

/**
 * Create a new property listing
 * For residents: Status starts as 'Pending' - requires admin approval
 * For admins: Status is 'Approved' - immediately visible
 */
export const createListing = async (
    listingData: CreateListingFormData,
    postedBy: string,
    postedByName: string,
    postedByHouse: string,
    isAdmin: boolean = false
): Promise<ApiResponse> => {
    try {
        // Validate images
        if (!listingData.photoUris || listingData.photoUris.length === 0) {
            return {
                success: false,
                error: 'At least one photo is required'
            };
        }

        // Admin listings are auto-approved, resident listings are pending
        const status = isAdmin ? 'Approved' : 'Pending';
        const reviewerInfo = isAdmin ? {
            reviewedBy: postedBy,
            reviewedAt: serverTimestamp()
        } : {
            reviewedBy: null,
            reviewedAt: null
        };

        // Create listing document first to get listingId
        const listingRef = await addDoc(collection(db, 'listings'), {
            type: listingData.type,
            price: listingData.price,
            size: listingData.size,
            location: listingData.location,
            contact: listingData.contact,
            description: listingData.description.trim(),
            photos: [], // Will update after upload
            status: status,
            postedBy: postedBy,
            postedByName: postedByName,
            postedByHouse: postedByHouse,
            createdAt: serverTimestamp(),
            ...reviewerInfo,
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

        const message = isAdmin
            ? 'Listing published successfully'
            : 'Listing submitted for admin approval';

        return {
            success: true,
            data: { listingId: listingRef.id },
            message: message
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
 * Get rejected listings (Admin only)
 */
export const getRejectedListings = async (): Promise<Listing[]> => {
    try {
        const listingsQuery = query(
            collection(db, 'listings'),
            where('status', '==', 'Rejected'),
            orderBy('createdAt', 'desc')
        );

        const snapshot = await getDocs(listingsQuery);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Listing));
    } catch (error) {
        console.error('Error fetching rejected listings:', error);
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

/**
 * Mark a listing as Sold (Resident — their own listing)
 */
export const markAsSold = async (listingId: string): Promise<ApiResponse> => {
    try {
        await updateDoc(doc(db, 'listings', listingId), {
            status: 'Sold',
            soldAt: serverTimestamp()
        });
        return { success: true, message: 'Listing marked as sold' };
    } catch (error) {
        console.error('Error marking as sold:', error);
        return { success: false, error: 'Failed to mark as sold' };
    }
};

/**
 * Deactivate / pause a listing (Resident — hides from browse without deleting)
 */
export const deactivateListing = async (listingId: string): Promise<ApiResponse> => {
    try {
        await updateDoc(doc(db, 'listings', listingId), {
            status: 'Inactive',
            deactivatedAt: serverTimestamp()
        });
        return { success: true, message: 'Listing paused' };
    } catch (error) {
        console.error('Error deactivating listing:', error);
        return { success: false, error: 'Failed to pause listing' };
    }
};

/**
 * Reactivate a paused listing — resubmits to Pending for admin re-approval
 */
export const reactivateListing = async (listingId: string): Promise<ApiResponse> => {
    try {
        await updateDoc(doc(db, 'listings', listingId), {
            status: 'Pending',
            deactivatedAt: null,
            reviewedBy: null,
            reviewedAt: null
        });
        return { success: true, message: 'Listing resubmitted for approval' };
    } catch (error) {
        console.error('Error reactivating listing:', error);
        return { success: false, error: 'Failed to reactivate listing' };
    }
};

/**
 * Delete a listing permanently (Resident — only their own)
 */
export const deleteListing = async (listingId: string): Promise<ApiResponse> => {
    try {
        await deleteDoc(doc(db, 'listings', listingId));
        return { success: true, message: 'Listing deleted' };
    } catch (error) {
        console.error('Error deleting listing:', error);
        return { success: false, error: 'Failed to delete listing' };
    }
};
