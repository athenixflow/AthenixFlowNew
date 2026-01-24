
import { GoogleGenAI, Type } from "@google/genai";
import { TradeAnalysis } from "../types";

// Fix: Initializing GoogleGenAI strictly according to guidelines
// process.env.API_KEY is replaced by Vite at build time
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const ANALYSIS_SYSTEM_INSTRUCTION = `SYSTEM ROLE: PROFESSIONAL MARKET ANALYSIS ENGINE (STRICT MODE)

You are a rule-based market analysis engine.
You must follow ALL reasoning rules and ALL output rules below.
You are not allowed to improvise, speculate, or change formats.

Your response is considered INVALID if:
- Strategy rules are violated
- Multi-timeframe logic is skipped
- Order type is ambiguous
- JSON output does not strictly match the required schema

================================================
REASONING RULES (MANDATORY)
================================================

You must always:
- Perform hidden multi-timeframe analysis (higher → lower)
- Evaluate BOTH strategies:
  1) Structure / SNR / Order Block
  2) Liquidity / Inducement
- Select the highest-probability valid setup
- Reject trades if strategies conflict or RR is invalid
- Explicitly choose order type:
  buy_market, sell_market, buy_limit, sell_limit, buy_stop, sell_stop
- Explain reasoning clearly and unambiguously

If no valid setup exists, return a NO TRADE decision.

================================================
OUTPUT CONSTRAINT (ABSOLUTE)
================================================

You MUST output your response as a SINGLE valid JSON object
that strictly follows the schema provided in the configuration.

You are NOT allowed to:
- Add extra fields
- Rename fields
- Return plain text
- Return explanations outside the JSON
- Omit required fields

If a trade is invalid, you must still return a valid JSON
with final_decision = "no_trade".`;

export const analyzeMarket = async (
  symbol: string, 
  timeframe: string, 
  includeFundamentals: boolean,
  marketContext?: string
): Promise<TradeAnalysis> => {
  const model = 'gemini-3-pro-preview';
  
  let prompt = `Perform a high-precision ${includeFundamentals ? 'Technical and Fundamental' : 'Technical'} analysis for the ${symbol} trading pair on the ${timeframe} timeframe.
  Based on current market sentiment and historical patterns, provide a structured trade setup following your System Role instructions.`;

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
      systemInstruction: ANALYSIS_SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          analysis_id: { type: Type.STRING },
          instrument: { type: Type.STRING },
          asset_class: { type: Type.STRING, enum: ["forex", "stock", "index", "metal"] },
          execution_timeframe: { type: Type.STRING },
          final_decision: { type: Type.STRING, enum: ["trade", "no_trade"] },
          strategy_used: { type: Type.STRING, enum: ["structure_only", "liquidity_only", "structure_plus_liquidity", "none"] },
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
                    price: { type: Type.NUMBER }
                  }
                }
              },
              risk_reward_ratio: { type: Type.NUMBER },
              confidence_score: { type: Type.NUMBER }
            }
          },
          multi_timeframe_context: {
             type: Type.OBJECT,
             properties: {
                higher_timeframes_analyzed: { type: Type.ARRAY, items: { type: Type.STRING } },
                higher_timeframe_bias: { type: Type.STRING, enum: ["bullish", "bearish", "ranging"] },
                key_levels_considered: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            type: { type: Type.STRING },
                            timeframe: { type: Type.STRING },
                            price_range: {
                                type: Type.OBJECT,
                                properties: {
                                    low: { type: Type.NUMBER },
                                    high: { type: Type.NUMBER }
                                }
                            }
                        }
                    }
                }
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
          risk_management: {
             type: Type.OBJECT,
             properties: {
                 invalidated_if: { type: Type.STRING },
                 minimum_rr_enforced: { type: Type.BOOLEAN }
             }
          },
          education_reference: {
             type: Type.OBJECT,
             properties: {
                 strategy_principles_used: { type: Type.ARRAY, items: { type: Type.STRING } },
                 knowledge_base_topics: { type: Type.ARRAY, items: { type: Type.STRING } }
             }
          },
          meta: {
              type: Type.OBJECT,
              properties: {
                  generated_at: { type: Type.STRING },
                  analysis_engine_version: { type: Type.STRING }
              }
          }
        },
        required: ["instrument", "final_decision", "reasoning"]
      }
    }
  });

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

  return response.text || "I apologize, I am unable to generate a lesson at this moment.";
};
