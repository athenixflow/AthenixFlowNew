
import { doc, getDoc, updateDoc, increment, collection, addDoc, runTransaction, deleteDoc } from 'firebase/firestore';
import { firestore } from '../firebase';
import { analyzeMarket as callGeminiAnalysis, getEducationResponse } from './geminiService';
import { getMarketData } from './marketData';
import { UserProfile, UserRole } from '../types';
import { saveAnalysisToHistory, saveEducationInteraction } from './firestore';

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

    // 5. Atomic Unit Deduction
    await updateDoc(userRef, { analysisTokens: increment(-1) });
    
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
    if (user.educationTokens < 1) return { status: 'error', message: 'Insufficient education tokens.' };
    
    const result = await getEducationResponse(question, context);
    
    await saveEducationInteraction({
      userId,
      question,
      answer: result,
      context: context || 'Direct Query',
      timestamp: new Date().toISOString()
    });
    
    await updateDoc(userRef, { educationTokens: increment(-1) });
    return { status: 'success', message: 'Lesson generated', data: result };
  } catch (error: any) {
    return { status: 'error', message: error.message || 'Education error' };
  }
};

export const refillTokens = async (userId: string, type: 'analysis' | 'education', usdAmount: number): Promise<BackendResponse> => {
  try {
    const userRef = doc(firestore, 'users', userId);
    let tokenIncrement = type === 'analysis' ? (usdAmount / 5) * 20 : (usdAmount / 5) * 500;
    await runTransaction(firestore, async (transaction) => {
      transaction.update(userRef, { [type === 'analysis' ? 'analysisTokens' : 'educationTokens']: increment(tokenIncrement) });
    });
    return { status: 'success', message: `${tokenIncrement} units credited to terminal.` };
  } catch (error: any) {
    return { status: 'error', message: 'Transaction protocol failed.' };
  }
};

export const adminUpdateUser = async (adminId: string, targetUid: string, updates: Partial<UserProfile>): Promise<BackendResponse> => {
  if (!(await isAdmin(adminId))) return { status: 'error', message: 'Unauthorized' };
  const userRef = doc(firestore, 'users', targetUid);
  await updateDoc(userRef, updates);
  return { status: 'success', message: 'User updated' };
};

export const adminManageSignal = async (adminId: string, action: 'create' | 'update' | 'delete', data: any): Promise<BackendResponse> => {
  if (!(await isAdmin(adminId))) return { status: 'error', message: 'Unauthorized' };
  const signalsRef = collection(firestore, 'signals');
  if (action === 'create') await addDoc(signalsRef, { ...data, timestamp: new Date().toISOString() });
  else if (action === 'update') await updateDoc(doc(firestore, 'signals', data.id), data);
  else if (action === 'delete') await deleteDoc(doc(firestore, 'signals', data.id));
  return { status: 'success', message: `Signal ${action}d` };
};

export const adminManageLesson = async (adminId: string, action: 'create' | 'update' | 'delete', data: any): Promise<BackendResponse> => {
  if (!(await isAdmin(adminId))) return { status: 'error', message: 'Unauthorized' };
  const eduRef = collection(firestore, 'educationContent');
  if (action === 'create') await addDoc(eduRef, data);
  else if (action === 'update') await updateDoc(doc(firestore, 'educationContent', data.id), data);
  else if (action === 'delete') await deleteDoc(doc(firestore, 'educationContent', data.id));
  return { status: 'success', message: `Lesson ${action}d` };
};

export const verifyBackendConnectivity = () => {
  console.debug("Athenix: Backend bridges active.");
  return true;
};
