# Firebase Auth User Deletion Setup

## ✅ What's Been Created

I've set up a Cloud Function to delete users from Firebase Authentication.

### Files Created:
1. **`functions/src/index.ts`** - Cloud Function `deleteAuthUser`
2. **`functions/package.json`** - Dependencies
3. **`functions/tsconfig.json`** - TypeScript config
4. **`firebase.json`** - Firebase configuration

### Dependencies Installed:
- ✅ firebase-admin
- ✅ firebase-functions
- ✅ typescript

---

## 🚀 How to Deploy

### Step 1: Build the Cloud Function

```powershell
cd c:\eRoyal\functions
npm run build
```

### Step 2: Deploy to Firebase

```powershell
cd c:\eRoyal
firebase deploy --only functions
```

This will deploy the `deleteAuthUser` function to your Firebase project.

---

## 🔧 How It Works

When you delete a user in the app:

1. ✅ Deletes from Firestore (`residents/`, `security_staff/`, or `admins/`)
2. ✅ Deletes from backup `users/` collection
3. ✅ **Calls Cloud Function to delete from Firebase Authentication**

---

## ⚠️ Before Deploying

The Cloud Function requires your service account key:

1. **Copy** `serviceAccountKey.json` to `functions/` folder:
   ```powershell
   Copy-Item "c:\eRoyal\serviceAccountKey.json" "c:\eRoyal\functions\"
   ```

2. **Deploy**:
   ```powershell
   firebase deploy --only functions
   ```

---

## 🔐 Security

- Only **admins** can call this function
- User must be authenticated
- Validates admin role before deletion

---

## ✅ After Deployment

Once deployed, deleting a user will:
- Delete from Firestore ✓
- Delete from Firebase Authentication ✓
- User completely removed from all systems ✓

---

## 📝 Commands Summary

```powershell
# 1. Build
cd c:\eRoyal\functions
npm run build

# 2. Deploy
cd c:\eRoyal
firebase deploy --only functions

# Done!
```
