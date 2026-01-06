
import React, { useState } from 'react';
import { UserProfile, TradeAnalysis } from '../types';
import { analyzeMarket } from '../services/backend';

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
  const [symbol, setSymbol] = useState('');
  const [timeframe, setTimeframe] = useState('1h');
  const [fundamentalToggle, setFundamentalToggle] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<TradeAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!user) return;
    if (!symbol) {
      setError('Please select a market pair.');
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setAnalysis(null);

    const response = await analyzeMarket(user.uid, symbol, timeframe, fundamentalToggle);

    if (response.status === 'success') {
      setAnalysis(response.data);
    } else {
      setError(response.message);
    }
    setIsAnalyzing(false);
  };

  return (
    <div className="p-6 md:p-10 space-y-10 animate-fade-in max-w-7xl mx-auto">
      <div className="space-y-2">
        <h2 className="text-4xl font-black text-brand-charcoal uppercase tracking-tighter">AI Assistant</h2>
        <p className="text-brand-muted font-medium text-sm uppercase tracking-widest">Generate high-precision neural market setups.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <section className="w-full lg:w-1/3">
          <div className="athenix-card p-8 space-y-8">
            <h3 className="text-xs font-black text-brand-gold uppercase tracking-[0.3em] border-l-4 border-brand-gold pl-4">Analysis Configuration</h3>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-brand-muted uppercase tracking-widest block">Market</label>
                <div className="relative">
                  <select 
                    value={symbol}
                    onChange={(e) => setSymbol(e.target.value)}
                    className="w-full px-5 py-4 bg-brand-sage/5 border border-brand-sage rounded-xl outline-none font-bold text-brand-charcoal hover:border-brand-gold transition-colors appearance-none cursor-pointer"
                  >
                    <option value="" disabled>Select pair or stock</option>
                    <option value="XAUUSD">XAU/USD (Gold)</option>
                    <option value="EURUSD">EUR/USD</option>
                    <option value="GBPUSD">GBP/USD</option>
                    <option value="NAS100">NAS100</option>
                    <option value="US30">US30</option>
                    <option value="BTCUSD">BTC/USD</option>
                  </select>
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
                          ? 'border-brand-gold bg-brand-gold text-white' 
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
                className="btn-primary w-full py-5 font-black text-xs rounded-xl shadow-xl uppercase tracking-[0.2em] mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isAnalyzing ? 'Processing...' : 'Generate Analysis'}
              </button>
            </div>
          </div>
        </section>

        <section className="flex-1">
          <div className="athenix-card min-h-[500px] p-8 flex flex-col">
            <h3 className="text-xs font-black text-brand-muted uppercase tracking-[0.3em] mb-10">Neural Analysis Output</h3>
            
            {analysis ? (
              <div className="border border-brand-sage rounded-2xl p-10 space-y-12 relative overflow-hidden bg-white animate-slide-up">
                <div className="absolute top-0 right-0 w-32 h-32 bg-brand-gold/5 -mr-16 -mt-16 rounded-full"></div>
                
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-2xl font-black text-brand-charcoal tracking-tighter mb-1 uppercase">{analysis.pair} Setup</h4>
                    <p className="text-[10px] text-brand-success font-black uppercase tracking-widest">{analysis.direction} • {analysis.timeframe}</p>
                  </div>
                  <div className="px-3 py-1 bg-brand-gold/10 text-brand-gold text-[9px] font-black rounded">CONFIRMED</div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <p className="text-[10px] text-brand-gold uppercase font-black tracking-widest">Entry Level</p>
                    <div className="h-12 w-full bg-brand-sage/5 border border-brand-sage/30 rounded-xl flex items-center px-4 font-black text-brand-charcoal text-xs">{analysis.entry}</div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] text-brand-gold uppercase font-black tracking-widest">Stop Loss</p>
                    <div className="h-12 w-full bg-brand-sage/5 border border-brand-sage/30 rounded-xl flex items-center px-4 font-black text-brand-error text-xs">{analysis.stopLoss}</div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] text-brand-gold uppercase font-black tracking-widest">Take Profit</p>
                    <div className="h-12 w-full bg-brand-sage/5 border border-brand-sage/30 rounded-xl flex items-center px-4 font-black text-brand-success text-xs">{analysis.takeProfit}</div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] text-brand-gold uppercase font-black tracking-widest">Risk / Reward Ratio</p>
                    <div className="h-12 w-full bg-brand-sage/5 border border-brand-sage/30 rounded-xl flex items-center px-4 font-black text-brand-charcoal text-xs">{analysis.riskReward}</div>
                  </div>
                </div>

                <div className="pt-8 border-t border-brand-sage/20">
                  <p className="text-[10px] text-brand-muted uppercase font-black tracking-[0.2em] mb-4">Neural Reasoning Matrix</p>
                  <p className="text-xs text-brand-charcoal leading-loose font-medium opacity-90">{analysis.reasoning}</p>
                </div>
              </div>
            ) : isAnalyzing ? (
              <div className="flex-1 flex flex-col items-center justify-center space-y-6">
                <div className="w-16 h-16 border-4 border-brand-sage border-t-brand-gold rounded-full animate-spin"></div>
                <p className="text-[10px] font-black text-brand-muted uppercase tracking-[0.4em]">Processing Neural Node...</p>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-12 opacity-40">
                <div className="w-16 h-16 bg-brand-sage/10 rounded-2xl flex items-center justify-center text-brand-muted mb-6">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <p className="text-[10px] font-black text-brand-muted uppercase tracking-[0.3em] max-w-xs mx-auto">
                  Configure parameters and initialize neural analysis to populate terminal output.
                </p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default AIAssistant;
