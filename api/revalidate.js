import { GoogleGenAI } from "@google/genai";

// Server-side Athenix revalidation endpoint.
// Behaviour identical to the previous client-side revalidateTradeSetup.

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  const apiKey = process.env.Google_api || process.env.API_KEY || process.env.VITE_API_KEY;
  if (!apiKey) {
    console.error("Configuration Error: process.env.Google_api is missing in Vercel Environment Variables.");
    return res.status(500).json({ error: "Server configuration error: AI key not found." });
  }

  try {
    const { originalAnalysis, currentPrice } = req.body || {};

    if (!originalAnalysis || !originalAnalysis.signal) {
      return res.status(200).json({ result: "No active signal to validate." });
    }

    const ai = new GoogleGenAI({ apiKey });
    const model = 'gemini-3-flash-preview';

    const prompt = `
    You are the Athenix Revalidation Engine.

    Original Trade Details:
    Symbol: ${originalAnalysis.instrument}
    Direction: ${originalAnalysis.signal.direction}
    Entry Price: ${originalAnalysis.signal.entry_price}
    Stop Loss: ${originalAnalysis.signal.stop_loss}
    TP1: ${originalAnalysis.signal.take_profits?.[0]?.price}
    TP2: ${originalAnalysis.signal.take_profits?.[1]?.price}

    Current Market Price: ${currentPrice}

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
    console.error("Revalidate Endpoint Error:", error);
    return res.status(500).json({ error: error.message || "Revalidation failed." });
  }
}
