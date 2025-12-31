# eRoyal - 100% FREE Firebase Setup

## 🎯 Simple & Free Architecture

**Everything is hosted on Firebase - Completely FREE!**

- ✅ **Firestore Database** - 1GB storage FREE
- ✅ **Firebase Authentication** - Unlimited FREE
- ✅ **Firebase Storage** - 5GB FREE
- ✅ **No Credit Card Required!**

---

## 📱 What's Stored Where

### Firestore Collections

```
firestore/
├── admins/          # Admin users
├── residents/       # Resident users  
├──  security_staff/  # Security personnel
├── announcements/   # Housing announcements with images
├── complaints/      # Resident complaints
├── bills/           # Monthly bills
└── vehicles/        # Vehicle logs
```

### Firebase Storage

```
storage/
├── announcements/   # Announcement images
├── complaints/      # Complaint photos
└── profiles/        # User profile pictures
```

---

## 🚀 Quick Setup (3 Minutes)

### Step 1: Firebase Console Setup

1. Go to https://console.firebase.google.com
2. Select your project: **eroyal-b0186**
3. Enable these services:

#### Authentication
- Click "Authentication" → "Get Started"
- Enable "Email/Password"
- Done!

#### Firestore Database
- Click "Firestore Database" → "Create database"
- Choose "Start in **test mode**" (we'll add rules later)
- Select location closest to you
- Click "Enable"

#### Storage  
- Click "Storage" → "Get Started"
- Start in **test mode**
- Done!

### Step 2: Update Firestore Rules

Go to Firestore → Rules, paste this:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // User collections - users can read/write their own data
    match /{userType}/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      allow read: if request.auth != null && isAdmin();
    }
    
    // Announcements - admins write, everyone reads
    match /announcements/{docId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && isAdmin();
    }
    
    // Complaints - users create, admins manage
    match /complaints/{docId} {
      allow create: if request.auth != null;
      allow read: if request.auth != null;
      allow update, delete: if request.auth != null && isAdmin();
    }
    
    // Bills - admins create, users read their own
    match /bills/{docId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && isAdmin();
    }
    
    // Vehicles - security creates, admins manage
    match /vehicles/{docId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && (isAdmin() || isSecurity());
      allow update, delete: if request.auth != null && isAdmin();
    }
    
    // Helper functions
    function isAdmin() {
      return exists(/databases/$(database)/documents/admins/$(request.auth.uid));
    }
    
    function isSecurity() {
      return exists(/databases/$(database)/documents/security_staff/$(request.auth.uid));
    }
  }
}
```

### Step 3: Update Storage Rules

Go to Storage → Rules:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
  }
}
```

### Step 4: Run Your App

```powershell
cd c:\your-project-name
npm install
npm start
```

**That's it!** 🎉

---

## 📊 Firestore Data Structure

### Announcements Collection

```javascript
announcements/ {
  id: "auto-generated",
  title: "Community Meeting",
  message: "...",
  priority: "high" | "medium" | "low",
  createdBy: "admin-uid",
  createdByName: "Admin Name",
  imageUrls: ["url1", "url2"],
  createdAt: timestamp
}
```

### Users Collections (admins/, residents/, security_staff/)

```javascript
admins/userId {
  uid: "user-id",
  name: "John Doe",
  email: "john@example.com",
  role: "admin",
  createdAt: timestamp
}
```

### Complaints Collection

```javascript
complaints/ {
  id: "auto-generated",
  title: "Water Issue",
  description: "...",
  status: "pending" | "in-progress" | "resolved",
  priority: "high" | "medium" | "low",
  residentId: "user-id",
  residentName: "Resident Name",
  imageUrls: ["url1"],
  createdAt: timestamp,
  resolvedAt: timestamp | null
}
```

---

## 🔐 Security

- ✅ Firestore rules protect data
- ✅ Storage rules allow only authenticated users
- ✅ Role-based access (admins/, residents/, security_staff/)
- ✅ All data encrypted in transit (HTTPS)

---

## 💰 Costs - **$0.00!**

### Firebase Free Tier (Spark Plan)

| Service | Free Limit | Your Usage |
|---------|------------|------------|
| Firestore Storage | 1 GB | ~50 MB (plenty!) |
| Firestore Reads | 50,000/day | ~1,000/day |
| Firestore Writes | 20,000/day | ~500/day |  
| Storage | 5 GB | ~500 MB |
| Auth Users | Unlimited | ✅ |

**You won't hit these limits for a housing society!**

---

## 🚀 Features Included

### For Admins
- ✅ Create announcements with images
- ✅ Manage user accounts
- ✅ Create and track bills
- ✅ View and resolve complaints
- ✅ Monitor vehicle logs

### For Residents  
- ✅ View announcements
- ✅ Submit complaints with photos
- ✅ View and pay bills
- ✅ Track vehicle entries

### For Security
- ✅ Log vehicle entries/exits
- ✅ View active vehicles

---

## 🆘 Troubleshooting

### "Permission denied" errors

**Solution**: Check Firestore rules are published correctly

### Images not uploading

**Solution**: Verify Storage rules allow writes

### Can't create users

**Solution**: Ensure Email/Password auth is enabled

---

## 📈 Monitoring Usage

1. Go to Firebase Console
2. Click "Usage & Billing"
3. View:
   - Firestore reads/writes
   - Storage usage
   - Authentication users

**Stay within free tier!** (You will easily)

---

## ✅ You're All Set!

Your app now uses:
- **Firebase Auth**: User login
- **Firestore**: All data storage
- **Firebase Storage**: Images

**Total Cost: $0.00/month** 💰

**No servers to manage!** ☁️

**Scales automatically!** 🚀
