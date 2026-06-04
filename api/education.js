import { GoogleGenAI } from "@google/genai";

// Server-side Athenix education endpoint.
// Behaviour identical to the previous client-side getEducationResponse.

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
    const { question, context, difficulty = 'Intermediate', category } = req.body || {};

    if (!question) {
      return res.status(400).json({ error: "Missing question." });
    }

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

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        systemInstruction: "You are an expert trading mentor at Athenix. Focus on Smart Money Concepts, Liquidity, and Market Structure. Provide educational, institutional-grade responses."
      }
    });

    return res.status(200).json({ text: response.text || "Unable to generate response." });
  } catch (error) {
    console.error("Education Endpoint Error:", error);
    return res.status(500).json({ error: error.message || "Education error" });
  }
}
