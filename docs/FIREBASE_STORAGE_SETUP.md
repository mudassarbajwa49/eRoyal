# Firebase Storage Setup Guide - eRoyal System

## Overview

Firebase Storage is used for all image uploads in the eRoyal system, replacing the need for Cloudinary or other third-party services.

---

## Why Firebase Storage?

✅ **Unified Ecosystem**: Everything in one place (Auth, Firestore, Storage)  
✅ **Secure**: Built-in integration with Firebase Authentication  
✅ **Cost-Effective**: Free tier includes 5GB storage, 1GB/day downloads  
✅ **Easy Integration**: Native Firebase SDK support  
✅ **No External Dependencies**: No need for Cloudinary API keys  

---

## Storage Structure

```
/eRoyal-storage/
├── payment-proofs/           # Bill payment screenshots
│   ├── 1702567890_abc123.jpg
│   └── 1702567891_def456.jpg
├── complaints/               # Complaint evidence photos
│   ├── 1702567892_ghi789.jpg
│   └── 1702567893_jkl012.jpg
├── marketplace/              # Property listing images
│   ├── listing1/
│   │   ├── image_0_1702567894.jpg
│   │   ├── image_1_1702567895.jpg
│   │   └── image_2_1702567896.jpg
│   └── listing2/
│       └── image_0_1702567897.jpg
├── user-profiles/            # User profile pictures (optional)
└── documents/                # Other documents (optional)
```

---

## Firebase Storage Rules

These rules ensure security and proper access control:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    
    // Allow authenticated users to read all images
    match /{allPaths=**} {
      allow read: if request.auth != null;
    }
    
    // Payment proofs - only residents and admins can upload
    match /payment-proofs/{imageId} {
      allow write: if request.auth != null && 
                      (getUserRole() == 'resident' || getUserRole() == 'admin');
    }
    
    // Complaints - only residents can upload
    match /complaints/{imageId} {
      allow write: if request.auth != null && getUserRole() == 'resident';
    }
    
    // Marketplace - only residents can upload
    match /marketplace/{imageId} {
      allow write: if request.auth != null && getUserRole() == 'resident';
    }
    
    // User profiles - users can only upload their own profile picture
    match /user-profiles/{userId}/{imageId} {
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Helper function to get user role from Firestore
    function getUserRole() {
      return firestore.get(/databases/(default)/documents/users/$(request.auth.uid)).data.role;
    }
  }
}
```

---

## Image Upload Flow

### 1. Resident Uploads Payment Proof

```javascript
import { uploadImage, STORAGE_FOLDERS } from './src/services/imageService';

// User selects image
const imageUri = 'file:///path/to/image.jpg';

// Upload to Firebase Storage
const result = await uploadImage(imageUri, STORAGE_FOLDERS.PAYMENT_PROOFS);

if (result.success) {
  // Save Firebase Storage URL to Firestore
  await updateDoc(doc(db, 'bills', billId), {
    proofUrl: result.url,
    status: 'Pending',
    proofUploadedAt: serverTimestamp()
  });
}
```

### 2. Resident Posts Marketplace Listing (Multiple Images)

```javascript
import { uploadMultipleImages, STORAGE_FOLDERS } from './src/services/imageService';

// User selects multiple images
const imageUris = [
  'file:///path/to/image1.jpg',
  'file:///path/to/image2.jpg',
  'file:///path/to/image3.jpg'
];

// Upload all images
const result = await uploadMultipleImages(imageUris, STORAGE_FOLDERS.MARKETPLACE);

if (result.success) {
  // Save all URLs to Firestore
  await addDoc(collection(db, 'listings'), {
    photos: result.urls,  // Array of Firebase Storage URLs
    status: 'Pending',
    // ... other listing data
  });
}
```

### 3. Admin Views Image

```javascript
// In admin panel, display image from Firebase Storage URL
<img src={bill.proofUrl} alt="Payment Proof" />
```

---

## File Naming Convention

All uploaded files follow this pattern for uniqueness:

```
{timestamp}_{randomString}.jpg
```

Example: `1702567890_abc123.jpg`

For multiple images (listings):
```
image_{index}_{timestamp}.jpg
```

Example: `image_0_1702567890.jpg`

---

## Setup Steps (Already Done)

1. ✅ Firebase Storage initialized in `firebaseConfig.js`
2. ✅ Image service created in `src/services/imageService.js`
3. ✅ Folder constants defined: `STORAGE_FOLDERS`

---

## Firebase Console Setup

To enable Firebase Storage in your Firebase project:

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your eRoyal project
3. Click **Storage** in the left menu
4. Click **Get Started**
5. Choose **Start in production mode** or **test mode**
6. Select your storage location (preferably closest to Pakistan)
7. Click **Done**

Storage is now ready to use!

---

## Storage Limitations (Free Tier)

- **Storage**: 5 GB
- **Downloads**: 1 GB/day
- **Uploads**: 20,000/day

This is **more than sufficient** for a housing society FYP project.

---

## Image Format Support

Firebase Storage supports all common formats:
- JPG/JPEG
- PNG
- GIF
- WebP
- BMP

The `imageService.js` automatically handles format conversion.

---

## Error Handling

All image upload functions include proper error handling:

```javascript
const result = await uploadImage(imageUri, folder);

if (result.success) {
  console.log('Upload successful:', result.url);
  // Proceed with saving to Firestore
} else {
  console.error('Upload failed:', result.error);
  // Show error message to user
  Alert.alert('Error', 'Failed to upload image. Please try again.');
}
```

---

## Advantages Over Cloudinary

| Feature | Firebase Storage | Cloudinary |
|---------|-----------------|------------|
| Setup | Built-in with Firebase | Separate account required |
| Authentication | Integrated with Firebase Auth | API keys needed |
| Cost (Free Tier) | 5GB storage | 25GB storage but complex pricing |
| Integration | Native Firebase SDK | Third-party API |
| Security Rules | Firestore-integrated | Separate configuration |
| Ecosystem | Single Firebase ecosystem | Separate service |

For a FYP project, **Firebase Storage is the better choice** due to simplicity and unified ecosystem.

---

## Summary

✅ All images are stored in **Firebase Storage**  
✅ URLs are saved in **Firestore** collections  
✅ Secure access via **Firebase Authentication**  
✅ No external dependencies (no Cloudinary needed)  
✅ Ready to use with the provided `imageService.js`  

The eRoyal system is now fully configured to use Firebase Storage for all image management needs.
