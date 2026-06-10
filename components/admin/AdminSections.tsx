import React, { useState, useEffect, useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar
} from 'recharts';
import { UserProfile, TradeAnalysis, TokenEconomyConfig } from '../../types';
import { ICONS } from '../../constants';
import { getTokenEconomyConfig, updateTokenEconomyConfig } from '../../services/firestore';
import SignalsControlCenter from '../SignalsControlCenter';
import {
  AdminData, MetricCard, Panel, SectionHeader, EmptyState, StatusDot, Pill,
  fmtNum, fmtUsd, fmtUsd4, pct, daysAgo, tsToDate, downloadCsv, CHART_COLORS
} from './AdminShared';

const within = (d: Date, days: number) => d >= daysAgo(days);
function dailyCounts(dates: Date[], days = 14) {
  const buckets: Record<string, number> = {};
  for (let i = days - 1; i >= 0; i--) buckets[daysAgo(i).toISOString().slice(0, 10)] = 0;
  dates.forEach(d => { const k = d.toISOString().slice(0, 10); if (k in buckets) buckets[k]++; });
  return Object.entries(buckets).map(([name, value]) => ({ name: name.slice(5), value }));
}
const isPaidPlan = (p?: string) => p === 'Pro' || p === 'Elite';

// ============================ 1. OVERVIEW ===================================
export const OverviewSection: React.FC<{ data: AdminData }> = ({ data }) => {
  const { users, analyses, signals, journal, education, subscriptions } = data;
  const analysisDates = analyses.map(a => new Date(a.timestamp));
  const signalDates = signals.map(s => tsToDate((s as any).timestamp));
  const journalDates = journal.map(j => new Date(j.timestamp));
  const eduDates = education.map(e => new Date(e.timestamp));

  const premium = users.filter(u => isPaidPlan(u.subscriptionPlan) && u.subscriptionStatus === 'active').length;
  const revenueMonth = subscriptions
    .filter(s => s.status === 'active' && tsToDate(s.currentPeriodStart) >= new Date(new Date().getFullYear(), new Date().getMonth(), 1))
    .reduce((sum, s) => sum + (s.amount || 0), 0);

  const fedBack = analyses.filter(a => a.feedback?.outcome);
  const accTrend = useMemo(() => {
    const buckets: Record<string, { tp: number; total: number }> = {};
    for (let i = 13; i >= 0; i--) buckets[daysAgo(i).toISOString().slice(0, 10)] = { tp: 0, total: 0 };
    fedBack.forEach(a => {
      const k = new Date(a.timestamp).toISOString().slice(0, 10);
      if (k in buckets) { buckets[k].total++; if (a.feedback?.outcome === 'TP_HIT') buckets[k].tp++; }
    });
    return Object.entries(buckets).map(([name, v]) => ({ name: name.slice(5), value: v.total ? Math.round((v.tp / v.total) * 100) : 0 }));
  }, [analyses]);

  const aiOk = data.telemetry.length ? data.telemetry.slice(0, 50).filter(t => t.ok).length / Math.min(50, data.telemetry.length) : null;

  return (
    <div className="space-y-8">
      <SectionHeader title="Dashboard Overview" desc="Real-time executive snapshot of the AthenixFlow platform." />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard label="Total Users" value={fmtNum(users.length)} icon={ICONS.User} />
        <MetricCard label="Active (24h)" value={fmtNum(users.filter(u => u.lastActiveAt && new Date(u.lastActiveAt) >= daysAgo(1)).length)} icon={ICONS.Chart} />
        <MetricCard label="New Today" value={fmtNum(users.filter(u => new Date(u.createdAt) >= daysAgo(1)).length)} icon={ICONS.User} />
        <MetricCard label="Premium Users" value={fmtNum(premium)} icon={ICONS.Check} color="text-brand-success" />
        <MetricCard label="Revenue Today" value={fmtUsd(0)} sub="payments not integrated" />
        <MetricCard label="Revenue (Month)" value={fmtUsd(revenueMonth)} sub="payments not integrated" />
        <MetricCard label="Forecasts Today" value={fmtNum(analysisDates.filter(d => within(d, 1)).length)} icon={ICONS.Target} />
        <MetricCard label="Signals Today" value={fmtNum(signalDates.filter(d => within(d, 1)).length)} icon={ICONS.Signals} />
        <MetricCard label="Journal Today" value={fmtNum(journalDates.filter(d => within(d, 1)).length)} icon={ICONS.Journal} />
        <MetricCard label="Edu Questions Today" value={fmtNum(eduDates.filter(d => within(d, 1)).length)} icon={ICONS.Education} />
        <MetricCard label="DB / Market Feed" value={`${data.health.db ? 'OK' : 'DOWN'} / ${data.health.market ? 'OK' : 'DOWN'}`} color={data.health.db && data.health.market ? 'text-brand-success' : 'text-brand-error'} />
        <MetricCard label="AI Pipeline" value={aiOk === null ? 'No data' : `${Math.round(aiOk * 100)}% ok`} sub={aiOk === null ? 'awaiting calls' : 'last 50 calls'} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Panel title="User Growth (new / day, 14d)">
          <div className="h-56"><ResponsiveContainer width="100%" height="100%">
            <LineChart data={dailyCounts(users.map(u => new Date(u.createdAt)))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" /><XAxis dataKey="name" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 10 }} allowDecimals={false} /><Tooltip />
              <Line type="monotone" dataKey="value" stroke="#C5A24A" strokeWidth={2} dot={false} />
            </LineChart></ResponsiveContainer></div>
        </Panel>
        <Panel title="Forecast Volume (per day, 14d)">
          <div className="h-56"><ResponsiveContainer width="100%" height="100%">
            <BarChart data={dailyCounts(analysisDates)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" /><XAxis dataKey="name" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 10 }} allowDecimals={false} /><Tooltip />
              <Bar dataKey="value" fill="#1F1F1F" radius={[4, 4, 0, 0]} />
            </BarChart></ResponsiveContainer></div>
        </Panel>
        <Panel title="Signal Volume (per day, 14d)">
          <div className="h-56"><ResponsiveContainer width="100%" height="100%">
            <BarChart data={dailyCounts(signalDates)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" /><XAxis dataKey="name" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 10 }} allowDecimals={false} /><Tooltip />
              <Bar dataKey="value" fill="#C1C6C0" radius={[4, 4, 0, 0]} />
            </BarChart></ResponsiveContainer></div>
        </Panel>
        <Panel title="Accuracy Trend (feedback TP %, 14d)">
          {fedBack.length === 0 ? <EmptyState title="No outcome feedback yet" note="Accuracy populates as users log trade outcomes on their analyses." /> :
            <div className="h-56"><ResponsiveContainer width="100%" height="100%">
              <LineChart data={accTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" /><XAxis dataKey="name" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 10 }} domain={[0, 100]} /><Tooltip />
                <Line type="monotone" dataKey="value" stroke="#2E7D32" strokeWidth={2} dot={false} />
              </LineChart></ResponsiveContainer></div>}
        </Panel>
      </div>
    </div>
  );
};

// ====================== 2. SYSTEM MONITORING ================================
export const MonitoringSection: React.FC<{ data: AdminData }> = ({ data }) => {
  const recent = data.telemetry.filter(t => new Date(t.timestamp) >= daysAgo(1));
  const aiErrorRate = recent.length ? recent.filter(t => !t.ok).length / recent.length : null;
  const avgLatency = recent.length ? Math.round(recent.reduce((s, t) => s + (t.latencyMs || 0), 0) / recent.length) : null;

  const scoreAvg = (key: keyof NonNullable<TradeAnalysis['confluence_scores']>) => {
    const vals = data.analyses.map(a => a.confluence_scores?.[key]).filter((v): v is number => typeof v === 'number');
    return vals.length ? (vals.reduce((s, v) => s + v, 0) / vals.length) : null;
  };
  const outputs = [
    { name: 'Structure', v: scoreAvg('structure_score') },
    { name: 'Liquidity', v: scoreAvg('liquidity_score') },
    { name: 'POI', v: scoreAvg('poi_score') },
    { name: 'Prem/Disc', v: scoreAvg('premium_discount_score') }
  ];
  const hasOutputs = outputs.some(o => o.v !== null);

  const services = [
    { name: 'Database (Firestore)', ok: data.health.db, note: 'live read probe' },
    { name: 'Market Data Feed', ok: data.health.market, note: 'Twelve Data ping' },
    { name: 'Authentication', ok: true, note: 'active admin session' },
    { name: 'AI Pipeline (Gemini)', ok: aiErrorRate === null ? true : aiErrorRate < 0.5, degraded: aiErrorRate !== null && aiErrorRate >= 0.2 && aiErrorRate < 0.5, note: aiErrorRate === null ? 'no calls in 24h' : `${Math.round((1 - aiErrorRate) * 100)}% ok (24h)` }
  ];

  return (
    <div className="space-y-8">
      <SectionHeader title="System Monitoring" desc="Live health of the real platform services. Note: all analysis 'engines' share one AI pipeline — output quality is shown below." />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {services.map(s => (
          <div key={s.name} className="bg-white p-5 rounded-2xl border border-brand-sage/20 flex items-center justify-between">
            <div><p className="text-sm font-black text-brand-charcoal">{s.name}</p><p className="text-[10px] text-brand-muted font-bold uppercase tracking-wide">{s.note}</p></div>
            <StatusDot ok={s.ok} degraded={(s as any).degraded} />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard label="AI Calls (24h)" value={recent.length ? fmtNum(recent.length) : 'No data'} />
        <MetricCard label="Avg Latency (24h)" value={avgLatency === null ? 'No data' : `${avgLatency} ms`} />
        <MetricCard label="Error Rate (24h)" value={aiErrorRate === null ? 'No data' : `${(aiErrorRate * 100).toFixed(1)}%`} color={aiErrorRate && aiErrorRate > 0.1 ? 'text-brand-error' : 'text-brand-charcoal'} />
        <MetricCard label="Not Monitored" value="Queues / Workers / Storage" sub="not part of this architecture" />
      </div>

      <Panel title="Engine Output Quality (avg sub-scores /10)">
        {!hasOutputs ? <EmptyState title="No analyses yet" note="Populates from real analysis outputs." /> :
          <div className="h-64"><ResponsiveContainer width="100%" height="100%">
            <BarChart data={outputs.map(o => ({ name: o.name, value: o.v ?? 0 }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" /><XAxis dataKey="name" tick={{ fontSize: 11 }} /><YAxis domain={[0, 10]} tick={{ fontSize: 10 }} /><Tooltip />
              <Bar dataKey="value" fill="#C5A24A" radius={[4, 4, 0, 0]} />
            </BarChart></ResponsiveContainer></div>}
      </Panel>
    </div>
  );
};

// ======================== 3. AI MANAGEMENT =================================
export const AIManagementSection: React.FC<{ data: AdminData }> = ({ data }) => {
  const t = data.telemetry;
  if (t.length === 0) {
    return (
      <div className="space-y-8">
        <SectionHeader title="AI Management" desc="Live token usage, latency and cost across all AI features." />
        <EmptyState title="Collecting data" note="AI telemetry is recorded on every analysis, mentor question and revalidation. This section populates automatically as those run — token counts, latency and cost are read directly from the Gemini API responses." />
      </div>
    );
  }
  const totalCost = t.reduce((s, r) => s + (r.costUsd || 0), 0);
  const totalTokens = t.reduce((s, r) => s + (r.totalTokens || 0), 0);
  const avgLatency = Math.round(t.reduce((s, r) => s + (r.latencyMs || 0), 0) / t.length);
  const errRate = t.filter(r => !r.ok).length / t.length;

  const byFeature = ['analysis', 'education', 'revalidate'].map(f => {
    const rows = t.filter(r => r.feature === f);
    return { name: f, calls: rows.length, tokens: rows.reduce((s, r) => s + (r.totalTokens || 0), 0), cost: rows.reduce((s, r) => s + (r.costUsd || 0), 0) };
  }).filter(r => r.calls > 0);

  const byModel = Object.values(t.reduce((acc, r) => {
    (acc[r.model] ||= { name: r.model, calls: 0, cost: 0 }); acc[r.model].calls++; acc[r.model].cost += r.costUsd || 0; return acc;
  }, {} as Record<string, { name: string; calls: number; cost: number }>));

  const dailyTokens = (() => {
    const buckets: Record<string, number> = {};
    for (let i = 13; i >= 0; i--) buckets[daysAgo(i).toISOString().slice(0, 10)] = 0;
    t.forEach(r => { const k = (r.day || r.timestamp?.slice(0, 10)); if (k in buckets) buckets[k] += r.totalTokens || 0; });
    return Object.entries(buckets).map(([name, value]) => ({ name: name.slice(5), value }));
  })();

  return (
    <div className="space-y-8">
      <SectionHeader title="AI Management" desc="Real Gemini usage captured per call (tokens from API usageMetadata, computed cost)." />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard label="Total AI Calls" value={fmtNum(t.length)} />
        <MetricCard label="Total Tokens" value={fmtNum(totalTokens)} />
        <MetricCard label="Total Cost" value={fmtUsd(totalCost)} color="text-brand-gold" />
        <MetricCard label="Avg Latency" value={`${avgLatency} ms`} />
        <MetricCard label="Error Rate" value={`${(errRate * 100).toFixed(1)}%`} color={errRate > 0.1 ? 'text-brand-error' : 'text-brand-charcoal'} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Panel title="Daily Token Usage (14d)">
          <div className="h-56"><ResponsiveContainer width="100%" height="100%">
            <BarChart data={dailyTokens}><CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" /><XAxis dataKey="name" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 10 }} /><Tooltip />
              <Bar dataKey="value" fill="#1F1F1F" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div>
        </Panel>
        <Panel title="Cost by Feature">
          <table className="w-full text-left text-xs">
            <thead><tr className="text-[10px] font-black text-brand-muted uppercase tracking-widest border-b border-brand-sage/10"><th className="pb-2">Feature</th><th className="pb-2">Calls</th><th className="pb-2">Tokens</th><th className="pb-2">Cost</th></tr></thead>
            <tbody>{byFeature.map(r => (<tr key={r.name} className="border-b border-brand-sage/5"><td className="py-2 font-bold uppercase">{r.name}</td><td className="py-2">{fmtNum(r.calls)}</td><td className="py-2">{fmtNum(r.tokens)}</td><td className="py-2 text-brand-gold font-bold">{fmtUsd4(r.cost)}</td></tr>))}</tbody>
          </table>
          <div className="mt-4 pt-3 border-t border-brand-sage/10 text-[10px] text-brand-muted uppercase font-bold tracking-wide">By model: {byModel.map(m => `${m.name} (${m.calls})`).join(' · ')}</div>
        </Panel>
      </div>
    </div>
  );
};

// ======================== 4. USER MANAGEMENT ===============================
export const UsersSection: React.FC<{ data: AdminData; onGrant: (u: UserProfile) => void; onView: (u: UserProfile) => void; onToggleSuspend: (u: UserProfile) => void; }> = ({ data, onGrant, onView, onToggleSuspend }) => {
  const [q, setQ] = useState('');
  const tokenSpendByUser = useMemo(() => {
    const m: Record<string, number> = {};
    data.tokenTx.filter(tx => tx.type === 'deduction').forEach(tx => { m[tx.userId] = (m[tx.userId] || 0) + (tx.amount || 0); });
    return m;
  }, [data.tokenTx]);
  const filtered = data.users.filter(u => !q || u.fullName?.toLowerCase().includes(q.toLowerCase()) || u.email?.toLowerCase().includes(q.toLowerCase()));
  const topConsumers = [...data.users].map(u => ({ u, spent: tokenSpendByUser[u.uid] || 0 })).sort((a, b) => b.spent - a.spent).slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <SectionHeader title="User Management" desc={`${data.users.length} registered users.`} />
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search name / email…" className="px-4 py-2.5 bg-white border border-brand-sage/30 rounded-xl text-xs font-bold outline-none focus:border-brand-gold w-full md:w-72" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard label="Total" value={fmtNum(data.users.length)} icon={ICONS.User} />
        <MetricCard label="Active (7d)" value={fmtNum(data.users.filter(u => u.lastActiveAt && new Date(u.lastActiveAt) >= daysAgo(7)).length)} />
        <MetricCard label="Suspended" value={fmtNum(data.users.filter(u => u.accountStatus === 'suspended').length)} color="text-brand-error" />
        <MetricCard label="Premium" value={fmtNum(data.users.filter(u => isPaidPlan(u.subscriptionPlan)).length)} color="text-brand-success" />
      </div>
      <div className="bg-white rounded-2xl border border-brand-sage/20 overflow-hidden">
        <table className="w-full text-left border-collapse min-w-[700px]">
          <thead><tr className="bg-brand-sage/5">{['User', 'Plan', 'Status', 'Tokens Used', 'Last Active', 'Actions'].map(h => <th key={h} className="p-4 text-[10px] font-black text-brand-muted uppercase tracking-widest">{h}</th>)}</tr></thead>
          <tbody>
            {filtered.map(u => (
              <tr key={u.uid} className="border-t border-brand-sage/10 hover:bg-brand-sage/5">
                <td className="p-4"><p className="text-sm font-black text-brand-charcoal">{u.fullName}</p><p className="text-[10px] text-brand-muted">{u.email}</p></td>
                <td className="p-4"><Pill>{u.subscriptionPlan}</Pill></td>
                <td className="p-4"><Pill tone={u.accountStatus === 'suspended' ? 'error' : 'success'}>{u.accountStatus || 'active'}</Pill></td>
                <td className="p-4 text-sm font-bold">{fmtNum(tokenSpendByUser[u.uid] || 0)}</td>
                <td className="p-4 text-[11px] text-brand-muted">{u.lastActiveAt ? new Date(u.lastActiveAt).toLocaleDateString() : '—'}</td>
                <td className="p-4">
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => onView(u)} className="px-3 py-1 bg-brand-sage/20 text-brand-charcoal text-[10px] font-black uppercase rounded hover:bg-brand-sage/30">View</button>
                    <button onClick={() => onGrant(u)} className="px-3 py-1 bg-brand-gold text-white text-[10px] font-black uppercase rounded">Tokens</button>
                    <button onClick={() => onToggleSuspend(u)} className={`px-3 py-1 text-white text-[10px] font-black uppercase rounded ${u.accountStatus === 'suspended' ? 'bg-brand-success' : 'bg-brand-error'}`}>{u.accountStatus === 'suspended' ? 'Reactivate' : 'Suspend'}</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Panel title="Highest Token Consumers">
        <div className="space-y-2">
          {topConsumers.map(({ u, spent }) => (
            <div key={u.uid} className="flex items-center justify-between text-xs border-b border-brand-sage/5 pb-2">
              <span className="font-bold text-brand-charcoal">{u.fullName}</span><span className="text-brand-gold font-black">{fmtNum(spent)} units</span>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
};

// ================== 5. SIGNALS & FORECAST MONITORING =======================
export const SignalsForecastSection: React.FC<{ data: AdminData; user: UserProfile | null }> = ({ data, user }) => {
  const [asset, setAsset] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);
  const analyses = data.analyses.filter(a => !asset || a.instrument === asset);
  const fed = analyses.filter(a => a.feedback?.outcome);
  const tp = fed.filter(a => a.feedback?.outcome === 'TP_HIT').length;
  const sl = fed.filter(a => a.feedback?.outcome === 'SL_HIT').length;
  const assetList = Array.from(new Set(data.analyses.map(a => a.instrument))).slice(0, 30);
  const activeSignals = data.signals.filter(s => ['Pending', 'Triggered', 'Active'].includes(s.status)).length;
  const closedSignals = data.signals.filter(s => ['Take Profit', 'Stop Loss', 'Closed', 'Break Even'].includes(s.status)).length;

  return (
    <div className="space-y-8">
      <SectionHeader title="Signals & Forecast Monitoring" desc="Forecast quality and signal activity. Accuracy is computed from real user-submitted outcomes." />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard label="Total Forecasts" value={fmtNum(data.analyses.length)} icon={ICONS.Target} />
        <MetricCard label="With Outcome" value={fmtNum(fed.length)} sub="user-logged" />
        <MetricCard label="TP Accuracy" value={fed.length ? pct(tp, fed.length) : 'No data'} color="text-brand-success" />
        <MetricCard label="SL Rate" value={fed.length ? pct(sl, fed.length) : 'No data'} color="text-brand-error" />
        <MetricCard label="Total Signals" value={fmtNum(data.signals.length)} icon={ICONS.Signals} />
        <MetricCard label="Active Signals" value={fmtNum(activeSignals)} />
        <MetricCard label="Closed Signals" value={fmtNum(closedSignals)} />
        <MetricCard label="Avg Confluence" value={(() => { const v = analyses.map(a => a.confluence_scores?.total_confluence_score).filter((x): x is number => typeof x === 'number'); return v.length ? `${(v.reduce((s, x) => s + x, 0) / v.length).toFixed(1)}/40` : 'No data'; })()} />
      </div>

      <Panel title="Forecast Ledger" action={
        <select value={asset} onChange={e => setAsset(e.target.value)} className="px-3 py-1.5 bg-brand-sage/10 rounded-lg text-[10px] font-black uppercase tracking-widest outline-none">
          <option value="">All assets</option>{assetList.map(a => <option key={a} value={a}>{a}</option>)}
        </select>}>
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[640px]">
            <thead><tr className="text-[10px] font-black text-brand-muted uppercase tracking-widest border-b border-brand-sage/10">{['Instrument', 'TF', 'Decision', 'Confluence', 'Outcome', 'Date', ''].map(h => <th key={h} className="pb-2">{h}</th>)}</tr></thead>
            <tbody>
              {analyses.slice(0, 40).map(a => (
                <React.Fragment key={a.id}>
                  <tr className="border-b border-brand-sage/5 hover:bg-brand-sage/5">
                    <td className="py-3 text-sm font-bold">{a.instrument}</td>
                    <td className="py-3 text-xs">{a.timeframe}</td>
                    <td className="py-3"><Pill tone={a.final_decision === 'trade' ? 'success' : 'neutral'}>{a.final_decision}</Pill></td>
                    <td className="py-3 text-xs font-bold">{a.confluence_scores?.total_confluence_score ?? '—'}/40</td>
                    <td className="py-3"><span className="text-[10px] font-bold uppercase">{a.feedback?.outcome?.replace('_', ' ') || '—'}</span></td>
                    <td className="py-3 text-[11px] text-brand-muted">{new Date(a.timestamp).toLocaleDateString()}</td>
                    <td className="py-3 text-right"><button onClick={() => setOpenId(openId === a.id ? null : a.id!)} className="text-[10px] font-black text-brand-gold uppercase">{openId === a.id ? 'Hide' : 'Inspect'}</button></td>
                  </tr>
                  {openId === a.id && (
                    <tr className="bg-brand-sage/5"><td colSpan={7} className="p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
                        <div><span className="font-black uppercase text-brand-muted">HTF Bias: </span>{a.reasoning?.bias_explanation || '—'}</div>
                        <div><span className="font-black uppercase text-brand-muted">Liquidity: </span>{a.reasoning?.liquidity_explanation || '—'}</div>
                        <div><span className="font-black uppercase text-brand-muted">Entry: </span>{a.signal?.entry_price ?? a.impulse_setup?.entry ?? '—'}</div>
                        <div><span className="font-black uppercase text-brand-muted">SL: </span>{a.signal?.stop_loss ?? a.impulse_setup?.stop_loss ?? '—'}</div>
                        <div><span className="font-black uppercase text-brand-muted">TP path: </span>{a.liquidity_map?.projected_liquidity_path || '—'}</div>
                        <div><span className="font-black uppercase text-brand-muted">Probabilities: </span>IRL {a.probabilities?.irl_only ?? '—'}% / ERL {a.probabilities?.irl_to_erl ?? '—'}% / Exp {a.probabilities?.expansion ?? '—'}%</div>
                      </div>
                    </td></tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <div>
        <h3 className="text-sm font-black text-brand-charcoal uppercase tracking-widest mb-4">Signal Management</h3>
        <SignalsControlCenter user={user} />
      </div>
    </div>
  );
};

// ======================= 6. JOURNAL MANAGEMENT =============================
export const JournalSection: React.FC<{ data: AdminData }> = ({ data }) => {
  const j = data.journal;
  const byOutcome = j.reduce((acc, e) => { acc[e.outcome] = (acc[e.outcome] || 0) + 1; return acc; }, {} as Record<string, number>);
  const byInstrument = Object.entries(j.reduce((acc, e) => { acc[e.instrument] = (acc[e.instrument] || 0) + 1; return acc; }, {} as Record<string, number>)).sort((a, b) => b[1] - a[1]).slice(0, 6);
  return (
    <div className="space-y-8">
      <SectionHeader title="Journal Management" desc="Trade-journal activity across all users." />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard label="Total Entries" value={fmtNum(j.length)} icon={ICONS.Journal} />
        <MetricCard label="Entries (7d)" value={fmtNum(j.filter(e => new Date(e.timestamp) >= daysAgo(7)).length)} />
        <MetricCard label="Take Profit" value={fmtNum(byOutcome['Take Profit'] || 0)} color="text-brand-success" />
        <MetricCard label="Stop Loss" value={fmtNum(byOutcome['Stop Loss'] || 0)} color="text-brand-error" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Panel title="Outcome Distribution">
          {j.length === 0 ? <EmptyState title="No journal entries yet" /> :
            <div className="h-56"><ResponsiveContainer width="100%" height="100%"><PieChart>
              <Pie data={Object.entries(byOutcome).map(([name, value]) => ({ name, value }))} cx="50%" cy="50%" innerRadius={55} outerRadius={80} dataKey="value" paddingAngle={4}>
                {Object.keys(byOutcome).map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
              </Pie><Tooltip /><Legend /></PieChart></ResponsiveContainer></div>}
        </Panel>
        <Panel title="Most Journaled Instruments">
          {byInstrument.length === 0 ? <EmptyState title="No data yet" /> :
            <div className="space-y-2">{byInstrument.map(([name, v]) => <div key={name} className="flex justify-between text-xs border-b border-brand-sage/5 pb-2"><span className="font-bold">{name}</span><span className="text-brand-gold font-black">{v}</span></div>)}</div>}
        </Panel>
      </div>
      <EmptyState title="AI Journal Review & Coaching — not yet built" note="The journal is currently manual (CRUD). AI win/loss reasoning and coaching metrics will appear here once that feature ships." />
    </div>
  );
};

// ===================== 7. EDUCATIONAL HUB MANAGEMENT =======================
export const EducationSection: React.FC<{ data: AdminData }> = ({ data }) => {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState<string | null>(null);
  const e = data.education;
  const byTopic = Object.entries(e.reduce((acc, x) => { const c = x.category || 'General'; acc[c] = (acc[c] || 0) + 1; return acc; }, {} as Record<string, number>)).sort((a, b) => b[1] - a[1]);
  const popularQ = Object.entries(e.reduce((acc, x) => { const k = x.question.trim().toLowerCase(); acc[k] = (acc[k] || 0) + 1; return acc; }, {} as Record<string, number>)).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const convos = e.filter(x => !q || x.question.toLowerCase().includes(q.toLowerCase()) || (x.answer || '').toLowerCase().includes(q.toLowerCase())).slice(0, 50);

  return (
    <div className="space-y-8">
      <SectionHeader title="Educational Hub Management" desc="AI mentor chat usage. The hub is a Q&A chat system — questions and answers are stored." />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard label="Questions Asked" value={fmtNum(e.length)} icon={ICONS.Education} />
        <MetricCard label="This Week" value={fmtNum(e.filter(x => new Date(x.timestamp) >= daysAgo(7)).length)} />
        <MetricCard label="Topics Covered" value={fmtNum(byTopic.length)} />
        <MetricCard label="Unique Questions" value={fmtNum(new Set(e.map(x => x.question.trim().toLowerCase())).size)} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Panel title="Topics Covered">
          {byTopic.length === 0 ? <EmptyState title="No questions yet" /> :
            <div className="h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={byTopic.map(([name, value]) => ({ name, value }))} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" /><XAxis type="number" tick={{ fontSize: 10 }} allowDecimals={false} /><YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={90} /><Tooltip />
              <Bar dataKey="value" fill="#C5A24A" radius={[0, 4, 4, 0]} /></BarChart></ResponsiveContainer></div>}
        </Panel>
        <Panel title="Most Popular Questions">
          {popularQ.length === 0 ? <EmptyState title="No questions yet" /> :
            <div className="space-y-2">{popularQ.map(([name, v]) => <div key={name} className="flex justify-between gap-3 text-xs border-b border-brand-sage/5 pb-2"><span className="font-medium text-brand-charcoal truncate">{name}</span><span className="text-brand-gold font-black shrink-0">{v}×</span></div>)}</div>}
        </Panel>
      </div>
      <Panel title="Conversation Browser" action={<input value={q} onChange={e2 => setQ(e2.target.value)} placeholder="Search conversations…" className="px-3 py-1.5 bg-brand-sage/10 rounded-lg text-[11px] font-bold outline-none w-48" />}>
        {convos.length === 0 ? <EmptyState title="No conversations" /> :
          <div className="space-y-2 max-h-[28rem] overflow-y-auto">
            {convos.map(c => (
              <div key={c.id} className="border border-brand-sage/15 rounded-xl overflow-hidden">
                <button onClick={() => setOpen(open === c.id ? null : c.id!)} className="w-full text-left p-3 flex justify-between gap-3 hover:bg-brand-sage/5">
                  <span className="text-xs font-bold text-brand-charcoal truncate">{c.question}</span>
                  <span className="text-[9px] text-brand-muted font-bold uppercase shrink-0">{c.category || 'General'}</span>
                </button>
                {open === c.id && <div className="p-3 border-t border-brand-sage/10 bg-brand-sage/5 text-[11px] text-brand-charcoal whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto">{c.answer}</div>}
              </div>
            ))}
          </div>}
      </Panel>
    </div>
  );
};

// ==================== 8. SUBSCRIPTION & REVENUE ============================
export const RevenueSection: React.FC<{ data: AdminData }> = ({ data }) => {
  const refills = data.tokenTx.filter(t => t.type === 'refill');
  const refillTotal = refills.reduce((s, t) => s + (t.cost || 0), 0);
  return (
    <div className="space-y-8">
      <SectionHeader title="Subscription & Revenue" desc="Reflects real records only." />
      <div className="p-4 rounded-2xl border border-brand-warning/30 bg-brand-warning/5">
        <p className="text-[11px] font-black text-brand-warning uppercase tracking-widest">Payments not integrated</p>
        <p className="text-[11px] text-brand-charcoal font-medium mt-1">No payment provider is connected, so the <code className="font-mono">subscriptions</code> collection is empty and revenue is genuinely $0. These cards show real records only — they will populate automatically once payments are wired in.</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard label="Active Subscriptions" value={fmtNum(data.subscriptions.filter(s => s.status === 'active').length)} />
        <MetricCard label="Free Users" value={fmtNum(data.users.filter(u => !isPaidPlan(u.subscriptionPlan)).length)} />
        <MetricCard label="MRR" value={fmtUsd(data.subscriptions.filter(s => s.status === 'active').reduce((s, x) => s + (x.amount || 0), 0))} />
        <MetricCard label="Token Refills (real)" value={fmtUsd(refillTotal)} sub={`${refills.length} purchases logged`} />
      </div>
      <Panel title="Subscription Records">
        {data.subscriptions.length === 0
          ? <EmptyState title="No subscription records" note="Will populate when a payment provider (e.g. Stripe) is integrated." />
          : <div className="overflow-x-auto"><table className="w-full text-left min-w-[560px]"><thead><tr className="text-[10px] font-black text-brand-muted uppercase tracking-widest border-b border-brand-sage/10"><th className="pb-2">User</th><th className="pb-2">Plan</th><th className="pb-2">Amount</th><th className="pb-2">Status</th><th className="pb-2">Date</th></tr></thead>
            <tbody>{data.subscriptions.slice(0, 20).map(s => <tr key={s.id} className="border-b border-brand-sage/5"><td className="py-2 text-sm font-bold">{data.users.find(u => u.uid === s.userId)?.fullName || s.userId}</td><td className="py-2 text-sm">{s.plan}</td><td className="py-2 text-sm text-brand-success font-bold">{fmtUsd(s.amount)}</td><td className="py-2"><Pill>{s.status}</Pill></td><td className="py-2 text-xs text-brand-muted">{tsToDate(s.createdAt).toLocaleDateString()}</td></tr>)}</tbody></table></div>}
      </Panel>
    </div>
  );
};

// ========================== 9. ANALYTICS ==================================
export const AnalyticsSection: React.FC<{ data: AdminData }> = ({ data }) => {
  const active = (days: number) => data.users.filter(u => u.lastActiveAt && new Date(u.lastActiveAt) >= daysAgo(days)).length;
  const instruments = Object.entries(data.analyses.reduce((a, x) => { a[x.instrument] = (a[x.instrument] || 0) + 1; return a; }, {} as Record<string, number>)).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const timeframes = Object.entries(data.analyses.reduce((a, x) => { a[x.timeframe] = (a[x.timeframe] || 0) + 1; return a; }, {} as Record<string, number>)).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const feature = [
    { name: 'Forecasts', value: data.analyses.length },
    { name: 'Signals', value: data.signals.length },
    { name: 'Journal', value: data.journal.length },
    { name: 'Education', value: data.education.length }
  ];
  return (
    <div className="space-y-8">
      <SectionHeader title="Analytics Dashboard" desc="Business intelligence — engagement and feature usage from real activity." />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard label="DAU (1d)" value={fmtNum(active(1))} />
        <MetricCard label="WAU (7d)" value={fmtNum(active(7))} />
        <MetricCard label="MAU (30d)" value={fmtNum(active(30))} />
        <MetricCard label="Conversion" value={pct(data.users.filter(u => isPaidPlan(u.subscriptionPlan)).length, data.users.length)} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Panel title="Feature Usage (total)">
          <div className="h-56"><ResponsiveContainer width="100%" height="100%"><BarChart data={feature}><CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" /><XAxis dataKey="name" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 10 }} allowDecimals={false} /><Tooltip /><Bar dataKey="value" fill="#1F1F1F" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div>
        </Panel>
        <Panel title="Most Analyzed Markets">
          {instruments.length === 0 ? <EmptyState title="No analyses yet" /> :
            <div className="h-56"><ResponsiveContainer width="100%" height="100%"><BarChart data={instruments.map(([name, value]) => ({ name, value }))} layout="vertical" margin={{ left: 10 }}><CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" /><XAxis type="number" tick={{ fontSize: 10 }} allowDecimals={false} /><YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={70} /><Tooltip /><Bar dataKey="value" fill="#C5A24A" radius={[0, 4, 4, 0]} /></BarChart></ResponsiveContainer></div>}
        </Panel>
      </div>
      <Panel title="Popular Timeframes">
        <div className="flex flex-wrap gap-2">{timeframes.map(([name, v]) => <Pill key={name} tone="gold">{name}: {v}</Pill>)}{timeframes.length === 0 && <span className="text-xs text-brand-muted">No data yet</span>}</div>
      </Panel>
    </div>
  );
};

// ========================= 10. AUDIT & LOGS ===============================
export const AuditSection: React.FC<{ data: AdminData }> = ({ data }) => {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <SectionHeader title="Audit & Logs" desc="Administrative actions and security events." />
        <button onClick={() => downloadCsv('admin_audit_logs.csv', data.auditLogs as any)} className="px-4 py-2 bg-brand-charcoal text-white text-[10px] font-black uppercase tracking-widest rounded-xl">Export CSV</button>
      </div>
      <Panel title="Admin Audit Trail">
        {data.auditLogs.length === 0 ? <EmptyState title="No admin actions logged yet" note="Token grants, suspensions and config changes are recorded here." /> :
          <div className="overflow-x-auto max-h-[30rem] overflow-y-auto"><table className="w-full text-left min-w-[640px]"><thead><tr className="text-[10px] font-black text-brand-muted uppercase tracking-widest border-b border-brand-sage/10"><th className="pb-2">Time</th><th className="pb-2">Admin</th><th className="pb-2">Action</th><th className="pb-2">Details</th></tr></thead>
            <tbody>{data.auditLogs.map(l => <tr key={l.id} className="border-b border-brand-sage/5"><td className="py-2 text-[11px] text-brand-muted">{new Date(l.timestamp).toLocaleString()}</td><td className="py-2 text-xs font-bold">{l.adminName}</td><td className="py-2"><Pill tone="gold">{l.action}</Pill></td><td className="py-2 text-xs text-brand-charcoal">{l.details}</td></tr>)}</tbody></table></div>}
      </Panel>
    </div>
  );
};

// ======================== 11. SECURITY CENTER =============================
export const SecuritySection: React.FC<{ data: AdminData }> = ({ data }) => {
  const ev = data.security;
  const fails = ev.filter(e => e.type === 'login_failure');
  const admins = data.users.filter(u => u.role === 'ADMIN');
  return (
    <div className="space-y-8">
      <SectionHeader title="Security Center" desc="Authentication events captured at the login boundary." />
      {ev.length === 0 ? <EmptyState title="Collecting data" note="Login successes/failures and sign-ups are recorded here as they happen. (IP/device tracking arrives in a later milestone.)" /> : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard label="Total Events" value={fmtNum(ev.length)} />
            <MetricCard label="Logins (success)" value={fmtNum(ev.filter(e => e.type === 'login_success').length)} color="text-brand-success" />
            <MetricCard label="Failed Logins" value={fmtNum(fails.length)} color="text-brand-error" />
            <MetricCard label="Sign-ups" value={fmtNum(ev.filter(e => e.type === 'signup').length)} />
          </div>
          <Panel title="Recent Events">
            <div className="overflow-x-auto max-h-[26rem] overflow-y-auto"><table className="w-full text-left min-w-[560px]"><thead><tr className="text-[10px] font-black text-brand-muted uppercase tracking-widest border-b border-brand-sage/10"><th className="pb-2">Time</th><th className="pb-2">Type</th><th className="pb-2">Email</th><th className="pb-2">Method</th><th className="pb-2">Reason</th></tr></thead>
              <tbody>{ev.slice(0, 100).map(e => <tr key={e.id} className="border-b border-brand-sage/5"><td className="py-2 text-[11px] text-brand-muted">{new Date(e.timestamp).toLocaleString()}</td><td className="py-2"><Pill tone={e.type === 'login_failure' ? 'error' : e.type === 'signup' ? 'gold' : 'success'}>{e.type.replace('_', ' ')}</Pill></td><td className="py-2 text-xs">{e.email || '—'}</td><td className="py-2 text-[11px] uppercase">{e.method || '—'}</td><td className="py-2 text-[11px] text-brand-muted">{e.reason || '—'}</td></tr>)}</tbody></table></div>
          </Panel>
        </>
      )}
      <Panel title="Administrators & Access">
        <div className="space-y-2">{admins.map(a => <div key={a.uid} className="flex justify-between text-xs border-b border-brand-sage/5 pb-2"><span className="font-bold">{a.fullName} <span className="text-brand-muted">({a.email})</span></span><Pill tone="gold">ADMIN</Pill></div>)}</div>
        <p className="text-[10px] text-brand-muted mt-3">Granular role/permission management arrives in a later milestone.</p>
      </Panel>
    </div>
  );
};

// ====================== 12. CONFIGURATION CENTER ==========================
export const ConfigSection: React.FC<{ adminId: string; adminName: string }> = ({ adminId, adminName }) => {
  const [cfg, setCfg] = useState<TokenEconomyConfig | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  useEffect(() => { getTokenEconomyConfig().then(setCfg); }, []);
  if (!cfg) return <div className="space-y-8"><SectionHeader title="Configuration Center" /><EmptyState title="Loading configuration…" /></div>;

  const setAlloc = (plan: 'lite' | 'pro' | 'elite', key: 'analysis' | 'education', val: number) =>
    setCfg({ ...cfg, allocations: { ...cfg.allocations, [plan]: { ...cfg.allocations[plan], [key]: val } } });
  const save = async () => { setSaving(true); await updateTokenEconomyConfig(cfg); setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2500); };

  return (
    <div className="space-y-8">
      <SectionHeader title="Configuration Center" desc="Editable platform settings (persisted to system_config)." />
      <Panel title="Token Economy — Plan Allocations">
        <div className="overflow-x-auto"><table className="w-full text-left min-w-[480px]"><thead><tr className="text-[10px] font-black text-brand-muted uppercase tracking-widest border-b border-brand-sage/10"><th className="pb-2">Plan</th><th className="pb-2">Analysis</th><th className="pb-2">Education</th></tr></thead>
          <tbody>{(['lite', 'pro', 'elite'] as const).map(plan => (
            <tr key={plan} className="border-b border-brand-sage/5"><td className="py-3 text-sm font-black uppercase">{plan}</td>
              <td className="py-3"><input type="number" value={cfg.allocations[plan].analysis} onChange={e => setAlloc(plan, 'analysis', Number(e.target.value))} className="w-24 bg-brand-sage/10 rounded-lg p-2 text-sm font-bold outline-none focus:ring-2 focus:ring-brand-gold" /></td>
              <td className="py-3"><input type="number" value={cfg.allocations[plan].education} onChange={e => setAlloc(plan, 'education', Number(e.target.value))} className="w-24 bg-brand-sage/10 rounded-lg p-2 text-sm font-bold outline-none focus:ring-2 focus:ring-brand-gold" /></td>
            </tr>))}</tbody></table></div>
        <div className="grid grid-cols-2 gap-4 mt-6 max-w-sm">
          <div><label className="text-[10px] font-black text-brand-muted uppercase tracking-widest">Analysis refill ($)</label><input type="number" value={cfg.refillPricing.analysis} onChange={e => setCfg({ ...cfg, refillPricing: { ...cfg.refillPricing, analysis: Number(e.target.value) } })} className="w-full mt-1 bg-brand-sage/10 rounded-lg p-2 text-sm font-bold outline-none focus:ring-2 focus:ring-brand-gold" /></div>
          <div><label className="text-[10px] font-black text-brand-muted uppercase tracking-widest">Education refill ($)</label><input type="number" value={cfg.refillPricing.education} onChange={e => setCfg({ ...cfg, refillPricing: { ...cfg.refillPricing, education: Number(e.target.value) } })} className="w-full mt-1 bg-brand-sage/10 rounded-lg p-2 text-sm font-bold outline-none focus:ring-2 focus:ring-brand-gold" /></div>
        </div>
        <button onClick={save} disabled={saving} className="btn-primary mt-6 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest disabled:opacity-50">{saving ? 'Saving…' : saved ? 'Saved ✓' : 'Save Configuration'}</button>
      </Panel>
      <EmptyState title="Forecast / Signal / AI settings" note="Additional editable config groups (forecast & confidence thresholds, signal risk rules, AI prompt/context settings) will be added here, following the same persisted-config pattern." />
    </div>
  );
};

// ========================= 13. ACCURACY LAB ===============================
export const AccuracySection: React.FC<{ data: AdminData }> = ({ data }) => {
  const fed = data.analyses.filter(a => a.feedback?.outcome);
  const tp = fed.filter(a => a.feedback?.outcome === 'TP_HIT').length;
  const byTf = Object.entries(fed.reduce((acc, a) => { (acc[a.timeframe] ||= { t: 0, w: 0 }); acc[a.timeframe].t++; if (a.feedback?.outcome === 'TP_HIT') acc[a.timeframe].w++; return acc; }, {} as Record<string, { t: number; w: number }>));
  const byMode = Object.entries(fed.reduce((acc, a) => { const m = a.selected_mode || a.execution_mode || 'unknown'; (acc[m] ||= { t: 0, w: 0 }); acc[m].t++; if (a.feedback?.outcome === 'TP_HIT') acc[m].w++; return acc; }, {} as Record<string, { t: number; w: number }>));
  return (
    <div className="space-y-8">
      <SectionHeader title="Accuracy Lab" desc="Forecast accuracy from real user-submitted outcomes." />
      <div className="p-4 rounded-2xl border border-brand-sage/30 bg-brand-sage/5">
        <p className="text-[11px] text-brand-charcoal font-medium">These figures are computed from <b>{fed.length}</b> analyses where a user logged the actual outcome. <b>Automated</b> accuracy (resolving stored entry/SL/TP against real market data) is a later milestone — it will run without relying on manual feedback.</p>
      </div>
      {fed.length === 0 ? <EmptyState title="No outcome feedback yet" note="Accuracy populates as users log outcomes on their analyses." /> : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard label="Outcomes Logged" value={fmtNum(fed.length)} />
            <MetricCard label="TP Hit Rate" value={pct(tp, fed.length)} color="text-brand-success" />
            <MetricCard label="SL Rate" value={pct(fed.filter(a => a.feedback?.outcome === 'SL_HIT').length, fed.length)} color="text-brand-error" />
            <MetricCard label="Break Even" value={pct(fed.filter(a => a.feedback?.outcome === 'BREAK_EVEN').length, fed.length)} />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Panel title="Accuracy by Timeframe">
              <div className="space-y-2">{byTf.map(([k, v]) => <div key={k} className="flex justify-between text-xs border-b border-brand-sage/5 pb-2"><span className="font-bold">{k}</span><span className="font-black">{pct(v.w, v.t)} <span className="text-brand-muted">({v.t})</span></span></div>)}</div>
            </Panel>
            <Panel title="Accuracy by Mode">
              <div className="space-y-2">{byMode.map(([k, v]) => <div key={k} className="flex justify-between text-xs border-b border-brand-sage/5 pb-2"><span className="font-bold uppercase">{k.replace('_', ' ')}</span><span className="font-black">{pct(v.w, v.t)} <span className="text-brand-muted">({v.t})</span></span></div>)}</div>
            </Panel>
          </div>
        </>
      )}
    </div>
  );
};

// ======================= 14. ADMIN AI COPILOT =============================
export const CopilotSection: React.FC = () => (
  <div className="space-y-8">
    <SectionHeader title="Admin AI Copilot" desc="Natural-language querying of platform data." />
    <EmptyState title="Available in a later milestone"
      note="The Copilot will let you ask questions like “Show top 20 users by token usage”, “Why did forecast accuracy drop this week?” or “Most common educational topics?” — answered from the real admin data with permission controls. It depends on the instrumentation now being collected (telemetry, accuracy, security), so it is intentionally built after that data accrues." />
    <div className="bg-white p-6 rounded-2xl border border-brand-sage/20 opacity-60 pointer-events-none">
      <div className="flex gap-3"><input disabled placeholder="Ask the Athenix admin copilot…" className="flex-1 bg-brand-sage/10 rounded-xl p-4 text-sm" /><button disabled className="btn-primary px-6 rounded-xl text-[10px] font-black uppercase tracking-widest">Ask</button></div>
    </div>
  </div>
);
