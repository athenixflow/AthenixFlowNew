import { GoogleGenAI } from "@google/genai";
import { requireUser, checkRateLimit, capString, assertCanSpend, spendToken, sendError, HttpError } from "./_lib/guard.js";
import { recordAiCall } from "./_lib/telemetry.js";

// Server-side Athenix education endpoint.
// Behaviour identical to the previous client-side getEducationResponse.

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
    await checkRateLimit(uid, 'education');

    const { question, context, difficulty = 'Intermediate', category } = req.body || {};
    capString(question, 4000, 'question');
    capString(context, 4000, 'context');
    capString(difficulty, 32, 'difficulty');
    capString(category, 128, 'category');
    if (!question) {
      throw new HttpError(400, "Missing question.");
    }

    await assertCanSpend(uid, 'education');

    const ai = new GoogleGenAI({ apiKey });
    const model = 'gemini-3-flash-preview';

    const prompt = `
    Question: ${question}
    Category: ${category || 'General Trading'}
    Difficulty Level: ${difficulty}
    Context: ${context || 'None'}

    Provide a clear, structured, and professional explanation using Smart Money Concepts (SMC).
    Use Markdown for formatting (bolding, lists, headers).
    Tailor the depth of the explanation to the ${difficulty} level.
  `;

    const startedAt = Date.now();
    let response;
    try {
      response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          systemInstruction: "You are an expert trading mentor at Athenix. Focus on Smart Money Concepts, Liquidity, and Market Structure. Provide educational, institutional-grade responses."
        }
      });
    } catch (e) {
      await recordAiCall({ feature: 'education', model, uid, startedAt, usage: e?.response?.usageMetadata, ok: false, error: e?.message });
      throw e;
    }
    await recordAiCall({ feature: 'education', model, uid, startedAt, usage: response?.usageMetadata, ok: true });

    const text = response.text || "Unable to generate response.";

    // Charge one education token only after a successful generation.
    await spendToken(uid, 'education');

    return res.status(200).json({ text });
  } catch (error) {
    return sendError(res, error);
  }
}
