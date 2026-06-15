/**
 * ============================================================================
 *  AthenixFlow — STRUCTURE INTELLIGENCE ENGINE  (pure, additive helper module)
 * ============================================================================
 *  Adapts the "Master Integration Prompt" to AthenixFlow's real architecture:
 *  the trade engine is a Gemini LLM (api/_lib/analysisEngine.js) — there is no
 *  procedural entry/SL/TP engine. So per the approved plan, these helpers DO NOT
 *  override the LLM's levels. They compute pattern / multi-timeframe / liquidity /
 *  confidence intelligence from candle data and:
 *    (a) feed it to the LLM as ADDITIVE context (via marketContext), and
 *    (b) surface it to the user as a supporting "Structure Intelligence" read.
 *  The LLM remains the single author of entry/stop/TP. Nothing here mutates
 *  shared state; every function is pure (candles in -> result out).
 *
 *  SECTIONS
 *    1. Types & candle normalization
 *    2. CORRELATION_MAP + getModeConfig            (master prompt §1, §2)
 *    3. mapLiquidityZones                          (§4)
 *    4. detectPatterns                             (§3)
 *    5. checkMultiTimeframeConfluence              (§2)
 *    6. computeConfidenceScore                     (§8, §9)
 *    7. computeStructureFacts / scoreSignal        (§10, §11 orchestrators)
 * ============================================================================
 */

// ---------------------------------------------------------------------------
// 1. Types & candle normalization
// ---------------------------------------------------------------------------
export type ExecutionMode = 'scalp' | 'day_trade' | 'swing_trade';
export type Direction = 'buy' | 'sell' | undefined;
export type Trend = 'up' | 'down' | 'neutral';
export type Confluence = 'high' | 'medium' | 'low';

export interface Candle { t: string; o: number; h: number; l: number; c: number; }

export interface PatternHit { type: string; index: number; level: number; strength: number; }

export type PDZone = 'deep_discount' | 'discount' | 'equilibrium' | 'premium' | 'deep_premium';
export interface PremiumDiscount { rangeHigh: number; rangeLow: number; equilibrium: number; positionPct: number; zone: PDZone; }

export interface POI { type: 'bullish' | 'bearish'; low: number; high: number; index: number; kind: 'fvg' | 'order_block'; }
export interface SuggestedEntry { direction: 'buy' | 'sell'; zoneLow: number; zoneHigh: number; basis: 'order_block' | 'fvg' | 'ote'; inOTE: boolean; }

export interface StructureFacts {
  mode: ExecutionMode;
  entryTimeframe: string;
  correlationTimeframes: (string | null)[];
  modeProfile: ModeParams;
  patterns: PatternHit[];
  primaryPattern: PatternHit | null;
  liquidity: { swingHighs: number[]; swingLows: number[]; sweepZones: number[] };
  trends: { entry: Trend; mid: Trend; macro: Trend };
  higherTFData: { tf: string; trend: Trend }[];
  premiumDiscount: PremiumDiscount | null;
  suggestedEntry: SuggestedEntry | null;
}

export interface StructureIntelligence {
  mode: ExecutionMode;
  entryTimeframe: string;
  correlationTimeframes: (string | null)[];
  patternDetected: { type: string; strength: number } | null;
  confluence: Confluence;
  liquiditySweepZones: number[];
  macroApplied: boolean;
  confidenceScore: number; // 0-100
  premiumDiscount: PremiumDiscount | null;
  suggestedEntry: SuggestedEntry | null;
}

// Twelve Data `values` are newest-first, OHLC as strings. Normalize to numeric
// candles ordered OLDEST -> NEWEST so index increases with time.
export function toCandles(values: any[]): Candle[] {
  if (!Array.isArray(values)) return [];
  return values
    .map((v) => ({
      t: v?.datetime ?? '',
      o: parseFloat(v?.open),
      h: parseFloat(v?.high),
      l: parseFloat(v?.low),
      c: parseFloat(v?.close)
    }))
    .filter((c) => Number.isFinite(c.o) && Number.isFinite(c.h) && Number.isFinite(c.l) && Number.isFinite(c.c))
    .reverse();
}

