
import { 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  addDoc,
  limit,
  Timestamp
} from "firebase/firestore";
import { firestore, auth } from "../lib/firebase";
import { UserProfile, UserRole, SubscriptionPlan, TradingSignal, JournalEntry, Lesson } from "../types";

/**
 * 1. USER DOCUMENT INITIALIZATION
 */
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
  } catch (error) {
    console.error("Firestore: Error initializing user document", error);
    return null;
  }
};

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  if (!uid) return null;
  try {
    const userRef = doc(firestore, "users", uid);
    const userSnap = await getDoc(userRef);
    return userSnap.exists() ? (userSnap.data() as UserProfile) : null;
  } catch (error) {
    console.error("Firestore: Error fetching user profile", error);
    return null;
  }
};

/**
 * 3. SIGNALS FEED
 */
export const getActiveSignals = async (): Promise<TradingSignal[]> => {
  try {
    const signalsRef = collection(firestore, "signals");
    const q = query(signalsRef, orderBy("timestamp", "desc"), limit(30));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return { 
        id: doc.id, 
        ...data,
        timestamp: data.timestamp instanceof Timestamp ? data.timestamp.toDate().toISOString() : data.timestamp
      } as TradingSignal;
    });
  } catch (error) {
    console.error("Firestore: Error fetching signals", error);
    return [];
  }
};

/**
 * 4. TRADE JOURNAL
 */
export const getJournalEntries = async (userId: string): Promise<JournalEntry[]> => {
  if (!userId) return [];
  try {
    const journalRef = collection(firestore, "journal");
    const q = query(
      journalRef, 
      where("userId", "==", userId), 
      orderBy("createdAt", "desc")
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() 
    } as JournalEntry));
  } catch (error) {
    console.error("Firestore: Error fetching journal entries", error);
    return [];
  }
};

export const addJournalEntry = async (userId: string, entry: { title: string; market: string; notes: string }) => {
  if (!userId) return false;
  try {
    const journalRef = collection(firestore, "journal");
    const newEntry: JournalEntry = {
      userId,
      title: entry.title,
      market: entry.market,
      notes: entry.notes,
      createdAt: new Date().toISOString()
    };
    await addDoc(journalRef, newEntry);
    return true;
  } catch (error) {
    console.error("Firestore: Error adding journal entry", error);
    return false;
  }
};

/**
 * 5. EDUCATION CONTENT
 */
export const getEducationLessons = async (): Promise<Lesson[]> => {
  try {
    const eduRef = collection(firestore, "educationContent");
    const querySnapshot = await getDocs(eduRef);
    return querySnapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() 
    } as Lesson));
  } catch (error) {
    console.error("Firestore: Error fetching lessons", error);
    return [];
  }
};

/**
 * 7. ADMIN: ALL USERS
 */
export const getAllUsers = async (): Promise<UserProfile[]> => {
  try {
    // Note: This request will fail if security rules reject the current user's role
    const usersRef = collection(firestore, "users");
    const querySnapshot = await getDocs(usersRef);
    return querySnapshot.docs.map(doc => doc.data() as UserProfile);
  } catch (error) {
    console.error("Firestore: Error fetching all users (Admin check failed)", error);
    return [];
  }
};
