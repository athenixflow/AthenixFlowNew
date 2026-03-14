import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserProfile, JournalEntry, JournalOutcome } from '../types';
import { 
  getJournalEntries, 
  addJournalEntry, 
  updateJournalEntry, 
  deleteJournalEntry 
} from '../services/firestore';
import { 
  ICONS, 
  METALS_INSTRUMENTS, 
  INDICES_INSTRUMENTS, 
  FOREX_INSTRUMENTS, 
  STOCK_INSTRUMENTS 
} from '../constants';
import ErrorBoundary from '../components/ErrorBoundary';

const ALL_INSTRUMENTS = [
  ...METALS_INSTRUMENTS,
  ...INDICES_INSTRUMENTS,
  ...FOREX_INSTRUMENTS,
  ...STOCK_INSTRUMENTS
];

const OUTCOMES: JournalOutcome[] = ['Pending', 'Take Profit', 'Stop Loss', 'Break Even', 'Manual Close'];
const TRADE_TYPES = ['Scalp', 'Day Trade', 'Swing Trade'] as const;
const TIMEFRAMES = ['M1', 'M3', 'M5', 'M15', 'M30', 'H1', 'H2', 'H4', 'H8', 'D1'] as const;

const OUTCOME_COLORS: Record<JournalOutcome, string> = {
  'Take Profit': 'bg-brand-success text-white',
  'Stop Loss': 'bg-brand-error text-white',
  'Break Even': 'bg-brand-sage text-brand-charcoal',
  'Pending': 'bg-brand-gold text-white',
  'Manual Close': 'bg-brand-charcoal text-white'
};

const OUTCOME_TAG_COLORS: Record<JournalOutcome, string> = {
  'Take Profit': 'bg-brand-success/20 text-brand-success',
  'Stop Loss': 'bg-brand-error/20 text-brand-error',
  'Break Even': 'bg-brand-sage/20 text-brand-muted',
  'Pending': 'bg-brand-gold/20 text-brand-gold',
  'Manual Close': 'bg-brand-charcoal/20 text-brand-charcoal'
};

interface TradeJournalProps {
  user: UserProfile | null;
}