const round = (n: number) => Math.round(n * 1e6) / 1e6;
const avgRange = (c: Candle[]) => (c.length ? c.slice(-20).reduce((s, x) => s + (x.h - x.l), 0) / Math.min(20, c.length) : 0);

// ---------------------------------------------------------------------------
// 2. CORRELATION_MAP + getModeConfig
// ---------------------------------------------------------------------------
// Editable mode -> { entryTF: [midTF, macroTF] }, in app timeframe tokens that
// /api/market supports (M1,M3,M5,M15,M30,H1,H2,H4,H8,D1,W1). `null` => single-TF.
export const CORRELATION_MAP: Record<ExecutionMode, Record<string, [string, string | null]>> = {
  scalp:       { M1: ['M5', 'M15'], M3: ['M15', 'H1'], M5: ['M15', 'H1'], M15: ['H1', 'H4'] },
  day_trade:   { M15: ['H1', 'H4'], M30: ['H2', 'H4'], H1: ['H4', 'D1'], H2: ['H4', 'D1'] },
  swing_trade: { H4: ['D1', 'W1'], H8: ['D1', 'W1'], D1: ['W1', null] }
};

const TF_LADDER = ['M1', 'M3', 'M5', 'M15', 'M30', 'H1', 'H2', 'H4', 'D1', 'W1'];
function inferCorrelation(entryTimeframe: string): [string, string | null] {
  const i = TF_LADDER.indexOf(String(entryTimeframe).toUpperCase());
  if (i < 0) return ['H1', 'H4'];
  return [TF_LADDER[Math.min(i + 2, TF_LADDER.length - 1)] || null as any, TF_LADDER[Math.min(i + 4, TF_LADDER.length - 1)] || null];
}

export interface ModeParams {
  stopWeight: 'tight' | 'medium' | 'wide';
  targetWeight: 'near' | 'balanced' | 'far';
  patternPriority: string[];
  sweepWeight: number;
  macroWeight: number;
}

const MODE_PARAMS: Record<ExecutionMode, ModeParams> = {
  scalp:       { stopWeight: 'tight',  targetWeight: 'near',     patternPriority: ['pin_bar', 'false_breakout', 'rejected_wick', 'engulfing', 'inside_bar'], sweepWeight: 1.3, macroWeight: 0.5 },
  day_trade:   { stopWeight: 'medium', targetWeight: 'balanced', patternPriority: ['engulfing', 'inside_bar', 'double_top', 'double_bottom', 'pin_bar', 'false_breakout'], sweepWeight: 1.0, macroWeight: 1.0 },
  swing_trade: { stopWeight: 'wide',   targetWeight: 'far',      patternPriority: ['double_top', 'double_bottom', 'engulfing', 'pin_bar'], sweepWeight: 0.8, macroWeight: 1.5 }
};

export function getModeConfig(mode: ExecutionMode | undefined, entryTimeframe: string) {
  const m: ExecutionMode = mode && MODE_PARAMS[mode] ? mode : 'day_trade';
  const tf = String(entryTimeframe || '').toUpperCase();
  const correlationTimeframes = (CORRELATION_MAP[m] && CORRELATION_MAP[m][tf]) || inferCorrelation(tf);
  return { mode: m, params: MODE_PARAMS[m], correlationTimeframes };
}

// ---------------------------------------------------------------------------
// 3. Liquidity zone mapping (§4)
// ---------------------------------------------------------------------------
function swingPoints(candles: Candle[], lookback = 2) {
  const highs: { i: number; price: number }[] = [];
  const lows: { i: number; price: number }[] = [];
  for (let i = lookback; i < candles.length - lookback; i++) {
    let isHigh = true, isLow = true;
    for (let j = 1; j <= lookback; j++) {
      if (candles[i].h <= candles[i - j].h || candles[i].h <= candles[i + j].h) isHigh = false;
      if (candles[i].l >= candles[i - j].l || candles[i].l >= candles[i + j].l) isLow = false;
    }
    if (isHigh) highs.push({ i, price: candles[i].h });
    if (isLow) lows.push({ i, price: candles[i].l });
  }
  return { highs, lows };
}

