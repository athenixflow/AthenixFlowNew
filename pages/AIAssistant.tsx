
import React, { useState } from 'react';

const TIMEFRAMES = [
  '1m', '3m', '5m', '10m', '15m', '30m', 
  '1h', '2h', '4h', '8h', 
  '1D', '1W', '1M', '1Y'
];

const AIAssistant: React.FC = () => {
  const [fundamentalToggle, setFundamentalToggle] = useState(false);

  return (
    <div className="p-6 md:p-10 space-y-10 animate-fade-in max-w-7xl mx-auto">
      {/* Page Title Area */}
      <div className="space-y-2">
        <h2 className="text-4xl font-black text-brand-charcoal uppercase tracking-tighter">AI Assistant</h2>
        <p className="text-brand-muted font-medium text-sm uppercase tracking-widest">Generate high-precision neural market setups.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Analysis Input Section */}
        <section className="w-full lg:w-1/3">
          <div className="athenix-card p-8 space-y-8">
            <h3 className="text-xs font-black text-brand-gold uppercase tracking-[0.3em] border-l-4 border-brand-gold pl-4">Analysis Configuration</h3>
            
            <div className="space-y-6">
              {/* Market Selector */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-brand-muted uppercase tracking-widest block">Market</label>
                <div className="relative">
                  <select className="w-full px-5 py-4 bg-brand-sage/5 border border-brand-sage rounded-xl outline-none font-bold text-brand-charcoal hover:border-brand-gold transition-colors appearance-none cursor-pointer">
                    <option value="" disabled selected>Select currency pair or stock</option>
                    <option>XAU/USD (Gold)</option>
                    <option>EUR/USD</option>
                    <option>GBP/USD</option>
                    <option>NAS100</option>
                    <option>US30</option>
                    <option>BTC/USD</option>
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-brand-muted">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Timeframe Selector */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-brand-muted uppercase tracking-widest block">Timeframe</label>
                <div className="grid grid-cols-4 gap-2">
                  {TIMEFRAMES.map((tf) => (
                    <button 
                      key={tf}
                      className="py-2 text-[10px] font-black tracking-widest rounded-lg border border-brand-sage bg-white text-brand-muted hover:border-brand-gold hover:text-brand-gold transition-all"
                    >
                      {tf}
                    </button>
                  ))}
                </div>
              </div>

              {/* Fundamental Toggle */}
              <div className="pt-4">
                <div className="flex items-center justify-between p-4 bg-brand-sage/5 border border-dashed border-brand-sage rounded-xl">
                  <div>
                    <p className="text-[10px] font-black text-brand-charcoal uppercase tracking-widest">Include Fundamental Analysis</p>
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

              {/* Generate Button */}
              <button className="btn-primary w-full py-5 font-black text-xs rounded-xl shadow-xl uppercase tracking-[0.2em] mt-4">
                Generate Analysis
              </button>
            </div>
          </div>
        </section>

        {/* Analysis Output Section */}
        <section className="flex-1">
          <div className="athenix-card min-h-[500px] p-8 flex flex-col">
            <h3 className="text-xs font-black text-brand-muted uppercase tracking-[0.3em] mb-10">Neural Analysis Output</h3>
            
            {/* Trade Setup Card (UI Placeholder) */}
            <div className="border border-brand-sage rounded-2xl p-10 space-y-12 relative overflow-hidden bg-white">
              <div className="absolute top-0 right-0 w-32 h-32 bg-brand-gold/5 -mr-16 -mt-16 rounded-full"></div>
              
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-2xl font-black text-brand-charcoal tracking-tighter mb-1 uppercase">Trade Setup Profile</h4>
                  <p className="text-[10px] text-brand-muted font-black uppercase tracking-widest">Pending Generation...</p>
                </div>
                <div className="w-12 h-1 bg-brand-gold/20"></div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <p className="text-[10px] text-brand-gold uppercase font-black tracking-widest">Entry Level</p>
                  <div className="h-12 w-full bg-brand-sage/5 border border-brand-sage/30 rounded-xl flex items-center px-4 italic text-brand-muted text-xs">Waiting for execution...</div>
                </div>
                <div className="space-y-2">
                  <p className="text-[10px] text-brand-gold uppercase font-black tracking-widest">Stop Loss</p>
                  <div className="h-12 w-full bg-brand-sage/5 border border-brand-sage/30 rounded-xl flex items-center px-4 italic text-brand-muted text-xs">Waiting for execution...</div>
                </div>
                <div className="space-y-2">
                  <p className="text-[10px] text-brand-gold uppercase font-black tracking-widest">Take Profit</p>
                  <div className="h-12 w-full bg-brand-sage/5 border border-brand-sage/30 rounded-xl flex items-center px-4 italic text-brand-muted text-xs">Waiting for execution...</div>
                </div>
                <div className="space-y-2">
                  <p className="text-[10px] text-brand-gold uppercase font-black tracking-widest">Risk / Reward Ratio</p>
                  <div className="h-12 w-full bg-brand-sage/5 border border-brand-sage/30 rounded-xl flex items-center px-4 italic text-brand-muted text-xs">Waiting for execution...</div>
                </div>
              </div>

              <div className="pt-8 border-t border-brand-sage/20">
                <p className="text-[10px] text-brand-muted uppercase font-black tracking-[0.2em] mb-4">Neural Reasoning Matrix</p>
                <div className="space-y-3">
                  <div className="h-4 w-3/4 bg-brand-sage/10 rounded"></div>
                  <div className="h-4 w-full bg-brand-sage/10 rounded"></div>
                  <div className="h-4 w-5/6 bg-brand-sage/10 rounded"></div>
                </div>
              </div>
            </div>

            {/* Empty State Prompt */}
            <div className="flex-1 flex flex-col items-center justify-center text-center p-12 mt-10 opacity-40">
              <div className="w-16 h-16 bg-brand-sage/10 rounded-2xl flex items-center justify-center text-brand-muted mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <p className="text-[10px] font-black text-brand-muted uppercase tracking-[0.3em] max-w-xs mx-auto">
                Configure parameters and initialize neural analysis to populate terminal output.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default AIAssistant;
