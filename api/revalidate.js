import { GoogleGenAI } from "@google/genai";
import { adminDb } from "./_lib/firebaseAdmin.js";
import { requireUser, checkRateLimit, sendError, HttpError } from "./_lib/guard.js";

// Server-side Athenix revalidation endpoint.
// Auth-gated; the prompt is built from the SERVER-stored analysis (verified to
// belong to the caller), never from the client payload. No token cost.

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  try {
    const apiKey = process.env.Google_api || process.env.API_KEY || process.env.VITE_API_KEY;
    if (!apiKey) {
      throw new HttpError(500, "Server configuration error: AI key not found.");
    }

    const uid = await requireUser(req);
    await checkRateLimit(uid, 'revalidate');

    const { originalAnalysis, currentPrice } = req.body || {};
    const analysisId = originalAnalysis && originalAnalysis.id;
    if (!analysisId) {
      throw new HttpError(400, "Missing analysis id.");
    }

    const price = Number(currentPrice);
    if (!Number.isFinite(price) || price <= 0) {
      throw new HttpError(400, "Invalid current price.");
    }

    // Ownership check: load the stored analysis and verify it belongs to uid.
    const snap = await adminDb().collection('analysisHistory').doc(String(analysisId)).get();
    if (!snap.exists) {
      throw new HttpError(404, "Analysis not found.");
    }
    const stored = snap.data();
    if (stored.userId !== uid) {
      throw new HttpError(403, "Not authorized for this analysis.");
    }
    if (!stored.signal) {
      return res.status(200).json({ result: "No active signal to validate." });
    }

    const ai = new GoogleGenAI({ apiKey });
    const model = 'gemini-3-flash-preview';

    const prompt = `
    You are the Athenix Revalidation Engine.

    Original Trade Details:
    Symbol: ${stored.instrument}
    Direction: ${stored.signal.direction}
    Entry Price: ${stored.signal.entry_price}
    Stop Loss: ${stored.signal.stop_loss}
    TP1: ${stored.signal.take_profits?.[0]?.price}
    TP2: ${stored.signal.take_profits?.[1]?.price}

    Current Market Price: ${price}

    Rules for Status Determination:
    1. If price has hit Stop Loss level (breached SL) -> 'Setup invalidated'
    2. If price has hit TP1 or higher -> 'Secure partial profits'
    3. If price moved significantly against the bias or structure shifted -> 'Exit trade'
    4. If price is hovering near entry or in drawdown but still respecting SL -> 'Trade still valid'

    OUTPUT ONLY ONE OF THE FOLLOWING STRINGS:
    - "Trade still valid"
    - "Secure partial profits"
    - "Exit trade"
    - "Setup invalidated"
  `;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        temperature: 0.1,
        responseMimeType: "text/plain"
      }
    });

    return res.status(200).json({ result: response.text?.trim() || "Setup Still Valid" });
  } catch (error) {
    return sendError(res, error);
  }
}
