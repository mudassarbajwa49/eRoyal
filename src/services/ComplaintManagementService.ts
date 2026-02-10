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
import { uploadImage, uriToBlob } from './FirebaseStorageService';

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

/**
 * Resolve complaint with optional charge (Admin)
 * 
 * BILLING LOGIC:
 * - If current month bill exists AND is Unpaid/Draft: Add charge immediately
 * - If no bill exists OR bill is already Paid: Mark as "unbilled" for next generation
 */
export const resolveComplaintWithCharge = async (
    complaintId: string,
    resolutionNotes: string,
    chargeAmount: number | null,
    adminUid: string,
    residentId: string,
    residentName: string
): Promise<ApiResponse> => {
    try {
        const { addComplaintChargeToBill, getResidentCurrentBill } = await import('./MonthlyBillingService');
        const { getDoc } = await import('firebase/firestore');

        // Get complaint details
        const complaintDoc = await getDoc(doc(db, 'complaints', complaintId));
        if (!complaintDoc.exists()) {
            return {
                success: false,
                error: 'Complaint not found',
            };
        }

        const complaint = complaintDoc.data() as Complaint;

        // Check if already resolved with charge
        if (complaint.addedToBill) {
            return {
                success: false,
                error: 'Charge already added to bill for this complaint',
            };
        }

        const complaintRef = doc(db, 'complaints', complaintId);
        let billId: string | null = null;

        // If charge amount is provided, add to bill
        if (chargeAmount && chargeAmount > 0) {
            // Get current month in YYYY-MM format
            const now = new Date();
            const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

            // Find current month's bill
            const currentBill = await getResidentCurrentBill(residentId, currentMonth);

            // Check if bill exists AND is still Draft (NOT YET SENT to resident)
            // Once a bill is sent (status = Unpaid/Pending/Paid), we don't modify it
            if (currentBill && currentBill.id && currentBill.status === 'Draft') {
                // ====================================
                // IMMEDIATE: Add charge to Draft bill (not yet sent)
                // ====================================
                billId = currentBill.id;

                // Add complaint charge to bill
                const billResult = await addComplaintChargeToBill(billId, {
                    complaintId,
                    complaintNumber: complaint.complaintNumber,
                    description: complaint.title,
                    amount: chargeAmount,
                });

                if (!billResult.success) {
                    return {
                        success: false,
                        error: 'Failed to add charge to bill',
                    };
                }

                // Update complaint with charge info - BILLED IMMEDIATELY
                await updateDoc(complaintRef, {
                    status: 'Resolved' as ComplaintStatus,
                    resolutionNotes: resolutionNotes || null,
                    resolvedBy: adminUid,
                    chargeAmount,
                    addedToBill: true,  // Marked as billed
                    billId,
                    updatedAt: serverTimestamp(),
                    resolvedAt: serverTimestamp(),
                });

                return {
                    success: true,
                    message: `Complaint resolved. Rs. ${chargeAmount.toLocaleString()} added to current bill.`,
                };
            } else {
                // ====================================
                // DEFERRED: No open bill, save for next generation
                // ====================================

                // Update complaint - MARK AS UNBILLED for next bill generation
                await updateDoc(complaintRef, {
                    status: 'Resolved' as ComplaintStatus,
                    resolutionNotes: resolutionNotes || null,
                    resolvedBy: adminUid,
                    chargeAmount,
                    addedToBill: false,  // Will be picked up on next bill generation
                    billId: null,
                    updatedAt: serverTimestamp(),
                    resolvedAt: serverTimestamp(),
                });

                return {
                    success: true,
                    message: `Complaint resolved. Rs. ${chargeAmount.toLocaleString()} will be added to next month's bill.`,
                };
            }
        } else {
            // Resolve without charge
            await updateDoc(complaintRef, {
                status: 'Resolved' as ComplaintStatus,
                resolutionNotes: resolutionNotes || null,
                resolvedBy: adminUid,
                chargeAmount: 0,
                addedToBill: true,  // No charge, nothing to bill
                updatedAt: serverTimestamp(),
                resolvedAt: serverTimestamp(),
            });

            return {
                success: true,
                message: 'Complaint resolved successfully.',
            };
        }
    } catch (error) {
        console.error('Error resolving complaint with charge:', error);
        return {
            success: false,
            error: 'Failed to resolve complaint',
        };
    }
};
/**
 * Add charge to complaint and link to bill (Admin)
 */
export const addChargeToComplaint = async (
    complaintId: string,
    amount: number,
    adminId: string,
    billId: string
): Promise<ApiResponse> => {
    try {
        const complaintRef = doc(db, 'complaints', complaintId);

        await updateDoc(complaintRef, {
            chargeAmount: amount,
            addedToBill: true,
            billId,
            updatedAt: serverTimestamp(),
        });

        return {
            success: true,
            message: `Charge of Rs. ${amount} added to complaint`,
        };
    } catch (error) {
        console.error('Error adding charge to complaint:', error);
        return {
            success: false,
            error: 'Failed to add charge to complaint',
        };
    }
};

/**
 * Remove charge from complaint (Admin)
 */
export const removeChargeFromComplaint = async (
    complaintId: string,
    adminId: string
): Promise<ApiResponse> => {
    try {
        const complaintRef = doc(db, 'complaints', complaintId);

        await updateDoc(complaintRef, {
            chargeAmount: null,
            addedToBill: false,
            billId: null,
            updatedAt: serverTimestamp(),
        });

        return {
            success: true,
            message: 'Charge removed from complaint',
        };
    } catch (error) {
        console.error('Error removing charge from complaint:', error);
        return {
            success: false,
            error: 'Failed to remove charge from complaint',
        };
    }
};
