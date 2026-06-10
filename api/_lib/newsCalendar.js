import { adminDb } from './firebaseAdmin.js';

// Server-side FRED high-impact news calendar.
// At analysis time, checks FRED's release-calendar for scheduled high-impact US
// macro releases inside the trade's horizon and returns a compact snapshot. This
// is INPUT/awareness only — it never changes the analysis engine; the caller
// uses it to (a) warn and (b) fire a parallel news-refined run. The FRED key
// (process.env.FRED_api) never reaches the client.
//
// Honest limits: FRED gives release DATES (not the intraday minute → conventional
// ET times below) and no impact rating (we curate which releases are high-impact
// by name). FOMC isn't a clean FRED release, so its decision dates are a small
// hardcoded schedule. ISM / most non-US events are not covered (degrade silently).

const RELEASES_BASE = 'https://api.stlouisfed.org/fred/releases/dates';
const NEWS_TTL_MS = 6 * 60 * 60 * 1000; // calendar is intra-day stable; 6h cache

// Curated US Principal Federal Economic Indicators, matched against FRED's
// `release_name` (keyword match is robust to release-ID changes). time_et =
// conventional release time (US Eastern).
//   impact 'high'   -> triggers the parallel news-refined run + awareness banner
//   impact 'medium' -> awareness banner only (no extra AI run; keeps cost sane
//                       for frequent prints like weekly jobless claims)
// Tiers are intentionally easy to re-balance.
const HIGH_IMPACT = [
  // --- HIGH: the genuine 50–100+ pip movers ---
  { re: /employment situation/i,        name: 'NFP (Employment Situation)',     time_et: '08:30', impact: 'high' },
  { re: /consumer price index/i,        name: 'CPI',                            time_et: '08:30', impact: 'high' },
  { re: /producer price index/i,        name: 'PPI',                            time_et: '08:30', impact: 'high' },
  { re: /personal income and outlays/i, name: 'Core PCE (Personal Income/Outlays)', time_et: '08:30', impact: 'high' },
  { re: /gross domestic product/i,      name: 'GDP',                            time_et: '08:30', impact: 'high' },
  { re: /retail (and food )?(trade|services)|advance monthly sales/i, name: 'Retail Sales', time_et: '08:30', impact: 'high' },
  // --- MEDIUM: principal indicators worth a heads-up, but not a 2nd AI run ---
  { re: /job openings and labor turnover|jolts/i, name: 'JOLTS Job Openings',   time_et: '10:00', impact: 'medium' },
  { re: /durable goods/i,               name: 'Durable Goods Orders',           time_et: '08:30', impact: 'medium' },
  { re: /employment cost index/i,       name: 'Employment Cost Index',          time_et: '08:30', impact: 'medium' },
  { re: /international trade/i,          name: 'Trade Balance',                  time_et: '08:30', impact: 'medium' },
  { re: /new residential construction|housing starts/i, name: 'Housing Starts', time_et: '08:30', impact: 'medium' },
  { re: /industrial production/i,       name: 'Industrial Production',          time_et: '09:15', impact: 'medium' },
  { re: /unemployment insurance weekly claims|jobless claims/i, name: 'Weekly Jobless Claims', time_et: '08:30', impact: 'medium' },
  { re: /surveys of consumers|consumer sentiment/i, name: 'UMich Consumer Sentiment', time_et: '10:00', impact: 'medium' }
];

// FOMC interest-rate decision dates (decision day, 14:00 ET). Published a year
// ahead — update annually. Best-effort; absence just omits FOMC from the scan.
const FOMC_DATES = [
  '2026-01-28', '2026-03-18', '2026-04-29', '2026-06-17',
  '2026-07-29', '2026-09-16', '2026-10-28', '2026-12-16'
];

// FOMC Minutes are released ~3 weeks (21 days) after each decision, 14:00 ET.
function fomcMinutesDate(decisionDate) {
  return fmtDate(new Date(new Date(`${decisionDate}T00:00:00Z`).getTime() + 21 * 86400000));
}

function fmtDate(d) {
  return d.toISOString().slice(0, 10);
}

// Approximate US Eastern offset (EDT -4 roughly Apr–Oct, EST -5 otherwise).
function etOffset(dateStr) {
  const month = Number(dateStr.slice(5, 7));
  return month >= 4 && month <= 10 ? '-04:00' : '-05:00';
}

