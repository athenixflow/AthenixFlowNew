
import React, { useEffect, useState } from 'react';
import { getAllUsers, getActiveSignals, getEducationLessons } from '../services/firestore';
// Removed adminUpdateConfig as it is not exported from backend service and not used in this component
import { adminUpdateUser, adminManageSignal, adminManageLesson } from '../services/backend';
import { UserProfile, TradingSignal, Lesson, UserRole, SubscriptionPlan } from '../types';

interface AdminDashboardProps {
  user: UserProfile | null;
}

type AdminTab = 'overview' | 'users' | 'signals' | 'education' | 'settings';

const AdminDashboard: React.FC<AdminDashboardProps> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [signals, setSignals] = useState<TradingSignal[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionStatus, setActionStatus] = useState<string | null>(null);

  // Form states
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  
  // Updated initial state for full signal creation support
  const [editingSignal, setEditingSignal] = useState<Partial<TradingSignal> | null>(null);
  
  const [editingLesson, setEditingLesson] = useState<Partial<Lesson> | null>(null);

  const refreshData = async () => {
    setLoading(true);
    const [u, s, l] = await Promise.all([
      getAllUsers(),
      getActiveSignals(),
      getEducationLessons()
    ]);
    setUsers(u);
    setSignals(s);
    setLessons(l);
    setLoading(false);
  };

  useEffect(() => {
    if (user?.role === UserRole.ADMIN) {
      refreshData();
    }
  }, [user]);

  if (user?.role !== UserRole.ADMIN) {
    return (
      <div className="p-20 text-center text-brand-error font-black uppercase tracking-widest">
        Access Denied: Institutional Admin Authorization Required.
      </div>
    );
  }

  const handleUpdateUser = async (targetUid: string, updates: Partial<UserProfile>) => {
    const res = await adminUpdateUser(user.uid, targetUid, updates);
    setActionStatus(res.message);
    if (res.status === 'success') {
      setEditingUser(null);
      refreshData();
    }
  };

  const handleSignalAction = async (action: 'create' | 'update' | 'delete', data: any) => {
    // Ensure authorId is attached for new signals
    if (action === 'create' && user) {
        data.authorId = user.uid;
    }
    const res = await adminManageSignal(user.uid, action, data);
    setActionStatus(res.message);
    if (res.status === 'success') {
      setEditingSignal(null);
      refreshData();
    }
  };

  const handleLessonAction = async (action: 'create' | 'update' | 'delete', data: any) => {
    const res = await adminManageLesson(user.uid, action, data);
    setActionStatus(res.message);
    if (res.status === 'success') {
      setEditingLesson(null);
      refreshData();
    }
  };

  const renderOverview = () => (
    <div className="space-y-8 animate-fade-in">
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="athenix-card p-8">
          <p className="text-[10px] text-brand-muted uppercase font-black tracking-widest mb-6">Network Nodes</p>
          <p className="text-xl font-black text-brand-charcoal uppercase tracking-tighter">{users.length} Users</p>
        </div>
        <div className="athenix-card p-8">
          <p className="text-[10px] text-brand-muted uppercase font-black tracking-widest mb-6">Live Vectors</p>
          <p className="text-xl font-black text-brand-charcoal uppercase tracking-tighter">{signals.length} Signals</p>
        </div>
        <div className="athenix-card p-8">
          <p className="text-[10px] text-brand-muted uppercase font-black tracking-widest mb-6">Knowledge Modules</p>
          <p className="text-xl font-black text-brand-charcoal uppercase tracking-tighter">{lessons.length} Modules</p>
        </div>
        <div className="athenix-card p-8 bg-brand-sage/5 border-dashed">
          <p className="text-[10px] text-brand-muted uppercase font-black tracking-widest mb-6">Security Integrity</p>
          <p className="text-xl font-black text-brand-success uppercase tracking-tighter">Secured</p>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="athenix-card p-8">
          <h3 className="text-[10px] font-black text-brand-charcoal uppercase tracking-[0.3em] mb-6">Recent Token Activity</h3>
          <div className="space-y-4 opacity-50 italic text-[10px] font-bold uppercase tracking-widest">
            Detailed ledger logging is active. Historical transactions are indexed in tokenTransactions collection.
          </div>
        </div>
        <div className="athenix-card p-8 bg-brand-charcoal text-white">
          <h3 className="text-[10px] font-black text-brand-gold uppercase tracking-[0.3em] mb-6">Admin Intelligence</h3>
          <p className="text-xs leading-loose font-medium opacity-80">
            The Athenix Network is currently operating at optimal capacity. Gemini API bridges are healthy and latency is within institutional tolerance.
          </p>
        </div>
      </div>
    </div>
  );

  const renderUsers = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="athenix-card overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-brand-sage/5 border-b border-brand-sage/10">
              <th className="p-6 text-[10px] font-black text-brand-muted uppercase tracking-widest">Identity</th>
              <th className="p-6 text-[10px] font-black text-brand-muted uppercase tracking-widest">Plan</th>
              <th className="p-6 text-[10px] font-black text-brand-muted uppercase tracking-widest">Credits</th>
              <th className="p-6 text-[10px] font-black text-brand-muted uppercase tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-sage/10">
            {users.map(u => (
              <tr key={u.uid} className="hover:bg-brand-sage/5 transition-colors">
                <td className="p-6">
                  <p className="text-[11px] font-black text-brand-charcoal uppercase">{u.fullName}</p>
                  <p className="text-[9px] text-brand-muted font-bold">{u.email}</p>
                </td>
                <td className="p-6">
                  <span className={`px-2 py-1 text-[8px] font-black uppercase rounded ${
                    u.subscriptionPlan === SubscriptionPlan.ELITE ? 'bg-brand-gold/20 text-brand-gold' : 'bg-brand-sage/20 text-brand-muted'
                  }`}>
                    {u.subscriptionPlan}
                  </span>
                </td>
                <td className="p-6">
                  <p className="text-[10px] font-black text-brand-charcoal">{u.analysisTokens}A / {u.educationTokens}E</p>
                </td>
                <td className="p-6 text-right">
                  <button 
                    onClick={() => setEditingUser(u)}
                    className="text-[9px] font-black text-brand-gold uppercase tracking-widest hover:underline"
                  >
                    Modify
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editingUser && (
        <div className="fixed inset-0 z-[100] bg-brand-charcoal/40 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="athenix-card p-10 max-w-lg w-full space-y-8 animate-slide-up">
            <h3 className="text-xs font-black text-brand-charcoal uppercase tracking-[0.3em]">Modify User: {editingUser.fullName}</h3>
            
            <div className="grid grid-cols-2 gap-4">
              {/* Plan Selection */}
              <div className="space-y-2">
                <label className="text-[9px] font-black text-brand-muted uppercase tracking-widest">Plan</label>
                <select 
                  className="w-full p-3 bg-brand-sage/5 border border-brand-sage rounded-xl text-[10px] font-black uppercase outline-none focus:border-brand-gold"
                  value={editingUser.subscriptionPlan}
                  onChange={(e) => setEditingUser({...editingUser, subscriptionPlan: e.target.value as SubscriptionPlan})}
                >
                  {Object.values(SubscriptionPlan).map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>

              {/* Role Selection */}
              <div className="space-y-2">
                <label className="text-[9px] font-black text-brand-muted uppercase tracking-widest">Role</label>
                <select 
                  className="w-full p-3 bg-brand-sage/5 border border-brand-sage rounded-xl text-[10px] font-black uppercase outline-none focus:border-brand-gold"
                  value={editingUser.role}
                  onChange={(e) => setEditingUser({...editingUser, role: e.target.value as UserRole})}
                >
                  {Object.values(UserRole).map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>

              {/* Analysis Tokens */}
              <div className="space-y-2">
                <label className="text-[9px] font-black text-brand-muted uppercase tracking-widest">Analysis Tokens</label>
                <input 
                  type="number"
                  className="w-full p-3 bg-brand-sage/5 border border-brand-sage rounded-xl text-[10px] font-black uppercase outline-none focus:border-brand-gold"
                  value={editingUser.analysisTokens}
                  onChange={(e) => setEditingUser({...editingUser, analysisTokens: parseInt(e.target.value) || 0})}
                />
              </div>

              {/* Education Tokens */}
              <div className="space-y-2">
                <label className="text-[9px] font-black text-brand-muted uppercase tracking-widest">Education Tokens</label>
                <input 
                  type="number"
                  className="w-full p-3 bg-brand-sage/5 border border-brand-sage rounded-xl text-[10px] font-black uppercase outline-none focus:border-brand-gold"
                  value={editingUser.educationTokens}
                  onChange={(e) => setEditingUser({...editingUser, educationTokens: parseInt(e.target.value) || 0})}
                />
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <button 
                onClick={() => setEditingUser(null)}
                className="flex-1 py-4 text-[9px] font-black uppercase tracking-widest border border-brand-sage rounded-xl hover:bg-brand-sage/10 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => handleUpdateUser(editingUser.uid, editingUser)}
                className="flex-1 py-4 text-[9px] font-black uppercase tracking-widest bg-brand-gold text-white rounded-xl shadow-lg hover:bg-brand-charcoal transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderSignals = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h3 className="text-[10px] font-black text-brand-muted uppercase tracking-[0.3em]">Institutional Feed Management</h3>
        <button 
          onClick={() => setEditingSignal({ 
            instrument: '', 
            direction: 'BUY', 
            orderType: 'MARKET',
            entry: '', 
            stopLoss: '', 
            takeProfit: '', 
            confidence: 90,
            author: 'Athenix Admin' 
          })}
          className="btn-primary px-6 py-3 text-[9px] font-black uppercase tracking-widest rounded-xl"
        >
          Inject New Vector
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {signals.map(s => (
          <div key={s.id} className="athenix-card p-6 flex justify-between items-center group">
            <div>
              <p className="text-xl font-black text-brand-charcoal uppercase tracking-tighter">{s.instrument}</p>
              <p className={`text-[9px] font-black uppercase tracking-widest ${s.direction === 'BUY' ? 'text-brand-success' : 'text-brand-error'}`}>{s.direction} • {s.orderType || 'MARKET'}</p>
              <p className="text-[8px] text-brand-muted font-bold mt-1">ENTRY: {s.entry} • CONF: {s.confidence}%</p>
            </div>
            <div className="flex flex-col gap-2">
              <button onClick={() => setEditingSignal(s)} className="text-[9px] font-black text-brand-gold uppercase tracking-widest hover:underline">Edit</button>
              <button onClick={() => handleSignalAction('delete', s)} className="text-[9px] font-black text-brand-error uppercase tracking-widest hover:underline">Remove</button>
            </div>
          </div>
        ))}
      </div>

      {editingSignal && (
        <div className="fixed inset-0 z-[100] bg-brand-charcoal/40 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="athenix-card p-10 max-w-xl w-full space-y-6 animate-slide-up">
            <h3 className="text-xs font-black text-brand-charcoal uppercase tracking-[0.3em]">{editingSignal.id ? 'Edit Vector' : 'New Vector'}</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                 <label className="text-[8px] font-black text-brand-muted uppercase tracking-widest">Instrument</label>
                 <input className="w-full p-4 bg-brand-sage/5 border border-brand-sage rounded-xl text-[10px] font-bold outline-none" placeholder="EURUSD" value={editingSignal.instrument || editingSignal.pair} onChange={e => setEditingSignal({...editingSignal, instrument: e.target.value})} />
              </div>

              <div className="space-y-1">
                 <label className="text-[8px] font-black text-brand-muted uppercase tracking-widest">Direction</label>
                 <select className="w-full p-4 bg-brand-sage/5 border border-brand-sage rounded-xl text-[10px] font-bold outline-none" value={editingSignal.direction} onChange={e => setEditingSignal({...editingSignal, direction: e.target.value as 'BUY' | 'SELL'})}>
                    <option value="BUY">BUY</option>
                    <option value="SELL">SELL</option>
                 </select>
              </div>

              <div className="space-y-1">
                 <label className="text-[8px] font-black text-brand-muted uppercase tracking-widest">Order Type</label>
                 <input className="w-full p-4 bg-brand-sage/5 border border-brand-sage rounded-xl text-[10px] font-bold outline-none" placeholder="MARKET" value={editingSignal.orderType} onChange={e => setEditingSignal({...editingSignal, orderType: e.target.value})} />
              </div>

              <div className="space-y-1">
                 <label className="text-[8px] font-black text-brand-muted uppercase tracking-widest">Entry</label>
                 <input className="w-full p-4 bg-brand-sage/5 border border-brand-sage rounded-xl text-[10px] font-bold outline-none" placeholder="1.0500" value={editingSignal.entry} onChange={e => setEditingSignal({...editingSignal, entry: e.target.value})} />
              </div>

              <div className="space-y-1">
                 <label className="text-[8px] font-black text-brand-muted uppercase tracking-widest">Stop Loss</label>
                 <input className="w-full p-4 bg-brand-sage/5 border border-brand-sage rounded-xl text-[10px] font-bold outline-none" placeholder="1.0450" value={editingSignal.stopLoss} onChange={e => setEditingSignal({...editingSignal, stopLoss: e.target.value})} />
              </div>

              <div className="space-y-1">
                 <label className="text-[8px] font-black text-brand-muted uppercase tracking-widest">Take Profit</label>
                 <input className="w-full p-4 bg-brand-sage/5 border border-brand-sage rounded-xl text-[10px] font-bold outline-none" placeholder="1.0600" value={editingSignal.takeProfit} onChange={e => setEditingSignal({...editingSignal, takeProfit: e.target.value})} />
              </div>

              <div className="space-y-1">
                 <label className="text-[8px] font-black text-brand-muted uppercase tracking-widest">Confidence %</label>
                 <input type="number" className="w-full p-4 bg-brand-sage/5 border border-brand-sage rounded-xl text-[10px] font-bold outline-none" placeholder="90" value={editingSignal.confidence} onChange={e => setEditingSignal({...editingSignal, confidence: parseInt(e.target.value)})} />
              </div>

              <div className="space-y-1">
                 <label className="text-[8px] font-black text-brand-muted uppercase tracking-widest">Author</label>
                 <input className="w-full p-4 bg-brand-sage/5 border border-brand-sage rounded-xl text-[10px] font-bold outline-none" placeholder="Admin Name" value={editingSignal.author} onChange={e => setEditingSignal({...editingSignal, author: e.target.value})} />
              </div>
            </div>

            <div className="flex gap-4">
              <button onClick={() => setEditingSignal(null)} className="flex-1 py-4 text-[9px] font-black uppercase tracking-widest border border-brand-sage rounded-xl">Cancel</button>
              <button onClick={() => handleSignalAction(editingSignal.id ? 'update' : 'create', editingSignal)} className="flex-1 py-4 text-[9px] font-black uppercase tracking-widest bg-brand-gold text-white rounded-xl">Commit Vector</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderEducation = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h3 className="text-[10px] font-black text-brand-muted uppercase tracking-[0.3em]">Knowledge Base Control</h3>
        <button 
          onClick={() => setEditingLesson({ title: '', description: '', content: [] })}
          className="btn-primary px-6 py-3 text-[9px] font-black uppercase tracking-widest rounded-xl"
        >
          Inject Module
        </button>
      </div>

      <div className="space-y-4">
        {lessons.map(l => (
          <div key={l.id} className="athenix-card p-6 flex justify-between items-center">
            <div>
              <p className="text-sm font-black text-brand-charcoal uppercase tracking-widest">{l.title}</p>
              <p className="text-[10px] text-brand-muted font-medium mt-1">{l.description}</p>
            </div>
            <div className="flex gap-4">
              <button onClick={() => setEditingLesson(l)} className="text-[9px] font-black text-brand-gold uppercase tracking-widest">Edit</button>
              <button onClick={() => handleLessonAction('delete', l)} className="text-[9px] font-black text-brand-error uppercase tracking-widest">Purge</button>
            </div>
          </div>
        ))}
      </div>

      {editingLesson && (
        <div className="fixed inset-0 z-[100] bg-brand-charcoal/40 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="athenix-card p-10 max-w-2xl w-full space-y-6 animate-slide-up overflow-y-auto max-h-[90vh]">
            <h3 className="text-xs font-black text-brand-charcoal uppercase tracking-[0.3em]">Module Configuration</h3>
            <input className="w-full p-4 bg-brand-sage/5 border border-brand-sage rounded-xl text-[11px] font-bold outline-none" placeholder="MODULE TITLE" value={editingLesson.title} onChange={e => setEditingLesson({...editingLesson, title: e.target.value})} />
            <textarea className="w-full p-4 bg-brand-sage/5 border border-brand-sage rounded-xl text-[10px] font-medium outline-none h-24" placeholder="SHORT DESCRIPTION" value={editingLesson.description} onChange={e => setEditingLesson({...editingLesson, description: e.target.value})} />
            <textarea className="w-full p-4 bg-brand-sage/5 border border-brand-sage rounded-xl text-[10px] font-medium outline-none h-64" placeholder="MODULE CONTENT (JSON Array or Newline-separated)" value={Array.isArray(editingLesson.content) ? editingLesson.content.join('\n\n') : ''} onChange={e => setEditingLesson({...editingLesson, content: e.target.value.split('\n\n')})} />
            <div className="flex gap-4">
              <button onClick={() => setEditingLesson(null)} className="flex-1 py-4 text-[9px] font-black uppercase tracking-widest border border-brand-sage rounded-xl">Abort</button>
              <button onClick={() => handleLessonAction(editingLesson.id ? 'update' : 'create', editingLesson)} className="flex-1 py-4 text-[9px] font-black uppercase tracking-widest bg-brand-gold text-white rounded-xl">Commit Module</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderSettings = () => (
    <div className="space-y-10 animate-fade-in max-w-4xl">
      <div className="athenix-card p-10 space-y-8">
        <h3 className="text-xs font-black text-brand-charcoal uppercase tracking-[0.3em] border-l-4 border-brand-gold pl-4">System API Architecture</h3>
        <div className="space-y-6">
          <div className="flex items-center justify-between p-6 bg-brand-sage/5 rounded-2xl border border-brand-sage/20">
            <div>
              <p className="text-[10px] font-black text-brand-charcoal uppercase tracking-widest">Google Gemini Pro v3.1</p>
              <p className="text-[9px] text-brand-muted font-bold uppercase tracking-tight">Status: OPERATIONAL • Latency: 420ms</p>
            </div>
            <button className="px-4 py-2 bg-brand-charcoal text-white text-[8px] font-black uppercase rounded-lg tracking-widest">Update Bridge</button>
          </div>
          <div className="flex items-center justify-between p-6 bg-brand-sage/5 rounded-2xl border border-brand-sage/20">
            <div>
              <p className="text-[10px] font-black text-brand-charcoal uppercase tracking-widest">Forex Real-time Feed</p>
              <p className="text-[9px] text-brand-muted font-bold uppercase tracking-tight">Status: ACTIVE • Provider: Institutional Aggregator</p>
            </div>
            <button className="px-4 py-2 bg-brand-charcoal text-white text-[8px] font-black uppercase rounded-lg tracking-widest">Update Key</button>
          </div>
        </div>
      </div>

      <div className="athenix-card p-10 bg-brand-gold/5 border-dashed space-y-8">
        <h3 className="text-xs font-black text-brand-gold uppercase tracking-[0.3em]">Monetary Protocol</h3>
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <p className="text-[9px] text-brand-muted font-black uppercase tracking-widest">Analysis Token Refill Rate</p>
            <p className="text-lg font-black text-brand-charcoal">$5.00 / 20 Units</p>
          </div>
          <div className="space-y-2">
            <p className="text-[9px] text-brand-muted font-black uppercase tracking-widest">Education Token Refill Rate</p>
            <p className="text-lg font-black text-brand-charcoal">$5.00 / 500 Units</p>
          </div>
        </div>
        <button className="w-full py-4 text-[9px] font-black text-brand-charcoal uppercase tracking-[0.2em] border border-brand-gold rounded-xl">Adjust Economic Constants</button>
      </div>
    </div>
  );

  return (
    <div className="p-6 md:p-10 space-y-10 animate-fade-in max-w-7xl mx-auto pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <h2 className="text-4xl font-black text-brand-charcoal uppercase tracking-tighter">Institutional Oversight</h2>
          <p className="text-brand-muted font-medium text-sm uppercase tracking-widest">Platform Admin Terminal v5.0 Active.</p>
        </div>
        {actionStatus && (
          <div className="bg-brand-success/10 text-brand-success px-6 py-4 rounded-xl text-[10px] font-black uppercase animate-pulse border border-brand-success/20">
            {actionStatus}
          </div>
        )}
      </div>

      <nav className="flex gap-2 p-1 bg-brand-sage/5 border border-brand-sage/20 rounded-2xl w-fit">
        {(['overview', 'users', 'signals', 'education', 'settings'] as AdminTab[]).map(tab => (
          <button 
            key={tab}
            onClick={() => { setActiveTab(tab); setActionStatus(null); }}
            className={`px-8 py-3 text-[9px] font-black uppercase tracking-[0.2em] rounded-xl transition-all ${
              activeTab === tab ? 'bg-white shadow-xl text-brand-gold' : 'text-brand-muted hover:text-brand-charcoal'
            }`}
          >
            {tab}
          </button>
        ))}
      </nav>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-4">
          <div className="w-12 h-12 border-4 border-brand-sage border-t-brand-gold rounded-full animate-spin"></div>
          <p className="text-[9px] font-black text-brand-muted uppercase tracking-[0.4em]">Querying Global Infrastructure...</p>
        </div>
      ) : (
        <div className="min-h-[600px]">
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'users' && renderUsers()}
          {activeTab === 'signals' && renderSignals()}
          {activeTab === 'education' && renderEducation()}
          {activeTab === 'settings' && renderSettings()}
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
