import React, { useState, useEffect } from 'react';
import { TradingSignal } from '../types';
import { subscribeToSignals } from '../services/firestore';
import { ICONS } from '../constants';
import ErrorBoundary from '../components/ErrorBoundary';
import { motion, AnimatePresence } from 'framer-motion';

const LiveSignals: React.FC = () => {
  const [signals, setSignals] = useState<TradingSignal[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ACTIVE' | 'HISTORY'>('ACTIVE');

  useEffect(() => {
    const unsubscribe = subscribeToSignals((data) => {
      setSignals(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const copySetup = (signal: TradingSignal) => {
    const text = `Athenix Signal: ${signal.instrument} ${signal.direction}\nOrder: ${signal.orderType}\nEntry: ${signal.entry}\nSL: ${signal.stopLoss}\nTP: ${signal.takeProfit}\nRR: ${signal.riskReward}`;
    navigator.clipboard.writeText(text);
    alert("Signal setup copied to clipboard!");
  };

  const activeSignals = signals.filter(s => !['Take Profit', 'Stop Loss', 'Break Even', 'Closed'].includes(s.status));
  const historySignals = signals.filter(s => ['Take Profit', 'Stop Loss', 'Break Even', 'Closed'].includes(s.status));

  const displaySignals = filter === 'ACTIVE' ? activeSignals : historySignals;

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-gold"></div>
    </div>
  );

  return (
    <ErrorBoundary>
      <div className="space-y-8 animate-fade-in">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-black text-brand-charcoal uppercase tracking-tighter">Trading Signals</h2>
            <p className="text-sm text-brand-muted font-medium">Real-time high-probability setups from verified publishers.</p>
          </div>
          
          <div className="flex bg-brand-sage/10 p-1 rounded-xl">
            {['ACTIVE', 'HISTORY'].map(tab => (
              <button
                key={tab}
                onClick={() => setFilter(tab as any)}
                className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                  filter === tab ? 'bg-white text-brand-charcoal shadow-sm' : 'text-brand-muted hover:text-brand-gold'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {displaySignals.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="col-span-full text-center py-20 bg-white rounded-2xl border border-dashed border-brand-sage/30"
              >
                <p className="text-brand-muted text-sm font-medium">No {filter.toLowerCase()} signals available.</p>
              </motion.div>
            ) : (
              displaySignals.map(signal => (
                <motion.div
                  key={signal.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="bg-white rounded-2xl border border-brand-sage/20 overflow-hidden shadow-sm hover:shadow-md transition-all group"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg text-white shadow-lg ${
                          signal.direction === 'Buy' ? 'bg-brand-success' : 'bg-brand-error'
                        }`}>
                          {signal.direction === 'Buy' ? 'B' : 'S'}
                        </div>
                        <div>
                          <h4 className="text-lg font-black text-brand-charcoal uppercase tracking-tighter">{signal.instrument}</h4>
                          <p className="text-[10px] text-brand-muted font-bold uppercase tracking-widest">
                            {signal.orderType} • {signal.timeframe}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`px-2 py-1 rounded text-[8px] font-black uppercase tracking-widest ${
                          signal.status === 'Active' ? 'bg-brand-success/10 text-brand-success' : 
                          signal.status === 'Pending' ? 'bg-brand-gold/10 text-brand-gold' :
                          'bg-brand-sage/20 text-brand-muted'
                        }`}>
                          {signal.status}
                        </div>
                        <p className="text-[8px] text-brand-muted mt-1 uppercase font-bold">
                          {signal.timestamp?.toDate ? signal.timestamp.toDate().toLocaleTimeString() : 'Just now'}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3 mb-6">
                      <div className="p-3 bg-brand-sage/5 rounded-xl border border-brand-sage/10">
                        <p className="text-[8px] font-black text-brand-muted uppercase tracking-widest mb-1">Entry</p>
                        <p className="text-xs font-bold text-brand-charcoal">{signal.entry}</p>
                      </div>
                      <div className="p-3 bg-brand-sage/5 rounded-xl border border-brand-sage/10">
                        <p className="text-[8px] font-black text-brand-muted uppercase tracking-widest mb-1">Stop Loss</p>
                        <p className="text-xs font-bold text-brand-error">{signal.stopLoss}</p>
                      </div>
                      <div className="p-3 bg-brand-sage/5 rounded-xl border border-brand-sage/10">
                        <p className="text-[8px] font-black text-brand-muted uppercase tracking-widest mb-1">Target</p>
                        <p className="text-xs font-bold text-brand-success">{signal.takeProfit}</p>
                      </div>
                    </div>

                    {signal.notes && (
                      <div className="mb-6 p-3 bg-brand-gold/5 rounded-xl border border-brand-gold/10">
                        <p className="text-[9px] font-medium text-brand-charcoal/80 italic line-clamp-2">"{signal.notes}"</p>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-4 border-t border-brand-sage/10">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-brand-sage/10 rounded-full flex items-center justify-center">
                          <ICONS.User className="w-3 h-3 text-brand-muted" />
                        </div>
                        <span className="text-[9px] font-black text-brand-muted uppercase tracking-widest">{signal.postedByName || 'Athenix'}</span>
                      </div>
                      <button 
                        onClick={() => copySetup(signal)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-brand-charcoal text-white rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-brand-gold transition-all"
                      >
                        <ICONS.Check className="w-3 h-3" />
                        Copy Setup
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default LiveSignals;
