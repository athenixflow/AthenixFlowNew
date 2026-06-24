
import { doc, getDoc, updateDoc, increment, collection, addDoc, runTransaction, deleteDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { firestore } from '../firebase';
import { analyzeMarket as callGeminiAnalysis, getEducationResponse, revalidateTradeSetup } from './geminiService';
import { getMarketData, testMarketConnection } from './marketData';
import { getModeConfig, getRefinementTimeframe, computeStructureFacts, scoreSignal, computeRubricScores, StructureFacts } from './structureEngine';
import { UserProfile, UserRole, SubscriptionPlan, TokenEconomyConfig, SystemHealth, TradingSignal, TradeAnalysis } from '../types';
import { saveAnalysisToHistory, saveEducationInteraction, updateTokenEconomyConfig, logAdminAction, checkDatabaseConnection, updateAnalysisValidation } from './firestore';

export interface BackendResponse<T = any> {
  message: string;
  status: 'success' | 'error';
  data?: T;
}

const isAdmin = async (userId: string): Promise<boolean> => {
  const userRef = doc(firestore, 'users', userId);
  const userSnap = await getDoc(userRef);
  return userSnap.exists() && userSnap.data()?.role === UserRole.ADMIN;
};

// Enforce the engine's OWN declared score bounds on its output. The LLM
// occasionally violates them (e.g. total_confluence_score 170 vs a max of 40);
// this applies the engine's stated ranges and its "total = sum of the four
// sub-scores" definition in code — without touching the engine/prompt/schema.
// Touches only numeric score fields; never introduces NaN/undefined.
const clampNum = (v: any, lo: number, hi: number): number | undefined =>
  typeof v === 'number' && Number.isFinite(v) ? Math.max(lo, Math.min(hi, v)) : undefined;

const sanitizeScores = (result: any): any => {
  if (!result || typeof result !== 'object') return result;

  const cs = result.confluence_scores;
  if (cs && typeof cs === 'object') {
    const subKeys = ['structure_score', 'liquidity_score', 'poi_score', 'premium_discount_score'] as const;
    let sum = 0, anySub = false;
    for (const k of subKeys) {
      const c = clampNum(cs[k], 0, 10);
      if (c !== undefined) { cs[k] = c; sum += c; anySub = true; }
    }
    // The engine defines total as the sum of the four sub-scores (<= 40).
    if (anySub) cs.total_confluence_score = sum;
    else { const t = clampNum(cs.total_confluence_score, 0, 40); if (t !== undefined) cs.total_confluence_score = t; }
  }

  const q = clampNum(result.quality_score, 0, 100); if (q !== undefined) result.quality_score = q;
  const cor = clampNum(result.corrective_score, 0, 100); if (cor !== undefined) result.corrective_score = cor;
  const imp = clampNum(result.impulse_score, 0, 100); if (imp !== undefined) result.impulse_score = imp;

  const p = result.probabilities;
  if (p && typeof p === 'object') {
    const a = clampNum(p.irl_only, 0, 100);
    const b = clampNum(p.irl_to_erl, 0, 100);
    const c = clampNum(p.expansion, 0, 100);
    if (a !== undefined) p.irl_only = a;
    if (b !== undefined) p.irl_to_erl = b;
    if (c !== undefined) p.expansion = c;
    // When all three are present, normalize to a coherent 100% split.
    if (a !== undefined && b !== undefined && c !== undefined) {
      const total = a + b + c;
      if (total > 0) {
        const na = Math.round((a / total) * 100);
        const nb = Math.round((b / total) * 100);
        p.irl_only = na;
        p.irl_to_erl = nb;
        p.expansion = 100 - na - nb;
      }
    }
  }

  return result;
};

export const analyzeMarket = async (
  userId: string,
  symbol: string, 
  timeframe: string, 
  includeFundamentals: boolean,
  marketType?: 'forex' | 'crypto' | 'stock' | 'metals' | 'indices',
  selectedMode?: 'scalp' | 'day_trade' | 'swing_trade'
): Promise<BackendResponse> => {
  try {
    const userRef = doc(firestore, 'users', userId);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) return { status: 'error', message: 'User not found in neural network.' };
    
    const user = userSnap.data() as UserProfile;
    
    if (user.accountStatus === 'suspended') {
      return { status: 'error', message: 'Account suspended. Contact administration.' };
    }

    if (user.analysisTokens < 1) return { status: 'error', message: 'Insufficient analysis units. Please refill in the Billing terminal.' };

    // 1. Fetch Real-Time Market Data (Twelve Data via /api/market)
    const resolvedMarketType = marketType || (symbol.length < 5 ? 'stock' : 'forex');
    let marketContext = '';
    let structureFacts: StructureFacts | null = null;
    try {
      // Pull candles + the Core technical-indicator set as ADDITIVE context.
      const marketData = await getMarketData(resolvedMarketType, symbol, timeframe, { indicators: true });

      if (marketData && !marketData.error) {
        // --- Structure Intelligence (patterns / multi-TF confluence / liquidity) ---
        // SURFACE-ONLY: computed for the UI panel + saved on the record, but NOT
        // fed to the LLM. Injecting it into marketContext scrambled the engine's
        // own deterministic scoring (field-name/number collisions with its
        // confluence/liquidity/POI/premium-discount layers → out-of-range scores).
        try {
          const { correlationTimeframes } = getModeConfig(selectedMode, timeframe);
          const [midTF, macroTF] = correlationTimeframes;
          const refTF = getRefinementTimeframe(selectedMode, timeframe); // lower TF (or null)
          const [midResp, macroResp, refResp] = await Promise.all([
            midTF ? getMarketData(resolvedMarketType, symbol, midTF) : Promise.resolve(null),
            macroTF ? getMarketData(resolvedMarketType, symbol, macroTF) : Promise.resolve(null),
            refTF ? getMarketData(resolvedMarketType, symbol, refTF) : Promise.resolve(null)
          ]);
          structureFacts = computeStructureFacts({
            entryCandles: (marketData as any).values,
            midCandles: midResp && !midResp.error ? (midResp as any).values : null,
            macroCandles: macroResp && !macroResp.error ? (macroResp as any).values : null,
            refinementCandles: refResp && !refResp.error ? (refResp as any).values : null,
            mode: selectedMode,
            entryTimeframe: timeframe
          });
          // NOTE: deliberately NOT attaching structureFacts to marketData — it
          // must not enter the LLM's marketContext (see surface-only note above).
        } catch (e: any) {
          console.warn('Athenix: structure intelligence unavailable:', e?.message || e);
        }

        marketContext = JSON.stringify(marketData);
      }
    } catch (err) {
      console.warn("Athenix: Live price context unavailable, using historical neural weights.");
    }

    // 2. Call Gemini Analysis Engine
    const result = await callGeminiAnalysis(symbol, timeframe, includeFundamentals, marketContext, resolvedMarketType);

    // 2b. Enforce the engine's own score bounds (fallback if structure data is
    // unavailable). The LLM sometimes returns out-of-range scores (total 170/40).
    sanitizeScores(result);

    // 2c. DETERMINISTIC SCORES: when we have real structure measurements, compute
    // the confluence sub-scores + total + quality in code (same engine rubric) and
    // use those as authoritative — consistent, explainable, no run-to-run variance.
    // Narrative / entry / SL / TP / final_decision stay LLM-authored. Engine untouched.
    if (structureFacts) {
      const dir = result.impulse_setup?.direction || result.signal?.direction;
      const entry = result.impulse_setup?.entry ?? result.signal?.entry_price ?? null;
      const stop = result.impulse_setup?.stop_loss ?? result.signal?.stop_loss ?? null;
      const tps = result.impulse_setup
        ? [result.impulse_setup.tp1, result.impulse_setup.tp2, result.impulse_setup.tp3]
        : (result.signal?.take_profits || []).map((t: any) => t?.price);
      const rubric = computeRubricScores({ facts: structureFacts, direction: dir, entry, stop, tps });
      result.confluence_scores = rubric.confluence_scores;
      result.quality_score = rubric.quality_score;
      result.score_gates = rubric.gates;
      // Deterministic per-setup scores (consistent with the rubric above).
      result.impulse_score = rubric.quality_score;
      const cs = result.corrective_setup;
      if (cs && typeof cs.entry === 'number') {
        result.corrective_score = computeRubricScores({
          facts: structureFacts, direction: cs.direction, entry: cs.entry, stop: cs.stop_loss, tps: [cs.target]
        }).quality_score;
      }
    }

    // 3. Prepare full record for persistence (Flattened for query/sorting)
    const fullAnalysis: TradeAnalysis = {
      ...result,
      userId: userId,
      timestamp: new Date().toISOString(),
      status: 'active',
      marketType: resolvedMarketType,
      // Record the user's selected mode (label source of truth; engine output untouched).
      // Conditional-spread so we never write `undefined` to Firestore.
      ...(selectedMode ? { selected_mode: selectedMode } : {}),
      // Structure Intelligence (supporting read; computed from the LLM's direction).
      ...(structureFacts ? { structure_intelligence: scoreSignal(structureFacts, (result.impulse_setup?.direction || result.signal?.direction), includeFundamentals) } : {}),
      
      // Ensure Version 2.0 fields are present (defaults if missing from AI response)
      market_narrative_context: result.market_narrative_context || {
        htf_narrative: "Analysis unavailable",
        selected_tf_narrative: "Analysis unavailable",
        refinement_narrative: "Analysis unavailable"
      },
      liquidity_map: result.liquidity_map || {
        buy_side_liquidity: [],
        sell_side_liquidity: [],
        inducement_zones: [],
        projected_liquidity_path: "Analysis unavailable"
      },
      session_context: result.session_context || {
        session: "Unknown",
        asian_high: 0,
        asian_low: 0,
        liquidity_sweep: "Analysis unavailable"
      },
      market_story: result.market_story || {
        origin: "Analysis unavailable",
        current_phase: "Analysis unavailable",
        liquidity_path: "Analysis unavailable"
      },
      liquidity_heatmap: result.liquidity_heatmap || "Analysis unavailable",
      
      // Flattened Fields for Firestore Indexing & Admin Analytics
      pIRL: result.probabilities?.irl_only || 0,
      pIRLtoERL: result.probabilities?.irl_to_erl || 0,
      pExpansion: result.probabilities?.expansion || 0,
      
      structureScore: result.confluence_scores?.structure_score || 0,
      liquidityScore: result.confluence_scores?.liquidity_score || 0,
      poiScore: result.confluence_scores?.poi_score || 0,
      premiumDiscountScore: result.confluence_scores?.premium_discount_score || 0,
      totalConfluenceScore: result.confluence_scores?.total_confluence_score || 0,
    };

    // 4. Persistence: Save to analysisHistory collection
    const historyId = await saveAnalysisToHistory(fullAnalysis);
    if (historyId) {
      fullAnalysis.id = historyId; // Attach document ID for UI tracking
    } else {
      console.warn("Athenix: Failed to commit analysis to history ledger.");
    }

    // 5. Activity update. Token deduction is now enforced server-side in /api/analyze.
    await updateDoc(userRef, {
      lastActiveAt: new Date().toISOString()
    });
    
    return { 
      status: 'success', 
      message: 'Neural analysis synthesized and committed to ledger.', 
      data: fullAnalysis 
    };
  } catch (error: any) {
    console.error("Critical Analysis Failure:", error);
    return { status: 'error', message: error.message || 'The neural engine encountered an unexpected exception.' };
  }
};

