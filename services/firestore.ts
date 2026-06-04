
import { doc, getDoc, setDoc, collection, getDocs, query, where, orderBy, addDoc, limit, Timestamp, serverTimestamp, updateDoc, deleteDoc, getCountFromServer, onSnapshot, Unsubscribe } from "firebase/firestore";
import { firestore, auth } from "../firebase";
import { UserProfile, UserRole, SubscriptionPlan, TradingSignal, JournalEntry, Lesson, TradeAnalysis, AnalysisFeedback, EducationInteraction, AdminOverviewMetrics, RevenueMetrics, AIOversightMetrics, TokenEconomyConfig, AuditLogEntry, SignalPublisher, Subscription, Referral, TokenTransaction } from "../types";

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const initializeUserDocument = async (uid: string, data: { fullName: string; email: string }) => {
  try {
    const userRef = doc(firestore, "users", uid);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
      const referralCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      const referralLink = `${window.location.origin}/?ref=${referralCode}`;
      
      const newUser: UserProfile = {
        uid,
        fullName: data.fullName || 'New Trader',
        email: data.email || '',
        role: UserRole.USER,
        subscriptionPlan: SubscriptionPlan.LITE,
        subscriptionStatus: 'active',
        accountStatus: 'active',
        analysisTokens: 0,
        educationTokens: 0,
        tokens: 0,
        referralCode,
        referralLink,
        createdAt: new Date().toISOString()
      };
      await setDoc(userRef, newUser);
      return newUser;
    }
    
    // Ensure existing users get a referral code if they don't have one
    const existingUser = userSnap.data() as UserProfile;
    if (!existingUser.referralCode) {
      const referralCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      const referralLink = `${window.location.origin}/?ref=${referralCode}`;
      await updateDoc(userRef, { referralCode, referralLink });
      existingUser.referralCode = referralCode;
      existingUser.referralLink = referralLink;
    }
    
    return existingUser;
  } catch (error) { 
    if (error instanceof Error && error.message.includes('permission')) {
      handleFirestoreError(error, OperationType.WRITE, `users/${uid}`);
    }
    return null; 
  }
};

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  if (!uid) return null;
  try {
    const userSnap = await getDoc(doc(firestore, "users", uid));
    return userSnap.exists() ? (userSnap.data() as UserProfile) : null;
  } catch (error) {
    if (error instanceof Error && error.message.includes('permission')) {
      handleFirestoreError(error, OperationType.GET, `users/${uid}`);
    }
    return null;
  }
};

// --- SIGNAL SERVICES ---

export const subscribeToSignals = (callback: (signals: TradingSignal[]) => void): Unsubscribe => {
  const q = query(collection(firestore, "signals"), orderBy("timestamp", "desc"));
  return onSnapshot(q, (snap) => {
    const signals = snap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as TradingSignal));
    callback(signals);
  }, (error) => {
    console.error("Signals Subscription Error:", error);
  });
};

export const addSignal = async (signal: Omit<TradingSignal, 'id' | 'timestamp'>) => {
  const path = "signals";
  try {
    const docRef = await addDoc(collection(firestore, path), {
      ...signal,
      timestamp: serverTimestamp()
    });
    return { success: true, id: docRef.id };
  } catch (e: any) {
    console.error("[Signals] Add Failed:", e.message);
    if (e instanceof Error && e.message.includes('permission')) {
      handleFirestoreError(e, OperationType.CREATE, path);
    }
    return { success: false, error: e.message };
  }
};

export const updateSignal = async (signalId: string, updates: Partial<TradingSignal>) => {
  const path = `signals/${signalId}`;
  try {
    const ref = doc(firestore, "signals", signalId);
    await updateDoc(ref, updates);
    return { success: true };
  } catch (e: any) {
    console.error("[Signals] Update Failed:", e.message);
    if (e instanceof Error && e.message.includes('permission')) {
      handleFirestoreError(e, OperationType.UPDATE, path);
    }
    return { success: false, error: e.message };
  }
};

