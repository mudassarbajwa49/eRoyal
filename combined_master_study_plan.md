# 🎓 eRoyal — 3-Week FYP Presentation Study Plan (Comprehensive Guide)

> **Goal:** By the end of Week 3, you can confidently answer any question about your project.
> **Daily Time:** 45–60 minutes | **Platform:** YouTube + these notes

---

## 🗺️ Big Picture — What is eRoyal?

Before studying anything, understand this one sentence:

> **eRoyal is a mobile app for managing a housing society. It lets Admins manage residents, bills, complaints, and announcements. Residents can pay bills, file complaints, and use an AI chatbot. Security guards can log vehicle entries.**

### Your Tech Stack (Simple version)

| Technology | What it does in your project | Think of it like... |
|---|---|---|
| **React Native** | Builds the app screens (UI) | HTML + CSS but for mobile |
| **TypeScript** | The coding language used | Java but for web/mobile |
| **Expo** | Runs your React Native app easily | A launcher/wrapper |
| **Expo Router** | Moves between screens | `<a href>` but for mobile screens |
| **Firebase Auth** | Handles login/logout | Google's ready-made login system |
| **Firestore** | The database (stores all data) | Google's cloud database |
| **Firebase Storage** | Stores images/photos | Google Drive but for your app |
| **Gemini AI** | Powers the chatbot | ChatGPT but by Google, free |

---

# 📅 MASTER STUDY SCHEDULE: How to use your guides

Follow this exact sequence for learning everything over 3 weeks, spending 45-60 minutes daily.

---

## 📌 WEEK 1 Phase 1: Core Foundation (The First 4 Days)
*Stop worrying about your project's specific features for just a few days. You cannot defend the code if you don't know the core tools.*

* **Day 1: Read Guide 1 (first half).** Understand what Firebase Auth is and how we connect it (`firebaseConfig.ts`).
  * Watch YouTube: `"React Native in 100 seconds"`
  * Watch YouTube: `"Expo Router for beginners"`
* **Day 2: Read Guide 1 (second half) & Guide 2 (first half).** Understand how login screens (`login.tsx`) connect to routers (`index.tsx`).
* **Day 3: Read Guide 2 (Admin dashboard & routing).** Understand route groupings `(auth)`, `(admin)`, `(resident)` and how `router.replace` works.
* **Day 4: Ask yourself the Q&A questions from Guides 1 & 2 out loud.** If you cannot answer them out loud, re-read.

---

## 📌 WEEK 1 Phase 2: App Architecture (Days 5 to 7)

* **Day 5: Read Guide 3 (Data Contexts).** 
  * Watch YouTube: `"React Context API simple explanation"`
  * You MUST understand the difference between `getDocs` (run once) and `onSnapshot` (live listener). Teachers love asking about this.
* **Day 6: Re-read Guide 3 carefully.** Look specifically at `AppDataContext.tsx` in your code. Find where the "Bills" listener starts. 
* **Day 7: Review Week 1.** You should now be able to explain how a user logs in, how they are routed to their dashboard, and how their data appears on the screen in real-time.

---

## 📌 WEEK 2: Services and AI Integration (Days 8 to 14)

* **Day 8: Read Guide 5 (Services & Storage).** 
  * Watch YouTube: `"Firebase Storage React Native tutorial"`
  * Understand the difference between Firestore (database) and Storage (files).
* **Day 9: Images.** Learn the specific process of *URI* -> *Blob* -> *Firebase Storage* -> *URL* -> *Firestore Database*. This flow is in Guide 5.
* **Day 10: Read Guide 4 (Gemini Chatbot).**
  * Read `geminiService.ts` in your app. Understand what the SYSTEM PROMPT does.
* **Day 11: Application Architecture.** Go through the "Big Picture" sections in all guides. Understand the flow: UI components -> Contexts -> Services -> Firebase.
* **Day 12 & 13: Feature testing.** Open your app simulator. Try posting an announcement as an Admin, then immediately look at the Resident screen. See how fast it updates without refreshing. *Because of onSnapshot (Guide 3).*
* **Day 14: Answer Q&A from Guides 3, 4, 5 out loud.**

---

## 📌 WEEK 3: Presentation and Defense (Days 15 to 21)

* **Day 15 & 16: Explore other services on your own.** You have 15 service files. Apply the logic from Guide 5 (Services) to read through `MonthlyBillingService.ts` and `ComplaintManagementService.ts`. You will realize they all follow the same pattern: receive data from UI -> process it -> write to Firestore.
* **Day 17: Mock Presentation.** Spend 10 minutes explaining your app out loud to a mirror or a friend as if it was the panel. "Hi, my app is eRoyal..."
* **Day 18 & 19: The "Hard" Questions.** 
  * Focus heavily on the "Teacher Q&A" sections at the bottom of every guide.
  * Practice explaining WHY you chose certain tools. (Why Gemini? Free tier. Why React Native? Cross-platform single codebase. Why NoSQL Firebase? Real-time capabilities).
* **Day 20 & 21: Polish and Rest.** Just review your favorite parts of the architecture. Be confident. You own this code. 

**Pro Tip for the Panel Presentation:**
Teachers respect students who know their architecture. When they say "Show me the login code", don't just open the file. Instead say: *"The frontend UI is in `login.tsx`, which triggers our `AuthContext.tsx` to handle state, which communicates with Firebase Auth."* Show them you understand the layers!

---
---

# 📘 eRoyal Study Guide — Part 1: Firebase Setup & Login System

> **Read this first.** Everything in the app depends on Firebase and Login.

## 🔥 FILE: `firebaseConfig.ts` (Root of project)

**What this file does:** This is the connection bridge between your app and Google Firebase. Without this file, nothing works — no login, no database, no image storage.

```typescript
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';
import { getStorage } from 'firebase/storage';
```

### Line-by-line explanation:

| Line | What it does |
|---|---|
| `import { initializeApp }` | Imports the function that starts/connects Firebase |
| `import { getAuth }` | Imports the login/logout system |
| `import { getFirestore }` | Imports the database system |
| `import { getStorage }` | Imports the file/image storage system |
| `import { getFunctions }` | Imports cloud functions (server-side code) |

```typescript
export const firebaseConfig = {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};
```

**What is `process.env.EXPO_PUBLIC_...`?**
> These are **environment variables** — secret values stored in the `.env` file, NOT in the code. This is a security best practice. If you put your Firebase API key directly in code and push it to GitHub, anyone can steal it. The `.env` file is listed in `.gitignore` so it never gets uploaded.

```typescript
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);      // Used for login/logout
export const db = getFirestore(app);   // Used for all database operations
export const storage = getStorage(app); // Used for image uploads
export const functions = getFunctions(app); // Cloud functions
```

**Why `export`?** Because every other file in the app imports `auth`, `db`, or `storage` from here. It's like a shared toolbox.

### ❓ Teacher Q&A for this file:

**Q: Why are Firebase credentials in a .env file and not in the code?**
> Security. If credentials were in code, they'd be visible in Git history and anyone could misuse them. The `.env` file is local-only and listed in `.gitignore`.

**Q: What does `initializeApp(firebaseConfig)` do?**
> It registers your app with Google's Firebase servers using your project's configuration. After this, all Firebase services (auth, database, storage) are connected to YOUR specific Firebase project.

**Q: Why do you export `auth`, `db`, and `storage` separately?**
> Because different parts of the app need different services. `authService.ts` needs `auth`, `announcementService.ts` needs `db`, `FirebaseStorageService.ts` needs `storage`. Exporting them separately means each file only imports what it needs.

---

## 🔐 FILE: `app/(auth)/login.tsx`

**What this file does:** This is the login screen — the first thing any user sees. It handles email/password input, validates them, calls the login function, and navigates to the correct dashboard based on role.

### The state variables:
```typescript
const [email, setEmail] = useState('');        // stores what user types in email box
const [password, setPassword] = useState(''); // stores what user types in password box
const [loading, setLoading] = useState(false); // true = show spinner, false = show button
const [loginError, setLoginError] = useState(''); // stores error message to show on screen
const [errors, setErrors] = useState<{ email?: string; password?: string }>({}); // field-level errors
```

**What is `useState`?**
> It's React's way of remembering data in a component. When `setEmail` is called, the component re-renders (refreshes) automatically showing the new value. Think of it like a variable that, when changed, tells the screen to update itself.

### The validation function:
```typescript
const validateForm = (): boolean => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email.trim()) {
        newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
        newErrors.email = 'Email is invalid';  // basic email format check
    }

    if (!password) {
        newErrors.password = 'Password is required';
    } else if (password.length < 6) {
        newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0; // returns true if no errors
};
```

**What is `trim()`?** Removes spaces from start/end. So "  ali@gmail.com  " becomes "ali@gmail.com".
**What is the `!` before `email.trim()`?** It means "NOT". So `!email.trim()` means "if email is empty".
**What is the regex `/\S+@\S+\.\S+/`?** A pattern that checks email format — must have text, then `@`, then text, then `.`, then text.

### The login handler:
```typescript
const handleLogin = async () => {
    if (!validateForm()) return;  // stop if form has errors

    setLoading(true);   // show loading spinner
    setLoginError('');  // clear old errors

    const result = await login(email.trim(), password); // call AuthContext login function

    setLoading(false);  // hide spinner

    if (!result.success) {
        setLoginError(result.error || 'Invalid credentials');
        Alert.alert('Login Failed', result.error);
    } else {
        // Navigate based on role
        const role = result.data?.profile?.role?.toLowerCase();
        switch (role) {
            case 'admin':    router.replace('/(admin)/dashboard'); break;
            case 'resident': router.replace('/(resident)/home'); break;
            case 'security': router.replace('/(security)/gate-entry'); break;
        }
    }
};
```

**What is `async/await`?**
> Just like in Java, some operations take time (like calling Firebase over the internet). `async` marks a function that waits. `await` pauses execution until the operation is done. Without it, the code would continue before Firebase responds.

**What is `router.replace()`?**
> Expo Router's navigation function. `replace` means go to new screen AND remove login screen from history, so the user can't press back to return to login.

