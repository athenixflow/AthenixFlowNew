
import { doc, getDoc, setDoc, collection, getDocs, query, where, orderBy, addDoc, limit, Timestamp, serverTimestamp } from "firebase/firestore";
import { firestore } from "../firebase";
import { UserProfile, UserRole, SubscriptionPlan, TradingSignal, JournalEntry, Lesson } from "../types";

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

export const getJournalEntries = async (userId: string): Promise<JournalEntry[]> => {
  try {
    // Collection switched to 'tradeJournal' to match rules
    const q = query(
      collection(firestore, "tradeJournal"), 
      where("userId", "==", userId), 
      orderBy("createdAt", "desc")
    );
    
    const snap = await getDocs(q);
    
    return snap.docs.map(doc => {
      const data = doc.data();
      // Safe timestamp conversion
      let createdDate = new Date().toISOString();
      if (data.createdAt && typeof data.createdAt.toDate === 'function') {
        createdDate = data.createdAt.toDate().toISOString();
      } else if (data.createdAt) {
         createdDate = new Date(data.createdAt).toISOString();
      }

      return {
        id: doc.id,
        userId: data.userId,
        title: data.title || 'Untitled Entry',
        market: data.market || 'Unknown Market',
        notes: data.notes || '',
        createdAt: createdDate
      } as JournalEntry;
    });
  } catch (error) {
    console.error("Error fetching journal entries:", error);
    return [];
  }
};

export const addJournalEntry = async (userId: string, entry: { title: string; market: string; notes: string }) => {
  try {
    console.log(`[Journal] Attempting to save entry for user: ${userId}`);
    
    if (!userId) {
      console.error("[Journal] Error: User ID missing.");
      return { success: false, error: "Authentication missing" };
    }

    // Collection switched to 'tradeJournal' to match rules
    const docRef = await addDoc(collection(firestore, "tradeJournal"), {
      userId,
      title: entry.title,
      market: entry.market || '',
      notes: entry.notes,
      createdAt: serverTimestamp() // Ensure server timestamp
    });

    console.log(`[Journal] Entry saved successfully. ID: ${docRef.id}`);
    return { success: true };
  } catch (e: any) {
    console.error("[Journal] Firestore Write Failed:", e.code, e.message);
    return { success: false, error: e.message };
  }
};

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
    // Attempt to fetch signals as a lightweight connectivity test
    await getDocs(query(collection(firestore, "signals"), limit(1)));
    return true;
  } catch (e) {
    console.error("Connection check failed:", e);
    return false;
  }
};
