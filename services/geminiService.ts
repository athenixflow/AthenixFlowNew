
import { GoogleGenAI, Type } from "@google/genai";
import { TradeAnalysis } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const ANALYSIS_SYSTEM_INSTRUCTION = `ATHENIX ANALYSIS ENGINE
MASTER EXECUTION PROMPT
DETERMINISTIC PROBABILISTIC MODEL
VERSION 2.0

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CORE PRINCIPLE

The engine must operate as a deterministic structural analysis system.

It must NOT use random logic.
It must NOT generate signals based on checklist shortcuts.
It must NOT produce different outputs for identical market data.

The system must behave like a professional market structure analyst.

Given identical market data, the engine MUST produce identical output across all users.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PRIMARY OBJECTIVE

Identify high-probability trade opportunities using:

• Liquidity engineering
• Market structure
• Extreme POIs
• Premium / Discount geometry
• Narrative storytelling
• Probabilistic outcome modeling

The engine must detect both:

Corrective setups  
Impulse setups

Both must be evaluated and scored independently.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

EXECUTION PIPELINE

The engine MUST follow this execution order:

1. Dead-Zone Filter
2. Liquidity Map Generation
3. Protected Structure Tracking
4. Narrative Detection
5. HTF Bias Validation
6. Extreme POI Validation
7. Liquidity Sweep Validation
8. Premium / Discount Validation
9. Corrective Setup Detection
10. Impulse Setup Detection
11. Probabilistic Outcome Engine
12. Structural Stop Loss Engine
13. Dynamic Take Profit Allocation
14. Output Generation

The order must never change.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

STEP 1 — DEAD ZONE FILTER

Before analysis begins the system checks for unsuitable market conditions.

Conditions evaluated:

Low Volatility  
Sparse Liquidity  
Indeterminate Structure  
Inactive Session

If two or more conditions are true:

Low Volatility = ATR < 60% of recent average  
Sparse Liquidity = nearest liquidity pool > 3× ATR distance  
Indeterminate Structure = overlapping swings without displacement  
Inactive Session = outside London or New York sessions

Then:

MARKET STATE = DEAD ZONE

The engine must return:

"Market conditions not suitable for analysis."

No trade setup must be generated.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

STEP 2 — LIQUIDITY MAP GENERATION

The engine must map all significant liquidity pools.

Detect:

Buy-Side Liquidity
Sell-Side Liquidity
Equal Highs
Equal Lows
Range Highs
Range Lows
Swing High Clusters
Swing Low Clusters
Inducement Zones
Compression Zones

Each liquidity pool must be recorded.

The engine must project the most probable liquidity path.

Example path:

Sell-Side Liquidity → Extreme POI → Buy-Side Liquidity

Liquidity pools must later influence TP targets.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

STEP 3 — PROTECTED STRUCTURE TRACKING

The engine must maintain structural memory for three layers:

HTF
Selected Timeframe
Refinement Timeframe

Each layer must track:

Protected High  
Protected Low  
Last BOS direction  
Trend Bias

Protected structure forms only after:

Sweep → Displacement → Break of Structure

Protected levels represent structural invalidation.

If protected structure breaks, the narrative must reset.

Hierarchy rule:

HTF > Selected TF > Refinement TF

Lower layers cannot override higher layers.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

STEP 4 — NARRATIVE DETECTION

Each layer must be classified into a narrative state:

Bullish Impulse  
Bearish Impulse  
Bullish Correction  
Bearish Correction  
Transition  
Structural Invalidation

These states must be derived from:

Protected structure
Recent BOS
Current price position

The engine must output narrative context before trade setups.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

STEP 5 — HTF BIAS VALIDATION

The engine must determine the macro structural direction.

Identify:

Strong High
Strong Low
Trading Range
Impulse leg
Retracement

Score HTF structure strength from 0–10.

If bias conflicts with structural logic, reject the trade.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

STEP 6 — EXTREME POI VALIDATION

A valid Extreme POI must:

Originate a Strong High or Strong Low  
Cause Break of Structure  
Sit at range boundary  
Remain unmitigated  
Be closest valid POI to the liquidity sweep

Mid-range POIs must be rejected.

Score POI strength from 0–10.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

STEP 7 — LIQUIDITY SWEEP VALIDATION

Confirm engineered liquidity sweep.

Detect:

Equal highs / lows  
Inducement traps  
Compression structures  
Sweep feeding directly into POI

Score liquidity strength from 0–10.

If no external sweep exists, reject trade.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

STEP 8 — PREMIUM / DISCOUNT VALIDATION

Bullish entries must occur in Discount.

Bearish entries must occur in Premium.

Entries near equilibrium must be rejected.

Score alignment from 0–10.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

STEP 9 — CORRECTIVE SETUP DETECTION

The engine must search lower timeframes for corrective POIs.

Timeframe scanning must follow this ladder:

D1 → H8 → H4 → H2 → H1 → M30 → M15 → M5 → M3 → M1

Corrective POI must be chosen as:

The highest scoring POI across all scanned lower timeframes.

Score must be ≥ 20.

Corrective trades must terminate at the HTF POI.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

STEP 10 — IMPULSE SETUP DETECTION

The impulse setup represents the primary continuation trade.

The impulse POI must satisfy all structural rules.

Score impulse setup independently.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

STEP 11 — PROBABILISTIC OUTCOME ENGINE

Simulate three structural outcomes:

Scenario A — IRL Reaction  
Scenario B — IRL → ERL Completion  
Scenario C — Expansion Beyond ERL

Probabilities must sum to 100%.

Total confluence score:

Structure Score (0–10)  
Liquidity Score (0–10)  
POI Score (0–10)  
Premium/Discount Score (0–10)

Maximum score = 40.

Score thresholds:

Below 20 → reject trade  
20–26 → IRL dominant  
27–33 → IRL → ERL dominant  
34–40 → Expansion dominant

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

STEP 12 — STRUCTURAL STOP LOSS ENGINE

Stop Loss must be placed using structural invalidation.

SL = max(
Protected Structure Level,
Liquidity Sweep Extreme
) ± Volatility Buffer

Stop Loss must never sit:

Inside POI  
Inside imbalance  
Inside liquidity pools

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

STEP 13 — DYNAMIC TAKE PROFIT MODEL

TP allocation must follow probability distribution.

IRL dominant:

TP1 heavy  
TP2 moderate  
TP3 small

IRL → ERL dominant:

TP1 moderate  
TP2 heavy  
TP3 small

Expansion dominant:

TP1 small  
TP2 moderate  
TP3 heavy

There is NO maximum risk-reward ratio.

Only minimum structural RR ≥ 1:3.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

STEP 14 — OUTPUT FORMAT

The engine must output:

MARKET NARRATIVE CONTEXT

HTF Narrative  
Selected Timeframe Narrative  
Refinement Narrative

LIQUIDITY MAP

Buy-Side Liquidity  
Sell-Side Liquidity  
Inducement Zones  
Projected Liquidity Path

CORRECTIVE SETUP

Direction  
Entry  
Stop Loss  
Target  
Score

IMPULSE SETUP

Direction  
Entry  
Stop Loss  
TP1  
TP2  
TP3

PROBABILISTIC MODEL

P(IRL only)  
P(IRL → ERL)  
P(Expansion)

CONFLUENCE SCORES

Structure Score  
Liquidity Score  
POI Score  
Premium/Discount Score  
Total Score

VOLATILITY CONTEXT

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DESIGN CONSTRAINT

The engine must:

• Remain deterministic  
• Never alter strategy rules dynamically  
• Never use randomness  
• Learn only through outcome calibration layers

Identical market data must always produce identical output.
`;

