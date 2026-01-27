// TypeScript Types for eRoyal System

import { User as FirebaseUser } from 'firebase/auth';
import { FieldValue, Timestamp } from 'firebase/firestore';

// ==========================================
// USER TYPES
// ==========================================

export type UserRole = 'admin' | 'resident' | 'security';

export interface User {
    uid: string;
    name: string;
    email: string;
    houseNo: string | null;
    cnic?: string;
    role: UserRole;
    createdAt: Timestamp | FieldValue;
    createdBy: string;
}

// Type alias for extended profile (can add fields later)
export type UserProfile = User;

// ==========================================
// BILL TYPES
// ==========================================

export type BillStatus = 'Draft' | 'Unpaid' | 'Pending' | 'Paid';

export interface BillComplaintCharge {
    complaintId: string;
    complaintNumber: string;
    description: string;
    amount: number;
}

export interface BillBreakdown {
    baseCharges: number;
    complaintCharges: BillComplaintCharge[];
    previousDues: number;
    total: number;
}

export interface Bill {
    id?: string;
    residentId: string;
    residentName: string;
    houseNo: string;
    month: string; // Format: YYYY-MM
    breakdown: BillBreakdown;
    amount: number; // Total amount (calculated from breakdown)
    dueDate: Timestamp;
    status: BillStatus;
    sentBy: string | null; // Admin who sent the bill
    sentAt: Timestamp | FieldValue | null; // When bill was sent to user
    isArchived: boolean; // For paid bills
    proofUrl: string | null;
    proofUploadedAt: Timestamp | FieldValue | null;
    verifiedBy: string | null;
    verifiedAt: Timestamp | FieldValue | null;
    createdAt: Timestamp | FieldValue;
}

// ==========================================
// COMPLAINT TYPES
// ==========================================

export type ComplaintStatus = 'Pending' | 'In Progress' | 'Resolved';
export type ComplaintCategory = 'Water' | 'Electricity' | 'Maintenance' | 'Security' | 'Other';

export interface Complaint {
    id?: string;
    complaintNumber: string;
    title: string;
    description: string;
    category: ComplaintCategory;
    imageUrl: string | null;
    photoUrl?: string | null; // legacy field
    status: ComplaintStatus;
    residentId: string;
    residentName: string;
    houseNo: string;
    createdAt: Timestamp | FieldValue;
    updatedAt: Timestamp | FieldValue;
    resolvedAt?: Timestamp | FieldValue | null;
    resolvedBy?: string | null;
    resolutionNotes?: string | null;
    adminNotes?: string | null;
    chargeAmount?: number | null; // Amount to add to bill
    addedToBill?: boolean; // Whether already added to bill
    billId?: string | null; // Which bill it was added to
}

// ==========================================
// MARKETPLACE TYPES
// ==========================================

export type ListingType = 'Sell' | 'Rent';
export type ListingStatus = 'Pending' | 'Approved' | 'Rejected';

export interface Listing {
    id?: string;
    type: ListingType;
    price: number;
    size: string;
    location: string;
    contact: string;
    description: string;
    photos: string[];
    status: ListingStatus;
    postedBy: string;
    postedByName: string;
    postedByHouse: string;
    createdAt: Timestamp | FieldValue;
    reviewedBy: string | null;
    reviewedAt: Timestamp | FieldValue | null;
    rejectionReason: string | null;
}

// ==========================================
// VEHICLE TYPES
// ==========================================

export type VehicleType = 'Resident' | 'Visitor' | 'Service';
export type RegisteredVehicleType = 'Car' | 'Bike' | 'Other';

export interface VehicleLog {
    id?: string;
    vehicleNo: string;
    type: VehicleType;
    entryTime: Timestamp | FieldValue;
    exitTime: Timestamp | FieldValue | null;
    residentId: string | null;
    residentName: string | null;
    houseNo: string | null;
    visitorName: string | null;
    purpose: string | null;
    loggedBy: string;
    loggedByName: string;
}

export interface RegisteredVehicle {
    id?: string;
    vehicleNo: string; // Normalized (uppercase, trimmed)
    type: RegisteredVehicleType;
    color?: string;
    imageUrl?: string;
    residentId: string;
    residentName: string;
    houseNo: string;
    createdAt: Timestamp | FieldValue;
    updatedAt: Timestamp | FieldValue;
}

// ==========================================
// NOTIFICATION TYPES
// ==========================================

export type NotificationType = 'Bill' | 'Complaint' | 'Vehicle' | 'Marketplace' | 'General';

export interface Notification {
    id?: string;
    userId: string;
    title: string;
    message: string;
    type: NotificationType;
    isRead: boolean;
    relatedId: string | null;
    createdAt: Timestamp | FieldValue;
}

// ==========================================
// FORM TYPES
// ==========================================

export interface LoginFormData {
    email: string;
    password: string;
}

export interface CreateUserFormData {
    name: string;
    email: string;
    password: string;
    role: UserRole;
    houseNo?: string;
    cnic?: string;
}

export interface CreateBillFormData {
    residentId: string;
    residentName: string;
    houseNo: string;
    month: string;
    amount: number;
    dueDate: Date;
}

export interface CreateComplaintFormData {
    title: string;
    description: string;
    category: ComplaintCategory;
    photoUri?: string;
}

export interface CreateListingFormData {
    type: ListingType;
    price: number;
    size: string;
    location: string;
    contact: string;
    description: string;
    photoUris: string[];
}

export interface VehicleEntryFormData {
    vehicleNo: string;
    type: VehicleType;
    residentId?: string;
    residentName?: string;
    houseNo?: string;
    visitorName?: string;
    purpose?: string;
}

// ==========================================
// API RESPONSE TYPES
// ==========================================

export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

export interface ImageUploadResponse {
    success: boolean;
    url?: string;
    path?: string;
    error?: string;
}

// ==========================================
// CONTEXT TYPES
// ==========================================

export interface AuthContextType {
    currentUser: FirebaseUser | null;
    userProfile: User | null;
    userRole: UserRole | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<ApiResponse>;
    logout: () => Promise<void>;
}

// ==========================================
// NAVIGATION TYPES
// ==========================================

export type RootStackParamList = {
    '(auth)/login': undefined;
    '(admin)/dashboard': undefined;
    '(resident)/home': undefined;
    '(security)/gate-entry': undefined;
};

// ==========================================
// UTILITY TYPES
// ==========================================

export interface SelectOption {
    label: string;
    value: string;
}

export interface StatCard {
    title: string;
    value: string | number;
    icon: string;
    color: string;
}
