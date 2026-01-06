
export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN'
}

export enum SubscriptionPlan {
  LITE = 'Lite',
  PRO = 'Pro',
  ELITE = 'Elite',
  FREE = 'Free'
}

export interface UserProfile {
  uid: string;
  fullName: string;
  email: string;
  role: UserRole;
  subscriptionPlan: SubscriptionPlan;
  subscriptionStatus: 'active' | 'past_due' | 'canceled' | 'none';
  analysisTokens: number;
  educationTokens: number;
  createdAt: string;
}

export interface TokenTransaction {
  id?: string;
  userId: string;
  type: 'refill' | 'deduction';
  resource: 'analysis' | 'education';
  amount: number;
  timestamp: string;
  description: string;
}

export interface TradingSignal {
  id: string;
  pair: string;
  direction: 'BUY' | 'SELL';
  entry: string;
  stopLoss: string;
  takeProfit: string;
  author: string;
  timestamp: string;
}

export interface JournalEntry {
  id?: string;
  userId: string;
  title: string;
  market: string;
  notes: string;
  createdAt: string;
}

export interface Lesson {
  id: string;
  slug: string;
  category: 'SMC' | 'Psychology' | 'Technical' | 'Fundamentals';
  title: string;
  description: string;
  content: string[];
  author: string;
  updatedAt: string;
}

export interface TradeAnalysis {
  pair: string;
  timeframe: string;
  direction: string;
  entry: string;
  stopLoss: string;
  takeProfit: string;
  riskReward: string;
  reasoning: string;
}