export const revalidateAnalysis = async (userId: string, analysisId: string, originalAnalysis: TradeAnalysis): Promise<BackendResponse> => {
  try {
    const userRef = doc(firestore, 'users', userId);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) return { status: 'error', message: 'User not found' };

    // Check if there is a valid trade to revalidate
    if (originalAnalysis.final_decision === 'no_trade' || !originalAnalysis.signal) {
      return { 
        status: 'success', 
        message: 'No active trade setup to revalidate.', 
        data: { validationResult: 'No Trade', lastValidatedAt: new Date().toISOString() } 
      };
    }

    // Fetch Current Price (Twelve Data via /api/market — normalized latest close)
    const type = originalAnalysis.marketType || (originalAnalysis.instrument.length < 5 ? 'stock' : 'forex');
    const marketData = await getMarketData(type, originalAnalysis.instrument, originalAnalysis.execution_timeframe || originalAnalysis.timeframe);

    let currentPrice = 0;
    if (marketData && marketData.success && marketData.price != null && Number.isFinite(marketData.price as number)) {
      currentPrice = marketData.price as number;
    }

    if (currentPrice === 0) {
      return { status: 'error', message: 'Unable to fetch live market price for revalidation.' };
    }

    // Run Logic Comparison
    const validationResult = await revalidateTradeSetup(originalAnalysis, currentPrice);
    
    // Update Firestore
    const timestamp = new Date().toISOString();
    await updateAnalysisValidation(analysisId, validationResult, timestamp);

    return { 
      status: 'success', 
      message: 'Setup revalidated against live price action.',
      data: { validationResult, lastValidatedAt: timestamp }
    };
  } catch (e: any) {
    return { status: 'error', message: e.message || 'Revalidation failed.' };
  }
};

