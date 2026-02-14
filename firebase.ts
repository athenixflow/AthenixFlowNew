
import { initializeApp, getApp, getApps, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { Firestore, initializeFirestore } from "firebase/firestore";
import { getFunctions, Functions } from "firebase/functions";
import { getAnalytics, Analytics, isSupported } from "firebase/analytics";

// Athenix Configuration
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
 * SINGLETON INITIALIZATION
 */
const app: FirebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

/**
 * SERVICE INITIALIZATION
 * Services are initialized using the singleton 'app' instance.
 * Modular Firebase v9+ requires importing from the specific service modules 
 * which handles the registration side-effects.
 */
const auth: Auth = getAuth(app);

// Initialize Firestore with experimentalForceLongPolling to resolve connection issues
// commonly experienced in certain network environments or when WebSockets are blocked.
const firestore: Firestore = initializeFirestore(app, {
  experimentalForceLongPolling: true,
});

const functions: Functions = getFunctions(app);

let analytics: Analytics | null = null;
if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  }).catch(err => console.debug("Analytics not supported", err));
}

export { app, auth, firestore, functions, analytics };
