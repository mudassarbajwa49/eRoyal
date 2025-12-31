// TypeScript Types for eRoyal System

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
    createdAt: any; // Firestore Timestamp
    createdBy: string;
}

export interface UserProfile extends User {
    // Extended profile if needed
}

// ==========================================
// BILL TYPES
// ==========================================

export type BillStatus = 'Unpaid' | 'Pending' | 'Paid';

export interface Bill {
    id?: string;
    residentId: string;
    residentName: string;
    houseNo: string;
    month: string;
    amount: number;
    dueDate: any; // Firestore Timestamp
    status: BillStatus;
    proofUrl: string | null;
    proofUploadedAt: any | null;
    verifiedBy: string | null;
    verifiedAt: any | null;
    createdAt: any;
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
    createdAt: any;
    updatedAt: any;
    resolvedAt?: any | null;
    resolvedBy?: string | null;
    resolutionNotes?: string | null;
    adminNotes?: string | null;
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
    createdAt: any;
    reviewedBy: string | null;
    reviewedAt: any | null;
    rejectionReason: string | null;
}

// ==========================================
// VEHICLE LOG TYPES
// ==========================================

export type VehicleType = 'Resident' | 'Visitor' | 'Service';

export interface VehicleLog {
    id?: string;
    vehicleNo: string;
    type: VehicleType;
    entryTime: any;
    exitTime: any | null;
    residentId: string | null;
    residentName: string | null;
    houseNo: string | null;
    visitorName: string | null;
    purpose: string | null;
    loggedBy: string;
    loggedByName: string;
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
    createdAt: any;
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
    currentUser: any | null; // Firebase User
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
