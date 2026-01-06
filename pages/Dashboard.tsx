import React from 'react';
import { ICONS } from '../constants';
import { UserProfile } from '../types';

interface DashboardProps {
  user: UserProfile | null;
  onNavigate: (page: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ user, onNavigate }) => {
  return (
    <div className="p-6 md:p-10 space-y-12 animate-fade-in max-w-7xl mx-auto">
      <section className="space-y-2">
        <h2 className="text-4xl font-black text-brand-charcoal uppercase tracking-tighter">
          Institutional Trading Terminal
        </h2>
        <p className="text-brand-muted font-medium text-sm uppercase tracking-widest">
          Hello {user?.fullName || 'Trader'}, your central hub for neural market analysis is active.
        </p>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="athenix-card p-8 flex flex-col justify-between">
          <p className="text-[10px] text-brand-muted uppercase font-black tracking-widest mb-6">Subscription Tier</p>
          <div>
            <span className="text-2xl font-black text-brand-charcoal uppercase tracking-tighter">
              {user?.subscriptionPlan || 'Not available yet'}
            </span>
            <p className="text-[10px] text-brand-gold font-bold uppercase mt-1 tracking-widest">Athenix Network Access</p>
          </div>
        </div>

        <div className="athenix-card p-8 flex flex-col justify-between">
          <p className="text-[10px] text-brand-muted uppercase font-black tracking-widest mb-6">Analysis Credits</p>
          <div>
            <span className="text-2xl font-black text-brand-charcoal uppercase tracking-tighter">
              {user?.analysisTokens ?? '0'} Units
            </span>
            <p className="text-[10px] text-brand-muted font-bold uppercase mt-1 tracking-widest">Neural Processing Units</p>
          </div>
        </div>

        <div className="athenix-card p-8 flex flex-col justify-between">
          <p className="text-[10px] text-brand-muted uppercase font-black tracking-widest mb-6">Education Credits</p>
          <div>
            <span className="text-2xl font-black text-brand-charcoal uppercase tracking-tighter">
              {user?.educationTokens ?? '0'} Units
            </span>
            <p className="text-[10px] text-brand-muted font-bold uppercase mt-1 tracking-widest">Knowledge Base Units</p>
          </div>
        </div>

        <div className="athenix-card p-8 flex flex-col justify-between bg-brand-sage/5 border-dashed">
          <p className="text-[10px] text-brand-muted uppercase font-black tracking-widest mb-6">Terminal Status</p>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${user ? 'bg-brand-success' : 'bg-brand-warning'}`}></div>
            <span className="text-2xl font-black text-brand-charcoal uppercase tracking-tighter">
              {user ? 'Operational' : 'Syncing...'}
            </span>
          </div>
          <p className="text-[10px] text-brand-muted font-bold uppercase mt-1 tracking-widest">Secure Firestore Protocol</p>
        </div>
      </section>

      <section className="space-y-6">
        <h3 className="text-xs font-black text-brand-muted uppercase tracking-[0.3em]">Quick Launch</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <button onClick={() => onNavigate('assistant')} className="athenix-card p-6 flex flex-col items-center justify-center text-center gap-4 hover:border-brand-gold transition-all group">
            <div className="w-12 h-12 bg-brand-gold/10 rounded-2xl flex items-center justify-center text-brand-gold group-hover:bg-brand-gold group-hover:text-white transition-all"><ICONS.Assistant /></div>
            <div><p className="text-xs font-black text-brand-charcoal uppercase tracking-widest">Analyze Market</p><p className="text-[9px] text-brand-muted font-bold uppercase">Launch Neural Core</p></div>
          </button>
          <button onClick={() => onNavigate('education')} className="athenix-card p-6 flex flex-col items-center justify-center text-center gap-4 hover:border-brand-gold transition-all group">
            <div className="w-12 h-12 bg-brand-gold/10 rounded-2xl flex items-center justify-center text-brand-gold group-hover:bg-brand-gold group-hover:text-white transition-all"><ICONS.Education /></div>
            <div><p className="text-xs font-black text-brand-charcoal uppercase tracking-widest">Mentor Terminal</p><p className="text-[9px] text-brand-muted font-bold uppercase">Open Knowledge Base</p></div>
          </button>
          <button onClick={() => onNavigate('signals')} className="athenix-card p-6 flex flex-col items-center justify-center text-center gap-4 hover:border-brand-gold transition-all group">
            <div className="w-12 h-12 bg-brand-gold/10 rounded-2xl flex items-center justify-center text-brand-gold group-hover:bg-brand-gold group-hover:text-white transition-all"><ICONS.Signals /></div>
            <div><p className="text-xs font-black text-brand-charcoal uppercase tracking-widest">Signal Feed</p><p className="text-[9px] text-brand-muted font-bold uppercase">View Verified Setups</p></div>
          </button>
          <button onClick={() => onNavigate('journal')} className="athenix-card p-6 flex flex-col items-center justify-center text-center gap-4 hover:border-brand-gold transition-all group">
            <div className="w-12 h-12 bg-brand-gold/10 rounded-2xl flex items-center justify-center text-brand-gold group-hover:bg-brand-gold group-hover:text-white transition-all"><ICONS.Journal /></div>
            <div><p className="text-xs font-black text-brand-charcoal uppercase tracking-widest">Review Journal</p><p className="text-[9px] text-brand-muted font-bold uppercase">Analyze Trade Performance</p></div>
          </button>
        </div>
      </section>
    </div>
  );
};

export default Dashboard;