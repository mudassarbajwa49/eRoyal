// Enhanced Bill Service
// Automatic monthly billing with complaint charge integration
// Using Firestore for full frontend implementation

import {
    addDoc,
    collection,
    doc,
    getDocs,
    orderBy,
    query,
    serverTimestamp,
    Timestamp,
    updateDoc,
    where,
    writeBatch
} from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { ApiResponse, Bill, BillBreakdown, BillComplaintCharge, BillStatus } from '../types';
import { logger } from '../utils/logger';
import { dataCache } from './DataCache';

/**
 * Calculate bill total from breakdown
 */
const calculateBillTotal = (breakdown: BillBreakdown): number => {
    const complaintTotal = breakdown.complaintCharges.reduce((sum, charge) => sum + charge.amount, 0);
    return breakdown.baseCharges + complaintTotal + breakdown.previousDues;
};

// Late fee percentage (10%)
const LATE_FEE_PERCENTAGE = 0.10;

/**
 * Generate monthly bills for all residents (Admin)
 * 
 * ARCHITECTURE:
 * 1. Uses writeBatch for atomic operations (prevents half-finished runs)
 * 2. Automatically picks up unbilled complaint charges
 * 3. Adds late fees for overdue bills
 * 4. Creates bills as 'Unpaid' so residents see them immediately
 * 
 * @param month Format: "YYYY-MM" (e.g., "2026-01")
 * @param baseCharges Default monthly charges
 * @param adminId Admin creating the bills
 */