### The UI:
```typescript
return (
    <KeyboardAvoidingView behavior="padding">  // pushes content up when keyboard opens
        <ScrollView keyboardShouldPersistTaps="always">  // allows tapping when keyboard is open
            <View style={styles.content}>

                {/* Logo Section */}
                <Text style={styles.logo}>🏘️</Text>
                <Text style={styles.title}>eRoyal</Text>

                {/* Input Fields */}
                <Input label="Email" value={email} onChangeText={setEmail} />
                <Input label="Password" value={password} onChangeText={setPassword} secureTextEntry />

                {/* Login Button */}
                <Button title="Sign In" onPress={handleLogin} loading={loading} />

                {/* Error Banner (visible on web where Alert doesn't work well) */}
                {loginError ? <View style={styles.errorBanner}><Text>{loginError}</Text></View> : null}
            </View>
        </ScrollView>
    </KeyboardAvoidingView>
);
```

**What is `secureTextEntry`?** Makes the password field show dots (`•••`) instead of actual characters.
**What is `{loginError ? <View>...</View> : null}`?** This is JSX conditional rendering. "If loginError has text, show the red error box; otherwise show nothing." Same as an if-statement in Java.

### Styles:
```typescript
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F5F7FA' },
    // ...
    errorBanner: {
        backgroundColor: '#FEE2E2',   // light red background
        borderLeftWidth: 4,
        borderLeftColor: '#DC2626',   // dark red left border
        borderRadius: 8,
        padding: 12,
    }
});
```

**What is `StyleSheet.create()`?**
> React Native's equivalent of CSS. Instead of writing `style="color: red"` in HTML, you define styles here and reference them by name. `StyleSheet.create()` also optimizes performance by storing styles on the native side.

**What is `flex: 1`?** Tells the element to take up all available space — like `width: 100%; height: 100%` in CSS.

### ❓ Teacher Q&A for Login Screen:

**Q: How do you prevent the login form from submitting with empty fields?**
> The `validateForm()` function checks each field before calling Firebase. If any field fails, it sets an error state which shows below the input, and returns `false` to stop the login process.

**Q: What happens if someone enters wrong password 5 times?**
> Firebase automatically blocks the account temporarily and returns error code `auth/too-many-requests`. Our code catches this and shows the message: "Too many failed attempts. Please try again later."

**Q: How does the app know which screen to go to after login?**
> The result from `login()` contains the user's profile including their `role` field. A switch statement checks the role and uses `router.replace()` to navigate to the correct dashboard.

**Q: If I wanted to add a "Forgot Password" button, how would I do it?**
> Add a `TouchableOpacity` below the login button. On press, call `sendPasswordResetEmail(auth, email)` from Firebase — this sends a reset link to the user's email.

---

## 🧠 FILE: `src/contexts/AuthContext.tsx`

**What this file does:** This is the global "who is logged in?" manager. Every screen in the app can ask this context: "Who is the current user? What is their role?" without going to Firebase every time.

### Why a Context? (The problem it solves)
> Without Context, if `home.tsx` needs the user's name and `bills.tsx` also needs it, you'd have to pass the user data as props from screen to screen — very messy. With Context, you put the data in one place and any screen can read it directly.

### The state:
```typescript
const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
// currentUser = Firebase's own user object (has .uid, .email, etc.)

const [userProfile, setUserProfile] = useState<User | null>(null);
// userProfile = YOUR data from Firestore (has .name, .role, .houseNo, etc.)

const [userRole, setUserRole] = useState<UserRole | null>(null);
// userRole = 'admin' | 'resident' | 'security' — used for routing

const [loading, setLoading] = useState(true);
// loading = true while checking if user is already logged in (on app start)
```

### `fetchUserProfile()` function:
```typescript
const fetchUserProfile = async (uid: string): Promise<User | null> => {
    // First try: check 'users' collection (fastest — one read)
    const userDoc = await getDoc(doc(db, 'users', uid));

    if (userDoc.exists()) {
        return { ...userDoc.data() as User, uid: userDoc.id };
    }

    // Fallback: check role-specific collections (for old accounts)
    const roleCollections = ['residents', 'admins', 'security_staff'];
    for (const collectionName of roleCollections) {
        const roleDoc = await getDoc(doc(db, collectionName, uid));
        if (roleDoc.exists()) {
            return { ...roleDoc.data() as User, uid: roleDoc.id };
        }
    }
    return null; // user not found
};
```

**Q: Why does it check two places?**
> When the app was first built, users were stored in separate collections (`residents`, `admins`, `security_staff`). Later, a unified `users` collection was added for efficiency. The fallback handles old accounts created before this change.

**What is `doc(db, 'users', uid)`?** Creates a reference to a specific document: database → `users` collection → document with ID = uid.
**What is `getDoc()`?** Fetches that specific document from Firestore. Returns once (not real-time).
**What is `.exists()`?** Returns `true` if the document was found, `false` if it doesn't exist.
**What is `{ ...userDoc.data(), uid: userDoc.id }`?** Spread operator — copies all fields from the document, then adds/overwrites the `uid` field with the document's ID.

### `login()` function:
```typescript
const login = async (email: string, password: string): Promise<ApiResponse> => {
    // Step 1: Authenticate with Firebase
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user; // Firebase user object

    // Step 2: Get their Firestore profile
    const profile = await fetchUserProfile(user.uid);

    if (!profile) {
        await signOut(auth); // sign out if no profile found
        return { success: false, error: 'User profile not found' };
    }

    // Step 3: Store in state so all screens can see it
    setUserProfile(profile);
    setUserRole(profile.role);
    profileLoadedRef.current = true; // flag to skip re-fetch in onAuthStateChanged

    return { success: true, data: { user, profile } };
};
```

### `onAuthStateChanged` listener:
```typescript
useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
        setCurrentUser(user);

        if (user) {
            // App restarted — user was already logged in
            if (profileLoadedRef.current) {
                // login() already loaded profile, skip re-fetch
                profileLoadedRef.current = false;
                setLoading(false);
                return;
            }
            // Resume session: fetch profile again
            const profile = await fetchUserProfile(user.uid);
            setUserProfile(profile);
            setUserRole(profile?.role || null);
        } else {
            // Logged out
            setUserProfile(null);
            setUserRole(null);
        }
        setLoading(false);
    });

    return unsubscribe; // cleanup when component unmounts
}, []);
```

**What is `onAuthStateChanged`?** A Firebase listener that fires automatically whenever login state changes — user logs in, logs out, or when app restarts with an existing session. It's how the app knows "is someone still logged in?" when you reopen the app.

**What is `useEffect(() => {...}, [])`?** Runs once when the component first mounts (like a constructor). The empty `[]` means "run only once, not on every re-render."

**What is `return unsubscribe`?** When the component is destroyed, this stops the Firebase listener to prevent memory leaks.

### ❓ Teacher Q&A for AuthContext:

**Q: What is the difference between `currentUser` and `userProfile`?**
> `currentUser` is Firebase's built-in user object — it only has basic info like `uid` and `email`. `userProfile` is your custom data from Firestore — it has `name`, `role`, `houseNo`, and everything else you need.

**Q: What happens when the user closes the app and reopens it? Are they still logged in?**
> Yes. Firebase Auth automatically persists the session. When the app starts, `onAuthStateChanged` fires with the stored user. The code then fetches their Firestore profile and they're seamlessly logged back in without re-entering credentials.

**Q: How do you log out?**
> Call `signOut(auth)` from Firebase, then clear the state: `setUserProfile(null)`, `setUserRole(null)`, `setCurrentUser(null)`. The `onAuthStateChanged` listener fires with `null`, which triggers the redirect to login.

---

## 🔧 FILE: `src/services/authService.ts`

**What this file does:** Handles account CREATION by the admin. Login is handled in AuthContext — this file is only for when an admin creates a new resident, admin, or security account.

### The key trick — Secondary App:
```typescript
const appName = `TempApp-${Date.now()}`;
secondaryApp = initializeApp(firebaseConfig, appName);

const secondaryAuth = initializeAuth(secondaryApp, {
    persistence: inMemoryPersistence  // no local storage — lives only in memory
});

const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
```

**Q: Why create a secondary Firebase app instance?**
> When you call `createUserWithEmailAndPassword`, Firebase Auth AUTOMATICALLY signs in as the new user. This would log the admin out! To prevent this, we create a completely separate Firebase app instance just for account creation. The new user is created in this temporary instance, which is then deleted. The admin stays logged in.

### Batch Write:
```typescript
const batch = writeBatch(db);

batch.set(doc(db, collectionName, user.uid), userProfileData); // e.g., 'residents' collection
batch.set(doc(db, 'users', user.uid), userProfileData);        // also in 'users' collection

await batch.commit(); // both writes happen together, or neither does
```

**What is a batch write?**
> A Firestore batch lets you group multiple write operations that all succeed or all fail together (atomic). If the internet cuts out after writing to `residents` but before writing to `users`, the batch would roll back both — preventing inconsistent data. Same concept as a database transaction in SQL.

### ❓ Teacher Q&A:

**Q: Why is a user saved to TWO collections in Firestore?**
> For backward compatibility and efficiency. The main `users` collection allows fast lookup by UID (one read). The role-specific collection (`residents`, `admins`, `security_staff`) allows querying all residents/admins without filtering.

**Q: What stops an admin from being logged out when they create a new account?**
> We create a temporary secondary Firebase app instance with `inMemoryPersistence`, create the account in that isolated instance, then delete it. The main app's auth state is completely untouched.

---
---

# 📘 eRoyal Study Guide — Part 2: Navigation & Routing

## 🗺️ How Navigation Works in eRoyal — Big Picture

In normal web apps, you type a URL like `/admin/dashboard` and the browser loads a page.
Expo Router works **the same way** — but using the **folder/file structure** of your project.