export function mapLiquidityZones(candles: Candle[]) {
  if (candles.length < 6) return { swingHighs: [], swingLows: [], sweepZones: [] as number[] };
  const { highs, lows } = swingPoints(candles);
  const swingHighs = highs.slice(-10).map((h) => round(h.price));
  const swingLows = lows.slice(-10).map((l) => round(l.price));
  // Sweep zones = the most recent unmitigated swing highs/lows price is likely
  // to reach for liquidity before reversing/continuing.
  const sweepZones = [...swingHighs.slice(-3), ...swingLows.slice(-3)];
  return { swingHighs, swingLows, sweepZones };
}

// ---------------------------------------------------------------------------
// 3b. Premium / Discount (fib EQ) + POI (FVG / order block) + suggested entry
// ---------------------------------------------------------------------------
// Premium/Discount: fib across the recent dealing range; 50% = equilibrium.
// >50% premium (favor sells), <50% discount (favor buys). Computed locally from
// the candles we already have — not a Twelve Data indicator.
export function computePremiumDiscount(candles: Candle[], window = 40): PremiumDiscount | null {
  if (candles.length < 5) return null;
  const seg = candles.slice(-window);
  const rangeHigh = Math.max(...seg.map((c) => c.h));
  const rangeLow = Math.min(...seg.map((c) => c.l));
  const r = rangeHigh - rangeLow;
  if (!Number.isFinite(r) || r <= 0) return null;
  const price = candles[candles.length - 1].c;
  const positionPct = Math.max(0, Math.min(100, ((price - rangeLow) / r) * 100));
  const zone: PDZone =
    positionPct >= 75 ? 'deep_premium' :
    positionPct > 52 ? 'premium' :
    positionPct >= 48 ? 'equilibrium' :
    positionPct > 25 ? 'discount' : 'deep_discount';
  return { rangeHigh: round(rangeHigh), rangeLow: round(rangeLow), equilibrium: round((rangeHigh + rangeLow) / 2), positionPct: Math.round(positionPct), zone };
}

// Fair value gaps (3-candle imbalances).
export function detectFVGs(candles: Candle[]): POI[] {
  const out: POI[] = [];
  for (let i = 2; i < candles.length; i++) {
    const a = candles[i - 2], c = candles[i];
    if (a.h < c.l) out.push({ type: 'bullish', low: round(a.h), high: round(c.l), index: i, kind: 'fvg' });
    else if (a.l > c.h) out.push({ type: 'bearish', low: round(c.h), high: round(a.l), index: i, kind: 'fvg' });
  }
  return out;
}

// Order blocks: last opposing candle immediately before a displacement candle.
export function detectOrderBlocks(candles: Candle[]): POI[] {
  const out: POI[] = [];
  for (let i = 1; i < candles.length - 1; i++) {
    const ob = candles[i], next = candles[i + 1];
    const down = ob.c < ob.o, up = ob.c > ob.o;
    if (down && next.c > ob.h) out.push({ type: 'bullish', low: round(ob.l), high: round(ob.h), index: i, kind: 'order_block' });
    else if (up && next.c < ob.l) out.push({ type: 'bearish', low: round(ob.l), high: round(ob.h), index: i, kind: 'order_block' });
  }
  return out;
}

const overlaps = (aLo: number, aHi: number, bLo: number, bHi: number) => aLo <= bHi && bLo <= aHi;

