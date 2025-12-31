# Firestore Database Structure - eRoyal Housing Society Management System

## Complete Collections Documentation for FYP Implementation Chapter

---

## Overview

The eRoyal system uses **Firebase Firestore** as the primary NoSQL database, with **Firebase Storage** for image management. Firebase is chosen for:
- Real-time synchronization capabilities
- Scalability without server management
- Native integration with Firebase Authentication
- Unified ecosystem (Auth + Firestore + Storage)
- Cost-effectiveness for housing society scale

---

## Collection 1: `users`

### Purpose
Stores all system user accounts including administrators, residents, and security personnel.

### Access Control
- **Create**: Admin only (via Admin Dashboard)
- **Read**: Own profile (residents/security), All profiles (admin)
- **Update**: Admin only
- **Delete**: Admin only

### Document Structure

```javascript
{
  // Document ID = Firebase Auth UID
  "uid": "abc123xyz",
  "name": "Ali Ahmed",
  "email": "ali@gmail.com",
  "houseNo": "A-12",              // For residents only, null for security
  "cnic": "35202-1234567-8",      // Optional identifier
  "role": "resident",             // 'admin' | 'resident' | 'security'
  "createdAt": Timestamp,
  "createdBy": "adminUid123"      // UID of admin who created this account
}
```

### Fields Description

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `uid` | string | Yes | Matches Firebase Authentication UID |
| `name` | string | Yes | Full name of user |
| `email` | string | Yes | Email address (used for login) |
| `houseNo` | string | Conditional | House/plot number (required for residents) |
| `cnic` | string | No | National ID card number |
| `role` | string | Yes | User role: 'admin', 'resident', or 'security' |
| `createdAt` | Timestamp | Yes | Server timestamp of account creation |
| `createdBy` | string | Yes | Admin UID who created this account |

### Example Documents

**Resident Account:**
```json
{
  "uid": "res001",
  "name": "Muhammad Zeeshan",
  "email": "zeeshan@eroyal.com",
  "houseNo": "B-45",
  "cnic": "35202-9876543-2",
  "role": "resident",
  "createdAt": "2025-06-01T10:30:00Z",
  "createdBy": "admin001"
}
```

**Security Account:**
```json
{
  "uid": "sec001",
  "name": "Ahmed Khan",
  "email": "security@eroyal.com",
  "houseNo": null,
  "cnic": "35202-1111111-1",
  "role": "security",
  "createdAt": "2025-06-01T09:00:00Z",
  "createdBy": "admin001"
}
```

### Implementation Logic

**Role-Based Navigation:**
```javascript
if (userRole === 'admin') {
   navigate('AdminDashboard');
}
else if (userRole === 'resident') {
   navigate('ResidentHome');
}
else if (userRole === 'security') {
   navigate('GateEntry');
}
```

---

## Collection 2: `bills`

### Purpose
Manages monthly billing, payment proof uploads, and payment verification workflow.

### Access Control
- **Create**: Admin only
- **Read**: Own bills (residents), All bills (admin)
- **Update**: 
  - Payment proof upload (resident)
  - Payment verification (admin only)

### Document Structure

```javascript
{
  "residentId": "res001",
  "residentName": "Ali Ahmed",
  "houseNo": "A-12",
  "month": "June 2025",
  "amount": 4500,
  "dueDate": Timestamp,
  "status": "Unpaid",            // 'Unpaid' | 'Pending' | 'Paid'
  "proofUrl": null,              // Firebase Storage URL after upload
  "proofUploadedAt": null,
  "verifiedBy": null,            // Admin UID who verified
  "verifiedAt": null,
  "createdAt": Timestamp
}
```

### Fields Description

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `residentId` | string | Yes | User UID of the resident |
| `residentName` | string | Yes | Resident's full name |
| `houseNo` | string | Yes | House/plot number |
| `month` | string | Yes | Billing month (e.g., "June 2025") |
| `amount` | number | Yes | Bill amount in PKR |
| `dueDate` | Timestamp | Yes | Payment due date |
| `status` | string | Yes | Payment status |
| `proofUrl` | string | No | Firebase Storage image URL (null until uploaded) |
| `proofUploadedAt` | Timestamp | No | When resident uploaded proof |
| `verifiedBy` | string | No | Admin UID who approved payment |
| `verifiedAt` | Timestamp | No | When payment was verified |
| `createdAt` | Timestamp | Yes | Bill generation timestamp |

### Status Workflow

1. **Unpaid** (Initial State)
   - Bill created by admin
   - Resident sees "Pay Now" button
   
