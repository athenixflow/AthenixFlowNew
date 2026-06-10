import React, { useState, useEffect } from 'react';
import {
  UserProfile, Subscription, TradeAnalysis, Referral, TradingSignal,
  TokenTransaction, JournalEntry, EducationInteraction, AuditLogEntry, AiTelemetry, SecurityEvent
} from '../types';
import {
  subscribeToUsers, subscribeToSubscriptions, subscribeToAnalysisHistory, subscribeToReferrals,
  subscribeToSignals, subscribeToTokenTransactions, subscribeToAllJournalEntries,
  subscribeToAllEducationInteractions, subscribeToAuditLogs, subscribeToAiTelemetry, subscribeToSecurityEvents,
  adminAddTokens, adminUpdateAccountStatus, checkDatabaseConnection, logAdminAction
} from '../services/firestore';
import { testMarketConnection } from '../services/marketData';
import { ICONS } from '../constants';
import { AdminData, Pill } from '../components/admin/AdminShared';
import {
  OverviewSection, MonitoringSection, AIManagementSection, UsersSection, SignalsForecastSection,
  JournalSection, EducationSection, RevenueSection, AnalyticsSection, AuditSection, SecuritySection,
  ConfigSection, AccuracySection, CopilotSection
} from '../components/admin/AdminSections';