// Suggested entry zone = the nearest valid POI on the bias side (+ OTE band).
// Supports/displays only — never replaces the LLM's entry.
export function buildSuggestedEntry(candles: Candle[], pd: PremiumDiscount | null): SuggestedEntry | null {
  if (!pd || candles.length < 5) return null;
  const bias: 'buy' | 'sell' | null =
    pd.zone === 'discount' || pd.zone === 'deep_discount' ? 'buy' :
    pd.zone === 'premium' || pd.zone === 'deep_premium' ? 'sell' : null;
  if (!bias) return null;

  const price = candles[candles.length - 1].c;
  const r = pd.rangeHigh - pd.rangeLow;
  // OTE 0.62–0.79 retracement of the dealing-range leg.
  const ote = bias === 'buy'
    ? { low: round(pd.rangeHigh - 0.79 * r), high: round(pd.rangeHigh - 0.62 * r) }
    : { low: round(pd.rangeLow + 0.62 * r), high: round(pd.rangeLow + 0.79 * r) };

  const wantType = bias === 'buy' ? 'bullish' : 'bearish';
  const pois = [...detectFVGs(candles), ...detectOrderBlocks(candles)]
    .filter((p) => p.type === wantType)
    // POI must sit on the retracement side of price (below for buy, above for sell).
    .filter((p) => (bias === 'buy' ? p.high <= price : p.low >= price));

  // Nearest POI to current price.
  const dist = (p: POI) => bias === 'buy' ? price - p.high : p.low - price;
  const nearest = pois.filter((p) => dist(p) >= 0).sort((a, b) => dist(a) - dist(b))[0] || null;

  if (nearest) {
    return {
      direction: bias,
      zoneLow: nearest.low,
      zoneHigh: nearest.high,
      basis: nearest.kind,
      inOTE: overlaps(nearest.low, nearest.high, ote.low, ote.high)
    };
  }
  // Fall back to the OTE band when no clean POI is present.
  return { direction: bias, zoneLow: ote.low, zoneHigh: ote.high, basis: 'ote', inOTE: true };
}

// ---------------------------------------------------------------------------
// 4. Pattern detection (§3) — evaluated at the latest candle, near key levels
// ---------------------------------------------------------------------------
const nearLevel = (price: number, levels: number[], tol: number) => {
  let best: number | null = null, bestD = Infinity;
  for (const lv of levels) { const d = Math.abs(price - lv); if (d <= tol && d < bestD) { best = lv; bestD = d; } }
  return best;
};

export function detectPatterns(candles: Candle[], levels: number[]): PatternHit[] {
  const out: PatternHit[] = [];
  const n = candles.length;
  if (n < 3) return out;
  const tol = Math.max(avgRange(candles) * 0.5, 1e-9);
  const c = candles[n - 1], p = candles[n - 2];
  const idx = n - 1;
  const body = Math.abs(c.c - c.o);
  const range = Math.max(c.h - c.l, 1e-9);
  const upWick = c.h - Math.max(c.o, c.c);
  const dnWick = Math.min(c.o, c.c) - c.l;
  const lvl = nearLevel(c.c, levels, tol);
  const at = (price = c.c) => nearLevel(price, levels, tol);

  // Pin bar / rejected wick: small body, one long wick (>= 2x body), at a level.
  if (body < 0.5 * range && (upWick >= 2 * body || dnWick >= 2 * body)) {
    const wickRatio = Math.max(upWick, dnWick) / Math.max(body, 1e-9);
    const strength = Math.min(100, 40 + wickRatio * 12 + (lvl != null ? 20 : 0));
    out.push({ type: dnWick >= upWick ? 'pin_bar' : 'pin_bar', index: idx, level: lvl ?? c.c, strength });
    const rejLvl = at(dnWick > upWick ? c.l : c.h);
    if (rejLvl != null) out.push({ type: 'rejected_wick', index: idx, level: rejLvl, strength: Math.min(100, strength + 5) });
  }

  // Engulfing: current body fully engulfs prior body, at a level.
  const pBodyHi = Math.max(p.o, p.c), pBodyLo = Math.min(p.o, p.c);
  const cBodyHi = Math.max(c.o, c.c), cBodyLo = Math.min(c.o, c.c);
  if (cBodyLo <= pBodyLo && cBodyHi >= pBodyHi && body > Math.abs(p.c - p.o)) {
    const strength = Math.min(100, 45 + (body / Math.max(Math.abs(p.c - p.o), 1e-9)) * 10 + (lvl != null ? 20 : 0));
    out.push({ type: 'engulfing', index: idx, level: lvl ?? c.c, strength });
  }

  // Inside bar: current range contained within prior range.
  if (c.h <= p.h && c.l >= p.l) {
    out.push({ type: 'inside_bar', index: idx, level: lvl ?? c.c, strength: 45 + (lvl != null ? 15 : 0) });
  }

  // False breakout: broke a level then closed back inside it.
  for (const L of levels) {
    if ((c.h > L && c.c < L) || (c.l < L && c.c > L)) {
      const pierce = Math.max(c.h - L, L - c.l) / range;
      out.push({ type: 'false_breakout', index: idx, level: round(L), strength: Math.min(100, 50 + pierce * 30) });
      break;
    }
  }

  // Double top / bottom: two recent ~equal swing extremes with a reaction between.
  const { highs, lows } = swingPoints(candles);
  const eqTol = tol;
  const lastTwo = (arr: { i: number; price: number }[]) => arr.slice(-2);
  const dt = lastTwo(highs);
  if (dt.length === 2 && Math.abs(dt[0].price - dt[1].price) <= eqTol && dt[1].i - dt[0].i >= 2) {
    out.push({ type: 'double_top', index: dt[1].i, level: round((dt[0].price + dt[1].price) / 2), strength: 70 });
  }
  const db = lastTwo(lows);
  if (db.length === 2 && Math.abs(db[0].price - db[1].price) <= eqTol && db[1].i - db[0].i >= 2) {
    out.push({ type: 'double_bottom', index: db[1].i, level: round((db[0].price + db[1].price) / 2), strength: 70 });
  }

  return out;
}

