
import { doc, getDoc, setDoc, collection, getDocs, query, where, orderBy, addDoc, limit, Timestamp, serverTimestamp, updateDoc, getCountFromServer } from "firebase/firestore";
import { firestore } from "../firebase";
import { UserProfile, UserRole, SubscriptionPlan, TradingSignal, JournalEntry, Lesson, TradeAnalysis, AnalysisFeedback, EducationInteraction, AdminOverviewMetrics, RevenueMetrics, AIOversightMetrics, TokenEconomyConfig, AuditLogEntry } from "../types";

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
        accountStatus: 'active',
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

// For User App: Only shows Active signals, or all if we want history
export const getActiveSignals = async (): Promise<TradingSignal[]> => {
  try {
    const q = query(collection(firestore, "signals"), orderBy("timestamp", "desc"));
    const snap = await getDocs(q);
    
    return snap.docs.map(doc => {
      const data = doc.data();
      let ts = new Date().toISOString();
      if (data.timestamp && typeof data.timestamp.toDate === 'function') {
        ts = data.timestamp.toDate().toISOString();
      } else if (data.timestamp) {
        ts = new Date(data.timestamp).toISOString();
      }

      // Convert legacy string prices to numbers if necessary, or defaults
      const entry = Number(data.entry) || 0;
      const stopLoss = Number(data.stopLoss) || 0;
      const takeProfit = Number(data.takeProfit) || 0;
      const rrRatio = Number(data.rrRatio) || 0;

      return { 
        id: doc.id, 
        ...data,
        entry, stopLoss, takeProfit, rrRatio,
        market: data.market || 'Forex',
        status: data.status || 'Active',
        signalType: data.signalType || (data.direction === 'BUY' ? 'Buy' : 'Sell'),
        timestamp: ts
      } as TradingSignal;
    });
  } catch (error) {
    console.error("Error fetching signals:", error);
    return [];
  }
};

// For Admin: Fetch all signals for management
export const getAllSignals = async (): Promise<TradingSignal[]> => {
  return getActiveSignals(); 
};

// --- JOURNAL SERVICES ---

