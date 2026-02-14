
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
  accountStatus?: 'active' | 'suspended'; 
  analysisTokens: number;
  educationTokens: number;
  createdAt: string;
  lastActiveAt?: string; 
}

export interface TokenTransaction {
  id?: string;
  userId: string;
  type: 'refill' | 'deduction' | 'admin_grant';
  resource: 'analysis' | 'education';
  amount: number; 
  cost?: number; 
  timestamp: string;
  description: string;
}

export type SignalStatus = 
  | 'pending' 
  | 'active' 
  | 'triggered' 
  | 'completed_tp' 
  | 'completed_sl' 
  | 'completed_be' 
  | 'cancelled' 
  | 'expired';

export interface TradingSignal {
  id: string;
  instrument: string; 
  market: 'Forex' | 'Stocks' | 'Crypto';
  timeframe: string;
  signalType: 'Buy' | 'Sell' | 'Buy Limit' | 'Sell Limit' | 'Buy Stop' | 'Sell Stop';
  entry: number;
  stopLoss: number;
  takeProfit: number;
  rrRatio: number;
  status: SignalStatus;
  confidence: number;
  notes?: string;
  author: string;
  authorId?: string;
  timestamp: string;
  direction?: 'BUY' | 'SELL'; 
  orderType?: string;
  audience?: 'all_users' | 'paid_users' | 'specific_plans';
  plans?: string[];
  triggeredAt?: string;
  closedAt?: string;
  exitPrice?: number;
  outcomeComment?: string;
  finalOutcome?: 'win' | 'loss' | 'be';
  isDeleted?: boolean;
}

export interface JournalEntry {
  id?: string;
  userId: string;
  title: string;
  market: string;
  tradeMode?: 'scalp' | 'day_trade' | 'swing_trade';
  direction: 'BUY' | 'SELL';
  entryPrice: string;
  stopLoss: string;
  takeProfit: string;
  outcome: 'win' | 'loss' | 'partial' | 'open';
  notes: string;
  createdAt: string;
}

export interface Lesson {
  id: string;
  slug: string;
  category: string;
  title: string;
  description: string;
  content: string[];
  author: string;
  updatedAt: string;
}

export interface EducationInteraction {
  id?: string;
  userId: string;
  question: string;
  answer: string;
  context?: string;
  timestamp: string;
}

export interface AnalysisFeedback {
  outcome: 'TP' | 'SL' | 'BE' | 'NOT_TAKEN' | 'INVALID';
  comment?: string;
  timestamp: string;
}

export interface TradeAnalysis {
  id?: string;       
  userId?: string;   
  timestamp?: string;
  instrument: string;
  execution_timeframe: string;
  market_phase: 'uptrend' | 'downtrend' | 'ranging' | 'accumulation' | 'distribution';
  execution_mode: 'scalp' | 'day_trade' | 'swing_trade';
  final_decision: 'trade' | 'no_trade';
  strategy_used: 'structure_only' | 'liquidity_only' | 'structure_plus_liquidity' | 'none';

  // Constitution v1.0 Confluence Scores (Max 40)
  confluence_scores: {
    structure_score: number;      // 0-10
    liquidity_score: number;      // 0-10
    poi_score: number;            // 0-10
    premium_discount_score: number; // 0-10
    total_confluence_score: number; // 0-40
  };

  // Probabilistic Outcome Engine (Sums to 100%)
  probabilities: {
    irl_only: number;      // Scenario A
    irl_to_erl: number;    // Scenario B
    expansion: number;     // Scenario C
  };

  volatility_context: string;

  signal?: {
    order_type: 'buy_market' | 'sell_market' | 'buy_limit' | 'sell_limit' | 'buy_stop' | 'sell_stop';
    direction: 'buy' | 'sell';
    entry_price: number;
    stop_loss: number;
    take_profits: Array<{
      level: string;
      price: number;
      allocation_weight: 'heavy' | 'moderate' | 'small';
    }>;
    risk_reward_ratio: number;
    confidence_score?: number;
  };

  reasoning: {
    bias_explanation: string;
    liquidity_explanation: string;
    entry_explanation: string;
    invalidation_explanation: string;
  };

  meta?: {
    generated_at: string;
    analysis_engine_version: string;
  };

  feedback?: AnalysisFeedback;
}

// Admin and System Health Interfaces

export interface AdminOverviewMetrics {
  users: {
    total: number;
    paid: number;
    free: number;
    byPlan: {
      lite: number;
      pro: number;
      elite: number;
    };
    newLast7Days: number;
  };
  activity: {
    totalAnalysis: number;
    totalJournal: number;
    totalEducation: number;
    totalSignals: number;
    analysisLast7Days: number;
  };
  engagement: {
    active24h: number;
    active7d: number;
  };
}

export interface RevenueMetrics {
  mrr: number;
  activeSubscriptions: number;
  breakdown: {
    lite: { count: number; revenue: number };
    pro: { count: number; revenue: number };
    elite: { count: number; revenue: number };
  };
  tokenRevenue: {
    totalLifetime: number;
    last30Days: number;
  };
}

export interface AIOversightMetrics {
  totalAnalyses: number;
  last24h: number;
  last7d: number;
  strategyDistribution: Record<string, number>;
  confidenceDistribution: { high: number; medium: number; low: number };
  popularInstruments: Array<{ symbol: string; count: number }>;
  learningStatus: 'active' | 'paused';
}

export interface TokenEconomyConfig {
  allocations: {
    lite: { analysis: number; education: number };
    pro: { analysis: number; education: number };
    elite: { analysis: number; education: number };
  };
  refillPricing: {
    analysis: number;
    education: number;
  };
}

export interface SystemHealth {
  database: string;
  forexApi: string;
  stockApi: string;
  aiApi: string;
  lastCheck: string;
}

export interface AuditLogEntry {
  id: string;
  adminId: string;
  adminName: string;
  action: string;
  details: string;
  timestamp: string;
}