export const generateMonthlyBills = async (
    month: string,
    baseCharges: number,
    adminId: string
): Promise<ApiResponse> => {
    try {
        const batch = writeBatch(db);
        let billsCreated = 0;
        let skippedCount = 0;
        let complaintsProcessed = 0;

        // Get all residents (users with role 'resident')
        const usersQuery = query(
            collection(db, 'users'),
            where('role', '==', 'resident')
        );
        const usersSnapshot = await getDocs(usersQuery);

        logger.log(`Generating bills for ${usersSnapshot.size} residents for ${month}`);

        for (const userDoc of usersSnapshot.docs) {
            const userData = userDoc.data();
            const residentId = userDoc.id;

            // CHECK IF BILL ALREADY EXISTS FOR THIS MONTH
            const existingBillQuery = query(
                collection(db, 'bills'),
                where('residentId', '==', residentId),
                where('month', '==', month)
            );
            const existingBillSnapshot = await getDocs(existingBillQuery);

            // Skip if bill already exists for this resident for this month
            if (!existingBillSnapshot.empty) {
                logger.log(`Skipping ${userData.name} - bill already exists for ${month}`);
                skippedCount++;
                continue;
            }

            // Initialize bill breakdown
            let billAmount = baseCharges;
            const complaintCharges: BillComplaintCharge[] = [];
            let previousDues = 0;
            let lateFee = 0;

            // ====================================
            // 1. CHECK FOR UNPAID PREVIOUS BILLS
            // ====================================
            const previousBillsQuery = query(
                collection(db, 'bills'),
                where('residentId', '==', residentId),
                where('month', '<', month)
            );
            const previousBillsSnapshot = await getDocs(previousBillsQuery);

            previousBillsSnapshot.forEach((billDoc) => {
                const billData = billDoc.data();
                // Only count unpaid or pending bills
                if (billData.status === 'Unpaid' || billData.status === 'Pending') {
                    previousDues += billData.amount || 0;
                    // Add 10% late fee for unpaid bills
                    lateFee += (billData.amount || 0) * LATE_FEE_PERCENTAGE;
                }
            });

            // ====================================
            // 2. FIND UNBILLED COMPLAINTS
            // ====================================
            const unbilledComplaintsQuery = query(
                collection(db, 'complaints'),
                where('residentId', '==', residentId),
                where('addedToBill', '==', false),
                where('chargeAmount', '>', 0)
            );
            const unbilledComplaintsSnapshot = await getDocs(unbilledComplaintsQuery);

            // Generate new bill ID first (so we can reference it)
            const newBillRef = doc(collection(db, 'bills'));
            const newBillId = newBillRef.id;

            // Process each unbilled complaint
            unbilledComplaintsSnapshot.forEach((complaintDoc) => {
                const complaintData = complaintDoc.data();

                // Add to complaint charges breakdown
                complaintCharges.push({
                    complaintId: complaintDoc.id,
                    complaintNumber: complaintData.complaintNumber || `C-${complaintDoc.id.slice(-6)}`,
                    description: complaintData.title || 'Complaint charge',
                    amount: complaintData.chargeAmount,
                });

                billAmount += complaintData.chargeAmount;
                complaintsProcessed++;

                // Mark complaint as billed in the same batch (atomic)
                const complaintRef = doc(db, 'complaints', complaintDoc.id);
                batch.update(complaintRef, {
                    addedToBill: true,
                    billId: newBillId,
                });
            });

            // ====================================
            // 3. CREATE BILL BREAKDOWN
            // ====================================
            const breakdown: BillBreakdown = {
                baseCharges,
                complaintCharges,
                previousDues: previousDues + lateFee, // Include late fee in previous dues
                total: billAmount + previousDues + lateFee,
            };

            // Parse due date correctly
            const [year, monthNum] = month.split('-');
            const dueDate = new Date(parseInt(year), parseInt(monthNum) - 1, 25); // 25th of the month

            // ====================================
            // 4. CREATE BILL DOCUMENT
            // ====================================
            const billData: Omit<Bill, 'id'> = {
                residentId,
                residentName: userData.name,
                houseNo: userData.houseNo || '',
                month,
                breakdown,
                amount: breakdown.total,
                dueDate: Timestamp.fromDate(dueDate),
                status: 'Unpaid' as BillStatus, // FIX: Create as 'Unpaid' so residents see immediately
                sentBy: adminId,
                sentAt: serverTimestamp(),
                isArchived: false,
                proofUrl: null,
                proofUploadedAt: null,
                verifiedBy: null,
                verifiedAt: null,
                createdAt: serverTimestamp(),
            };

            // Add bill to batch
            batch.set(newBillRef, billData);
            billsCreated++;
        }

        // ====================================
        // 5. COMMIT ALL CHANGES ATOMICALLY
        // ====================================
        await batch.commit();
        logger.success(`Batch committed: ${billsCreated} bills, ${complaintsProcessed} complaints processed`);

        // Invalidate caches after creating bills
        dataCache.invalidateAllBills();
        logger.cache('Invalidated bills cache after generation');

        const message = skippedCount > 0
            ? `${billsCreated} bills created (${complaintsProcessed} complaint charges), ${skippedCount} skipped for ${month}`
            : `${billsCreated} bills generated with ${complaintsProcessed} complaint charges for ${month}`;

        return {
            success: true,
            data: {
                billsCreated,
                billsSkipped: skippedCount,
                complaintsProcessed,
            },
            message,
        };
    } catch (error) {
        logger.error('Error generating monthly bills:', error);
        return {
            success: false,
            error: `Failed to generate monthly bills: ${error instanceof Error ? error.message : 'Unknown error'}`,
        };
    }
};

/**
 * Generate bill for a single resident
 * @param residentId User ID of the resident
 * @param residentName Name of the resident
 * @param houseNo House number
 * @param month Format: "YYYY-MM"
 * @param baseCharges Base monthly charges
 * @param adminId Admin creating the bill
 */