// Pick the highest-priority detected pattern for the mode (falls back to strongest).
function primaryFor(patterns: PatternHit[], priority: string[]): PatternHit | null {
  if (!patterns.length) return null;
  for (const type of priority) {
    const hit = patterns.filter((p) => p.type === type).sort((a, b) => b.strength - a.strength)[0];
    if (hit) return hit;
  }
  return [...patterns].sort((a, b) => b.strength - a.strength)[0];
}

// ---------------------------------------------------------------------------
// 5. Multi-timeframe confluence (§2) — checks HIGHER timeframes only
// ---------------------------------------------------------------------------
export function trendOf(candles: Candle[]): Trend {
  if (candles.length < 8) return 'neutral';
  const recent = candles.slice(-20);
  const first = recent[0].c, last = recent[recent.length - 1].c;
  if (!Number.isFinite(first) || first === 0) return 'neutral';
  const change = (last - first) / first;
  if (change > 0.002) return 'up';
  if (change < -0.002) return 'down';
  return 'neutral';
}

export function checkMultiTimeframeConfluence(direction: Direction, higherTFData: { tf: string; trend: Trend }[]): Confluence {
  const tfs = (higherTFData || []).filter((x) => x && x.trend);
  if (!tfs.length || !direction) return 'medium'; // no higher-TF data / no direction yet -> neutral
  const want: Trend = direction === 'buy' ? 'up' : 'down';
  const agree = tfs.filter((x) => x.trend === want).length;
  const against = tfs.filter((x) => x.trend !== want && x.trend !== 'neutral').length;

  if (tfs.length >= 2) {
    if (agree >= 2) return 'high';
    if (agree === 1 && against === 0) return 'medium';
    if (against >= 2) return 'low';
    return agree === 1 ? 'medium' : 'low';
  }
  // Single-TF fallback (thin data)
  if (agree === 1) return 'medium';
  return tfs[0].trend === 'neutral' ? 'medium' : 'low';
}

// ---------------------------------------------------------------------------
// 6. Confidence score (§8, §9)
// ---------------------------------------------------------------------------
const CONFLUENCE_VALUE: Record<Confluence, number> = { high: 100, medium: 60, low: 25 };

