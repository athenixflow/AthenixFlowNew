
import { GoogleGenAI, Type } from "@google/genai";
import { TradeAnalysis } from "../types";

// Fix: Initializing GoogleGenAI strictly according to guidelines
const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY });

export const analyzeMarket = async (
  symbol: string, 
  timeframe: string, 
  includeFundamentals: boolean,
  marketContext?: string
): Promise<TradeAnalysis> => {
  const model = 'gemini-3-pro-preview';
  
  let prompt = `Perform a high-precision ${includeFundamentals ? 'Technical and Fundamental' : 'Technical'} analysis for the ${symbol} trading pair on the ${timeframe} timeframe.
  Based on current market sentiment and historical patterns, provide a structured trade setup.`;

  if (marketContext) {
    prompt += `\n\nREAL-TIME MARKET DATA CONTEXT:\n${marketContext}\n\nIMPORTANT INSTRUCTION: The user has provided real-time price data. In your 'reasoning' field, you MUST start the sentence with "Analyzing live market data: " and reference the specific price provided in the context to prove you are using it.`;
  }

  if (includeFundamentals) {
    prompt += `\nInclude macroeconomic factors affecting this pair.`;
  }

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          pair: { type: Type.STRING },
          timeframe: { type: Type.STRING },
          direction: { type: Type.STRING, description: 'BUY or SELL' },
          entry: { type: Type.STRING },
          stopLoss: { type: Type.STRING },
          takeProfit: { type: Type.STRING },
          riskReward: { type: Type.STRING },
          reasoning: { type: Type.STRING, description: 'A detailed explanation of the analysis. If live data was provided, explicitly mention the price.' }
        },
        required: ["pair", "timeframe", "direction", "entry", "stopLoss", "takeProfit", "riskReward", "reasoning"]
      }
    }
  });

  // Fix: Directly accessing .text property on response
  return JSON.parse(response.text) as TradeAnalysis;
};

export const getEducationResponse = async (question: string, context?: string): Promise<string> => {
  const model = 'gemini-3-flash-preview';
  
  const prompt = context 
    ? `Based on the following analysis context: "${context}", answer this trading question: ${question}. Keep it professional, educational, and concise.`
    : `Explain the following trading concept or answer this trading question: ${question}. Ensure the explanation is suitable for a professional trading platform.`;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      systemInstruction: "You are an expert trading mentor at Athenix. Your goal is to educate users on Forex and Stock market concepts using professional terminology."
    }
  });

  // Fix: Directly accessing .text property on response
  return response.text || "I apologize, I am unable to generate a lesson at this moment.";
};