export const getAILessonContent = async (userId: string, question: string, context?: string, difficulty: string = 'Intermediate', category?: string): Promise<BackendResponse> => {
  try {
    const userRef = doc(firestore, 'users', userId);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) return { status: 'error', message: 'User not found' };
    const user = userSnap.data() as UserProfile;

    if (user.accountStatus === 'suspended') {
      return { status: 'error', message: 'Account suspended.' };
    }

    if (user.educationTokens < 1) return { status: 'error', message: 'Insufficient education tokens.' };
    
    const result = await getEducationResponse(question, context, difficulty, category);
    
    await saveEducationInteraction(userId, {
      question,
      answer: result,
      context: context || 'Direct Query',
      category: category || 'General Trading',
      timestamp: new Date().toISOString()
    });
    
    // Token deduction is now enforced server-side in /api/education.
    await updateDoc(userRef, {
      lastActiveAt: new Date().toISOString()
    });
    return { status: 'success', message: 'Lesson generated', data: result };
  } catch (error: any) {
    return { status: 'error', message: error.message || 'Education error' };
  }
};

export const refillTokens = async (userId: string, type: 'analysis' | 'education', usdAmount: number): Promise<BackendResponse> => {
  try {
    const userRef = doc(firestore, 'users', userId);
    // Calculation: Analysis = $0.25/token ($5 for 20), Education = $0.01/token ($5 for 500)
    let tokenIncrement = type === 'analysis' ? (usdAmount / 5) * 20 : (usdAmount / 5) * 500;
    
    await runTransaction(firestore, async (transaction) => {
      // 1. Update User Balance
      transaction.update(userRef, { 
        [type === 'analysis' ? 'analysisTokens' : 'educationTokens']: increment(tokenIncrement) 
      });

      // 2. Log Revenue Transaction
      const transRef = doc(collection(firestore, 'token_transactions'));
      transaction.set(transRef, {
        userId,
        type: 'refill',
        resource: type,
        amount: tokenIncrement,
        cost: usdAmount,
        timestamp: serverTimestamp(),
        description: `User purchased ${tokenIncrement} ${type} tokens for $${usdAmount}`
      });
    });

    return { status: 'success', message: `${tokenIncrement} units credited to terminal.` };
  } catch (error: any) {
    return { status: 'error', message: 'Transaction protocol failed.' };
  }
};