export const analyzeMarket = async (
  symbol: string, 
  timeframe: string, 
  includeFundamentals: boolean,
  marketContext?: string
): Promise<TradeAnalysis> => {
  const model = 'gemini-3.1-pro-preview';
  
  let prompt = `Analyze ${symbol} on ${timeframe}. 
  Include Fundamentals: ${includeFundamentals}.
  Market Context: ${marketContext || 'None'}.
  
  Strictly follow the ATHENIX ANALYSIS ENGINE v2.0. Calculate scores and probabilities deterministically.`;

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
          
          market_narrative_context: {
            type: Type.OBJECT,
            properties: {
              htf_narrative: { type: Type.STRING },
              selected_tf_narrative: { type: Type.STRING },
              refinement_narrative: { type: Type.STRING }
            },
            required: ["htf_narrative", "selected_tf_narrative", "refinement_narrative"]
          },
          
          liquidity_map: {
            type: Type.OBJECT,
            properties: {
              buy_side_liquidity: { type: Type.ARRAY, items: { type: Type.STRING } },
              sell_side_liquidity: { type: Type.ARRAY, items: { type: Type.STRING } },
              inducement_zones: { type: Type.ARRAY, items: { type: Type.STRING } },
              projected_liquidity_path: { type: Type.STRING }
            },
            required: ["buy_side_liquidity", "sell_side_liquidity", "inducement_zones", "projected_liquidity_path"]
          },
          
          corrective_setup: {
            type: Type.OBJECT,
            properties: {
              direction: { type: Type.STRING, enum: ["buy", "sell"] },
              entry: { type: Type.NUMBER },
              stop_loss: { type: Type.NUMBER },
              target: { type: Type.NUMBER },
              score: { type: Type.NUMBER }
            }
          },
          
          impulse_setup: {
            type: Type.OBJECT,
            properties: {
              direction: { type: Type.STRING, enum: ["buy", "sell"] },
              entry: { type: Type.NUMBER },
              stop_loss: { type: Type.NUMBER },
              tp1: { type: Type.NUMBER },
              tp2: { type: Type.NUMBER },
              tp3: { type: Type.NUMBER }
            }
          },

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
          
          // Legacy signal support (mapped from impulse_setup or corrective_setup)
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
        required: ["instrument", "final_decision", "reasoning", "market_phase", "execution_mode", "confluence_scores", "probabilities", "volatility_context", "market_narrative_context", "liquidity_map"]
      }
    }
  });

  if (!response.text) {
    throw new Error("Neural engine returned an empty response.");
  }

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