export const deleteSignal = async (signalId: string) => {
  const path = `signals/${signalId}`;
  try {
    await deleteDoc(doc(firestore, "signals", signalId));
    return { success: true };
  } catch (e: any) {
    console.error("[Signals] Delete Failed:", e.message);
    if (e instanceof Error && e.message.includes('permission')) {
      handleFirestoreError(e, OperationType.DELETE, path);
    }
    return { success: false, error: e.message };
  }
};

export const getSignalPublishers = async (): Promise<SignalPublisher[]> => {
  const path = "signal_publishers";
  try {
    const snap = await getDocs(collection(firestore, path));
    return snap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as SignalPublisher));
  } catch (error) {
    console.error("Error fetching publishers:", error);
    return [];
  }
};

export const updateSignalPublisherPermission = async (userId: string, canPost: boolean, approvedBy: string, name: string, role: string) => {
  const path = `signal_publishers/${userId}`;
  try {
    const ref = doc(firestore, "signal_publishers", userId);
    await setDoc(ref, {
      userId,
      name,
      role,
      canPostSignals: canPost,
      approvedBy,
      timestamp: serverTimestamp()
    }, { merge: true });
    return { success: true };
  } catch (e: any) {
    console.error("[Publishers] Update Failed:", e.message);
    return { success: false, error: e.message };
  }
};

export const checkSignalPublisherPermission = async (userId: string): Promise<boolean> => {
  try {
    const ref = doc(firestore, "signal_publishers", userId);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      return snap.data().canPostSignals === true;
    }
    return false;
  } catch (error) {
    return false;
  }
};

// --- JOURNAL SERVICES ---

export const getJournalEntries = async (userId: string): Promise<JournalEntry[]> => {
  const path = "tradeJournal";
  try {
    const q = query(
      collection(firestore, path), 
      where("userId", "==", userId),
      orderBy("timestamp", "desc")
    );
    
    const snap = await getDocs(q);
    
    return snap.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data
      } as JournalEntry;
    });
  } catch (error) {
    console.error("Error fetching journal entries:", error);
    if (error instanceof Error && error.message.includes('permission')) {
      handleFirestoreError(error, OperationType.LIST, path);
    }
    return [];
  }
};

export const addJournalEntry = async (userId: string, entry: Omit<JournalEntry, 'id' | 'userId' | 'timestamp'>) => {
  const path = "tradeJournal";
  try {
    if (!userId) return { success: false, error: "Authentication missing" };

    const docRef = await addDoc(collection(firestore, path), {
      userId,
      ...entry,
      timestamp: new Date().toISOString(),
      createdAt: serverTimestamp()
    });

    return { success: true, id: docRef.id };
  } catch (e: any) {
    console.error("[Journal] Save Failed:", e.message);
    if (e instanceof Error && e.message.includes('permission')) {
      handleFirestoreError(e, OperationType.CREATE, path);
    }
    return { success: false, error: e.message };
  }
};

export const updateJournalEntry = async (entryId: string, updates: Partial<JournalEntry>) => {
  const path = `tradeJournal/${entryId}`;
  try {
    const ref = doc(firestore, "tradeJournal", entryId);
    await updateDoc(ref, updates);
    return { success: true };
  } catch (e: any) {
    console.error("[Journal] Update Failed:", e.message);
    if (e instanceof Error && e.message.includes('permission')) {
      handleFirestoreError(e, OperationType.UPDATE, path);
    }
    return { success: false, error: e.message };
  }
};

export const deleteJournalEntry = async (entryId: string) => {
  const path = `tradeJournal/${entryId}`;
  try {
    await deleteDoc(doc(firestore, "tradeJournal", entryId));
    return { success: true };
  } catch (e: any) {
    console.error("[Journal] Delete Failed:", e.message);
    if (e instanceof Error && e.message.includes('permission')) {
      handleFirestoreError(e, OperationType.DELETE, path);
    }
    return { success: false, error: e.message };
  }
};

// --- ANALYSIS HISTORY SERVICES ---

