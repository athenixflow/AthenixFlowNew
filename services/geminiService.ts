
import { TradeAnalysis } from "../types";
import { auth } from "../firebase";

// Attaches the caller's Firebase ID token so the server-side AI endpoints can
// authenticate the request and enforce the token economy.
async function authHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const idToken = await auth.currentUser?.getIdToken();
  if (idToken) headers['Authorization'] = `Bearer ${idToken}`;
  return headers;
}

/**
 * Athenix AI client.
 *JESUS
 * The Gemini API key is NO LONGER used in the browser. These functions are thin
 * clients that call the server-side Vercel functions in /api (analyze, education,
 * revalidate), which hold the key, the system instruction and the response schema.
 *
 * The analysis logic itself is unchanged — see api/analyze.js for the verbatim
 * Athenix Master Implementation Prompt and response schema. Export signatures and
 * return shapes are identical to the previous implementation, so callers
 * (services/backend.ts, pages/AIAssistant.tsx) require no changes.
 */

export const analyzeMarket = async (
  symbol: string,
  timeframe: string,
  includeFundamentals: boolean,
  marketContext?: string,
  marketType?: string
): Promise<TradeAnalysis> => {
  const response = await fetch('/api/analyze', {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify({ symbol, timeframe, includeFundamentals, marketContext, marketType })
  });

  if (!response.ok) {
    let message = `Analysis service error (${response.status}).`;
    try {
      const err = await response.json();
      if (err?.error) message = err.error;
    } catch {
      /* non-JSON error body */
    }
    throw new Error(message);
  }

  return await response.json() as TradeAnalysis;
};

export const getEducationResponse = async (
  question: string,
  context?: string,
  difficulty: string = 'Intermediate',
  category?: string
): Promise<string> => {
  const response = await fetch('/api/education', {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify({ question, context, difficulty, category })
  });

  if (!response.ok) {
    let message = `Education service error (${response.status}).`;
    try {
      const err = await response.json();
      if (err?.error) message = err.error;
    } catch {
      /* non-JSON error body */
    }
    throw new Error(message);
  }

  const data = await response.json();
  return data?.text || "Unable to generate response.";
};

export const revalidateTradeSetup = async (
  originalAnalysis: TradeAnalysis,
  currentPrice: number
): Promise<string> => {
  if (!originalAnalysis.signal) return "No active signal to validate.";

  const response = await fetch('/api/revalidate', {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify({ originalAnalysis, currentPrice })
  });

  if (!response.ok) {
    let message = `Revalidation service error (${response.status}).`;
    try {
      const err = await response.json();
      if (err?.error) message = err.error;
    } catch {
      /* non-JSON error body */
    }
    throw new Error(message);
  }

  const data = await response.json();
  return data?.result || "Setup Still Valid";
};