const TradeJournal: React.FC<TradeJournalProps> = ({ user }) => {
  const [trades, setTrades] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    instrument: '',
    tradeType: 'Day Trade' as JournalEntry['tradeType'],
    direction: 'Buy' as JournalEntry['direction'],
    entryPrice: '',
    stopLoss: '',
    takeProfit: '',
    timeframe: 'H1',
    outcome: 'Pending' as JournalOutcome,
    notes: ''
  });

  // Filter State
  const [filters, setFilters] = useState({
    instrument: '',
    outcome: 'All',
    tradeType: 'All',
    timeframe: 'All'
  });

  // Searchable Dropdown State
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    if (user) loadTrades();
  }, [user]);

  const loadTrades = async () => {
    if (!user) return;
    setLoading(true);
    const data = await getJournalEntries(user.uid);
    setTrades(data);
    setLoading(false);
  };

  const calculateRR = (entry: number, sl: number, tp: number, direction: 'Buy' | 'Sell') => {
    if (!entry || !sl || !tp) return '0';
    const risk = Math.abs(entry - sl);
    const reward = Math.abs(tp - entry);
    if (risk === 0) return '0';
    const ratio = reward / risk;
    return `1:${ratio.toFixed(1)}`;
  };

  const currentRR = useMemo(() => {
    return calculateRR(
      parseFloat(formData.entryPrice),
      parseFloat(formData.stopLoss),
      parseFloat(formData.takeProfit),
      formData.direction
    );
  }, [formData.entryPrice, formData.stopLoss, formData.takeProfit, formData.direction]);

  const handleSaveTrade = async () => {
    if (!user || !formData.instrument || !formData.entryPrice) return;
    setIsSubmitting(true);
    
    const entry: Omit<JournalEntry, 'id' | 'userId' | 'timestamp'> = {
      instrument: formData.instrument,
      direction: formData.direction,
      tradeType: formData.tradeType,
      entryPrice: parseFloat(formData.entryPrice),
      stopLoss: parseFloat(formData.stopLoss),
      takeProfit: parseFloat(formData.takeProfit),
      rr: currentRR,
      outcome: formData.outcome,
      timeframe: formData.timeframe,
      notes: formData.notes
    };

    const result = await addJournalEntry(user.uid, entry);
    if (result.success) {
      setFormData({
        instrument: '',
        tradeType: 'Day Trade',
        direction: 'Buy',
        entryPrice: '',
        stopLoss: '',
        takeProfit: '',
        timeframe: 'H1',
        outcome: 'Pending',
        notes: ''
      });
      setSearchQuery('');
      loadTrades();
    }
    setIsSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this trade?')) {
      await deleteJournalEntry(id);
      loadTrades();
    }
  };

  const handleUpdateOutcome = async (id: string, outcome: JournalOutcome) => {
    await updateJournalEntry(id, { outcome });
    loadTrades();
  };

  const filteredTrades = useMemo(() => {
    return trades.filter(t => {
      const matchInstrument = !filters.instrument || t.instrument.toLowerCase().includes(filters.instrument.toLowerCase());
      const matchOutcome = filters.outcome === 'All' || t.outcome === filters.outcome;
      const matchType = filters.tradeType === 'All' || t.tradeType === filters.tradeType;
      const matchTimeframe = filters.timeframe === 'All' || t.timeframe === filters.timeframe;
      return matchInstrument && matchOutcome && matchType && matchTimeframe;
    });
  }, [trades, filters]);

  const filteredInstruments = useMemo(() => {
    if (!searchQuery) return ALL_INSTRUMENTS.slice(0, 10);
    return ALL_INSTRUMENTS.filter(i => 
      i.symbol.toLowerCase().includes(searchQuery.toLowerCase()) || 
      i.name.toLowerCase().includes(searchQuery.toLowerCase())
    ).slice(0, 10);
  }, [searchQuery]);

  return (
    <ErrorBoundary>
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-10 animate-fade-in">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-gold rounded-xl flex items-center justify-center text-white shadow-lg shadow-brand-gold/20">
              <ICONS.Journal />
            </div>
            <h1 className="text-4xl font-black text-brand-charcoal uppercase tracking-tighter">Trade Journal</h1>
          </div>
          <p className="text-brand-muted font-medium text-lg">Track and improve your trading performance</p>
        </div>

        {/* Quick Entry Form */}
        <div className="bg-white rounded-[2rem] border border-brand-sage/20 shadow-xl overflow-hidden">
          <div className="bg-brand-charcoal p-6 border-b border-white/10">
            <h2 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
              <div className="w-2 h-2 bg-brand-gold rounded-full animate-pulse" />
              Quick Trade Entry
            </h2>
          </div>
          
          <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Instrument Selector */}
            <div className="space-y-2 relative">
              <label className="text-[10px] font-black text-brand-muted uppercase tracking-widest">Instrument</label>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery || formData.instrument}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowDropdown(true);
                  }}
                  onFocus={() => setShowDropdown(true)}
                  placeholder="Search Instrument..."
                  className="w-full p-4 bg-brand-sage/5 border border-brand-sage/20 rounded-2xl outline-none focus:border-brand-gold transition-all font-bold text-brand-charcoal"
                />
                {showDropdown && (
                  <div className="absolute z-50 top-full left-0 right-0 mt-2 bg-white border border-brand-sage/20 rounded-2xl shadow-2xl overflow-hidden max-h-60 overflow-y-auto">
                    {filteredInstruments.map(inst => (
                      <button
                        key={inst.symbol}
                        onClick={() => {
                          setFormData({ ...formData, instrument: inst.symbol });
                          setSearchQuery(inst.symbol);
                          setShowDropdown(false);
                        }}
                        className="w-full p-4 text-left hover:bg-brand-sage/5 border-b border-brand-sage/10 last:border-0 transition-colors"
                      >
                        <p className="text-xs font-black text-brand-charcoal">{inst.symbol}</p>
                        <p className="text-[10px] text-brand-muted">{inst.name}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Trade Type */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-brand-muted uppercase tracking-widest">Trade Type</label>
              <select
                value={formData.tradeType}
                onChange={(e) => setFormData({ ...formData, tradeType: e.target.value as any })}
                className="w-full p-4 bg-brand-sage/5 border border-brand-sage/20 rounded-2xl outline-none focus:border-brand-gold transition-all font-bold text-brand-charcoal appearance-none"
              >
                {TRADE_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
              </select>
            </div>

            {/* Direction */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-brand-muted uppercase tracking-widest">Direction</label>
              <div className="grid grid-cols-2 gap-2">
                {['Buy', 'Sell'].map(dir => (
                  <button
                    key={dir}
                    onClick={() => setFormData({ ...formData, direction: dir as any })}
                    className={`p-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${
                      formData.direction === dir 
                        ? (dir === 'Buy' ? 'bg-brand-success text-white' : 'bg-brand-error text-white')
                        : 'bg-brand-sage/10 text-brand-muted'
                    }`}
                  >
                    {dir}
                  </button>
                ))}
              </div>
            </div>

            {/* Prices */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-brand-muted uppercase tracking-widest">Entry Price</label>
              <input
                type="number"
                step="any"
                value={formData.entryPrice}
                onChange={(e) => setFormData({ ...formData, entryPrice: e.target.value })}
                className="w-full p-4 bg-brand-sage/5 border border-brand-sage/20 rounded-2xl outline-none focus:border-brand-gold transition-all font-bold text-brand-charcoal"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-brand-muted uppercase tracking-widest">Stop Loss</label>
              <input
                type="number"
                step="any"
                value={formData.stopLoss}
                onChange={(e) => setFormData({ ...formData, stopLoss: e.target.value })}
                className="w-full p-4 bg-brand-sage/5 border border-brand-sage/20 rounded-2xl outline-none focus:border-brand-gold transition-all font-bold text-brand-charcoal"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-brand-muted uppercase tracking-widest">Take Profit</label>
              <input
                type="number"
                step="any"
                value={formData.takeProfit}
                onChange={(e) => setFormData({ ...formData, takeProfit: e.target.value })}
                className="w-full p-4 bg-brand-sage/5 border border-brand-sage/20 rounded-2xl outline-none focus:border-brand-gold transition-all font-bold text-brand-charcoal"
              />
            </div>

            {/* Timeframe & Outcome */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-brand-muted uppercase tracking-widest">Timeframe</label>
              <select
                value={formData.timeframe}
                onChange={(e) => setFormData({ ...formData, timeframe: e.target.value })}
                className="w-full p-4 bg-brand-sage/5 border border-brand-sage/20 rounded-2xl outline-none focus:border-brand-gold transition-all font-bold text-brand-charcoal appearance-none"
              >
                {TIMEFRAMES.map(tf => <option key={tf} value={tf}>{tf}</option>)}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-brand-muted uppercase tracking-widest">Outcome</label>
              <select
                value={formData.outcome}
                onChange={(e) => setFormData({ ...formData, outcome: e.target.value as any })}
                className="w-full p-4 bg-brand-sage/5 border border-brand-sage/20 rounded-2xl outline-none focus:border-brand-gold transition-all font-bold text-brand-charcoal appearance-none"
              >
                {OUTCOMES.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>

            {/* RR Display */}
            <div className="flex items-end">
              <div className="w-full p-4 bg-brand-charcoal rounded-2xl flex items-center justify-between shadow-lg">
                <span className="text-[10px] font-black text-white/50 uppercase tracking-widest">Risk-Reward</span>
                <span className="text-xl font-black text-brand-gold">{currentRR}</span>
              </div>
            </div>

            {/* Notes */}
            <div className="md:col-span-3 space-y-2">
              <label className="text-[10px] font-black text-brand-muted uppercase tracking-widest">Trade Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Liquidity sweep below equal lows... Entry from H1 demand..."
                className="w-full p-6 bg-brand-sage/5 border border-brand-sage/20 rounded-2xl outline-none focus:border-brand-gold transition-all font-medium text-brand-charcoal min-h-[120px]"
              />
            </div>

            {/* Submit Button */}
            <div className="md:col-span-3">
              <button
                onClick={handleSaveTrade}
                disabled={isSubmitting || !formData.instrument || !formData.entryPrice}
                className="w-full py-6 bg-brand-charcoal text-white rounded-2xl font-black uppercase tracking-widest hover:bg-brand-gold transition-all shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <ICONS.Check className="w-5 h-5" />
                    Save Trade to Journal
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Filters & History Section */}
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h3 className="text-xl font-black text-brand-charcoal uppercase tracking-tighter flex items-center gap-3">
              <ICONS.Chart className="w-6 h-6 text-brand-gold" />
              Trade History
            </h3>
            
            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3">
              <select 
                value={filters.outcome}
                onChange={e => setFilters({...filters, outcome: e.target.value})}
                className="p-2 bg-white border border-brand-sage/20 rounded-lg text-[10px] font-black uppercase outline-none focus:border-brand-gold"
              >
                <option value="All">All Outcomes</option>
                {OUTCOMES.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
              <select 
                value={filters.tradeType}
                onChange={e => setFilters({...filters, tradeType: e.target.value})}
                className="p-2 bg-white border border-brand-sage/20 rounded-lg text-[10px] font-black uppercase outline-none focus:border-brand-gold"
              >
                <option value="All">All Types</option>
                {TRADE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <select 
                value={filters.timeframe}
                onChange={e => setFilters({...filters, timeframe: e.target.value})}
                className="p-2 bg-white border border-brand-sage/20 rounded-lg text-[10px] font-black uppercase outline-none focus:border-brand-gold"
              >
                <option value="All">All Timeframes</option>
                {TIMEFRAMES.map(tf => <option key={tf} value={tf}>{tf}</option>)}
              </select>
            </div>
          </div>

          {/* Trade List */}
          <div className="space-y-4">
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-20 bg-brand-sage/5 rounded-2xl animate-pulse" />
                ))}
              </div>
            ) : filteredTrades.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-[2rem] border border-dashed border-brand-sage/30">
                <p className="text-brand-muted font-medium">No trades found matching your filters.</p>
              </div>
            ) : (
              filteredTrades.map(trade => (
                <div key={trade.id} className="bg-white rounded-2xl border border-brand-sage/20 overflow-hidden shadow-sm hover:shadow-md transition-all">
                  <button
                    onClick={() => setExpandedId(expandedId === trade.id ? null : trade.id!)}
                    className="w-full p-6 flex items-center justify-between text-left group"
                  >
                    <div className="flex items-center gap-6">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg ${
                        trade.direction === 'Buy' ? 'bg-brand-success/10 text-brand-success' : 'bg-brand-error/10 text-brand-error'
                      }`}>
                        {trade.instrument.substring(0, 2)}
                      </div>
                      <div>
                        <div className="flex items-center gap-3">
                          <h4 className="text-lg font-black text-brand-charcoal uppercase tracking-tighter">{trade.instrument}</h4>
                          <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${OUTCOME_TAG_COLORS[trade.outcome]}`}>
                            {trade.outcome}
                          </span>
                        </div>
                        <p className="text-[10px] text-brand-muted font-bold uppercase tracking-widest">
                          {trade.direction} • {trade.tradeType} • {trade.timeframe}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="hidden md:block text-right">
                        <p className="text-[8px] font-black text-brand-muted uppercase tracking-widest">Risk-Reward</p>
                        <p className="text-sm font-black text-brand-gold">{trade.rr}</p>
                      </div>
                      <div className={`transition-transform duration-300 ${expandedId === trade.id ? 'rotate-90 text-brand-gold' : 'text-brand-muted'}`}>
                        <ICONS.ChevronRight />
                      </div>
                    </div>
                  </button>

                  <AnimatePresence>
                    {expandedId === trade.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-brand-sage/10"
                      >
                        <div className="p-8 space-y-8 bg-brand-sage/5">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                            <div>
                              <p className="text-[8px] font-black text-brand-muted uppercase tracking-widest mb-1">Entry Price</p>
                              <p className="text-sm font-bold text-brand-charcoal">{trade.entryPrice}</p>
                            </div>
                            <div>
                              <p className="text-[8px] font-black text-brand-muted uppercase tracking-widest mb-1">Stop Loss</p>
                              <p className="text-sm font-bold text-brand-error">{trade.stopLoss}</p>
                            </div>
                            <div>
                              <p className="text-[8px] font-black text-brand-muted uppercase tracking-widest mb-1">Take Profit</p>
                              <p className="text-sm font-bold text-brand-success">{trade.takeProfit}</p>
                            </div>
                            <div>
                              <p className="text-[8px] font-black text-brand-muted uppercase tracking-widest mb-1">Date Logged</p>
                              <p className="text-sm font-bold text-brand-charcoal">{new Date(trade.timestamp).toLocaleDateString()}</p>
                            </div>
                          </div>

                          {trade.notes && (
                            <div className="space-y-2">
                              <p className="text-[8px] font-black text-brand-muted uppercase tracking-widest">Trade Notes</p>
                              <p className="text-xs text-brand-charcoal leading-relaxed bg-white p-4 rounded-xl border border-brand-sage/10 italic">
                                "{trade.notes}"
                              </p>
                            </div>
                          )}

                          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-brand-sage/10">
                            <div className="flex items-center gap-2">
                              <p className="text-[8px] font-black text-brand-muted uppercase tracking-widest mr-2">Update Outcome:</p>
                              {OUTCOMES.map(o => (
                                <button
                                  key={o}
                                  onClick={() => handleUpdateOutcome(trade.id!, o)}
                                  className={`px-3 py-1 rounded text-[8px] font-black uppercase tracking-widest transition-all ${
                                    trade.outcome === o ? OUTCOME_COLORS[o] : 'bg-white border border-brand-sage/20 text-brand-muted hover:border-brand-gold'
                                  }`}
                                >
                                  {o}
                                </button>
                              ))}
                            </div>
                            <button
                              onClick={() => handleDelete(trade.id!)}
                              className="px-4 py-2 bg-brand-error/10 text-brand-error rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-brand-error hover:text-white transition-all"
                            >
                              Delete Trade
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default TradeJournal;