export const saveAnalysisToHistory = async (analysis: TradeAnalysis) => {
  try {
    if (!analysis.userId) {
      console.warn("Athenix: userId missing from analysis object, save aborted.");
      return null;
    }
    
    const docRef = await addDoc(collection(firestore, "analysisHistory"), {
      ...analysis,
      createdAt: serverTimestamp(),
      timestamp: serverTimestamp() // Keeping both for backward compat and explicit requirement
    });
    
    return docRef.id;
  } catch (e: any) {
    console.error("Athenix Persistence Error (AnalysisHistory):", e.message || e);
    return null;
  }
};

export const getUserAnalysisHistory = async (userId: string): Promise<TradeAnalysis[]> => {
  try {
    if (!userId) return [];
    
    // Order by timestamp DESC to satisfy "Part 2" requirement and support legacy data
    const q = query(
      collection(firestore, "analysisHistory"),
      where("userId", "==", userId),
      orderBy("createdAt", "desc") 
    );
    
    const snap = await getDocs(q);
    
    return snap.docs.map(doc => {
      const data = doc.data();
      let ts = new Date().toISOString();
      
      // Prefer createdAt, fallback to timestamp
      const dateField = data.createdAt || data.timestamp;

      if (dateField && typeof dateField.toDate === 'function') {
        ts = dateField.toDate().toISOString();
      } else if (dateField && typeof dateField === 'string') {
        ts = dateField;
      } else if (dateField && typeof dateField === 'number') {
        ts = new Date(dateField).toISOString();
      }
      
      return {
        id: doc.id,
        ...data,
        timestamp: ts
      } as TradeAnalysis;
    });

  } catch (e: any) {
    console.error("Athenix Retrieval Error (AnalysisHistory):", e.message || e);
    return [];
  }
};

export const submitAnalysisFeedback = async (analysisId: string, feedback: AnalysisFeedback) => {
  try {
    const ref = doc(firestore, "analysisHistory", analysisId);
    await updateDoc(ref, { 
      feedback: {
        ...feedback,
        feedbackTimestamp: serverTimestamp() // Ensure timestamp is server-side
      },
      // Update root level outcome for easier querying if needed, or just rely on nested
      outcome: feedback.outcome 
    });
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
};

export const updateAnalysisValidation = async (analysisId: string, validationResult: string, validatedAt: string) => {
  try {
    const ref = doc(firestore, "analysisHistory", analysisId);
    await updateDoc(ref, {
      validationResult,
      lastValidatedAt: validatedAt
    });
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

// Removed duplicate saveEducationInteraction
// Removed duplicate getUserEducationHistory

// --- ADMIN REAL-TIME SUBSCRIPTIONS ---

export const subscribeToUsers = (callback: (users: UserProfile[]) => void): Unsubscribe => {
  const q = query(collection(firestore, "users"), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snap) => {
    const users = snap.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile));
    callback(users);
  }, (error) => console.error("Users Subscription Error:", error));
};

export const subscribeToSubscriptions = (callback: (subs: Subscription[]) => void): Unsubscribe => {
  const q = query(collection(firestore, "subscriptions"), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snap) => {
    const subs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Subscription));
    callback(subs);
  }, (error) => console.error("Subscriptions Subscription Error:", error));
};

export const subscribeToAnalysisHistory = (callback: (history: TradeAnalysis[]) => void): Unsubscribe => {
  const q = query(collection(firestore, "analysisHistory"), orderBy("timestamp", "desc"));
  return onSnapshot(q, (snap) => {
    const history = snap.docs.map(doc => {
      const data = doc.data();
      let ts = new Date().toISOString();
      const dateField = data.createdAt || data.timestamp;
      if (dateField && typeof dateField.toDate === 'function') ts = dateField.toDate().toISOString();
      else if (dateField && typeof dateField === 'string') ts = dateField;
      else if (dateField && typeof dateField === 'number') ts = new Date(dateField).toISOString();
      return { id: doc.id, ...data, timestamp: ts } as TradeAnalysis;
    });
    callback(history);
  }, (error) => console.error("Analysis History Subscription Error:", error));
};

export const subscribeToReferrals = (callback: (referrals: Referral[]) => void): Unsubscribe => {
  const q = query(collection(firestore, "referrals"), orderBy("timestamp", "desc"));
  return onSnapshot(q, (snap) => {
    const referrals = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Referral));
    callback(referrals);
  }, (error) => console.error("Referrals Subscription Error:", error));
};