```
app/
├── index.tsx              → Route: /           (entry point)
├── _layout.tsx            → Wraps ALL screens  (root layout)
├── (auth)/
│   ├── _layout.tsx        → Layout for auth screens
│   └── login.tsx          → Route: /(auth)/login
├── (admin)/
│   ├── _layout.tsx        → Layout for admin screens
│   ├── dashboard.tsx      → Route: /(admin)/dashboard
│   ├── bills/
│   │   └── index.tsx      → Route: /(admin)/bills
│   ├── complaints/
│   ├── users/
│   ├── marketplace/
│   ├── vehicles/
│   └── announcements/
├── (resident)/
│   ├── _layout.tsx
│   ├── home.tsx           → Route: /(resident)/home
│   ├── chatbot.tsx        → Route: /(resident)/chatbot
│   ├── bills/
│   ├── complaints/
│   ├── vehicles/
│   └── marketplace/
└── (security)/
    ├── _layout.tsx
    └── gate-entry.tsx     → Route: /(security)/gate-entry
```

**What do the parentheses `(admin)` mean?**
> In Expo Router, a folder name in parentheses is a **route group**. It groups screens together without affecting the URL. The `(admin)` folder organizes all admin screens but doesn't add "admin" to the navigation path.

---

## 🌳 FILE: `app/_layout.tsx` — The Root Layout

**What this file does:** This is the first component that wraps the ENTIRE app. It:
1. Wraps everything in `AuthProvider` and `AppDataProvider` (so all screens can access auth and data)
2. Contains the route guard — checks login status and redirects accordingly

### The Providers:
```typescript
export default function RootLayout() {
    return (
        <AuthProvider>          {/* Makes AuthContext available to all screens */}
            <AppDataProvider>   {/* Makes AppDataContext available to all screens */}
                <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
                    <RootLayoutNav />   {/* The actual navigator with route guard */}
                    <StatusBar style="auto" />
                </ThemeProvider>
            </AppDataProvider>
        </AuthProvider>
    );
}
```

**Why wrap in providers?**
> Think of providers like gift wrapping. The inner component (`RootLayoutNav`) can unwrap and use whatever the provider gives. `AuthProvider` gives access to `useAuth()`. `AppDataProvider` gives access to `useAppData()`. Every screen inside them can call these hooks anytime.

### The Route Guard — `RootLayoutNav()`:
```typescript
function RootLayoutNav() {
    const { currentUser, userRole, loading } = useAuth();
    const segments = useSegments();  // tells us what route we're currently on
    const router = useRouter();      // lets us navigate to other screens

    useEffect(() => {
        if (loading) return;  // Wait until auth state is determined

        const inAuthGroup = segments[0] === '(auth)';      // are we on a login screen?
        const inAdminGroup = segments[0] === '(admin)';    // are we on an admin screen?
        const inResidentGroup = segments[0] === '(resident)'; 
        const inSecurityGroup = segments[0] === '(security)';

        if (!currentUser && !inAuthGroup) {
            // NOT logged in and NOT on login screen → go to login
            router.replace('/(auth)/login');

        } else if (currentUser && userRole) {
            if (inAuthGroup) {
                // Logged in but still on login screen → go to dashboard
                switch (userRole) {
                    case 'admin':    router.replace('/(admin)/dashboard'); break;
                    case 'resident': router.replace('/(resident)/home'); break;
                    case 'security': router.replace('/(security)/gate-entry'); break;
                }
            } else {
                // Logged in but on wrong role's screens → redirect to correct one
                if (userRole === 'admin' && !inAdminGroup)
                    router.replace('/(admin)/dashboard');
                else if (userRole === 'resident' && !inResidentGroup)
                    router.replace('/(resident)/home');
                else if (userRole === 'security' && !inSecurityGroup)
                    router.replace('/(security)/gate-entry');
            }
        }
    }, [currentUser, userRole, loading, segments]);

    if (loading) return <LoadingSpinner message="Loading eRoyal..." />;

    return (
        <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(admin)" />
            <Stack.Screen name="(resident)" />
            <Stack.Screen name="(security)" />
        </Stack>
    );
}
```

**What is `useSegments()`?**
> Returns the current URL path as an array. If you're on `/(admin)/dashboard`, `segments` = `['(admin)', 'dashboard']`. So `segments[0]` tells you which group you're in.

**What is `useEffect` with dependencies `[currentUser, userRole, loading, segments]`?**
> This code runs every time any of those values change. If `userRole` changes (because user just logged in), the effect re-runs and redirects accordingly.

**What is `<Stack>`?**
> A navigator that stacks screens on top of each other — like a deck of cards. When you navigate to a new screen it slides in from the right (because of `animation: 'slide_from_right'`). Going back removes the top card.

**What is `headerShown: false`?**
> By default, Expo Router shows a top navigation bar with a back button. We set this to `false` because we build our own custom headers inside each screen.

### ❓ Teacher Q&A:

**Q: How does the app prevent a resident from accessing admin screens?**
> Two layers:
> 1. **Frontend guard in `_layout.tsx`**: The `useEffect` checks if the user's role matches the current screen group. If a resident somehow ends up on an admin route, they're immediately redirected to `/(resident)/home`.
> 2. **Backend guard in Firestore Rules**: Even if the frontend redirect fails, Firestore security rules reject any database queries that the user's role isn't authorized for.

**Q: What is `router.replace()` vs `router.push()`?**
> - `router.push()` — adds screen to history stack (user can press Back to return)
> - `router.replace()` — replaces current screen (no back button). Used for login → dashboard so user can't go "back" to login screen.

---

## 📱 FILE: `app/index.tsx` — Entry Point

```typescript
export default function Index() {
    const { currentUser, userRole, loading } = useAuth();

    if (loading) return <LoadingSpinner message="Loading eRoyal..." />;

    if (currentUser && userRole) {
        switch (userRole) {
            case 'admin':    return <Redirect href="/(admin)/dashboard" />;
            case 'resident': return <Redirect href="/(resident)/home" />;
            case 'security': return <Redirect href="/(security)/gate-entry" />;
        }
    }

    return <Redirect href="/(auth)/login" />;
}
```

**What this does:** When the app opens at `/` (root), immediately redirect to the right place based on login status. This file itself never shows any UI — it just redirects.

**What is `<Redirect>`?** A component that instantly navigates to the given route when rendered.

---

## 📊 FILE: `app/(admin)/dashboard.tsx` — Admin Dashboard

**What this file does:** The main screen an admin sees after login. Shows live statistics (pending bills, open complaints, pending listings) and a grid of navigation buttons.

### Imports and data:
```typescript
import { useAdminData } from '../../src/contexts/AdminDataContext';
import { useAuth } from '../../src/contexts/AuthContext';

export default function AdminDashboard() {
    const { userProfile } = useAuth();          // get admin name
    const { bills, complaints, pendingListings } = useAdminData(); // get live data

    // Calculate stats from the data — no extra Firebase reads
    const stats = useMemo(() => ({
        pendingBills: bills.filter(b => b.status === 'Unpaid').length,
        pendingComplaints: complaints.filter(c => c.status === 'Pending').length,
        pendingListings: pendingListings.length,
    }), [bills, complaints, pendingListings]);
```

**What is `useMemo()`?**
> An optimization. The calculation inside runs ONLY when `bills`, `complaints`, or `pendingListings` change. Without `useMemo`, it would recalculate every time the screen re-renders for any reason (e.g., scrolling), which wastes processing power.

**Why is data from `useAdminData()` instead of fetching from Firebase directly?**
> `AdminDataContext` sets up real-time listeners when the admin logs in. The dashboard just reads already-loaded data — zero Firebase reads. This makes the dashboard instant to open.

### Menu items:
```typescript
const menuItems = [
    {
        title: 'User Management',
        icon: '👥',
        description: 'Create and manage user accounts',
        route: '/(admin)/users',
        color: '#007AFF'
    },
    {
        title: 'Bills Management',
        icon: '💰',
        route: '/(admin)/bills',
        color: '#34C759',
        badge: stats.pendingBills > 0 ? stats.pendingBills : undefined
        // badge = number shown on top-right of card (like notification badge)
    },
    // ... more items
];
```

**What is `badge: stats.pendingBills > 0 ? stats.pendingBills : undefined`?**
> Ternary operator (shorthand if-else). "If pending bills > 0, show the number as a badge. Otherwise, don't show a badge." This is how the red "3" notification bubbles appear on the menu cards.

### Rendering the menu:
```typescript
{menuItems.map((item, index) => (
    <TouchableOpacity
        key={index}
        onPress={() => router.push(item.route as any)}
        activeOpacity={0.7}
    >
        <Card>
            <Text>{item.icon}</Text>
            <Text>{item.title}</Text>
            {item.badge !== undefined && (
                <View style={styles.badge}>
                    <Text style={styles.badgeText}>{item.badge}</Text>
                </View>
            )}
        </Card>
    </TouchableOpacity>
))}
```

**What is `.map()`?**
> Array method that transforms each item into a UI element. Like a for-loop that builds HTML. For each item in `menuItems`, it creates a `TouchableOpacity` card.

**What is `key={index}`?**
> React requires a unique key for each item in a list so it can efficiently update only the changed items. Using the array index as key works fine for static lists.

**What is `activeOpacity={0.7}`?**
> When the user taps the button, it dims to 70% opacity — giving visual feedback that it was pressed.

**What is `{item.badge !== undefined && <View>...</View>}`?**
> Short-circuit rendering. "If badge is defined (not undefined), render the badge View." The `&&` operator means "only render the right side if the left side is truthy."

### ❓ Teacher Q&A for Admin Dashboard:

**Q: How are the statistics on the dashboard kept up to date in real time?**
> `AdminDataContext` uses Firestore `onSnapshot` listeners. When any bill is paid in the database, Firestore pushes the update to the app automatically. `useMemo` recalculates stats instantly, and the dashboard updates without any user action.

**Q: If you wanted to add a new menu item, say "Events", how would you do it?**
> Add a new object to the `menuItems` array:
> ```typescript
> {
>     title: 'Events',
>     icon: '📅',
>     description: 'Manage society events',
>     route: '/(admin)/events',
>     color: '#FF6B6B'
> }
> ```
> Then create the file `app/(admin)/events/index.tsx`.

**Q: What is the difference between `TouchableOpacity` and `Button`?**
> `TouchableOpacity` wraps any content (text, images, cards) and makes it pressable with an opacity effect. `Button` is a simple pre-built button with limited styling. `TouchableOpacity` gives much more design control.

---

## 🏠 FILE: `app/(resident)/home.tsx` — Resident Home Screen

