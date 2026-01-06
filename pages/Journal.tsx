
import React, { useState, useEffect } from 'react';
import { getJournalEntries, addJournalEntry } from '../services/firestore';
import { JournalEntry, UserProfile } from '../types';

interface JournalProps {
  user: UserProfile | null;
}

const Journal: React.FC<JournalProps> = ({ user }) => {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newMarket, setNewMarket] = useState('');
  const [newNotes, setNewNotes] = useState('');

  const fetchEntries = async () => {
    if (!user) return;
    setLoading(true);
    const data = await getJournalEntries(user.uid);
    setEntries(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchEntries();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const success = await addJournalEntry(user.uid, {
      title: newTitle,
      market: newMarket,
      notes: newNotes
    });
    if (success) {
      setNewTitle('');
      setNewMarket('');
      setNewNotes('');
      setIsAdding(false);
      fetchEntries();
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
          onClick={() => setIsAdding(!isAdding)}
          className="btn-primary px-10 py-5 font-black text-[10px] uppercase tracking-[0.2em] rounded-xl shadow-xl transition-all"
        >
          {isAdding ? 'Cancel Entry' : 'Add Entry'}
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleSubmit} className="athenix-card p-8 space-y-6 animate-slide-up">
          <h3 className="text-xs font-black text-brand-charcoal uppercase tracking-widest">New Journal Entry</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input 
              required
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Entry Title (e.g. Liquidity Sweep Setup)" 
              className="w-full px-5 py-4 bg-brand-sage/5 border border-brand-sage rounded-xl outline-none text-xs font-bold"
            />
            <input 
              required
              value={newMarket}
              onChange={(e) => setNewMarket(e.target.value)}
              placeholder="Market (e.g. XAU/USD)" 
              className="w-full px-5 py-4 bg-brand-sage/5 border border-brand-sage rounded-xl outline-none text-xs font-bold"
            />
          </div>
          <textarea 
            required
            value={newNotes}
            onChange={(e) => setNewNotes(e.target.value)}
            placeholder="Analytical Notes..."
            className="w-full h-32 px-5 py-4 bg-brand-sage/5 border border-brand-sage rounded-xl outline-none text-xs font-medium"
          />
          <button type="submit" className="btn-primary w-full py-4 text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg">
            Save to Log
          </button>
        </form>
      )}

      <section className="space-y-6">
        <h3 className="text-[10px] font-black text-brand-muted uppercase tracking-[0.3em] mb-4">Historical Logs</h3>
        
        {loading ? (
          <div className="p-10 text-center text-brand-muted font-black uppercase text-[10px] tracking-widest">Fetching Terminal Logs...</div>
        ) : entries.length === 0 ? (
          <div className="athenix-card p-12 bg-brand-sage/5 border-dashed text-center">
            <p className="text-[10px] font-black text-brand-muted uppercase tracking-[0.3em]">No entries recorded in your journal yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {entries.map((entry) => (
              <div key={entry.id} className="athenix-card p-8 group relative overflow-hidden bg-white hover:border-brand-gold transition-all">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="space-y-3 flex-1">
                    <div className="flex items-center gap-3">
                      <span className="w-2 h-2 bg-brand-gold rounded-full"></span>
                      <h4 className="text-lg font-black text-brand-charcoal uppercase tracking-tight group-hover:text-brand-gold transition-colors">
                        {entry.title} <span className="text-brand-muted opacity-50 ml-2">[{entry.market}]</span>
                      </h4>
                    </div>
                    <p className="text-xs text-brand-muted font-medium leading-relaxed">
                      {entry.notes}
                    </p>
                  </div>
                  <div className="text-left md:text-right shrink-0">
                    <p className="text-[9px] text-brand-muted uppercase font-black tracking-widest mb-1">Date Logged</p>
                    <p className="text-[11px] font-black text-brand-charcoal uppercase tracking-widest">
                      {new Date(entry.createdAt).toLocaleDateString()}
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
