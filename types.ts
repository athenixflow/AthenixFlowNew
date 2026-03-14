
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

export type JournalOutcome = 'Pending' | 'Take Profit' | 'Stop Loss' | 'Break Even' | 'Manual Close';

export interface JournalEntry {
  id?: string;
  userId: string;
  instrument: string;
  direction: 'Buy' | 'Sell';
  tradeType: 'Scalp' | 'Day Trade' | 'Swing Trade';
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  rr: string;
  outcome: JournalOutcome;
  timeframe: string;
  notes: string;
  timestamp: string;
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
  category?: string;
  timestamp: string;
}

export interface AnalysisFeedback {
  outcome: 'TP_HIT' | 'SL_HIT' | 'BREAK_EVEN' | 'STILL_RUNNING' | 'NOT_TAKEN' | 'INVALID';
  comment?: string;
  journal_notes?: string;
  timestamp: string;
}

export interface TradeAnalysis {
  id?: string;       
  userId?: string;   
  timestamp: string;
  instrument: string;
  timeframe: string;
  execution_timeframe: string;
  market_phase: 'uptrend' | 'downtrend' | 'ranging' | 'accumulation' | 'distribution';
  execution_mode: 'scalp' | 'day_trade' | 'swing_trade';
  final_decision: 'trade' | 'no_trade';
  strategy_used: 'structure_only' | 'liquidity_only' | 'structure_plus_liquidity' | 'none';

  // Version 2.0 Narrative Context
  market_narrative_context: {
    htf_narrative: string;
    selected_tf_narrative: string;
    refinement_narrative: string;
  };

  // Version 2.0 Liquidity Map
  liquidity_map: {
    buy_side_liquidity: string[];
    sell_side_liquidity: string[];
    inducement_zones: string[];
    projected_liquidity_path: string;
  };

  // Version 2.0 Setup Detection
  corrective_setup?: {
    direction: 'buy' | 'sell';
    entry: number;
    stop_loss: number;
    target: number;
    score: number;
  };

  impulse_setup?: {
    direction: 'buy' | 'sell';
    entry: number;
    stop_loss: number;
    tp1: number;
    tp2: number;
    tp3: number;
  };

  // Version 2.0 Scores
  corrective_score?: number;
  impulse_score?: number;
  quality_score: number; // 0-100
  is_published?: boolean;

  // Version 2.0 Context
  session_context: {
    session: string;
    asian_high: number;
    asian_low: number;
    liquidity_sweep: string;
  };

  market_story: {
    origin: string;
    current_phase: string;
    liquidity_path: string;
  };

  liquidity_heatmap: string;

  // Constitution v2.0 Confluence Scores (Max 40)
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

  // Legacy signal support (optional)
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

  // History & Validation fields
  status?: 'active' | 'archived';
  feedback?: AnalysisFeedback;
  lastValidatedAt?: string;
  validationResult?: string;
  
  // Flattened fields for Firestore queries/admin view
  pIRL?: number;
  pIRLtoERL?: number;
  pExpansion?: number;
  structureScore?: number;
  liquidityScore?: number;
  poiScore?: number;
  premiumDiscountScore?: number;
  totalConfluenceScore?: number;
}

// Admin and System Health Interfaces

export interface AdminOverviewMetrics {
  totalUsers: number;
  activeUsers: number;
  totalAnalyses: number;
  totalSignals: number;
  revenue: {
    total: number;
    monthly: number;
    growth: number;
  };
  aiPerformance: {
    accuracy: number;
    avgConfluence: number;
    totalPredictions: number;
  };
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
