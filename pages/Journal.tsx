
import React from 'react';

const Journal: React.FC = () => {
  return (
    <div className="p-6 md:p-10 space-y-10 animate-fade-in max-w-5xl mx-auto">
      {/* Page Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <h2 className="text-4xl font-black text-brand-charcoal uppercase tracking-tighter">Trade Journal</h2>
          <p className="text-brand-muted font-medium text-sm uppercase tracking-widest">
            Audit your performance and track institutional market behavior.
          </p>
        </div>
        
        {/* Add Entry Button */}
        <button className="btn-primary px-10 py-5 font-black text-[10px] uppercase tracking-[0.2em] rounded-xl shadow-xl hover:scale-105 transition-transform active:scale-95">
          Add Entry
        </button>
      </div>

      {/* Journal Entries List */}
      <section className="space-y-6">
        <h3 className="text-[10px] font-black text-brand-muted uppercase tracking-[0.3em] mb-4">Historical Logs</h3>
        
        <div className="space-y-4">
          {[
            { title: 'Market Structure Shift (XAU)', date: 'Oct 24, 2023', note: 'Detected liquidity sweep at H4 supply zone. Entering on re-test of imbalance fill.' },
            { title: 'Institutional Flow Observation', date: 'Oct 22, 2023', note: 'Large volume detected at psychological level. Correlating with DXY weakness.' },
            { title: 'Neural Setup Review', date: 'Oct 20, 2023', note: 'Audit of AI Assistant output. Risk/Reward ratio maintained at 1:3.' },
            { title: 'SMC Setup Log #42', date: 'Oct 18, 2023', note: 'Price action showing signs of distribution. Monitoring for break of market structure.' },
          ].map((entry, idx) => (
            <div key={idx} className="athenix-card p-8 group cursor-pointer hover:border-brand-gold transition-all relative overflow-hidden bg-white">
              <div className="absolute top-0 right-0 w-24 h-24 bg-brand-gold/[0.03] -mr-12 -mt-12 rounded-full group-hover:bg-brand-gold/5 transition-all"></div>
              
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="space-y-3 flex-1">
                  <div className="flex items-center gap-3">
                    <span className="w-2 h-2 bg-brand-gold rounded-full"></span>
                    <h4 className="text-lg font-black text-brand-charcoal uppercase tracking-tight group-hover:text-brand-gold transition-colors">
                      {entry.title}
                    </h4>
                  </div>
                  <p className="text-xs text-brand-muted font-medium leading-relaxed pr-0 md:pr-12">
                    {entry.note}
                  </p>
                </div>

                <div className="text-left md:text-right shrink-0">
                  <p className="text-[9px] text-brand-muted uppercase font-black tracking-widest mb-1">Date Logged</p>
                  <p className="text-[11px] font-black text-brand-charcoal uppercase tracking-widest">
                    {entry.date}
                  </p>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-brand-sage/10 flex items-center justify-between">
                <div className="flex gap-2">
                  <span className="px-2 py-1 bg-brand-sage/10 rounded text-[8px] font-black text-brand-muted uppercase tracking-widest">Technical</span>
                  <span className="px-2 py-1 bg-brand-gold/5 rounded text-[8px] font-black text-brand-gold uppercase tracking-widest">SMC</span>
                </div>
                <button className="text-[9px] font-black text-brand-muted uppercase tracking-widest flex items-center gap-2 group-hover:text-brand-gold transition-all">
                  Open Analysis
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Empty State / Bottom Indicator */}
      <div className="text-center pt-8 opacity-40">
        <p className="text-[9px] font-black text-brand-muted uppercase tracking-[0.5em]">Terminal Log End</p>
      </div>
    </div>
  );
};

export default Journal;
