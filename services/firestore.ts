
import { doc, getDoc, setDoc, collection, getDocs, query, where, orderBy, addDoc, limit, Timestamp, serverTimestamp, updateDoc } from "firebase/firestore";
import { firestore } from "../firebase";
import { UserProfile, UserRole, SubscriptionPlan, TradingSignal, JournalEntry, Lesson, TradeAnalysis, AnalysisFeedback, EducationInteraction } from "../types";

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
  try {
    // Fetch all signals without server-side ordering/limit to avoid index issues
    const q = query(collection(firestore, "signals"));
    const snap = await getDocs(q);
    
    const signals = snap.docs.map(doc => {
      const data = doc.data();
      // Handle timestamp normalization
      let ts = new Date().toISOString();
      if (data.timestamp && typeof data.timestamp.toDate === 'function') {
        ts = data.timestamp.toDate().toISOString();
      } else if (data.timestamp) {
        ts = new Date(data.timestamp).toISOString();
      }

      return { 
        id: doc.id, 
        ...data,
        // Map legacy 'pair' to 'instrument' if needed
        instrument: data.instrument || data.pair || 'Unknown',
        timestamp: ts
      } as TradingSignal;
    });

    // Client-side sort: Newest first
    return signals.sort((a, b) => {
      const timeA = new Date(a.timestamp).getTime();
      const timeB = new Date(b.timestamp).getTime();
      return timeB - timeA;
    });
  } catch (error) {
    console.error("Error fetching signals:", error);
    return [];
  }
};

// --- JOURNAL SERVICES ---

export const getJournalEntries = async (userId: string): Promise<JournalEntry[]> => {
  try {
    // Query without orderBy to prevent "Missing Index" errors which block data from showing
    // We filter strictly by userId to ensure user specificity
    const q = query(
      collection(firestore, "tradeJournal"), 
      where("userId", "==", userId)
    );
    
    const snap = await getDocs(q);
    
    const entries = snap.docs.map(doc => {
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

    // Client-side sort: Newest first
    return entries.sort((a, b) => {
      const timeA = new Date(a.createdAt).getTime();
      const timeB = new Date(b.createdAt).getTime();
      return timeB - timeA;
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
    // Query without orderBy to prevent "Missing Index" errors which block data from showing
    // We filter strictly by userId to ensure user specificity
    const q = query(
      collection(firestore, "analysisHistory"),
      where("userId", "==", userId)
    );
    
    const snap = await getDocs(q);
    
    const analyses = snap.docs.map(doc => {
      const data = doc.data();
      let ts = new Date().toISOString(); // Default fallback
      
      // Robust timestamp handling for mixed serverTimestamp/string data
      if (data.timestamp && typeof data.timestamp.toDate === 'function') {
        ts = data.timestamp.toDate().toISOString();
      } else if (data.timestamp && typeof data.timestamp === 'string') {
        ts = data.timestamp;
      } else if (data.timestamp && typeof data.timestamp === 'number') {
        ts = new Date(data.timestamp).toISOString();
      }
      
      return {
        id: doc.id,
        ...data,
        timestamp: ts
      } as TradeAnalysis;
    });

    // Client-side sort: Newest first
    return analyses.sort((a, b) => {
      const timeA = new Date(a.timestamp || 0).getTime();
      const timeB = new Date(b.timestamp || 0).getTime();
      return timeB - timeA;
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

// --- EDUCATION SERVICES ---

export const getEducationLessons = async (): Promise<Lesson[]> => {
  const snap = await getDocs(collection(firestore, "educationContent"));
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Lesson));
};

export const saveEducationInteraction = async (interaction: EducationInteraction) => {
    try {
        const docRef = await addDoc(collection(firestore, "educationHistory"), {
            ...interaction,
            timestamp: serverTimestamp()
        });
        return docRef.id;
    } catch (e) {
        console.error("Failed to save education history", e);
        return null;
    }
}

export const getUserEducationHistory = async (userId: string): Promise<EducationInteraction[]> => {
    try {
        const q = query(
          collection(firestore, "educationHistory"), 
          where("userId", "==", userId)
        );
        
        const snap = await getDocs(q);
        
        const history = snap.docs.map(doc => {
             const data = doc.data();
             let ts = new Date().toISOString();
             if (data.timestamp && typeof data.timestamp.toDate === 'function') {
                ts = data.timestamp.toDate().toISOString();
             } else if (data.timestamp) {
                ts = new Date(data.timestamp).toISOString();
             }
             return { id: doc.id, ...data, timestamp: ts } as EducationInteraction;
        });
        
        // Client side sort: Newest first
        return history.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    } catch (e) {
        console.error("Failed to fetch education history", e);
        return [];
    }
}

// --- ADMIN & SYSTEM ---

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