2. **Pending** (After Payment Proof Upload)
   - Resident uploads JazzCash/EasyPaisa screenshot
   - Image uploaded to Firebase Storage
   - `proofUrl` updated with Firebase Storage download URL
   - Status changes to "Pending"
   - Admin notified for verification

3. **Paid** (After Admin Verification)
   - Admin reviews proof image
   - Admin clicks "Approve"
   - `verifiedBy` and `verifiedAt` populated
   - Status changes to "Paid"
   - Resident sees green indicator

### Example Document

```json
{
  "residentId": "res001",
  "residentName": "Muhammad Zeeshan",
  "houseNo": "B-45",
  "month": "December 2025",
  "amount": 5000,
  "dueDate": "2025-12-31T23:59:59Z",
  "status": "Pending",
  "proofUrl": "https://firebasestorage.googleapis.com/v0/b/eroyal.appspot.com/o/payment-proofs%2Fproof123.jpg?alt=media",
  "proofUploadedAt": "2025-12-28T14:30:00Z",
  "verifiedBy": null,
  "verifiedAt": null,
  "createdAt": "2025-12-01T00:00:00Z"
}
```

---

## Collection 3: `complaints`

### Purpose
Manages resident complaints and issue tracking system.

### Access Control
- **Create**: Residents only
- **Read**: Own complaints (residents), All complaints (admin)
- **Update**: Admin only (status updates)

### Document Structure

```javascript
{
  "title": "Water Leakage",
  "description": "Severe water leakage in main street pipe near house A-12",
  "category": "Water",           // 'Water' | 'Electricity' | 'Maintenance' | 'Security' | 'Other'
  "photoUrl": "firebase_storage_url",  // Optional image evidence
  "status": "Pending",           // 'Pending' | 'In Progress' | 'Resolved'
  "residentId": "res001",
  "residentName": "Ali Ahmed",
  "houseNo": "A-12",
  "createdAt": Timestamp,
  "resolvedAt": null,
  "resolvedBy": null,            // Admin UID
  "adminNotes": null             // Admin comments
}
```

### Fields Description

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | Yes | Brief complaint summary |
| `description` | string | Yes | Detailed complaint description |
| `category` | string | Yes | Complaint category |
| `photoUrl` | string | No | Firebase Storage image URL (optional evidence) |
| `status` | string | Yes | Current complaint status |
| `residentId` | string | Yes | UID of complaining resident |
| `residentName` | string | Yes | Resident's name |
| `houseNo` | string | Yes | Resident's house number |
| `createdAt` | Timestamp | Yes | Complaint submission time |
| `resolvedAt` | Timestamp | No | Resolution timestamp |
| `resolvedBy` | string | No | Admin UID who resolved |
| `adminNotes` | string | No | Admin's resolution notes |

### Status Colors (UI Implementation)

- **Pending**: Red/Orange
- **In Progress**: Yellow
- **Resolved**: Green

### Example Document

```json
{
  "title": "Streetlight Not Working",
  "description": "The streetlight in Block B near gate 2 has been non-functional for 3 days",
  "category": "Electricity",
  "photoUrl": "https://firebasestorage.googleapis.com/v0/b/eroyal.appspot.com/o/complaints%2Fcomplaint123.jpg?alt=media",
  "status": "In Progress",
  "residentId": "res001",
  "residentName": "Muhammad Zeeshan",
  "houseNo": "B-45",
  "createdAt": "2025-12-10T18:45:00Z",
  "resolvedAt": null,
  "resolvedBy": null,
  "adminNotes": "Electrician assigned, work scheduled for tomorrow"
}
```

---

## Collection 4: `listings` (Marketplace)

### Purpose
Property marketplace with **mandatory admin approval** before public visibility.

### Access Control
- **Create**: Residents only
- **Read**: 
  - Pending listings (admin only)
  - Approved listings (all residents)
- **Update**: Admin only (approval/rejection)

### Document Structure

```javascript
{
  "type": "Rent",                // 'Sell' | 'Rent'
  "price": 30000,
  "size": "5 Marla",
  "location": "Block A, House 12",
  "contact": "03001234567",
  "description": "Beautiful 5 marla house available for rent",
  "photos": [                    // Array of Firebase Storage URLs
    "url1",
    "url2",
    "url3"
  ],
  "status": "Pending",           // 'Pending' | 'Approved' | 'Rejected'
  "postedBy": "res001",
  "postedByName": "Ali Ahmed",
  "postedByHouse": "A-12",
  "createdAt": Timestamp,
  "reviewedBy": null,            // Admin UID
  "reviewedAt": null,
  "rejectionReason": null        // If rejected
}
```