export const subscribeToSystemLogs = (callback: (logs: any[]) => void): Unsubscribe => {
  const q = query(collection(firestore, "system_logs"), orderBy("timestamp", "desc"), limit(100));
  return onSnapshot(q, (snap) => {
    const logs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(logs);
  }, (error) => console.error("System Logs Subscription Error:", error));
};

export const subscribeToTokenTransactions = (callback: (transactions: TokenTransaction[]) => void): Unsubscribe => {
  const q = query(collection(firestore, "token_transactions"), orderBy("timestamp", "desc"));
  return onSnapshot(q, (snap) => {
    const transactions = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as TokenTransaction));
    callback(transactions);
  }, (error) => console.error("Token Transactions Subscription Error:", error));
};

// --- TOKEN MANAGEMENT ---

export const adminAddTokens = async (userId: string, amount: number, reason: string, adminId: string) => {
  try {
    const userRef = doc(firestore, "users", userId);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) return { success: false, error: "User not found" };
    
    const userData = userSnap.data() as UserProfile;
    const currentTokens = userData.tokens || 0;
    
    await updateDoc(userRef, { tokens: currentTokens + amount });
    
    await addDoc(collection(firestore, "token_transactions"), {
      userId,
      amount,
      type: 'admin_credit',
      reason,
      adminId,
      timestamp: new Date().toISOString()
    });
    
    return { success: true };
  } catch (error: any) {
    console.error("Error adding tokens:", error);
    return { success: false, error: error.message };
  }
};

// --- REFERRAL SYSTEM ---

export const addReferral = async (referrerId: string, referredUserId: string) => {
  try {
    await addDoc(collection(firestore, "referrals"), {
      referrerId,
      referredUserId,
      status: 'signed_up',
      timestamp: new Date().toISOString()
    });
    return { success: true };
  } catch (error: any) {
    console.error("Error adding referral:", error);
    return { success: false, error: error.message };
  }
};

export const updateReferralStatus = async (referredUserId: string, status: 'subscribed') => {
  try {
    const q = query(collection(firestore, "referrals"), where("referredUserId", "==", referredUserId));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const refDoc = snap.docs[0];
      await updateDoc(doc(firestore, "referrals", refDoc.id), { status });
    }
    return { success: true };
  } catch (error: any) {
    console.error("Error updating referral status:", error);
    return { success: false, error: error.message };
  }
};

// --- SYSTEM LOGS ---

export const logSystemEvent = async (type: 'error' | 'warning' | 'info', source: string, message: string, details?: any) => {
  try {
    await addDoc(collection(firestore, "system_logs"), {
      type,
      source,
      message,
      details: details ? JSON.stringify(details) : null,
      timestamp: new Date().toISOString()
    });
  } catch (e) {
    console.error("Failed to write system log:", e);
  }
};

// --- ADMIN & SYSTEM ---

export const getAllUsers = async (): Promise<UserProfile[]> => {
  try {
    const snap = await getDocs(collection(firestore, "users"));
    return snap.docs.map(doc => {
      const data = doc.data();
      return { ...data, uid: doc.id } as UserProfile;
    });
  } catch (e) {
    console.error("Failed to fetch users:", e);
    return [];
  }
};

export const checkDatabaseConnection = async (): Promise<boolean> => {
  try {
    await getDocs(query(collection(firestore, "signals"), limit(1)));
    return true;
  } catch (e) {
    return false;
  }
};

export const deductTokens = async (userId: string, amount: number, resource: 'analysis' | 'education') => {
  try {
    const userRef = doc(firestore, "users", userId);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) return false;
    
    const userData = userSnap.data() as UserProfile;
    const currentTokens = resource === 'analysis' ? userData.analysisTokens : userData.educationTokens;
    
    if (currentTokens < amount) return false;
    
    const updateData = resource === 'analysis' 
      ? { analysisTokens: currentTokens - amount }
      : { educationTokens: currentTokens - amount };
      
    await updateDoc(userRef, updateData);
    
    // Log transaction
    await addDoc(collection(firestore, "token_transactions"), {
      userId,
      type: 'deduction',
      resource,
      amount,
      timestamp: new Date().toISOString(),
      description: `${resource === 'analysis' ? 'Market Analysis' : 'AI Mentor Consultation'}`
    });
    
    return true;
  } catch (error) {
    console.error("Error deducting tokens:", error);
    return false;
  }
};

