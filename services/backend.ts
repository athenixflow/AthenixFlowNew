
import { doc, getDoc, updateDoc, increment, collection, addDoc, runTransaction, deleteDoc, setDoc, query, getDocs, limit } from 'firebase/firestore';
import { firestore } from '../lib/firebase';
import { analyzeMarket as callGeminiAnalysis, getEducationResponse } from './geminiService';
import { SubscriptionPlan, UserProfile, UserRole, TradingSignal, Lesson } from '../types';

/**
 * Athenix Backend Service Layer
 * Simulates Cloud Functions enforcement for tokens, subscription rules, and Admin controls.
 */

export interface BackendResponse<T = any> {
  message: string;
  status: 'success' | 'error';
  data?: T;
}

/**
 * UTILITY: Check Admin Status
 */
const isAdmin = async (userId: string): Promise<boolean> => {
  const userRef = doc(firestore, 'users', userId);
  const userSnap = await getDoc(userRef);
  return userSnap.exists() && userSnap.data()?.role === UserRole.ADMIN;
};

/**
 * 3. TOKEN ENFORCEMENT — AI ANALYSIS
 */
export const analyzeMarket = async (
  userId: string,
  symbol: string,
  timeframe: string,
  includeFundamentals: boolean
): Promise<BackendResponse> => {
  try {
    const userRef = doc(firestore, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) return { status: 'error', message: 'User not found' };
    const user = userSnap.data() as UserProfile;

    if (user.subscriptionPlan === SubscriptionPlan.LITE && includeFundamentals) {
      return { status: 'error', message: 'Upgrade required for fundamental analysis. Your current plan only supports technical setups.' };
    }

    if (user.analysisTokens < 1) {
      return { status: 'error', message: 'Insufficient analysis tokens. Please refill in the Billing terminal.' };
    }

    const result = await callGeminiAnalysis(symbol, timeframe, includeFundamentals);

    await updateDoc(userRef, {
      analysisTokens: increment(-1)
    });

    await addDoc(collection(firestore, 'tokenTransactions'), {
      userId,
      type: 'deduction',
      resource: 'analysis',
      amount: 1,
      description: `Neural Analysis: ${symbol} (${timeframe})`,
      timestamp: new Date().toISOString()
    });

    return { status: 'success', message: 'Analysis complete', data: result };
  } catch (error: any) {
    console.error("Backend: Analysis failed", error);
    return { status: 'error', message: error.message || 'Analysis internal error' };
  }
};

/**
 * 4. TOKEN ENFORCEMENT — EDUCATION HUB
 */
export const getAILessonContent = async (
  userId: string,
  question: string,
  context?: string
): Promise<BackendResponse> => {
  try {
    const userRef = doc(firestore, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) return { status: 'error', message: 'User not found' };
    const user = userSnap.data() as UserProfile;

    if (user.educationTokens < 1) {
      return { status: 'error', message: 'Insufficient education tokens. Please refill in the Billing terminal.' };
    }

    const result = await getEducationResponse(question, context);

    await updateDoc(userRef, {
      educationTokens: increment(-1)
    });

    await addDoc(collection(firestore, 'tokenTransactions'), {
      userId,
      type: 'deduction',
      resource: 'education',
      amount: 1,
      description: `Knowledge Query: ${question.substring(0, 30)}...`,
      timestamp: new Date().toISOString()
    });

    return { status: 'success', message: 'Lesson generated', data: result };
  } catch (error: any) {
    console.error("Backend: Education fetch failed", error);
    return { status: 'error', message: error.message || 'Education service error' };
  }
};

/**
 * 5. TOKEN REFILL LOGIC
 */