### Fields Description

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `type` | string | Yes | 'Sell' or 'Rent' |
| `price` | number | Yes | Property price/rent in PKR |
| `size` | string | Yes | Property size (e.g., "5 Marla") |
| `location` | string | Yes | House/plot number and block |
| `contact` | string | Yes | Seller/landlord phone number |
| `description` | string | Yes | Property details |
| `photos` | array | Yes | Array of Firebase Storage image URLs |
| `status` | string | Yes | Approval status |
| `postedBy` | string | Yes | Resident UID who posted |
| `postedByName` | string | Yes | Resident's name |
| `postedByHouse` | string | Yes | Resident's house number |
| `createdAt` | Timestamp | Yes | Listing creation time |
| `reviewedBy` | string | No | Admin UID who reviewed |
| `reviewedAt` | Timestamp | No | Review timestamp |
| `rejectionReason` | string | No | Reason if rejected |

### Admin Approval Workflow

1. **Resident Posts Listing**
   - Fills property details
   - Uploads photos (Firebase Storage)
   - Submits form
   - Status: `Pending`
   - **NOT visible to other residents**

2. **Admin Reviews**
   - Views pending listing in admin panel
   - Checks photos and details
   - Options:
     - **Approve**: Status → `Approved`
     - **Reject**: Status → `Rejected`, adds rejection reason

3. **Public Display**
   - Only `Approved` listings shown in Marketplace
   - Firestore query: `where('status', '==', 'Approved')`

### Implementation Logic

**Resident Marketplace Query:**
```javascript
// Only fetch approved listings
const listingsQuery = query(
  collection(db, 'listings'), 
  where('status', '==', 'Approved')
);
```

**Admin Pending Queue:**
```javascript
// Fetch listings awaiting approval
const pendingQuery = query(
  collection(db, 'listings'), 
  where('status', '==', 'Pending')
);
```

### Example Document

```json
{
  "type": "Rent",
  "price": 35000,
  "size": "7 Marla",
  "location": "Block B, House 45",
  "contact": "03009876543",
  "description": "Spacious 7 marla house with 3 bedrooms, modern kitchen, and parking",
  "photos": [
    "https://firebasestorage.googleapis.com/v0/b/eroyal.appspot.com/o/marketplace%2Fhouse1.jpg?alt=media",
    "https://firebasestorage.googleapis.com/v0/b/eroyal.appspot.com/o/marketplace%2Fhouse2.jpg?alt=media"
  ],
  "status": "Approved",
  "postedBy": "res001",
  "postedByName": "Muhammad Zeeshan",
  "postedByHouse": "B-45",
  "createdAt": "2025-12-12T10:00:00Z",
  "reviewedBy": "admin001",
  "reviewedAt": "2025-12-12T14:30:00Z",
  "rejectionReason": null
}
```

---

## Collection 5: `vehicle_logs`

### Purpose
Security gate entry/exit logging system for vehicles.

### Access Control
- **Create**: Security personnel only
- **Read**: 
  - Own vehicle logs (residents)
  - All logs (admin & security)
- **Update**: Security only (exit time)

### Document Structure

```javascript
{
  "vehicleNo": "LEA-1234",
  "type": "Resident",            // 'Resident' | 'Visitor' | 'Service'
  "entryTime": Timestamp,
  "exitTime": null,              // Updated when vehicle exits
  "residentId": "res001",        // null for visitors
  "residentName": "Ali Ahmed",
  "houseNo": "A-12",
  "visitorName": null,           // For non-residents
  "purpose": null,               // For visitors
  "loggedBy": "sec001",          // Security UID
  "loggedByName": "Ahmed Khan"
}
```

### Fields Description

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `vehicleNo` | string | Yes | Vehicle registration number |
| `type` | string | Yes | Vehicle category |
| `entryTime` | Timestamp | Yes | Entry timestamp |
| `exitTime` | Timestamp | No | Exit timestamp (null until exit) |
| `residentId` | string | Conditional | UID if resident vehicle |
| `residentName` | string | Conditional | Resident name if applicable |
| `houseNo` | string | Conditional | House number if resident |
| `visitorName` | string | Conditional | Visitor name if applicable |
| `purpose` | string | No | Visit purpose for non-residents |
| `loggedBy` | string | Yes | Security personnel UID |
| `loggedByName` | string | Yes | Security personnel name |

### Security Role Implementation

**Access Restrictions:**
```javascript
// Security users can ONLY access:
// 1. Gate Entry Screen
// 2. Vehicle log creation
// 3. Vehicle number verification

// Security users CANNOT access:
// - Billing system
// - Complaints
// - Marketplace
// - Admin dashboard
// - Resident personal data (except vehicle ownership)
```