export const getJournalEntries = async (userId: string): Promise<JournalEntry[]> => {
  try {
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
        direction: data.direction || 'BUY',
        entryPrice: data.entryPrice || '',
        stopLoss: data.stopLoss || '',
        takeProfit: data.takeProfit || '',
        outcome: data.outcome || 'open',
        createdAt: createdDate
      } as JournalEntry;
    });

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
    if (!analysis.userId) {
      console.warn("Athenix: userId missing from analysis object, save aborted.");
      return null;
    }
    
    const docRef = await addDoc(collection(firestore, "analysisHistory"), {
      ...analysis,
      timestamp: serverTimestamp()
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
    
    const q = query(
      collection(firestore, "analysisHistory"),
      where("userId", "==", userId)
    );
    
    const snap = await getDocs(q);
    
    const analyses = snap.docs.map(doc => {
      const data = doc.data();
      let ts = new Date().toISOString();
      
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

    return analyses.sort((a, b) => {
      const timeA = new Date(a.timestamp || 0).getTime();
      const timeB = new Date(b.timestamp || 0).getTime();
      return timeB - timeA;
    });

  } catch (e: any) {
    console.error("Athenix Retrieval Error (AnalysisHistory):", e.message || e);
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

export const getAdminOverviewMetrics = async (): Promise<AdminOverviewMetrics> => {
  const metrics: AdminOverviewMetrics = {
    users: { total: 0, paid: 0, free: 0, byPlan: { lite: 0, pro: 0, elite: 0 }, newLast7Days: 0 },
    activity: { totalAnalysis: 0, totalJournal: 0, totalEducation: 0, totalSignals: 0, analysisLast7Days: 0 },
    engagement: { active24h: 0, active7d: 0 }
  };

  try {
    const usersCol = collection(firestore, "users");
    const analysisCol = collection(firestore, "analysisHistory");
    const journalCol = collection(firestore, "tradeJournal");
    const eduCol = collection(firestore, "educationHistory");
    const signalsCol = collection(firestore, "signals");

    // Dates
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoISO = sevenDaysAgo.toISOString();
    const sevenDaysAgoDate = new Date();
    sevenDaysAgoDate.setDate(sevenDaysAgoDate.getDate() - 7);
    const oneDayAgoDate = new Date();
    oneDayAgoDate.setDate(oneDayAgoDate.getDate() - 1);

    // --- PARALLEL QUERIES ---
    const [
      totalUsers,
      liteUsers,
      proUsers,
      eliteUsers,
      newUsers,
      totalAnalysis,
      recentAnalysis,
      totalJournal,
      totalEdu,
      totalSignals
    ] = await Promise.all([
      getCountFromServer(usersCol),
      getCountFromServer(query(usersCol, where("subscriptionPlan", "==", SubscriptionPlan.LITE))),
      getCountFromServer(query(usersCol, where("subscriptionPlan", "==", SubscriptionPlan.PRO))),
      getCountFromServer(query(usersCol, where("subscriptionPlan", "==", SubscriptionPlan.ELITE))),
      getCountFromServer(query(usersCol, where("createdAt", ">=", sevenDaysAgoISO))),
      getCountFromServer(analysisCol),
      getCountFromServer(query(analysisCol, where("timestamp", ">=", sevenDaysAgoDate))),
      getCountFromServer(journalCol),
      getCountFromServer(eduCol),
      getCountFromServer(signalsCol)
    ]);

    // Populate Users
    metrics.users.total = totalUsers.data().count;
    metrics.users.byPlan.lite = liteUsers.data().count;
    metrics.users.byPlan.pro = proUsers.data().count;
    metrics.users.byPlan.elite = eliteUsers.data().count;
    metrics.users.paid = metrics.users.byPlan.lite + metrics.users.byPlan.pro + metrics.users.byPlan.elite;
    metrics.users.free = metrics.users.total - metrics.users.paid;
    metrics.users.newLast7Days = newUsers.data().count;

    // Populate Activity
    metrics.activity.totalAnalysis = totalAnalysis.data().count;
    metrics.activity.analysisLast7Days = recentAnalysis.data().count;
    metrics.activity.totalJournal = totalJournal.data().count;
    metrics.activity.totalEducation = totalEdu.data().count;
    metrics.activity.totalSignals = totalSignals.data().count;

    // Engagement Proxy
    const recentAnalysesSnap = await getDocs(query(analysisCol, where("timestamp", ">=", oneDayAgoDate), limit(50)));
    const recentJournalSnap = await getDocs(query(journalCol, where("createdAt", ">=", oneDayAgoDate), limit(50)));
    
    const activeUserIds = new Set<string>();
    recentAnalysesSnap.forEach(d => activeUserIds.add(d.data().userId));
    recentJournalSnap.forEach(d => activeUserIds.add(d.data().userId));
    metrics.engagement.active24h = activeUserIds.size;
    
    const weeklyAnalysesSnap = await getDocs(query(analysisCol, where("timestamp", ">=", sevenDaysAgoDate), limit(100)));
    const weeklyUserIds = new Set<string>();
    weeklyAnalysesSnap.forEach(d => weeklyUserIds.add(d.data().userId));
    metrics.engagement.active7d = weeklyUserIds.size;

  } catch (error) {
    console.error("Admin Metrics Aggregation Failed:", error);
  }

  return metrics;
};

export const getRevenueMetrics = async (): Promise<RevenueMetrics> => {
  const revenue: RevenueMetrics = {
    mrr: 0,
    activeSubscriptions: 0,
    breakdown: {
      lite: { count: 0, revenue: 0 },
      pro: { count: 0, revenue: 0 },
      elite: { count: 0, revenue: 0 }
    },
    tokenRevenue: {
      totalLifetime: 0,
      last30Days: 0
    }
  };

  try {
    const usersCol = collection(firestore, "users");
    const [lite, pro, elite] = await Promise.all([
      getCountFromServer(query(usersCol, where("subscriptionPlan", "==", SubscriptionPlan.LITE))),
      getCountFromServer(query(usersCol, where("subscriptionPlan", "==", SubscriptionPlan.PRO))),
      getCountFromServer(query(usersCol, where("subscriptionPlan", "==", SubscriptionPlan.ELITE)))
    ]);

    const liteCount = lite.data().count;
    const proCount = pro.data().count;
    const eliteCount = elite.data().count;

    // Hardcoded prices based on Pricing.tsx
    // Lite: $20, Pro: $60, Elite: $120
    revenue.breakdown.lite = { count: liteCount, revenue: liteCount * 20 };
    revenue.breakdown.pro = { count: proCount, revenue: proCount * 60 };
    revenue.breakdown.elite = { count: eliteCount, revenue: eliteCount * 120 };

    revenue.mrr = revenue.breakdown.lite.revenue + revenue.breakdown.pro.revenue + revenue.breakdown.elite.revenue;
    revenue.activeSubscriptions = liteCount + proCount + eliteCount;

    // Token Revenue Calculation
    const transactionsCol = collection(firestore, "token_transactions");
    const tokenQuery = query(transactionsCol, where("cost", ">", 0)); // Only paid refills
    const tokenSnap = await getDocs(tokenQuery);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    tokenSnap.forEach(doc => {
      const data = doc.data();
      const amount = data.cost || 0;
      revenue.tokenRevenue.totalLifetime += amount;
      
      let ts = data.timestamp;
      if (ts && typeof ts.toDate === 'function') ts = ts.toDate();
      else if (ts && typeof ts === 'string') ts = new Date(ts);
      
      if (ts && ts > thirtyDaysAgo) {
        revenue.tokenRevenue.last30Days += amount;
      }
    });

  } catch (error) {
    console.error("Revenue Metrics Calculation Failed", error);
  }
  
  return revenue;
};

// --- AI OVERSIGHT SERVICES ---

export const getAIOversightMetrics = async (): Promise<AIOversightMetrics> => {
  const metrics: AIOversightMetrics = {
    totalAnalyses: 0,
    last24h: 0,
    last7d: 0,
    strategyDistribution: {
       'structure_only': 0, 'liquidity_only': 0, 'structure_plus_liquidity': 0, 'none': 0
    },
    confidenceDistribution: { high: 0, medium: 0, low: 0 },
    popularInstruments: [],
    learningStatus: 'active' // Default, should fetch from config
  };

  try {
    // Fetch Total Count
    const countSnap = await getCountFromServer(collection(firestore, "analysisHistory"));
    metrics.totalAnalyses = countSnap.data().count;

    // Fetch Recent Sample for Distributions (Last 200 items to avoid reading everything)
    const q = query(collection(firestore, "analysisHistory"), orderBy("timestamp", "desc"), limit(200));
    const snap = await getDocs(q);
    
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const instrumentCounts: Record<string, number> = {};

    snap.forEach(doc => {
       const data = doc.data();
       let ts = new Date();
       if (data.timestamp && typeof data.timestamp.toDate === 'function') ts = data.timestamp.toDate();
       else if (data.timestamp) ts = new Date(data.timestamp);

       // Time stats
       if (ts >= oneDayAgo) metrics.last24h++;
       if (ts >= sevenDaysAgo) metrics.last7d++;

       // Strategy stats
       const strategy = data.strategy_used || 'none';
       metrics.strategyDistribution[strategy] = (metrics.strategyDistribution[strategy] || 0) + 1;

       // Confidence stats
       const conf = data.signal?.confidence_score || 0;
       if (conf >= 80) metrics.confidenceDistribution.high++;
       else if (conf >= 50) metrics.confidenceDistribution.medium++;
       else metrics.confidenceDistribution.low++;

       // Instrument stats
       const inst = data.instrument || 'UNKNOWN';
       instrumentCounts[inst] = (instrumentCounts[inst] || 0) + 1;
    });

    // Sort popular instruments
    metrics.popularInstruments = Object.entries(instrumentCounts)
       .map(([symbol, count]) => ({ symbol, count }))
       .sort((a, b) => b.count - a.count)
       .slice(0, 5);

    // Fetch Learning Config
    const configSnap = await getDoc(doc(firestore, "system_config", "ai_learning"));
    if (configSnap.exists()) {
       metrics.learningStatus = configSnap.data().status || 'active';
    }

  } catch (e) {
    console.error("AI Oversight Metrics Failed:", e);
  }
  return metrics;
};

// --- TOKEN ECONOMY SERVICES ---

export const getTokenEconomyConfig = async (): Promise<TokenEconomyConfig> => {
   // Defaults
   const defaultConfig: TokenEconomyConfig = {
      allocations: {
        lite: { analysis: 10, education: 70 },
        pro: { analysis: 30, education: 150 },
        elite: { analysis: 70, education: 300 }
      },
      refillPricing: {
        analysis: 5.00, // per 20
        education: 5.00 // per 500
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