**What this file does:** The resident's home screen. Shows greeting, quick status cards (pending bills, complaints), and a navigation menu.

### Key parts:
```typescript
const { userProfile } = useAuth();
const { bills, complaints } = useAppData(); // real-time data from context

// Calculate counts from context data
const unpaidBills = useMemo(
    () => bills.filter(b => b.status === 'Unpaid').length,
    [bills]
);
const pendingComplaints = useMemo(
    () => complaints.filter(c => c.status === 'Pending' || c.status === 'In Progress').length,
    [complaints]
);
```

### Greeting function:
```typescript
function getGreeting(): string {
    const hour = new Date().getHours();   // get current hour (0-23)
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
}
```

**This is called:** `{getGreeting()} 👋` in the JSX — shows "Good Morning 👋" or "Good Evening 👋" based on time.

### Pull-to-refresh:
```typescript
const onRefresh = async () => {
    setRefreshing(true);
    // AppDataContext listeners auto-update — just reset visual state
    setTimeout(() => setRefreshing(false), 500);
};
```

**Why does refresh not actually fetch data?**
> Because `AppDataContext` uses real-time `onSnapshot` listeners — data is always current. The pull-to-refresh is just a visual gesture for the user. After 500ms, the spinner stops.

### ❓ Teacher Q&A:

**Q: How does the resident home screen show the correct name and house number?**
> From `userProfile` which comes from `useAuth()`. When the user logged in, their Firestore profile was fetched and stored in AuthContext. It contains `name` and `houseNo` fields, which are displayed directly.

**Q: If a bill is paid by a resident, when does the "Pending Bills" counter update?**
> Immediately and automatically. When the admin marks the bill as paid in Firestore, the `onSnapshot` listener in `AppDataContext` fires. `bills` state updates, `useMemo` recalculates `unpaidBills`, and the counter changes on the home screen — all without the resident refreshing.

---
---

# 📘 eRoyal Study Guide — Part 3 (DETAILED): Data Contexts & Real-time Listeners

## 🧠 Concept First: The Problem These Contexts Solve

Before contexts existed in the project, every screen did this when it opened:
```
Screen opens → Ask Firebase for data → Wait 300–800ms → Show data
Screen opens again → Ask Firebase AGAIN → Wait again → Show data
```

This was **slow and wasteful**. Every navigation caused a new Firebase read.

**The solution:** Set up ONE live connection when the user logs in. Keep data in memory. Every screen reads from memory instantly.

```
User logs in → Contexts start ONE listener each 
                       ↓
           Data arrives from Firebase instantly
                       ↓
         Bills screen opens → reads from memory ✅ (0ms)
         Home screen opens  → reads from memory ✅ (0ms)
         Bills screen opens → reads from memory ✅ (0ms, no new Firebase call)
```

This is called the **Context + onSnapshot pattern**.

---

## 🔑 Key Concepts Before Reading the Code

### What is React Context?
Think of it like a **global variable** that any component (screen) in the app can read without passing it as a prop.

**Without Context (messy):**
```
App → _layout → (admin) → dashboard → bills → BillCard
                                      ↑
                   Had to pass 'bills' data as props through every level
```

**With Context (clean):**
```
AdminDataContext holds 'bills'
         ↓
BillCard simply calls: const { bills } = useAdminData();  ✅
```

### What is `onSnapshot`?
It's a **live listener** from Firestore. Normal `getDocs()` fetches data once. `onSnapshot` stays connected and fires again every time data changes.

```typescript
// getDocs: one-time fetch
const snap = await getDocs(query);
// snap is a snapshot of now — stale if data changes later

// onSnapshot: live connection
const unsubscribe = onSnapshot(query, (snap) => {
    // This runs immediately, AND every time data changes
    // snap is always fresh
});
```

---

## 📱 FILE: `src/contexts/AppDataContext.tsx`

**Used by:** Resident role only  
**Covers:** Bills, Vehicles, Vehicle Logs, Marketplace Listings, Announcements, Complaints

### The AppData Interface:
```typescript
interface AppData {
    bills: Bill[];              // This resident's bills (Unpaid/Paid, not Draft)
    vehicles: RegisteredVehicle[]; // This resident's registered vehicles
    vehicleLogs: VehicleLog[];  // Entry/exit history for this resident's vehicles
    approvedListings: Listing[]; // All marketplace listings approved for public view
    myListings: Listing[];      // Only THIS resident's own listings (all statuses)
    announcements: Announcement[]; // All society announcements (newest first)
    complaints: Complaint[];    // Only THIS resident's filed complaints
    initializing: boolean;      // true = data not yet loaded (show spinner)
}
```

**Why is `initializing` needed?**
> When the app first starts listening, there is a brief moment before the first data arrives from Firebase. During this time, showing an empty list would be confusing. `initializing: true` lets screens show a loading spinner until ALL 6 listeners have fired at least once.

### Provider Setup and Role Check:
```typescript
export function AppDataProvider({ children }) {
    const { userProfile } = useAuth();
    const uid = userProfile?.uid;   // logged-in user's Firebase UID
    const role = userProfile?.role;

    // IMPORTANT: Only activate listeners for residents, NOT admins
    const isResident = role?.toLowerCase() === 'resident';
```

**Why `role?.toLowerCase()`?**
> The `?.` is called "optional chaining". If `role` is `null` (not loaded yet), this won't crash — it just returns `undefined`. The `.toLowerCase()` handles cases where the database stored 'Resident' (capital R) instead of 'resident'. This is a safety net for inconsistent data.

### Ready Counter — Knowing when all data is loaded:
```typescript
const readyCount = useRef(0);       // tracks how many listeners have fired
const TOTAL_LISTENERS = 6;          // bills, vehicles, logs, listings x2, announcements, complaints

const markReady = () => {
    readyCount.current += 1;
    if (readyCount.current >= TOTAL_LISTENERS) {
        setInitializing(false);     // ALL data loaded — stop showing spinner
    }
};
```

**What is `useRef`?**
> Like a variable that persists between renders but does NOT cause a re-render when it changes. We use it here as a counter. If we used `useState` for the counter, every increment would re-render the entire app.

### Listener 1 — Bills:
```typescript
const billsQ = query(
    collection(db, 'bills'),
    where('residentId', '==', uid)   // ← CRITICAL: only this resident's bills
);

onSnapshot(billsQ, (snap) => {
    const all = snap.docs.map(d => ({ id: d.id, ...d.data() } as Bill));

    // Filter out:
    // - 'Draft' bills (not yet sent by admin — resident shouldn't see)
    // - archived bills (already paid and hidden)
    const filtered = all.filter(b => b.status !== 'Draft' && !b.isArchived);

    // Sort newest first (by createdAt timestamp)
    filtered.sort((a: any, b: any) => {
        const ta = a.createdAt?.toMillis?.() ?? 0;  // convert Firestore Timestamp → number
        const tb = b.createdAt?.toMillis?.() ?? 0;
        return tb - ta;  // descending: newer bills first
    });

    setBills(filtered);
    markReady();
});
```

**Why `.toMillis()`?**
> Firestore stores timestamps as `Timestamp` objects, not regular JS `Date`. `.toMillis()` converts it to a plain number (milliseconds since 1970), which makes comparison easy.

**Why `?? 0`?**
> The `??` is the "nullish coalescing" operator. If `a.createdAt?.toMillis?.()` is `null` or `undefined` (old documents without the field), use `0` instead. This prevents crashes on imperfect data.

**Why is sorting done in JavaScript instead of in the Firestore query?**
> In Firestore, using `where('residentId', '==', uid)` on one field AND `orderBy('createdAt', 'desc')` on a different field requires a **Composite Index** — a configuration in the database that must be manually created. We avoid this dependency by fetching all documents matching `residentId` and sorting client-side.

### Listener 2 — Registered Vehicles:
```typescript
const vehiclesQ = query(
    collection(db, 'registeredVehicles'),
    where('residentId', '==', uid)
);

onSnapshot(vehiclesQ, (snap) => {
    const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as RegisteredVehicle));
    list.sort((a: any, b: any) => b.createdAt?.toMillis?.() - a.createdAt?.toMillis?.() ?? 0);
    setVehicles(list);
    markReady();
});
```

### Listener 3 — Vehicle Logs:
The same pattern, but queries the `vehicleLogs` collection and sorts by `entryTime` (when the car entered the gate).

### Listeners 4a & 4b — Marketplace Listings:
This is the most complex listener because we need TWO separate things:
- **Approved listings**: All listings approved by admin that any resident can browse
- **My listings**: Only listings that THIS resident posted (can be Pending, Approved, Rejected, Sold)

```typescript
// Track when both sub-listeners are done (counts as 1 total listener)
let approvedDone = false;
let myDone = false;
const checkListingsDone = () => {
    if (approvedDone && myDone) markReady(); // only mark ready if BOTH fired
};

// 4a: ALL approved listings (for browsing)
onSnapshot(query(collection(db, 'listings'), where('status', '==', 'Approved')),
    (snap) => {
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as Listing));
        list.sort(...);     // newest first
        setApprovedListings(list);
        approvedDone = true;
        checkListingsDone();
    }
);

// 4b: All of THIS resident's own listings
onSnapshot(query(collection(db, 'listings'), where('postedBy', '==', uid)),
    (snap) => {
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as Listing));
        list.sort(...);
        setMyListings(list);
        myDone = true;
        checkListingsDone();
    }
);
```

**Why two separate listeners instead of one?**
> You cannot combine `where('status', '==', 'Approved')` OR `where('postedBy', '==', uid)` in a single Firestore query — Firestore doesn't support OR logic across different fields easily. Two separate listeners are the clean solution.

### Listener 5 — Announcements:
```typescript
const announcementsQ = query(
    collection(db, 'announcements'),
    orderBy('createdAt', 'desc')  // newest first
);

onSnapshot(announcementsQ, (snap) => {
    setAnnouncements(snap.docs.map(d => ({ id: d.id, ...d.data() } as Announcement)));
    markReady();
});
```

**Why can we use `orderBy` here without a composite index?**
> Because we are NOT combining it with a `where` clause. A single `orderBy` on one field does NOT require a composite index.

