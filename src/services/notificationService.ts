// Notification Service
// Handles creating and removing in-app notifications

import { addDoc, collection, deleteDoc, getDocs, query, serverTimestamp, where } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { NotificationType } from '../types';

/**
 * Creates a new notification for a specific user
 */
export const createNotification = async (
    userId: string,
    title: string,
    message: string,
    type: NotificationType,
    relatedId: string | null = null
) => {
    try {
        await addDoc(collection(db, 'notifications'), {
            userId,
            title,
            message,
            type,
            isRead: false,
            relatedId,
            createdAt: serverTimestamp(),
        });
        return { success: true };
    } catch (error) {
        console.error('Error creating notification:', error);
        return { success: false, error };
    }
};

/**
 * Deletes all notifications related to a specific entity ID
 * Useful for cleaning up "Pending" notifications when an action is completed
 */
export const deleteNotificationsByRelatedId = async (relatedId: string) => {
    try {
        const q = query(
            collection(db, 'notifications'),
            where('relatedId', '==', relatedId)
        );
        const snapshot = await getDocs(q);
        
        const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
        await Promise.all(deletePromises);
        
        return { success: true };
    } catch (error) {
        console.error('Error deleting notifications:', error);
        return { success: false, error };
    }
};
