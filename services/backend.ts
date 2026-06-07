
import { doc, getDoc, updateDoc, increment, collection, addDoc, runTransaction, deleteDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { firestore } from '../firebase';
import { analyzeMarket as callGeminiAnalysis, getEducationResponse, revalidateTradeSetup } from './geminiService';
import { getMarketData, testMarketConnection } from './marketData';
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

export const analyzeMarket = async (
  userId: string, 
  symbol: string, 
  timeframe: string, 
  includeFundamentals: boolean,
  marketType?: 'forex' | 'crypto' | 'stock' | 'metals' | 'indices'
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
    try {
      const marketData = await getMarketData(resolvedMarketType, symbol, timeframe);

      if (marketData && !marketData.error) {
        marketContext = JSON.stringify(marketData);
      }
    } catch (err) {
      console.warn("Athenix: Live price context unavailable, using historical neural weights.");
    }

    // 2. Call Gemini Analysis Engine
    const result = await callGeminiAnalysis(symbol, timeframe, includeFundamentals, marketContext);
    
    // 3. Prepare full record for persistence (Flattened for query/sorting)
    const fullAnalysis: TradeAnalysis = {
      ...result,
      userId: userId,
      timestamp: new Date().toISOString(),
      status: 'active',
      marketType: resolvedMarketType,
      
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