export const refillTokens = async (
  userId: string,
  type: 'analysis' | 'education',
  usdAmount: number
): Promise<BackendResponse> => {
  try {
    const userRef = doc(firestore, 'users', userId);
    
    let tokenIncrement = 0;
    if (type === 'analysis') {
      tokenIncrement = (usdAmount / 5) * 20;
    } else {
      tokenIncrement = (usdAmount / 5) * 500;
    }

    if (tokenIncrement <= 0) return { status: 'error', message: 'Invalid refill amount' };

    await runTransaction(firestore, async (transaction) => {
      const userDoc = await transaction.get(userRef);
      if (!userDoc.exists()) throw "User does not exist";
      
      transaction.update(userRef, {
        [type === 'analysis' ? 'analysisTokens' : 'educationTokens']: increment(tokenIncrement)
      });
    });

    await addDoc(collection(firestore, 'tokenTransactions'), {
      userId,
      type: 'refill',
      resource: type,
      amount: tokenIncrement,
      description: `Credit Refill: $${usdAmount.toFixed(2)} purchase`,
      timestamp: new Date().toISOString()
    });

    return { status: 'success', message: `${tokenIncrement} tokens added to terminal.` };
  } catch (error: any) {
    console.error("Backend: Refill failed", error);
    return { status: 'error', message: 'Transaction failed' };
  }
};

/**
 * ADMIN: USER MANAGEMENT
 */
export const adminUpdateUser = async (adminId: string, targetUid: string, updates: Partial<UserProfile>): Promise<BackendResponse> => {
  if (!(await isAdmin(adminId))) return { status: 'error', message: 'Unauthorized' };
  try {
    const userRef = doc(firestore, 'users', targetUid);
    await updateDoc(userRef, updates);
    return { status: 'success', message: 'User updated successfully' };
  } catch (error) {
    return { status: 'error', message: 'Failed to update user' };
  }
};

/**
 * ADMIN: SIGNALS MANAGEMENT
 */
export const adminManageSignal = async (adminId: string, action: 'create' | 'update' | 'delete', signalData: any): Promise<BackendResponse> => {
  if (!(await isAdmin(adminId))) return { status: 'error', message: 'Unauthorized' };
  try {
    const signalsRef = collection(firestore, 'signals');
    if (action === 'create') {
      await addDoc(signalsRef, { ...signalData, timestamp: new Date().toISOString() });
    } else if (action === 'update' && signalData.id) {
      const sigDoc = doc(firestore, 'signals', signalData.id);
      await updateDoc(sigDoc, signalData);
    } else if (action === 'delete' && signalData.id) {
      await deleteDoc(doc(firestore, 'signals', signalData.id));
    }
    return { status: 'success', message: `Signal ${action}d successfully` };
  } catch (error) {
    return { status: 'error', message: `Failed to ${action} signal` };
  }
};

/**
 * ADMIN: EDUCATION MANAGEMENT
 */
export const adminManageLesson = async (adminId: string, action: 'create' | 'update' | 'delete', lessonData: any): Promise<BackendResponse> => {
  if (!(await isAdmin(adminId))) return { status: 'error', message: 'Unauthorized' };
  try {
    const eduRef = collection(firestore, 'educationContent');
    if (action === 'create') {
      await addDoc(eduRef, lessonData);
    } else if (action === 'update' && lessonData.id) {
      const lesDoc = doc(firestore, 'educationContent', lessonData.id);
      await updateDoc(lesDoc, lessonData);
    } else if (action === 'delete' && lessonData.id) {
      await deleteDoc(doc(firestore, 'educationContent', lessonData.id));
    }
    return { status: 'success', message: `Lesson ${action}d successfully` };
  } catch (error) {
    return { status: 'error', message: `Failed to ${action} lesson` };
  }
};

/**
 * ADMIN: SYSTEM CONFIGURATION
 */
export const adminUpdateConfig = async (adminId: string, key: string, value: any): Promise<BackendResponse> => {
  if (!(await isAdmin(adminId))) return { status: 'error', message: 'Unauthorized' };
  try {
    const configRef = doc(firestore, 'systemConfig', key);
    await setDoc(configRef, { value, updatedAt: new Date().toISOString() });
    return { status: 'success', message: 'System configuration updated' };
  } catch (error) {
    return { status: 'error', message: 'Failed to update config' };
  }
};

export const verifyBackendConnectivity = async () => {
  console.debug("Athenix: Backend enforcement bridges active.");
  return true;
};
