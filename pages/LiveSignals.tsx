import React, { useState, useEffect } from 'react';
import { TradeAnalysis } from '../types';
import { getPublishedSignals } from '../services/firestore';
import { ICONS } from '../constants';

const LiveSignals: React.FC = () => {
  const [signals, setSignals] = useState<TradeAnalysis[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSignals();
  }, []);

  const loadSignals = async () => {
    setLoading(true);
    setSignals(await getPublishedSignals());
    setLoading(false);
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-gold"></div>
    </div>
  );

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-brand-charcoal uppercase tracking-tighter">Live Signals</h2>
          <p className="text-sm text-brand-muted font-medium">Verified high-probability setups from the Athenix Engine.</p>
        </div>
        <button onClick={loadSignals} className="p-2 hover:bg-brand-sage/10 rounded-full transition-colors">
           <ICONS.Chart className="w-5 h-5 text-brand-gold" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {signals.length === 0 ? (
          <div className="col-span-full text-center py-20 bg-white rounded-2xl border border-dashed border-brand-sage/30">
            <p className="text-brand-muted text-sm font-medium">No live signals available at the moment.</p>
          </div>
        ) : (
          signals.map(signal => (
            <div key={signal.id} className="bg-white rounded-2xl border border-brand-sage/20 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-brand-charcoal text-white rounded-xl flex items-center justify-center font-black text-lg">
                      {signal.instrument.substring(0, 2)}
                    </div>
                    <div>
                      <h4 className="text-lg font-black text-brand-charcoal uppercase tracking-tighter">{signal.instrument}</h4>
                      <p className="text-[10px] text-brand-muted font-bold uppercase tracking-widest">
                        {signal.execution_mode.replace('_', ' ')} • {signal.timeframe}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`px-3 py-1 rounded text-[10px] font-black uppercase tracking-widest ${
                      signal.signal?.direction === 'buy' ? 'bg-brand-success/20 text-brand-success' : 'bg-brand-error/20 text-brand-error'
                    }`}>
                      {signal.signal?.direction}
                    </div>
                    <p className="text-[8px] text-brand-muted mt-1 uppercase font-bold">{new Date(signal.timestamp).toLocaleTimeString()}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="p-3 bg-brand-sage/5 rounded-xl">
                    <p className="text-[8px] font-black text-brand-muted uppercase tracking-widest mb-1">Entry</p>
                    <p className="text-xs font-bold text-brand-charcoal">{signal.signal?.entry_price}</p>
                  </div>
                  <div className="p-3 bg-brand-sage/5 rounded-xl">
                    <p className="text-[8px] font-black text-brand-muted uppercase tracking-widest mb-1">Stop Loss</p>
                    <p className="text-xs font-bold text-brand-error">{signal.signal?.stop_loss}</p>
                  </div>
                  <div className="p-3 bg-brand-sage/5 rounded-xl">
                    <p className="text-[8px] font-black text-brand-muted uppercase tracking-widest mb-1">Target</p>
                    <p className="text-xs font-bold text-brand-success">{signal.signal?.take_profits[0]?.price}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-brand-sage/10">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-brand-success rounded-full animate-pulse"></div>
                    <span className="text-[10px] font-black text-brand-charcoal uppercase tracking-widest">Signal Active</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] font-black text-brand-gold uppercase tracking-widest">Quality: {signal.quality_score}%</span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default LiveSignals;
