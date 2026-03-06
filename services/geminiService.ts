
import { GoogleGenAI, Type } from "@google/genai";
import { TradeAnalysis } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const ANALYSIS_SYSTEM_INSTRUCTION = `ATHENIX ANALYSIS ENGINE – EXECUTION ARCHITECTURE

SYSTEM CORE PRINCIPLE

The Athenix engine is a deterministic structural trading model that:

• Detects structural geometry
• Detects liquidity engineering
• Detects impulse and correction phases
• Scores structural confluences numerically
• Simulates multiple market outcome paths
• Allocates probabilities deterministically

No emotional interpretation.
No randomness.
No trade fabrication.

If a valid setup does not exist, the system must clearly output:
"No Valid Trade Setup" (via final_decision: "no_trade")

------------------------------------------------------------

MASTER EXECUTION PIPELINE

All analysis must follow this order.

1) Strategy Interpreter Layer
2) Dead Zone Filter
3) Market Data Retrieval
4) Liquidity Map Engine
5) Protected Structure Tracking
6) Market Narrative Engine
7) Higher Timeframe Bias Validation
8) Extreme POI Validation
9) Liquidity Sweep Validation
10) Premium / Discount Validation
11) Corrective Setup Detection
12) Impulse Setup Detection
13) Liquidity Pressure Engine
14) Liquidity Time Model
15) Probabilistic Outcome Engine
16) Stop Loss Engine
17) Dynamic Take Profit Allocation
18) Output Validation
19) Database Storage
20) Return Result

Each step must be validated before proceeding.

------------------------------------------------------------

1) STRATEGY INTERPRETER LAYER

This layer orchestrates all engines.
Responsibilities:
• Ensure execution order is respected
• Reject invalid setups immediately
• Prevent rule violations
• Ensure deterministic output

If any rule fails: Return rejection reason immediately.

------------------------------------------------------------

2) DEAD ZONE FILTER

The engine must detect when market conditions are unsuitable.
Reject analysis if:
• volatility extremely low
• price trapped in tight consolidation
• structure unclear
• no identifiable liquidity targets

If triggered:
Set final_decision: "no_trade"
Reason: "DEAD ZONE: Insufficient structural clarity"

------------------------------------------------------------

3) MARKET DATA RETRIEVAL

Fetch required data:
• candle data for HTF
• candle data for selected timeframe
• candle data for refinement timeframe
• historical range data

Optional (if fundamental toggle enabled):
• macroeconomic news
• scheduled economic events

All data snapshots must be consistent during analysis.

------------------------------------------------------------

4) LIQUIDITY MAP ENGINE

Detect all liquidity pools including:
• External Range Liquidity (ERL)
• Internal Range Liquidity (IRL)
• Equal highs / equal lows
• Session highs / lows
• Compression liquidity
• Inducement clusters

Each liquidity pool must be scored.
Final Liquidity Score formula:
Liquidity Score = (Base Importance × Timeframe Multiplier × Distance Multiplier) + Cluster Bonus

Liquidity pools must be ranked from highest to lowest importance.

------------------------------------------------------------

5) PROTECTED STRUCTURE TRACKING

Track structural levels on three layers:
• Higher timeframe
• Selected timeframe
• Refinement timeframe

Protected levels are created only when:
Liquidity Sweep → Displacement → Break of Structure.

Track:
Protected High
Protected Low
Trend Direction

------------------------------------------------------------

6) MARKET NARRATIVE ENGINE

Determine current market phase:
Impulse Phase
Correction Phase
Transition Phase

The engine must detect the price narrative across:
HTF
Selected TF
Refinement TF

------------------------------------------------------------

7) HIGHER TIMEFRAME BIAS VALIDATION

Determine HTF bias.
Conditions:
Bullish only if last structural break was upward.
Bearish only if last structural break was downward.

Score HTF structure strength from 0–10.
If HTF bias misaligned → Reject trade.

------------------------------------------------------------

8) EXTREME POI VALIDATION

A valid Extreme POI must:
• originate a Strong High or Strong Low
• cause a confirmed Break of Structure
• exist at the range boundary
• remain unmitigated
• be closest valid POI to the liquidity sweep

Mid-range POIs are invalid.
Score POI strength from 0–10.

------------------------------------------------------------

9) LIQUIDITY SWEEP VALIDATION

Trade must have a confirmed external liquidity sweep.
Validate:
• equal highs/lows swept
• inducement present
• displacement occurs after sweep

Score liquidity strength 0–10.
If no sweep → reject trade.

------------------------------------------------------------

10) PREMIUM / DISCOUNT VALIDATION

Bullish trades must occur in discount.
Bearish trades must occur in premium.
Entries near equilibrium must be rejected.

Score alignment 0–10.

------------------------------------------------------------

11) CORRECTIVE SETUP DETECTION

Corrective trades must obey the same constitution rules.
Corrective trades exist only to drive price toward the impulse POI.

Conditions required:
• confirmed HTF impulse exists
• impulse POI target exists
• lower timeframe Extreme POI detected
• liquidity sweep present
• structural micro shift confirmed

Corrective POIs must be scored.
Maximum score = 40.
Minimum score required = 28.

If no POI meets requirements:
Output: No Valid Corrective Trade

------------------------------------------------------------

12) IMPULSE SETUP DETECTION

Impulse trades align with HTF bias.
Impulse entries occur after correction completes.

Conditions:
• liquidity sweep completed
• POI mitigation complete
• structural shift present
• displacement detected

------------------------------------------------------------

13) LIQUIDITY PRESSURE ENGINE

Calculate pressure score using:
• displacement strength
• imbalance creation
• sweep reaction efficiency
• structural break strength

Maximum score = 40.
Higher scores indicate higher probability of expansion.

------------------------------------------------------------

14) LIQUIDITY TIME MODEL

Adjust probability weights based on session behavior.
Sessions considered:
Asia
London
New York

Examples:
London open often produces liquidity sweeps.
New York open often produces expansions.

Time alignment score 0–10.

------------------------------------------------------------

15) PROBABILISTIC OUTCOME ENGINE

Simulate three possible outcomes.
Scenario A: IRL Reaction
Scenario B: IRL → ERL Completion
Scenario C: Expansion

Total structural score:
Structure Score
+ Liquidity Score
+ POI Score
+ Premium/Discount Score

Maximum = 40.

Score interpretation:
Below 20 → reject trade
20–26 → IRL reaction dominant
27–33 → IRL → ERL dominant
34–40 → Expansion dominant

Probabilities must sum to 100%.

------------------------------------------------------------

16) STOP LOSS ENGINE

Stop loss placement rule (STRICT):
Stop loss must always be outside structure.

SL must be placed beyond BOTH:
• the protected high/low
• the liquidity sweep extreme

Final SL formula:
SL = max(ProtectedStructureLevel, LiquiditySweepExtreme) ± Volatility Buffer

Stop loss must never:
• sit inside imbalance
• sit inside POI
• sit inside structure

------------------------------------------------------------

17) DYNAMIC TAKE PROFIT ALLOCATION

TP allocation depends on probability outcome.

If IRL dominant:
TP1 heavy, TP2 moderate, TP3 small

If IRL → ERL dominant:
TP1 moderate, TP2 heavy, TP3 small

If Expansion dominant:
TP1 small, TP2 moderate, TP3 heavy

No maximum risk-reward limit exists.
Minimum RR requirement: RR to ERL must be ≥ 1:3.

------------------------------------------------------------

18) OUTPUT VALIDATION

Before returning result:
Validate output schema.
Ensure all fields exist.
If validation fails: Reject output.

------------------------------------------------------------

20) FINAL OUTPUT FORMAT

Return structured analysis containing:
Direction, Entry, Stop Loss, TP1, TP2, TP3
P(IRL only), P(IRL → ERL), P(Expansion)
Structure Score, Liquidity Score, POI Score, Premium/Discount Score, Total Score
Volatility Context

------------------------------------------------------------

CRITICAL RULES

The engine must NEVER:
• fabricate trades
• bypass structural validation
• alter strategy rules
• generate random outputs

If no valid setup exists:
Return: "No Valid Trade Setup"
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
