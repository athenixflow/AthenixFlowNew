
import { doc, getDoc, setDoc, collection, getDocs, query, where, orderBy, addDoc, limit, Timestamp, serverTimestamp, updateDoc } from "firebase/firestore";
import { firestore } from "../firebase";
import { UserProfile, UserRole, SubscriptionPlan, TradingSignal, JournalEntry, Lesson, TradeAnalysis, AnalysisFeedback } from "../types";

export const initializeUserDocument = async (uid: string, data: { fullName: string; email: string }) => {
  try {
    const userRef = doc(firestore, "users", uid);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
      const newUser: UserProfile = {
        uid,
        fullName: data.fullName || 'New Trader',
        email: data.email || '',
        role: UserRole.USER,
        subscriptionPlan: SubscriptionPlan.LITE,
        subscriptionStatus: 'active',
        analysisTokens: 0,
        educationTokens: 0,
        createdAt: new Date().toISOString()
      };
      await setDoc(userRef, newUser);
      return newUser;
    }
    return userSnap.data() as UserProfile;
  } catch (error) { return null; }
};

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  if (!uid) return null;
  const userSnap = await getDoc(doc(firestore, "users", uid));
  return userSnap.exists() ? (userSnap.data() as UserProfile) : null;
};

export const getActiveSignals = async (): Promise<TradingSignal[]> => {
  const q = query(collection(firestore, "signals"), orderBy("timestamp", "desc"), limit(30));
  const snap = await getDocs(q);
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as TradingSignal));
};

// --- JOURNAL SERVICES ---

export const getJournalEntries = async (userId: string): Promise<JournalEntry[]> => {
  try {
    const q = query(
      collection(firestore, "tradeJournal"), 
      where("userId", "==", userId), 
      orderBy("createdAt", "desc")
    );
    
    const snap = await getDocs(q);
    
    return snap.docs.map(doc => {
      const data = doc.data();
      let createdDate = new Date().toISOString();
      if (data.createdAt && typeof data.createdAt.toDate === 'function') {
        createdDate = data.createdAt.toDate().toISOString();
      } else if (data.createdAt) {
         createdDate = new Date(data.createdAt).toISOString();
      }

      return {
        id: doc.id,
        userId: data.userId,
        title: data.title || 'Untitled',
        market: data.market || '',
        notes: data.notes || '',
        
        // New Fields
        direction: data.direction || 'BUY',
        entryPrice: data.entryPrice || '',
        stopLoss: data.stopLoss || '',
        takeProfit: data.takeProfit || '',
        outcome: data.outcome || 'open',
        
        createdAt: createdDate
      } as JournalEntry;
    });
  } catch (error) {
    console.error("Error fetching journal entries:", error);
    return [];
  }
};

export const addJournalEntry = async (userId: string, entry: Partial<JournalEntry>) => {
  try {
    if (!userId) return { success: false, error: "Authentication missing" };

    const docRef = await addDoc(collection(firestore, "tradeJournal"), {
      userId,
      title: entry.title,
      market: entry.market || '',
      notes: entry.notes || '',
      
      // New Fields
      direction: entry.direction || 'BUY',
      entryPrice: entry.entryPrice || '',
      stopLoss: entry.stopLoss || '',
      takeProfit: entry.takeProfit || '',
      outcome: entry.outcome || 'open',
      
      createdAt: serverTimestamp()
    });

    return { success: true, id: docRef.id };
  } catch (e: any) {
    console.error("[Journal] Save Failed:", e.message);
    return { success: false, error: e.message };
  }
};

// --- ANALYSIS HISTORY SERVICES ---

export const saveAnalysisToHistory = async (analysis: TradeAnalysis) => {
  try {
    if (!analysis.userId) return null;
    
    const docRef = await addDoc(collection(firestore, "analysisHistory"), {
      ...analysis,
      timestamp: serverTimestamp() // Overwrite with server time for accuracy
    });
    
    return docRef.id;
  } catch (e) {
    console.error("Failed to save analysis history:", e);
    return null;
  }
};

export const getUserAnalysisHistory = async (userId: string): Promise<TradeAnalysis[]> => {
  try {
    const q = query(
      collection(firestore, "analysisHistory"),
      where("userId", "==", userId),
      orderBy("timestamp", "desc"),
      limit(50)
    );
    const snap = await getDocs(q);
    
    return snap.docs.map(doc => {
      const data = doc.data();
      let ts = new Date().toISOString();
      if (data.timestamp?.toDate) ts = data.timestamp.toDate().toISOString();
      
      return {
        id: doc.id,
        ...data,
        timestamp: ts
      } as TradeAnalysis;
    });
  } catch (e) {
    console.error("Failed to fetch analysis history:", e);
    return [];
  }
};

export const submitAnalysisFeedback = async (analysisId: string, feedback: AnalysisFeedback) => {
  try {
    const ref = doc(firestore, "analysisHistory", analysisId);
    await updateDoc(ref, { feedback });
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
};

// --- EDUCATION & ADMIN ---

export const getEducationLessons = async (): Promise<Lesson[]> => {
  const snap = await getDocs(collection(firestore, "educationContent"));
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Lesson));
};

export const getAllUsers = async (): Promise<UserProfile[]> => {
  const snap = await getDocs(collection(firestore, "users"));
  return snap.docs.map(doc => doc.data() as UserProfile);
};

export const checkDatabaseConnection = async (): Promise<boolean> => {
  try {
    await getDocs(query(collection(firestore, "signals"), limit(1)));
    return true;
  } catch (e) {
    return false;
  }
};
