import { requireUser, checkRateLimit, capString, sendError, HttpError } from "./_lib/guard.js";

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

export default async function handler(req, res) {
  try {
    const { type, symbol, interval } = req.query;

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

    return res.status(200).json({
      success: true,
      provider: 'twelvedata',
      type,
      symbol: tdSymbol,
      interval: tdInterval,
      price: Number.isFinite(price) ? price : null,
      meta: data.meta || null,
      values: data.values
    });
  } catch (error) {
    return sendError(res, error);
  }
}