### Listener 6 — Complaints:
Same as bills — filtered by `residentId` and sorted client-side.

### Cleanup on Logout:
```typescript
return () => {
    unsubs.forEach(u => u());  // call each unsubscribe function
    isFirstUser.current = null;
};
```

**Why is cleanup important?**
> `onSnapshot` creates a persistent connection to Firebase servers. If you don't close it when the user logs out, Firebase keeps sending updates to a logged-out user — wasting data and potentially causing errors. Returning the cleanup function from `useEffect` ensures React runs it automatically when the component unmounts (user logs out or app closes).

### The `refresh()` function:
```typescript
const refresh = () => { };  // intentionally empty — does nothing
```

**Why is the refresh function empty?**
> Because `onSnapshot` automatically keeps data current, a manual refresh is unnecessary. However, some screens have pull-to-refresh UI gestures. Those screens call `refresh()` expecting it to update data. Since the listener already has the freshest data, `refresh()` does nothing — but the UI still shows the visual spinner briefly for a good user experience.

---

## 🏛️ FILE: `src/contexts/AdminDataContext.tsx`

**Used by:** Admin role only  
**Covers:** All bills, all complaints, all listings, latest 200 vehicle logs, all registered vehicles

The structure is identical to `AppDataContext` but instead of filtering by `residentId`, it fetches ALL documents.

### The Admin-Specific Key Difference:
```typescript
// Resident context: only THIS resident's bills
where('residentId', '==', uid)

// Admin context: ALL bills (no where clause — full table scan)
query(collection(db, 'bills'), orderBy('createdAt', 'desc'))
```

### Vehicle Logs with Limit:
```typescript
const logsQ = query(
    collection(db, 'vehicleLogs'),
    orderBy('entryTime', 'desc'),
    limit(200)          // ← only fetch the 200 most recent logs
);
```

**Why `limit(200)` for admin but no limit for residents?**
> Admins need to see society-wide logs — potentially thousands of entries. Fetching all of them would be very slow and expensive. 200 recent entries is enough for practical monitoring. Residents only have their own few vehicles, so capping is less critical.

### Deriving Listing Status Buckets with `useMemo`:
```typescript
// ONE listener fetches ALL listings into 'allListings'
// Then useMemo splits them into categories WITHOUT extra Firestore reads

const pendingListings = useMemo(
    () => allListings.filter(l => l.status === 'Pending'),
    [allListings]
);

const liveListings = useMemo(
    () => allListings.filter(l => l.status === 'Approved'),
    [allListings]
);

const rejectedListings = useMemo(
    () => allListings.filter(l => l.status === 'Rejected'),
    [allListings]
);

const inactiveListings = useMemo(
    () => allListings.filter(l => l.status === 'Sold' || l.status === 'Inactive'),
    [allListings]
);
```

**Why is this more efficient than 4 separate Firestore queries?**
> 4 Firestore queries = 4 round-trips to Google's servers = slower and costs 4x reads.  
> 1 Firestore query + 4 JavaScript filters = 1 round-trip + instant memory operations = much faster.

**What is `useMemo`?**
> It memorizes (caches) the result of an expensive calculation. The filter runs ONLY when `allListings` changes. Without `useMemo`, every single screen re-render (scrolling, typing, anything) would re-run all 4 filters — wasting CPU.

---

## ❓ Master Q&A For Data Contexts

**Q: What is the difference between `getDocs` and `onSnapshot`?**
> `getDocs` fetches data once and returns it. It's like taking a photo — it captures the moment. `onSnapshot` is like a live video feed — it keeps updating every time the data changes in Firebase. We use `onSnapshot` in contexts so every screen always has the most current data without any user action.

**Q: How does a screen get data from the context?**
> Any screen inside the `AppDataProvider` (which is every screen in the app) can call:
> ```typescript
> const { bills, complaints } = useAppData();
> ```
> This gives instant access to already-loaded, always-fresh data. No Firebase call needed.

**Q: What is the difference between `AppDataContext` and `AdminDataContext`?**
> `AppDataContext` is for residents — it listens only to data belonging to the logged-in resident (filtered by their uid). `AdminDataContext` is for admins — it listens to ALL data across the whole society.

**Q: Why do you have a separate context instead of just putting data in AuthContext?**
> `AuthContext` should only handle authentication (who is logged in). Mixing data fetching into it would violate the Single Responsibility Principle — a design rule where each piece of code does only one thing. Also, residents and admins need different data sets; separate contexts make this clean.

**Q: What happens to these listeners when the user logs out?**
> The `useEffect` cleanup function runs automatically. It calls `unsubscribe()` on every active listener, which tells Firebase to stop sending updates. This frees resources and prevents the app from receiving data after logout.

**Q: If two residents use the app at the same time and Resident A pays a bill, does Resident B's screen update?**
> No — and this is by design. Resident B's `onSnapshot` listener is filtered with `where('residentId', '==', uid)` where uid is Resident B's ID. Paying Resident A's bill changes a document with `residentId = A's uid`, which doesn't match Resident B's filter, so Resident B's listener never fires.

**Q: Could you explain `initializing` with a real example?**
> When the resident first logs in, the app starts 6 listeners. For a split second, ALL the arrays (bills, complaints, etc.) are empty `[]`. If a screen showed the bills immediately, it would flash "No bills found" before the data arrives. With `initializing: true`, the screen shows a loading spinner instead. After all 6 listeners have fired their first callback, `initializing` becomes `false` and the real data shows. This gives a professional "loading..." experience.

---
---

# 📘 eRoyal Study Guide — Part 4 (DETAILED): Gemini AI Chatbot

## 🤖 Concept First: How an AI API Works

An AI like Google Gemini doesn't run on your phone — it runs on Google's powerful servers. Your app talks to it over the internet:

```
User types: "How do I pay my bill?"
        ↓
Your app sends this text to Google's servers (API call)
        ↓
Google's AI reads it + all previous messages in the chat
        ↓
Google sends back a text response
        ↓
Your app shows it in the chat bubble
```

This is called a **REST API call** — your app sends a request and receives a response.

---

## 🧠 FILE: `src/services/geminiService.ts`

### The Singleton Pattern:
```typescript
class GeminiService {
    private genAI: GoogleGenerativeAI | null = null;
    private chatSession: ChatSession | null = null;
    private messageHistory: ChatMessage[] = [];
    // ...
}

