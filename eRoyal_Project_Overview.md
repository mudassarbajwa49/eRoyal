# eRoyal Application: Code Logic & Workflow Overview

This document explains the step-by-step workflow of the application's core logic, showing exactly how the code executes from Firebase initialization through user login and dynamic screen routing.

---

## Workflow Step 1: Firebase Initialization
**File:** `firebaseConfig.ts`

Before any authentication can happen, the app initializes its connection to Firebase. 
- **The Logic:** The app reads environment variables (like `EXPO_PUBLIC_FIREBASE_API_KEY`) to keep secrets safe. It then initializes the core Firebase modules.
- **The Code Context:**
```typescript
// firebaseConfig.ts
const app = initializeApp(firebaseConfig);

// These exported instances are imported anywhere in the app that needs backend access
export const auth = getAuth(app);
export const db = getFirestore(app);
```
**Why it matters:** By exporting `auth` and `db`, any component or context in the app can directly interact with the Firebase backend without having to reconnect.

---

## Workflow Step 2: The Login Execution
**Files:** `app/(auth)/login.tsx` $\rightarrow$ `src/contexts/AuthContext.tsx`

When a user taps the "Login" button on the UI, it triggers the `login` function provided by the `AuthContext`.

**The Code Logic (Inside `AuthContext.tsx`):**
1. **Authenticate Identity:** The code first verifies the email and password with Firebase Authentication.
```typescript
const userCredential = await signInWithEmailAndPassword(auth, email, password);
const user = userCredential.user; // We get the UID here
```

2. **Fetch User Role & Profile:** Knowing *who* the user is isn't enough; the app needs to know *what* they are (Admin, Resident, Security). The code uses the `user.uid` to query the Firestore database (`db`).
```typescript
// It first checks the unified 'users' collection for speed
const userDoc = await getDoc(doc(db, 'users', uid));

if (userDoc.exists()) {
    const userData = userDoc.data() as User;
    return { ...userData, uid: userDoc.id };
}
```
*(If the user isn't found there, a fallback loop checks legacy collections like `residents` and `admins`.)*

3. **Update Global State:** Once the profile is fetched, the context updates its state variables (`setUserProfile`, `setUserRole`). This triggers React to re-render any component listening to the `AuthContext`.

---

## Workflow Step 3: Session Persistence
**File:** `src/contexts/AuthContext.tsx`

If the user closes the app and reopens it, we don't want them to log in again. 

**The Code Logic:**
An `useEffect` hook runs when the app starts, using Firebase's `onAuthStateChanged` listener. If a saved session exists, it automatically pulls the user profile again and restores the global state.
```typescript
useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (user) {
            // User is already logged in, fetch their role from Firestore
            const profile = await fetchUserProfile(user.uid);
            setUserProfile(profile);
            setUserRole(profile?.role || null);
        }
        setLoading(false); // Auth check is complete
    });
    return unsubscribe;
}, []);
```

---

## Workflow Step 4: Screen Routing & Gatekeeping
**File:** `app/_layout.tsx` (Specifically `RootLayoutNav`)

This is the most critical part of the logic. The `app/_layout.tsx` file wraps the entire application. It acts as a continuous "Gatekeeper", watching the global state (`currentUser` and `userRole`) and the current screen path (`segments`).

**The Code Logic:**
Inside a `useEffect`, the router runs a series of `if/else` checks every time the user's auth state changes or they try to navigate.

1. **Not Logged In?**
If there is no user and they aren't already in the `(auth)` screens, kick them to login.
```typescript
if (!currentUser && !inAuthGroup) {
    router.replace('/(auth)/login');
}
```

2. **Logged In? Redirect to the right Dashboard:**
If the user is logged in, look at their `userRole` and redirect them to their specific starting screen.
```typescript
if (inAuthGroup) { // If they are on the login screen but already logged in
    switch (userRole) {
        case 'admin':
            router.replace('/(admin)/dashboard');
            break;
        case 'resident':
            router.replace('/(resident)/home');
            break;
        case 'security':
            router.replace('/(security)/gate-entry');
            break;
    }
}
```

3. **Preventing Unauthorized Access:**
If an Admin tries to manually navigate to a Resident screen, the code catches that their role doesn't match the group (`inResidentGroup`) and boots them back.
```typescript
if (userRole === 'admin' && !inAdminGroup) {
    router.replace('/(admin)/dashboard'); // Force back to admin
} 
```

### **Summary of the Flow:**
`App Starts` $\rightarrow$ `firebaseConfig.ts connects to DB` $\rightarrow$ `_layout.tsx waits for AuthContext` $\rightarrow$ `AuthContext checks session` $\rightarrow$ `User Logs In` $\rightarrow$ `AuthContext fetches Role` $\rightarrow$ `_layout.tsx reads Role and routes to the correct dashboard.`