export const generateSingleBill = async (
    residentId: string,
    residentName: string,
    houseNo: string,
    month: string,
    baseCharges: number,
    adminId: string
): Promise<ApiResponse> => {
    try {
        // CHECK IF BILL ALREADY EXISTS
        const existingBillQuery = query(
            collection(db, 'bills'),
            where('residentId', '==', residentId),
            where('month', '==', month)
        );
        const existingBillSnapshot = await getDocs(existingBillQuery);

        if (!existingBillSnapshot.empty) {
            return {
                success: false,
                error: `Bill already exists for ${residentName} for ${month}`,
            };
        }

        // Check for unpaid bills from previous months
        const previousBillsQuery = query(
            collection(db, 'bills'),
            where('residentId', '==', residentId),
            where('month', '<', month)
        );
        const previousBillsSnapshot = await getDocs(previousBillsQuery);

        let previousDues = 0;
        previousBillsSnapshot.forEach((billDoc) => {
            const billData = billDoc.data();
            if (billData.status === 'Unpaid' || billData.status === 'Pending') {
                previousDues += billData.amount || 0;
            }
        });

        // Create bill breakdown
        const breakdown: BillBreakdown = {
            baseCharges,
            complaintCharges: [],
            previousDues,
            total: baseCharges + previousDues,
        };

        // Parse due date
        const [year, monthNum] = month.split('-');
        const dueDate = new Date(parseInt(year), parseInt(monthNum) - 1, 25);

        // Create bill
        const billData: Omit<Bill, 'id'> = {
            residentId,
            residentName,
            houseNo,
            month,
            breakdown,
            amount: breakdown.total,
            dueDate: Timestamp.fromDate(dueDate),
            status: 'Draft' as BillStatus,
            sentBy: null,
            sentAt: null,
            isArchived: false,
            proofUrl: null,
            proofUploadedAt: null,
            verifiedBy: null,
            verifiedAt: null,
            createdAt: serverTimestamp(),
        };

        await addDoc(collection(db, 'bills'), billData);

        return {
            success: true,
            message: `Bill generated for ${residentName} (${houseNo}) for ${month}`,
        };
    } catch (error) {
        console.error('Error generating single bill:', error);
        return {
            success: false,
            error: `Failed to generate bill: ${error instanceof Error ? error.message : 'Unknown error'}`,
        };
    }
};

/**
 * Add complaint charge to bill
 */
export const addComplaintChargeToBill = async (
    billId: string,
    complaintCharge: BillComplaintCharge
): Promise<ApiResponse> => {
    try {
        const billRef = doc(db, 'bills', billId);
        const billSnapshot = await getDocs(query(collection(db, 'bills'), where('__name__', '==', billId)));

        if (billSnapshot.empty) {
            return {
                success: false,
                error: 'Bill not found',
            };
        }

        const billData = billSnapshot.docs[0].data() as Bill;
        const breakdown = billData.breakdown;

        // Add complaint charge
        breakdown.complaintCharges.push(complaintCharge);

        // Recalculate total
        breakdown.total = calculateBillTotal(breakdown);

        // Update bill
        await updateDoc(billRef, {
            breakdown,
            amount: breakdown.total,
            updatedAt: serverTimestamp(),
        });

        return {
            success: true,
            message: `Complaint charge of Rs. ${complaintCharge.amount} added to bill`,
        };
    } catch (error) {
        console.error('Error adding complaint charge to bill:', error);
        return {
            success: false,
            error: 'Failed to add complaint charge to bill',
        };
    }
};

/**
 * Send bill to resident (mark as Unpaid and notify)
 */
export const sendBillToResident = async (
    billId: string,
    adminId: string
): Promise<ApiResponse> => {
    try {
        const billRef = doc(db, 'bills', billId);

        await updateDoc(billRef, {
            status: 'Unpaid' as BillStatus,
            sentBy: adminId,
            sentAt: serverTimestamp(),
        });

        // TODO: Send notification to resident

        return {
            success: true,
            message: 'Bill sent to resident successfully',
        };
    } catch (error) {
        console.error('Error sending bill to resident:', error);
        return {
            success: false,
            error: 'Failed to send bill to resident',
        };
    }
};

/**
 * Publish all draft bills (send to all residents at once)
 */
export const publishAllDraftBills = async (adminId: string): Promise<ApiResponse> => {
    try {
        const draftBillsQuery = query(
            collection(db, 'bills'),
            where('status', '==', 'Draft')
        );

        const snapshot = await getDocs(draftBillsQuery);

        if (snapshot.empty) {
            return {
                success: true,
                message: 'No draft bills to publish',
            };
        }

        const batch = writeBatch(db);
        let count = 0;

        snapshot.docs.forEach(billDoc => {
            batch.update(doc(db, 'bills', billDoc.id), {
                status: 'Unpaid' as BillStatus,
                sentBy: adminId,
                sentAt: serverTimestamp(),
            });
            count++;
        });

        await batch.commit();

        // Invalidate cache
        dataCache.invalidateAllBills();

        return {
            success: true,
            message: `${count} bill${count !== 1 ? 's' : ''} sent to residents successfully`,
        };
    } catch (error) {
        logger.error('Error publishing draft bills:', error);
        return {
            success: false,
            error: 'Failed to publish bills',
        };
    }
};

