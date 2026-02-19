
import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, TradeAnalysis, AnalysisFeedback } from '../types';
import { analyzeMarket, revalidateAnalysis } from '../services/backend';
import { getUserAnalysisHistory, submitAnalysisFeedback } from '../services/firestore';
import { FOREX_INSTRUMENTS, STOCK_INSTRUMENTS, ICONS } from '../constants';

type ExecutionMode = 'scalp' | 'day_trade' | 'swing_trade';

const MODE_CONFIG: Record<ExecutionMode, { label: string; desc: string; timeframes: string[]; icon: React.FC<{selected: boolean}> }> = {
  scalp: {
    label: 'Scalp',
    desc: 'M1-M15. Refined to M1.',
    timeframes: ['1m', '3m', '5m', '15m'],
    icon: ({selected}) => (
      <svg className={`w-5 h-5 ${selected ? 'text-white' : 'text-brand-gold'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    )
  },
  day_trade: {
    label: 'Day Trade',
    desc: 'M15-H4. Refined to M5.',
    timeframes: ['15m', '30m', '1h', '2h', '4h'],
    icon: ({selected}) => (
      <svg className={`w-5 h-5 ${selected ? 'text-white' : 'text-brand-gold'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
  },
  swing_trade: {
    label: 'Swing Trade',
    desc: 'H4-Weekly. Refined to M15.',
    timeframes: ['4h', '8h', '1D', '1W'],
    icon: ({selected}) => (
      <svg className={`w-5 h-5 ${selected ? 'text-white' : 'text-brand-gold'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    )
  }
};

interface AIAssistantProps {
  user: UserProfile | null;
  onTokenSpend: () => void;
}

const AIAssistant: React.FC<AIAssistantProps> = ({ user }) => {
  const [tradeMode, setTradeMode] = useState<ExecutionMode | null>(null);
  const [marketType, setMarketType] = useState<'forex' | 'stock' | null>(null);
  const [symbol, setSymbol] = useState('');
  const [timeframe, setTimeframe] = useState('');
  const [fundamentalToggle, setFundamentalToggle] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<TradeAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // History & Revalidation State
  const [history, setHistory] = useState<TradeAnalysis[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [expandedHistoryId, setExpandedHistoryId] = useState<string | null>(null);
  const [revalidatingId, setRevalidatingId] = useState<string | null>(null);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [activeFeedbackId, setActiveFeedbackId] = useState<string | null>(null);

  useEffect(() => {
    if (user) loadHistory();
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setIsDropdownOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [user]);

  useEffect(() => {
    if (marketType) { setSymbol(''); setSearchQuery(''); setError(null); setAnalysis(null); }
  }, [marketType]);

  useEffect(() => {
    if (tradeMode && timeframe && !MODE_CONFIG[tradeMode].timeframes.includes(timeframe)) setTimeframe('');
  }, [tradeMode]);

  const loadHistory = async () => {
    if (!user) return;
    setHistoryLoading(true);
    setHistory(await getUserAnalysisHistory(user.uid));
    setHistoryLoading(false);
  };

  const handleInstrumentSelect = async (selected: { symbol: string, name: string }) => {
    setSymbol(selected.symbol);
    setSearchQuery(`${selected.name} (${selected.symbol})`);
    setIsDropdownOpen(false);
    setError(null);
    setAnalysis(null);
  };

  const handleGenerate = async () => {
    if (!user || !tradeMode || !symbol || !marketType || !timeframe) {
      setError('Complete configuration to initialize analysis.');
      return;
    }
    setIsAnalyzing(true);
    setError(null);
    setAnalysis(null);
    const response = await analyzeMarket(user.uid, symbol, timeframe, fundamentalToggle, marketType);
    if (response.status === 'success') {
      const data = response.data as TradeAnalysis;
      setAnalysis(data);
      // Immediately add to history local state to reflect change without reload
      setHistory(prev => [data, ...prev]);
    } else setError(response.message);
    setIsAnalyzing(false);
  };

  const submitFeedback = async (analysisId: string, outcome: 'TP' | 'SL' | 'BE' | 'RUNNING' | 'NOT_TAKEN' | 'INVALID') => {
    await submitAnalysisFeedback(analysisId, { outcome, comment: feedbackComment, timestamp: new Date().toISOString() });
    setActiveFeedbackId(null); 
    setFeedbackComment(''); 
    loadHistory(); 
  };

  const handleRevalidate = async (item: TradeAnalysis) => {
    if (!user || !item.id) return;
    setRevalidatingId(item.id);
    const result = await revalidateAnalysis(user.uid, item.id, item);
    if (result.status === 'success') {
      await loadHistory(); // Refresh to show new validation status
    } else {
      alert(result.message);
    }
    setRevalidatingId(null);
  };

  const fmt = (num?: number, digits = 5) => num ? num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: digits }) : '---';

  const AnalysisDetailView = ({ data, isHistory = false }: { data: TradeAnalysis, isHistory?: boolean }) => (
    <div className={`space-y-8 bg-white ${isHistory ? 'p-0' : 'border border-brand-sage rounded-2xl p-6 md:p-10 animate-slide-up'}`}>
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pb-6 border-b border-brand-sage/10">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
             <h4 className="text-3xl font-black text-brand-charcoal tracking-tighter uppercase">{data.instrument}</h4>
             <span className="px-3 py-1 bg-brand-gold text-white text-[9px] font-black uppercase rounded tracking-widest shadow-md">
               {data.execution_mode.replace('_', ' ')}
             </span>
          </div>
          <div className="flex flex-wrap gap-2">
              <span className="px-2 py-1 bg-brand-charcoal text-white text-[9px] font-black uppercase rounded tracking-widest">{data.execution_timeframe}</span>
              <span className={`px-2 py-1 text-[9px] font-black uppercase rounded tracking-widest ${data.final_decision === 'trade' ? 'bg-brand-success/10 text-brand-success' : 'bg-brand-muted/10 text-brand-muted'}`}>
                {data.final_decision === 'trade' ? 'VALID SETUP' : 'REJECTED'}
              </span>
              {data.market_phase && (
                  <span className="px-2 py-1 bg-brand-sage/20 text-brand-charcoal text-[9px] font-black uppercase rounded tracking-widest">{data.market_phase}</span>
              )}
          </div>
        </div>
        
        <div className="text-right">
            <div className="text-[9px] font-black uppercase tracking-widest text-brand-muted mb-1">Total Confluence</div>
            <div className="text-3xl font-black text-brand-charcoal">{data.confluence_scores.total_confluence_score}/40</div>
        </div>
      </div>

      {/* Probabilistic Outcome Engine */}
      <div className="space-y-4">
        <p className="text-[10px] text-brand-muted uppercase font-black tracking-widest">Probabilistic Outcome Engine</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className={`p-4 rounded-xl border ${data.probabilities.irl_only > 50 ? 'border-brand-gold bg-brand-gold/5' : 'border-brand-sage/20 bg-white'}`}>
            <p className="text-[8px] font-black uppercase text-brand-muted tracking-widest mb-1">Scenario A: IRL Reaction</p>
            <p className="text-xl font-black text-brand-charcoal">{data.probabilities.irl_only}%</p>
          </div>
          <div className={`p-4 rounded-xl border ${data.probabilities.irl_to_erl > 50 ? 'border-brand-gold bg-brand-gold/5' : 'border-brand-sage/20 bg-white'}`}>
            <p className="text-[8px] font-black uppercase text-brand-muted tracking-widest mb-1">Scenario B: IRL → ERL</p>
            <p className="text-xl font-black text-brand-charcoal">{data.probabilities.irl_to_erl}%</p>
          </div>
          <div className={`p-4 rounded-xl border ${data.probabilities.expansion > 50 ? 'border-brand-gold bg-brand-gold/5' : 'border-brand-sage/20 bg-white'}`}>
            <p className="text-[8px] font-black uppercase text-brand-muted tracking-widest mb-1">Scenario C: Expansion</p>
            <p className="text-xl font-black text-brand-charcoal">{data.probabilities.expansion}%</p>
          </div>
        </div>
      </div>

      {/* Structural Confluence Breakdown */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Structure', score: data.confluence_scores.structure_score },
          { label: 'Liquidity', score: data.confluence_scores.liquidity_score },
          { label: 'POI Quality', score: data.confluence_scores.poi_score },
          { label: 'Prem/Disc', score: data.confluence_scores.premium_discount_score }
        ].map((item, idx) => (
          <div key={idx} className="p-3 bg-brand-sage/5 rounded-lg border border-brand-sage/10 text-center">
            <p className="text-[8px] font-black uppercase text-brand-muted tracking-widest mb-1">{item.label}</p>
            <p className="text-sm font-black text-brand-charcoal">{item.score}/10</p>
          </div>
        ))}
      </div>

      {/* Execution Signal */}
      {data.final_decision === 'trade' && data.signal ? (
        <div className="space-y-6 pt-6 border-t border-brand-sage/10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-brand-charcoal text-white rounded-xl text-center md:text-left">
              <p className="text-[9px] text-brand-gold uppercase font-black tracking-widest mb-1">Action</p>
              <p className="text-sm font-black uppercase">{data.signal.order_type.replace(/_/g, ' ')}</p>
            </div>
            <div className="p-4 bg-brand-sage/5 border border-brand-sage/20 rounded-xl text-center md:text-left">
              <p className="text-[9px] text-brand-gold uppercase font-black tracking-widest mb-1">Entry Price</p>
              <p className="text-sm font-black text-brand-charcoal">{fmt(data.signal.entry_price)}</p>
            </div>
            <div className="p-4 bg-brand-sage/5 border border-brand-sage/20 rounded-xl text-center md:text-left">
              <p className="text-[9px] text-brand-gold uppercase font-black tracking-widest mb-1">Stop Loss</p>
              <p className="text-sm font-black text-brand-error">{fmt(data.signal.stop_loss)}</p>
            </div>
            <div className="p-4 bg-brand-sage/5 border border-brand-sage/20 rounded-xl text-center md:text-left">
              <p className="text-[9px] text-brand-gold uppercase font-black tracking-widest mb-1">Min RR</p>
              <p className="text-sm font-black text-brand-charcoal">1:{data.signal.risk_reward_ratio}</p>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-[10px] text-brand-muted uppercase font-black tracking-widest">Dynamic TP Targets (Allocated Weights)</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {data.signal.take_profits.map((tp, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3 bg-white border border-brand-success/30 rounded-lg shadow-sm">
                    <div className="flex flex-col">
                      <span className="text-[8px] font-black text-brand-success uppercase tracking-widest">{tp.level}</span>
                      <span className={`text-[7px] font-black uppercase ${tp.allocation_weight === 'heavy' ? 'text-brand-success' : 'text-brand-muted'}`}>{tp.allocation_weight}</span>
                    </div>
                    <span className="text-xs font-bold text-brand-charcoal">{fmt(tp.price)}</span>
                  </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="p-10 bg-brand-error/5 border border-dashed border-brand-error/20 rounded-xl text-center">
            <p className="text-brand-error font-black uppercase tracking-widest text-xs mb-2">Rejection Condition Met</p>
            <p className="text-brand-muted text-[10px] font-medium max-w-sm mx-auto">Neural Confluence Score &lt; 20 or Structural Risk Constraints violated (Min 1:3 RR to ERL required).</p>
        </div>
      )}

      {/* Volatility Context */}
      <div className="p-4 bg-brand-sage/5 border border-brand-sage/10 rounded-xl">
        <p className="text-[9px] text-brand-muted uppercase font-black tracking-widest mb-1">Volatility Context</p>
        <p className="text-xs font-medium text-brand-charcoal italic leading-relaxed">{data.volatility_context}</p>
      </div>

      {/* Reasoning Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-brand-sage/10">
        <div className="space-y-1">
          <p className="text-[9px] text-brand-muted uppercase font-black tracking-[0.2em]">HTF Structural framework</p>
          <div className="p-4 bg-brand-sage/5 rounded-lg text-xs text-brand-charcoal font-medium leading-relaxed">{data.reasoning.bias_explanation}</div>
        </div>
        <div className="space-y-1">
          <p className="text-[9px] text-brand-muted uppercase font-black tracking-[0.2em]">Liquidity Engineering</p>
          <div className="p-4 bg-brand-sage/5 rounded-lg text-xs text-brand-charcoal font-medium leading-relaxed">{data.reasoning.liquidity_explanation}</div>
        </div>
      </div>

      {/* History Actions */}
      {isHistory && data.id && (
         <div className="pt-8 mt-6 border-t border-brand-sage/20 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
               <div>
                  <h4 className="text-xs font-black text-brand-charcoal uppercase tracking-widest">Strategy Revalidation</h4>
                  <p className="text-[10px] text-brand-muted mt-1">Check setup validity against current price action.</p>
               </div>
               
               <div className="flex items-center gap-4">
                 {data.validationResult && (
                   <div className="text-right">
                      <span className={`px-3 py-1.5 rounded text-[10px] font-black uppercase ${
                        data.validationResult === 'Setup Still Valid' ? 'bg-brand-success/10 text-brand-success' : 
                        data.validationResult === 'Setup Invalidated' ? 'bg-brand-error/10 text-brand-error' :
                        'bg-brand-gold/10 text-brand-gold'
                      }`}>
                        {data.validationResult}
                      </span>
                      <p className="text-[8px] text-brand-muted mt-1 uppercase tracking-wider">
                         {data.lastValidatedAt ? new Date(data.lastValidatedAt).toLocaleString() : ''}
                      </p>
                   </div>
                 )}
                 <button 
                   onClick={() => handleRevalidate(data)}
                   disabled={revalidatingId === data.id}
                   className="px-6 py-3 bg-brand-charcoal text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-brand-gold transition-colors disabled:opacity-50"
                 >
                   {revalidatingId === data.id ? 'Analyzing...' : 'Revalidate Setup'}
                 </button>
               </div>
            </div>

            <div className="bg-brand-sage/5 p-6 rounded-xl border border-brand-sage/10">
               <h4 className="text-xs font-black text-brand-charcoal uppercase tracking-widest mb-4">Outcome Feedback</h4>
               {data.feedback ? (
                  <div className="flex items-start gap-4">
                     <div className={`px-4 py-2 rounded text-[10px] font-black uppercase tracking-widest ${
                        data.feedback.outcome === 'TP' ? 'bg-brand-success/20 text-brand-success' :
                        data.feedback.outcome === 'SL' ? 'bg-brand-error/20 text-brand-error' :
                        'bg-brand-charcoal/10 text-brand-charcoal'
                     }`}>
                        {data.feedback.outcome.replace('_', ' ')}
                     </div>
                     {data.feedback.comment && <p className="text-xs text-brand-muted italic pt-1">"{data.feedback.comment}"</p>}
                  </div>
               ) : (
                  activeFeedbackId === data.id ? (
                     <div className="space-y-4 animate-fade-in">
                        <div className="grid grid-cols-3 gap-2">
                           {['TP', 'SL', 'BE', 'RUNNING', 'NOT_TAKEN', 'INVALID'].map(opt => (
                              <button key={opt} onClick={() => submitFeedback(data.id!, opt as any)} className="py-2 border border-brand-sage/20 bg-white hover:bg-brand-gold hover:text-white rounded text-[10px] font-bold uppercase transition-colors">
                                 {opt.replace('_', ' ')}
                              </button>
                           ))}
                        </div>
                        <input 
                           type="text" 
                           placeholder="Optional comment..." 
                           className="w-full p-3 text-xs border border-brand-sage/20 rounded-lg outline-none focus:border-brand-gold"
                           value={feedbackComment}
                           onChange={e => setFeedbackComment(e.target.value)}
                        />
                        <button onClick={() => setActiveFeedbackId(null)} className="text-[10px] text-brand-muted font-bold uppercase underline">Cancel</button>
                     </div>
                  ) : (
                     <button 
                        onClick={() => setActiveFeedbackId(data.id!)}
                        className="text-[10px] font-black text-brand-gold uppercase tracking-widest hover:underline"
                     >
                        + Log Trade Outcome
                     </button>
                  )
               )}
            </div>
         </div>
      )}

      <div className="pt-4 flex justify-between items-center text-[8px] text-brand-muted uppercase font-bold tracking-widest opacity-50">
          <span>{data.meta?.analysis_engine_version || 'Athenix v1.0.0 (Deterministic)'}</span>
          <span>{data.timestamp ? new Date(data.timestamp).toLocaleString() : 'LIVE'}</span>
      </div>
    </div>
  );

  return (
    <div className="p-6 md:p-10 space-y-10 animate-fade-in max-w-7xl mx-auto pb-24">
      <div className="space-y-2">
        <h2 className="text-4xl font-black text-brand-charcoal uppercase tracking-tighter">AI Assistant</h2>
        <p className="text-brand-muted font-medium text-sm uppercase tracking-widest">Master Strategy Execution Constitution v1.0 Engaged.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* LEFT COLUMN: CONFIGURATION */}
        <section className="w-full lg:w-1/3 space-y-8">
          <div className="athenix-card p-8 space-y-8 relative">
            <h3 className="text-xs font-black text-brand-gold uppercase tracking-[0.3em] border-l-4 border-brand-gold pl-4">System Parameters</h3>
            
            <div className="space-y-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-brand-muted uppercase tracking-widest block">1. Mode (Constitution v1.0)</label>
                <div className="grid grid-cols-1 gap-3">
                  {(Object.keys(MODE_CONFIG) as ExecutionMode[]).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setTradeMode(mode)}
                      className={`p-4 rounded-xl text-left border transition-all duration-200 group flex items-start gap-4 ${
                        tradeMode === mode ? 'bg-brand-charcoal text-white border-brand-charcoal shadow-lg' : 'bg-white border-brand-sage/20 text-brand-muted hover:border-brand-gold'
                      }`}
                    >
                      <div className={`mt-1 p-2 rounded-lg ${tradeMode === mode ? 'bg-white/10' : 'bg-brand-sage/10'}`}>
                        {MODE_CONFIG[mode].icon({selected: tradeMode === mode})}
                      </div>
                      <div>
                        <span className="text-xs font-black uppercase tracking-widest">{MODE_CONFIG[mode].label}</span>
                        <p className={`text-[9px] font-bold mt-1 uppercase tracking-wide ${tradeMode === mode ? 'text-white/60' : 'text-brand-muted/60'}`}>{MODE_CONFIG[mode].desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-brand-muted uppercase tracking-widest block">2. Select Market Sector</label>
                <div className="flex gap-2 p-1 bg-brand-sage/10 rounded-xl">
                  {['forex', 'stock'].map(type => (
                    <button key={type} onClick={() => setMarketType(type as any)} className={`flex-1 py-3 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${marketType === type ? 'bg-white text-brand-charcoal shadow-sm' : 'text-brand-muted hover:text-brand-gold'}`}>
                      {type === 'forex' ? 'Forex & Metals' : 'Stocks'}
                    </button>
                  ))}
                </div>
                <div className="relative" ref={dropdownRef}>
                   <input type="text" value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setIsDropdownOpen(true); }} onFocus={() => setIsDropdownOpen(true)} placeholder={marketType ? "Search Instrument..." : "Select Sector First"} disabled={!marketType} className="w-full pl-10 pr-4 py-4 bg-white border border-brand-sage/30 rounded-xl outline-none font-bold text-brand-charcoal text-xs placeholder:text-brand-muted/50 focus:border-brand-gold focus:ring-1 focus:ring-brand-gold disabled:opacity-50" />
                   <div className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted"><ICONS.Search /></div>
                   {isDropdownOpen && marketType && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-brand-sage rounded-xl shadow-2xl z-50 max-h-60 overflow-y-auto animate-fade-in">
                      {getFilteredInstruments().length > 0 ? getFilteredInstruments().map((item) => (
                        <button key={item.symbol} onClick={() => handleInstrumentSelect(item)} className="w-full text-left px-5 py-3 hover:bg-brand-sage/5 transition-colors flex justify-between items-center border-b border-brand-sage/5 last:border-0">
                          <span className="text-xs font-black text-brand-charcoal">{item.symbol}</span>
                          <span className="text-[10px] text-brand-muted font-bold uppercase tracking-wide group-hover:text-brand-gold">{item.name}</span>
                        </button>
                      )) : <div className="px-5 py-4 text-[10px] text-brand-muted font-medium text-center">No matches found</div>}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-brand-muted uppercase tracking-widest block">3. Execution Timeframe</label>
                {!tradeMode ? <div className="p-4 bg-brand-sage/5 border border-dashed border-brand-sage/30 rounded-xl text-center"><p className="text-[9px] text-brand-muted font-bold uppercase">Select Mode First</p></div> : (
                  <div className="grid grid-cols-4 gap-2 animate-fade-in">
                    {MODE_CONFIG[tradeMode].timeframes.map((tf) => (
                      <button key={tf} onClick={() => setTimeframe(tf)} className={`py-2 text-[10px] font-black tracking-widest rounded-lg border transition-all ${timeframe === tf ? 'border-brand-gold bg-brand-gold text-white shadow-lg' : 'border-brand-sage/30 bg-white text-brand-muted hover:border-brand-gold'}`}>{tf}</button>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between p-4 bg-white border border-brand-sage/20 rounded-xl shadow-sm">
                <div><p className="text-[10px] font-black text-brand-charcoal uppercase tracking-widest">Macro Data Context</p><p className="text-[9px] text-brand-muted font-bold uppercase">Hybrid Technical-Fundamental</p></div>
                <button onClick={() => setFundamentalToggle(!fundamentalToggle)} className={`w-12 h-6 rounded-full transition-all relative ${fundamentalToggle ? 'bg-brand-gold' : 'bg-brand-sage/30'}`}><div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm ${fundamentalToggle ? 'left-7' : 'left-1'}`}></div></button>
              </div>

              <button disabled={isAnalyzing || !tradeMode || !timeframe || !symbol} onClick={handleGenerate} className="btn-primary w-full py-5 font-black text-xs rounded-xl shadow-xl uppercase tracking-[0.2em] mt-4 disabled:opacity-50">
                {isAnalyzing ? 'Decoding Market Architecture...' : 'Initialize Analysis Cycle'}
              </button>
            </div>
          </div>
        </section>

        {/* RIGHT COLUMN: OUTPUT & HISTORY */}
        <section className="flex-1 space-y-8">
          
          {/* Active / Current Analysis */}
          <div className="athenix-card min-h-[600px] p-8 flex flex-col bg-white">
            <h3 className="text-xs font-black text-brand-muted uppercase tracking-[0.3em] mb-10">Probabilistic Terminal Output</h3>
            {analysis ? <AnalysisDetailView data={analysis} /> : isAnalyzing ? (
              <div className="flex-1 flex flex-col items-center justify-center space-y-6">
                <div className="w-16 h-16 border-4 border-brand-sage border-t-brand-gold rounded-full animate-spin"></div>
                <div className="text-center space-y-2">
                   <p className="text-[10px] font-black text-brand-muted uppercase tracking-[0.4em] animate-pulse">Running Structural Simulations...</p>
                   <p className="text-[9px] font-medium text-brand-sage uppercase tracking-widest">Weighting IRL/ERL Alignment</p>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-12 opacity-40">
                <div className="w-16 h-16 bg-brand-sage/10 rounded-2xl flex items-center justify-center text-brand-muted mb-6"><svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" /></svg></div>
                <p className="text-[10px] font-black text-brand-muted uppercase tracking-[0.3em] max-w-xs mx-auto">Initialize the deterministic model by selecting a sector and instrument.</p>
              </div>
            )}
          </div>
          
          {/* Analysis History Section */}
          <div className="space-y-6 animate-fade-in">
             <div className="flex items-center justify-between border-b border-brand-sage/20 pb-4">
                <h3 className="text-xs font-black text-brand-charcoal uppercase tracking-[0.3em]">Neural Analysis Ledger</h3>
                <span className="text-[9px] font-bold text-brand-muted uppercase tracking-widest">{history.length} Records</span>
             </div>

             {historyLoading ? (
                <div className="p-8 text-center"><div className="inline-block w-6 h-6 border-2 border-brand-sage border-t-brand-gold rounded-full animate-spin"></div></div>
             ) : history.length === 0 ? (
                <div className="p-8 border border-dashed border-brand-sage/30 rounded-xl text-center">
                   <p className="text-[10px] text-brand-muted font-black uppercase tracking-widest">No previous analysis data found.</p>
                </div>
             ) : (
                <div className="space-y-4">
                   {history.map((item) => (
                      <div key={item.id} className="bg-white border border-brand-sage/20 rounded-xl overflow-hidden hover:border-brand-gold/30 transition-all">
                         <div 
                           onClick={() => setExpandedHistoryId(expandedHistoryId === item.id ? null : item.id!)}
                           className="p-6 cursor-pointer flex items-center justify-between hover:bg-brand-sage/5 transition-colors"
                         >
                            <div className="flex items-center gap-4">
                               <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-[10px] font-black text-white uppercase shadow-sm ${
                                  item.signal?.direction === 'buy' ? 'bg-brand-success' : 'bg-brand-error'
                               }`}>
                                  {item.signal?.direction || '-'}
                               </div>
                               <div>
                                  <h4 className="text-sm font-black text-brand-charcoal uppercase tracking-tight">{item.instrument}</h4>
                                  <p className="text-[9px] text-brand-muted uppercase font-bold tracking-widest">{new Date(item.timestamp || '').toLocaleDateString()}</p>
                               </div>
                            </div>
                            
                            <div className="hidden md:flex gap-8 text-right">
                               <div>
                                  <p className="text-[8px] text-brand-muted uppercase font-black tracking-widest mb-1">Entry</p>
                                  <p className="text-xs font-bold text-brand-charcoal font-mono">{fmt(item.signal?.entry_price)}</p>
                               </div>
                               <div>
                                  <p className="text-[8px] text-brand-muted uppercase font-black tracking-widest mb-1">Stop</p>
                                  <p className="text-xs font-bold text-brand-error font-mono">{fmt(item.signal?.stop_loss)}</p>
                               </div>
                               <div>
                                  <p className="text-[8px] text-brand-muted uppercase font-black tracking-widest mb-1">TP1</p>
                                  <p className="text-xs font-bold text-brand-success font-mono">{fmt(item.signal?.take_profits[0]?.price)}</p>
                               </div>
                            </div>

                            <svg 
                               xmlns="http://www.w3.org/2000/svg" 
                               className={`w-4 h-4 text-brand-muted transition-transform ${expandedHistoryId === item.id ? 'rotate-180' : ''}`} 
                               fill="none" viewBox="0 0 24 24" stroke="currentColor"
                            >
                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                         </div>
                         
                         {expandedHistoryId === item.id && (
                            <div className="border-t border-brand-sage/10 bg-brand-sage/5 p-6">
                               <AnalysisDetailView data={item} isHistory={true} />
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

  function getFilteredInstruments() {
    const list = marketType === 'forex' ? FOREX_INSTRUMENTS : marketType === 'stock' ? STOCK_INSTRUMENTS : [];
    if (!searchQuery) return list;
    const lowerQ = searchQuery.toLowerCase();
    return list.filter(i => i.symbol.toLowerCase().includes(lowerQ) || i.name.toLowerCase().includes(lowerQ));
  }
};

export default AIAssistant;
