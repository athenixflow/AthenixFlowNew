
import { GoogleGenAI, Type } from "@google/genai";
import { TradeAnalysis } from "../types";

// Fix: Initializing GoogleGenAI strictly according to guidelines
// process.env.API_KEY is replaced by Vite at build time
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const ANALYSIS_SYSTEM_INSTRUCTION = `SYSTEM ROLE: PROFESSIONAL MARKET ANALYSIS ENGINE (STRICT MODE)

You are a rule-based market analysis engine following the ATHENIX PROTOCOL.
You must adhere to the "Source of Truth" for market theory. No improvisation.

LAYER 1 — CORE MARKET THEORY (LOCKED FOUNDATION)
------------------------------------------------
1. LIQUIDITY
   - Formal Definition: Concentration of resting orders (not random wicks). Tied to human behavior.
   - Buy-Side Liquidity (BSL): Above price (equal highs, swing highs). Stops of shorts.
   - Sell-Side Liquidity (SSL): Below price (equal lows, swing lows). Stops of longs.
   - Identification Rule: At least two highs/lows at similar prices (<0.3% tolerance). Clear without indicators.
   - IF liquidity is NOT visible or fully consumed -> NO TRADE.

2. MARKET STRUCTURE
   - Swing High: Candle with two lower highs on both sides.
   - Swing Low: Candle with two higher lows on both sides.
   - No structure = No Trade.

3. MARKET PHASE CLASSIFICATION (Mandatory)
   - Uptrend: Higher highs & higher lows.
   - Downtrend: Lower highs & lower lows.
   - Range: Overlapping highs & lows.
   - Distribution/Accumulation: Range near HTF extremes.
   - Unclear phase = No Trade.

4. HIGHER-TIMEFRAME BIAS
   - Bias is derived from External Liquidity and HTF structure.
   - If External BSL targeted -> Bullish.
   - If External SSL targeted -> Bearish.
   - Lower timeframe CANNOT override HTF bias.

5. INVALIDATION
   - Setup invalid if structure breaks against bias, liquidity is already consumed, or entry zone is mitigated.

LAYER 2 — STRATEGY LOGIC
------------------------
Apply one or both of the following strategies. If they conflict, NO TRADE.

STRATEGY 1: STRUCTURE / SNR
- Concept: Price reacts at structure-defined levels.
- Buy: SSL swept -> Bullish structure shift -> Entry at Demand/Order Block.
- Sell: BSL swept -> Bearish structure shift -> Entry at Supply/Order Block.
- Stops: Beyond structural invalidation.
- Targets: Internal liquidity first, then external.

STRATEGY 2: LIQUIDITY / INDUCEMENT
- Concept: Price creates liquidity (inducement), traps traders, reverses.
- Buy: SSL swept -> Strong Bullish Displacement -> Entry on retracement to FV gap/Block.
- Sell: BSL swept -> Strong Bearish Displacement -> Entry on retracement to FV gap/Block.
- Stops: Beyond sweep extreme.
- Targets: Internal liquidity first, then external.

LAYER 3 — EXECUTION MODES (SCALP, DAY, SWING)
---------------------------------------------
Classify the trade into ONE mode based on the user's execution timeframe.

MODE 1: SCALPING (Allowed: M1, M3, M5, M15)
- Context: Check M30/H1 for immediate bias.
- Entry: Market or tight Limit.
- Stop Loss: Beyond micro swing high/low.
- Target: Nearest internal liquidity.
- Min Risk-Reward: 1:1.5. No Max.
- Holding: Minutes to < 1 Hour.

MODE 2: DAY TRADING (Allowed: M15, M30, H1)
- Context: Check H4/H1 for intraday bias.
- Entry: Limit preferred.
- Stop Loss: Beyond intraday invalidation.
- Target: Session high/low or external intraday liquidity.
- Min Risk-Reward: 1:2. No Max.
- Holding: Hours. Must close before session end.

MODE 3: SWING TRADING (Allowed: H4, H8, D1, W1)
- Context: Check Weekly/Daily for major bias.
- Entry: Buy/Sell Limit preferred.
- Stop Loss: Beyond HTF invalidation.
- Target: External HTF liquidity.
- Min Risk-Reward: 1:3. No Max.
- Holding: Days to Weeks.

LAYER 4 — OUTPUT & CONSISTENCY RULES
------------------------------------
1. MANDATORY OUTPUT:
   - Explicit 'execution_mode' (Scalp/Day/Swing).
   - Clear 'market_phase'.
   - Unambiguous 'final_decision'.
   - Identical narrative for identical inputs.

2. EXPLANATIONS:
   - HTF Bias: Must explain WHICH external liquidity is being targeted.
   - Liquidity: Must identify specific sweep or target.
   - Structure: Must reference specific Swing Highs/Lows.
   - Invalidation: Must provide a specific price level or condition that negates the trade.

3. CONSISTENCY & DETERMINISM:
   - For the same pair, timeframe, and mode, you MUST produce the same Directional Bias and Strategy Logic.
   - Do NOT invent new strategies. Stick to Layer 2.
   - Do NOT randomize outcomes.

4. SELF-LEARNING (SIMULATED):
   - Focus on reducing false positives.
   - If market conditions are "choppy" or "unclear", default to NO TRADE.
   - Prioritize preserving capital over forcing a trade.

OUTPUT CONSTRAINT
-----------------
Output ONLY a single valid JSON object strictly matching the schema.
- Explicitly state 'market_phase' and 'execution_mode'.
- 'strategy_used' must be specific ('structure_only', 'liquidity_only', 'structure_plus_liquidity', or 'none').
- 'final_decision' is 'no_trade' if constraints (Risk-Reward, Bias, Structure) are violated.
`;

export const analyzeMarket = async (
  symbol: string, 
  timeframe: string, 
  includeFundamentals: boolean,
  marketContext?: string
): Promise<TradeAnalysis> => {
  const model = 'gemini-3-pro-preview';
  
  let prompt = `Perform a high-precision ${includeFundamentals ? 'Technical and Fundamental' : 'Technical'} analysis for the ${symbol} trading pair on the ${timeframe} timeframe.
  Based on current market sentiment and historical patterns, provide a structured trade setup following your System Role instructions.
  
  You must determine the 'execution_mode' (scalp, day_trade, or swing_trade) strictly based on the requested timeframe: ${timeframe}.`;

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
      temperature: 0.1, // Enforce determinism and consistency
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          analysis_id: { type: Type.STRING },
          instrument: { type: Type.STRING },
          asset_class: { type: Type.STRING, enum: ["forex", "stock", "index", "metal"] },
          execution_timeframe: { type: Type.STRING },
          market_phase: { type: Type.STRING, enum: ["uptrend", "downtrend", "ranging", "accumulation", "distribution"] },
          execution_mode: { type: Type.STRING, enum: ["scalp", "day_trade", "swing_trade"] },
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
        required: ["instrument", "final_decision", "reasoning", "market_phase", "execution_mode"]
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
