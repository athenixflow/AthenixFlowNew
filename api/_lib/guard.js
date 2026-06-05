import { adminAuth, adminDb } from './firebaseAdmin.js';

// Shared request-guard helpers for the server-side AI endpoints:
// authentication, rate limiting, input caps and server-side token spend.

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

// --- Authentication ---------------------------------------------------------

// Verifies the Firebase ID token from the Authorization header and returns uid.
export async function requireUser(req) {
  const header = req.headers.authorization || req.headers.Authorization || '';
  const match = /^Bearer (.+)$/.exec(header.trim());
  if (!match) throw new HttpError(401, 'Authentication required.');
  try {
    const decoded = await adminAuth().verifyIdToken(match[1]);
    return decoded.uid;
  } catch {
    throw new HttpError(401, 'Invalid or expired session. Please sign in again.');
  }
}

// --- Rate limiting (Firestore fixed window per uid+key) ---------------------

const RATE_LIMIT = 30;          // max requests per window
const WINDOW_MS = 60 * 1000;    // 1 minute

export async function checkRateLimit(uid, key) {
  const ref = adminDb().collection('rate_limits').doc(`${uid}_${key}`);
  await adminDb().runTransaction(async (t) => {
    const snap = await t.get(ref);
    const now = Date.now();
    const data = snap.exists ? snap.data() : null;
    if (!data || now - (data.windowStart || 0) > WINDOW_MS) {
      t.set(ref, { windowStart: now, count: 1 });
      return;
    }
    if ((data.count || 0) >= RATE_LIMIT) {
      throw new HttpError(429, 'Too many requests. Please slow down and try again shortly.');
    }
    t.update(ref, { count: (data.count || 0) + 1 });
  });
}

// --- Input caps -------------------------------------------------------------

export function capString(value, maxLen, fieldName) {
  if (value === undefined || value === null) return value;
  const str = String(value);
  if (str.length > maxLen) {
    throw new HttpError(400, `${fieldName} exceeds the maximum allowed length.`);
  }
  return str;
}

// --- Token economy (server-authoritative) -----------------------------------

function fieldFor(resource) {
  return resource === 'analysis' ? 'analysisTokens' : 'educationTokens';
}

function insufficientMsg(resource) {
  return resource === 'analysis'
    ? 'Insufficient analysis units. Please refill in the Billing terminal.'
    : 'Insufficient education tokens.';
}

// Read-only pre-check (run BEFORE the Gemini call so we never spend AI compute
// for a suspended user or a user with no balance).
export async function assertCanSpend(uid, resource) {
  const snap = await adminDb().collection('users').doc(uid).get();
  if (!snap.exists) throw new HttpError(404, 'User not found.');
  const data = snap.data();
  if (data.accountStatus === 'suspended') throw new HttpError(403, 'Account suspended. Contact administration.');
  if ((data[fieldFor(resource)] || 0) < 1) throw new HttpError(402, insufficientMsg(resource));
}

// Atomic deduction (run AFTER a successful Gemini response). Mirrors the shape
// written by the former client-side deductTokens in services/firestore.ts.
export async function spendToken(uid, resource) {
  const db = adminDb();
  const field = fieldFor(resource);
  const userRef = db.collection('users').doc(uid);
  await db.runTransaction(async (t) => {
    const snap = await t.get(userRef);
    if (!snap.exists) throw new HttpError(404, 'User not found.');
    const data = snap.data();
    if (data.accountStatus === 'suspended') throw new HttpError(403, 'Account suspended.');
    const balance = data[field] || 0;
    if (balance < 1) throw new HttpError(402, insufficientMsg(resource));
    t.update(userRef, { [field]: balance - 1 });
    const transRef = db.collection('token_transactions').doc();
    t.set(transRef, {
      userId: uid,
      type: 'deduction',
      resource,
      amount: 1,
      timestamp: new Date().toISOString(),
      description: resource === 'analysis' ? 'Market Analysis' : 'AI Mentor Consultation'
    });
  });
}

// --- Uniform error responder ------------------------------------------------

export function sendError(res, err) {
  const status = err instanceof HttpError ? err.status : 500;
  const message = err instanceof HttpError ? err.message : (err?.message || 'Server error.');
  if (status >= 500) console.error('AI endpoint error:', err);
  return res.status(status).json({ error: message });
}
