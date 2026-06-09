import { requireUser, checkRateLimit, capString, sendError, HttpError } from "./_lib/guard.js";
import { adminDb } from "./_lib/firebaseAdmin.js";

// Server-side market-data proxy backed by Twelve Data (forex / crypto / stocks).
// Single key: process.env.TwelveData_api. Auth-gated + rate-limited so the metered
// key is not an open cost-amplification target.

const KNOWN_QUOTES = ['USDT', 'USDC', 'USD', 'EUR', 'GBP', 'JPY', 'BTC'];

// Normalize an app symbol (e.g. EURUSD, BTCUSD, AAPL) into Twelve Data format.
function normalizeSymbol(type, raw) {
  let s = String(raw || '').trim().toUpperCase();
  if (!s) return s;
  if (s.includes('/')) return s; // already in TD "BASE/QUOTE" form

  if (type === 'stock' || type === 'indices') return s; // plain symbols

  // forex / metals: classic 6-char pair -> split 3/3
  if ((type === 'forex' || type === 'metals') && s.length === 6) {
    return `${s.slice(0, 3)}/${s.slice(3)}`;
  }

  // crypto (and any remaining): peel a known quote suffix (handles 6+ char bases)
  for (const q of KNOWN_QUOTES) {
    if (s.length > q.length && s.endsWith(q)) {
      return `${s.slice(0, s.length - q.length)}/${q}`;
    }
  }
  return s;
}

// Map an app trade timeframe to a Twelve Data interval.
// TD supports: 1min,5min,15min,30min,45min,1h,2h,4h,1day,1week,1month.
const INTERVAL_MAP = {
  M1: '1min', M3: '5min', M5: '5min', M15: '15min', M30: '30min',
  H1: '1h', H2: '2h', H4: '4h', H8: '4h', D1: '1day', W1: '1week'
};

function mapInterval(tf) {
  if (!tf) return '1h';
  return INTERVAL_MAP[String(tf).toUpperCase()] || '1h';
}

// --- Technical indicators (ADDITIVE context for the analysis engine) ---------
// Core set, each chosen because it grounds a field the engine already outputs:
//   ATR -> volatility_context; EMA50/EMA200 -> market_phase/HTF bias;
//   ADX -> trend strength / expansion; RSI -> momentum / premium-discount;
//   MACD -> momentum confirmation. These are passed straight through to the
//   engine via marketContext — the engine logic/schema are NOT changed.
const INDICATOR_TTL_MS = 120 * 1000; // soften repeated clicks within a bar

const INDICATOR_SPECS = [
  { key: 'rsi_14', endpoint: 'rsi', params: 'time_period=14', valueKey: 'rsi' },
  { key: 'atr_14', endpoint: 'atr', params: 'time_period=14', valueKey: 'atr' },
  { key: 'ema_50', endpoint: 'ema', params: 'time_period=50', valueKey: 'ema' },
  { key: 'ema_200', endpoint: 'ema', params: 'time_period=200', valueKey: 'ema' },
  { key: 'adx_14', endpoint: 'adx', params: 'time_period=14', valueKey: 'adx' },
  // MACD handled specially (multi-value output).
  { key: 'macd', endpoint: 'macd', params: 'fast_period=12&slow_period=26&signal_period=9', valueKey: null }
];

function num(v) {
  if (v === undefined || v === null || v === '') return null;
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : null;
}

async function fetchOneIndicator(spec, tdSymbol, tdInterval, apiKey) {
  const url = `https://api.twelvedata.com/${spec.endpoint}?symbol=${encodeURIComponent(tdSymbol)}` +
    `&interval=${tdInterval}&${spec.params}&outputsize=3&apikey=${apiKey}`;
  const resp = await fetch(url);
  const data = await resp.json();
  if (!data || data.status === 'error' || !Array.isArray(data.values) || !data.values.length) {
    throw new Error((data && data.message) ? data.message : `No ${spec.key}`);
  }
  const latest = data.values[0] || {};
  const prev = data.values[1] || {};
  if (spec.key === 'macd') {
    const macd = num(latest.macd), signal = num(latest.macd_signal), hist = num(latest.macd_hist);
    if (macd === null && signal === null && hist === null) throw new Error('Empty macd');
    return { macd, signal, hist };
  }
  const value = num(latest[spec.valueKey]);
  if (value === null) throw new Error(`Empty ${spec.key}`);
  return { value, prev: num(prev[spec.valueKey]) };
}

