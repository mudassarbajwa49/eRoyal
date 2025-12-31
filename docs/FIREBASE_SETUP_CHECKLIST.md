# ✅ Firebase Setup Checklist for eRoyal

## 🎯 Complete These Steps to Fix Login

### ✅ Step 1: Enable Firebase Authentication (2 minutes)

1. Open: https://console.firebase.google.com/project/eroyal-b0186/authentication
2. Click **"Get started"** (if first time)
3. Click **"Sign-in method"** tab
4. Find **"Email/Password"** in the list
5. Click on it
6. Toggle **"Enable"** to ON
7. Click **"Save"**

### ✅ Step 2: Create Firestore Database (1 minute)

1. Open: https://console.firebase.google.com/project/eroyal-b0186/firestore
2. Click **"Create database"**
3. Select **"Start in test mode"**
4. Choose your location (closest to you)
5. Click **"Enable"**

### ✅ Step 3: Enable Firebase Storage (1 minute)

1. Open: https://console.firebase.google.com/project/eroyal-b0186/storage
2. Click **"Get started"**
3. Select **"Start in test mode"**
4. Use default location
5. Click **"Done"**

### ✅ Step 4: Create Admin Account (3 minutes)

**Part A: Create in Authentication**
1. Go to: https://console.firebase.google.com/project/eroyal-b0186/authentication/users
2. Click **"Add user"** button
3. Enter:
   ```
   Email: admin@eroyal.com
   Password: Admin@123
   ```
4. Click **"Add user"**
5. **IMPORTANT:** Copy the **UID** (looks like: `fR3dK8sL2mN5pQ7w`)

**Part B: Add to Firestore**
1. Go to: https://console.firebase.google.com/project/eroyal-b0186/firestore/data
2. Click **"+ Start collection"**
3. Collection ID: `users` → Click **"Next"**
4. Document ID: **Paste the UID you copied**
5. Add these fields one by one (click "+ Add field" for each):

| Field Name | Type | Value |
|------------|------|-------|
| `uid` | string | [Paste the UID] |
| `name` | string | `Admin` |
| `email` | string | `admin@eroyal.com` |
| `role` | string | `admin` |
| `houseNo` | null | (select "null" from dropdown) |
| `createdBy` | string | `system` |
| `createdAt` | timestamp | (click clock icon → "Now") |

6. Click **"Save"**

### ✅ Step 5: Test Login

1. Go back to your app: http://localhost:8081
2. Enter:
   ```
   Email: admin@eroyal.com
   Password: Admin@123
   ```
3. Click **"Sign In"**
4. You should be redirected to Admin Dashboard! 🎉

---

## 🔍 Troubleshooting

### If login still doesn't work:

**Check Browser Console:**
1. Press `F12` in your browser
2. Click **"Console"** tab
3. Look for error messages
4. Share the errors with me

**Common Errors:**

| Error Message | Solution |
|---------------|----------|
| "Firebase: Error (auth/invalid-email)" | Check email format |
| "Firebase: Error (auth/user-not-found)" | Admin account not created |
| "Firebase: Error (auth/wrong-password)" | Wrong password |
| "Firebase: Error (auth/configuration-not-found)" | Email/Password not enabled |

---

## 📋 Quick Verification

Run through this checklist:

- [ ] Firebase Authentication enabled?
- [ ] Email/Password provider enabled?
- [ ] Firestore database created?
- [ ] Firebase Storage enabled?
- [ ] Admin user created in Authentication?
- [ ] Admin user document created in Firestore `users` collection?
- [ ] App is running at http://localhost:8081?

**All checked?** Login should work! ✅

---

## 🆘 Need Help?

If you're stuck, tell me:
1. Which step you're on
2. What error you see (screenshot if possible)
3. What happens when you click login

I'll help you fix it immediately! 🚀
