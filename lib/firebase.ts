import { initializeApp, getApp, getApps, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import { getFunctions, Functions } from "firebase/functions";

// Helper to safely access environment variables
const getEnv = (key: string): string => {
  try {
    return (typeof process !== 'undefined' && process.env && process.env[key]) || "";
  } catch {
    return "";
  }
};

const firebaseConfig = {
  apiKey: getEnv('FIREBASE_API_KEY') || "AIzaSy-ATHENIX-PLACEHOLDER",
  authDomain: getEnv('FIREBASE_AUTH_DOMAIN') || "athenix-neural.firebaseapp.com",
  projectId: getEnv('FIREBASE_PROJECT_ID') || "athenix-neural",
  storageBucket: getEnv('FIREBASE_STORAGE_BUCKET') || "athenix-neural.appspot.com",
  messagingSenderId: getEnv('FIREBASE_MESSAGING_SENDER_ID') || "123456789012",
  appId: getEnv('FIREBASE_APP_ID') || "1:123456789012:web:abcdef1234567890",
};

/**
 * SINGLETON INITIALIZATION
 * Ensures initializeApp is called exactly once.
 */
const app: FirebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

/**
 * SERVICE INITIALIZATION
 * Modular SDK requires passing the app instance to ensure 
 * components are registered against the same internal context.
 */
const authInstance: Auth = getAuth(app);
const firestoreInstance: Firestore = getFirestore(app);
const functionsInstance: Functions = getFunctions(app);

export { 
  app as firebaseApp,
  authInstance as auth,
  firestoreInstance as firestore,
  functionsInstance as functions
};

console.debug("Athenix: Backend infrastructure connection established.");