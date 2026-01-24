
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
  
  // Enhanced Journal Fields
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
  category: 'SMC' | 'Psychology' | 'Technical' | 'Fundamentals';
  title: string;
  description: string;
  content: string[];
  author: string;
  updatedAt: string;
}

export interface AnalysisFeedback {
  status: 'successful' | 'not_successful';
  comment?: string;
  timestamp: string;
}

// Updated TradeAnalysis based on Strict Product Definition & Persistence
export interface TradeAnalysis {
  // Persistence Fields
  id?: string;       // Firestore Document ID
  userId?: string;   // Owner
  timestamp?: string;// Creation time
  
  analysis_id?: string;
  instrument: string;
  asset_class?: 'forex' | 'stock' | 'index' | 'metal';
  execution_timeframe: string;

  final_decision: 'trade' | 'no_trade';
  strategy_used: 'structure_only' | 'liquidity_only' | 'structure_plus_liquidity' | 'none';

  signal?: {
    order_type: 'buy_market' | 'sell_market' | 'buy_limit' | 'sell_limit' | 'buy_stop' | 'sell_stop';
    direction: 'buy' | 'sell';
    entry_price: number;
    stop_loss: number;
    take_profits: Array<{
      level: string;
      price: number;
    }>;
    risk_reward_ratio: number;
    confidence_score: number;
  };

  multi_timeframe_context?: {
    higher_timeframes_analyzed: string[];
    higher_timeframe_bias: 'bullish' | 'bearish' | 'ranging';
    key_levels_considered: Array<{
      type: 'order_block' | 'snr' | 'liquidity_pool';
      timeframe: string;
      price_range: {
        low: number;
        high: number;
      };
    }>;
  };

  reasoning: {
    bias_explanation: string;
    liquidity_explanation: string;
    entry_explanation: string;
    invalidation_explanation: string;
  };

  risk_management?: {
    invalidated_if: string;
    minimum_rr_enforced: boolean;
  };

  education_reference?: {
    strategy_principles_used: string[];
    knowledge_base_topics: string[];
  };

  meta?: {
    generated_at: string;
    analysis_engine_version: string;
  };

  // Feedback Loop
  feedback?: AnalysisFeedback;
}
