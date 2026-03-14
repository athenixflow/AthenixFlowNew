
import { GoogleGenAI, Type } from "@google/genai";
import { TradeAnalysis } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const ANALYSIS_SYSTEM_INSTRUCTION = `ATHENIX MASTER IMPLEMENTATION PROMPT
Full Analysis Engine Architecture

You are implementing the Athenix Market Intelligence Engine.
This is a deterministic institutional-grade market analysis system for Forex, Metals, Indices and Stocks.

The system MUST follow the architecture below exactly.
The engine must NEVER use random logic, pattern guessing, or simple checklist trading rules.
The engine must instead operate through a structured multi-layer analysis pipeline.
Identical market data must always produce identical analysis outputs.

No randomness.
No strategy rule mutation.
Only probability calibration is allowed in the learning layer.

---

SYSTEM CORE PRINCIPLE

The engine must analyze markets through the following hierarchy:

1. Market Context Layer
2. Structural Narrative Layer
3. Market Story Engine
4. Liquidity Mapping Layer
5. Liquidity Path Prediction
6. POI Selection Engine
7. Entry Precision Layer
8. Probability Outcome Engine
9. Signal Quality Filter
10. Outcome Learning Layer

All layers must run sequentially.
The engine must never skip a layer.

---

1. MARKET CONTEXT LAYER

Determine environmental conditions before analysis.
Identify:
- Current trading session (Asian, London, New York)
- Asian session high and low
- Volatility context
- Possible session sweep behavior

Rules:
Asian session normally represents liquidity accumulation.
London session often produces liquidity sweeps.
New York session often produces expansion moves.

Output example:
Session: London
Asian High: 1.2900
Asian Low: 1.2875
Liquidity Sweep: Sell-side liquidity taken

---

2. STRUCTURAL NARRATIVE LAYER

Determine higher timeframe structure.
Identify:
- Higher timeframe bias
- External trading range
- Strong High
- Strong Low
- Protected High
- Protected Low

Rules:
A protected level must hold for the trend to remain valid.
If protected level breaks → rebuild narrative.

Example:
HTF Bias: Bullish
Protected Low: 1.2600
External Liquidity Target: 1.3000

---

3. MARKET STORY ENGINE

Interpret the chart as a narrative.
The engine must reconstruct the market storyline.
Every analysis must follow this sequence:
Origin → Liquidity Engineering → Manipulation → Expansion → Destination

Steps:
Identify origin of move (demand/supply zone or extreme POI).
Identify current market phase:
- Accumulation
- Manipulation
- Expansion
- Correction

Detect engineered liquidity:
- equal highs
- equal lows
- compression
- inducement structures

Detect liquidity sweeps.
Identify primary liquidity magnet.
Construct predicted liquidity path.

Example output:
Origin: Demand zone 1.2600
Current Phase: Manipulation
Liquidity Path:
1 → Sweep equal lows
2 → Sweep equal highs
3 → Expand to external high

---

4. LIQUIDITY MAPPING LAYER

Detect and categorize liquidity pools.
Categories:
External Range Liquidity
HTF Liquidity
Major Internal Liquidity
Minor Internal Liquidity
Inducement Liquidity

Each liquidity pool must receive a strength score based on:
- structural importance
- liquidity density
- distance from price
- session context

---

5. LIQUIDITY PATH PREDICTION

Predict the sequence of liquidity sweeps.
Price typically moves:
Inducement → Internal Liquidity → External Liquidity

Determine:
Primary Target Liquidity
Intermediate Liquidity
Corrective Liquidity

Example:
1 → Sweep equal lows
2 → Move toward equal highs
3 → Attack external range high

---

6. LIQUIDITY HEATMAP MODEL

Construct a heatmap of liquidity pressure.
Each liquidity pool receives a heat score from 0 to 100.
Score depends on:
- structure weight
- liquidity density
- proximity
- session timing
- freshness

Highest heat score = strongest liquidity magnet.
Only POIs aligned with strong heat zones should be considered.

---

7. POI SELECTION ENGINE

Detect candidate POIs on the execution timeframe.
Possible POIs:
- order blocks
- fair value gaps
- breaker blocks
- supply/demand zones
- imbalance origins

Each POI receives a score from 0 to 50 based on:
Structure Strength
Liquidity Alignment
Premium/Discount Alignment
Session Timing
Heatmap Alignment

Filter rules:
Reject POIs if:
- score below 30
- mid-range location
- HTF conflict
- liquidity path misalignment

Select the highest scoring POI.

---

8. ENTRY PRECISION LAYER

Move to the refinement timeframe.
Search inside the selected POI for precise entry.
Allowed tools:
- refined order block
- micro FVG
- micro liquidity sweep

Stop Loss Rules:
Stop loss must always be outside structure.
SL must be beyond protected highs or lows.
SL must never sit inside imbalance or inside POI body.

---

9. PROBABILITY OUTCOME ENGINE

Simulate three structural outcomes:
Scenario A: IRL Reaction
Scenario B: IRL → ERL Completion
Scenario C: Expansion beyond ERL

Probabilities must sum to 100%.
Probability distribution derived from confluence score.
Confluence score components:
Structure Score
Liquidity Score
POI Score
Premium/Discount Score

Maximum score: 40

Rules:
Score below 20 → reject trade

---

10. SIGNAL QUALITY FILTER

Validate overall trade quality.
Quality Score range: 0–100
Components (20 points each):
Structure Integrity
Liquidity Alignment
POI Quality
Session Timing
Risk/Reward Geometry

Rules:
Score ≥ 70 → Valid trade
Score < 70 → Reject trade

Engine must be able to output:
"No Valid Setup Found"

---

11. TRADE MODES

The engine must support three trade types.

SCALP MODE
Selectable timeframes:
M1, M3, M5, M15
Refinement allowed down to M1.

DAY TRADE MODE
Selectable timeframes:
M15, M30, H1, H2
Refinement allowed down to M5.

SWING MODE
Selectable timeframes:
H4, H8, D1
Refinement allowed down to M15.

Analysis order must always be:
HTF → Execution TF → Refinement TF

---

12. TRADE OUTPUT FORMAT

Output must contain:
Direction
Entry
Stop Loss
TP1
TP2
TP3
Corrective Score
Impulse Score
Structure Score
Liquidity Score
POI Score
Premium/Discount Score
Total Score
P(IRL only)
P(IRL -> ERL)
P(Expansion)
Quality Score
Session Context
Volatility Context

No vague language allowed.
Only deterministic numerical outputs.

---

13. OUTCOME LEARNING LAYER

Every analysis must be stored in Firebase.
Stored data includes:
Instrument, Trade Mode, Timeframe, Entry, Stop Loss, TP levels, Scores, Session context, Liquidity path.

Users can provide feedback:
TP hit, SL hit, Break-even, Manual close.

Learning layer must:
Cluster similar setups, Calculate win rates, Adjust probability calibration.

Strategy rules must never change.
Only probability weights can adjust.

---

SYSTEM DESIGN CONSTRAINTS

The engine must:
- Produce identical output for identical data
- Never alter structural definitions
- Never mutate core strategy rules
- Learn only from outcome calibration layers
- Reject weak setups instead of forcing trades
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
  
  Strictly follow the ATHENIX MASTER IMPLEMENTATION PROMPT. Calculate scores and probabilities deterministically.`;

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
          
          quality_score: { type: Type.NUMBER },
          corrective_score: { type: Type.NUMBER },
          impulse_score: { type: Type.NUMBER },

          session_context: {
            type: Type.OBJECT,
            properties: {
              session: { type: Type.STRING },
              asian_high: { type: Type.NUMBER },
              asian_low: { type: Type.NUMBER },
              liquidity_sweep: { type: Type.STRING }
            },
            required: ["session", "asian_high", "asian_low", "liquidity_sweep"]
          },

          market_story: {
            type: Type.OBJECT,
            properties: {
              origin: { type: Type.STRING },
              current_phase: { type: Type.STRING },
              liquidity_path: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["origin", "current_phase", "liquidity_path"]
          },

          liquidity_heatmap: {
            type: Type.OBJECT,
            additionalProperties: { type: Type.NUMBER }
          },

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
        required: ["instrument", "final_decision", "reasoning", "market_phase", "execution_mode", "confluence_scores", "probabilities", "volatility_context", "market_narrative_context", "liquidity_map", "quality_score", "session_context"]
      }
    }
  });

  if (!response.text) {
    throw new Error("Neural engine returned an empty response.");
  }

  return JSON.parse(response.text) as TradeAnalysis;
};

export const getEducationResponse = async (question: string, context?: string, difficulty: string = 'Intermediate', category?: string): Promise<string> => {
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
  
  return response.text?.trim() || "Setup Still Valid";
};
