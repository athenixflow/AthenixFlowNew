import React, { useState, useEffect } from 'react';
import { AdminOverviewMetrics, TradeAnalysis, UserProfile } from '../types';
import { getAdminMetrics, getPublishedSignals, publishSignal, getUserAnalysisHistory, getStrategyPerformance } from '../services/firestore';
import { ICONS } from '../constants';

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
  const [metrics, setMetrics] = useState<AdminOverviewMetrics | null>(null);
  const [publishedSignals, setPublishedSignals] = useState<TradeAnalysis[]>([]);
  const [recentAnalyses, setRecentAnalyses] = useState<TradeAnalysis[]>([]);
  const [strategyStats, setStrategyStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'SIGNALS' | 'STRATEGY'>('OVERVIEW');

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    setLoading(true);
    const [m, p, r, s] = await Promise.all([
      getAdminMetrics(),
      getPublishedSignals(),
      // For demo, we'll just fetch some history. In real admin, we'd fetch all recent analyses.
      getUserAnalysisHistory('GLOBAL_ADMIN'),
      getStrategyPerformance()
    ]);
    setMetrics(m);
    setPublishedSignals(p);
    setRecentAnalyses(r);
    setStrategyStats(s);
    setLoading(false);
  };

  const handleTogglePublish = async (analysisId: string, currentStatus: boolean) => {
    await publishSignal(analysisId, !currentStatus);
    loadAdminData();
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-gold"></div>
    </div>
  );

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-brand-charcoal uppercase tracking-tighter">Admin Control Center</h2>
          <p className="text-sm text-brand-muted font-medium">Platform oversight and signal management.</p>
        </div>
        
        <div className="flex bg-brand-sage/10 p-1 rounded-xl">
          {['OVERVIEW', 'SIGNALS', 'STRATEGY'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                activeTab === tab ? 'bg-white text-brand-charcoal shadow-sm' : 'text-brand-muted hover:text-brand-gold'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'OVERVIEW' && metrics && (
        <div className="space-y-8">
          {/* Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Users', value: metrics.totalUsers, icon: ICONS.User },
              { label: 'Active Users', value: metrics.activeUsers, icon: ICONS.Chart },
              { label: 'Total Analyses', value: metrics.totalAnalyses, icon: ICONS.Target },
              { label: 'Monthly Revenue', value: `$${metrics.revenue.monthly}`, icon: ICONS.Check, color: 'text-brand-success' },
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

          {/* AI Performance */}
          <div className="bg-brand-charcoal text-white p-8 rounded-[2rem] shadow-xl">
            <h3 className="text-xl font-black uppercase tracking-tighter mb-8 flex items-center gap-3">
              <div className="w-2 h-2 bg-brand-gold rounded-full"></div>
              Neural Engine Performance
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              <div>
                <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2">Prediction Accuracy</p>
                <p className="text-4xl font-black text-brand-gold">{metrics.aiPerformance.accuracy}%</p>
                <div className="mt-4 h-1 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-brand-gold" style={{ width: `${metrics.aiPerformance.accuracy}%` }}></div>
                </div>
              </div>
              <div>
                <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2">Avg. Confluence Score</p>
                <p className="text-4xl font-black text-brand-success">{metrics.aiPerformance.avgConfluence}%</p>
                <div className="mt-4 h-1 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-brand-success" style={{ width: `${metrics.aiPerformance.avgConfluence}%` }}></div>
                </div>
              </div>
              <div>
                <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2">Total Predictions</p>
                <p className="text-4xl font-black text-white">{metrics.aiPerformance.totalPredictions}</p>
                <p className="text-[10px] text-white/40 mt-2 uppercase font-bold">Processed since launch</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'SIGNALS' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-black text-brand-charcoal uppercase tracking-tighter">Signal Management</h3>
            <p className="text-[10px] text-brand-muted font-black uppercase tracking-widest">{publishedSignals.length} Active Signals</p>
          </div>

          <div className="bg-white rounded-2xl border border-brand-sage/20 overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-brand-sage/5">
                  <th className="p-4 text-[10px] font-black text-brand-muted uppercase tracking-widest">Instrument</th>
                  <th className="p-4 text-[10px] font-black text-brand-muted uppercase tracking-widest">Direction</th>
                  <th className="p-4 text-[10px] font-black text-brand-muted uppercase tracking-widest">Quality</th>
                  <th className="p-4 text-[10px] font-black text-brand-muted uppercase tracking-widest">Status</th>
                  <th className="p-4 text-[10px] font-black text-brand-muted uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {publishedSignals.map(signal => (
                  <tr key={signal.id} className="border-t border-brand-sage/10 hover:bg-brand-sage/5 transition-colors">
                    <td className="p-4">
                      <p className="text-sm font-black text-brand-charcoal uppercase">{safeRender(signal.instrument)}</p>
                      <p className="text-[8px] text-brand-muted font-bold uppercase">{safeRender(signal.timeframe)}</p>
                    </td>
                    <td className="p-4">
                      <span className={`text-[10px] font-black uppercase ${signal.signal?.direction === 'buy' ? 'text-brand-success' : 'text-brand-error'}`}>
                        {safeRender(signal.signal?.direction)}
                      </span>
                    </td>
                    <td className="p-4">
                      <p className="text-sm font-bold text-brand-gold">{safeRender(signal.quality_score, "0")}%</p>
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-1 bg-brand-success/10 text-brand-success text-[8px] font-black uppercase rounded">Published</span>
                    </td>
                    <td className="p-4 text-right">
                      <button 
                        onClick={() => handleTogglePublish(signal.id!, true)}
                        className="text-[10px] font-black text-brand-error uppercase hover:underline"
                      >
                        Unpublish
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'STRATEGY' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white p-8 rounded-2xl border border-brand-sage/20">
            <h4 className="text-lg font-black text-brand-charcoal uppercase tracking-tighter mb-6">Strategy Win Rates</h4>
            <div className="space-y-6">
              {strategyStats.length > 0 ? strategyStats.map((item, i) => (
                <div key={i}>
                  <div className="flex justify-between mb-2">
                    <span className="text-[10px] font-black text-brand-charcoal uppercase tracking-widest">{item.label}</span>
                    <span className="text-[10px] font-black text-brand-gold uppercase">{item.winRate}%</span>
                  </div>
                  <div className="h-1.5 bg-brand-sage/10 rounded-full overflow-hidden">
                    <div className="h-full bg-brand-gold" style={{ width: `${item.winRate}%` }}></div>
                  </div>
                </div>
              )) : (
                <p className="text-brand-muted text-[10px] font-bold uppercase">No strategy data available yet.</p>
              )}
            </div>
          </div>

          <div className="bg-white p-8 rounded-2xl border border-brand-sage/20">
            <h4 className="text-lg font-black text-brand-charcoal uppercase tracking-tighter mb-6">Market Sector Performance</h4>
            <div className="space-y-6">
              {[
                { label: 'Forex', volume: 450, performance: '+4.2%' },
                { label: 'Metals', volume: 280, performance: '+6.8%' },
                { label: 'Indices', volume: 320, performance: '+2.1%' },
                { label: 'Stocks', volume: 150, performance: '-1.4%' },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-brand-sage/5 rounded-xl">
                  <div>
                    <p className="text-[10px] font-black text-brand-charcoal uppercase tracking-widest">{item.label}</p>
                    <p className="text-[8px] text-brand-muted font-bold uppercase">{item.volume} Analyses</p>
                  </div>
                  <span className={`text-xs font-black ${item.performance.startsWith('+') ? 'text-brand-success' : 'text-brand-error'}`}>
                    {item.performance}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
