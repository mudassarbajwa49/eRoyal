# eRoyal - Housing Society Management System

**100% FREE Firebase-based application** for managing housing society operations.

## 💰 Cost: $0.00 - Completely FREE!

- ✅ **Firebase Firestore** - FREE 1GB database
- ✅ **Firebase Authentication** - Unlimited users FREE
- ✅ **Firebase Storage** - FREE 5GB for images
- ✅ **No Credit Card Required!**

---

## ⚡ Quick Setup (3 Minutes)

```powershell
# 1. Install dependencies
npm install

# 2. Setup Firebase (see docs/FIREBASE_SETUP.md)
#    - Enable Authentication (Email/Password)
#    - Enable Firestore Database
#    - Enable Firebase Storage
#    - Deploy security rules

# 3. Start app
npm start
```

**That's it!** 🎉

---

## 🏗️ Project Structure

```
eRoyal/
├── app/                      # Expo Router screens
│   ├── (admin)/             # Admin-only screens
│   ├── (resident)/          # Resident screens
│   ├── (security)/          # Security screens
│   └── (auth)/              # Login/Signup
│
├── src/                      # Source code
│   ├── components/          # UI components
│   ├── contexts/            # Auth context
│   ├── services/            # Firestore services
│   └── types/               # TypeScript types
│
├── assets/                   # Images, fonts
├── docs/                     # Documentation
└── README.md                 # This file
```

---

## 🔥 Firebase Architecture

### **Firestore Database (FREE)**
All app data stored in Firestore collections:
- `admins/*` - Admin users
- `residents/*` - Resident users
- `security_staff/*` - Security personnel
- `announcements/*` - Community announcements
- `complaints/*` - Resident complaints
- `bills/*` - Monthly bills
- `vehicles/*` - Vehicle logs

### **Firebase Storage (FREE)**
Images stored in Firebase Storage:
- `announcements/` - Announcement photos
- `complaints/` - Complaint images
- `profiles/` - User avatars

### **Firebase Auth (FREE)**
- Email/Password authentication
- Role-based access (admin, resident, security)

**Setup Guide**: [docs/FIREBASE_SETUP.md](docs/FIREBASE_SETUP.md)

---

## 📱 Features

### For Admins
- ✅ User management (create residents, security, admins)
- ✅ Announcement broadcasting with images
- ✅ Bill generation and management
- ✅ Complaint tracking and resolution
- ✅ Vehicle log monitoring

### For Residents
- ✅ View announcements
- ✅ Submit complaints with images
- ✅ View and pay bills
- ✅ Track vehicle entries/exits

### For Security
- ✅ Log vehicle entries/exits
- ✅ View active vehicles
- ✅ Visitor management

---

## 🛠️ Tech Stack

- **Frontend**: React Native + Expo
- **Navigation**: Expo Router
- **Database**: Firebase Firestore
- **Storage**: Firebase Storage
- **Authentication**: Firebase Auth
- **Language**: TypeScript

---

## 📝 Key Files

- `firebaseConfig.js` - Firebase initialization
- `app.json` - Expo configuration
- `src/services/` - Firestore data services
- `src/contexts/AuthContext.tsx` - Authentication logic

---

## 📚 Documentation

- **[Firebase Setup Guide](docs/FIREBASE_SETUP.md)** - Complete Firebase configuration
- **[Firebase Setup Checklist](docs/FIREBASE_SETUP_CHECKLIST.md)** - Quick checklist
- **[Testing Guide](docs/TESTING_GUIDE.md)** - How to test the app

---

## 🚀 Development

```powershell
# Start development server
npm start

# Run on Android
npm run android

# Run on iOS
npm run ios

# Run on web
npm run web
```

---

## 🧪 Testing

1. Create an admin account first
2. Login and test all features
3. Check Firestore console for data
4. Verify images appear in Storage

---

## 📦 Project Depend encies

- React Native + Expo
- Firebase SDK (Auth, Firestore, Storage)
- Expo Router
- React Native Picker
- Expo Image Picker

---

## 🔐 Security

- Firestore security rules enforce permissions
- Storage rules require authentication
- Role-based access control
- All data encrypted in transit (HTTPS)

---

## 💡 Why Firebase?

- ✅ **100% FREE** for small apps
- ✅ **No servers** to manage
- ✅ **Scales automatically**
- ✅ **Real-time updates**
- ✅ **Built-in authentication**
- ✅ **Global CDN** for images

---

## 📄 License

Private project - All rights reserved

---

**Version**: 2.0.0 (Firebase-Only)  
**Last Updated**: December 2025

🏠 eRoyal Housing Society Management System
