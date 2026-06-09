import { adminDb } from './firebaseAdmin.js';

// Server-side FRED (Federal Reserve Economic Data) fundamentals helper.
// Pulls a curated macro snapshot and returns BOTH a structured object (for the
// UI panel + persistence) and a compact promptText block (additive context for
// the analysis engine). The FRED key (process.env.FRED_api) never reaches the
// client. This module adds INPUT context only — it does not change the engine,
// its schema, scoring, or any structural logic.

const FRED_BASE = 'https://api.stlouisfed.org/fred/series/observations';
const MACRO_TTL_MS = 6 * 60 * 60 * 1000; // macro data moves slowly; 6h cache

const KNOWN_QUOTES = ['USDT', 'USDC', 'USD', 'EUR', 'GBP', 'JPY', 'BTC'];

// US macro backdrop — always pulled (the quote leg of every instrument is USD-ish).
// units: 'lin' (level, default), 'pc1' (% change from year ago), 'chg' (period change).
const US_BACKDROP = [
  { key: 'fed_funds',     id: 'FEDFUNDS', units: 'lin', label: 'Fed Funds Rate',     suffix: '%' },
  { key: 'ust_10y',       id: 'DGS10',    units: 'lin', label: 'US 10Y Yield',       suffix: '%' },
  { key: 'ust_2y',        id: 'DGS2',     units: 'lin', label: 'US 2Y Yield',        suffix: '%' },
  { key: 'curve_2s10s',   id: 'T10Y2Y',   units: 'lin', label: '2s10s Curve',        suffix: '%' },
  { key: 'cpi_yoy',       id: 'CPIAUCSL', units: 'pc1', label: 'CPI YoY',            suffix: '%' },
  { key: 'core_cpi_yoy',  id: 'CPILFESL', units: 'pc1', label: 'Core CPI YoY',       suffix: '%' },
  { key: 'core_pce_yoy',  id: 'PCEPILFE', units: 'pc1', label: 'Core PCE YoY',       suffix: '%' },
  { key: 'unemployment',  id: 'UNRATE',   units: 'lin', label: 'Unemployment',       suffix: '%' },
  { key: 'nfp_change_k',  id: 'PAYEMS',   units: 'chg', label: 'NFP MoM Change (k)', suffix: 'k' },
  { key: 'real_gdp_yoy',  id: 'GDPC1',    units: 'pc1', label: 'Real GDP YoY',       suffix: '%' },
  { key: 'usd_index',     id: 'DTWEXBGS', units: 'lin', label: 'Broad USD Index',    suffix: '' },
  { key: 'vix',           id: 'VIXCLS',   units: 'lin', label: 'VIX',                suffix: '' },
  { key: 'breakeven_10y', id: 'T10YIE',   units: 'lin', label: '10Y Breakeven Infl', suffix: '%' }
];

// Counter-currency legs (policy/short rate, 10Y govt yield, CPI YoY) via ECB/OECD
// series. CPI '...659N' series are already YoY growth rates (units 'lin').
// Coverage is best-effort; any missing series degrades gracefully (omitted).
const CURRENCY_SERIES = {
  USD: { policy: { id: 'FEDFUNDS' }, ten: { id: 'DGS10' }, cpi: { id: 'CPIAUCSL', units: 'pc1' } },
  EUR: { policy: { id: 'ECBDFR' },   ten: { id: 'IRLTLT01EZM156N' }, cpi: { id: 'CPALTT01EZM659N' } },
  GBP: { policy: { id: 'IR3TIB01GBM156N' }, ten: { id: 'IRLTLT01GBM156N' }, cpi: { id: 'CPALTT01GBM659N' } },
  JPY: { policy: { id: 'IR3TIB01JPM156N' }, ten: { id: 'IRLTLT01JPM156N' }, cpi: { id: 'CPALTT01JPM659N' } },
  CAD: { policy: { id: 'IR3TIB01CAM156N' }, ten: { id: 'IRLTLT01CAM156N' }, cpi: { id: 'CPALTT01CAM659N' } },
  AUD: { policy: { id: 'IR3TIB01AUM156N' }, ten: { id: 'IRLTLT01AUM156N' }, cpi: { id: 'CPALTT01AUM659N' } },
  CHF: { policy: { id: 'IR3TIB01CHM156N' }, ten: { id: 'IRLTLT01CHM156N' }, cpi: { id: 'CPALTT01CHM659N' } },
  NZD: { policy: { id: 'IR3TIB01NZM156N' }, ten: { id: 'IRLTLT01NZM156N' }, cpi: { id: 'CPALTT01NZM659N' } }
};

