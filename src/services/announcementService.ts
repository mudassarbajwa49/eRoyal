// Announcements Service
// Admin creates announcements for all residents
// Using Firestore database

import { addDoc, collection, getDocs, orderBy, query, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { ApiResponse } from '../types';
import { uploadMultipleImages } from './imageService';

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
 * OPTIMIZED: Saves announcement instantly, uploads images in background.
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
        // Save announcement immediately with empty imageUrls
        const announcementData = {
            title: title.trim(),
            message: message.trim(),
            priority,
            createdBy: adminId,
            createdByName: adminName,
            imageUrls: [],
            createdAt: serverTimestamp(),
        };

        const docRef = await addDoc(collection(db, 'announcements'), announcementData);

        // Upload images in the BACKGROUND — don't block the user
        if (imageUris && imageUris.length > 0) {
            const announcementId = docRef.id;
            const urisToUpload = [...imageUris];
            (async () => {
                try {
                    const result = await uploadMultipleImages(urisToUpload, 'announcements');
                    if (result.success && result.urls && result.urls.length > 0) {
                        const { doc: firestoreDoc, updateDoc } = await import('firebase/firestore');
                        await updateDoc(firestoreDoc(db, 'announcements', announcementId), {
                            imageUrls: result.urls,
                        });
                        console.log('✅ Announcement images uploaded in background');
                    }
                } catch (e) {
                    console.warn('⚠️ Background image upload failed:', e);
                }
            })();
        }

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