// NOTE: `getAdminMetrics`, `getRevenueMetrics` and `getAIOversightMetrics` were
// removed during post-audit cleanup. All three were orphaned (no callers) and
// carried fabricated/estimated values (e.g. accuracy 74.2, revenue = paid * 50,
// active = total * 0.7). The Admin dashboard computes its metrics inline from the
// real-time Firestore subscriptions instead.

// --- TOKEN ECONOMY SERVICES ---

export const getTokenEconomyConfig = async (): Promise<TokenEconomyConfig> => {
   const defaultConfig: TokenEconomyConfig = {
      allocations: {
        lite: { analysis: 10, education: 70 },
        pro: { analysis: 30, education: 150 },
        elite: { analysis: 70, education: 300 }
      },
      refillPricing: {
        analysis: 5.00,
        education: 5.00 
      }
   };

   try {
     const docSnap = await getDoc(doc(firestore, "system_config", "token_economy"));
     if (docSnap.exists()) {
        return { ...defaultConfig, ...docSnap.data() } as TokenEconomyConfig;
     }
   } catch (e) {
     console.error("Token Config Fetch Failed:", e);
   }
   return defaultConfig;
};

export const updateTokenEconomyConfig = async (config: TokenEconomyConfig) => {
    try {
        await setDoc(doc(firestore, "system_config", "token_economy"), config);
        return true;
    } catch(e) {
        return false;
    }
};

// --- AUDIT LOG SERVICES ---

export const logAdminAction = async (adminId: string, adminName: string, action: string, details: string) => {
    try {
       await addDoc(collection(firestore, "admin_audit_logs"), {
          adminId,
          adminName,
          action,
          details,
          timestamp: serverTimestamp()
       });
    } catch (e) {
       console.error("Audit Logging Failed:", e);
    }
};

export const getAuditLogs = async (): Promise<AuditLogEntry[]> => {
    try {
       const q = query(collection(firestore, "admin_audit_logs"), orderBy("timestamp", "desc"), limit(100));
       const snap = await getDocs(q);
       return snap.docs.map(doc => {
          const data = doc.data();
          let ts = new Date().toISOString();
          if (data.timestamp && typeof data.timestamp.toDate === 'function') ts = data.timestamp.toDate().toISOString();
          return { id: doc.id, ...data, timestamp: ts } as AuditLogEntry;
       });
    } catch (e) {
        return [];
    }
};

// NOTE: `getStrategyPerformance` and `getPublishedSignals` were removed during
// post-audit cleanup — both were orphaned (no callers).

export const saveEducationInteraction = async (userId: string, interaction: Omit<EducationInteraction, 'id' | 'userId'>) => {
  const path = "educationInteractions";
  try {
    await addDoc(collection(firestore, path), {
      userId,
      ...interaction,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error saving education interaction:", error);
    if (error instanceof Error && error.message.includes('permission')) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  }
};

export const getEducationHistory = async (userId: string): Promise<EducationInteraction[]> => {
  const path = "educationInteractions";
  try {
    const q = query(
      collection(firestore, path),
      where("userId", "==", userId),
      orderBy("timestamp", "desc"),
      limit(50)
    );
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as EducationInteraction));
  } catch (error) {
    console.error("Error fetching education history:", error);
    if (error instanceof Error && error.message.includes('permission')) {
      handleFirestoreError(error, OperationType.LIST, path);
    }
    return [];
  }
};

export const publishSignal = async (analysisId: string, isPublished: boolean) => {
  try {
    const docRef = doc(firestore, "analysisHistory", analysisId);
    await updateDoc(docRef, { is_published: isPublished });
  } catch (error) {
    console.error("Error publishing signal:", error);
  }
};

