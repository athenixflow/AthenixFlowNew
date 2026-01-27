import React, { useEffect, useState } from 'react';
import { getActiveSignals } from '../services/firestore';
import { TradingSignal, UserProfile } from '../types';

interface SignalsProps {
  user: UserProfile | null;
}

const Signals: React.FC<SignalsProps> = ({ user }) => {
  const [signals, setSignals] = useState<TradingSignal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSignals = async () => {
      setLoading(true);
      const data = await getActiveSignals();
      setSignals(data);
      setLoading(false);
    };
    fetchSignals();
  }, []);

  const getStatusBadge = (status: string) => {
    const s = status.toLowerCase();
    if (s === 'pending') return <div className="absolute top-0 right-0 px-4 py-1 text-[9px] font-black uppercase tracking-widest bg-brand-gold text-white">Pending Entry</div>;
    if (s.includes('completed_tp') || s.includes('win')) return <div className="absolute top-0 right-0 px-4 py-1 text-[9px] font-black uppercase tracking-widest bg-brand-success text-white">Target Hit</div>;
    if (s.includes('completed_sl') || s.includes('loss')) return <div className="absolute top-0 right-0 px-4 py-1 text-[9px] font-black uppercase tracking-widest bg-brand-error text-white">Stop Loss</div>;
    if (s.includes('cancelled')) return <div className="absolute top-0 right-0 px-4 py-1 text-[9px] font-black uppercase tracking-widest bg-brand-muted text-white">Cancelled</div>;
    return null; // Active doesn't need a top ribbon, uses pulse dot
  };

  return (
    <div className="p-6 md:p-10 space-y-10 animate-fade-in max-w-5xl mx-auto pb-24">
      <section className="space-y-2">
        <h2 className="text-4xl font-black text-brand-charcoal uppercase tracking-tighter">Signals</h2>
        <p className="text-brand-muted font-medium text-sm uppercase tracking-widest">
          High-conviction trading architectures curated by the Athenix network.
        </p>
      </section>

      <section className="space-y-6">
        <h3 className="text-[10px] font-black text-brand-muted uppercase tracking-[0.3em] mb-4">Market Execution Feed</h3>
        
        {loading ? (
          <div className="p-10 text-center text-brand-muted font-black uppercase text-[10px] tracking-widest flex flex-col items-center gap-4">
             <div className="w-8 h-8 border-4 border-brand-sage border-t-brand-gold rounded-full animate-spin"></div>
             Accessing Node Network...
          </div>
        ) : signals.length === 0 ? (
          <div className="athenix-card p-12 bg-brand-sage/5 border-dashed flex flex-col items-center justify-center text-center">
            <p className="text-[10px] font-black text-brand-muted uppercase tracking-[0.3em] max-w-xs">
              No active signals found in the network feed.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {signals.map((signal) => (
              <div key={signal.id} className={`athenix-card p-8 flex flex-col md:flex-row md:items-center justify-between gap-8 group relative overflow-hidden ${
                 signal.status.includes('cancelled') || signal.status.includes('expired') ? 'opacity-60 grayscale' : ''
              }`}>
                {/* Status Ribbon */}
                {getStatusBadge(signal.status)}

                <div className="flex items-center gap-6">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-white text-xs tracking-widest shadow-lg ${
                    signal.signalType.includes('Buy') ? 'bg-brand-success shadow-brand-success/20' : 'bg-brand-error shadow-brand-error/20'
                  }`}>
                    {signal.signalType.includes('Buy') ? 'BUY' : 'SELL'}
                  </div>
                  <div>
                    <h4 className="text-2xl font-black text-brand-charcoal tracking-tighter uppercase">{signal.instrument}</h4>
                    <p className="text-[9px] text-brand-muted font-black uppercase tracking-widest flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full ${signal.status === 'active' || signal.status === 'triggered' ? 'bg-brand-gold animate-pulse' : 'bg-brand-muted'}`}></span>
                      {signal.timeframe} • {signal.signalType}
                    </p>
                  </div>
                </div>

                <div className="flex-1 grid grid-cols-3 gap-4 border-l border-brand-sage/20 pl-0 md:pl-8">
                  <div className="space-y-1">
                    <p className="text-[9px] text-brand-gold uppercase font-black tracking-widest">Entry</p>
                    <p className="font-black text-brand-charcoal text-sm font-mono">{signal.entry}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] text-brand-muted uppercase font-black tracking-widest">Stop Loss</p>
                    <p className="font-black text-brand-error text-sm font-mono">{signal.stopLoss}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] text-brand-muted uppercase font-black tracking-widest">Take Profit</p>
                    <p className="font-black text-brand-success text-sm font-mono">{signal.takeProfit}</p>
                  </div>
                </div>

                <div className="flex flex-col items-end justify-between border-t border-brand-sage/10 md:border-t-0 pt-4 md:pt-0 gap-2">
                  <div className="text-right">
                     <p className="text-[9px] text-brand-muted uppercase font-black tracking-widest mb-1">R:R Ratio</p>
                     <p className="text-xl font-black text-brand-charcoal">1:{signal.rrRatio}</p>
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    <span className="text-[9px] font-black text-brand-muted uppercase tracking-widest">{new Date(signal.timestamp).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Outcome Comment display if completed */}
                {signal.outcomeComment && (
                    <div className="w-full mt-4 pt-4 border-t border-brand-sage/10">
                        <p className="text-[9px] font-black text-brand-muted uppercase tracking-widest mb-1">Analyst Notes</p>
                        <p className="text-xs text-brand-charcoal italic">"{signal.outcomeComment}"</p>
                    </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Signals;