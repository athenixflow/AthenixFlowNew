# AthenixFlow — Codebase Audit

**Date:** 2026-06-04
**Scope:** Full architectural integrity audit mandated by the AthenixFlow Master PRD ("Codebase Audit Mandate"). Read-only — no code was changed.
**Method:** Static read of every page, service, function, type, and config file, plus reference-tracing (grep) to distinguish live code from dead code. Every claim below cites a concrete `file:line`.

---

## 1. Executive Summary

AthenixFlow is a **functional, mature** React 18 + TypeScript + Vite SPA backed by Firebase (Auth / Firestore / Cloud Functions) with a Google Gemini–driven analysis engine. The core user journeys (auth, AI analysis, history, journaling, signals, billing UI, admin oversight) are implemented and wired to real Firestore data.

However, it **does not currently satisfy several of the PRD's own "critical product rules."** The most material gaps:

1. **The "13 engines" are not engines.** They are a single ~330-line Gemini system prompt ([services/geminiService.ts:7-338](services/geminiService.ts#L7-L338)). Scores are *asserted by an LLM*, not computed — so they cannot be independently tested, audited, or guaranteed deterministic despite the prompt claiming determinism.
2. **No trust boundary.** The "backend" ([services/backend.ts](services/backend.ts)) runs **in the browser**. Token deduction, "admin" checks, and the Gemini API key all execute client-side. The Gemini key is injected into the client bundle ([vite.config.ts:22](vite.config.ts#L22)).
3. **Hardcoded frontend values** that the PRD explicitly forbids: subscription prices and token allocations ([pages/Billing.tsx:15-59](pages/Billing.tsx#L15-L59)), several hardcoded "Operational" statuses, and fabricated metrics in (dead) backend code.
4. **A broken signal data path and a broken analytics path** caused by schema/string mismatches (details in §5).
5. **Significant dead code** carrying fabricated values (e.g. `accuracy: 74.2`) and conflicting logic.

| # | Finding | Severity | Evidence |
|---|---------|----------|----------|
| 1 | Cloud Function outcome aggregation never matches stored outcomes (`'TP'` vs `'TP_HIT'`) — analytics silently always zero | **Critical** | [functions/index.js:60-63](functions/index.js#L60-L63), [types.ts:142](types.ts#L142) |
| 2 | Gemini API key shipped to the browser; all "backend" + token logic is client-side and bypassable | **Critical** | [vite.config.ts:22](vite.config.ts#L22), [services/geminiService.ts:5](services/geminiService.ts#L5), [services/firestore.ts:565-597](services/firestore.ts#L565-L597) |
| 3 | Subscription prices & token allocations hardcoded in UI, duplicating editable backend config | **High** | [pages/Billing.tsx:15-59](pages/Billing.tsx#L15-L59) vs [services/firestore.ts:835-845](services/firestore.ts#L835-L845) |
| 4 | `adminManageSignal` writes a signal shape incompatible with the `TradingSignal` type the UI reads | **High** | [services/backend.ts:343-366](services/backend.ts#L343-L366) vs [types.ts:73-90](types.ts#L73-L90) |
| 5 | Confidence Engine never computed — `signal.confidence_score` not in the AI schema, yet bucketed in analytics | **High** | [services/geminiService.ts:467-487](services/geminiService.ts#L467-L487), [functions/index.js:51](functions/index.js#L51) |
| 6 | Plan upgrade button is a no-op (no payment) → `subscriptions` collection never populated by users → revenue views read empty | **High** | [pages/Billing.tsx:83-92](pages/Billing.tsx#L83-L92) |
| 7 | Dead code with fabricated values (`accuracy: 74.2`, `revenue = paid*50`, `confidence \|\| 90`) | **Medium** | [services/firestore.ts:676-694](services/firestore.ts#L676-L694), [services/backend.ts:356](services/backend.ts#L356) |
| 8 | Hardcoded "Operational" / "System Operational" statuses not tied to health checks | **Medium** | [pages/AdminDashboard.tsx:482](pages/AdminDashboard.tsx#L482), [components/Header.tsx:35](components/Header.tsx#L35), [pages/Dashboard.tsx:58](pages/Dashboard.tsx#L58) |
| 9 | `"Analysis unavailable"` placeholder strings persisted to DB and rendered as data | **Medium** | [services/backend.ts:65-87](services/backend.ts#L65-L87) |
| 10 | Market proxy supports only `forex`/`stock`; UI also offers `metals`/`indices` (silently no live data) | **Medium** | [api/market.js:69](api/market.js#L69), [pages/AIAssistant.tsx:575](pages/AIAssistant.tsx#L575) |
| 11 | Duplicate Firebase init (`lib/firebase.ts`) never imported; duplicated score storage in `TradeAnalysis` | **Low** | [lib/firebase.ts](lib/firebase.ts), [types.ts:266-274](types.ts#L266-L274) |

---

## 2. Architecture Map (as-built)

**Stack:** React 18.2 + TypeScript 5.3 + Vite 5; TailwindCSS (CDN); Framer Motion; Recharts; Firebase v9 modular (Auth, Firestore, Functions, Analytics); `@google/genai` (Gemini); deployed on Vercel (SPA) + Firebase Hosting.

**There is no application server.** The data flow is:

```
React pages ──► services/backend.ts (runs in browser) ──► services/geminiService.ts ──► Gemini API (direct, client-side)
            ├─► services/firestore.ts (direct Firestore SDK calls, client-side)
            └─► services/marketData.ts ──► /api/market (the ONLY real serverless fn) ──► APILayer / Marketstack
```

- `services/backend.ts` is **not** a backend — it is a browser-side business-logic layer. Its `isAdmin()` check ([services/backend.ts:15-19](services/backend.ts#L15-L19)) and `deductTokens` ([services/firestore.ts:565-597](services/firestore.ts#L565-L597)) run in the client and are only as strong as Firestore security rules.
- The single genuine server-side file is [api/market.js](api/market.js) (a Vercel function) which correctly keeps market-data API keys server-side. The Gemini key does **not** get this protection.

**The PRD's engines vs. reality:** PRD §"Backend Systems" lists 13 engines that "must operate independently but share a unified data layer." In code, Structure / Liquidity / Narrative / Forecast / POI / Premium-Discount / Entry / SL / TP / Confluence engines are all **one Gemini prompt** ([services/geminiService.ts:7-338](services/geminiService.ts#L7-L338)) returning one JSON blob. There are no separable, independently testable engine modules. The Journal "engine" is CRUD only ([pages/TradeJournal.tsx](pages/TradeJournal.tsx)). The AI Assistant "engine" is a second prompt ([services/geminiService.ts:519-539](services/geminiService.ts#L519-L539)).

---

## 3. Dependency Map (UI value → backend source)

Legend: **Real** = traces to live computed/stored data · **Defaulted** = real source but rendered through a fallback that masks missing data · **Hardcoded** = literal in source · **Dead** = computed in code that is never called.

| UI location | Displayed value | Source | Verdict |
|---|---|---|---|
| [AIAssistant.tsx:191](pages/AIAssistant.tsx#L191) | Total Confluence /40 | `data.confluence_scores.total_confluence_score` (Gemini) | Real, `safeRender(..,"0")` Defaulted |
| [AIAssistant.tsx:317-327](pages/AIAssistant.tsx#L317-L327) | Probability cards % | `data.probabilities.*` (Gemini) | Real, `?? 0` Defaulted |
| [AIAssistant.tsx:335-338](pages/AIAssistant.tsx#L335-L338) | Structure/Liq/POI/PD /10 | `data.confluence_scores.*` (Gemini) | Real, Defaulted |
| [AIAssistant.tsx:679-687](pages/AIAssistant.tsx#L679-L687) | History row Entry/Stop/TP1 | `item.signal?.*` (legacy block) | **Defaulted to `---`** — `signal` is optional & often absent; detail view uses `impulse_setup` instead (inconsistent) |
| [LiveSignals.tsx:86-122](pages/LiveSignals.tsx#L86-L122) | Signal direction/status/E/SL/TP | Firestore `signals` doc via `addSignal` | Real **only** when created via `SignalsControlCenter`; **broken** if created via `adminManageSignal` (see §5) |
| [Dashboard.tsx:37-49](pages/Dashboard.tsx#L37-L49) | Analysis/Education credits | `user.analysisTokens/educationTokens` | Real, `?? '0'` Defaulted |
| [Dashboard.tsx:58](pages/Dashboard.tsx#L58) | Terminal "Operational" | Literal (only checks `user` truthy) | **Hardcoded** |
| [Settings.tsx:50-51](pages/Settings.tsx#L50-L51) | Access tier + "ACTIVE" badge | `user.subscriptionPlan \|\| 'LITE'`; badge literal | Defaulted + **Hardcoded** badge |
| [Billing.tsx:121-133](pages/Billing.tsx#L121-L133) | Plan prices & token allocations | Literal `plans[]` array | **Hardcoded** (dupes backend config) |
| [AdminDashboard.tsx:188](pages/AdminDashboard.tsx#L188) | Conversion/Churn/Revenue | Computed from live `subscriptions` | Real, but source collection is empty (see §5 #6) |
| [AdminDashboard.tsx:252](pages/AdminDashboard.tsx#L252) | "Annual Revenue (Est)" | `amount * 12` | Real-but-estimate (labeled) |
| [AdminDashboard.tsx:482](pages/AdminDashboard.tsx#L482) | AI Engine "Operational" | Literal | **Hardcoded** |
| [AdminDashboard.tsx:72](pages/AdminDashboard.tsx#L72) | API Status dot | `fetch('/')` "mock ping" | **Mocked** |
| [Header.tsx:35](components/Header.tsx#L35) | "System Operational" | Literal | **Hardcoded** |

---

## 4. Hardcoded / Mock / Placeholder Inventory

| File:line | Value | Why it violates the rule | Suggested source |
|---|---|---|---|
| [pages/Billing.tsx:18-58](pages/Billing.tsx#L18-L58) | Lite `$20/10/70`, Pro `$60/30/150`, Elite `$120/70/300` | Prices & allocations hardcoded in UI; duplicates editable config & admin editor has no effect on display | `getTokenEconomyConfig()` ([services/firestore.ts:834](services/firestore.ts#L834)) |
| [pages/Billing.tsx:186-187](pages/Billing.tsx#L186-L187) | "$5.00 = 20 Analysis Units", "= 500 Education Units" | Hardcoded text duplicating refill math | `refillTokens` rate ([services/backend.ts:220](services/backend.ts#L220)) |
| [services/backend.ts:65-87](services/backend.ts#L65-L87) | `"Analysis unavailable"` (×7) | Placeholder persisted to DB & shown as analysis content | Render empty-state, don't store placeholder |
| [services/backend.ts:90-98](services/backend.ts#L90-L98) | `|| 0` on probabilities/scores when flattening | Zero masks "model didn't return a value" | Validate AI output; reject if missing |
| [services/backend.ts:356](services/backend.ts#L356) | `confidence: data.confidence \|\| 90` | Fabricated confidence (dead path, still a landmine) | Compute or omit |
| [services/backend.ts:357-362](services/backend.ts#L357-L362) | `audience \|\| 'all_users'`, `author \|\| 'Admin'` | Silent defaults (dead path) | — |
| [services/backend.ts:462](services/backend.ts#L462) | `aiApi: 'operational'` (commented "Mocking") | Fabricated health (dead path) | Real Gemini ping |
| [services/firestore.ts:671](services/firestore.ts#L671) | `activeUsers = total * 0.7` | Fabricated engagement (dead code) | Real query |
| [services/firestore.ts:676-680](services/firestore.ts#L676-L680) | `revenue.total = paid*50`, `monthly = paid*45`, `growth = 12.5` | Fabricated revenue (dead code) | Real `subscriptions` sum |
| [services/firestore.ts:683-687](services/firestore.ts#L683-L687) | `accuracy: 74.2`, `avgConfluence: 82.5` | **Fabricated AI accuracy** (dead code) | Compute from feedback outcomes |
| [services/firestore.ts:694](services/firestore.ts#L694) | `active7d = active24h * 3` | Fabricated (dead code) | Real query |
| [functions/index.js:10-13](functions/index.js#L10-L13) | Confidence thresholds `85/70/55` | Magic numbers; also operate on a score that's always 0 | Config-driven |
| [pages/AdminDashboard.tsx:482](pages/AdminDashboard.tsx#L482), [Dashboard.tsx:58](pages/Dashboard.tsx#L58), [Header.tsx:35](components/Header.tsx#L35) | `"Operational"` / `"System Operational"` | Static status strings | Real health state |
| [pages/AdminDashboard.tsx:71-72](pages/AdminDashboard.tsx#L71-L72) | `fetch('/')` "mock ping" | Not a real API health check | `testMarketConnection()` |
| [pages/Settings.tsx:51](pages/Settings.tsx#L51) | `"ACTIVE"` badge literal | Shown regardless of `subscriptionStatus` | `user.subscriptionStatus` |
| [pages/AIAssistant.tsx:9](pages/AIAssistant.tsx#L9), [AdminDashboard.tsx:18](pages/AdminDashboard.tsx#L18) | `safeRender(val, "N/A")` / `"0"` | Display fallbacks that mask missing backend data across dozens of fields | Validate upstream |

---

## 5. Conflicting / Duplicate / Broken Logic

**5.1 — Broken analytics aggregation (Critical).** The app writes feedback outcomes as `'TP_HIT' | 'SL_HIT' | 'BREAK_EVEN' | 'STILL_RUNNING' | 'NOT_TAKEN' | 'INVALID'` ([types.ts:142](types.ts#L142), submitted at [pages/AIAssistant.tsx:497](pages/AIAssistant.tsx#L497)). The Cloud Function counts `outcome === 'TP'`, `'SL'`, `'BE'` ([functions/index.js:60-63](functions/index.js#L60-L63), [143](functions/index.js#L143)). These never match, so `tpCount/slCount/beCount` and `confidenceBucketPerformance.*.wins` are **permanently zero**. Win-rate analytics are silently broken.

**5.2 — Signal schema mismatch (High).** Two writers, one reader:
- **Writer A (live):** `SignalsControlCenter` → `addSignal()` writes the object verbatim — matches `TradingSignal` (`direction: 'Buy'/'Sell'`, `status: 'Pending'`, `entry/stopLoss/takeProfit`, `riskReward`, `orderType`, `postedByName`). ✅ Consistent with `LiveSignals` reads ([pages/LiveSignals.tsx:86-122](pages/LiveSignals.tsx#L86-L122)).
- **Writer B (orphan):** `adminManageSignal` ([services/backend.ts:343-366](services/backend.ts#L343-L366)) writes a **different shape**: `signalType`, `rrRatio:number`, `direction:'BUY'/'SELL'`, `status:'pending'/'active'/'completed_tp'`, `confidence`, `author`. If ever used, `LiveSignals` would mis-render direction (`'BUY' !== 'Buy'` → always shows Sell), status badges, and the copy-setup string (`riskReward`/`orderType` undefined).
- **Status:** `adminManageSignal` has **no call sites** (grep-confirmed) → currently dead, but it's a live landmine and the source of the `confidence || 90` fabrication.

**5.3 — Confidence Engine never produced (High).** `functions/index.js` and `getAIOversightMetrics` read `data.signal.confidence_score` ([functions/index.js:51](functions/index.js#L51), [services/firestore.ts:807](services/firestore.ts#L807)), but the Gemini response schema for `signal` has no `confidence_score` property ([services/geminiService.ts:467-487](services/geminiService.ts#L467-L487)). Every confidence bucket therefore resolves to score `0` → `'Low'`.

**5.4 — `signal` vs `impulse_setup` inconsistency (Medium).** The `signal` block is optional and not in the AI `required` list ([services/geminiService.ts:507](services/geminiService.ts#L507)); the detail view renders `impulse_setup`/`corrective_setup` ([pages/AIAssistant.tsx:357-424](pages/AIAssistant.tsx#L357-L424)) while the collapsed history row renders `item.signal?.*` ([pages/AIAssistant.tsx:679-687](pages/AIAssistant.tsx#L679-L687)). When `signal` is absent the row shows `---` and defaults the direction badge to Sell.

**5.5 — Type vs AI-schema drift (Medium).** `market_story.liquidity_path` is `string` in [types.ts:210](types.ts#L210) but an `array` in the AI schema ([services/geminiService.ts:391](services/geminiService.ts#L391)); `liquidity_heatmap` is `string` in [types.ts:213](types.ts#L213) but an `object` in the AI schema ([services/geminiService.ts:396-399](services/geminiService.ts#L396-L399)). `safeRender` hides the mismatch by `JSON.stringify`-ing.

**5.6 — Dead/duplicate code (Low/Medium).** Grep-confirmed **no call sites** for: `adminManageSignal`, `getAdminMetrics`, `getRevenueMetrics`, `getAIOversightMetrics`, `getStrategyPerformance`, `getPublishedSignals`. `AdminDashboard` computes its own metrics inline instead, so the fabricated values in those functions are never shown — but they remain misleading dead code. `lib/firebase.ts` is never imported (all code uses root `firebase.ts`). `TradeAnalysis` stores scores twice — nested `confluence_scores.*`/`probabilities.*` and flattened `structureScore`/`pIRL`/etc. ([types.ts:266-274](types.ts#L266-L274)) — risking drift.

**5.7 — Broken payment flow (High).** `handlePlanSelection` only flashes a message; the comment says "In a real app, this would redirect to Stripe" ([pages/Billing.tsx:83-92](pages/Billing.tsx#L83-L92)). Users can never create a subscription, so the `subscriptions` collection is empty and every revenue/conversion/churn figure in the admin Revenue tab computes from nothing.

---

## 6. Missing Backend Fields vs. PRD

- **Forecast Center / independent forecasting (PRD Pillar 2).** PRD: *"Forecasting must occur independently from execution… still provide forecasts even when no trade setup exists."* In code, forecasting is fused into `analyzeMarket` and only emitted alongside a trade decision. No forecast-only path, no Forecast Center page (it's not in the routed pages).
- **Confidence Engine.** Specified as a backend system; not computed (§5.3).
- **Premium/Discount Engine.** Exists only as a 0-10 LLM-asserted sub-score ([services/geminiService.ts:451](services/geminiService.ts#L451)); no explicit premium/discount computation.
- **AI Journal Assistant (PRD).** Win/loss reasoning, execution-quality score, rule-violation & emotional-behavior detection, weekly/monthly reports — none present; [pages/TradeJournal.tsx](pages/TradeJournal.tsx) is pure CRUD.
- **Markets page** (Forex/Metals/Crypto/Indices/Commodities) and **Signals Center / Forecast Center / Journal Center** as distinct PRD modules are not all present as routed pages; functionality is folded into AIAssistant/LiveSignals. Crypto & Commodities are not supported anywhere.

---

## 7. Dead Code & Config Notes

- `lib/firebase.ts` — duplicate Firebase init, **never imported** (root `firebase.ts` is canonical). Safe to delete.
- Unused service exports (grep-confirmed no callers): `adminManageSignal`, `getAdminMetrics`, `getRevenueMetrics`, `getAIOversightMetrics`, `getStrategyPerformance`, `getPublishedSignals`, `publishSignal` path.
- `functions/` holds `index.js` but the project has no `functions/package.json` visible at root; verify deployability of the three scheduled/trigger functions (and fix §5.1 before relying on them).
- `api/market.js` handles only `forex` and `stock`; `metals`/`indices`/`stock<5 chars` heuristics in [services/backend.ts:44](services/backend.ts#L44) and the UI's `metals`/`indices` sectors get no live data.
- Firebase web config with `apiKey` is committed in [firebase.ts:9-17](firebase.ts#L9-L17). This is normal for Firebase web (public client identifier), **not** a leaked secret — but the **Gemini** key in [vite.config.ts:22](vite.config.ts#L22) *is* a real secret and is exposed to the client.

---

## 8. PRD Critical-Rules Compliance Matrix

| # | PRD Rule | Status | Evidence / Note |
|---|----------|--------|-----------------|
| 1 | Market structure drives direction | ⚠️ Partial | Enforced only by LLM prompt; not deterministic/testable ([geminiService.ts:66-85](services/geminiService.ts#L66-L85)) |
| 2 | Liquidity drives price | ⚠️ Partial | LLM prompt only ([geminiService.ts:123-157](services/geminiService.ts#L123-L157)) |
| 3 | Forecasting occurs before execution | ❌ Fail | No independent forecast path; fused with trade decision (§6) |
| 4 | Entries originate from POIs, not CMP | ⚠️ Partial | Instructed in prompt ([geminiService.ts:203-216](services/geminiService.ts#L203-L216)); unverifiable, LLM-asserted |
| 5 | Stop losses outside protected structure | ⚠️ Partial | Prompt rule ([geminiService.ts:212-215](services/geminiService.ts#L212-L215)); not validated in code |
| 6 | Take profits originate from HTF liquidity | ⚠️ Partial | Prompt only |
| 7 | Micro liquidity never a major TP | ⚠️ Partial | Prompt only; no code guard |
| 8 | All frontend values from backend calculations | ❌ Fail | Billing prices/allocations & statuses hardcoded (§4) |
| 9 | No hardcoded frontend values | ❌ Fail | §4 inventory |
| 10 | Every displayed score has a backend source | ⚠️ Partial | Scores from Gemini, but `?? 0`/`"N/A"` defaults mask gaps; confidence score never produced |
| 11 | Every displayed signal explainable | ⚠️ Partial | `reasoning` returned, but `signal`/`impulse_setup` inconsistency (§5.4) |
| 12 | Every displayed forecast traceable | ⚠️ Partial | Stored in `analysisHistory`, but LLM-generated, not deterministic; analytics broken (§5.1) |

No rule is fully **Pass**.

---

## 9. Prioritized Remediation Backlog (recommendations only — no code changed)

**P0 — correctness & security**
1. Fix the outcome-string mismatch in `functions/index.js` (`'TP'`→`'TP_HIT'`, etc.) or normalize at write time. (§5.1)
2. Move Gemini calls behind a server function (a Vercel function like `api/market.js`) so the key isn't in the client bundle; enforce token deduction & admin checks server-side. (§2, Exec #2)
3. Decide the canonical signal writer; delete or fix `adminManageSignal` to match `TradingSignal`. (§5.2)

**P1 — PRD compliance (no hardcoded values)**
4. Source Billing prices/allocations from `getTokenEconomyConfig()`. (§4)
5. Replace hardcoded "Operational"/"System Operational" with real health state; remove the `fetch('/')` mock ping. (§4)
6. Either implement payments or clearly mark Billing as non-functional so revenue analytics aren't misleading. (§5.7)
7. Produce or remove `confidence_score`; if kept, add it to the AI schema and compute buckets meaningfully. (§5.3)

**P2 — hygiene**
8. Delete dead code (`lib/firebase.ts`, the uncalled metric/signal functions) and the fabricated values they carry. (§5.6, §7)
9. Reconcile `types.ts` with the Gemini response schema (`liquidity_path`, `liquidity_heatmap`); remove duplicate flattened score fields or make flattening the single source. (§5.5, §5.6)
10. Support `metals`/`indices` (and decide on crypto/commodities per PRD) in `api/market.js`, or remove them from the UI. (§7)
11. Replace blanket `safeRender(..,"N/A")`/`?? 0` display defaults with explicit "data unavailable" empty states so missing backend values are visible, not silently zeroed. (§4)

---

*End of audit. All findings are static-analysis based; none were changed. Re-run after any remediation to refresh the compliance matrix.*
