// Announcements Service
// Admin creates announcements for all residents
// Using Firestore database

import { addDoc, collection, getDocs, orderBy, query, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { ApiResponse } from '../types';
import { uploadMultipleImages, uriToBlob } from './storageService';

export interface Announcement {
    id: string;
    title: string;
    message: string;
    createdBy: string;
    createdByName: string;
    createdAt: any;
    priority: 'low' | 'medium' | 'high';
    imageUrls?: string[];
}

/**
 * Create announcement with optional images
 */
export const createAnnouncement = async (
    title: string,
    message: string,
    priority: 'low' | 'medium' | 'high',
    adminId: string,
    adminName: string,
    imageUris?: string[]
): Promise<ApiResponse> => {
    try {
        let imageUrls: string[] = [];

        // Upload images to Firebase Storage if provided
        if (imageUris && imageUris.length > 0) {
            const imageBlobs = await Promise.all(
                imageUris.map((uri) => uriToBlob(uri))
            );
            const uploadedImages = await uploadMultipleImages(imageBlobs, 'announcements');
            imageUrls = uploadedImages.map((img) => img.url);
        }

        // Create announcement in Firestore
        const announcementData = {
            title: title.trim(),
            message: message.trim(),
            priority,
            createdBy: adminId,
            createdByName: adminName,
            imageUrls: imageUrls.length > 0 ? imageUrls : [],
            createdAt: serverTimestamp(),
        };

        const docRef = await addDoc(collection(db, 'announcements'), announcementData);

        return {
            success: true,
            data: { announcementId: docRef.id },
            message: 'Announcement created successfully',
        };
    } catch (error) {
        console.error('Error creating announcement:', error);
        return {
            success: false,
            error: 'Failed to create announcement',
        };
    }
};

/**
 * Get all announcements
 */
export const getAnnouncements = async (): Promise<Announcement[]> => {
    try {
        const q = query(
            collection(db, 'announcements'),
            orderBy('createdAt', 'desc')
        );

        const querySnapshot = await getDocs(q);

        const announcements: Announcement[] = [];
        querySnapshot.forEach((doc) => {
            announcements.push({
                id: doc.id,
                ...doc.data(),
            } as Announcement);
        });

        return announcements;
    } catch (error) {
        console.error('Error fetching announcements:', error);
        return [];
    }
};

/**
 * Get recent announcements (limit 10)
 */
export const getRecentAnnouncements = async (): Promise<Announcement[]> => {
    try {
        const announcements = await getAnnouncements();
        return announcements.slice(0, 10);
    } catch (error) {
        console.error('Error fetching recent announcements:', error);
        return [];
    }
};