interface AdminDashboardProps {
  user: UserProfile | null;
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

const SECTIONS: { id: string; label: string; icon: any }[] = [
  { id: 'overview', label: 'Dashboard Overview', icon: ICONS.Dashboard },
  { id: 'monitoring', label: 'System Monitoring', icon: ICONS.Settings },
  { id: 'ai', label: 'AI Management', icon: ICONS.Assistant },
  { id: 'users', label: 'User Management', icon: ICONS.User },
  { id: 'signals', label: 'Signals & Forecast', icon: ICONS.Signals },
  { id: 'journal', label: 'Journal Management', icon: ICONS.Journal },
  { id: 'education', label: 'Educational Hub', icon: ICONS.Education },
  { id: 'revenue', label: 'Subscription & Revenue', icon: ICONS.Billing },
  { id: 'analytics', label: 'Analytics', icon: ICONS.Chart },
  { id: 'audit', label: 'Audit & Logs', icon: ICONS.Admin },
  { id: 'security', label: 'Security Center', icon: ICONS.Target },
  { id: 'config', label: 'Configuration', icon: ICONS.Settings },
  { id: 'accuracy', label: 'Accuracy Lab', icon: ICONS.Target },
  { id: 'copilot', label: 'Admin AI Copilot', icon: ICONS.Assistant }
];

const AdminDashboard: React.FC<AdminDashboardProps> = ({ user, onNavigate, onLogout }) => {
  const [activeSection, setActiveSection] = useState('overview');
  const [navOpen, setNavOpen] = useState(false);

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [analyses, setAnalyses] = useState<TradeAnalysis[]>([]);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [signals, setSignals] = useState<TradingSignal[]>([]);
  const [tokenTx, setTokenTx] = useState<TokenTransaction[]>([]);
  const [journal, setJournal] = useState<JournalEntry[]>([]);
  const [education, setEducation] = useState<EducationInteraction[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [telemetry, setTelemetry] = useState<AiTelemetry[]>([]);
  const [security, setSecurity] = useState<SecurityEvent[]>([]);
  const [dbStatus, setDbStatus] = useState(true);
  const [marketStatus, setMarketStatus] = useState(true);

  // Modals
  const [grantUser, setGrantUser] = useState<UserProfile | null>(null);
  const [tokenAmount, setTokenAmount] = useState(0);
  const [tokenReason, setTokenReason] = useState('');
  const [detailUser, setDetailUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (user?.role !== 'ADMIN') return;
    const subs = [
      subscribeToUsers(setUsers),
      subscribeToSubscriptions(setSubscriptions),
      subscribeToAnalysisHistory(setAnalyses),
      subscribeToReferrals(setReferrals),
      subscribeToSignals(setSignals),
      subscribeToTokenTransactions(setTokenTx),
      subscribeToAllJournalEntries(setJournal),
      subscribeToAllEducationInteractions(setEducation),
      subscribeToAuditLogs(setAuditLogs),
      subscribeToAiTelemetry(setTelemetry),
      subscribeToSecurityEvents(setSecurity)
    ];
    checkDatabaseConnection().then(setDbStatus);
    testMarketConnection().then(setMarketStatus).catch(() => setMarketStatus(false));
    return () => subs.forEach(u => u());
  }, [user]);

  if (!user || user.role !== 'ADMIN') return null;

  const data: AdminData = {
    users, subscriptions, analyses, signals, referrals, journal, education,
    tokenTx, auditLogs, telemetry, security, health: { db: dbStatus, market: marketStatus }
  };

  const handleGrant = async () => {
    if (!grantUser || tokenAmount <= 0 || !tokenReason) return;
    await adminAddTokens(grantUser.uid, tokenAmount, tokenReason, user.uid);
    await logAdminAction(user.uid, user.fullName, 'GRANT_TOKENS', `+${tokenAmount} tokens to ${grantUser.fullName} (${tokenReason})`);
    setGrantUser(null); setTokenAmount(0); setTokenReason('');
  };

  const handleToggleSuspend = async (u: UserProfile) => {
    const next = u.accountStatus === 'suspended' ? 'active' : 'suspended';
    await adminUpdateAccountStatus(u.uid, next);
    await logAdminAction(user.uid, user.fullName, next === 'suspended' ? 'SUSPEND_USER' : 'REACTIVATE_USER', `${u.fullName} (${u.email})`);
  };

  const renderSection = () => {
    switch (activeSection) {
      case 'overview': return <OverviewSection data={data} />;
      case 'monitoring': return <MonitoringSection data={data} />;
      case 'ai': return <AIManagementSection data={data} />;
      case 'users': return <UsersSection data={data} onGrant={setGrantUser} onView={setDetailUser} onToggleSuspend={handleToggleSuspend} />;
      case 'signals': return <SignalsForecastSection data={data} user={user} />;
      case 'journal': return <JournalSection data={data} />;
      case 'education': return <EducationSection data={data} />;
      case 'revenue': return <RevenueSection data={data} />;
      case 'analytics': return <AnalyticsSection data={data} />;
      case 'audit': return <AuditSection data={data} />;
      case 'security': return <SecuritySection data={data} />;
      case 'config': return <ConfigSection adminId={user.uid} adminName={user.fullName} />;
      case 'accuracy': return <AccuracySection data={data} />;
      case 'copilot': return <CopilotSection />;
      default: return <OverviewSection data={data} />;
    }
  };

  const activeLabel = SECTIONS.find(s => s.id === activeSection)?.label || 'Admin';

  return (
    <div className="min-h-screen bg-brand-sage/5 flex">
      {/* Mobile overlay */}
      <div className={`fixed inset-0 bg-brand-charcoal/30 backdrop-blur-sm z-[60] lg:hidden transition-opacity ${navOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={() => setNavOpen(false)} />

      {/* Admin sidebar */}
      <aside className={`fixed lg:static top-0 left-0 bottom-0 w-72 bg-white border-r border-brand-sage/20 flex flex-col z-[70] transition-transform duration-300 lg:translate-x-0 ${navOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 flex items-center gap-3 border-b border-brand-sage/10">
          <div className="w-9 h-9 bg-brand-gold rounded-xl flex items-center justify-center text-white font-black">A</div>
          <div><p className="text-[9px] font-black text-brand-gold uppercase tracking-[0.3em]">Athenix</p><h1 className="text-sm font-black tracking-tight text-brand-charcoal uppercase">Admin OS</h1></div>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {SECTIONS.map(s => (
            <button key={s.id} onClick={() => { setActiveSection(s.id); setNavOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all ${activeSection === s.id ? 'bg-brand-gold text-white shadow-md shadow-brand-gold/10' : 'text-brand-muted hover:bg-brand-sage/10 hover:text-brand-gold'}`}>
              <s.icon />
              <span className="text-[10px] font-black uppercase tracking-widest">{s.label}</span>
            </button>
          ))}
        </nav>
        <div className="p-3 border-t border-brand-sage/10 space-y-1">
          <button onClick={() => onNavigate('dashboard')} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-brand-muted hover:bg-brand-sage/10 text-[10px] font-black uppercase tracking-widest">
            <ICONS.ChevronRight /> Exit to App
          </button>
          <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-brand-error bg-brand-error/5 hover:bg-brand-error hover:text-white text-[10px] font-black uppercase tracking-widest transition-colors">
            Log Out
          </button>
        </div>
      </aside>

      {/* Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white/95 backdrop-blur-sm border-b border-brand-sage/20 px-4 md:px-8 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center gap-3">
            <button onClick={() => setNavOpen(true)} className="lg:hidden p-2 -ml-2 text-brand-charcoal" aria-label="Open menu"><ICONS.Menu /></button>
            <h2 className="text-sm font-black text-brand-charcoal uppercase tracking-widest">{activeLabel}</h2>
          </div>
          <div className="flex items-center gap-2">
            <Pill tone={dbStatus ? 'success' : 'error'}>DB</Pill>
            <Pill tone={marketStatus ? 'success' : 'error'}>Feed</Pill>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-4 md:p-8">{renderSection()}</main>
      </div>

      {/* Grant tokens modal */}
      {grantUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[90] flex items-center justify-center p-4" onClick={() => setGrantUser(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-black text-brand-charcoal uppercase tracking-tighter mb-2">Grant Tokens</h3>
            <p className="text-xs text-brand-muted mb-4">To <span className="font-bold text-brand-charcoal">{grantUser.fullName}</span></p>
            <div className="space-y-4">
              <input type="number" value={tokenAmount} onChange={e => setTokenAmount(Number(e.target.value))} placeholder="Amount" className="w-full bg-brand-sage/10 rounded-xl p-3 text-sm font-bold outline-none focus:ring-2 focus:ring-brand-gold" />
              <input type="text" value={tokenReason} onChange={e => setTokenReason(e.target.value)} placeholder="Reason (e.g. bonus, refund)" className="w-full bg-brand-sage/10 rounded-xl p-3 text-sm font-bold outline-none focus:ring-2 focus:ring-brand-gold" />
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setGrantUser(null)} className="flex-1 py-3 bg-brand-sage/10 text-brand-charcoal text-xs font-black uppercase tracking-widest rounded-xl">Cancel</button>
              <button onClick={handleGrant} disabled={tokenAmount <= 0 || !tokenReason} className="flex-1 py-3 bg-brand-gold text-white text-xs font-black uppercase tracking-widest rounded-xl disabled:opacity-50">Confirm</button>
            </div>
          </div>
        </div>
      )}

      {/* User detail modal */}
      {detailUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[90] flex items-center justify-center p-4" onClick={() => setDetailUser(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-black text-brand-charcoal uppercase tracking-tighter">User Details</h3>
              <button onClick={() => setDetailUser(null)} className="text-brand-muted hover:text-brand-charcoal"><ICONS.X className="w-6 h-6" /></button>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
              <div><p className="text-[10px] font-black text-brand-muted uppercase tracking-widest">Name</p><p className="font-bold">{detailUser.fullName}</p></div>
              <div><p className="text-[10px] font-black text-brand-muted uppercase tracking-widest">Email</p><p className="font-bold break-all">{detailUser.email}</p></div>
              <div><p className="text-[10px] font-black text-brand-muted uppercase tracking-widest">Plan</p><p className="font-bold uppercase">{detailUser.subscriptionPlan}</p></div>
              <div><p className="text-[10px] font-black text-brand-muted uppercase tracking-widest">Status</p><p className="font-bold uppercase">{detailUser.accountStatus || 'active'}</p></div>
              <div><p className="text-[10px] font-black text-brand-muted uppercase tracking-widest">Analysis Tokens</p><p className="font-bold">{detailUser.analysisTokens}</p></div>
              <div><p className="text-[10px] font-black text-brand-muted uppercase tracking-widest">Education Tokens</p><p className="font-bold">{detailUser.educationTokens}</p></div>
              <div><p className="text-[10px] font-black text-brand-muted uppercase tracking-widest">Joined</p><p className="font-bold">{new Date(detailUser.createdAt).toLocaleDateString()}</p></div>
              <div><p className="text-[10px] font-black text-brand-muted uppercase tracking-widest">Referral Code</p><p className="font-bold">{detailUser.referralCode || '—'}</p></div>
            </div>
            <h4 className="text-xs font-black text-brand-charcoal uppercase tracking-widest mb-3">Token Transactions</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[420px]">
                <thead><tr className="bg-brand-sage/10 text-[10px] font-black text-brand-muted uppercase tracking-widest"><th className="p-2">Date</th><th className="p-2">Type</th><th className="p-2">Amount</th><th className="p-2">Reason</th></tr></thead>
                <tbody>
                  {tokenTx.filter(t => t.userId === detailUser.uid).slice(0, 30).map(t => (
                    <tr key={t.id} className="border-t border-brand-sage/10">
                      <td className="p-2 text-xs">{new Date(t.timestamp).toLocaleDateString()}</td>
                      <td className="p-2 text-xs font-bold uppercase">{t.type}</td>
                      <td className={`p-2 text-xs font-bold ${t.type === 'deduction' ? 'text-brand-error' : 'text-brand-success'}`}>{t.type === 'deduction' ? '-' : '+'}{t.amount}</td>
                      <td className="p-2 text-xs text-brand-muted">{t.reason || t.description || '—'}</td>
                    </tr>
                  ))}
                  {tokenTx.filter(t => t.userId === detailUser.uid).length === 0 && <tr><td colSpan={4} className="p-4 text-center text-xs text-brand-muted">No transactions.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