function num(v) {
  if (v === undefined || v === null || v === '' || v === '.') return null;
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : null;
}

// Resolve an app symbol + sector into the {base, quote} currency codes.
export function parseCurrencies(type, rawSymbol) {
  const s = String(rawSymbol || '').trim().toUpperCase();
  if (type === 'stock' || type === 'indices' || !s) return { base: null, quote: 'USD' };

  let base = null, quote = null;
  if (s.includes('/')) {
    [base, quote] = s.split('/');
  } else if ((type === 'forex' || type === 'metals') && s.length === 6) {
    base = s.slice(0, 3);
    quote = s.slice(3);
  } else {
    for (const q of KNOWN_QUOTES) {
      if (s.length > q.length && s.endsWith(q)) {
        base = s.slice(0, s.length - q.length);
        quote = q;
        break;
      }
    }
  }
  if (quote === 'USDT' || quote === 'USDC') quote = 'USD'; // stablecoins ≈ USD for macro
  return { base: base || null, quote: quote || 'USD' };
}

async function fetchSeries(id, units, apiKey) {
  const unitParam = units && units !== 'lin' ? `&units=${units}` : '';
  const url = `${FRED_BASE}?series_id=${id}&api_key=${apiKey}&file_type=json&sort_order=desc&limit=2${unitParam}`;
  const resp = await fetch(url);
  const data = await resp.json();
  const obs = data && Array.isArray(data.observations) ? data.observations : [];
  const valid = obs.filter((o) => o && num(o.value) !== null);
  if (!valid.length) throw new Error(`No observations for ${id}`);
  const value = num(valid[0].value);
  return { value, prev: valid[1] ? num(valid[1].value) : null, date: valid[0].date };
}

async function buildUsBackdrop(apiKey) {
  const results = await Promise.allSettled(US_BACKDROP.map((s) => fetchSeries(s.id, s.units, apiKey)));
  const out = {};
  results.forEach((r, i) => {
    const spec = US_BACKDROP[i];
    if (r.status === 'fulfilled') out[spec.key] = { ...r.value, label: spec.label, suffix: spec.suffix };
    else console.warn(`FRED ${spec.id} (${spec.key}) failed: ${r.reason?.message || r.reason}`);
  });
  return out;
}

async function buildCurrency(code, apiKey) {
  const m = CURRENCY_SERIES[code];
  if (!m) return null;
  const specs = [
    { key: 'policy_rate', id: m.policy.id, units: m.policy.units },
    { key: 'ten_year',    id: m.ten.id,    units: m.ten.units },
    { key: 'cpi_yoy',     id: m.cpi.id,    units: m.cpi.units }
  ];
  const results = await Promise.allSettled(specs.map((s) => fetchSeries(s.id, s.units, apiKey)));
  const out = { code };
  results.forEach((r, i) => {
    if (r.status === 'fulfilled') out[specs[i].key] = r.value;
    else console.warn(`FRED ${specs[i].id} (${code}.${specs[i].key}) failed: ${r.reason?.message || r.reason}`);
  });
  return out;
}

// Read-through Firestore cache so macro buckets are reused across pairs/users.
async function getCachedBucket(docId, builder) {
  try {
    const ref = adminDb().collection('macro_cache').doc(docId);
    const snap = await ref.get();
    if (snap.exists) {
      const d = snap.data();
      if (d && d.data && Date.now() - (d.fetchedAt || 0) < MACRO_TTL_MS) return d.data;
    }
    const data = await builder();
    ref.set({ fetchedAt: Date.now(), data }).catch(() => {});
    return data;
  } catch {
    try { return await builder(); } catch { return null; }
  }
}

const HOW_TO_USE =
  'HOW TO USE (context only — do NOT change structural definitions, confluence scoring, entries or stop placement): ' +
  'treat this macro read as a higher-timeframe directional BIAS and conviction input, and use it to weight the ' +
  'probability distribution you already compute. Apply the concordance rule — if the macro lean agrees with the ' +
  'technical structure, treat the setup as higher-conviction (favor the IRL→ERL / expansion scenarios); if they ' +
  'conflict, lower conviction (favor the IRL-only / corrective scenario) and note the conflict in the reasoning. ' +
  'For FX weigh the policy-rate and real-yield differential and relative inflation/growth; for crypto weigh USD ' +
  'liquidity, real yields and risk sentiment (VIX, dollar index); for equities weigh the discount-rate/growth ' +
  'backdrop. Never let macro override a structural invalidation or move a price level.';