// --- ADMIN ACTIONS ---

export const adminUpdateUser = async (adminId: string, targetUid: string, updates: Partial<UserProfile>): Promise<BackendResponse> => {
  if (!(await isAdmin(adminId))) return { status: 'error', message: 'Unauthorized' };
  const userRef = doc(firestore, 'users', targetUid);
  await updateDoc(userRef, updates);
  return { status: 'success', message: 'User updated' };
};

export const adminUpdateSubscription = async (adminId: string, targetUid: string, plan: SubscriptionPlan): Promise<BackendResponse> => {
  if (!(await isAdmin(adminId))) return { status: 'error', message: 'Unauthorized' };
  try {
    const userRef = doc(firestore, 'users', targetUid);
    await updateDoc(userRef, { 
      subscriptionPlan: plan,
      subscriptionStatus: plan === SubscriptionPlan.FREE ? 'none' : 'active'
    });
    return { status: 'success', message: `Plan updated to ${plan}` };
  } catch (e: any) {
    return { status: 'error', message: e.message };
  }
};

export const adminToggleUserStatus = async (adminId: string, targetUid: string, suspend: boolean): Promise<BackendResponse> => {
  if (!(await isAdmin(adminId))) return { status: 'error', message: 'Unauthorized' };
  try {
    const userRef = doc(firestore, 'users', targetUid);
    await updateDoc(userRef, { accountStatus: suspend ? 'suspended' : 'active' });
    return { status: 'success', message: `User ${suspend ? 'suspended' : 'activated'}` };
  } catch (e: any) {
    return { status: 'error', message: e.message };
  }
};