/**
 * Archive paid bills
 */
export const archivePaidBills = async (): Promise<ApiResponse> => {
    try {
        const paidBillsQuery = query(
            collection(db, 'bills'),
            where('status', '==', 'Paid'),
            where('isArchived', '==', false)
        );

        const snapshot = await getDocs(paidBillsQuery);

        const promises = snapshot.docs.map(billDoc =>
            updateDoc(doc(db, 'bills', billDoc.id), {
                isArchived: true,
            })
        );

        await Promise.all(promises);

        return {
            success: true,
            data: { billsArchived: promises.length },
            message: `${promises.length} paid bills archived`,
        };
    } catch (error) {
        console.error('Error archiving paid bills:', error);
        return {
            success: false,
            error: 'Failed to archive paid bills',
        };
    }
};

/**
 * Get resident's current month bill
 */
export const getResidentCurrentBill = async (
    residentId: string,
    month: string
): Promise<Bill | null> => {
    try {
        // Query for resident's bill for the current month
        // Removed Draft filter so charges can be added to newly generated bills
        const q = query(
            collection(db, 'bills'),
            where('residentId', '==', residentId),
            where('month', '==', month)
        );

        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            return null;
        }

        const billDoc = querySnapshot.docs[0];
        return {
            id: billDoc.id,
            ...billDoc.data(),
        } as Bill;
    } catch (error) {
        console.error('Error fetching resident current bill:', error);
        return null;
    }
};

/**
 * Get a single bill by ID
 */
export const getBillById = async (billId: string): Promise<Bill | null> => {
    try {
        const { getDoc } = await import('firebase/firestore');
        const billDoc = await getDoc(doc(db, 'bills', billId));

        if (!billDoc.exists()) {
            return null;
        }

        return {
            id: billDoc.id,
            ...billDoc.data(),
        } as Bill;
    } catch (error) {
        console.error('Error fetching bill by ID:', error);
        return null;
    }
};

/**
 * Get all bills for a resident (excluding drafts)
 */
export const getResidentBills = async (
    residentId: string,
    includeArchived: boolean = false,
    forceRefresh: boolean = false
): Promise<Bill[]> => {
    try {
        // Check cache first
        const cacheKey = `bills:resident:${residentId}:${includeArchived}`;
        if (!forceRefresh) {
            const cached = dataCache.get<Bill[]>(cacheKey);
            if (cached) {
                console.log('✅ Using cached resident bills');
                return cached;
            }
        }

        const constraints = [
            where('residentId', '==', residentId),
            where('status', '!=', 'Draft'),
        ];

        if (!includeArchived) {
            constraints.push(where('isArchived', '==', false));
        }

        const q = query(
            collection(db, 'bills'),
            ...constraints,
            orderBy('month', 'desc')
        );

        const querySnapshot = await getDocs(q);
        const bills: Bill[] = [];

        querySnapshot.forEach((doc) => {
            bills.push({
                id: doc.id,
                ...doc.data(),
            } as Bill);
        });

        // Cache the results
        dataCache.set(cacheKey, bills);
        console.log('💾 Cached resident bills');

        return bills;
    } catch (error) {
        console.error('Error fetching resident bills:', error);
        return [];
    }
};

/**
 * Get resident's bill history (paid/archived bills)
 */
export const getResidentBillHistory = async (residentId: string): Promise<Bill[]> => {
    try {
        const q = query(
            collection(db, 'bills'),
            where('residentId', '==', residentId),
            where('status', '==', 'Paid'),
            orderBy('month', 'desc')
        );

        const querySnapshot = await getDocs(q);
        const bills: Bill[] = [];

        querySnapshot.forEach((doc) => {
            bills.push({
                id: doc.id,
                ...doc.data(),
            } as Bill);
        });

        return bills;
    } catch (error) {
        console.error('Error fetching resident bill history:', error);
        return [];
    }
};

/**
 * Get all bills (Admin) - including drafts
 */
