
import React from 'react';

const Signals: React.FC = () => {
  return (
    <div className="p-6 md:p-10 space-y-10 animate-fade-in max-w-5xl mx-auto">
      {/* Page Header Section */}
      <section className="space-y-2">
        <h2 className="text-4xl font-black text-brand-charcoal uppercase tracking-tighter">Signals</h2>
        <p className="text-brand-muted font-medium text-sm uppercase tracking-widest">
          High-conviction trading architectures curated by the Athenix network.
        </p>
      </section>

      {/* Signals Feed Section */}
      <section className="space-y-6">
        <h3 className="text-[10px] font-black text-brand-muted uppercase tracking-[0.3em] mb-4">Market Execution Feed</h3>
        
        <div className="space-y-4">
          {[
            { pair: 'XAU/USD', direction: 'BUY', entry: '2,045.50', sl: '2,038.00', tp: '2,065.00', author: 'Terminal Admin' },
            { pair: 'EUR/USD', direction: 'SELL', entry: '1.08540', sl: '1.08900', tp: '1.07800', author: 'Alpha Node' },
            { pair: 'NAS100', direction: 'BUY', entry: '18,120.00', sl: '18,050.00', tp: '18,350.00', author: 'Terminal Admin' },
          ].map((signal, idx) => (
            <div key={idx} className="athenix-card p-8 flex flex-col md:flex-row md:items-center justify-between gap-8 group">
              {/* Market & Direction */}
              <div className="flex items-center gap-6">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-white text-xs tracking-widest shadow-lg ${
                  signal.direction === 'BUY' ? 'bg-brand-success shadow-brand-success/20' : 'bg-brand-error shadow-brand-error/20'
                }`}>
                  {signal.direction}
                </div>
                <div>
                  <h4 className="text-2xl font-black text-brand-charcoal tracking-tighter uppercase">{signal.pair}</h4>
                  <p className="text-[9px] text-brand-muted font-black uppercase tracking-widest flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-brand-gold rounded-full animate-pulse"></span>
                    Verified Setup
                  </p>
                </div>
              </div>

              {/* Entry / SL / TP Grid */}
              <div className="flex-1 grid grid-cols-3 gap-4 border-l border-brand-sage/20 pl-0 md:pl-8">
                <div className="space-y-1">
                  <p className="text-[9px] text-brand-gold uppercase font-black tracking-widest">Entry</p>
                  <p className="font-black text-brand-charcoal text-sm">{signal.entry}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[9px] text-brand-muted uppercase font-black tracking-widest">Stop Loss</p>
                  <p className="font-black text-brand-error text-sm">{signal.sl}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[9px] text-brand-muted uppercase font-black tracking-widest">Take Profit</p>
                  <p className="font-black text-brand-success text-sm">{signal.tp}</p>
                </div>
              </div>

              {/* Author & Timestamp */}
              <div className="text-right border-t border-brand-sage/10 md:border-t-0 pt-4 md:pt-0">
                <p className="text-[9px] text-brand-muted uppercase font-black tracking-widest mb-1">Author</p>
                <div className="flex items-center justify-end gap-2">
                  <span className="text-[10px] font-black text-brand-charcoal uppercase tracking-widest">{signal.author}</span>
                  <div className="w-6 h-6 rounded-full bg-brand-gold/10 flex items-center justify-center text-[8px] font-black text-brand-gold border border-brand-gold/20">A</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Observation Mode Placeholder */}
      <div className="athenix-card p-12 bg-brand-sage/5 border-dashed flex flex-col items-center justify-center text-center opacity-60">
        <div className="w-12 h-1 bg-brand-gold mb-6 opacity-30"></div>
        <p className="text-[10px] font-black text-brand-muted uppercase tracking-[0.3em] max-w-xs">
          Market Scanning in Progress. Neural signals will populate the terminal feed upon verification.
        </p>
      </div>
    </div>
  );
};

export default Signals;
