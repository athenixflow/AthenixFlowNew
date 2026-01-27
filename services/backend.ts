
import { doc, getDoc, updateDoc, increment, collection, addDoc, runTransaction, deleteDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { firestore } from '../firebase';
import { analyzeMarket as callGeminiAnalysis, getEducationResponse } from './geminiService';
import { getMarketData, testMarketConnection } from './marketData';
import { UserProfile, UserRole, SubscriptionPlan, TokenEconomyConfig, SystemHealth, TradingSignal } from '../types';
import { saveAnalysisToHistory, saveEducationInteraction, updateTokenEconomyConfig, logAdminAction, checkDatabaseConnection } from './firestore';

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
  marketType?: 'forex' | 'stock'
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

    // 1. Fetch Real-Time Market Data
    let marketContext = '';
    try {
      const type = marketType || (symbol.length < 5 ? 'stock' : 'forex');
      const marketData = await getMarketData(type, symbol);
      
      if (marketData && !marketData.error) {
        marketContext = JSON.stringify(marketData);
      }
    } catch (err) {
      console.warn("Athenix: Live price context unavailable, using historical neural weights.");
    }

    // 2. Call Gemini Analysis Engine
    const result = await callGeminiAnalysis(symbol, timeframe, includeFundamentals, marketContext);
    
    // 3. Prepare full record for persistence
    const fullAnalysis = {
      ...result,
      userId: userId,
      timestamp: new Date().toISOString()
    };

    // 4. Persistence: Save to analysisHistory collection
    const historyId = await saveAnalysisToHistory(fullAnalysis);
    if (historyId) {
      fullAnalysis.id = historyId; // Attach document ID for UI tracking
    } else {
      console.warn("Athenix: Failed to commit analysis to history ledger.");
    }

    // 5. Atomic Unit Deduction & Activity Update
    await updateDoc(userRef, { 
      analysisTokens: increment(-1),
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

export const getAILessonContent = async (userId: string, question: string, context?: string): Promise<BackendResponse> => {
  try {
    const userRef = doc(firestore, 'users', userId);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) return { status: 'error', message: 'User not found' };
    const user = userSnap.data() as UserProfile;

    if (user.accountStatus === 'suspended') {
      return { status: 'error', message: 'Account suspended.' };
    }

    if (user.educationTokens < 1) return { status: 'error', message: 'Insufficient education tokens.' };
    
    const result = await getEducationResponse(question, context);
    
    await saveEducationInteraction({
      userId,
      question,
      answer: result,
      context: context || 'Direct Query',
      timestamp: new Date().toISOString()
    });
    
    await updateDoc(userRef, { 
      educationTokens: increment(-1),
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

export const adminManageSignal = async (adminId: string, action: 'create' | 'update' | 'delete' | 'soft_delete', data: any): Promise<BackendResponse> => {
  if (!(await isAdmin(adminId))) return { status: 'error', message: 'Unauthorized' };
  const signalsRef = collection(firestore, 'signals');
  
  try {
    if (action === 'create') {
      const entry = parseFloat(data.entry);
      const sl = parseFloat(data.stopLoss);
      const tp = parseFloat(data.takeProfit);
      
      let rrRatio = 0;
      if (!isNaN(entry) && !isNaN(sl) && !isNaN(tp) && entry !== sl) {
        const risk = Math.abs(entry - sl);
        const reward = Math.abs(tp - entry);
        if (risk > 0) {
           rrRatio = reward / risk;
        }
      }

      // Default status logic: 'pending' for limit orders, 'active' for market orders
      let initialStatus = 'pending';
      let triggeredAtVal = null;
      if (data.signalType && (data.signalType.toLowerCase().includes('limit') || data.signalType.toLowerCase().includes('stop'))) {
         initialStatus = 'pending';
      } else {
         initialStatus = 'active';
         triggeredAtVal = new Date().toISOString();
      }

      // Legacy field mapping
      const direction = (data.signalType && data.signalType.toUpperCase().includes('BUY')) ? 'BUY' : 'SELL';

      const payload = {
        instrument: data.instrument,
        market: data.market,
        timeframe: data.timeframe,
        signalType: data.signalType,
        entry: entry,
        stopLoss: sl,
        takeProfit: tp,
        rrRatio: parseFloat(rrRatio.toFixed(2)),
        status: initialStatus,
        triggeredAt: triggeredAtVal,
        
        direction: direction,
        confidence: data.confidence || 90,
        audience: data.audience || 'all_users',
        plans: data.plans || [],
        notes: data.notes || '',

        authorId: adminId,
        author: data.author || 'Admin',
        timestamp: new Date().toISOString(),
        createdAt: serverTimestamp(),
        isDeleted: false
      };
      
      const docRef = await addDoc(signalsRef, payload);
      await logAdminAction(adminId, 'Admin', 'signal_published', `Created ${initialStatus} signal for ${data.instrument} (ID: ${docRef.id})`);
    }
    else if (action === 'update') {
      const { id, ...rest } = data; // Destructure ID to avoid overwriting it in document
      if (!id) return { status: 'error', message: 'Signal ID missing for update' };

      // 1. Sanitize updates to remove undefined fields
      const updates: Record<string, any> = {};
      Object.keys(rest).forEach(key => {
        if (rest[key] !== undefined) {
          updates[key] = rest[key];
        }
      });
      
      // Auto-timestamp logic
      if (updates.status === 'active' || updates.status === 'triggered') {
         // If triggering a pending signal, set triggeredAt
         if (!updates.triggeredAt) updates.triggeredAt = new Date().toISOString();
      }
      
      const completedStatuses = ['completed_tp', 'completed_sl', 'completed_be'];
      if (completedStatuses.includes(updates.status)) {
         if (!updates.closedAt) updates.closedAt = new Date().toISOString();
         // Map simple outcome
         if (updates.status === 'completed_tp') updates.finalOutcome = 'win';
         if (updates.status === 'completed_sl') updates.finalOutcome = 'loss';
         if (updates.status === 'completed_be') updates.finalOutcome = 'be';
      } else {
         // Ensure exitPrice is NOT included for non-completed statuses unless explicitly intended
         // This prevents stale or undefined exitPrice from persisting or causing errors if it was filtered out
         delete updates.exitPrice;
         delete updates.finalOutcome;
      }

      const docRef = doc(firestore, 'signals', id);
      await updateDoc(docRef, updates);
      await logAdminAction(adminId, 'Admin', 'Update Signal', `Updated signal ${id}`);
    }
    else if (action === 'soft_delete') {
      await updateDoc(doc(firestore, 'signals', data.id), { isDeleted: true });
      await logAdminAction(adminId, 'Admin', 'Soft Delete Signal', `Soft deleted signal ${data.id}`);
    }
    else if (action === 'delete') {
      await deleteDoc(doc(firestore, 'signals', data.id));
      await logAdminAction(adminId, 'Admin', 'Hard Delete Signal', `Permanently deleted signal ${data.id}`);
    }
    return { status: 'success', message: `Signal processed (${action})` };
  } catch (e: any) {
    console.error("Signal Ops Error:", e);
    return { status: 'error', message: e.message };
  }
};

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
    aiApi: 'operational', // Mocking for now, could ping Gemini
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