// Fetch the Core indicator set in parallel; each failure is swallowed (the metric
// is simply omitted) so a flaky indicator never blocks the price context.
async function fetchIndicators(tdSymbol, tdInterval, apiKey) {
  const out = {};
  const results = await Promise.allSettled(
    INDICATOR_SPECS.map((spec) => fetchOneIndicator(spec, tdSymbol, tdInterval, apiKey))
  );
  results.forEach((r, i) => {
    const key = INDICATOR_SPECS[i].key;
    if (r.status === 'fulfilled') out[key] = r.value;
    else console.warn(`Indicator ${key} unavailable: ${r.reason?.message || r.reason}`);
  });
  out.meta = { rsi: 14, atr: 14, ema: [50, 200], macd: [12, 26, 9], adx: 14 };
  return out;
}

// Short-TTL Firestore cache so repeated analyses on the same symbol/interval
// within a bar don't re-spend Twelve Data indicator credits.
async function getIndicators(tdSymbol, tdInterval, apiKey) {
  const docId = `${tdSymbol}_${tdInterval}`.replace(/[^A-Za-z0-9_]/g, '_');
  try {
    const ref = adminDb().collection('indicator_cache').doc(docId);
    const snap = await ref.get();
    if (snap.exists) {
      const d = snap.data();
      if (d && d.data && Date.now() - (d.fetchedAt || 0) < INDICATOR_TTL_MS) {
        return d.data;
      }
    }
    const data = await fetchIndicators(tdSymbol, tdInterval, apiKey);
    ref.set({ fetchedAt: Date.now(), data }).catch(() => {});
    return data;
  } catch (e) {
    // Cache/db unavailable — fetch directly rather than failing the request.
    try {
      return await fetchIndicators(tdSymbol, tdInterval, apiKey);
    } catch {
      return {};
    }
  }
}

export default async function handler(req, res) {
  try {
    const { type, symbol, interval, indicators } = req.query;

    if (!type || !symbol) {
      throw new HttpError(400, "Missing type or symbol parameters.");
    }

    // Authenticate + rate-limit (protects the metered Twelve Data key).
    const uid = await requireUser(req);
    await checkRateLimit(uid, 'market');

    capString(symbol, 24, 'symbol');

    // Sectors not (yet) backed by Twelve Data — graceful no-data so analysis still runs.
    if (type === 'metals' || type === 'indices') {
      return res.status(200).json({ success: false, error: 'Live data not enabled for this sector yet.' });
    }

    if (type !== 'forex' && type !== 'crypto' && type !== 'stock') {
      throw new HttpError(400, "Invalid market type. Use forex, crypto or stock.");
    }

    const apiKey = process.env.TwelveData_api || process.env.TWELVEDATA_API_KEY || process.env.TWELVE_DATA_API_KEY;
    if (!apiKey) {
      console.error("Configuration Error: process.env.TwelveData_api is missing in Vercel Environment Variables.");
      return res.status(200).json({ success: false, error: "Server configuration error: market data key not found." });
    }

    const tdSymbol = normalizeSymbol(type, symbol);
    const tdInterval = mapInterval(interval);

    const url = `https://api.twelvedata.com/time_series?symbol=${encodeURIComponent(tdSymbol)}&interval=${tdInterval}&outputsize=100&apikey=${apiKey}`;

    const response = await fetch(url);
    const data = await response.json();

    // Twelve Data error shape: { code, message, status: 'error' }.
    if (!data || data.status === 'error' || !Array.isArray(data.values)) {
      const message = (data && data.message) ? data.message : 'Market data unavailable.';
      return res.status(200).json({ success: false, error: message });
    }

    const latest = data.values[0] || {};
    const price = parseFloat(latest.close);

    const result = {
      success: true,
      provider: 'twelvedata',
      type,
      symbol: tdSymbol,
      interval: tdInterval,
      price: Number.isFinite(price) ? price : null,
      meta: data.meta || null,
      values: data.values
    };

    // Opt-in technical-indicator enrichment (only when the analysis flow asks for it,
    // so price-only revalidation and the health ping don't spend indicator credits).
    if (indicators) {
      result.indicators = await getIndicators(tdSymbol, tdInterval, apiKey);
    }

    return res.status(200).json(result);
  } catch (error) {
    return sendError(res, error);
  }
}
