import React, { useEffect, useState } from 'react';
import { getAllUsers, getAllSignals, getEducationLessons, getAdminOverviewMetrics, getRevenueMetrics, getAIOversightMetrics, getTokenEconomyConfig, getAuditLogs } from '../services/firestore';
import { adminUpdateUser, adminManageSignal, adminManageLesson, adminGrantTokens, adminUpdateSubscription, adminToggleUserStatus, adminUpdateTokenConfig, adminToggleAILearning, getSystemHealthStatus } from '../services/backend';
import { UserProfile, TradingSignal, Lesson, UserRole, SubscriptionPlan, AdminOverviewMetrics, RevenueMetrics, AIOversightMetrics, TokenEconomyConfig, SystemHealth, AuditLogEntry, SignalStatus } from '../types';
import { FOREX_INSTRUMENTS, STOCK_INSTRUMENTS } from '../constants';

interface AdminDashboardProps {
  user: UserProfile | null;
  onNavigate?: (page: string) => void;
  onLogout?: () => void;
}

type AdminTab = 'overview' | 'users' | 'revenue' | 'signals' | 'education' | 'ai_oversight' | 'tokens' | 'system' | 'audit_log';

// --- INTERNAL COMPONENTS FOR ADMIN LAYOUT ---

const AdminSidebar: React.FC<{ active: AdminTab; onSelect: (tab: AdminTab) => void }> = ({ active, onSelect }) => {
  const menuItems: { id: AdminTab; label: string; icon: string }[] = [
    { id: 'overview', label: 'Mission Control', icon: 'M4 6h16M4 12h16M4 18h16' },
    { id: 'users', label: 'Users', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
    { id: 'revenue', label: 'Revenue', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
    { id: 'signals', label: 'Signals', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
    { id: 'education', label: 'Education', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
    { id: 'ai_oversight', label: 'AI Oversight', icon: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
    { id: 'tokens', label: 'Tokens', icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6' },
    { id: 'system', label: 'System', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' },
    { id: 'audit_log', label: 'Audit Log', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800">
      <div className="p-6 border-b border-slate-800 flex items-center gap-3">
        <div className="w-8 h-8 bg-brand-gold rounded flex items-center justify-center text-white font-black">A</div>
        <span className="text-white font-bold tracking-wider">ADMIN</span>
      </div>
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {menuItems.map(item => (
          <button
            key={item.id}
            onClick={() => onSelect(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${
              active === item.id 
                ? 'bg-brand-gold text-white shadow-lg' 
                : 'hover:bg-slate-800 hover:text-white'
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
            </svg>
            {item.label}
          </button>
        ))}
      </nav>
      <div className="p-4 border-t border-slate-800">
        <div className="text-[9px] font-mono text-slate-500 text-center">v5.3.0 • SECURE</div>
      </div>
    </aside>
  );
};

const AdminHeader: React.FC<{ user: UserProfile; onLogout?: () => void }> = ({ user, onLogout }) => (
  <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 shadow-sm">
    <div className="flex items-center gap-2">
      <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Platform Admin</span>
      <span className="text-gray-300">/</span>
      <span className="text-xs font-bold text-gray-800">{user.email}</span>
    </div>
    <button 
      onClick={onLogout}
      className="text-[10px] font-black uppercase tracking-widest text-brand-error hover:underline"
    >
      Secure Logout
    </button>
  </header>
);

// --- MAIN ADMIN DASHBOARD COMPONENT ---

const AdminDashboard: React.FC<AdminDashboardProps> = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [signals, setSignals] = useState<TradingSignal[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  
  const [overviewMetrics, setOverviewMetrics] = useState<AdminOverviewMetrics | null>(null);
  const [revenueMetrics, setRevenueMetrics] = useState<RevenueMetrics | null>(null);
  const [aiMetrics, setAiMetrics] = useState<AIOversightMetrics | null>(null);
  const [tokenConfig, setTokenConfig] = useState<TokenEconomyConfig | null>(null);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  
  const [loading, setLoading] = useState(false);
  
  // -- USER ACTION STATES --
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [actionType, setActionType] = useState<'edit' | 'tokens' | null>(null);
  const [tokenAmount, setTokenAmount] = useState(0);
  const [tokenType, setTokenType] = useState<'analysis' | 'education'>('analysis');
  
  // -- SIGNAL ACTION STATES --
  const [isCreatingSignal, setIsCreatingSignal] = useState(false);
  const [signalSubmitting, setSignalSubmitting] = useState(false);
  
  // Create / Edit Form State
  const [signalForm, setSignalForm] = useState<Partial<TradingSignal>>({
    market: 'Forex',
    signalType: 'Buy',
    confidence: 90,
    timeframe: '1h',
    entry: 0,
    stopLoss: 0,
    takeProfit: 0,
    instrument: '',
    audience: 'all_users',
    plans: []
  });

  // Manage Lifecycle State
  const [managingSignal, setManagingSignal] = useState<TradingSignal | null>(null);
  const [manageStatusOutcome, setManageStatusOutcome] = useState<{
    status: SignalStatus,
    exitPrice?: number,
    comment?: string
  }>({ status: 'active' });

  const [editingLesson, setEditingLesson] = useState<Partial<Lesson> | null>(null);

  const refreshData = async () => {
    setLoading(true);
    const [u, s, l, om, rm, am, tc, sh, al] = await Promise.all([
      getAllUsers(),
      getAllSignals(),
      getEducationLessons(),
      getAdminOverviewMetrics(),
      getRevenueMetrics(),
      getAIOversightMetrics(),
      getTokenEconomyConfig(),
      getSystemHealthStatus(),
      getAuditLogs()
    ]);
    setUsers(u);
    setSignals(s);
    setLessons(l);
    setOverviewMetrics(om);
    setRevenueMetrics(rm);
    setAiMetrics(am);
    setTokenConfig(tc);
    setSystemHealth(sh);
    setAuditLogs(al);
    setLoading(false);
  };

  useEffect(() => {
    if (user?.role === UserRole.ADMIN) {
      refreshData();
    }
  }, [user]);

  // Access Control Guard
  if (!user || user.role !== UserRole.ADMIN) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-4">
           <div className="text-brand-error text-5xl">⚠️</div>
           <h1 className="text-xl font-black text-brand-charcoal uppercase tracking-widest">Access Restricted</h1>
           <p className="text-sm text-brand-muted">This area is restricted to platform administrators only.</p>
        </div>
      </div>
    );
  }

  // --- ACTIONS ---

  const handleGrantTokens = async () => {
    if (!selectedUser) return;
    const res = await adminGrantTokens(user.uid, selectedUser.uid, tokenType, tokenAmount);
    if (res.status === 'success') {
      setActionType(null);
      setSelectedUser(null);
      refreshData();
    }
  };

  const handleUpdateSubscription = async (plan: SubscriptionPlan) => {
    if (!selectedUser) return;
    const res = await adminUpdateSubscription(user.uid, selectedUser.uid, plan);
    if (res.status === 'success') {
      setActionType(null);
      setSelectedUser(null);
      refreshData();
    }
  };

  const handleToggleSuspension = async () => {
    if (!selectedUser) return;
    const isSuspended = selectedUser.accountStatus === 'suspended';
    const res = await adminToggleUserStatus(user.uid, selectedUser.uid, !isSuspended);
    if (res.status === 'success') {
      setActionType(null);
      setSelectedUser(null);
      refreshData();
    }
  };

  const handleSignalSubmit = async () => {
    // Validation
    if (!signalForm.instrument || !signalForm.entry || !signalForm.stopLoss || !signalForm.takeProfit) {
      alert("Missing required signal fields");
      return;
    }
    
    if (signalForm.audience === 'specific_plans' && (!signalForm.plans || signalForm.plans.length === 0)) {
        alert("Please select at least one plan for the target audience.");
        return;
    }

    setSignalSubmitting(true);
    try {
        // Determine action: Update if ID exists, else Create
        const action = signalForm.id ? 'update' : 'create';
        const payload = { ...signalForm };
        if (!payload.id) payload.author = user.fullName || 'Admin';

        const res = await adminManageSignal(user.uid, action, payload);
        if (res.status === 'success') {
          setIsCreatingSignal(false);
          setSignalForm({ 
              market: 'Forex', 
              signalType: 'Buy', 
              confidence: 90, 
              timeframe: '1h', 
              entry: 0, 
              stopLoss: 0, 
              takeProfit: 0,
              instrument: '',
              audience: 'all_users',
              plans: []
          });
          refreshData();
        } else {
            alert("Error: " + res.message);
        }
    } catch (err) {
        console.error(err);
        alert("Submission failed. Check console.");
    } finally {
        setSignalSubmitting(false);
    }
  };

  const handleLifecycleUpdate = async () => {
    if (!managingSignal) return;
    const updates = {
      id: managingSignal.id,
      status: manageStatusOutcome.status,
      exitPrice: manageStatusOutcome.exitPrice,
      outcomeComment: manageStatusOutcome.comment
    };
    
    const res = await adminManageSignal(user.uid, 'update', updates);
    
    if (res.status === 'success') {
      setManagingSignal(null);
      refreshData();
    } else {
      alert("Failed to update status: " + res.message);
    }
  };

  const handleSoftDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this signal? It will be hidden from users.")) {
      await adminManageSignal(user.uid, 'soft_delete', { id });
      refreshData();
    }
  };

  const openSignalEditor = (signal?: TradingSignal) => {
    if (signal) {
      setSignalForm({ ...signal });
    } else {
      setSignalForm({
        market: 'Forex',
        signalType: 'Buy',
        confidence: 90,
        timeframe: '1h',
        entry: 0, stopLoss: 0, takeProfit: 0,
        instrument: '',
        audience: 'all_users',
        plans: []
      });
    }
    setIsCreatingSignal(true);
  };

  const handleLessonAction = async (action: 'create' | 'update' | 'delete', data: any) => {
    const res = await adminManageLesson(user.uid, action, data);
    if (res.status === 'success') { setEditingLesson(null); refreshData(); }
  };

  const handleSaveTokenConfig = async () => {
    if (!tokenConfig) return;
    await adminUpdateTokenConfig(user.uid, tokenConfig);
    refreshData();
  };

  const handleToggleAILearning = async () => {
    if (!aiMetrics) return;
    const newState = aiMetrics.learningStatus === 'active' ? false : true;
    await adminToggleAILearning(user.uid, newState);
    refreshData();
  };

  // --- SUB-PAGE RENDERERS ---

  const renderSignals = () => {
    const activeInstruments = signalForm.market === 'Forex' ? FOREX_INSTRUMENTS : STOCK_INSTRUMENTS;

    return (
      <div className="space-y-8 animate-fade-in">
         <div className="flex justify-between items-end border-b border-gray-200 pb-6">
            <div>
              <h2 className="text-2xl font-black text-gray-800 uppercase tracking-tight">Signal Lifecycle Management</h2>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Create, Track, and Close Institutional Setups</p>
            </div>
            <button onClick={() => openSignalEditor()} className="px-6 py-3 bg-brand-gold text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-brand-charcoal transition-colors">
              Initialize New Signal
            </button>
         </div>

         {/* EDITOR FORM */}
         {isCreatingSignal && (
           <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm animate-slide-up space-y-6 relative">
              <button onClick={() => setIsCreatingSignal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-black font-bold">✕</button>
              <h3 className="text-sm font-black text-brand-charcoal uppercase tracking-widest border-b border-gray-100 pb-4">
                {signalForm.id ? 'Edit Signal Protocol' : 'Signal Configuration Wizard'}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 {/* ... Input Fields ... */}
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-brand-muted uppercase tracking-widest">Market Sector</label>
                    <select className="w-full p-3 bg-gray-50 border rounded text-xs font-bold" value={signalForm.market} onChange={(e) => setSignalForm({...signalForm, market: e.target.value as any})}>
                      <option value="Forex">Forex & Metals</option>
                      <option value="Stocks">Stocks & Indices</option>
                    </select>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-brand-muted uppercase tracking-widest">Instrument</label>
                    <div className="relative">
                      <input 
                         list="instrument-list"
                         className="w-full p-3 bg-gray-50 border rounded text-xs font-bold" 
                         value={signalForm.instrument || ''} 
                         onChange={(e) => setSignalForm({...signalForm, instrument: e.target.value})}
                         placeholder="Type or Select..." 
                      />
                      <datalist id="instrument-list">
                        {activeInstruments.map(i => <option key={i.symbol} value={i.symbol} />)}
                      </datalist>
                    </div>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-brand-muted uppercase tracking-widest">Order Type</label>
                    <select className="w-full p-3 bg-gray-50 border rounded text-xs font-bold" value={signalForm.signalType} onChange={(e) => setSignalForm({...signalForm, signalType: e.target.value as any})}>
                      {['Buy', 'Sell', 'Buy Limit', 'Sell Limit', 'Buy Stop', 'Sell Stop'].map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                 </div>
                 <div className="space-y-2"><label className="text-[10px] font-black text-brand-muted uppercase tracking-widest">Entry</label><input type="number" step="any" className="w-full p-3 bg-gray-50 border rounded text-xs font-bold" value={signalForm.entry} onChange={(e) => setSignalForm({...signalForm, entry: e.target.value as any})} /></div>
                 <div className="space-y-2"><label className="text-[10px] font-black text-brand-muted uppercase tracking-widest">SL</label><input type="number" step="any" className="w-full p-3 bg-gray-50 border rounded text-xs font-bold" value={signalForm.stopLoss} onChange={(e) => setSignalForm({...signalForm, stopLoss: e.target.value as any})} /></div>
                 <div className="space-y-2"><label className="text-[10px] font-black text-brand-muted uppercase tracking-widest">TP</label><input type="number" step="any" className="w-full p-3 bg-gray-50 border rounded text-xs font-bold" value={signalForm.takeProfit} onChange={(e) => setSignalForm({...signalForm, takeProfit: e.target.value as any})} /></div>
              </div>

              {/* Audience Targeting */}
              <div className="pt-4 border-t border-gray-100 space-y-4">
                  <h4 className="text-xs font-black text-brand-charcoal uppercase tracking-widest">Target Audience</h4>
                  <div className="flex gap-6">
                      {['all_users', 'paid_users', 'specific_plans'].map(opt => (
                          <label key={opt} className="flex items-center gap-2 cursor-pointer">
                              <input 
                                  type="radio" 
                                  name="audience" 
                                  value={opt}
                                  checked={signalForm.audience === opt}
                                  onChange={() => setSignalForm({...signalForm, audience: opt as any, plans: []})}
                                  className="accent-brand-gold w-4 h-4"
                              />
                              <span className="text-[10px] font-bold uppercase tracking-wider">{opt.replace('_', ' ')}</span>
                          </label>
                      ))}
                  </div>
                  {signalForm.audience === 'specific_plans' && (
                      <div className="flex gap-4 pl-4 border-l-2 border-brand-gold ml-1">
                          {['Lite', 'Pro', 'Elite'].map(plan => (
                              <label key={plan} className="flex items-center gap-2 cursor-pointer">
                                  <input 
                                      type="checkbox"
                                      checked={signalForm.plans?.includes(plan)}
                                      onChange={(e) => {
                                          const current = signalForm.plans || [];
                                          if (e.target.checked) {
                                              setSignalForm({...signalForm, plans: [...current, plan]});
                                          } else {
                                              setSignalForm({...signalForm, plans: current.filter(p => p !== plan)});
                                          }
                                      }}
                                      className="accent-brand-charcoal w-4 h-4"
                                  />
                                  <span className="text-[10px] font-bold uppercase">{plan}</span>
                              </label>
                          ))}
                      </div>
                  )}
              </div>

              <div className="space-y-2">
                 <label className="text-[10px] font-black text-brand-muted uppercase tracking-widest">Analysis / Commentary</label>
                 <textarea 
                    className="w-full p-3 bg-gray-50 border rounded text-xs font-medium h-24"
                    placeholder="Provide technical context..."
                    value={signalForm.notes || ''}
                    onChange={(e) => setSignalForm({...signalForm, notes: e.target.value})}
                 />
              </div>

              <div className="flex justify-end gap-4 pt-6 border-t border-gray-100">
                 <button 
                    onClick={handleSignalSubmit} 
                    disabled={signalSubmitting}
                    className="px-8 py-3 bg-brand-success text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:scale-105 transition-transform disabled:opacity-50"
                 >
                    {signalSubmitting ? 'Processing...' : (signalForm.id ? 'Update Signal' : 'Publish Signal')}
                 </button>
              </div>
           </div>
         )}

         {/* LIFECYCLE MODAL */}
         {managingSignal && (
           <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
              <div className="bg-white rounded-2xl p-8 w-full max-w-lg space-y-6 animate-slide-up">
                 <div className="flex justify-between items-start border-b border-gray-100 pb-4">
                    <div>
                      <h3 className="text-lg font-black text-brand-charcoal uppercase tracking-tighter">Manage Signal Status</h3>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{managingSignal.instrument} • {managingSignal.signalType}</p>
                    </div>
                    <button onClick={() => setManagingSignal(null)} className="text-gray-400 hover:text-black font-bold">✕</button>
                 </div>
                 
                 <div className="space-y-4">
                    <label className="text-[10px] font-black text-brand-muted uppercase tracking-widest">Update Lifecycle State</label>
                    <select 
                       className="w-full p-4 bg-gray-50 border rounded-xl text-xs font-bold"
                       value={manageStatusOutcome.status}
                       onChange={(e) => setManageStatusOutcome({ ...manageStatusOutcome, status: e.target.value as SignalStatus })}
                    >
                       <option value="pending">Pending</option>
                       <option value="triggered">Triggered (Limit Hit)</option>
                       <option value="active">Active (Market Executed)</option>
                       <option disabled>──────────</option>
                       <option value="completed_tp">Completed - Take Profit (Win)</option>
                       <option value="completed_sl">Completed - Stop Loss (Loss)</option>
                       <option value="completed_be">Completed - Break Even</option>
                       <option value="cancelled">Cancelled</option>
                       <option value="expired">Expired</option>
                    </select>

                    {['completed_tp', 'completed_sl', 'completed_be'].includes(manageStatusOutcome.status) && (
                       <div className="space-y-4 animate-fade-in bg-brand-sage/5 p-4 rounded-xl border border-brand-sage/20">
                          <div className="space-y-2">
                             <label className="text-[10px] font-black text-brand-muted uppercase tracking-widest">Exit Price</label>
                             <input 
                               type="number" step="any"
                               className="w-full p-3 bg-white border rounded-lg text-xs"
                               value={manageStatusOutcome.exitPrice || ''}
                               onChange={(e) => setManageStatusOutcome({ ...manageStatusOutcome, exitPrice: parseFloat(e.target.value) })}
                               placeholder="Final price..."
                             />
                          </div>
                          <div className="space-y-2">
                             <label className="text-[10px] font-black text-brand-muted uppercase tracking-widest">Admin Outcome Comment</label>
                             <textarea 
                               className="w-full p-3 bg-white border rounded-lg text-xs"
                               value={manageStatusOutcome.comment || ''}
                               onChange={(e) => setManageStatusOutcome({ ...manageStatusOutcome, comment: e.target.value })}
                               placeholder="Why did it close? (e.g. News spike, Structure break)"
                             />
                          </div>
                       </div>
                    )}

                    <button 
                       onClick={handleLifecycleUpdate}
                       className="w-full py-4 bg-brand-charcoal text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-brand-gold transition-colors shadow-lg"
                    >
                       Confirm Status Update
                    </button>
                 </div>
              </div>
           </div>
         )}

         {/* Signal List */}
         <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
           <table className="w-full text-left">
             <thead className="bg-gray-50 border-b border-gray-200">
               <tr>
                 <th className="p-4 text-[9px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                 <th className="p-4 text-[9px] font-black text-gray-400 uppercase tracking-widest">Instrument</th>
                 <th className="p-4 text-[9px] font-black text-gray-400 uppercase tracking-widest">Type</th>
                 <th className="p-4 text-[9px] font-black text-gray-400 uppercase tracking-widest">Levels</th>
                 <th className="p-4 text-[9px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-gray-100">
               {signals.filter(s => !s.isDeleted).map(s => (
                 <tr key={s.id} className="hover:bg-gray-50">
                   <td className="p-4">
                      <span className={`px-2 py-1 rounded text-[9px] font-black uppercase tracking-wide ${
                        s.status === 'active' || s.status === 'triggered' ? 'bg-blue-100 text-blue-700' :
                        s.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        s.status.includes('completed_tp') ? 'bg-green-100 text-green-700' :
                        s.status.includes('completed_sl') ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-500'
                      }`}>
                        {s.status.replace(/_/g, ' ')}
                      </span>
                      {s.triggeredAt && <div className="text-[8px] text-gray-400 mt-1 font-mono">Trig: {new Date(s.triggeredAt).toLocaleTimeString()}</div>}
                   </td>
                   <td className="p-4">
                      <div className="text-xs font-bold text-gray-900">{s.instrument}</div>
                      <div className="text-[9px] text-gray-400 font-mono">{new Date(s.timestamp).toLocaleDateString()}</div>
                   </td>
                   <td className="p-4 text-[10px] font-bold text-gray-700">{s.signalType}</td>
                   <td className="p-4 text-[10px] font-mono text-gray-600">
                      <div>E: {s.entry}</div>
                      <div className="text-red-600">SL: {s.stopLoss}</div>
                      <div className="text-green-600">TP: {s.takeProfit}</div>
                   </td>
                   <td className="p-4 text-right flex justify-end gap-2 items-center">
                      <button 
                        onClick={() => { setManagingSignal(s); setManageStatusOutcome({ status: s.status as SignalStatus }); }}
                        className="px-3 py-1.5 border border-gray-200 rounded-lg text-[9px] font-bold uppercase hover:bg-gray-100 text-gray-600"
                      >
                        Status
                      </button>
                      <button 
                        onClick={() => openSignalEditor(s)}
                        className="px-3 py-1.5 bg-brand-charcoal text-white rounded-lg text-[9px] font-bold uppercase hover:bg-brand-gold"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleSoftDelete(s.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                   </td>
                 </tr>
               ))}
             </tbody>
           </table>
         </div>
      </div>
    );
  };

  const renderOverview = () => {
    if (!overviewMetrics) return <div className="p-10 text-center text-xs text-gray-400 font-bold uppercase tracking-widest">Loading Mission Control...</div>;
    return (
      <div className="space-y-10 animate-fade-in">
        <div className="flex justify-between items-end border-b border-gray-200 pb-6">
          <div>
            <h2 className="text-2xl font-black text-gray-800 uppercase tracking-tight">Mission Control</h2>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Platform Health & Growth Vectors</p>
          </div>
          <button onClick={refreshData} className="text-[9px] font-black text-brand-gold uppercase tracking-widest hover:underline">Refresh Data</button>
        </div>

        {/* TOP ROW: USER METRICS */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
           <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden">
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Total Users</p>
              <p className="text-4xl font-black text-gray-900">{overviewMetrics.users.total}</p>
              <div className="mt-4 flex items-center gap-2">
                 <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded">+{overviewMetrics.users.newLast7Days}</span>
                 <span className="text-[9px] text-gray-400 font-medium uppercase">Last 7 Days</span>
              </div>
           </div>
           
           <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden">
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Paid Members</p>
              <p className="text-4xl font-black text-brand-gold">{overviewMetrics.users.paid}</p>
              <div className="mt-4 flex items-center gap-2">
                 <div className="h-1.5 flex-1 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-brand-gold" style={{ width: `${(overviewMetrics.users.paid / (overviewMetrics.users.total || 1)) * 100}%` }}></div>
                 </div>
                 <span className="text-[9px] font-bold text-gray-500">{((overviewMetrics.users.paid / (overviewMetrics.users.total || 1)) * 100).toFixed(0)}% Conv.</span>
              </div>
           </div>

           <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden">
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-4">Subscription Tiers</p>
              <div className="space-y-3">
                 <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-gray-600 uppercase">Lite</span>
                    <span className="text-xs font-black text-gray-900">{overviewMetrics.users.byPlan.lite}</span>
                 </div>
                 <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-brand-gold uppercase">Pro</span>
                    <span className="text-xs font-black text-gray-900">{overviewMetrics.users.byPlan.pro}</span>
                 </div>
                 <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-gray-900 uppercase">Elite</span>
                    <span className="text-xs font-black text-gray-900">{overviewMetrics.users.byPlan.elite}</span>
                 </div>
              </div>
           </div>

           <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden">
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Active Engagement</p>
              <div className="flex flex-col gap-4 mt-2">
                 <div>
                    <span className="text-2xl font-black text-gray-900">{overviewMetrics.engagement.active24h}</span>
                    <span className="text-[9px] text-gray-400 font-bold uppercase ml-2">Users (24h)</span>
                 </div>
              </div>
           </div>
        </div>
      </div>
    );
  };

  const renderUsers = () => (
    <div className="space-y-10 animate-fade-in">
      <div className="flex justify-between items-end border-b border-gray-200 pb-6">
        <div>
          <h2 className="text-2xl font-black text-gray-800 uppercase tracking-tight">User Management</h2>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Manage Identities & Access</p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm overflow-x-auto">
        <table className="w-full text-left min-w-[800px]">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="p-4 text-[9px] font-black text-gray-400 uppercase tracking-widest">User Identity</th>
              <th className="p-4 text-[9px] font-black text-gray-400 uppercase tracking-widest">Plan Status</th>
              <th className="p-4 text-[9px] font-black text-gray-400 uppercase tracking-widest">Tokens (A/E)</th>
              <th className="p-4 text-[9px] font-black text-gray-400 uppercase tracking-widest">Account State</th>
              <th className="p-4 text-[9px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map(u => (
              <tr key={u.uid} className="hover:bg-gray-50">
                <td className="p-4">
                  <p className="text-xs font-bold text-gray-900">{u.fullName}</p>
                  <p className="text-[10px] text-gray-500 font-mono">{u.email}</p>
                </td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-[9px] font-black uppercase ${
                    u.subscriptionPlan === 'Elite' ? 'bg-brand-gold/10 text-brand-gold' : 
                    u.subscriptionPlan === 'Pro' ? 'bg-brand-charcoal/10 text-brand-charcoal' : 
                    'bg-gray-100 text-gray-500'
                  }`}>
                    {u.subscriptionPlan}
                  </span>
                </td>
                <td className="p-4 text-xs font-mono font-medium">
                  {u.analysisTokens} / {u.educationTokens}
                </td>
                <td className="p-4">
                  <span className={`text-[9px] font-black uppercase ${u.accountStatus === 'suspended' ? 'text-red-600' : 'text-green-600'}`}>
                    {u.accountStatus}
                  </span>
                </td>
                <td className="p-4 text-right flex justify-end gap-2">
                  <button onClick={() => { setSelectedUser(u); setActionType('edit'); }} className="px-3 py-1 border rounded text-[9px] font-bold uppercase hover:bg-gray-50">Manage</button>
                  <button onClick={() => { setSelectedUser(u); setActionType('tokens'); }} className="px-3 py-1 bg-brand-gold text-white rounded text-[9px] font-bold uppercase hover:brightness-110">Tokens</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-8 rounded-2xl w-full max-w-lg space-y-6 animate-slide-up">
            <div className="flex justify-between items-center border-b pb-4">
              <h3 className="font-black uppercase tracking-widest text-lg">Manage User</h3>
              <button onClick={() => { setSelectedUser(null); setActionType(null); }} className="text-gray-400 hover:text-black">✕</button>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-xl mb-4">
              <p className="text-xs font-bold">{selectedUser.fullName}</p>
              <p className="text-[10px] text-gray-500">{selectedUser.email}</p>
            </div>

            {actionType === 'edit' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase text-gray-500">Subscription Plan</label>
                  <div className="flex gap-2">
                    {[SubscriptionPlan.LITE, SubscriptionPlan.PRO, SubscriptionPlan.ELITE].map(plan => (
                      <button 
                        key={plan}
                        onClick={() => handleUpdateSubscription(plan)}
                        className={`flex-1 py-3 text-[10px] font-black uppercase rounded border ${
                          selectedUser.subscriptionPlan === plan ? 'bg-brand-charcoal text-white border-brand-charcoal' : 'text-gray-500 hover:border-brand-gold'
                        }`}
                      >
                        {plan}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="pt-4 border-t">
                  <button 
                    onClick={handleToggleSuspension}
                    className={`w-full py-3 font-bold text-xs uppercase rounded ${
                      selectedUser.accountStatus === 'suspended' ? 'bg-green-600 text-white' : 'bg-red-50 text-red-600 border border-red-200'
                    }`}
                  >
                    {selectedUser.accountStatus === 'suspended' ? 'Reactivate Account' : 'Suspend Account'}
                  </button>
                </div>
              </div>
            )}

            {actionType === 'tokens' && (
              <div className="space-y-4">
                <div className="flex gap-2 mb-4">
                  <button onClick={() => setTokenType('analysis')} className={`flex-1 py-2 text-[10px] font-black uppercase rounded ${tokenType === 'analysis' ? 'bg-brand-gold text-white' : 'bg-gray-100'}`}>Analysis</button>
                  <button onClick={() => setTokenType('education')} className={`flex-1 py-2 text-[10px] font-black uppercase rounded ${tokenType === 'education' ? 'bg-brand-gold text-white' : 'bg-gray-100'}`}>Education</button>
                </div>
                <input 
                  type="number" 
                  value={tokenAmount} 
                  onChange={e => setTokenAmount(Number(e.target.value))}
                  placeholder="Amount"
                  className="w-full p-4 bg-gray-50 border rounded text-lg font-mono"
                />
                <button onClick={handleGrantTokens} className="w-full py-4 bg-brand-success text-white rounded font-black uppercase text-xs">Grant Tokens</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );

  const renderRevenue = () => {
    if (!revenueMetrics) return <div className="p-10 text-center">Loading Financials...</div>;
    return (
      <div className="space-y-10 animate-fade-in">
        <div className="border-b border-gray-200 pb-6">
          <h2 className="text-2xl font-black text-gray-800 uppercase tracking-tight">Revenue Analytics</h2>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Monthly Recurring Revenue & Token Sales</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <div className="bg-brand-charcoal text-white p-8 rounded-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-brand-gold/10 rounded-full -mr-10 -mt-10"></div>
              <p className="text-[10px] font-black text-brand-gold uppercase tracking-widest mb-2">Estimated MRR</p>
              <p className="text-4xl font-black">${revenueMetrics.mrr.toLocaleString()}</p>
              <p className="text-[10px] text-white/50 mt-4 font-bold uppercase">{revenueMetrics.activeSubscriptions} Active Subs</p>
           </div>
           
           <div className="bg-white p-8 rounded-xl border border-gray-200">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Token Revenue (30d)</p>
              <p className="text-4xl font-black text-brand-success">${revenueMetrics.tokenRevenue.last30Days.toLocaleString()}</p>
              <p className="text-[10px] text-gray-400 mt-4 font-bold uppercase">Lifetime: ${revenueMetrics.tokenRevenue.totalLifetime.toLocaleString()}</p>
           </div>

           <div className="bg-white p-8 rounded-xl border border-gray-200">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Plan Distribution</p>
              <div className="space-y-2">
                 <div className="flex justify-between text-xs font-bold"><span className="text-gray-500">Lite</span><span>${revenueMetrics.breakdown.lite.revenue}</span></div>
                 <div className="flex justify-between text-xs font-bold"><span className="text-brand-gold">Pro</span><span>${revenueMetrics.breakdown.pro.revenue}</span></div>
                 <div className="flex justify-between text-xs font-bold"><span className="text-brand-charcoal">Elite</span><span>${revenueMetrics.breakdown.elite.revenue}</span></div>
              </div>
           </div>
        </div>
      </div>
    );
  };

  const renderAIOversight = () => {
    if (!aiMetrics) return <div className="p-10 text-center">Loading Neural Stats...</div>;
    return (
      <div className="space-y-10 animate-fade-in">
        <div className="flex justify-between items-end border-b border-gray-200 pb-6">
          <div>
            <h2 className="text-2xl font-black text-gray-800 uppercase tracking-tight">AI Neural Oversight</h2>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Monitor Model Performance & Strategy Logic</p>
          </div>
          <div className="flex items-center gap-4">
             <span className={`text-[10px] font-black uppercase tracking-widest ${aiMetrics.learningStatus === 'active' ? 'text-green-600' : 'text-red-600'}`}>
                Status: {aiMetrics.learningStatus}
             </span>
             <button 
               onClick={handleToggleAILearning}
               className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest text-white shadow-lg transition-all ${
                 aiMetrics.learningStatus === 'active' ? 'bg-red-500 hover:bg-red-600' : 'bg-green-600 hover:bg-green-700'
               }`}
             >
               {aiMetrics.learningStatus === 'active' ? 'Pause Learning' : 'Resume Learning'}
             </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
           <div className="bg-white p-6 rounded-xl border border-gray-200">
              <p className="text-[9px] font-black text-brand-muted uppercase tracking-widest mb-2">Total Analyses</p>
              <p className="text-3xl font-black text-brand-charcoal">{aiMetrics.totalAnalyses}</p>
           </div>
           <div className="bg-white p-6 rounded-xl border border-gray-200">
              <p className="text-[9px] font-black text-brand-muted uppercase tracking-widest mb-2">Last 24 Hours</p>
              <p className="text-3xl font-black text-brand-gold">{aiMetrics.last24h}</p>
           </div>
           <div className="bg-white p-6 rounded-xl border border-gray-200">
              <p className="text-[9px] font-black text-brand-muted uppercase tracking-widest mb-2">High Confidence %</p>
              <p className="text-3xl font-black text-brand-charcoal">
                 {((Number(aiMetrics.confidenceDistribution?.high || 0) / (Number(aiMetrics.totalAnalyses) || 1)) * 100).toFixed(1)}%
              </p>
           </div>
           <div className="bg-white p-6 rounded-xl border border-gray-200">
              <p className="text-[9px] font-black text-brand-muted uppercase tracking-widest mb-2">Top Instrument</p>
              <p className="text-xl font-black text-brand-charcoal">{aiMetrics.popularInstruments[0]?.symbol || 'N/A'}</p>
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           <div className="bg-white p-8 rounded-xl border border-gray-200">
              <h4 className="text-xs font-black text-brand-charcoal uppercase tracking-widest mb-6">Strategy Distribution</h4>
              <div className="space-y-4">
                 {Object.entries(aiMetrics.strategyDistribution).map(([key, count]) => (
                    <div key={key}>
                       <div className="flex justify-between text-[10px] font-bold text-gray-500 uppercase mb-1">
                          <span>{key.replace(/_/g, ' ')}</span>
                          <span>{count}</span>
                       </div>
                       <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-brand-gold" 
                            style={{ width: `${(Number(count) / (aiMetrics.totalAnalyses || 1)) * 100}%` }}
                          ></div>
                       </div>
                    </div>
                 ))}
              </div>
           </div>

           <div className="bg-white p-8 rounded-xl border border-gray-200">
              <h4 className="text-xs font-black text-brand-charcoal uppercase tracking-widest mb-6">Popular Instruments</h4>
              <div className="space-y-4">
                 {aiMetrics.popularInstruments.map((item, i) => (
                    <div key={item.symbol} className="flex items-center gap-4">
                       <span className="w-4 text-[10px] font-bold text-gray-400">{i + 1}</span>
                       <div className="flex-1">
                          <div className="flex justify-between text-[10px] font-bold text-gray-600 uppercase mb-1">
                             <span>{item.symbol}</span>
                             <span>{item.count}</span>
                          </div>
                          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                             <div className="h-full bg-brand-charcoal" style={{ width: `${(Number(item.count) / (aiMetrics.popularInstruments[0]?.count || 1)) * 100}%` }}></div>
                          </div>
                       </div>
                    </div>
                 ))}
              </div>
           </div>
        </div>
      </div>
    );
  };

  const renderTokens = () => {
    if (!tokenConfig) return <div className="p-10 text-center">Loading Economy Config...</div>;
    return (
      <div className="space-y-10 animate-fade-in">
         <div className="flex justify-between items-end border-b border-gray-200 pb-6">
            <div>
              <h2 className="text-2xl font-black text-gray-800 uppercase tracking-tight">Token Economy</h2>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Manage Allocation & Pricing Logic</p>
            </div>
            <button onClick={handleSaveTokenConfig} className="px-6 py-3 bg-brand-gold text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg">Save Configuration</button>
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {['lite', 'pro', 'elite'].map((tier) => (
               <div key={tier} className="bg-white p-8 rounded-xl border border-gray-200 space-y-6">
                  <h4 className="text-lg font-black text-brand-charcoal uppercase tracking-widest border-b border-gray-100 pb-4">{tier} Tier</h4>
                  <div className="space-y-4">
                     <div>
                        <label className="text-[9px] font-bold text-brand-muted uppercase">Analysis Allocation</label>
                        <input 
                          type="number" 
                          className="w-full p-3 bg-gray-50 border rounded mt-1 font-mono text-sm"
                          value={tokenConfig.allocations[tier as keyof typeof tokenConfig.allocations].analysis}
                          onChange={(e) => setTokenConfig({
                             ...tokenConfig,
                             allocations: {
                                ...tokenConfig.allocations,
                                [tier]: { ...tokenConfig.allocations[tier as keyof typeof tokenConfig.allocations], analysis: parseInt(e.target.value) }
                             }
                          })}
                        />
                     </div>
                     <div>
                        <label className="text-[9px] font-bold text-brand-muted uppercase">Education Allocation</label>
                        <input 
                          type="number" 
                          className="w-full p-3 bg-gray-50 border rounded mt-1 font-mono text-sm"
                          value={tokenConfig.allocations[tier as keyof typeof tokenConfig.allocations].education}
                          onChange={(e) => setTokenConfig({
                             ...tokenConfig,
                             allocations: {
                                ...tokenConfig.allocations,
                                [tier]: { ...tokenConfig.allocations[tier as keyof typeof tokenConfig.allocations], education: parseInt(e.target.value) }
                             }
                          })}
                        />
                     </div>
                  </div>
               </div>
            ))}
         </div>

         <div className="bg-white p-8 rounded-xl border border-gray-200 max-w-2xl">
            <h4 className="text-xs font-black text-brand-charcoal uppercase tracking-widest mb-6">Refill Pricing (USD)</h4>
            <div className="grid grid-cols-2 gap-8">
               <div>
                  <label className="text-[9px] font-bold text-brand-muted uppercase">Analysis (Per 20 Tokens)</label>
                  <input 
                    type="number" step="0.01"
                    className="w-full p-3 bg-gray-50 border rounded mt-1 font-mono text-sm"
                    value={tokenConfig.refillPricing.analysis}
                    onChange={(e) => setTokenConfig({ ...tokenConfig, refillPricing: { ...tokenConfig.refillPricing, analysis: parseFloat(e.target.value) } })}
                  />
               </div>
               <div>
                  <label className="text-[9px] font-bold text-brand-muted uppercase">Education (Per 500 Tokens)</label>
                  <input 
                    type="number" step="0.01"
                    className="w-full p-3 bg-gray-50 border rounded mt-1 font-mono text-sm"
                    value={tokenConfig.refillPricing.education}
                    onChange={(e) => setTokenConfig({ ...tokenConfig, refillPricing: { ...tokenConfig.refillPricing, education: parseFloat(e.target.value) } })}
                  />
               </div>
            </div>
         </div>
      </div>
    );
  };

  const renderSystem = () => {
    if (!systemHealth) return <div className="p-10 text-center">Scanning System...</div>;
    return (
      <div className="space-y-10 animate-fade-in">
         <div className="flex justify-between items-end border-b border-gray-200 pb-6">
            <div>
              <h2 className="text-2xl font-black text-gray-800 uppercase tracking-tight">System Health</h2>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Real-time Infrastructure Monitoring</p>
            </div>
            <button onClick={refreshData} className="text-[9px] font-black text-brand-gold uppercase tracking-widest hover:underline">Re-Scan</button>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-8 rounded-xl border border-gray-200 flex items-center justify-between">
               <div>
                  <h4 className="text-xs font-black text-brand-charcoal uppercase tracking-widest">Firestore Database</h4>
                  <p className="text-[10px] text-gray-400 mt-1">Main Data Ledger</p>
               </div>
               <div className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest ${systemHealth.database === 'connected' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {systemHealth.database}
               </div>
            </div>
            <div className="bg-white p-8 rounded-xl border border-gray-200 flex items-center justify-between">
               <div>
                  <h4 className="text-xs font-black text-brand-charcoal uppercase tracking-widest">Market Data API</h4>
                  <p className="text-[10px] text-gray-400 mt-1">Live Price Feeds</p>
               </div>
               <div className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest ${systemHealth.forexApi === 'operational' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                  {systemHealth.forexApi}
               </div>
            </div>
            <div className="bg-white p-8 rounded-xl border border-gray-200 flex items-center justify-between">
               <div>
                  <h4 className="text-xs font-black text-brand-charcoal uppercase tracking-widest">Google AI</h4>
                  <p className="text-[10px] text-gray-400 mt-1">Neural Processing</p>
               </div>
               <div className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest ${systemHealth.aiApi === 'operational' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {systemHealth.aiApi}
               </div>
            </div>
         </div>
         <p className="text-[10px] text-gray-400 font-mono text-center">Last Scan: {new Date(systemHealth.lastCheck).toLocaleString()}</p>
      </div>
    );
  };

  const renderAudit = () => (
    <div className="space-y-10 animate-fade-in">
       <div className="border-b border-gray-200 pb-6">
          <h2 className="text-2xl font-black text-gray-800 uppercase tracking-tight">Security Audit Log</h2>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Immutable Record of Admin Actions</p>
       </div>
       <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-left">
             <thead className="bg-gray-50 border-b border-gray-200">
               <tr>
                 <th className="p-4 text-[9px] font-black text-gray-400 uppercase tracking-widest">Timestamp</th>
                 <th className="p-4 text-[9px] font-black text-gray-400 uppercase tracking-widest">Admin</th>
                 <th className="p-4 text-[9px] font-black text-gray-400 uppercase tracking-widest">Action</th>
                 <th className="p-4 text-[9px] font-black text-gray-400 uppercase tracking-widest">Details</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-gray-100">
               {auditLogs.map(log => (
                 <tr key={log.id} className="hover:bg-gray-50">
                    <td className="p-4 text-[10px] font-mono text-gray-500">{new Date(log.timestamp).toLocaleString()}</td>
                    <td className="p-4 text-xs font-bold text-brand-charcoal">{log.adminName}</td>
                    <td className="p-4 text-[10px] font-black uppercase text-brand-gold">{log.action}</td>
                    <td className="p-4 text-xs text-gray-600">{log.details}</td>
                 </tr>
               ))}
             </tbody>
          </table>
       </div>
    </div>
  );

  const renderEducation = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
         <h2 className="text-lg font-black text-gray-800 uppercase tracking-widest">Education Library</h2>
         <button onClick={() => setEditingLesson({ title: '', content: [] })} className="px-4 py-2 bg-brand-gold text-white text-[10px] font-black uppercase tracking-widest rounded-lg">New Module</button>
       </div>
       <div className="space-y-3">
         {lessons.map(l => (
           <div key={l.id} className="p-4 bg-white border border-gray-200 rounded-xl flex justify-between">
             <div className="text-xs font-bold text-gray-800">{l.title}</div>
             <div className="flex gap-2">
                <button onClick={() => setEditingLesson(l)} className="text-[9px] font-bold text-brand-gold uppercase">Edit</button>
                <button onClick={() => handleLessonAction('delete', l)} className="text-[9px] font-bold text-red-500 uppercase">Delete</button>
             </div>
           </div>
         ))}
       </div>
       {editingLesson && (
         <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
           <div className="bg-white p-8 rounded-2xl w-full max-w-lg space-y-6">
             <h3 className="font-black uppercase tracking-widest">Edit Module</h3>
             <input className="w-full p-3 bg-gray-50 border rounded text-xs" placeholder="Title" value={editingLesson.title} onChange={e => setEditingLesson({...editingLesson, title: e.target.value})} />
             <input className="w-full p-3 bg-gray-50 border rounded text-xs" placeholder="Category" value={editingLesson.category || ''} onChange={e => setEditingLesson({...editingLesson, category: e.target.value})} />
             <textarea className="w-full p-3 bg-gray-50 border rounded text-xs min-h-[100px]" placeholder="Content paragraphs (one per line)..." value={editingLesson.content?.join('\n')} onChange={e => setEditingLesson({...editingLesson, content: e.target.value.split('\n')})} />
             <div className="flex gap-4">
               <button onClick={() => setEditingLesson(null)} className="flex-1 py-3 border rounded text-xs font-bold uppercase">Cancel</button>
               <button onClick={() => handleLessonAction(editingLesson.id ? 'update' : 'create', editingLesson)} className="flex-1 py-3 bg-brand-gold text-white rounded text-xs font-bold uppercase">Save</button>
             </div>
           </div>
         </div>
       )}
    </div>
  );

  // --- MAIN RENDER ---
  return (
    <div className="flex h-screen bg-gray-50 font-sans text-gray-900">
      <AdminSidebar active={activeTab} onSelect={setActiveTab} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <AdminHeader user={user} onLogout={onLogout} />
        <main className="flex-1 overflow-auto p-8">
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'users' && renderUsers()}
          {activeTab === 'revenue' && renderRevenue()}
          {activeTab === 'signals' && renderSignals()}
          {activeTab === 'education' && renderEducation()}
          {activeTab === 'ai_oversight' && renderAIOversight()}
          {activeTab === 'tokens' && renderTokens()}
          {activeTab === 'system' && renderSystem()}
          {activeTab === 'audit_log' && renderAudit()}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;