export const getAllBills = async (includeDrafts: boolean = true, forceRefresh: boolean = false): Promise<Bill[]> => {
    try {
        // Check cache first
        const cacheKey = `bills:admin:all:${includeDrafts}`;
        if (!forceRefresh) {
            const cached = dataCache.get<Bill[]>(cacheKey);
            if (cached) {
                console.log('✅ Using cached admin bills');
                return cached;
            }
        }

        let q;

        if (includeDrafts) {
            q = query(collection(db, 'bills'), orderBy('month', 'desc'));
        } else {
            q = query(
                collection(db, 'bills'),
                where('status', '!=', 'Draft'),
                orderBy('month', 'desc')
            );
        }

        const querySnapshot = await getDocs(q);
        const bills: Bill[] = [];

        querySnapshot.forEach((doc) => {
            bills.push({
                id: doc.id,
                ...doc.data(),
            } as Bill);
        });

        // Cache the results
        dataCache.set(cacheKey, bills);
        console.log('💾 Cached admin bills');

        return bills;
    } catch (error) {
        console.error('Error fetching all bills:', error);
        return [];
    }
};

/**
 * Mark bill as paid (Admin verification)
 */
export const verifyPayment = async (
    billId: string,
    adminUid: string
): Promise<ApiResponse> => {
    try {
        const billRef = doc(db, 'bills', billId);

        await updateDoc(billRef, {
            status: 'Paid' as BillStatus,
            verifiedBy: adminUid,
            verifiedAt: serverTimestamp(),
        });

        return {
            success: true,
            message: 'Payment verified successfully',
        };
    } catch (error) {
        console.error('Error verifying payment:', error);
        return {
            success: false,
            error: 'Failed to verify payment',
        };
    }
};

/**
 * Upload payment proof (Resident)
 */
export const uploadPaymentProof = async (
    billId: string,
    proofUrl: string
): Promise<ApiResponse> => {
    try {
        const billRef = doc(db, 'bills', billId);

        await updateDoc(billRef, {
            proofUrl,
            proofUploadedAt: serverTimestamp(),
            status: 'Pending' as BillStatus,
        });

        return {
            success: true,
            message: 'Payment proof uploaded successfully',
        };
    } catch (error) {
        console.error('Error uploading payment proof:', error);
        return {
            success: false,
            error: 'Failed to upload payment proof',
        };
    }
};

/**
 * Get pending bills (Admin) - bills waiting for payment verification
 */
export const getPendingBills = async (): Promise<Bill[]> => {
    try {
        const q = query(
            collection(db, 'bills'),
            where('status', '==', 'Pending'),
            orderBy('month', 'desc')
        );

        const querySnapshot = await getDocs(q);
        const bills: Bill[] = [];

        querySnapshot.forEach((doc) => {
            bills.push({
                id: doc.id,
                ...doc.data(),
            } as Bill);
        });

        return bills;
    } catch (error) {
        console.error('Error fetching pending bills:', error);
        return [];
    }
};

/**
 * Reject payment proof (Admin)
 */
export const rejectPaymentProof = async (billId: string): Promise<ApiResponse> => {
    try {
        const billRef = doc(db, 'bills', billId);

        await updateDoc(billRef, {
            proofUrl: null,
            proofUploadedAt: null,
            status: 'Unpaid' as BillStatus,
        });

        return {
            success: true,
            message: 'Payment proof rejected',
        };
    } catch (error) {
        console.error('Error rejecting payment proof:', error);
        return {
            success: false,
            error: 'Failed to reject payment proof',
        };
    }
};

/**
 * Create bill (Legacy function for backward compatibility)
 * Note: Use generateMonthlyBills for new billing workflow
 */
export const createBill = async (billData: any): Promise<ApiResponse> => {
    try {
        // Create basic bill without breakdown (legacy format)
        const docRef = await addDoc(collection(db, 'bills'), {
            ...billData,
            createdAt: serverTimestamp(),
            status: billData.status || 'Unpaid',
            isArchived: false,
        });

        return {
            success: true,
            data: { billId: docRef.id },
            message: 'Bill created successfully',
        };
    } catch (error) {
        console.error('Error creating bill:', error);
        return {
            success: false,
            error: 'Failed to create bill',
        };
    }
};
