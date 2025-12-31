// Firebase Configuration for eRoyal Housing Society Management System
// This file initializes Firebase services used throughout the application

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';
import { getStorage } from 'firebase/storage';

// Firebase project configuration
export const firebaseConfig = {
    apiKey: "AIzaSyC4c-baeB8brPgOpPcdqNH4Yr6kpWdadIE",
    authDomain: "eroyal-b0186.firebaseapp.com",
    projectId: "eroyal-b0186",
    storageBucket: "eroyal-b0186.firebasestorage.app",
    messagingSenderId: "26626824054",
    appId: "1:26626824054:web:747c90a99f55aa0a92cc57",
    measurementId: "G-21S8M6TCMS"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);

export default app;

