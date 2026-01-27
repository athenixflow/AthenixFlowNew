
import React, { useState, useEffect } from 'react';
import { getJournalEntries, addJournalEntry } from '../services/firestore';
import { JournalEntry, UserProfile } from '../types';
import { auth } from '../firebase';

interface JournalProps {
  user: UserProfile | null;
}

const Journal: React.FC<JournalProps> = ({ user }) => {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    title: '',
    market: '',
    tradeMode: 'day_trade',
    direction: 'BUY',
    entryPrice: '',
    stopLoss: '',
    takeProfit: '',
    outcome: 'open',
    notes: ''
  });
  
  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchEntries = async () => {
    const currentUser = auth.currentUser || user;
    if (!currentUser) return;
    
    setLoading(true);
    try {
      const data = await getJournalEntries(currentUser.uid);
      setEntries(data);
    } catch (err) {
      console.error("Failed to load entries", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchEntries();
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!auth.currentUser) {
      setErrorMsg("Security Protocol: Auth session not resolved.");
      return;
    }

    if (!formData.title.trim() || !formData.notes.trim() || !formData.market.trim()) {
      setErrorMsg("Title, Market, and Notes are required.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const uid = auth.currentUser.uid;

    try {
      const result = await addJournalEntry(uid, {
        title: formData.title,
        market: formData.market,
        tradeMode: formData.tradeMode as 'scalp' | 'day_trade' | 'swing_trade',
        notes: formData.notes,
        direction: formData.direction as 'BUY' | 'SELL',
        entryPrice: formData.entryPrice,
        stopLoss: formData.stopLoss,
        takeProfit: formData.takeProfit,
        outcome: formData.outcome as 'win' | 'loss' | 'partial' | 'open'
      });

      if (result.success) {
        setFormData({
            title: '', market: '', tradeMode: 'day_trade', direction: 'BUY', entryPrice: '', 
            stopLoss: '', takeProfit: '', outcome: 'open', notes: ''
        });
        setSuccessMsg("Entry saved to journal.");
        await fetchEntries();
        setTimeout(() => {
          setIsAdding(false);
          setSuccessMsg(null);
        }, 1500);
      } else {
        setErrorMsg(`Save Failed: ${result.error || "Permission Denied"}`);
      }
    } catch (err: any) {
      setErrorMsg(`Error: ${err.message || "Unknown system error"}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getOutcomeStyle = (outcome: string) => {
    switch(outcome) {
      case 'win': return 'bg-brand-success/10 text-brand-success border-brand-success/20';
      case 'loss': return 'bg-brand-error/10 text-brand-error border-brand-error/20';
      case 'partial': return 'bg-brand-gold/10 text-brand-gold border-brand-gold/20';
      default: return 'bg-brand-sage/10 text-brand-muted border-brand-sage/20';
    }
  };

  return (
    <div className="p-6 md:p-10 space-y-10 animate-fade-in max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <h2 className="text-4xl font-black text-brand-charcoal uppercase tracking-tighter">Trade Journal</h2>
          <p className="text-brand-muted font-medium text-sm uppercase tracking-widest">
            Audit your performance and track institutional market behavior.
          </p>
        </div>
        <button 
          onClick={() => { setIsAdding(!isAdding); setErrorMsg(null); setSuccessMsg(null); }}
          className="btn-primary px-10 py-5 font-black text-[10px] uppercase tracking-[0.2em] rounded-xl shadow-xl transition-all"
        >
          {isAdding ? 'Close Editor' : 'Add Entry'}
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleSubmit} className="athenix-card p-8 space-y-6 animate-slide-up border-brand-gold">
          <div className="flex justify-between items-center pb-4 border-b border-brand-sage/10">
            <h3 className="text-xs font-black text-brand-charcoal uppercase tracking-widest">New Journal Entry</h3>
            {user && <span className="text-[9px] font-black text-brand-muted uppercase tracking-widest">ID: {user.uid.slice(0,6)}...</span>}
          </div>
          
          {/* Main Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[9px] font-black text-brand-muted uppercase tracking-widest">Title</label>
              <input 
                name="title" required value={formData.title} onChange={handleChange}
                placeholder="e.g. Liquidity Sweep Setup" 
                className="w-full px-5 py-4 bg-brand-sage/5 border border-brand-sage rounded-xl outline-none text-xs font-bold focus:border-brand-gold transition-colors"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                  <label className="text-[9px] font-black text-brand-muted uppercase tracking-widest">Market</label>
                  <input 
                    name="market" required value={formData.market} onChange={handleChange}
                    placeholder="e.g. XAUUSD" 
                    className="w-full px-5 py-4 bg-brand-sage/5 border border-brand-sage rounded-xl outline-none text-xs font-bold focus:border-brand-gold transition-colors"
                  />
               </div>
               <div className="space-y-2">
                  <label className="text-[9px] font-black text-brand-muted uppercase tracking-widest">Trade Mode</label>
                  <select 
                    name="tradeMode" value={formData.tradeMode} onChange={handleChange}
                    className="w-full px-5 py-4 bg-brand-sage/5 border border-brand-sage rounded-xl outline-none text-xs font-bold focus:border-brand-gold transition-colors"
                  >
                    <option value="scalp">Scalp</option>
                    <option value="day_trade">Day Trade</option>
                    <option value="swing_trade">Swing Trade</option>
                  </select>
               </div>
            </div>
          </div>

          {/* Execution Details */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
             <div className="space-y-2">
               <label className="text-[9px] font-black text-brand-muted uppercase tracking-widest">Direction</label>
               <select name="direction" value={formData.direction} onChange={handleChange} className="w-full px-4 py-3 bg-brand-sage/5 border border-brand-sage rounded-xl text-xs font-bold outline-none focus:border-brand-gold">
                 <option value="BUY">BUY</option>
                 <option value="SELL">SELL</option>
               </select>
             </div>
             <div className="space-y-2">
               <label className="text-[9px] font-black text-brand-muted uppercase tracking-widest">Entry</label>
               <input name="entryPrice" value={formData.entryPrice} onChange={handleChange} className="w-full px-4 py-3 bg-brand-sage/5 border border-brand-sage rounded-xl text-xs font-medium outline-none focus:border-brand-gold" placeholder="0.00" />
             </div>
             <div className="space-y-2">
               <label className="text-[9px] font-black text-brand-muted uppercase tracking-widest">Stop Loss</label>
               <input name="stopLoss" value={formData.stopLoss} onChange={handleChange} className="w-full px-4 py-3 bg-brand-sage/5 border border-brand-sage rounded-xl text-xs font-medium outline-none focus:border-brand-gold" placeholder="0.00" />
             </div>
             <div className="space-y-2">
               <label className="text-[9px] font-black text-brand-muted uppercase tracking-widest">Take Profit</label>
               <input name="takeProfit" value={formData.takeProfit} onChange={handleChange} className="w-full px-4 py-3 bg-brand-sage/5 border border-brand-sage rounded-xl text-xs font-medium outline-none focus:border-brand-gold" placeholder="0.00" />
             </div>
             <div className="space-y-2">
               <label className="text-[9px] font-black text-brand-muted uppercase tracking-widest">Outcome</label>
               <select name="outcome" value={formData.outcome} onChange={handleChange} className="w-full px-4 py-3 bg-brand-sage/5 border border-brand-sage rounded-xl text-xs font-bold outline-none focus:border-brand-gold">
                 <option value="open">OPEN</option>
                 <option value="win">WIN</option>
                 <option value="loss">LOSS</option>
                 <option value="partial">PARTIAL</option>
               </select>
             </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-[9px] font-black text-brand-muted uppercase tracking-widest">Analysis Notes</label>
            <textarea 
              name="notes" required value={formData.notes} onChange={handleChange}
              placeholder="Record your confluence factors, entry reasons, and emotional state..."
              className="w-full h-32 px-5 py-4 bg-brand-sage/5 border border-brand-sage rounded-xl outline-none text-xs font-medium focus:border-brand-gold transition-colors resize-none"
            />
          </div>

          {errorMsg && <div className="p-4 bg-brand-error/10 border border-brand-error/20 rounded-xl text-[10px] text-brand-error font-black uppercase tracking-widest">{errorMsg}</div>}
          {successMsg && <div className="p-4 bg-brand-success/10 border border-brand-success/20 rounded-xl text-[10px] text-brand-success font-black uppercase tracking-widest">{successMsg}</div>}

          <button type="submit" disabled={isSubmitting || !!successMsg} className="btn-primary w-full py-4 text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg disabled:opacity-50">
            {isSubmitting ? 'Saving to Ledger...' : 'Save to Log'}
          </button>
        </form>
      )}

      <section className="space-y-6">
        <h3 className="text-[10px] font-black text-brand-muted uppercase tracking-[0.3em] mb-4">Historical Logs</h3>
        
        {loading ? (
          <div className="p-10 text-center text-brand-muted font-black uppercase text-[10px] tracking-widest flex flex-col items-center gap-4">
             <div className="w-8 h-8 border-4 border-brand-sage border-t-brand-gold rounded-full animate-spin"></div>
             Fetching Terminal Logs...
          </div>
        ) : entries.length === 0 ? (
          <div className="athenix-card p-12 bg-brand-sage/5 border-dashed text-center">
            <p className="text-[10px] font-black text-brand-muted uppercase tracking-[0.3em]">No entries recorded in your journal yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {entries.map((entry) => (
              <div key={entry.id} className="athenix-card p-0 group relative overflow-hidden bg-white hover:border-brand-gold transition-all animate-fade-in">
                <div className={`h-full w-1 absolute left-0 top-0 bottom-0 ${entry.direction === 'BUY' ? 'bg-brand-success' : 'bg-brand-error'}`}></div>
                <div className="p-6 pl-8">
                  <div className="flex flex-col md:flex-row gap-6 justify-between items-start">
                    <div className="flex-1 space-y-2">
                       <div className="flex items-center gap-3">
                         <h4 className="text-lg font-black text-brand-charcoal uppercase tracking-tight">{entry.title}</h4>
                         <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-brand-sage/10 text-brand-muted">{entry.market}</span>
                         <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${entry.direction === 'BUY' ? 'text-brand-success bg-brand-success/10' : 'text-brand-error bg-brand-error/10'}`}>{entry.direction}</span>
                         {entry.tradeMode && (
                           <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-brand-gold/10 text-brand-gold">{entry.tradeMode.replace('_', ' ')}</span>
                         )}
                       </div>
                       <p className="text-xs text-brand-muted font-medium leading-relaxed whitespace-pre-wrap line-clamp-2 hover:line-clamp-none transition-all cursor-default">
                         {entry.notes}
                       </p>
                    </div>

                    <div className="flex flex-row md:flex-col gap-4 md:gap-2 text-right shrink-0">
                       <div className={`px-3 py-1 border rounded-lg text-[10px] font-black uppercase tracking-widest text-center ${getOutcomeStyle(entry.outcome)}`}>
                         {entry.outcome}
                       </div>
                       <div>
                         <p className="text-[9px] text-brand-muted font-bold uppercase tracking-widest">{new Date(entry.createdAt).toLocaleDateString()}</p>
                       </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-brand-sage/10 flex gap-6 text-[10px]">
                     {entry.entryPrice && <div><span className="text-brand-muted font-bold mr-2">ENTRY:</span><span className="font-black text-brand-charcoal">{entry.entryPrice}</span></div>}
                     {entry.stopLoss && <div><span className="text-brand-muted font-bold mr-2">SL:</span><span className="font-black text-brand-error">{entry.stopLoss}</span></div>}
                     {entry.takeProfit && <div><span className="text-brand-muted font-bold mr-2">TP:</span><span className="font-black text-brand-success">{entry.takeProfit}</span></div>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Journal;
