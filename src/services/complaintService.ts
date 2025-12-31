// Complaint Service
// Business logic for complaint management using Firestore

import {
    addDoc,
    collection,
    doc,
    getDocs,
    orderBy,
    query,
    serverTimestamp,
    updateDoc,
    where
} from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { ApiResponse, Complaint, ComplaintStatus, CreateComplaintFormData } from '../types';
import { uploadImage, uriToBlob } from './storageService';

/**
 * Create a new complaint (Resident)
 */
export const createComplaint = async (
    complaintData: CreateComplaintFormData,
    residentId: string,
    residentName: string,
    houseNo: string
): Promise<ApiResponse> => {
    try {
        let imageUrl: string | null = null;

        // Upload photo if provided
        if (complaintData.photoUri) {
            const blob = await uriToBlob(complaintData.photoUri);
            const uploadResult = await uploadImage(blob, 'complaints');
            imageUrl = uploadResult.url;
        }

        // Generate complaint number using Firestore transaction
        const { runTransaction, doc: firestoreDoc } = await import('firebase/firestore');

        const complaintNumber = await runTransaction(db, async (transaction) => {
            const counterRef = firestoreDoc(db, 'counters', 'complaints');
            const counterDoc = await transaction.get(counterRef);

            let newCount = 1;
            if (counterDoc.exists()) {
                newCount = (counterDoc.data().count || 0) + 1;
                transaction.update(counterRef, { count: newCount });
            } else {
                transaction.set(counterRef, { count: newCount });
            }

            // Format as C001, C002, etc.
            return `C${String(newCount).padStart(3, '0')}`;
        });

        console.log('✅ Generated complaint number:', complaintNumber);

        // Create complaint in Firestore
        const complaintDoc = {
            complaintNumber,
            title: complaintData.title.trim(),
            description: complaintData.description.trim(),
            category: complaintData.category,
            status: 'Pending' as ComplaintStatus,
            priority: 'medium',
            residentId,
            residentName,
            houseNo,
            imageUrl: imageUrl || null,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        };

        const docRef = await addDoc(collection(db, 'complaints'), complaintDoc);

        return {
            success: true,
            data: {
                complaintId: docRef.id,
                complaintNumber
            },
            message: `Complaint ${complaintNumber} submitted successfully`,
        };
    } catch (error) {
        console.error('Error creating complaint:', error);
        return {
            success: false,
            error: 'Failed to submit complaint',
        };
    }
};

/**
 * Get all complaints for a specific resident
 */
export const getResidentComplaints = async (residentId: string): Promise<Complaint[]> => {
    try {
        const q = query(
            collection(db, 'complaints'),
            where('residentId', '==', residentId),
            orderBy('createdAt', 'desc')
        );

        const querySnapshot = await getDocs(q);
        const complaints: Complaint[] = [];

        querySnapshot.forEach((doc) => {
            complaints.push({
                id: doc.id,
                ...doc.data(),
            } as Complaint);
        });

        return complaints;
    } catch (error) {
        console.error('Error fetching resident complaints:', error);
        return [];
    }
};

/**
 * Get all complaints (Admin)
 */
export const getAllComplaints = async (): Promise<Complaint[]> => {
    try {
        const q = query(collection(db, 'complaints'), orderBy('createdAt', 'desc'));

        const querySnapshot = await getDocs(q);
        const complaints: Complaint[] = [];

        querySnapshot.forEach((doc) => {
            complaints.push({
                id: doc.id,
                ...doc.data(),
            } as Complaint);
        });

        return complaints;
    } catch (error) {
        console.error('Error fetching all complaints:', error);
        return [];
    }
};

/**
 * Get pending complaints (Admin)
 */
export const getPendingComplaints = async (): Promise<Complaint[]> => {
    try {
        const q = query(
            collection(db, 'complaints'),
            where('status', '==', 'Pending'),
            orderBy('createdAt', 'desc')
        );

        const querySnapshot = await getDocs(q);
        const complaints: Complaint[] = [];

        querySnapshot.forEach((doc) => {
            complaints.push({
                id: doc.id,
                ...doc.data(),
            } as Complaint);
        });

        return complaints;
    } catch (error) {
        console.error('Error fetching pending complaints:', error);
        return [];
    }
};

/**
 * Update complaint status (Admin)
 */
export const updateComplaintStatus = async (
    complaintId: string,
    status: ComplaintStatus,
    adminUid: string,
    adminNotes?: string
): Promise<ApiResponse> => {
    try {
        const complaintRef = doc(db, 'complaints', complaintId);

        await updateDoc(complaintRef, {
            status,
            resolutionNotes: adminNotes || null,
            resolvedBy: adminUid,
            updatedAt: serverTimestamp(),
        });

        return {
            success: true,
            message: `Complaint marked as ${status}`,
        };
    } catch (error) {
        console.error('Error updating complaint status:', error);
        return {
            success: false,
            error: 'Failed to update complaint status',
        };
    }
};