function entryLine(label, entry, suffix = '') {
  if (!entry || entry.value == null) return null;
  let arrow = '';
  if (entry.prev != null) arrow = entry.value > entry.prev ? ' (rising)' : entry.value < entry.prev ? ' (falling)' : '';
  return `${label} ${entry.value}${suffix}${arrow}`;
}

function ccyInline(c) {
  if (!c) return null;
  const parts = [];
  if (c.policy_rate?.value != null) parts.push(`policy/short rate ${c.policy_rate.value}%`);
  if (c.ten_year?.value != null) parts.push(`10Y ${c.ten_year.value}%`);
  if (c.cpi_yoy?.value != null) parts.push(`CPI YoY ${c.cpi_yoy.value}%`);
  return parts.length ? `${c.code}: ${parts.join(', ')}` : null;
}

function buildPromptText(s) {
  const lines = [];
  lines.push(`MACRO / FUNDAMENTAL CONTEXT (user enabled). As-of ${s.as_of}. Scope: ${s.scope}.`);
  if (s.us_backdrop) {
    const us = Object.values(s.us_backdrop).map((e) => entryLine(e.label, e, e.suffix)).filter(Boolean);
    if (us.length) lines.push(`US backdrop: ${us.join('; ')}.`);
  }
  const baseB = ccyInline(s.base_currency);
  const quoteB = ccyInline(s.counter_currency);
  if (baseB) lines.push(`Base ${baseB}.`);
  if (quoteB) lines.push(`Quote ${quoteB}.`);
  if (s.rate_differential != null) {
    const yld = s.yield_differential != null ? `; 10Y-yield differential ${s.yield_differential}%` : '';
    lines.push(`Policy-rate differential (${s.base} − ${s.quote}): ${s.rate_differential}%${yld}.`);
  }
  lines.push(HOW_TO_USE);
  return lines.join('\n');
}

// Main entry: returns { snapshot, promptText } or null when nothing is available.
export async function getMacroContext({ symbol, type }) {
  const apiKey = process.env.FRED_api || process.env.FRED_API_KEY || process.env.FRED_KEY;
  if (!apiKey) {
    console.warn('FRED key (FRED_api) not set — macro context skipped.');
    return null;
  }

  const { base, quote } = parseCurrencies(type, symbol);
  const wantBase = base && CURRENCY_SERIES[base];
  const wantQuote = quote && CURRENCY_SERIES[quote];

  const [usBackdrop, baseCcy, quoteCcy] = await Promise.all([
    getCachedBucket('us_backdrop', () => buildUsBackdrop(apiKey)),
    wantBase ? getCachedBucket(`ccy_${base}`, () => buildCurrency(base, apiKey)) : Promise.resolve(null),
    wantQuote ? getCachedBucket(`ccy_${quote}`, () => buildCurrency(quote, apiKey)) : Promise.resolve(null)
  ]);

  const hasUs = usBackdrop && Object.keys(usBackdrop).length;
  if (!hasUs && !baseCcy && !quoteCcy) return null;

  let rate_differential = null;
  let yield_differential = null;
  const basePolicy = baseCcy?.policy_rate?.value;
  const quotePolicy = quoteCcy?.policy_rate?.value;
  if (typeof basePolicy === 'number' && typeof quotePolicy === 'number') {
    rate_differential = +(basePolicy - quotePolicy).toFixed(2);
  }
  const baseTen = baseCcy?.ten_year?.value;
  const quoteTen = quoteCcy?.ten_year?.value;
  if (typeof baseTen === 'number' && typeof quoteTen === 'number') {
    yield_differential = +(baseTen - quoteTen).toFixed(2);
  }

  const scope = base && quote ? `${base}/${quote}` : `${quote || 'USD'} (US backdrop)`;

  const snapshot = {
    as_of: new Date().toISOString().slice(0, 10),
    scope,
    base: base || null,
    quote: quote || null,
    rate_differential,
    yield_differential,
    us_backdrop: hasUs ? usBackdrop : null,
    base_currency: baseCcy || null,
    counter_currency: quoteCcy || null
  };

  return { snapshot, promptText: buildPromptText(snapshot) };
}