export function computeConfidenceScore(
  parts: { patternStrength: number; confluence: number; liquidityFavorability: number; macroSupport: number },
  macroOn: boolean
): number {
  let w = { pattern: 0.4, confluence: 0.3, liquidity: 0.2, macro: 0.1 };
  if (!macroOn) {
    // Redistribute macro's 0.10 across the other three in proportion (0.4:0.3:0.2).
    w = { pattern: 0.4 + 0.1 * (0.4 / 0.9), confluence: 0.3 + 0.1 * (0.3 / 0.9), liquidity: 0.2 + 0.1 * (0.2 / 0.9), macro: 0 };
  }
  const clamp = (v: number) => Math.max(0, Math.min(100, v || 0));
  const score =
    w.pattern * clamp(parts.patternStrength) +
    w.confluence * clamp(parts.confluence) +
    w.liquidity * clamp(parts.liquidityFavorability) +
    w.macro * clamp(parts.macroSupport);
  return Math.round(score);
}

// ---------------------------------------------------------------------------
// 7. Orchestrators (§10, §11)
// ---------------------------------------------------------------------------
// Direction-agnostic facts computed BEFORE the LLM call (fed in as context).
export function computeStructureFacts(input: {
  entryCandles: any[];
  midCandles?: any[] | null;
  macroCandles?: any[] | null;
  mode: ExecutionMode | undefined;
  entryTimeframe: string;
}): StructureFacts {
  const entry = toCandles(input.entryCandles);
  const mid = input.midCandles ? toCandles(input.midCandles) : [];
  const macro = input.macroCandles ? toCandles(input.macroCandles) : [];

  const { mode, params, correlationTimeframes } = getModeConfig(input.mode, input.entryTimeframe);
  const liquidity = mapLiquidityZones(entry);
  const levels = [...liquidity.swingHighs, ...liquidity.swingLows];
  const patterns = detectPatterns(entry, levels);
  const primaryPattern = primaryFor(patterns, params.patternPriority);

  const trends = { entry: trendOf(entry), mid: trendOf(mid), macro: trendOf(macro) };
  const higherTFData: { tf: string; trend: Trend }[] = [];
  if (mid.length && correlationTimeframes[0]) higherTFData.push({ tf: correlationTimeframes[0]!, trend: trends.mid });
  if (macro.length && correlationTimeframes[1]) higherTFData.push({ tf: correlationTimeframes[1]!, trend: trends.macro });

  const premiumDiscount = computePremiumDiscount(entry);
  const suggestedEntry = buildSuggestedEntry(entry, premiumDiscount);

  return {
    mode,
    entryTimeframe: String(input.entryTimeframe || '').toUpperCase(),
    correlationTimeframes,
    modeProfile: params,
    patterns,
    primaryPattern,
    liquidity,
    trends,
    higherTFData,
    premiumDiscount,
    suggestedEntry
  };
}

// Final OUTPUT-FORMAT object computed AFTER the LLM returns its direction.
export function scoreSignal(facts: StructureFacts, direction: Direction, macroOn: boolean): StructureIntelligence {
  const confluence = checkMultiTimeframeConfluence(direction, facts.higherTFData);
  const patternStrength = facts.primaryPattern?.strength ?? 0;
  const liquidityFavorability = Math.min(
    100,
    40 + facts.liquidity.sweepZones.length * 8 + (facts.primaryPattern ? 30 : 0)
  );
  // Macro magnitude isn't surfaced to the client (FRED bias lives server-side);
  // use a neutral placeholder when the toggle is on. Confidence is driven mainly
  // by pattern + confluence + liquidity.
  const macroSupport = macroOn ? 50 : 0;

  const confidenceScore = computeConfidenceScore(
    { patternStrength, confluence: CONFLUENCE_VALUE[confluence], liquidityFavorability, macroSupport },
    macroOn
  );

  return {
    mode: facts.mode,
    entryTimeframe: facts.entryTimeframe,
    correlationTimeframes: facts.correlationTimeframes,
    patternDetected: facts.primaryPattern ? { type: facts.primaryPattern.type, strength: Math.round(facts.primaryPattern.strength) } : null,
    confluence,
    liquiditySweepZones: facts.liquidity.sweepZones,
    macroApplied: macroOn,
    confidenceScore,
    premiumDiscount: facts.premiumDiscount,
    suggestedEntry: facts.suggestedEntry
  };
}
