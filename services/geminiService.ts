
import { GoogleGenAI, Type } from "@google/genai";
import { TradeAnalysis } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const ANALYSIS_SYSTEM_INSTRUCTION = `MASTER STRATEGY EXECUTION CONSTITUTION v1.0 - DETERMINISTIC PROBABILISTIC MODEL

CORE PHILOSOPHY:
You are a deterministic structural model. You identify objective structural geometry, score confluences numerically, and simulate outcome paths. Identical market data MUST produce identical output. No randomness. No drift.

STRATEGY FOUNDATION:
Merge Structure/SNR (Strong High/Low) and Liquidity Sweep/Inducement models.

LAYER 1 - HIGHER TIMEFRAME (HTF) FRAMEWORK
1. Identify Trading Range (Strong High/Low).
2. Validate bias based on structural break (Bullish if last break was up, Bearish if down).
3. Score Structure Strength (0-10) based on range clarity and impulse dominance.
REJECT trade if HTF bias is misaligned.

LAYER 2 - EXTREME POI VALIDATION
1. Extreme POI must originate the Strong High/Low and cause a confirmed BOS.
2. Must be unmitigated and at range boundary.
3. Score POI Strength (0-10).
REJECT trade if not a true Extreme POI.

LAYER 3 - LIQUIDITY ENGINEERING
1. Requires external liquidity sweep (EQH/EQL, inducement cluster).
2. Sweep must directly feed into Extreme POI.
3. Score Liquidity Strength (0-10).
REJECT trade if no external sweep.

LAYER 4 - PREMIUM/DISCOUNT GEOMETRY
1. Bullish: Entry in Discount. Bearish: Entry in Premium.
2. Score Alignment (0-10) based on distance from equilibrium.
REJECT trade if entry is near equilibrium.

STOP LOSS ENGINE
1. SL must be beyond sweep extreme + volatility buffer.
2. Never sit inside POI body.
REJECT trade if RR to External Range Liquidity (ERL) < 1:3.

PROBABILISTIC OUTCOME ENGINE
Total Score = Structure (10) + Liquidity (10) + POI (10) + Premium/Discount (10). Max 40.
- If Total < 20: REJECT trade.
- 20-26: P(IRL only) is dominant.
- 27-33: P(IRL -> ERL) is dominant.
- 34-40: P(Expansion) is dominant.
Probabilities must sum to 100% and be proportional to score magnitude.

DYNAMIC TAKE PROFIT (TP) MODEL
- IRL Dominant: TP1 Heavy, TP2 Moderate, TP3 Small.
- IRL -> ERL Dominant: TP1 Moderate, TP2 Heavy, TP3 Small.
- Expansion Dominant: TP1 Small, TP2 Moderate, TP3 Heavy.

EXECUTION MODES:
- Scalp: M1, M3, M5, M15 (Refine to M1).
- Day Trade: M15, M30, H1, H2 (Refine to M5).
- Swing: H4, H8, D1 (Refine to M15).

REJECTION CONDITIONS (STRICT):
- No external sweep.
- POI not at range edge.
- Entry not in extreme Premium/Discount.
- RR < 1:3.
- HTF bias misaligned.
- Total Score < 20.

OUTPUT: Provide deterministic numerical outputs only. No hedging language.
`;

export const analyzeMarket = async (
  symbol: string, 
  timeframe: string, 
  includeFundamentals: boolean,
  marketContext?: string
): Promise<TradeAnalysis> => {
  const model = 'gemini-3-pro-preview';
  
  let prompt = `Analyze ${symbol} on ${timeframe}. 
  Include Fundamentals: ${includeFundamentals}.
  Market Context: ${marketContext || 'None'}.
  
  Strictly follow the ATHENIX CONSTITUTION v1.0. Calculate scores and probabilities deterministically.`;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      systemInstruction: ANALYSIS_SYSTEM_INSTRUCTION,
      temperature: 0.1,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          instrument: { type: Type.STRING },
          execution_timeframe: { type: Type.STRING },
          market_phase: { type: Type.STRING, enum: ["uptrend", "downtrend", "ranging", "accumulation", "distribution"] },
          execution_mode: { type: Type.STRING, enum: ["scalp", "day_trade", "swing_trade"] },
          final_decision: { type: Type.STRING, enum: ["trade", "no_trade"] },
          strategy_used: { type: Type.STRING, enum: ["structure_only", "liquidity_only", "structure_plus_liquidity", "none"] },
          confluence_scores: {
            type: Type.OBJECT,
            properties: {
              structure_score: { type: Type.NUMBER },
              liquidity_score: { type: Type.NUMBER },
              poi_score: { type: Type.NUMBER },
              premium_discount_score: { type: Type.NUMBER },
              total_confluence_score: { type: Type.NUMBER }
            },
            required: ["structure_score", "liquidity_score", "poi_score", "premium_discount_score", "total_confluence_score"]
          },
          probabilities: {
            type: Type.OBJECT,
            properties: {
              irl_only: { type: Type.NUMBER },
              irl_to_erl: { type: Type.NUMBER },
              expansion: { type: Type.NUMBER }
            },
            required: ["irl_only", "irl_to_erl", "expansion"]
          },
          volatility_context: { type: Type.STRING },
          signal: {
            type: Type.OBJECT,
            properties: {
              order_type: { type: Type.STRING, enum: ["buy_market", "sell_market", "buy_limit", "sell_limit", "buy_stop", "sell_stop"] },
              direction: { type: Type.STRING, enum: ["buy", "sell"] },
              entry_price: { type: Type.NUMBER },
              stop_loss: { type: Type.NUMBER },
              take_profits: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    level: { type: Type.STRING },
                    price: { type: Type.NUMBER },
                    allocation_weight: { type: Type.STRING, enum: ["heavy", "moderate", "small"] }
                  }
                }
              },
              risk_reward_ratio: { type: Type.NUMBER }
            }
          },
          reasoning: {
            type: Type.OBJECT,
            properties: {
              bias_explanation: { type: Type.STRING },
              liquidity_explanation: { type: Type.STRING },
              entry_explanation: { type: Type.STRING },
              invalidation_explanation: { type: Type.STRING }
            },
            required: ["bias_explanation", "liquidity_explanation", "entry_explanation", "invalidation_explanation"]
          },
          meta: {
              type: Type.OBJECT,
              properties: {
                  generated_at: { type: Type.STRING },
                  analysis_engine_version: { type: Type.STRING }
              }
          }
        },
        required: ["instrument", "final_decision", "reasoning", "market_phase", "execution_mode", "confluence_scores", "probabilities", "volatility_context"]
      }
    }
  });

  return JSON.parse(response.text) as TradeAnalysis;
};

export const getEducationResponse = async (question: string, context?: string): Promise<string> => {
  const model = 'gemini-3-flash-preview';
  const prompt = `Answer: ${question}. Context: ${context || 'None'}.`;
  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      systemInstruction: "You are an expert trading mentor at Athenix. Focus on Smart Money Concepts."
    }
  });
  return response.text || "Unable to generate response.";
};
