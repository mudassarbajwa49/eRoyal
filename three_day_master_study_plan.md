# 🚀 eRoyal — 3-Day Master Study Plan (Interview Edition)

> **Goal:** Complete mastery of project logic, architecture, and customization for your interview in 3 days.

---

## 📅 DAY 1: Architecture, Backend & Connections
*Focus: How does the app talk to Google? How does it know who is logged in?*

### 1. The Connection Bridge (`firebaseConfig.ts`)
**Concept:** This is the "Heart" of the app. It connects your code to Google Firebase.
**Code Preview:**
```typescript
// Imports the specific tools we need from Firebase
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Credentials are kept in .env for security
const firebaseConfig = {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    // ... other keys
};

// Start the engine
const app = initializeApp(firebaseConfig);

// Export instances to be used in every other file
export const auth = getAuth(app);      // For Login/Logout
export const db = getFirestore(app);   // For Database
```
**Teacher Q&A:** "How does your app connect to the database?"
*Answer:* "We use `initializeApp` with config credentials stored in an `.env` file. We then export `auth` and `db` instances used by the rest of the app."

---

### 2. Global State & Roles (`AuthContext.tsx`)
**Concept:** Handles "Who am I?".
**Code Preview:**
```typescript
// This listener runs every time the app starts or user logs in
useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (user) {
            // 1. We found a logged in user
            setCurrentUser(user);
            // 2. Fetch their CUSTOM PROFILE from Firestore
            const profile = await fetchUserProfile(user.uid);
            setUserProfile(profile);
            setUserRole(profile?.role);
        }
    });
    return unsubscribe;
}, []);
```
**Teacher Q&A:** "What is the difference between Firebase User and your Profile?"
*Answer:* "Firebase User (from `auth`) only has `email` and `uid`. Our `userProfile` (from `db`) stores custom data like `role` (Admin/Resident) and `houseNo`."

---

### 3. Real-Time Data Flow (`AppDataContext.tsx`)
**Concept:** The "Live Feed" logic.
**Code Preview:**
```typescript
// Setup a live listener for this resident's bills
const billsQ = query(
    collection(db, 'bills'),
    where('residentId', '==', uid) // Only show MY bills
);

// onSnapshot means "Keep this connection open"
onSnapshot(billsQ, (snap) => {
    const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setBills(data); // Screen updates INSTANTLY when this changes
});
```
**Teacher Q&A:** "How do you achieve real-time updates?"
*Answer:* "We use Firestore's `onSnapshot` listeners inside a React Context. This keeps a live connection open and updates the app's state whenever the database changes without needing a refresh."

---

## 📅 DAY 2: Feature Logic & AI Integration
*Focus: How do the specific features work? How does the "Math" happen?*

### 1. The Billing Engine (`MonthlyBillingService.ts`)
**Concept:** Automating society management.
**Code Preview:**
```typescript
export const generateMonthlyBills = async (month, baseCharges) => {
    const batch = writeBatch(db); // Group all writes together

    // Loop through all residents
    residents.forEach(resident => {
        let total = baseCharges;
        
        // ADD LATE FEES: If they have unpaid old bills, add 10%
        if (previousUnpaid) {
            total += (previousAmount * 0.10); 
        }

        const billRef = doc(collection(db, 'bills'));
        batch.set(billRef, { residentId, month, amount: total, status: 'Unpaid' });
    });

    await batch.commit(); // Save everything at once (Atomic)
};
```
**Teacher Q&A:** "What happens if a resident doesn't pay last month's bill?"
*Answer:* "The `generateMonthlyBills` function calculates `previousDues` and applies a 10% penalty, adding it to the new bill's breakdown automatically."

---

### 2. AI Chatbot (`geminiService.ts`)
**Concept:** Google Gemini integration with Prompt Engineering.
**Code Preview:**
```typescript
const SYSTEM_PROMPT = `You are "eRoyal Assistant". 
You only help residents with housing society rules, bills, and complaints.
If asked about cooking or coding, say: "I am only here for housing queries."`;

const model = genAI.getGenerativeModel({ 
    model: 'gemini-1.5-flash',
    systemInstruction: SYSTEM_PROMPT // This is the "Job Description"
});
```
**Teacher Q&A:** "How did you limit the AI to only talk about your app?"
*Answer:* "We used **Prompt Engineering**. We provided a strict `SYSTEM_PROMPT` during initialization that defines the AI's persona, knowledge base, and restrictions."

---

### 3. Image Handling (`FirebaseStorageService.ts`)
**Concept:** Storing photos for complaints or bills.
**Code Preview:**
```typescript
// 1. Convert local phone path to Binary data
const blob = await uriToBlob(imageUri);

// 2. Upload to Google Storage
const storageRef = ref(storage, `complaints/${id}`);
await uploadBytes(storageRef, blob);

// 4. Save that LINK in Firestore
await updateDoc(doc(db, 'complaints', id), { photoUrl: downloadUrl });
```
**Teacher Q&A:** "Do you store images in the database?"
*Answer:* "No. We store the actual image in **Firebase Storage** (files) and only save the **HTTPS URL link** in Firestore (text). This keeps the database fast and light."

---

## 📅 DAY 3: UI, Customization & Defense
*Focus: How do I change how it looks? How do I defend the routing?*

### 1. Changing Colors & Themes (`constants/designSystem.ts`)
**Concept:** Centralized Design Control.
**Code Preview:**
```typescript
export const Colors = {
    primary: {
        500: '#14B8A6', // Current Teal color
        600: '#0D9488', // Main Theme Color
    },
    // To change to Blue, I just change these hex codes once!
};
```
**Teacher Q&A:** "If I want to change the app's primary color to Blue, how many files would you edit?"
*Answer:* "Just one. We use a centralized **Design System** in `designSystem.ts`. Changing the primary hex code there updates every screen in the app instantly."

---

### 2. Routing & Guards (`app/_layout.tsx`)
**Concept:** Folder-based routing and Security.
**Code Preview:**
```typescript
useEffect(() => {
    const inAdminGroup = segments[0] === '(admin)';
    
    // If you are NOT an admin but trying to enter admin folder...
    if (userRole !== 'admin' && inAdminGroup) {
        // ... KICK THEM OUT!
        router.replace('/(resident)/home');
    }
}, [userRole, segments]);
```
**Teacher Q&A:** "How do you prevent a Resident from accessing Admin screens?"
*Answer:* "We use a **Route Guard** in the root layout. It monitors the current route segment and the user's role; if they don't match, it uses `router.replace` to redirect them to their authorized dashboard."

---

### 3. Final Deployment (EAS)
**Concept:** Getting the app on a phone.
*   **EAS Build:** `eas build --platform android` -> Creates the APK.
*   **OTA Updates:** `eas update` -> Fixes bugs on users' phones without them needing to reinstall.

---

## 🏆 Final Defense Checklist
1.  **Frontend:** React Native + Expo (Cross-platform).
2.  **Language:** TypeScript (Type safety).
3.  **Backend:** Firebase (NoSQL Database + Storage + Auth).
4.  **AI:** Google Gemini (Generative AI).
5.  **State:** Context API (Global data sharing).
