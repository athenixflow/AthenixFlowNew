import { GoogleGenAI } from "@google/genai";
import { requireUser, checkRateLimit, capString, assertCanSpend, spendToken, sendError, HttpError } from "./_lib/guard.js";
import { getMacroContext } from "./_lib/fred.js";
import { recordAiCall } from "./_lib/telemetry.js";
import { ANALYSIS_SYSTEM_INSTRUCTION, RESPONSE_SCHEMA, buildNewsSystemInstruction } from "./_lib/analysisEngine.js";
import { getNewsContext } from "./_lib/newsCalendar.js";

// Server-side Athenix analysis endpoint.
// The Gemini API key (process.env.Google_api) never leaves the server.
// The system instruction + response schema live in ./_lib/analysisEngine.js
// (single source of truth). Behaviour (model, temperature, schema, output
// shape) is intentionally identical to before.

// Pull the refined trade setup out of a news-engine result (same schema as the
// standard run). Prefers the richer `signal` block, falls back to impulse_setup.
function extractRefinedSetup(r) {
  const sig = r?.signal;
  if (sig && typeof sig.entry_price === 'number' && typeof sig.stop_loss === 'number') {
    const tps = Array.isArray(sig.take_profits)
      ? sig.take_profits.map(t => t?.price).filter(n => typeof n === 'number')
      : [];
    return {
      direction: sig.direction || r?.impulse_setup?.direction || 'buy',
      entry: sig.entry_price,
      stop_loss: sig.stop_loss,
      take_profits: tps,
      quality_score: typeof r?.quality_score === 'number' ? r.quality_score : undefined,
      rationale: r?.reasoning?.entry_explanation || ''
    };
  }
  const imp = r?.impulse_setup;
  if (imp && typeof imp.entry === 'number' && typeof imp.stop_loss === 'number') {
    const tps = [imp.tp1, imp.tp2, imp.tp3].filter(n => typeof n === 'number');
    return {
      direction: imp.direction || 'buy',
      entry: imp.entry,
      stop_loss: imp.stop_loss,
      take_profits: tps,
      quality_score: typeof r?.quality_score === 'number' ? r.quality_score : undefined,
      rationale: r?.reasoning?.entry_explanation || ''
    };
  }
  return null;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  try {
    const apiKey = process.env.Google_api || process.env.API_KEY || process.env.VITE_API_KEY;
    if (!apiKey) {
      throw new HttpError(500, "Server configuration error: AI key not found.");
    }

    // 1. Authenticate, 2. rate-limit, 3. cap inputs.
    const uid = await requireUser(req);
    await checkRateLimit(uid, 'analyze');

    const { symbol, timeframe, includeFundamentals, marketContext, marketType } = req.body || {};
    capString(symbol, 32, 'symbol');
    capString(timeframe, 16, 'timeframe');
    capString(marketType, 16, 'marketType');
    capString(marketContext, 20000, 'marketContext');
    if (!symbol || !timeframe) {
      throw new HttpError(400, "Missing symbol or timeframe.");
    }

    // 4. Enforce token economy BEFORE spending Gemini compute.
    await assertCanSpend(uid, 'analysis');

    // Optional FRED macro/fundamental context — ONLY when the user toggled it on.
    // Additive input context; a failure never blocks the analysis.
    let macro = null;
    if (includeFundamentals) {
      try {
        macro = await getMacroContext({ symbol, type: marketType });
      } catch (e) {
        console.warn('Macro context unavailable:', e?.message || e);
      }
    }

    const ai = new GoogleGenAI({ apiKey });
    const model = 'gemini-3.1-pro-preview';

    let prompt = `Analyze ${symbol} on ${timeframe}.
  Include Fundamentals: ${includeFundamentals}.
  Market Context: ${marketContext || 'None'}.

  Strictly follow the ATHENIX MASTER IMPLEMENTATION PROMPT. Calculate scores and probabilities deterministically.`;

    if (macro?.promptText) {
      prompt += `\n\n${macro.promptText}`;
    }

    // Optional FRED high-impact news scan — gated behind the same Macro toggle.
    // Returns a snapshot of scheduled high-impact events inside the trade
    // horizon, or null. Best-effort; never blocks the analysis.
    let news = null;
    if (includeFundamentals) {
      try {
        news = await getNewsContext({ timeframe });
      } catch (e) {
        console.warn('News context unavailable:', e?.message || e);
      }
    }
    const hasAnyNews = !!(news && Array.isArray(news.events) && news.events.length);
    // Only a HIGH-tier event fires the parallel news-refined run; medium-tier
    // events (e.g. weekly jobless claims) only raise the awareness banner.
    const hasHighImpact = hasAnyNews && news.events.some((e) => e.impact === 'high');

    const startedAt = Date.now();

    // Standard analysis (primary) — engine call/config/schema unchanged.
    const standardCall = ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        systemInstruction: ANALYSIS_SYSTEM_INSTRUCTION,
        temperature: 0.1,
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA
      }
    });

    // Parallel news-refined run (best-effort) — SAME schema, base + News module.
    // Fired only when a high-impact event is in-window; runs concurrently so
    // latency stays ~flat. Its failure never blocks the standard result.
    let newsCall = null;
    if (hasHighImpact) {
      const eventSummary = news.events
        .map(e => `${e.name} (${e.date}${e.time_et ? ' ' + e.time_et + ' ET' : ''})`)
        .join('; ');
      const newsPrompt = `${prompt}\n\nHIGH-IMPACT NEWS IN-WINDOW: ${eventSummary}. Apply the NEWS-REFINEMENT MODULE.`;
      newsCall = ai.models.generateContent({
        model,
        contents: newsPrompt,
        config: {
          systemInstruction: buildNewsSystemInstruction(eventSummary),
          temperature: 0.1,
          responseMimeType: "application/json",
          responseSchema: RESPONSE_SCHEMA
        }
      });
    }

    // Await the standard run; record telemetry; failure throws as before.
    let response;
    try {
      response = await standardCall;
    } catch (e) {
      await recordAiCall({ feature: 'analysis', model, uid, startedAt, usage: e?.response?.usageMetadata, ok: false, error: e?.message });
      throw e;
    }
    await recordAiCall({ feature: 'analysis', model, uid, startedAt, usage: response?.usageMetadata, ok: true });

    if (!response.text) {
      throw new HttpError(502, "Neural engine returned an empty response.");
    }

    const result = JSON.parse(response.text);

    // Attach the macro snapshot (added by our server code, NOT the model — the
    // response schema is untouched). Surfaced in the UI Macro panel + history.
    if (macro?.snapshot) {
      result.macro_context = macro.snapshot;
    }

    // Attach the news context (banner) whenever any event is in-window, plus the
    // parallel news-refined setup when a HIGH event fired the run (best-effort).
    if (hasAnyNews) {
      result.news_context = news;
      if (newsCall) {
        try {
          const newsResp = await newsCall;
          await recordAiCall({ feature: 'analysis_news', model, uid, startedAt, usage: newsResp?.usageMetadata, ok: true });
          if (newsResp?.text) {
            result.news_refined = extractRefinedSetup(JSON.parse(newsResp.text));
          }
        } catch (e) {
          await recordAiCall({ feature: 'analysis_news', model, uid, startedAt, usage: e?.response?.usageMetadata, ok: false, error: e?.message });
          console.warn('News-refined run failed:', e?.message || e);
        }
      }
    }

    // 5. Charge exactly one analysis unit, only after a successful generation.
    await spendToken(uid, 'analysis');

    // Shape unchanged for the standard fields; the client parses it into TradeAnalysis.
    return res.status(200).json(result);
  } catch (error) {
    return sendError(res, error);
  }
}
