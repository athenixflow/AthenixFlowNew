
import { initializeApp, getApp, getApps, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import { getFunctions, Functions } from "firebase/functions";

// Ensure we have fallback strings to prevent SDK initialization from throwing immediately
// if environment variables are missing during the initial boot phase.
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || "placeholder-key",
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || "placeholder-auth-domain",
  projectId: process.env.FIREBASE_PROJECT_ID || "placeholder-project-id",
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "placeholder-storage-bucket",
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "placeholder-sender-id",
  appId: process.env.FIREBASE_APP_ID || "placeholder-app-id",
};

let app: FirebaseApp;
let authInstance: Auth;
let firestoreInstance: Firestore;
let functionsInstance: Functions;

try {
  // Check if Firebase is already initialized to handle hot-reloading gracefully
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
    console.debug("Athenix: Firebase infrastructure initialized.");
  } else {
    app = getApp();
  }

  // Initialize services and export instances
  // We initialize them here to ensure they are registered with the specific 'app' instance
  authInstance = getAuth(app);
  firestoreInstance = getFirestore(app);
  functionsInstance = getFunctions(app);

} catch (error) {
  console.error("Athenix: Firebase initialization failed. Services may be unavailable.", error);
  // Fallback to allow the app to continue rendering UI even if backend fails
  // The actual calls to these will be guarded in future prompts
}

export const firebaseApp = app!;
export const auth = authInstance!;
export const firestore = firestoreInstance!;
export const functions = functionsInstance!;
