import React from 'react';
import { ICONS } from '../../constants';
import {
  UserProfile, Subscription, TradeAnalysis, Referral, TradingSignal,
  TokenTransaction, JournalEntry, EducationInteraction, AuditLogEntry,
  AiTelemetry, SecurityEvent
} from '../../types';

// All live admin data, fed from the real-time Firestore subscriptions held by
// the AdminDashboard container. Every section computes its metrics from these.
export interface AdminData {
  users: UserProfile[];
  subscriptions: Subscription[];
  analyses: TradeAnalysis[];
  signals: TradingSignal[];
  referrals: Referral[];
  journal: JournalEntry[];
  education: EducationInteraction[];
  tokenTx: TokenTransaction[];
  auditLogs: AuditLogEntry[];
  telemetry: AiTelemetry[];
  security: SecurityEvent[];
  health: { db: boolean; market: boolean };
}

// --- formatting helpers ------------------------------------------------------
export const fmtNum = (n: number | undefined | null) =>
  (n ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 });
export const fmtUsd = (n: number | undefined | null) =>
  `$${(n ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
export const fmtUsd4 = (n: number | undefined | null) =>
  `$${(n ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`;
export const pct = (num: number, den: number) => (den > 0 ? `${((num / den) * 100).toFixed(1)}%` : '—');
export const daysAgo = (n: number) => new Date(Date.now() - n * 86400000);
export const tsToDate = (v: any): Date => {
  if (!v) return new Date(0);
  if (typeof v === 'string' || typeof v === 'number') return new Date(v);
  if (typeof v?.toDate === 'function') return v.toDate();
  return new Date(0);
};

export function downloadCsv(filename: string, rows: Record<string, any>[]) {
  if (!rows.length) return;
  const headerSet = new Set<string>();
  rows.forEach(r => Object.keys(r).forEach(k => headerSet.add(k)));
  const headers = Array.from(headerSet);
  const esc = (v: any) => {
    const s = v == null ? '' : typeof v === 'object' ? JSON.stringify(v) : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [headers.join(','), ...rows.map(r => headers.map(h => esc(r[h])).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

// --- primitives --------------------------------------------------------------
export const MetricCard = ({ label, value, icon: Icon = ICONS.Chart, color = 'text-brand-charcoal', sub }:
  { label: string; value: string | number; icon?: any; color?: string; sub?: string }) => (
  <div className="bg-white p-5 rounded-2xl border border-brand-sage/20 shadow-sm">
    <div className="flex items-center justify-between mb-2">
      <p className="text-[10px] font-black text-brand-muted uppercase tracking-widest">{label}</p>
      {Icon && <Icon className="w-4 h-4 text-brand-gold" />}
    </div>
    <p className={`text-2xl font-black ${color}`}>{value}</p>
    {sub && <p className="text-[9px] text-brand-muted font-bold uppercase tracking-wide mt-1">{sub}</p>}
  </div>
);

export const Panel = ({ title, children, action }:
  { title?: string; children: React.ReactNode; action?: React.ReactNode }) => (
  <div className="bg-white p-6 rounded-2xl border border-brand-sage/20">
    {(title || action) && (
      <div className="flex items-center justify-between mb-4">
        {title && <h3 className="text-sm font-black text-brand-charcoal uppercase tracking-widest">{title}</h3>}
        {action}
      </div>
    )}
    {children}
  </div>
);

export const SectionHeader = ({ title, desc }: { title: string; desc?: string }) => (
  <div className="space-y-1">
    <h2 className="text-2xl font-black text-brand-charcoal uppercase tracking-tighter">{title}</h2>
    {desc && <p className="text-xs text-brand-muted font-medium">{desc}</p>}
  </div>
);

// Honest "no live data yet" state — used instead of any fabricated number.
export const EmptyState = ({ title, note }: { title: string; note?: string }) => (
  <div className="p-10 border border-dashed border-brand-sage/40 rounded-2xl text-center bg-brand-sage/5">
    <div className="w-12 h-12 mx-auto mb-4 rounded-2xl bg-brand-sage/15 flex items-center justify-center text-brand-muted">
      <ICONS.Chart className="w-5 h-5" />
    </div>
    <p className="text-[11px] font-black text-brand-charcoal uppercase tracking-widest">{title}</p>
    {note && <p className="text-[10px] text-brand-muted font-medium mt-2 max-w-md mx-auto leading-relaxed">{note}</p>}
  </div>
);

export const StatusDot = ({ ok, degraded }: { ok: boolean; degraded?: boolean }) => (
  <div className={`w-3 h-3 rounded-full ${degraded ? 'bg-brand-warning' : ok ? 'bg-brand-success' : 'bg-brand-error'}`} />
);

export const Pill = ({ children, tone = 'neutral' }: { children: React.ReactNode; tone?: 'neutral' | 'success' | 'error' | 'gold' }) => {
  const tones: Record<string, string> = {
    neutral: 'bg-brand-sage/15 text-brand-charcoal',
    success: 'bg-brand-success/10 text-brand-success',
    error: 'bg-brand-error/10 text-brand-error',
    gold: 'bg-brand-gold/10 text-brand-gold'
  };
  return <span className={`px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest ${tones[tone]}`}>{children}</span>;
};

export const CHART_COLORS = ['#1F1F1F', '#C5A24A', '#C1C6C0', '#6B6F6A', '#2E7D32', '#ED6C02'];
