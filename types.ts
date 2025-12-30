
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

export interface TokenBalance {
  analysis: number;
  education: number;
}

export interface UserProfile {
  uid: string;
  fullName: string;
  email: string;
  role: UserRole;
  subscription: SubscriptionPlan;
  tokens: TokenBalance;
  createdAt: string;
}

export interface TradingSignal {
  id: string;
  pair: string;
  direction: 'BUY' | 'SELL';
  entry: number;
  stopLoss: number;
  takeProfit: number;
  author: string;
  timestamp: string;
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