function eventMillis(dateStr, timeEt) {
  return new Date(`${dateStr}T${timeEt}:00${etOffset(dateStr)}`).getTime();
}

// Trade horizon in hours, scaled to the analysis timeframe (matches the engine's
// trade-mode bands: scalp M1–M15, day M15–H2, swing H4–D1).
function horizonHoursFor(timeframe) {
  const tf = String(timeframe || '').toUpperCase().replace(/\s/g, '');
  if (/(^|[^0-9])(D|W|MN)/.test(tf) || /H(4|6|8)/.test(tf)) return 72; // swing
  if (/H(1|2|3)/.test(tf) || /M30/.test(tf)) return 48;                // day
  return 24;                                                           // scalp/intraday
}

async function getCached(docId, builder) {
  try {
    const ref = adminDb().collection('news_cache').doc(docId);
    const snap = await ref.get();
    if (snap.exists) {
      const d = snap.data();
      if (d && d.data && Date.now() - (d.fetchedAt || 0) < NEWS_TTL_MS) return d.data;
    }
    const data = await builder();
    ref.set({ fetchedAt: Date.now(), data }).catch(() => {});
    return data;
  } catch {
    try { return await builder(); } catch { return null; }
  }
}

// Fetch the raw FRED release-date rows for [start, end] (dates only).
async function fetchReleaseDates(startStr, endStr, apiKey) {
  const url = `${RELEASES_BASE}?api_key=${apiKey}&file_type=json` +
    `&include_release_dates_with_no_data=true&realtime_start=${startStr}` +
    `&realtime_end=${endStr}&sort_order=asc&limit=1000`;
  const resp = await fetch(url);
  const data = await resp.json();
  const rows = data && Array.isArray(data.release_dates) ? data.release_dates : [];
  // Keep only fields we need, and only rows that match a high-impact release.
  return rows
    .map((r) => ({ date: r.date, release_name: r.release_name || '' }))
    .filter((r) => HIGH_IMPACT.some((h) => h.re.test(r.release_name)));
}

// Main entry: returns a NewsSnapshot ({ as_of, horizon_hours, events[], highest_impact })
// or null when nothing is available / no key.
export async function getNewsContext({ timeframe }) {
  const apiKey = process.env.FRED_api || process.env.FRED_API_KEY || process.env.FRED_KEY;
  if (!apiKey) {
    console.warn('FRED key (FRED_api) not set — news context skipped.');
    return null;
  }

  const horizonHours = horizonHoursFor(timeframe);
  const now = new Date();
  const startStr = fmtDate(now);
  const endStr = fmtDate(new Date(now.getTime() + Math.ceil(horizonHours / 24) * 86400000));
  const windowEndMs = now.getTime() + horizonHours * 3600000;

  // Cache the raw matched rows for this date window (independent of the live clock).
  const rows = await getCached(`rel_${startStr}_${endStr}`, () => fetchReleaseDates(startStr, endStr, apiKey));

  const events = [];
  const inWindow = (ms) => ms >= now.getTime() - 30 * 60000 && ms <= windowEndMs; // upcoming & in-window
  const push = (name, date, time_et, impact) => {
    const ms = eventMillis(date, time_et);
    if (!inWindow(ms)) return;
    events.push({ name, date, time_et, impact, minutes_until: Math.round((ms - now.getTime()) / 60000) });
  };

  // Curated FRED releases (tiered).
  (rows || []).forEach((r) => {
    const spec = HIGH_IMPACT.find((h) => h.re.test(r.release_name));
    if (spec) push(spec.name, r.date, spec.time_et, spec.impact);
  });

  // FOMC decision + Minutes (high).
  FOMC_DATES.forEach((date) => {
    push('FOMC Rate Decision', date, '14:00', 'high');
    push('FOMC Minutes', fomcMinutesDate(date), '14:00', 'high');
  });

  if (!events.length) return null;

  events.sort((a, b) => (a.minutes_until ?? 0) - (b.minutes_until ?? 0));

  return {
    as_of: new Date().toISOString(),
    horizon_hours: horizonHours,
    events: events.slice(0, 12),
    highest_impact: events.some((e) => e.impact === 'high') ? 'high' : 'medium'
  };
}