export const adminGrantTokens = async (adminId: string, targetUid: string, type: 'analysis' | 'education', amount: number): Promise<BackendResponse> => {
  if (!(await isAdmin(adminId))) return { status: 'error', message: 'Unauthorized' };
  try {
     const userRef = doc(firestore, 'users', targetUid);
     
     await runTransaction(firestore, async (transaction) => {
        // 1. Update User Balance
        transaction.update(userRef, { 
          [type === 'analysis' ? 'analysisTokens' : 'educationTokens']: increment(amount) 
        });

        // 2. Log Grant Transaction (Cost 0)
        const transRef = doc(collection(firestore, 'token_transactions'));
        transaction.set(transRef, {
          userId: targetUid,
          type: 'admin_grant',
          resource: type,
          amount: amount,
          cost: 0,
          timestamp: serverTimestamp(),
          description: `Admin granted ${amount} ${type} tokens`
        });
     });
     
     return { status: 'success', message: `${amount} ${type} tokens granted.` };
  } catch (e: any) {
    return { status: 'error', message: e.message };
  }
};

// NOTE: `adminManageSignal` was removed during post-audit cleanup. It was orphaned
// (no callers) and wrote a signal document shape incompatible with the TradingSignal
// type the UI reads (e.g. direction 'BUY'/'SELL', lowercase status, signalType, a
// hardcoded `confidence || 90`). The live signal path is SignalsControlCenter ->
// addSignal() in services/firestore.ts, which already matches the type.

export const adminManageLesson = async (adminId: string, action: 'create' | 'update' | 'delete', data: any): Promise<BackendResponse> => {
  if (!(await isAdmin(adminId))) return { status: 'error', message: 'Unauthorized' };
  const eduRef = collection(firestore, 'educationContent');
  if (action === 'create') {
      await addDoc(eduRef, data);
      await logAdminAction(adminId, 'Admin', 'Create Lesson', `Created lesson: ${data.title}`);
  }
  else if (action === 'update') {
      await updateDoc(doc(firestore, 'educationContent', data.id), data);
      await logAdminAction(adminId, 'Admin', 'Update Lesson', `Updated lesson: ${data.title}`);
  }
  else if (action === 'delete') {
      await deleteDoc(doc(firestore, 'educationContent', data.id));
      await logAdminAction(adminId, 'Admin', 'Delete Lesson', `Deleted lesson ${data.id}`);
  }
  return { status: 'success', message: `Lesson ${action}d` };
};

export const adminUpdateTokenConfig = async (adminId: string, config: TokenEconomyConfig): Promise<BackendResponse> => {
  if (!(await isAdmin(adminId))) return { status: 'error', message: 'Unauthorized' };
  const success = await updateTokenEconomyConfig(config);
  if (success) await logAdminAction(adminId, 'Admin', 'Config Update', 'Updated Token Economy');
  return { status: success ? 'success' : 'error', message: success ? 'Config updated' : 'Update failed' };
};

export const adminToggleAILearning = async (adminId: string, active: boolean): Promise<BackendResponse> => {
   if (!(await isAdmin(adminId))) return { status: 'error', message: 'Unauthorized' };
   await setDoc(doc(firestore, "system_config", "ai_learning"), { status: active ? 'active' : 'paused' }, { merge: true });
   await logAdminAction(adminId, 'Admin', 'System Config', `AI Learning set to ${active ? 'Active' : 'Paused'}`);
   return { status: 'success', message: `AI Learning ${active ? 'Resumed' : 'Paused'}` };
};

export const getSystemHealthStatus = async (): Promise<SystemHealth> => {
  const dbStatus = await checkDatabaseConnection() ? 'connected' : 'error';
  const apiStatus = await testMarketConnection() ? 'operational' : 'down';
  
  return {
    database: dbStatus,
    forexApi: apiStatus,
    stockApi: apiStatus, // Assuming shared endpoint
    aiApi: 'unknown', // Not probed from the client; AI runs server-side via /api/analyze
    lastCheck: new Date().toISOString()
  };
};

export const verifyBackendConnectivity = async () => {
  try {
    const status = await getSystemHealthStatus();
    console.log(`[Athenix System Check] DB: ${status.database}, API: ${status.forexApi}`);
  } catch (e) {
    console.warn("Athenix: System health check failed during initialization.");
  }
};