// Export ONE shared instance
export const geminiService = new GeminiService();
```

**What is the Singleton Pattern?**
> We create ONE `GeminiService` object and export it. Every part of the app imports this same object. This is called a Singleton. Why? Because we need ONE shared `chatSession` and ONE `messageHistory`. If we created a new instance every time, the conversation would reset.

**In Java terms:** Think of it like a `static` object that is created once and shared by all classes.

### The API Key:
```typescript
const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';
const MODEL_NAME = 'gemini-2.5-flash';
```

**What is `EXPO_PUBLIC_`?**
> Expo has a rule: only environment variables that start with `EXPO_PUBLIC_` are included in the app bundle and accessible in React Native code. Other `.env` variables (without this prefix) are only available in server-side/build scripts for security. Since our API key needs to work inside the mobile app, it must have this prefix.

**What is `'gemini-2.5-flash'`?**
> This is Google's model name. "Flash" is optimized for **speed** (fast responses, low latency — perfect for a chat). "Pro" models are slower but more powerful for complex reasoning tasks.

### The System Prompt — Full Structure:
The system prompt is sent to Gemini BEFORE any user message. It shapes the AI's entire personality and limits.

```typescript
const SYSTEM_PROMPT = `You are "eRoyal Assistant"...

You can help residents with:
1. Society Rules & Regulations
   - Parking, noise, pets, visitors, construction
2. Bill & Payment Guidance
   - How bills work, due dates, late fees
3. Complaints & Maintenance
   - How to file, expected timelines, emergency procedures
4. Community Living Tips
5. Vehicle Management
6. Marketplace
7. App Navigation

Guidelines you MUST follow:
- Keep responses SHORT (max 2–3 paragraphs) — mobile-friendly
- Never ask for passwords or personal data
- If asked about specific bill AMOUNTS → say "check the Bills section in the app"
- If question is outside housing scope → "I'm here for housing society queries only"`;
```

**Why is the system prompt so important?**
> Without it, Gemini would answer ANY question (coding, cooking, history). With it, Gemini becomes a specialized housing assistant. This is called **prompt engineering** — crafting instructions that shape AI behavior.

### `initialize()` — Lazy Initialization:
```typescript
private initialize(): GoogleGenerativeAI {
    // Check API key first
    if (!GEMINI_API_KEY || GEMINI_API_KEY === 'paste_your_gemini_api_key_here') {
        throw new Error('Gemini API key not configured.');
    }

    // Only create client ONCE (Singleton for the client too)
    if (!this.genAI) {
        this.genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    }
    return this.genAI;
}
```

**What is "lazy initialization"?**
> Instead of creating `GoogleGenerativeAI` when the app starts (even if the chatbot is never used), we create it only when `sendMessage()` is first called. This saves startup time and memory.

### `startNewChat()` — Creating a Chat Session:
```typescript
startNewChat(): void {
    const genAI = this.initialize();

    // Get the specific AI model
    const model = genAI.getGenerativeModel({
        model: MODEL_NAME,           // 'gemini-2.5-flash'
        systemInstruction: SYSTEM_PROMPT,  // Personality/rules given to the AI
    });

    // Start the chat — like opening a new conversation window
    this.chatSession = model.startChat({
        history: [],    // Empty history = brand new conversation
        generationConfig: {
            maxOutputTokens: 1024,  // Limit response length (approx. 750 words max)
            temperature: 0.7,       // Creativity: 0=robotic, 1=random, 0.7=natural
            topP: 0.95,            // Controls word selection diversity
            topK: 40,              // Number of word candidates AI considers per step
        },
    });

    this.messageHistory = [];  // Reset local message history too
}
```

**What is `maxOutputTokens: 1024`?**
> A "token" is roughly a word or part of a word. 1024 tokens ≈ about 750-800 words. We limit this so responses are concise (short paragraphs — mobile-friendly) and don't use up free API quota too fast.

**What does `temperature: 0.7` really mean?**
> When the AI picks the next word, it considers many options with different probabilities. Temperature 0.0 always picks the single most probable word — very dull and repetitive. Temperature 1.0 picks randomly from all options — creative but unpredictable. 0.7 gives varied, natural-sounding responses while staying on-topic.

### `sendMessage()` — The Core Function:
```typescript
async sendMessage(userMessage: string): Promise<string> {
    try {
        // Auto-start session if not started
        if (!this.chatSession) {
            this.startNewChat();
        }

        // Build and store user's message locally
        const userMsg: ChatMessage = {
            id: `user_${Date.now()}`,   // unique ID from timestamp
            role: 'user',
            text: userMessage,
            timestamp: new Date(),
        };
        this.messageHistory.push(userMsg);

        // Send to Google Gemini — this is the actual API call
        const result = await this.chatSession!.sendMessage(userMessage);
        const responseText = result.response.text();

        // Store AI's response locally
        const aiMsg: ChatMessage = {
            id: `model_${Date.now()}`,
            role: 'model',
            text: responseText,
            timestamp: new Date(),
        };
        this.messageHistory.push(aiMsg);

        return responseText;
    } catch (error: any) {
        // ... error handling below
    }
}
```

**What is `this.chatSession!.sendMessage()`?**
> The `!` is TypeScript's "non-null assertion". We've already checked `if (!this.chatSession) this.startNewChat()`, so we know it exists here. The `!` tells TypeScript "trust me, this is not null at this point."

**How does Gemini remember the conversation?**
> The `chatSession` object (provided by Google's SDK) automatically keeps track of all previous messages sent in that session. When you call `chatSession.sendMessage("follow up question")`, internally it sends the ENTIRE conversation history to Google's servers so the AI understands context. We only need to call `sendMessage()` — the SDK handles the history accumulation.

### Error Handling:
```typescript
} catch (error: any) {
    const msg: string = error?.message || '';
    const status: number = error?.status || 0;

    // Error 1: Bad API key
    if (msg.includes('API_KEY_INVALID') || msg.includes('API key not valid')) {
        throw new Error('Invalid API key. Please check your Gemini API key in the .env file.');
    }
    
    // Error 2: Too many requests (free tier limit)
    if (status === 429 || msg.includes('RESOURCE_EXHAUSTED')) {
        throw new Error('Rate limit reached. Please wait a moment and try again.');
    }
    
    // Error 3: No internet
    if (msg.includes('Failed to fetch') || msg.includes('Network request failed')) {
        throw new Error('Network error. Please check your internet connection.');
    }
    
    // Error 4: Model not available
    if (msg.includes('not found') || msg.includes('404')) {
        throw new Error('AI model unavailable. Please try again later.');
    }

    throw new Error(`AI error: ${msg || 'Something went wrong.'}`);
}
```

**Why do we re-throw errors rather than returning an empty string?**
> The chatbot screen (`chatbot.tsx`) shows a specific error message to the resident. If `sendMessage()` just returned `''`, the screen couldn't tell WHY it failed. By throwing specific error objects, the UI can catch them and display the right message to the user.

### `clearChat()` — Reset:
```typescript
clearChat(): void {
    this.chatSession = null;     // Destroy the session → next message creates a fresh one
    this.messageHistory = [];    // Clear local history → chat UI shows empty
}
```

When does this get called? The chatbot screen has a "Clear Chat" button, and it also runs when the resident navigates away from the chatbot.

### The `ChatMessage` Interface:
```typescript
export interface ChatMessage {
    id: string;          // Unique identifier (used as React 'key' in the list)
    role: 'user' | 'model'; // Who sent this — resident or AI
    text: string;        // The actual message content
    timestamp: Date;     // When it was sent (for display)
}
```

**In Java terms:** This is like a `class ChatMessage { ... }` — it defines the shape of every message object.

---

## ❓ Master Q&A For Gemini Chatbot

**Q: How does the AI know it's a housing society assistant and not a general chatbot?**
> The `SYSTEM_PROMPT` constant. Before any user message, this invisible instruction set is sent to Gemini telling it: "You are eRoyal Assistant. Only help with housing society topics." The system prompt acts as the AI's "job description."

**Q: Why did you choose Google Gemini over OpenAI's ChatGPT?**
> Three reasons:
> 1. **Free tier**: Gemini's free tier allows enough API calls for a university project demo. OpenAI charges from the first call.
> 2. **Same ecosystem**: Our project uses Firebase (Google). Using Gemini keeps everything within Google's ecosystem.
> 3. **SDK quality**: Google provides an excellent JavaScript SDK that integrates cleanly with React Native and Expo.

**Q: Can the AI access a resident's actual Firestore data (like real bill amounts)?**
> No. The AI has NO database connection. It answers based on general knowledge + the system prompt instructions. If a resident asks "What is my bill amount?", the system prompt directs the AI to say "Please check the Bills section in the app." Giving the AI real database access (called "function calling") would require significant extra implementation.

**Q: The app uses `gemini-2.5-flash`. What does the model name mean?**
> Google Gemini has different versions. "2.5" is the generation number (newer = more capable). "Flash" means optimized for speed and low cost — suitable for chat. "Pro" is more powerful but slower and more expensive. For a chat app with short messages, "Flash" is the perfect choice.

**Q: What happens if the user sends 100 messages? Does the app crash?**
> Practically, no. The `maxOutputTokens: 1024` limits each RESPONSE. The chat SESSION can technically hold many messages. However, Google's free tier has a daily API quota (number of calls per day). If the limit is hit, the code catches the `RESOURCE_EXHAUSTED` error and shows a user-friendly "Rate limit reached" message.

**Q: If the user closes the chatbot screen and reopens it, does the conversation history stay?**
> Yes, as long as the app hasn't been closed. `geminiService` is a singleton — it stays in memory. The `messageHistory` array and `chatSession` persist between screen navigations. But if the app is fully closed and reopened, they reset (both `chatSession` and `messageHistory` start as `null`/`[]`).

**Q: How would you add a feature where the chatbot knows the resident's name?**
> Get the resident name from `AuthContext` (`userProfile.name`) and inject it into the first message or the system prompt dynamically:
> ```typescript
> const SYSTEM_PROMPT = `You are eRoyal Assistant. The resident you are helping is named ${residentName}.`;
> ```

---
---

# 📘 eRoyal Study Guide — Part 5 (DETAILED): All Services & Firebase Storage

## 🏗️ Concept: The Services Architecture

Your project follows a clean 3-layer pattern:

```
LAYER 1: UI Screens (.tsx files)
    → Shows data to the user, handles button presses
    → NEVER directly talks to Firebase
    
LAYER 2: Services (.ts files in src/services/)
    → Business logic — knows HOW to get, create, update, delete data
    → Talks to Firebase on behalf of the UI
    
LAYER 3: Firebase (Firestore + Storage)
    → The actual database and file storage on Google's servers
```

**Why this separation?**
> If Firebase changes its API tomorrow, you only fix the services, not 20 screens. If a business rule changes ("bills now have 15% late fee"), you only change `MonthlyBillingService.ts`, not every screen. This is called **Separation of Concerns** — a fundamental software engineering principle.

---

## 🖼️ FILE: `src/services/FirebaseStorageService.ts`

**Purpose:** Low-level image upload — converts local phone files to Firebase's format and uploads them.

### `uriToBlob(uri)`:
```typescript
export const uriToBlob = async (uri: string): Promise<Blob> => {
    const response = await fetch(uri);  // "download" the local file using its URI
    const blob = await response.blob(); // convert the file data to raw binary (Blob)
    return blob;
};
```

**What is a URI?**
> A URI (Uniform Resource Identifier) is a text string that points to a file location. On a phone, when a user picks an image, the app gets a string like `file:///data/user/0/com.erroyal/cache/picked_image.jpg`. This uri doesn't contain the image itself — it's just an address to where the image lives on the device.

**What is a Blob?**
> Blob = "Binary Large Object". It IS the actual raw bytes of the image file. Firebase Storage only accepts Blobs, not URIs. So we first "download" the file from the local URI using `fetch()`, then convert it to a Blob using `.blob()`.

**Is `fetch()` only for internet requests?**
> No! `fetch()` can also read local files on the device using a local URI as the address. In this case it reads the image from the phone's storage, not from the internet.

### `uploadImage(blob, folder)`:
```typescript
export const uploadImage = async (
    blob: Blob,
    folder: string = 'images'   // default folder name if not specified
): Promise<{ url: string; fileName: string }> => {
    try {
        // Create a unique path/filename using timestamp + random string
        // Example result: "announcements/1714000000000_abc123"
        const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).substring(7)}`;

        // Create a reference to where the file will sit in Firebase Storage
        const storageRef = ref(storage, fileName);

        // Upload: sends the binary Blob to Firebase Storage
        await uploadBytes(storageRef, blob);

        // Get the permanent public URL that can be stored in Firestore and displayed in <Image>
        const url = await getDownloadURL(storageRef);

        return { url, fileName };
    } catch (error) {
        logger.error('Error uploading image:', error);
        throw error;  // re-throw so the caller knows it failed
    }
};
```

**Why `Date.now() + Math.random()`?**
> To guarantee a unique filename. `Date.now()` gives the current time in milliseconds (e.g., `1714000123456`). `Math.random().toString(36).substring(7)` generates a random short string like `abc123`. Combined, the chance of two files having the same name is essentially zero — even if two users upload at the exact same millisecond.

**What is `ref(storage, fileName)`?**
> Creates a "pointer" to a location in Firebase Storage — like creating a new empty file. The file doesn't exist yet — you're just declaring where you WANT to put it.

**What is `getDownloadURL(storageRef)`?**
> After uploading, Firebase gives back a permanent HTTPS URL. Example:
> `https://firebasestorage.googleapis.com/v0/b/erroyal.appspot.com/o/announcements%2F123.jpg?alt=media&token=xxx`
> This URL can be stored in Firestore (as a string field) and used in an `<Image>` component to display the photo anywhere.