export const revalidateTradeSetup = async (
  originalAnalysis: TradeAnalysis,
  currentPrice: number
): Promise<string> => {
  const model = 'gemini-3-flash-preview';
  
  if (!originalAnalysis.signal) return "No active signal to validate.";

  const prompt = `
    You are the Athenix Revalidation Engine.
    
    Original Trade Details:
    Symbol: ${originalAnalysis.instrument}
    Direction: ${originalAnalysis.signal.direction}
    Entry Price: ${originalAnalysis.signal.entry_price}
    Stop Loss: ${originalAnalysis.signal.stop_loss}
    TP1: ${originalAnalysis.signal.take_profits[0]?.price}
    TP2: ${originalAnalysis.signal.take_profits[1]?.price}
    
    Current Market Price: ${currentPrice}
    
    Rules for Status Determination:
    1. If price has hit Stop Loss level (breached SL) -> 'Setup Invalidated'
    2. If price has hit TP1 or higher -> 'Secure Partial Profits'
    3. If price moved significantly in favor (>50% to TP1) but hasn't hit TP -> 'Move SL to Break Even'
    4. If price is hovering near entry or in drawdown but still respecting SL -> 'Setup Still Valid'
    
    OUTPUT ONLY ONE OF THE FOLLOWING STRINGS:
    - "Setup Still Valid"
    - "Secure Partial Profits"
    - "Move SL to Break Even"
    - "Setup Invalidated"
  `;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      temperature: 0.1,
      responseMimeType: "text/plain"
    }
  });
  
  return response.text?.trim() || "Setup Still Valid";
};
