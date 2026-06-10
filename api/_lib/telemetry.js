import { adminDb } from './firebaseAdmin.js';

// AI telemetry recorder. Writes one `ai_telemetry` doc per server-side Gemini
// call (latency + real token usage from response.usageMetadata + computed $ cost).
// This is the real data source behind the Admin OS "AI Management" section.
// Best-effort: a telemetry failure must NEVER affect the user-facing response.

// Default per-model pricing in USD per 1,000,000 tokens. Editable at runtime via
// the Firestore doc system_config/ai_pricing (no hardcoded values in the UI).
const DEFAULT_PRICING = {
  'gemini-3.1-pro-preview': { input: 1.25, output: 5.0 },
  'gemini-3-flash-preview': { input: 0.075, output: 0.30 },
  default: { input: 0.5, output: 1.5 }
};

let _pricingCache = null;
let _pricingFetchedAt = 0;
const PRICING_TTL_MS = 10 * 60 * 1000;

async function getPricing() {
  if (_pricingCache && Date.now() - _pricingFetchedAt < PRICING_TTL_MS) return _pricingCache;
  let pricing = DEFAULT_PRICING;
  try {
    const snap = await adminDb().collection('system_config').doc('ai_pricing').get();
    if (snap.exists) pricing = { ...DEFAULT_PRICING, ...snap.data() };
  } catch {
    /* fall back to defaults */
  }
  _pricingCache = pricing;
  _pricingFetchedAt = Date.now();
  return pricing;
}

function n(v) {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
}

// recordAiCall — fire-and-forget from the handler (await is fine; it swallows errors).
export async function recordAiCall({ feature, model, uid, startedAt, usage, ok, error }) {
  try {
    const promptTokens = n(usage?.promptTokenCount);
    const candidateTokens = n(usage?.candidatesTokenCount);
    const totalTokens = n(usage?.totalTokenCount) || promptTokens + candidateTokens;

    const pricing = await getPricing();
    const p = pricing[model] || pricing.default || DEFAULT_PRICING.default;
    const costUsd = (promptTokens / 1e6) * n(p.input) + (candidateTokens / 1e6) * n(p.output);

    const now = new Date();
    await adminDb().collection('ai_telemetry').add({
      feature,
      model,
      userId: uid || null,
      ok: !!ok,
      error: error ? String(error).slice(0, 500) : null,
      latencyMs: startedAt ? Date.now() - startedAt : 0,
      promptTokens,
      candidateTokens,
      totalTokens,
      costUsd: Math.round(costUsd * 1e6) / 1e6,
      day: now.toISOString().slice(0, 10),
      timestamp: now.toISOString()
    });
  } catch (e) {
    console.warn('ai_telemetry write failed:', e?.message || e);
  }
}
