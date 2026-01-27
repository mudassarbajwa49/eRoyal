// Input validation schemas using Zod
// Provides runtime type checking and validation for user inputs

import { z } from 'zod';

// ==========================================
// USER VALIDATION
// ==========================================

export const createUserSchema = z.object({
    name: z.string()
        .min(2, 'Name must be at least 2 characters')
        .max(100, 'Name must be less than 100 characters')
        .trim(),
    email: z.string()
        .email('Invalid email address')
        .toLowerCase()
        .trim(),
    password: z.string()
        .min(6, 'Password must be at least 6 characters')
        .max(100, 'Password must be less than 100 characters'),
    role: z.enum(['admin', 'resident', 'security']),
    houseNo: z.string()
        .trim()
        .optional()
        .refine((val, ctx) => {
            // If role is resident, houseNo is required
            const role = ctx?.parent?.role;
            if (role === 'resident' && (!val || val.trim() === '')) {
                return false;
            }
            return true;
        }, 'House number is required for residents'),
    cnic: z.string()
        .trim()
        .optional(),
});

// ==========================================
// COMPLAINT VALIDATION
// ==========================================

export const createComplaintSchema = z.object({
    title: z.string()
        .min(5, 'Title must be at least 5 characters')
        .max(100, 'Title must be less than 100 characters')
        .trim(),
    description: z.string()
        .min(10, 'Description must be at least 10 characters')
        .max(1000, 'Description must be less than 1000 characters')
        .trim(),
    category: z.enum(['Water', 'Electricity', 'Maintenance', 'Security', 'Other']),
    photoUri: z.string().optional(),
});

// ==========================================
// BILL VALIDATION
// ==========================================

export const createBillSchema = z.object({
    residentId: z.string().min(1, 'Resident ID is required'),
    residentName: z.string().min(1, 'Resident name is required').trim(),
    houseNo: z.string().min(1, 'House number is required').trim(),
    month: z.string()
        .regex(/^\d{4}-\d{2}$/, 'Month must be in YYYY-MM format'),
    amount: z.number()
        .min(0, 'Amount must be positive')
        .max(1000000, 'Amount seems too large'),
    baseCharges: z.number()
        .min(0, 'Base charges must be positive'),
});

// ==========================================
// MARKETPLACE VALIDATION
// ==========================================

export const createListingSchema = z.object({
    type: z.enum(['Sell', 'Rent']),
    price: z.number()
        .min(0, 'Price must be positive')
        .max(1000000000, 'Price seems too large'),
    size: z.string()
        .min(1, 'Size is required')
        .max(50, 'Size must be less than 50 characters')
        .trim(),
    location: z.string()
        .min(1, 'Location is required')
        .max(200, 'Location must be less than 200 characters')
        .trim(),
    contact: z.string()
        .min(5, 'Contact must be at least 5 characters')
        .max(50, 'Contact must be less than 50 characters')
        .trim(),
    description: z.string()
        .min(10, 'Description must be at least 10 characters')
        .max(1000, 'Description must be less than 1000 characters')
        .trim(),
    photoUris: z.array(z.string()).max(10, 'Maximum 10 photos allowed'),
});

// ==========================================
// VEHICLE VALIDATION
// ==========================================

export const vehicleEntrySchema = z.object({
    vehicleNo: z.string()
        .min(1, 'Vehicle number is required')
        .max(20, 'Vehicle number must be less than 20 characters')
        .trim()
        .transform(val => val.toUpperCase()),
    type: z.enum(['Resident', 'Visitor', 'Service']),
    residentId: z.string().optional(),
    residentName: z.string().trim().optional(),
    houseNo: z.string().trim().optional(),
    visitorName: z.string().trim().optional(),
    purpose: z.string().trim().optional(),
});

export const registerVehicleSchema = z.object({
    vehicleNo: z.string()
        .min(1, 'Vehicle number is required')
        .max(20, 'Vehicle number must be less than 20 characters')
        .trim()
        .transform(val => val.toUpperCase()),
    type: z.enum(['Car', 'Bike', 'Other']),
    color: z.string().trim().optional(),
});

// ==========================================
// LOGIN VALIDATION
// ==========================================

export const loginSchema = z.object({
    email: z.string()
        .email('Invalid email address')
        .toLowerCase()
        .trim(),
    password: z.string()
        .min(1, 'Password is required'),
});
