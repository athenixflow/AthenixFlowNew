import { initializeApp, getApp, getApps, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import { getFunctions, Functions } from "firebase/functions";

// Institutional credentials
const firebaseConfig = {
  apiKey: "AIzaSyAhocrl50PXgRJpbwWuOHM3O3Mhg7xyH2Y",
  authDomain: "athenixweb.firebaseapp.com",
  projectId: "athenixweb",
  storageBucket: "athenixweb.firebasestorage.app",
  messagingSenderId: "61603874286",
  appId: "1:61603874286:web:458f857e9e4b308eb7baff",
  measurementId: "G-EDP3DMGSDM"
};

/**
 * SINGLETON INITIALIZATION (MANDATORY)
 * Ensures initializeApp() is called exactly once.
 */
let app: FirebaseApp;
try {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  console.log("Athenix: Firebase Core Initialized");
} catch (e) {
  console.error("Athenix: Firebase Initialization Failed", e);
  throw e;
}

/**
 * SERVICE INITIALIZATION
 * Explicitly passing 'app' prevents "Component not registered" errors caused by 
 * modular SDKs potentially loading different internal versions of the App registry.
 */
const auth: Auth = getAuth(app);
const firestore: Firestore = getFirestore(app);
const functions: Functions = getFunctions(app);

// Export centralized instances
export { app, auth, firestore, functions };