**Navigation Guard:**
```javascript
if (userRole === 'security') {
   navigate('GateEntry'); // Only this screen
}
```

### Example Documents

**Resident Vehicle:**
```json
{
  "vehicleNo": "LEA-5678",
  "type": "Resident",
  "entryTime": "2025-12-14T18:30:00Z",
  "exitTime": null,
  "residentId": "res001",
  "residentName": "Muhammad Zeeshan",
  "houseNo": "B-45",
  "visitorName": null,
  "purpose": null,
  "loggedBy": "sec001",
  "loggedByName": "Ahmed Khan"
}
```

**Visitor Vehicle:**
```json
{
  "vehicleNo": "LHR-9999",
  "type": "Visitor",
  "entryTime": "2025-12-14T19:00:00Z",
  "exitTime": "2025-12-14T20:15:00Z",
  "residentId": null,
  "residentName": null,
  "houseNo": null,
  "visitorName": "Bilal Ahmed",
  "purpose": "Meeting with resident A-12",
  "loggedBy": "sec001",
  "loggedByName": "Ahmed Khan"
}
```

---

## Collection 6: `notifications` (Optional Enhancement)

### Purpose
System-generated notifications for residents.

### Document Structure

```javascript
{
  "userId": "res001",
  "title": "New Bill Generated",
  "message": "Your bill for December 2025 (Rs. 5000) has been generated",
  "type": "Bill",                // 'Bill' | 'Complaint' | 'Vehicle' | 'Marketplace' | 'General'
  "isRead": false,
  "relatedId": "bill123",        // Reference to related document
  "createdAt": Timestamp
}
```

---

## Firestore Security Rules (Implementation)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Users collection
    match /users/{userId} {
      // Users can read their own profile, Admins can read all profiles
      allow read: if request.auth != null && 
                     (request.auth.uid == userId || 
                      get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
      // Only admins can create/update user profiles
      allow write: if request.auth != null && 
                      get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Bills collection
    match /bills/{billId} {
      // Residents can read their own bills
      allow read: if request.auth != null && 
                     (resource.data.residentId == request.auth.uid || 
                      get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
      // Only admins can create bills
      allow create: if request.auth != null && 
                       get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
      // Residents can update payment proof, admins can verify
      allow update: if request.auth != null && 
                       (resource.data.residentId == request.auth.uid || 
                        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
    }
    
    // Complaints collection
    match /complaints/{complaintId} {
      // Residents can read their own complaints, admins can read all
      allow read: if request.auth != null && 
                     (resource.data.residentId == request.auth.uid || 
                      get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
      // Only residents can create complaints
      allow create: if request.auth != null && 
                       get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'resident';
      // Only admins can update complaints
      allow update: if request.auth != null && 
                       get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Listings collection
    match /listings/{listingId} {
      // Everyone can read approved listings, admins can read all
      allow read: if request.auth != null && 
                     (resource.data.status == 'Approved' || 
                      get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
      // Only residents can create listings
      allow create: if request.auth != null && 
                       get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'resident';
      // Only admins can update (approve/reject)
      allow update: if request.auth != null && 
                       get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Vehicle logs collection
    match /vehicle_logs/{logId} {
      // Residents can read their own logs, security and admins can read all
      allow read: if request.auth != null && 
                     (resource.data.residentId == request.auth.uid || 
                      get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['admin', 'security']);
      // Only security can create/update logs
      allow write: if request.auth != null && 
                      get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'security';
    }
  }
}
```

---

## Database Indexes (Required for Performance)

### Composite Indexes

1. **Bills Query (Resident View)**
   - Collection: `bills`
   - Fields: `residentId` (Ascending), `createdAt` (Descending)

2. **Complaints Query (Resident View)**
   - Collection: `complaints`
   - Fields: `residentId` (Ascending), `createdAt` (Descending)

3. **Approved Listings**
   - Collection: `listings`
   - Fields: `status` (Ascending), `createdAt` (Descending)

4. **Pending Listings (Admin)**
   - Collection: `listings`
   - Fields: `status` (Ascending), `createdAt` (Descending)

5. **Vehicle Logs**
   - Collection: `vehicle_logs`
   - Fields: `residentId` (Ascending), `entryTime` (Descending)

---

## Summary

This Firestore database structure provides:

✅ **Role-Based Access Control (RBAC)** via security rules
✅ **Admin-controlled user registration** (no self-signup)
✅ **Admin approval for marketplace** listings
✅ **Real-time synchronization** for all modules
✅ **Secure payment verification** workflow
✅ **Security role isolation** (gate entry only)
✅ **Scalable NoSQL architecture**

All collections support the functional and non-functional requirements defined in the SRS and align with real-world housing society management workflows.
