import React, { useState, useEffect } from 'react';
import { UserProfile, TradeAnalysis } from '../types';
import { getUserAnalysisHistory, submitAnalysisFeedback } from '../services/firestore';
import { ICONS } from '../constants';
import ErrorBoundary from '../components/ErrorBoundary';

const safeRender = (val: any, fallback = "N/A"): string => {
  if (val === null || val === undefined) return fallback;
  if (typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean') return String(val);
  if (Array.isArray(val)) return val.map(v => safeRender(v, fallback)).join(', ');
  if (typeof val === 'object') return JSON.stringify(val);
  return fallback;
};

interface TradeJournalProps {
  user: UserProfile | null;
}

const TradeJournal: React.FC<TradeJournalProps> = ({ user }) => {
  const [trades, setTrades] = useState<TradeAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'TP_HIT' | 'SL_HIT' | 'BREAK_EVEN'>('ALL');
  const [editingNotesId, setEditingNotesId] = useState<string | null>(null);
  const [notesDraft, setNotesDraft] = useState('');

  useEffect(() => {
    if (user) loadTrades();
  }, [user]);

  const loadTrades = async () => {
    if (!user) return;
    setLoading(true);
    const history = await getUserAnalysisHistory(user.uid);
    // Only show trades that have feedback (logged outcomes)
    setTrades(history.filter(t => t.feedback));
    setLoading(false);
  };

  const handleSaveNotes = async (trade: TradeAnalysis) => {
    if (!trade.id || !trade.feedback) return;
    await submitAnalysisFeedback(trade.id, {
      ...trade.feedback,
      journal_notes: notesDraft
    });
    setEditingNotesId(null);
    loadTrades();
  };

  const filteredTrades = trades.filter(t => {
    if (filter === 'ALL') return true;
    return t.feedback?.outcome === filter;
  });

  const stats = {
    total: trades.length,
    wins: trades.filter(t => t.feedback?.outcome === 'TP_HIT').length,
    losses: trades.filter(t => t.feedback?.outcome === 'SL_HIT').length,
    winRate: trades.length > 0 ? (trades.filter(t => t.feedback?.outcome === 'TP_HIT').length / trades.length * 100).toFixed(1) : '0'
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-gold"></div>
    </div>
  );

  return (
    <ErrorBoundary>
      <div className="space-y-8 animate-fade-in">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Trades', value: stats.total, icon: ICONS.Chart },
          { label: 'Win Rate', value: `${stats.winRate}%`, icon: ICONS.Target },
          { label: 'TP Hits', value: stats.wins, icon: ICONS.Check, color: 'text-brand-success' },
          { label: 'SL Hits', value: stats.losses, icon: ICONS.X, color: 'text-brand-error' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-brand-sage/20 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-black text-brand-muted uppercase tracking-widest">{stat.label}</p>
              <stat.icon className="w-4 h-4 text-brand-gold" />
            </div>
            <p className={`text-2xl font-black ${stat.color || 'text-brand-charcoal'}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {['ALL', 'TP_HIT', 'SL_HIT', 'BREAK_EVEN'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f as any)}
            className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
              filter === f ? 'bg-brand-charcoal text-white shadow-md' : 'bg-brand-sage/10 text-brand-muted hover:bg-brand-sage/20'
            }`}
          >
            {f.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Trade List */}
      <div className="space-y-4">
        {filteredTrades.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-brand-sage/30">
            <p className="text-brand-muted text-sm font-medium">No trades found in your journal.</p>
          </div>
        ) : (
          filteredTrades.map(trade => (
            <div key={trade.id} className="bg-white rounded-2xl border border-brand-sage/20 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg ${
                      trade.feedback?.outcome === 'TP_HIT' ? 'bg-brand-success/10 text-brand-success' :
                      trade.feedback?.outcome === 'SL_HIT' ? 'bg-brand-error/10 text-brand-error' :
                      'bg-brand-sage/10 text-brand-charcoal'
                    }`}>
                      {safeRender(trade.instrument, "").substring(0, 2)}
                    </div>
                    <div>
                      <h4 className="text-lg font-black text-brand-charcoal uppercase tracking-tighter">{safeRender(trade.instrument)}</h4>
                      <p className="text-[10px] text-brand-muted font-bold uppercase tracking-widest">
                        {new Date(trade.timestamp).toLocaleDateString()} • {safeRender(trade.execution_mode, "").replace('_', ' ')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`px-3 py-1 rounded text-[10px] font-black uppercase tracking-widest ${
                      trade.feedback?.outcome === 'TP_HIT' ? 'bg-brand-success/20 text-brand-success' :
                      trade.feedback?.outcome === 'SL_HIT' ? 'bg-brand-error/20 text-brand-error' :
                      'bg-brand-charcoal/10 text-brand-charcoal'
                    }`}>
                      {safeRender(trade.feedback?.outcome, "").replace('_', ' ')}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
                  <div>
                    <p className="text-[8px] font-black text-brand-muted uppercase tracking-widest mb-1">Entry Price</p>
                    <p className="text-sm font-bold text-brand-charcoal">{safeRender(trade.signal?.entry_price, '---')}</p>
                  </div>
                  <div>
                    <p className="text-[8px] font-black text-brand-muted uppercase tracking-widest mb-1">Stop Loss</p>
                    <p className="text-sm font-bold text-brand-error">{safeRender(trade.signal?.stop_loss, '---')}</p>
                  </div>
                  <div>
                    <p className="text-[8px] font-black text-brand-muted uppercase tracking-widest mb-1">Take Profit</p>
                    <p className="text-sm font-bold text-brand-success">{safeRender(trade.signal?.take_profits?.[0]?.price, '---')}</p>
                  </div>
                  <div>
                    <p className="text-[8px] font-black text-brand-muted uppercase tracking-widest mb-1">Quality Score</p>
                    <p className="text-sm font-bold text-brand-gold">{safeRender(trade.quality_score, "0")}/100</p>
                  </div>
                </div>

                {/* Journal Notes */}
                <div className="pt-6 border-t border-brand-sage/10">
                  <div className="flex items-center justify-between mb-3">
                    <h5 className="text-[10px] font-black text-brand-charcoal uppercase tracking-widest">Journal Notes</h5>
                    {editingNotesId !== trade.id && (
                      <button 
                        onClick={() => {
                          setEditingNotesId(trade.id!);
                          setNotesDraft(trade.feedback?.journal_notes || '');
                        }}
                        className="text-[9px] font-black text-brand-gold uppercase hover:underline"
                      >
                        {trade.feedback?.journal_notes ? 'Edit Notes' : '+ Add Notes'}
                      </button>
                    )}
                  </div>
                  
                  {editingNotesId === trade.id ? (
                    <div className="space-y-3">
                      <textarea
                        value={notesDraft}
                        onChange={e => setNotesDraft(e.target.value)}
                        placeholder="What did you learn from this trade? Any emotional triggers? Market context?"
                        className="w-full p-4 text-xs bg-brand-sage/5 border border-brand-sage/20 rounded-xl outline-none focus:border-brand-gold min-h-[100px]"
                      />
                      <div className="flex justify-end gap-3">
                        <button onClick={() => setEditingNotesId(null)} className="text-[10px] font-bold text-brand-muted uppercase">Cancel</button>
                        <button onClick={() => handleSaveNotes(trade)} className="px-4 py-2 bg-brand-charcoal text-white text-[10px] font-black uppercase rounded-lg hover:bg-brand-gold transition-colors">Save Notes</button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-brand-muted italic leading-relaxed">
                      {safeRender(trade.feedback?.journal_notes, 'No notes added for this trade.')}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      </div>
    </ErrorBoundary>
  );
};

export default TradeJournal;
