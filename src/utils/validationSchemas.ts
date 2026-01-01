/**
 * Validation Schemas using Zod
 * Centralized validation for all forms and data inputs
 */

import { z } from 'zod';

// ============== Auth & User Validation ==============

export const emailSchema = z.string().min(1, 'Email is required').email('Invalid email format').toLowerCase().trim();

export const passwordSchema = z.string().min(6, 'Password must be at least 6 characters').max(100, 'Password is too long');

export const cnicSchema = z.string().regex(/^\d{13}$/, 'CNIC must be exactly 13 digits').optional().or(z.literal(''));

export const houseNoSchema = z.string().min(1, 'House number is required').max(10, 'House number too long').regex(/^[A-Za-z0-9-]+$/, 'House number can only contain letters, numbers, and hyphens').trim();

export const createUserSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name too long').trim(),
    email: emailSchema,
    password: passwordSchema,
    role: z.enum(['resident', 'admin', 'security']),
    houseNo: z.string().optional(),
    cnic: cnicSchema,
}).refine((data) => {
    if (data.role === 'resident' && !data.houseNo) {
        return false;
    }
    return true;
}, {
    message: 'House number is required for residents',
    path: ['houseNo']
});

export const loginSchema = z.object({
    email: emailSchema,
    password: z.string().min(1, 'Password is required'),
});

// ============== Bill Validation ==============

export const amountSchema = z.number().positive('Amount must be greater than 0').max(1000000, 'Amount is too large').finite('Amount must be a valid number');

export const billChargesSchema = z.object({
    baseCharges: amountSchema,
    previousDues: z.number().min(0, 'Previous dues cannot be negative').default(0),
    complaintCharges: z.array(z.object({
        complaintId: z.string(),
        complaintNumber: z.string(),
        description: z.string().min(1, 'Description required'),
        amount: amountSchema,
    })).default([]),
});

export const generateBillSchema = z.object({
    residentId: z.string().min(1, 'Resident ID is required'),
    month: z.string().regex(/^\d{4}-\d{2}$/, 'Month must be in YYYY-MM format'),
    baseCharges: amountSchema,
    previousDues: z.number().min(0).default(0),
});

// ============== Complaint Validation ==============

export const complaintCategorySchema = z.enum(['Maintenance', 'Security', 'Sanitation', 'Parking', 'Noise', 'Other']);

export const createComplaintSchema = z.object({
    title: z.string().min(5, 'Title must be at least 5 characters').max(200, 'Title too long').trim(),
    description: z.string().min(10, 'Description must be at least 10 characters').max(2000, 'Description too long').trim(),
    category: complaintCategorySchema,
    photoUri: z.string().optional(),
});

export const resolveComplaintSchema = z.object({
    resolutionNotes: z.string().min(10, 'Resolution notes must be at least 10 characters').max(1000).trim(),
    chargeAmount: z.number().min(0, 'Charge cannot be negative').max(100000, 'Charge too large').optional(),
});

// ============== Vehicle Validation ==============

export const vehicleNumberSchema = z.string().min(3, 'Vehicle number too short').max(15, 'Vehicle number too long').regex(/^[A-Z0-9-]+$/i, 'Vehicle number can only contain letters, numbers, and hyphens').trim().toUpperCase();

export const vehicleRegistrationSchema = z.object({
    vehicleNo: vehicleNumberSchema,
    vehicleType: z.enum(['Car', 'Motorcycle', 'Van', 'Bus', 'Truck', 'Other']),
    ownerName: z.string().min(2).max(100).trim(),
    contactNumber: z.string().regex(/^\d{10,15}$/, 'Invalid phone number format'),
});

export const gateEntrySchema = z.object({
    vehicleNo: vehicleNumberSchema,
    vehicleType: z.enum(['Car', 'Motorcycle', 'Van', 'Bus', 'Truck', 'Other']),
    purpose: z.string().min(3, 'Purpose required').max(200).trim(),
});

// ============== Announcement Validation ==============

export const announcementSchema = z.object({
    title: z.string().min(5, 'Title must be at least 5 characters').max(200, 'Title too long').trim(),
    message: z.string().min(20, 'Message must be at least 20 characters').max(5000, 'Message too long').trim(),
    priority: z.enum(['low', 'medium', 'high']).default('medium'),
});

// ============== Marketplace Validation ==============

export const marketplaceListingSchema = z.object({
    title: z.string().min(5, 'Title must be at least 5 characters').max(100, 'Title too long').trim(),
    description: z.string().min(20, 'Description must be at least 20 characters').max(1000, 'Description too long').trim(),
    price: amountSchema,
    category: z.enum(['Electronics', 'Furniture', 'Vehicles', 'Services', 'Other']),
    contact: z.string().regex(/^\d{10,15}$/, 'Invalid phone number'),
});

// ============== Helper Functions ==============

export function validateData<T>(schema: z.ZodSchema<T>, data: unknown): {
    success: boolean;
    data?: T;
    errors?: Record<string, string>;
} {
    const result = schema.safeParse(data);
    
    if (result.success) {
        return {
            success: true,
            data: result.data,
        };
    }
    
    const errors: Record<string, string> = {};
    result.error.issues.forEach((err) => {
        const path = err.path.join('.');
        errors[path] = err.message;
    });
    
    return {
        success: false,
        errors,
    };
}

export function assertValid<T>(schema: z.ZodSchema<T>, data: unknown, context: string): T {
    const result = schema.safeParse(data);
    
    if (!result.success) {
        const firstError = result.error.issues[0];
        throw new Error(`${context}: ${firstError.message}`);
    }
    
    return result.data;
}
