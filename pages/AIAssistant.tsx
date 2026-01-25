
// Add React to the import list to fix "Cannot find namespace 'React'" error.
import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, TradeAnalysis, AnalysisFeedback } from '../types';
import { analyzeMarket } from '../services/backend';
import { getMarketData } from '../services/marketData';
import { getUserAnalysisHistory, submitAnalysisFeedback } from '../services/firestore';
import { FOREX_INSTRUMENTS, STOCK_INSTRUMENTS, ICONS } from '../constants';

const TIMEFRAMES = [
  '1m', '3m', '5m', '10m', '15m', '30m', 
  '1h', '2h', '4h', '8h', 
  '1D', '1W', '1M', '1Y'
];

interface AIAssistantProps {
  user: UserProfile | null;
  onTokenSpend: () => void;
}

const AIAssistant: React.FC<AIAssistantProps> = ({ user }) => {
  // Configuration State
  const [marketType, setMarketType] = useState<'forex' | 'stock' | null>(null);
  const [symbol, setSymbol] = useState('');
  const [timeframe, setTimeframe] = useState('1h');
  const [fundamentalToggle, setFundamentalToggle] = useState(false);
  
  // Searchable Dropdown State
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Analysis State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<TradeAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Live Price State
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [priceTimestamp, setPriceTimestamp] = useState<string | null>(null);
  const [isPriceLoading, setIsPriceLoading] = useState(false);

  // History State
  const [history, setHistory] = useState<TradeAnalysis[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [expandedHistoryId, setExpandedHistoryId] = useState<string | null>(null);

  // Feedback State
  const [feedbackComment, setFeedbackComment] = useState('');
  const [activeFeedbackId, setActiveFeedbackId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadHistory();
    }
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [user]);

  useEffect(() => {
    // Reset selections when market type changes
    if (marketType) {
        setSymbol('');
        setSearchQuery('');
        setCurrentPrice(null);
        setPriceTimestamp(null);
        setError(null);
        setAnalysis(null);
    }
  }, [marketType]);

  const loadHistory = async () => {
    if (!user) return;
    setHistoryLoading(true);
    const data = await getUserAnalysisHistory(user.uid);
    setHistory(data);
    setHistoryLoading(false);
  };

  const getFilteredInstruments = () => {
    const list = marketType === 'forex' ? FOREX_INSTRUMENTS : marketType === 'stock' ? STOCK_INSTRUMENTS : [];
    if (!searchQuery) return list;
    const lowerQ = searchQuery.toLowerCase();
    return list.filter(i => 
      i.symbol.toLowerCase().includes(lowerQ) || 
      i.name.toLowerCase().includes(lowerQ)
    );
  };

  const handleInstrumentSelect = async (selected: { symbol: string, name: string }) => {
    setSymbol(selected.symbol);
    setSearchQuery(`${selected.name} (${selected.symbol})`);
    setIsDropdownOpen(false);
    
    // Fetch Price Data
    setCurrentPrice(null);
    setPriceTimestamp(null);
    setError(null);
    setAnalysis(null);
    setIsPriceLoading(true);

    try {
      const type = marketType === 'forex' ? 'forex' : 'stock';
      const data = await getMarketData(type, selected.symbol);

      if (data && !data.error) {
          if (type === 'stock' && data.data && data.data.length > 0) {
            setCurrentPrice(data.data[0].close);
            setPriceTimestamp(new Date().toLocaleTimeString());
          } else if (type === 'forex') {
            const quoteKey = `USD${selected.symbol.replace('USD', '')}`;
            const rate = data.quotes?.[quoteKey] || data.rates?.[selected.symbol.replace('USD', '')];
            if (rate) {
              setCurrentPrice(selected.symbol.endsWith('USD') ? 1/rate : rate);
              setPriceTimestamp(new Date().toLocaleTimeString());
            }
          }
      }
    } catch (err: any) {
      console.warn("Athenix: Market price sync failed.");
    } finally {
      setIsPriceLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!user) return;
    if (!symbol || !marketType) {
      setError('Please select a market type and instrument.');
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setAnalysis(null);

    const response = await analyzeMarket(user.uid, symbol, timeframe, fundamentalToggle, marketType);

    if (response.status === 'success') {
      const newAnalysis = response.data;
      setAnalysis(newAnalysis);
      // POPULATE IMMEDIATELY: Prepend to history for real-time feedback
      setHistory(prev => [newAnalysis, ...prev]);
      // Optional: Auto-expand the history entry after a short delay
      setTimeout(() => {
        setExpandedHistoryId(newAnalysis.id);
      }, 500);
    } else {
      setError(response.message);
    }
    setIsAnalyzing(false);
  };

  const submitFeedback = async (analysisId: string, outcome: 'TP' | 'SL' | 'BE' | 'IGNORED') => {
    const feedback: AnalysisFeedback = {
      outcome,
      comment: feedbackComment,
      timestamp: new Date().toISOString()
    };
    
    await submitAnalysisFeedback(analysisId, feedback);
    setActiveFeedbackId(null);
    setFeedbackComment('');
    loadHistory(); 
  };

  const fmt = (num?: number, digits = 5) => num ? num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: digits }) : '---';

  const AnalysisDetailView = ({ data, isHistory = false }: { data: TradeAnalysis, isHistory?: boolean }) => (
    <div className={`space-y-10 relative overflow-hidden bg-white ${isHistory ? 'p-0' : 'border border-brand-sage rounded-2xl p-6 md:p-10 animate-slide-up'}`}>
      {!isHistory && <div className="absolute top-0 right-0 w-32 h-32 bg-brand-gold/5 -mr-16 -mt-16 rounded-full"></div>}
      
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pb-6 border-b border-brand-sage/10">
        <div>
          <h4 className="text-3xl font-black text-brand-charcoal tracking-tighter mb-2 uppercase">
            {data.instrument}
          </h4>
          <div className="flex flex-wrap gap-2">
              <span className="px-2 py-1 bg-brand-charcoal text-white text-[9px] font-black uppercase rounded tracking-widest">
                {data.execution_timeframe}
              </span>
              <span className={`px-2 py-1 text-[9px] font-black uppercase rounded tracking-widest ${
                data.final_decision === 'trade' ? 'bg-brand-success/10 text-brand-success' : 'bg-brand-muted/10 text-brand-muted'
              }`}>
                {data.final_decision === 'trade' ? 'ACTIVE SETUP' : 'NO TRADE'}
              </span>
              {data.strategy_used && (
                <span className="px-2 py-1 bg-brand-gold/10 text-brand-gold text-[9px] font-black uppercase rounded tracking-widest">
                  {data.strategy_used.replace(/_/g, ' ')}
                </span>
              )}
          </div>
        </div>
        {data.signal && (
          <div className="text-right">
              <div className="text-xs font-black uppercase tracking-widest text-brand-muted mb-1">Confidence</div>
              <div className="text-2xl font-black text-brand-charcoal">{data.signal.confidence_score}%</div>
          </div>
        )}
      </div>

      {data.final_decision === 'trade' && data.signal ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-2 p-4 bg-brand-sage/5 rounded-xl border border-brand-sage/20">
              <p className="text-[9px] text-brand-gold uppercase font-black tracking-widest">Direction</p>
              <p className={`text-sm font-black uppercase ${data.signal.direction === 'buy' ? 'text-brand-success' : 'text-brand-error'}`}>
                {data.signal.order_type.replace('_', ' ')}
              </p>
            </div>
            <div className="space-y-2 p-4 bg-brand-sage/5 rounded-xl border border-brand-sage/20">
              <p className="text-[9px] text-brand-gold uppercase font-black tracking-widest">Entry Zone</p>
              <p className="text-sm font-black text-brand-charcoal">{fmt(data.signal.entry_price)}</p>
            </div>
            <div className="space-y-2 p-4 bg-brand-sage/5 rounded-xl border border-brand-sage/20">
              <p className="text-[9px] text-brand-gold uppercase font-black tracking-widest">Stop Loss</p>
              <p className="text-sm font-black text-brand-error">{fmt(data.signal.stop_loss)}</p>
            </div>
            <div className="space-y-2 p-4 bg-brand-sage/5 rounded-xl border border-brand-sage/20">
              <p className="text-[9px] text-brand-gold uppercase font-black tracking-widest">Risk / Reward</p>
              <p className="text-sm font-black text-brand-charcoal">1:{data.signal.risk_reward_ratio}</p>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-[10px] text-brand-muted uppercase font-black tracking-widest">Take Profit Targets</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {data.signal.take_profits.map((tp, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3 bg-brand-success/5 border border-brand-success/20 rounded-lg">
                    <span className="text-[9px] font-black text-brand-success uppercase">{tp.level}</span>
                    <span className="text-xs font-bold text-brand-charcoal">{fmt(tp.price)}</span>
                  </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="p-8 bg-brand-sage/10 rounded-xl text-center border-2 border-dashed border-brand-sage/30">
            <p className="text-brand-charcoal font-black uppercase tracking-widest text-sm mb-2">Market Conditions Unfavorable</p>
            <p className="text-brand-muted text-xs max-w-md mx-auto">The algorithm has determined that current price action does not meet the strict probability threshold required for a valid setup.</p>
        </div>
      )}

      <div className="pt-8 border-t border-brand-sage/20 grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-2">
          <p className="text-[9px] text-brand-muted uppercase font-black tracking-[0.2em]">Bias & Structure</p>
          <p className="text-xs text-brand-charcoal leading-loose font-medium opacity-90">{data.reasoning.bias_explanation}</p>
        </div>
        <div className="space-y-2">
          <p className="text-[9px] text-brand-muted uppercase font-black tracking-[0.2em]">Liquidity Logic</p>
          <p className="text-xs text-brand-charcoal leading-loose font-medium opacity-90">{data.reasoning.liquidity_explanation}</p>
        </div>
        <div className="space-y-2">
          <p className="text-[9px] text-brand-muted uppercase font-black tracking-[0.2em]">Entry Confirmation</p>
          <p className="text-xs text-brand-charcoal leading-loose font-medium opacity-90">{data.reasoning.entry_explanation}</p>
        </div>
        <div className="space-y-2">
          <p className="text-[9px] text-brand-muted uppercase font-black tracking-[0.2em]">Invalidation Point</p>
          <p className="text-xs text-brand-charcoal leading-loose font-medium opacity-90">{data.reasoning.invalidation_explanation}</p>
        </div>
      </div>

      <div className="pt-6 border-t border-brand-sage/10 flex justify-between items-center text-[8px] text-brand-muted uppercase font-bold tracking-widest opacity-50">
          <span>Engine: {data.meta?.analysis_engine_version || 'v5.0'}</span>
          <span>Generated: {data.timestamp ? (typeof data.timestamp === 'string' ? new Date(data.timestamp).toLocaleString() : 'Recent') : new Date().toLocaleTimeString()}</span>
      </div>
    </div>
  );

  return (
    <div className="p-6 md:p-10 space-y-10 animate-fade-in max-w-7xl mx-auto pb-24">
      <div className="space-y-2">
        <h2 className="text-4xl font-black text-brand-charcoal uppercase tracking-tighter">AI Assistant</h2>
        <p className="text-brand-muted font-medium text-sm uppercase tracking-widest">Generate high-precision neural market setups.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <section className="w-full lg:w-1/3 space-y-8">
          <div className="athenix-card p-8 space-y-8">
            <h3 className="text-xs font-black text-brand-gold uppercase tracking-[0.3em] border-l-4 border-brand-gold pl-4">Analysis Configuration</h3>
            
            <div className="space-y-6">
              
              {/* MARKET TYPE SELECTION */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-brand-muted uppercase tracking-widest block">Select Market Sector</label>
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => setMarketType('forex')}
                    className={`py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                      marketType === 'forex' 
                        ? 'bg-brand-charcoal text-white shadow-lg' 
                        : 'bg-brand-sage/5 text-brand-muted hover:bg-brand-sage/10'
                    }`}
                  >
                    Forex & Metals
                  </button>
                  <button 
                    onClick={() => setMarketType('stock')}
                    className={`py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                      marketType === 'stock' 
                        ? 'bg-brand-charcoal text-white shadow-lg' 
                        : 'bg-brand-sage/5 text-brand-muted hover:bg-brand-sage/10'
                    }`}
                  >
                    Stock Market
                  </button>
                </div>
              </div>

              {/* INSTRUMENT SEARCH */}
              <div className="space-y-2" ref={dropdownRef}>
                <label className="text-[10px] font-black text-brand-muted uppercase tracking-widest block">Instrument</label>
                <div className="relative">
                  <div className="relative">
                     <input 
                       type="text"
                       value={searchQuery}
                       onChange={(e) => {
                         setSearchQuery(e.target.value);
                         setIsDropdownOpen(true);
                       }}
                       onFocus={() => setIsDropdownOpen(true)}
                       placeholder={marketType ? "Search pair or symbol..." : "Select market sector first"}
                       disabled={!marketType}
                       className="w-full pl-5 pr-10 py-4 bg-brand-sage/5 border border-brand-sage rounded-xl outline-none font-bold text-brand-charcoal text-xs placeholder:text-brand-muted/50 focus:border-brand-gold transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                     />
                     <div className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-muted pointer-events-none">
                       <ICONS.Search />
                     </div>
                  </div>

                  {isDropdownOpen && marketType && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-brand-sage rounded-xl shadow-2xl z-50 max-h-60 overflow-y-auto">
                      {getFilteredInstruments().length > 0 ? (
                        getFilteredInstruments().map((item) => (
                          <button
                            key={item.symbol}
                            onClick={() => handleInstrumentSelect(item)}
                            className="w-full text-left px-5 py-3 hover:bg-brand-sage/5 transition-colors flex justify-between items-center group border-b border-brand-sage/5 last:border-0"
                          >
                            <span className="text-xs font-black text-brand-charcoal">{item.symbol}</span>
                            <span className="text-[10px] text-brand-muted font-bold uppercase tracking-wide group-hover:text-brand-gold">{item.name}</span>
                          </button>
                        ))
                      ) : (
                        <div className="px-5 py-4 text-[10px] text-brand-muted font-medium text-center">
                          No instruments found matching "{searchQuery}"
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Live Price Display */}
              <div className="relative overflow-hidden p-6 bg-brand-charcoal text-white rounded-2xl shadow-xl border border-brand-charcoal group">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-brand-gold/10 blur-[50px] rounded-full -mr-10 -mt-10 pointer-events-none"></div>
                 <div className="flex justify-between items-start relative z-10">
                   <div>
                     <div className="flex items-center gap-2 mb-2">
                       <span className="text-[9px] font-black uppercase tracking-[0.2em] text-brand-gold">Live Market Data</span>
                       <div className={`w-1.5 h-1.5 rounded-full ${isPriceLoading ? 'bg-brand-warning animate-ping' : (currentPrice ? 'bg-brand-success' : 'bg-brand-muted')}`}></div>
                     </div>
                     <div className="h-10 flex items-center">
                       {isPriceLoading ? (
                         <div className="w-6 h-6 border-2 border-white/20 border-t-brand-gold rounded-full animate-spin"></div>
                       ) : (
                         <span className="text-3xl font-black tracking-tighter font-mono">{currentPrice ? `$${fmt(currentPrice)}` : '---'}</span>
                       )}
                     </div>
                   </div>
                 </div>
                 <div className="mt-4 pt-4 border-t border-white/10 flex justify-between items-end">
                   <div>
                     <p className="text-[8px] text-white/40 font-bold uppercase tracking-widest">Last Update</p>
                     <p className="text-[10px] text-white/80 font-mono tracking-wide">{priceTimestamp || '--:--:--'}</p>
                   </div>
                   <div className="bg-brand-gold/20 px-2 py-1 rounded text-[8px] font-black text-brand-gold uppercase tracking-widest">REAL-TIME</div>
                 </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-brand-muted uppercase tracking-widest block">Timeframe</label>
                <div className="grid grid-cols-4 gap-2">
                  {TIMEFRAMES.map((tf) => (
                    <button 
                      key={tf}
                      onClick={() => setTimeframe(tf)}
                      className={`py-2 text-[10px] font-black tracking-widest rounded-lg border transition-all ${
                        timeframe === tf 
                          ? 'border-brand-gold bg-brand-gold text-white shadow-lg shadow-brand-gold/20' 
                          : 'border-brand-sage bg-white text-brand-muted hover:border-brand-gold hover:text-brand-gold'
                      }`}
                    >
                      {tf}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4">
                <div className="flex items-center justify-between p-4 bg-brand-sage/5 border border-dashed border-brand-sage rounded-xl">
                  <div>
                    <p className="text-[10px] font-black text-brand-charcoal uppercase tracking-widest">Include Fundamentals</p>
                    <p className="text-[9px] text-brand-muted font-bold uppercase tracking-tight">Macro Data Overlay</p>
                  </div>
                  <button 
                    onClick={() => setFundamentalToggle(!fundamentalToggle)}
                    className={`w-12 h-6 rounded-full transition-all relative ${fundamentalToggle ? 'bg-brand-gold' : 'bg-brand-sage'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${fundamentalToggle ? 'left-7' : 'left-1'}`}></div>
                  </button>
                </div>
              </div>

              {error && (
                <div className="p-4 bg-brand-error/10 border border-brand-error/20 rounded-xl">
                  <p className="text-[10px] text-brand-error font-black uppercase tracking-tight">{error}</p>
                </div>
              )}

              <button 
                disabled={isAnalyzing}
                onClick={handleGenerate}
                className="btn-primary w-full py-5 font-black text-xs rounded-xl shadow-xl uppercase tracking-[0.2em] mt-4 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] transition-transform"
              >
                {isAnalyzing ? 'Synthesizing Analysis...' : 'Generate Analysis'}
              </button>
            </div>
          </div>
        </section>

        <section className="flex-1 space-y-8">
          <div className="athenix-card min-h-[500px] p-8 flex flex-col">
            <h3 className="text-xs font-black text-brand-muted uppercase tracking-[0.3em] mb-10">Neural Analysis Output</h3>
            
            {analysis ? (
              <AnalysisDetailView data={analysis} />
            ) : isAnalyzing ? (
              <div className="flex-1 flex flex-col items-center justify-center space-y-6">
                <div className="w-16 h-16 border-4 border-brand-sage border-t-brand-gold rounded-full animate-spin"></div>
                <div className="text-center space-y-2">
                   <p className="text-[10px] font-black text-brand-muted uppercase tracking-[0.4em]">Querying Neural Nodes...</p>
                   <p className="text-[9px] font-medium text-brand-sage uppercase tracking-widest">Scanning Liquidity & Structural Shifts</p>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-12 opacity-40">
                <div className="w-16 h-16 bg-brand-sage/10 rounded-2xl flex items-center justify-center text-brand-muted mb-6">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <p className="text-[10px] font-black text-brand-muted uppercase tracking-[0.3em] max-w-xs mx-auto">
                  Initialize neural analysis to populate the terminal output and history ledger.
                </p>
              </div>
            )}
          </div>

          <div className="athenix-card p-8 bg-brand-sage/5 space-y-6">
            <div className="flex justify-between items-center border-b border-brand-sage/10 pb-4">
              <h3 className="text-xs font-black text-brand-charcoal uppercase tracking-[0.3em]">Analysis History Ledger</h3>
              <button 
                onClick={loadHistory}
                className="text-[9px] font-black text-brand-gold uppercase tracking-widest hover:underline flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className={`w-3 h-3 ${historyLoading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Sync
              </button>
            </div>
            
            {historyLoading && history.length === 0 ? (
              <div className="text-center p-8 text-[10px] font-black uppercase text-brand-muted tracking-widest">Accessing Node Network...</div>
            ) : history.length === 0 ? (
              <div className="text-center p-8 text-[10px] font-black uppercase text-brand-muted tracking-widest border border-dashed border-brand-sage/30 rounded-xl">No previous neural scans committed to ledger.</div>
            ) : (
              <div className="space-y-4">
                {history.map((item) => (
                  <div key={item.id} className="bg-white rounded-xl border border-brand-sage/20 overflow-hidden shadow-sm hover:border-brand-gold/30 transition-all">
                    <div 
                      className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-brand-sage/5 transition-colors"
                      onClick={() => setExpandedHistoryId(expandedHistoryId === item.id ? null : item.id as string)}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-[9px] font-black text-white uppercase ${
                          item.final_decision === 'trade' 
                            ? (item.signal?.direction === 'buy' ? 'bg-brand-success shadow-lg shadow-brand-success/20' : 'bg-brand-error shadow-lg shadow-brand-error/20') 
                            : 'bg-brand-muted/40'
                        }`}>
                          {item.final_decision === 'trade' ? item.signal?.direction : 'NONE'}
                        </div>
                        <div>
                          <p className="text-sm font-black text-brand-charcoal uppercase">{item.instrument}</p>
                          <p className="text-[9px] text-brand-muted font-bold uppercase tracking-widest">
                             {item.execution_timeframe} • {item.timestamp ? (typeof item.timestamp === 'string' ? new Date(item.timestamp).toLocaleDateString() : 'Recent') : 'Syncing...'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        {item.feedback ? (
                           <div className={`px-3 py-1 rounded text-[8px] font-black uppercase tracking-widest ${
                             item.feedback.outcome === 'TP' ? 'bg-brand-success/10 text-brand-success' :
                             item.feedback.outcome === 'SL' ? 'bg-brand-error/10 text-brand-error' :
                             item.feedback.outcome === 'BE' ? 'bg-brand-gold/10 text-brand-gold' :
                             'bg-brand-sage/10 text-brand-muted'
                           }`}>
                             Result: {item.feedback.outcome}
                           </div>
                        ) : (
                           <span className="text-[8px] font-bold text-brand-muted uppercase tracking-widest opacity-50 px-2">Unreported</span>
                        )}
                        <svg 
                          xmlns="http://www.w3.org/2000/svg" 
                          className={`w-4 h-4 text-brand-muted transition-transform ${expandedHistoryId === item.id ? 'rotate-180 text-brand-gold' : ''}`} 
                          fill="none" viewBox="0 0 24 24" stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>

                    {expandedHistoryId === item.id && (
                      <div className="border-t border-brand-sage/10 animate-fade-in">
                        <div className="p-6 bg-brand-sage/5">
                          <AnalysisDetailView data={item} isHistory={true} />
                        </div>
                        
                        {!item.feedback && (
                          <div className="p-6 border-t border-brand-sage/10 bg-white">
                            {activeFeedbackId === item.id ? (
                              <div className="space-y-4 animate-slide-up">
                                <div className="flex justify-between items-center">
                                   <p className="text-[10px] font-black text-brand-muted uppercase tracking-widest">Commit Outcome To Ledger</p>
                                   <button onClick={() => setActiveFeedbackId(null)} className="text-[9px] font-black uppercase tracking-widest text-brand-muted hover:text-brand-charcoal">Cancel</button>
                                </div>
                                <textarea
                                  value={feedbackComment}
                                  onChange={(e) => setFeedbackComment(e.target.value)}
                                  placeholder="Contextual notes (e.g. Fundamental reversal, High impact news shift)"
                                  className="w-full p-3 bg-brand-sage/5 border border-brand-sage rounded-xl text-xs outline-none focus:border-brand-gold min-h-[80px] resize-none"
                                />
                                <div className="grid grid-cols-4 gap-2">
                                  <button onClick={() => submitFeedback(item.id!, 'TP')} className="py-3 bg-brand-success text-white rounded-lg text-[9px] font-black uppercase tracking-widest hover:brightness-110 transition-all">TP</button>
                                  <button onClick={() => submitFeedback(item.id!, 'SL')} className="py-3 bg-brand-error text-white rounded-lg text-[9px] font-black uppercase tracking-widest hover:brightness-110 transition-all">SL</button>
                                  <button onClick={() => submitFeedback(item.id!, 'BE')} className="py-3 bg-brand-gold text-white rounded-lg text-[9px] font-black uppercase tracking-widest hover:brightness-110 transition-all">BE</button>
                                  <button onClick={() => submitFeedback(item.id!, 'IGNORED')} className="py-3 bg-brand-muted text-white rounded-lg text-[9px] font-black uppercase tracking-widest hover:brightness-110 transition-all">Skip</button>
                                </div>
                              </div>
                            ) : (
                              <button 
                                onClick={() => setActiveFeedbackId(item.id as string)}
                                className="w-full py-4 border border-brand-sage text-brand-muted rounded-xl text-[9px] font-black uppercase tracking-widest hover:border-brand-gold hover:text-brand-gold transition-all"
                              >
                                Log Final Trade Outcome
                              </button>
                            )}
                          </div>
                        )}
                        
                        {item.feedback && item.feedback.comment && (
                          <div className="p-6 border-t border-brand-sage/10 bg-white">
                             <p className="text-[9px] font-black text-brand-muted uppercase tracking-widest mb-2">Historical Context Notes</p>
                             <div className="p-3 bg-brand-sage/5 rounded-lg border border-brand-sage/10">
                                <p className="text-xs text-brand-charcoal italic leading-relaxed">"{item.feedback.comment}"</p>
                             </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default AIAssistant;