### Other Functions in `FirebaseStorageService.ts`:
- **`uploadImageFromUri(uri, folder)`**: Convenience function that combines `uriToBlob()` + `uploadImage()` into one call.
- **`uploadBillPaymentProof(uri, residentId, billId)`**: Uploads to `bills/residentId/billId_timestamp` — organized folder for payment proofs.
- **`uploadVehicleImage(uri, residentId, vehicleId)`**: Uploads to `vehicles/residentId/vehicleId_timestamp`.
- **`uploadComplaintImage(uri, residentId, complaintId, index)`**: Uploads to `complaints/residentId/complaintId_0_timestamp`.

---

## 📁 FILE: `src/services/imageService.ts`

**Purpose:** Extends `FirebaseStorageService` with multi-image upload and organized folder management.

### `STORAGE_FOLDERS` Constant:
```typescript
export const STORAGE_FOLDERS = {
    BILLS: 'bills',
    VEHICLES: 'vehicles',
    MARKETPLACE: 'marketplace',
    COMPLAINTS: 'complaints',
    ANNOUNCEMENTS: 'announcements',
    PROFILES: 'profiles'
} as const;
```

**Why a constants object instead of typing the folder names directly?**
> Prevents typos. If you type `'anouncements'` (missing one 'n') in 5 files, you'd have a bug. Using `STORAGE_FOLDERS.ANNOUNCEMENTS` means changing the folder name in one place updates everywhere. This is the **DRY Principle** — Don't Repeat Yourself.

**What does `as const` do?**
> Without it, TypeScript sees `BILLS` as type `string`. With `as const`, it sees it as the literal type `'bills'`. This means TypeScript will catch errors if you accidentally assign a wrong folder name.

### `uploadMultipleImages(imageUris, baseFolder, userId?, resourceId?)`:
```typescript
export const uploadMultipleImages = async (
    imageUris: string[],    // array of local URIs
    baseFolder: string,     // e.g., 'marketplace'
    userId?: string,        // optional — for organized sub-folders
    resourceId?: string     // optional — e.g., listing ID or complaint ID
): Promise<{ success: boolean; urls?: string[]; error?: string }> => {
    try {
        if (!imageUris || imageUris.length === 0) {
            return { success: false, error: 'No images provided' };
        }

        // Convert ALL URIs to Blobs simultaneously (in parallel)
        const blobs = await Promise.all(
            imageUris.map(uri => uriToBlob(uri))
        );

        const timestamp = Date.now();

        // Upload all blobs in parallel, with organized folder structure
        const results = await Promise.all(
            blobs.map((blob, index) => {
                // Build folder path based on what optional params are provided
                let folder: string;
                if (userId && resourceId) {
                    // e.g., "marketplace/user123/listing456_0_1714000000"
                    folder = `${baseFolder}/${userId}/${resourceId}_${index}_${timestamp}`;
                } else if (userId) {
                    // e.g., "profiles/user123/1714000000_0"
                    folder = `${baseFolder}/${userId}/${timestamp}_${index}`;
                } else {
                    // Legacy: "announcements/1714000000_0"
                    folder = `${baseFolder}/${timestamp}_${index}`;
                }
                return uploadImage(blob, folder);
            })
        );

        return {
            success: true,
            urls: results.map(r => r.url)  // extract just the url from each result
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to upload images'
        };
    }
};
```

**What is `Promise.all()`?**
> If you upload 3 images one-by-one using `await` in a loop, it takes 3x the time:
> - Upload 1: 2 seconds
> - Upload 2: 2 seconds
> - Upload 3: 2 seconds
> - **Total: 6 seconds**
>
> `Promise.all([upload1, upload2, upload3])` starts all 3 uploads simultaneously:
> - All 3 start at the same time, finish in parallel
> - **Total: ~2 seconds** (the slowest one)
>
> `Promise.all` waits until ALL of them complete. If any one fails, the whole thing fails.

---

## 📢 FILE: `src/services/announcementService.ts`

**Purpose:** Admin creates announcements with optional attached images. Residents view all announcements.

### `createAnnouncement()`:
```typescript
export const createAnnouncement = async (
    title: string, message: string,
    priority: 'low' | 'medium' | 'high',
    adminId: string, adminName: string,
    imageUris?: string[]   // optional: admin may attach photos
): Promise<ApiResponse> => {
    try {
        let imageUrls: string[] = [];

        // Step 1: If images selected, upload them first
        if (imageUris && imageUris.length > 0) {
            const result = await uploadMultipleImages(imageUris, 'announcements');
            if (result.success && result.urls) {
                imageUrls = result.urls;  // save the Firebase Storage URLs
            }
        }

        // Step 2: Build the Firestore document
        const announcementData = {
            title: title.trim(),        // .trim() removes leading/trailing spaces
            message: message.trim(),
            priority,                   // 'low' | 'medium' | 'high'
            createdBy: adminId,
            createdByName: adminName,
            imageUrls: imageUrls,       // array of storage URLs (empty if no images)
            createdAt: serverTimestamp(), // server time used — accurate across all timezones
        };

        // Step 3: Save to 'announcements' collection in Firestore
        const docRef = await addDoc(collection(db, 'announcements'), announcementData);

        return {
            success: true,
            data: { announcementId: docRef.id },
            message: 'Announcement created successfully',
        };
    } catch (error) { ... }
};
```

**Why `serverTimestamp()` instead of `new Date()`?**
> `new Date()` uses the phone's local clock. If an admin's phone clock is wrong (e.g., set to yesterday), the announcement would be sorted incorrectly. `serverTimestamp()` tells Firebase to record the time from Google's accurate server clock the moment the document is written — guaranteed correct across all timezones and device settings.

---

## 💰 FILE: `src/services/MonthlyBillingService.ts` (The Most Important Service)

This is the largest service. It handles the entire billing lifecycle.

### Bill Lifecycle:
```
Admin generates bills → status: 'Unpaid'
                                ↓
        Resident sees bill and uploads payment proof → proof saved in Firebase Storage
                                ↓
        Admin reviews proof → calls verifyPayment() → status: 'Paid'
```

### `generateMonthlyBills(month, baseCharges, adminId)` — Core Logic:

This function generates bills for ALL residents at once. Here is the step-by-step flow:

**Step 1 — Get all residents:**
```typescript
const usersQuery = query(
    collection(db, 'users'),
    where('role', '==', 'resident')
);
const usersSnapshot = await getDocs(usersQuery);
// Loop through each resident:
for (const userDoc of usersSnapshot.docs) { ... }
```

**Step 2 — Skip if bill already exists:**
```typescript
const existingBillSnapshot = await getDocs(query(
    collection(db, 'bills'),
    where('residentId', '==', residentId),
    where('month', '==', month)
));
if (!existingBillSnapshot.empty) {
    skippedCount++;
    continue;  // skip to next resident — don't create duplicate
}
```

**Step 3 — Add previous unpaid dues + 10% late fee:**
```typescript
previousBillsSnapshot.forEach((billDoc) => {
    if (billData.status === 'Unpaid' || billData.status === 'Pending') {
        previousDues += billData.amount || 0;
        lateFee += (billData.amount || 0) * LATE_FEE_PERCENTAGE; // 10% fee
    }
});
```

**Step 4 — Find complaint charges not yet billed:**
```typescript
const unbilledComplaintsQuery = query(
    collection(db, 'complaints'),
    where('residentId', '==', residentId),
    where('addedToBill', '==', false), // not yet billed
    where('chargeAmount', '>', 0)       // has an actual charge amount
);
// Add each complaint's charge to the bill breakdown
```

**Step 5 — Create the bill document with full breakdown:**
```typescript
const billData = {
    residentId, residentName, houseNo, month,
    breakdown: {
        baseCharges,        // standard monthly maintenance
        complaintCharges,   // extra charges from resolved complaints
        previousDues,       // unpaid old bills + late fee
        total               // sum of all above
    },
    amount: breakdown.total,
    dueDate: Timestamp.fromDate(new Date(year, month-1, 25)), // 25th of the month
    status: 'Unpaid',
    proofUrl: null,         // resident hasn't paid yet
    isArchived: false,
    createdAt: serverTimestamp(),
};
batch.set(newBillRef, billData);
```

**Step 6 — Commit everything atomically:**
```typescript
await batch.commit();
// ALL bills created together, or ALL fail — no half-finished state
```

**What is an atomic batch write?**
> If internet disconnects after creating 3 bills but before creating the 4th, a partial update would leave the database inconsistent. A Firestore `writeBatch` groups all writes — either ALL succeed or NONE do. This is the same as a "transaction" in SQL databases.

### `verifyPayment(billId, adminUid)`:
```typescript
export const verifyPayment = async (billId, adminUid) => {
    // 1. Read the bill
    const billDoc = await getDoc(billRef);

    // 2. Update status to 'Paid'
    await updateDoc(billRef, {
        status: 'Paid',
        verifiedBy: adminUid,
        verifiedAt: serverTimestamp(),
    });

    // 3. Delete the "New Bill" notification (no longer needed after payment)
    await deleteNotificationsByRelatedId(billId);
};
```

### `uploadPaymentProof(billId, imageUri)`:
```typescript
export const uploadPaymentProof = async (billId, imageUri) => {
    // 1. Get the bill to find out the residentId
    const billData = (await getDoc(billRef)).data();
    const residentId = billData.residentId;

    // 2. Upload image to Firebase Storage at organized path
    const { url } = await uploadBillPaymentProof(imageUri, residentId, billId);

    // 3. Update the bill document with the proof URL and change status
    await updateDoc(billRef, {
        proofUrl: url,
        status: 'Pending',  // waiting for admin to verify
        proofUploadedAt: serverTimestamp(),
    });
};
```

---

## 🛠️ FILE: `src/services/ComplaintManagementService.ts`

### `createComplaint()` — With Auto-Incremented Number:
```typescript
// Generate complaint number (C001, C002, ...) using Firestore TRANSACTION
const complaintNumber = await runTransaction(db, async (transaction) => {
    const counterRef = doc(db, 'counters', 'complaints'); // special counter document
    const counterDoc = await transaction.get(counterRef);

    let newCount = counterDoc.exists() ? counterDoc.data().count + 1 : 1;
    transaction.update(counterRef, { count: newCount });

    return `C${String(newCount).padStart(3, '0')}`; // C001, C002, ...
});
```

