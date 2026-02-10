# Admin Custom Claims Setup Guide

## Overview

This guide walks you through setting up Firebase Admin custom claims for your eRoyal application. Custom claims are required for storage rules that check admin permissions.

---

## Prerequisites

- Node.js installed
- Firebase Admin SDK
- Firebase service account key

---

## Step-by-Step Setup

### Step 1: Install Firebase Admin SDK

```bash
npm install firebase-admin --save-dev
```

### Step 2: Download Service Account Key

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **eRoyal**
3. Click **Project Settings** (gear icon)
4. Go to **Service Accounts** tab
5. Click **Generate New Private Key**
6. Save the file as `service-account-key.json` in your project root

**⚠️ IMPORTANT:** Never commit this file to Git! It contains sensitive credentials.

### Step 3: Verify File Placement

Your project structure should look like:

```
eRoyal/
├── service-account-key.json  ← Place here
├── scripts/
│   └── setAdminClaim.js
├── app/
├── src/
└── ...
```

### Step 4: Set Admin Claims

Use the script to set admin role for users:

**Set single admin:**
```bash
node scripts/setAdminClaim.js set admin@example.com
```

**Set multiple admins:**
```bash
node scripts/setAdminClaim.js bulk admin1@example.com,admin2@example.com
```

**List all admins:**
```bash
node scripts/setAdminClaim.js list
```

**Remove admin:**
```bash
node scripts/setAdminClaim.js remove user@example.com
```

---

## Usage Examples

### Example 1: Set Admin for Main Account

```bash
node scripts/setAdminClaim.js set admin@eroyal.com
```

**Output:**
```
✅ Firebase Admin initialized
✅ Admin claim set for admin@eroyal.com
   User ID: abc123xyz789
   The user needs to sign out and sign in again for changes to take effect
```

### Example 2: Bulk Set Admins

```bash
node scripts/setAdminClaim.js bulk admin1@test.com,admin2@test.com,admin3@test.com
```

**Output:**
```
🔧 Setting admin claims for 3 users...

✅ Admin claim set for admin1@test.com
   User ID: uid1

✅ Admin claim set for admin2@test.com
   User ID: uid2

✅ Admin claim set for admin3@test.com
   User ID: uid3

✅ Successfully set: 3
❌ Failed: 0
```

### Example 3: List All Admins

```bash
node scripts/setAdminClaim.js list
```

**Output:**
```
📋 Admin Users (2):

1. admin@eroyal.com
   UID: abc123
   Created: Mon, 10 Feb 2026 10:00:00 GMT

2. mudassir@eroyal.com
   UID: def456
   Created: Mon, 10 Feb 2026 11:00:00 GMT
```

---

## Important Notes

### Custom Claims Take Effect After Re-login

After setting custom claims, users **MUST**:
1. Sign out of the app
2. Sign in again

The custom claims are embedded in the user's ID token, which is only refreshed on login.

### Firestore Alternative (Optional)

If you don't want to use custom claims, you can modify storage rules to check Firestore:

**In `storage.rules`:**
```javascript
function isAdmin() {
  // Check Firestore instead of custom claims
  return firestore.get(/databases/(default)/documents/users/$(request.auth.uid)).data.role == 'admin';
}
```

**Pros:**
- No script needed
- Changes take effect immediately

**Cons:**
- Extra Firestore read on every storage operation
- Slightly slower
- Additional cost

---

## Troubleshooting

### Error: Cannot find module '../service-account-key.json'

**Solution:** Download service account key from Firebase Console and place in project root.

### Error: Error initializing Firebase Admin

**Solution:** Verify:
1. File is named exactly `service-account-key.json`
2. File is in project root (not in scripts folder)
3. File is valid JSON

### Error: There is no user record corresponding to the provided identifier

**Solution:** Make sure the user exists in Firebase Authentication first. Users must sign up before you can set custom claims.

### Custom Claims Not Working

**Solution:**
1. Verify claim was set: `node scripts/setAdminClaim.js list`
2. User must sign out and sign in
3. Check storage rules use `request.auth.token.role`

---

## Security Best Practices

### 1. Never Commit Service Account Key

**Add to `.gitignore`:**
```
service-account-key.json
```

### 2. Restrict Service Account Permissions

In Firebase Console > Service Accounts:
- Only grant necessary permissions
- Rotate keys periodically

### 3. Keep Script Secure

The `setAdminClaim.js` script should only be run by authorized personnel.

### 4. Audit Admin Users

Regularly review admin users:
```bash
node scripts/setAdminClaim.js list
```

---

## Integration with Storage Rules

Your storage rules now check for admin role:

```javascript
// storage.rules
function isAdmin() {
  return request.auth.token.role == 'admin';
}

match /announcements/{fileName} {
  // Only admins can upload
  allow create: if isAdmin() && isValidImage();
  
  // Only admins can delete
  allow delete: if isAdmin();
}
```

**Flow:**
1. User uploads file
2. Storage rules check `request.auth.token.role`
3. If role is 'admin', operation allowed
4. Otherwise, operation denied

---

## Next Steps

1. ✅ Install firebase-admin
2. ✅ Download service account key
3. ✅ Add to .gitignore
4. ✅ Set admin claims for your users
5. ✅ Deploy storage rules: `firebase deploy --only storage`
6. ✅ Test admin operations
7. ✅ Ask admins to re-login

---

## Complete Checklist

- [ ] Installed firebase-admin
- [ ] Downloaded service-account-key.json from Firebase Console
- [ ] Placed service-account-key.json in project root
- [ ] Added service-account-key.json to .gitignore
- [ ] Verified file structure
- [ ] Set admin claim for main admin: `node scripts/setAdminClaim.js set <email>`
- [ ] Listed all admins: `node scripts/setAdminClaim.js list`
- [ ] Admins signed out and signed in again
- [ ] Deployed storage rules: `firebase deploy --only storage`
- [ ] Tested admin-only operations (announcements upload/delete)
- [ ] Tested non-admin restrictions (should fail)

---

## Support

If you encounter issues:
1. Check logs in the script output
2. Verify Firebase Console > Authentication has the user
3. Check Firebase Console > Users > [User] > Custom Claims
4. Test with `node scripts/setAdminClaim.js list`

**Remember:** Users must re-login for custom claims to take effect!
