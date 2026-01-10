
import React, { useState, useEffect } from 'react';
import { getJournalEntries, addJournalEntry } from '../services/firestore';
import { JournalEntry, UserProfile } from '../types';
import { auth } from '../firebase'; // Strict auth import

interface JournalProps {
  user: UserProfile | null;
}

const Journal: React.FC<JournalProps> = ({ user }) => {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  
  // Form State
  const [newTitle, setNewTitle] = useState('');
  const [newMarket, setNewMarket] = useState('');
  const [newNotes, setNewNotes] = useState('');
  
  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchEntries = async () => {
    // Prefer auth.currentUser if available for consistency, else fall back to prop
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
    // Trigger fetch when user prop changes (e.g. initial load)
    if (user) {
      fetchEntries();
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Auth Readiness Check
    if (!auth.currentUser) {
      setErrorMsg("Security Protocol: Auth session not resolved.");
      return;
    }

    // 2. Validation
    if (!newTitle.trim() || !newNotes.trim()) {
      setErrorMsg("Title and notes are required.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const uid = auth.currentUser.uid;
    console.log(`[Journal Page] Submitting entry for UID: ${uid}`);

    try {
      // 3. Write to Firestore
      const result = await addJournalEntry(uid, {
        title: newTitle,
        market: newMarket,
        notes: newNotes
      });

      // 4. Handle Response
      if (result.success) {
        setNewTitle('');
        setNewMarket('');
        setNewNotes('');
        setSuccessMsg("Entry saved to journal.");
        
        // Refresh entries immediately
        await fetchEntries();
        
        // Close form after a short delay to show success message
        setTimeout(() => {
          setIsAdding(false);
          setSuccessMsg(null);
        }, 1500);
      } else {
        // Show specific error from backend
        setErrorMsg(`Save Failed: ${result.error || "Permission Denied"}`);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(`Error: ${err.message || "Unknown system error"}`);
    } finally {
      setIsSubmitting(false);
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
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-black text-brand-charcoal uppercase tracking-widest">New Journal Entry</h3>
            {user && <span className="text-[9px] font-black text-brand-muted uppercase tracking-widest">ID: {user.uid.slice(0,6)}...</span>}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[9px] font-black text-brand-muted uppercase tracking-widest">Title</label>
              <input 
                required
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. Liquidity Sweep Setup" 
                className="w-full px-5 py-4 bg-brand-sage/5 border border-brand-sage rounded-xl outline-none text-xs font-bold focus:border-brand-gold transition-colors"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[9px] font-black text-brand-muted uppercase tracking-widest">Market Pair</label>
              <input 
                value={newMarket}
                onChange={(e) => setNewMarket(e.target.value)}
                placeholder="e.g. XAU/USD" 
                className="w-full px-5 py-4 bg-brand-sage/5 border border-brand-sage rounded-xl outline-none text-xs font-bold focus:border-brand-gold transition-colors"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-[9px] font-black text-brand-muted uppercase tracking-widest">Analysis Notes</label>
            <textarea 
              required
              value={newNotes}
              onChange={(e) => setNewNotes(e.target.value)}
              placeholder="Record your confluence factors, entry reasons, and emotional state..."
              className="w-full h-32 px-5 py-4 bg-brand-sage/5 border border-brand-sage rounded-xl outline-none text-xs font-medium focus:border-brand-gold transition-colors resize-none"
            />
          </div>

          {errorMsg && (
            <div className="p-4 bg-brand-error/10 border border-brand-error/20 rounded-xl">
              <p className="text-[10px] text-brand-error font-black uppercase tracking-widest">{errorMsg}</p>
            </div>
          )}

          {successMsg && (
            <div className="p-4 bg-brand-success/10 border border-brand-success/20 rounded-xl">
              <p className="text-[10px] text-brand-success font-black uppercase tracking-widest">{successMsg}</p>
            </div>
          )}

          <button 
            type="submit" 
            disabled={isSubmitting || !!successMsg}
            className="btn-primary w-full py-4 text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg disabled:opacity-50"
          >
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
          <div className="space-y-4">
            {entries.map((entry) => (
              <div key={entry.id} className="athenix-card p-8 group relative overflow-hidden bg-white hover:border-brand-gold transition-all animate-fade-in">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="space-y-3 flex-1">
                    <div className="flex items-center gap-3">
                      <span className="w-2 h-2 bg-brand-gold rounded-full"></span>
                      <h4 className="text-lg font-black text-brand-charcoal uppercase tracking-tight group-hover:text-brand-gold transition-colors">
                        {entry.title} <span className="text-brand-muted opacity-50 ml-2">[{entry.market}]</span>
                      </h4>
                    </div>
                    <p className="text-xs text-brand-muted font-medium leading-relaxed whitespace-pre-wrap">
                      {entry.notes}
                    </p>
                  </div>
                  <div className="text-left md:text-right shrink-0">
                    <p className="text-[9px] text-brand-muted uppercase font-black tracking-widest mb-1">Date Logged</p>
                    <p className="text-[11px] font-black text-brand-charcoal uppercase tracking-widest">
                      {new Date(entry.createdAt).toLocaleDateString()}
                    </p>
                    <p className="text-[9px] font-bold text-brand-muted uppercase tracking-widest opacity-50 mt-1">
                      {new Date(entry.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </p>
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
