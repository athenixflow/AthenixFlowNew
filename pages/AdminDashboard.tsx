import React, { useState, useEffect } from 'react';
import { UserProfile, Subscription, TradeAnalysis, Referral, TradingSignal, TokenTransaction } from '../types';
import { 
  subscribeToUsers, 
  subscribeToSubscriptions, 
  subscribeToAnalysisHistory, 
  subscribeToReferrals, 
  subscribeToSystemLogs,
  subscribeToSignals,
  subscribeToTokenTransactions,
  adminAddTokens,
  checkDatabaseConnection
} from '../services/firestore';
import { ICONS } from '../constants';
import SignalsControlCenter from '../components/SignalsControlCenter';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';

const safeRender = (val: any, fallback = "N/A"): string => {
  if (val === null || val === undefined) return fallback;
  if (typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean') return String(val);
  if (Array.isArray(val)) return val.map(v => safeRender(v, fallback)).join(', ');
  if (typeof val === 'object') return JSON.stringify(val);
  return fallback;
};

interface AdminDashboardProps {
  user: UserProfile | null;
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ user, onNavigate, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'USERS' | 'REVENUE' | 'SIGNALS' | 'AI_ANALYTICS' | 'REFERRALS' | 'SYSTEM_HEALTH'>('OVERVIEW');
  
  // Real-time data state
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [analyses, setAnalyses] = useState<TradeAnalysis[]>([]);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [signals, setSignals] = useState<TradingSignal[]>([]);
  const [systemLogs, setSystemLogs] = useState<any[]>([]);
  const [tokenTransactions, setTokenTransactions] = useState<TokenTransaction[]>([]);
  const [dbStatus, setDbStatus] = useState<boolean>(true);
  const [apiStatus, setApiStatus] = useState<boolean>(true);

  // Token Modal State
  const [isTokenModalOpen, setIsTokenModalOpen] = useState(false);
  const [selectedUserForToken, setSelectedUserForToken] = useState<UserProfile | null>(null);
  const [tokenAmount, setTokenAmount] = useState<number>(0);
  const [tokenReason, setTokenReason] = useState<string>('');

  // User Detail Modal State
  const [selectedUserDetail, setSelectedUserDetail] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (user?.role !== 'ADMIN') {
      onNavigate('DASHBOARD');
      return;
    }

    const unsubUsers = subscribeToUsers(setUsers);
    const unsubSubs = subscribeToSubscriptions(setSubscriptions);
    const unsubAnalyses = subscribeToAnalysisHistory(setAnalyses);
    const unsubReferrals = subscribeToReferrals(setReferrals);
    const unsubLogs = subscribeToSystemLogs(setSystemLogs);
    const unsubSignals = subscribeToSignals(setSignals);
    const unsubTokens = subscribeToTokenTransactions(setTokenTransactions);

    checkDatabaseConnection().then(setDbStatus);
    
    // Simple mock ping for API status
    fetch('/').then(res => setApiStatus(res.ok)).catch(() => setApiStatus(false));

    return () => {
      unsubUsers();
      unsubSubs();
      unsubAnalyses();
      unsubReferrals();
      unsubLogs();
      unsubSignals();
      unsubTokens();
    };
  }, [user]);

  if (user?.role !== 'ADMIN') return null;

  // --- COMPUTED METRICS ---
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // Overview
  const totalUsers = users.length;
  const activeUsers24h = users.filter(u => u.lastActiveAt && new Date(u.lastActiveAt) >= oneDayAgo).length;
  const newUsersToday = users.filter(u => new Date(u.createdAt) >= oneDayAgo).length;
  const paidSubscribers = subscriptions.filter(s => s.status === 'active').length;
  const conversionRate = totalUsers > 0 ? ((paidSubscribers / totalUsers) * 100).toFixed(1) : '0';
  const totalAnalyses = analyses.length;
  const totalSignals = signals.length;
  const activeSignals = signals.filter(s => ['Pending', 'Triggered', 'Active'].includes(s.status)).length;
  const totalReferrals = referrals.length;
  const convertedReferrals = referrals.filter(r => r.status === 'subscribed').length;

  // Revenue
  const monthlyRevenue = subscriptions
    .filter(s => s.status === 'active' && new Date(s.currentPeriodStart) >= startOfMonth)
    .reduce((sum, s) => sum + (s.amount || 0), 0);
  const annualRevenue = subscriptions
    .filter(s => s.status === 'active')
    .reduce((sum, s) => sum + (s.amount || 0) * 12, 0); // Rough estimate
  const canceledSubs = subscriptions.filter(s => s.status === 'canceled').length;
  const churnRate = subscriptions.length > 0 ? ((canceledSubs / subscriptions.length) * 100).toFixed(1) : '0';

  // AI Analytics
  const analysesToday = analyses.filter(a => new Date(a.timestamp) >= oneDayAgo).length;
  
  const instrumentCounts = analyses.reduce((acc, a) => {
    acc[a.instrument] = (acc[a.instrument] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const topInstruments = Object.entries(instrumentCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const timeframeCounts = analyses.reduce((acc, a) => {
    acc[a.timeframe] = (acc[a.timeframe] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const topTimeframes = Object.entries(timeframeCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);

  // Referrals
  const referralConversionRate = totalReferrals > 0 ? ((convertedReferrals / totalReferrals) * 100).toFixed(1) : '0';
  const referrerCounts = referrals.reduce((acc, r) => {
    if (!acc[r.referrerId]) acc[r.referrerId] = { total: 0, converted: 0 };
    acc[r.referrerId].total++;
    if (r.status === 'subscribed') acc[r.referrerId].converted++;
    return acc;
  }, {} as Record<string, { total: number, converted: number }>);
  const topReferrers = Object.entries(referrerCounts)
    .sort((a, b) => b[1].converted - a[1].converted)
    .slice(0, 10)
    .map(([id, data]) => ({
      user: users.find(u => u.uid === id)?.fullName || id,
      ...data,
      rate: ((data.converted / data.total) * 100).toFixed(1)
    }));

  // Handlers
  const handleAddTokens = async () => {
    if (!selectedUserForToken || tokenAmount <= 0 || !tokenReason) return;
    await adminAddTokens(selectedUserForToken.uid, tokenAmount, tokenReason, user!.uid);
    setIsTokenModalOpen(false);
    setSelectedUserForToken(null);
    setTokenAmount(0);
    setTokenReason('');
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-brand-charcoal uppercase tracking-tighter">Admin Control Center</h2>
          <p className="text-sm text-brand-muted font-medium">Platform oversight and management.</p>
        </div>
        
        <div className="flex bg-brand-sage/10 p-1 rounded-xl overflow-x-auto">
          {['OVERVIEW', 'USERS', 'REVENUE', 'SIGNALS', 'AI_ANALYTICS', 'REFERRALS', 'SYSTEM_HEALTH'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                activeTab === tab ? 'bg-white text-brand-charcoal shadow-sm' : 'text-brand-muted hover:text-brand-gold'
              }`}
            >
              {tab.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === 'OVERVIEW' && (
        <div className="space-y-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard label="Total Users" value={totalUsers} icon={ICONS.User} />
            <MetricCard label="Active Users (24h)" value={activeUsers24h} icon={ICONS.Chart} />
            <MetricCard label="New Users Today" value={newUsersToday} icon={ICONS.User} />
            <MetricCard label="Paid Subscribers" value={paidSubscribers} icon={ICONS.Check} color="text-brand-success" />
            <MetricCard label="Conversion Rate" value={`${conversionRate}%`} icon={ICONS.Target} />
            <MetricCard label="AI Analyses" value={totalAnalyses} icon={ICONS.Chart} />
            <MetricCard label="Active Signals" value={activeSignals} icon={ICONS.Target} />
            <MetricCard label="Referral Conversions" value={convertedReferrals} icon={ICONS.Check} color="text-brand-success" />
          </div>
        </div>
      )}

      {/* USERS TAB */}
      {activeTab === 'USERS' && (
        <div className="bg-white rounded-2xl border border-brand-sage/20 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-brand-sage/5">
                <th className="p-4 text-[10px] font-black text-brand-muted uppercase tracking-widest">User</th>
                <th className="p-4 text-[10px] font-black text-brand-muted uppercase tracking-widest">Plan</th>
                <th className="p-4 text-[10px] font-black text-brand-muted uppercase tracking-widest">Tokens</th>
                <th className="p-4 text-[10px] font-black text-brand-muted uppercase tracking-widest">Referrals</th>
                <th className="p-4 text-[10px] font-black text-brand-muted uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => {
                const userReferrals = referrals.filter(r => r.referrerId === u.uid).length;
                return (
                  <tr key={u.uid} className="border-t border-brand-sage/10 hover:bg-brand-sage/5">
                    <td className="p-4">
                      <p className="text-sm font-black text-brand-charcoal">{u.fullName}</p>
                      <p className="text-[10px] text-brand-muted">{u.email}</p>
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-1 bg-brand-sage/10 text-brand-charcoal text-[10px] font-black uppercase rounded">
                        {u.subscriptionPlan}
                      </span>
                    </td>
                    <td className="p-4 text-sm font-bold text-brand-charcoal">{u.tokens || 0}</td>
                    <td className="p-4 text-sm font-bold text-brand-charcoal">{userReferrals}</td>
                    <td className="p-4 text-right flex justify-end gap-2">
                      <button 
                        onClick={() => setSelectedUserDetail(u)}
                        className="px-3 py-1 bg-brand-sage/20 text-brand-charcoal text-[10px] font-black uppercase rounded hover:bg-brand-sage/30"
                      >
                        View
                      </button>
                      <button 
                        onClick={() => { setSelectedUserForToken(u); setIsTokenModalOpen(true); }}
                        className="px-3 py-1 bg-brand-gold text-white text-[10px] font-black uppercase rounded hover:bg-brand-gold/90"
                      >
                        Add Tokens
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* REVENUE TAB */}
      {activeTab === 'REVENUE' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <MetricCard label="Monthly Revenue" value={`$${monthlyRevenue}`} icon={ICONS.Chart} color="text-brand-success" />
            <MetricCard label="Annual Revenue (Est)" value={`$${annualRevenue}`} icon={ICONS.Chart} color="text-brand-success" />
            <MetricCard label="Active Subs" value={paidSubscribers} icon={ICONS.User} />
            <MetricCard label="Churn Rate" value={`${churnRate}%`} icon={ICONS.Target} color="text-brand-error" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-2xl border border-brand-sage/20">
              <h3 className="text-lg font-black text-brand-charcoal uppercase tracking-tighter mb-4">Revenue Trends</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={
                    // Group subscriptions by month
                    Object.entries(subscriptions.reduce((acc, sub) => {
                      const month = new Date(sub.createdAt).toLocaleString('default', { month: 'short', year: 'numeric' });
                      acc[month] = (acc[month] || 0) + (sub.amount || 0);
                      return acc;
                    }, {} as Record<string, number>)).map(([name, value]) => ({ name, value }))
                  }>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" tick={{fontSize: 10}} />
                    <YAxis tick={{fontSize: 10}} />
                    <Tooltip />
                    <Line type="monotone" dataKey="value" stroke="#F2A900" strokeWidth={2} dot={{r: 4}} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-brand-sage/20">
              <h3 className="text-lg font-black text-brand-charcoal uppercase tracking-tighter mb-4">Plan Distribution</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={
                        Object.entries(subscriptions.reduce((acc, sub) => {
                          if (sub.status === 'active') {
                            acc[sub.plan] = (acc[sub.plan] || 0) + 1;
                          }
                          return acc;
                        }, {} as Record<string, number>)).map(([name, value]) => ({ name, value }))
                      }
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {
                        Object.entries(subscriptions.reduce((acc, sub) => {
                          if (sub.status === 'active') {
                            acc[sub.plan] = (acc[sub.plan] || 0) + 1;
                          }
                          return acc;
                        }, {} as Record<string, number>)).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={['#141414', '#F2A900', '#E4E3E0'][index % 3]} />
                        ))
                      }
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-brand-sage/20">
            <h3 className="text-lg font-black text-brand-charcoal uppercase tracking-tighter mb-4">Recent Subscriptions</h3>
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] font-black text-brand-muted uppercase tracking-widest border-b border-brand-sage/10">
                  <th className="pb-2">User</th>
                  <th className="pb-2">Plan</th>
                  <th className="pb-2">Amount</th>
                  <th className="pb-2">Status</th>
                  <th className="pb-2">Date</th>
                </tr>
              </thead>
              <tbody>
                {subscriptions.slice(0, 10).map(sub => (
                  <tr key={sub.id} className="border-b border-brand-sage/5">
                    <td className="py-3 text-sm font-bold">{users.find(u => u.uid === sub.userId)?.fullName || 'Unknown'}</td>
                    <td className="py-3 text-sm">{sub.plan}</td>
                    <td className="py-3 text-sm text-brand-success font-bold">${sub.amount}</td>
                    <td className="py-3 text-[10px] uppercase font-bold">{sub.status}</td>
                    <td className="py-3 text-xs text-brand-muted">{new Date(sub.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SIGNALS TAB */}
      {activeTab === 'SIGNALS' && (
        <SignalsControlCenter user={user} />
      )}

      {/* AI ANALYTICS TAB */}
      {activeTab === 'AI_ANALYTICS' && (
        <div className="space-y-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard label="Total Analyses" value={totalAnalyses} icon={ICONS.Target} />
            <MetricCard label="Analyses Today" value={analysesToday} icon={ICONS.Chart} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-2xl border border-brand-sage/20">
              <h3 className="text-lg font-black text-brand-charcoal uppercase tracking-tighter mb-4">Top Instruments</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topInstruments.map(([name, value]) => ({ name, value }))} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis type="number" tick={{fontSize: 10}} />
                    <YAxis dataKey="name" type="category" tick={{fontSize: 10}} width={80} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#141414" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-brand-sage/20">
              <h3 className="text-lg font-black text-brand-charcoal uppercase tracking-tighter mb-4">Top Timeframes</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={topTimeframes.map(([name, value]) => ({ name, value }))}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {topTimeframes.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={['#141414', '#F2A900', '#E4E3E0', '#5A5A40', '#9e9e9e'][index % 5]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* REFERRALS TAB */}
      {activeTab === 'REFERRALS' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <MetricCard label="Total Referrals" value={totalReferrals} icon={ICONS.User} />
            <MetricCard label="Converted" value={convertedReferrals} icon={ICONS.Check} color="text-brand-success" />
            <MetricCard label="Conversion Rate" value={`${referralConversionRate}%`} icon={ICONS.Target} />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-2xl border border-brand-sage/20">
              <h3 className="text-lg font-black text-brand-charcoal uppercase tracking-tighter mb-4">Referral Growth</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={
                    Object.entries(referrals.reduce((acc, ref) => {
                      const month = new Date(ref.timestamp).toLocaleString('default', { month: 'short', year: 'numeric' });
                      acc[month] = (acc[month] || 0) + 1;
                      return acc;
                    }, {} as Record<string, number>)).map(([name, value]) => ({ name, value }))
                  }>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" tick={{fontSize: 10}} />
                    <YAxis tick={{fontSize: 10}} />
                    <Tooltip />
                    <Line type="monotone" dataKey="value" stroke="#F2A900" strokeWidth={2} dot={{r: 4}} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-brand-sage/20">
              <h3 className="text-lg font-black text-brand-charcoal uppercase tracking-tighter mb-4">Top Referrers</h3>
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] font-black text-brand-muted uppercase tracking-widest border-b border-brand-sage/10">
                    <th className="pb-2">User</th>
                    <th className="pb-2">Total Referrals</th>
                    <th className="pb-2">Converted</th>
                    <th className="pb-2">Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {topReferrers.map((r, i) => (
                    <tr key={i} className="border-b border-brand-sage/5">
                      <td className="py-3 text-sm font-bold">{r.user}</td>
                      <td className="py-3 text-sm">{r.total}</td>
                      <td className="py-3 text-sm text-brand-success font-bold">{r.converted}</td>
                      <td className="py-3 text-sm font-bold">{r.rate}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SYSTEM HEALTH TAB */}
      {activeTab === 'SYSTEM_HEALTH' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-6 rounded-2xl border border-brand-sage/20 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black text-brand-muted uppercase tracking-widest">Database</p>
                <p className="text-lg font-black text-brand-charcoal">Firestore</p>
              </div>
              <div className={`w-3 h-3 rounded-full ${dbStatus ? 'bg-brand-success' : 'bg-brand-error'}`}></div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-brand-sage/20 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black text-brand-muted uppercase tracking-widest">API Status</p>
                <p className="text-lg font-black text-brand-charcoal">Market Data</p>
              </div>
              <div className={`w-3 h-3 rounded-full ${apiStatus ? 'bg-brand-success' : 'bg-brand-error'}`}></div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-brand-sage/20 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black text-brand-muted uppercase tracking-widest">AI Engine</p>
                <p className="text-lg font-black text-brand-charcoal">Operational</p>
              </div>
              <div className="w-3 h-3 rounded-full bg-brand-success"></div>
            </div>
          </div>

          <div className="bg-brand-charcoal p-6 rounded-2xl">
            <h3 className="text-lg font-black text-white uppercase tracking-tighter mb-4">System Logs</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto font-mono text-xs">
              {systemLogs.map(log => (
                <div key={log.id} className="flex gap-4 border-b border-white/10 pb-2">
                  <span className="text-brand-muted">{new Date(log.timestamp).toLocaleString()}</span>
                  <span className={`uppercase font-bold ${log.type === 'error' ? 'text-brand-error' : log.type === 'warning' ? 'text-brand-gold' : 'text-brand-success'}`}>
                    [{log.type}]
                  </span>
                  <span className="text-white">{log.message}</span>
                </div>
              ))}
              {systemLogs.length === 0 && <p className="text-brand-muted">No logs found.</p>}
            </div>
          </div>
        </div>
      )}

      {/* Token Modal */}
      {isTokenModalOpen && selectedUserForToken && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-xl font-black text-brand-charcoal uppercase tracking-tighter mb-4">Add Tokens</h3>
            <p className="text-sm text-brand-muted mb-4">User: <span className="font-bold text-brand-charcoal">{selectedUserForToken.fullName}</span></p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-brand-muted uppercase tracking-widest mb-1">Amount</label>
                <input 
                  type="number" 
                  value={tokenAmount} 
                  onChange={e => setTokenAmount(Number(e.target.value))}
                  className="w-full bg-brand-sage/10 border-none rounded-xl p-3 text-sm font-bold text-brand-charcoal focus:ring-2 focus:ring-brand-gold"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-brand-muted uppercase tracking-widest mb-1">Reason</label>
                <input 
                  type="text" 
                  value={tokenReason} 
                  onChange={e => setTokenReason(e.target.value)}
                  placeholder="e.g., Refund, Bonus"
                  className="w-full bg-brand-sage/10 border-none rounded-xl p-3 text-sm font-bold text-brand-charcoal focus:ring-2 focus:ring-brand-gold"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button 
                onClick={() => setIsTokenModalOpen(false)}
                className="flex-1 py-3 bg-brand-sage/10 text-brand-charcoal text-xs font-black uppercase tracking-widest rounded-xl hover:bg-brand-sage/20 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleAddTokens}
                disabled={tokenAmount <= 0 || !tokenReason}
                className="flex-1 py-3 bg-brand-gold text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-brand-gold/90 transition-colors disabled:opacity-50"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Detail Modal */}
      {selectedUserDetail && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-brand-charcoal uppercase tracking-tighter">User Details</h3>
              <button onClick={() => setSelectedUserDetail(null)} className="text-brand-muted hover:text-brand-charcoal">
                <ICONS.X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="space-y-4">
                <div>
                  <p className="text-[10px] font-black text-brand-muted uppercase tracking-widest">Name</p>
                  <p className="text-sm font-bold text-brand-charcoal">{selectedUserDetail.fullName}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-brand-muted uppercase tracking-widest">Email</p>
                  <p className="text-sm font-bold text-brand-charcoal">{selectedUserDetail.email}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-brand-muted uppercase tracking-widest">Joined</p>
                  <p className="text-sm font-bold text-brand-charcoal">{new Date(selectedUserDetail.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-[10px] font-black text-brand-muted uppercase tracking-widest">Plan</p>
                  <p className="text-sm font-bold text-brand-charcoal uppercase">{selectedUserDetail.subscriptionPlan}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-brand-muted uppercase tracking-widest">Tokens</p>
                  <p className="text-sm font-bold text-brand-charcoal">{selectedUserDetail.tokens || 0}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-brand-muted uppercase tracking-widest">Referral Code</p>
                  <p className="text-sm font-bold text-brand-charcoal">{selectedUserDetail.referralCode || 'N/A'}</p>
                </div>
              </div>
            </div>

            <h4 className="text-sm font-black text-brand-charcoal uppercase tracking-widest mb-4">Token Transactions</h4>
            <div className="bg-brand-sage/5 rounded-xl border border-brand-sage/20 overflow-hidden">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-brand-sage/10 text-[10px] font-black text-brand-muted uppercase tracking-widest">
                    <th className="p-3">Date</th>
                    <th className="p-3">Type</th>
                    <th className="p-3">Amount</th>
                    <th className="p-3">Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {tokenTransactions.filter(t => t.userId === selectedUserDetail.uid).map(t => (
                    <tr key={t.id} className="border-t border-brand-sage/10">
                      <td className="p-3 text-xs text-brand-charcoal">{new Date(t.timestamp).toLocaleDateString()}</td>
                      <td className="p-3 text-xs font-bold uppercase">{t.type}</td>
                      <td className={`p-3 text-xs font-bold ${t.type === 'deduction' ? 'text-brand-error' : 'text-brand-success'}`}>
                        {t.type === 'deduction' ? '-' : '+'}{t.amount}
                      </td>
                      <td className="p-3 text-xs text-brand-muted">{t.reason || t.description || 'N/A'}</td>
                    </tr>
                  ))}
                  {tokenTransactions.filter(t => t.userId === selectedUserDetail.uid).length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-4 text-center text-xs text-brand-muted">No transactions found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const MetricCard = ({ label, value, icon: Icon, color = 'text-brand-charcoal' }: { label: string, value: string | number, icon: any, color?: string }) => (
  <div className="bg-white p-6 rounded-2xl border border-brand-sage/20 shadow-sm">
    <div className="flex items-center justify-between mb-2">
      <p className="text-[10px] font-black text-brand-muted uppercase tracking-widest">{label}</p>
      <Icon className="w-4 h-4 text-brand-gold" />
    </div>
    <p className={`text-2xl font-black ${color}`}>{value}</p>
  </div>
);

export default AdminDashboard;

