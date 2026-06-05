import admin from 'firebase-admin';

// Lazy, single-init Firebase Admin SDK for the server-side API functions.
// Credentials come from the FIREBASE_SERVICE_ACCOUNT env var (the full service
// account JSON, as a single string) configured in the Vercel project.
// Initialization is lazy so a missing/invalid credential surfaces as a clean
// HTTP 500 from the handler rather than a module-load crash.

let initialized = false;

function ensureInit() {
  if (initialized || admin.apps.length) {
    initialized = true;
    return;
  }
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) {
    throw new Error('Server auth is not configured (FIREBASE_SERVICE_ACCOUNT is missing).');
  }
  let serviceAccount;
  try {
    serviceAccount = JSON.parse(raw);
  } catch {
    throw new Error('Server auth is misconfigured (FIREBASE_SERVICE_ACCOUNT is not valid JSON).');
  }
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  initialized = true;
}

export function adminAuth() {
  ensureInit();
  return admin.auth();
}

export function adminDb() {
  ensureInit();
  return admin.firestore();
}

export { admin };