**What is `runTransaction` and why is it used for the counter?**
> Imagine two users file complaints simultaneously. Both read the counter as `5`. Both increment to `6`. Both save `6`. Now two complaints have number `C006` — a collision. A `runTransaction` **locks** the counter document while one user reads-and-writes it, making the other user wait. This guarantees unique sequential numbers.

**What is `padStart(3, '0')`?**
> Pads a number with zeros on the left to make it 3 digits: `1` → `001`, `25` → `025`, `100` → `100`. This ensures alphabetical sorting also works as numerical sorting.

### `resolveComplaintWithCharge()` — Billing Logic:
This function has the most complex logic in the complaints system:

```
Admin resolves complaint AND adds a charge (e.g., Rs 500 for broken pipe repair)
        ↓
Does this resident have a Draft bill for this month?
        ↓
   YES (draft bill exists) → Add charge IMMEDIATELY to the draft bill
                             → Mark complaint as addedToBill: true
        ↓
   NO (no draft, or bill already sent) → Save charge on complaint (addedToBill: false)
                                         → Will be picked up NEXT time admin generates bills
```

**Why not add charges to 'Unpaid' or 'Paid' bills?**
> An 'Unpaid' bill has already been shown to the resident — modifying it now would confuse them (the amount would change). A 'Paid' bill is closed. We only modify 'Draft' bills that haven't been sent yet. If no draft exists, the charge waits for the next billing cycle.

---

## 🛒 FILE: `src/services/MarketplaceListingService.ts`

### `createListing()` — With Two-Step Save:
```typescript
export const createListing = async (listingData, postedBy, isAdmin) => {
    // Step 1: Create the listing document FIRST to get an auto-generated ID
    const listingRef = await addDoc(collection(db, 'listings'), {
        ...listingData,
        photos: [],           // empty for now — will fill after upload
        status: isAdmin ? 'Approved' : 'Pending',
    });

    // Step 2: Upload images using the listing's new ID for organized storage path
    const uploadResult = await uploadMultipleImages(
        listingData.photoUris,
        STORAGE_FOLDERS.MARKETPLACE,
        postedBy,
        listingRef.id   // e.g., images go to marketplace/userId/listingId_0_timestamp
    );

    if (!uploadResult.success) {
        // Clean up — delete the listing if images failed
        await deleteDoc(doc(db, 'listings', listingRef.id));
        return { success: false, error: 'Failed to upload property images' };
    }

    // Step 3: Update the listing with the real photo URLs
    await updateDoc(doc(db, 'listings', listingRef.id), {
        photos: uploadResult.urls
    });
};
```

**Why save the document FIRST and then update it with photo URLs?**
> We need the listing's auto-generated document ID to name the storage folder (so images are organized under `marketplace/userId/listingID_...`). But the ID is only available AFTER `addDoc()` creates the document. So the flow must be: create document → get ID → upload images → update document with URLs.

### The Listing Approval Flow:
```typescript
// Admin approves:
await updateDoc(doc(db, 'listings', listingId), {
    status: 'Approved',
    reviewedBy: adminUid,
    reviewedAt: serverTimestamp(),
});
// AppDataContext's onSnapshot for 'Approved' listings fires instantly
// → Resident's marketplace screen updates in real-time with new listing

// Admin rejects:
await updateDoc(doc(db, 'listings', listingId), {
    status: 'Rejected',
    rejectionReason: reason  // Admin must give a reason
});
```

### Resident Life Cycle for Their Own Listing:
```typescript
markAsSold(listingId)     → status: 'Sold'     (permanently done)
deactivateListing(id)     → status: 'Inactive'  (hidden from browse)
reactivateListing(id)     → status: 'Pending'   (back to admin review)
deleteListing(id)         → permanent deletion from Firestore
```

---

## 🚗 FILE: `src/services/VehicleEntryLogService.ts`

### `logVehicleEntry()`:
```typescript
export const logVehicleEntry = async (vehicleData, loggedBy, loggedByName) => {
    const entryLog = {
        vehicleNo: vehicleData.vehicleNo.toUpperCase(), // always store in CAPS
        type: vehicleData.type,          // 'Car', 'Bike', 'Truck', etc.
        entryTime: serverTimestamp(),    // when it entered
        exitTime: null,                  // null = still inside
        loggedBy,                        // security guard's uid
        loggedByName,
        // Optional resident info (if vehicle is registered):
        residentId, residentName, houseNo,
        // Optional visitor info:
        visitorName, purpose,
        // Optional gate photo:
        photoUrl
    };

    const docRef = await addDoc(collection(db, 'vehicleLogs'), entryLog);
    return { success: true, data: { logId: docRef.id } };
};
```

**Why `vehicleNo.toUpperCase()`?**
> License plates are case-insensitive. "abc123" and "ABC123" are the same plate. Storing always in uppercase prevents duplicate records due to case differences, and makes searches consistent.

**Why is `exitTime: null` on entry?**
> A `null` exitTime means the vehicle is currently inside. When it exits, `logVehicleExit()` updates that document: `exitTime: serverTimestamp()`. This is how `getActiveVehicles()` works — it queries `where('exitTime', '==', null)`.

### `findActiveVehicle(vehicleNo)` — For Processing Exit:
```typescript
const q = query(
    collection(db, 'vehicleLogs'),
    where('vehicleNo', '==', normalizedNo),  // This exact plate number
    where('exitTime', '==', null)             // That hasn't exited yet
);
```

The security screen uses this when a car is leaving. The guard enters the plate → this function finds the active entry log → `logVehicleExit()` updates it with the exit time.

---

## 💾 FILE: `src/services/DataCache.ts`

### The Caching Problem:
```
Admin opens Bills screen → Firebase read (0.4 seconds)
Admin goes to Dashboard → Bills screen (closes)
Admin opens Bills screen again → Firebase read AGAIN (0.4 seconds)
```
This is wasteful. The data probably hasn't changed in 2 minutes.

### How the Cache Works:
```typescript
class DataCacheService {
    // Internal storage: a Map where key = name, value = { data, timestamp, expiresIn }
    private cache: Map<string, CacheEntry<any>> = new Map();
    private readonly DEFAULT_EXPIRY = 2 * 60 * 1000; // 2 minutes in milliseconds

    // Check cache before fetching
    get<T>(key: string): T | null {
        const entry = this.cache.get(key);
        if (!entry) return null;                        // not in cache

        const isExpired = Date.now() - entry.timestamp > entry.expiresIn;
        if (isExpired) {
            this.cache.delete(key);                     // remove stale data
            return null;
        }
        return entry.data as T;                         // return fresh cached data
    }

    // Save to cache
    set<T>(key: string, data: T, expiresIn = this.DEFAULT_EXPIRY): void {
        this.cache.set(key, { data, timestamp: Date.now(), expiresIn });
    }

    // Remove entry (after data changes)
    invalidate(key: string): void { this.cache.delete(key); }

    // Remove all bills cache entries (uses regex pattern matching)
    invalidateAllBills(): void { this.invalidatePattern(/^bills:/); }
}

// Singleton — one shared cache for the whole app
export const dataCache = new DataCacheService();
```

**What is a `Map` in TypeScript/JavaScript?**
> Like a `HashMap` in Java. A collection of key-value pairs where keys can be any string. `cache.get('bills:admin:all')` retrieves the cached bills. `cache.set(...)` saves them. Much faster than a Firebase query.

**When is the cache invalidated?**
> Immediately after creating or modifying data. For example, in `generateMonthlyBills()`:
> ```typescript
> await batch.commit();      // save to Firebase
> dataCache.invalidateAllBills(); // clear cache so next read fetches fresh data
> ```
> This ensures stale data is never shown.

---

## ❓ Master Q&A For Services

**Q: Explain the complete flow from a resident uploading payment proof to admin approving it.**
> 1. Resident opens their unpaid bill → presses "Upload Proof" → picks image from gallery.
> 2. `uploadPaymentProof(billId, imageUri)` is called.
> 3. `uriToBlob(imageUri)` converts the local file to binary data.
> 4. `uploadBytes(storageRef, blob)` uploads to Firebase Storage at `bills/residentId/billId_timestamp`.
> 5. `getDownloadURL()` returns the permanent URL.
> 6. `updateDoc()` updates the bill: `status: 'Pending'`, `proofUrl: [url]`.
> 7. Admin's `AdminDataContext` listener fires because the bill changed.
> 8. Admin opens Bills screen → sees the bill is "Pending" → clicks to view → sees the proof image (loaded from the Firebase Storage URL).
> 9. Admin clicks "Verify Payment" → `verifyPayment(billId, adminUid)` is called.
> 10. Bill status updates to 'Paid'. Resident's context listener fires. Resident's Bills screen updates automatically.

**Q: What is the difference between `addDoc` and `setDoc` in Firestore?**
> - `addDoc()` — Firestore auto-generates a random document ID. Used when creating new bills, complaints, listings (you don't care what the ID is).
> - `setDoc(doc(db, collection, specificId), data)` — You specify the document ID. Used in `authService.ts` where we want the document ID to match the user's UID.

**Q: What is a Firestore transaction and when do you use it in the project?**
> A transaction is used in `createComplaint()` to generate unique sequential complaint numbers (C001, C002...). A transaction reads-then-writes atomically. If two complaints are created simultaneously, the transaction prevents them from getting the same number. One will wait for the other to finish.

**Q: What happens if image upload fails during listing creation?**
> In `createListing()`, after `addDoc()` creates the document, we attempt to upload images. If the upload fails, we call `deleteDoc()` to remove the partially-created listing. This cleanup prevents "ghost listings" with no photos from staying in the database.

**Q: How does the billing system connect to the complaint system?**
> When an admin resolves a complaint with a charge (e.g., Rs 500 for a plumbing repair), `resolveComplaintWithCharge()` checks if there is an open 'Draft' bill for this resident this month. If yes → the charge is added to the draft bill immediately (`addedToBill: true`). If no → the complaint is flagged (`addedToBill: false`, `chargeAmount: 500`). When `generateMonthlyBills()` runs next month, it scans `complaints` for documents where `addedToBill == false && chargeAmount > 0` and includes them in the new bill.
