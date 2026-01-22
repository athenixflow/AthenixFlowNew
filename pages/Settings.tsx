
import React, { useState } from 'react';
import { UserProfile } from '../types';
import { checkDatabaseConnection } from '../services/firestore';
import { testMarketConnection } from '../services/marketData';

interface SettingsProps {
  user: UserProfile | null;
  onLogout: () => void;
}

const Settings: React.FC<SettingsProps> = ({ user, onLogout }) => {
  const [dbStatus, setDbStatus] = useState<'idle' | 'checking' | 'connected' | 'error'>('idle');
  const [apiStatus, setApiStatus] = useState<'idle' | 'checking' | 'connected' | 'error'>('idle');

  const runDiagnostics = async () => {
    // Check Database
    setDbStatus('checking');
    const isDbConnected = await checkDatabaseConnection();
    setDbStatus(isDbConnected ? 'connected' : 'error');

    // Check Market API
    setApiStatus('checking');
    const isApiConnected = await testMarketConnection();
    setApiStatus(isApiConnected ? 'connected' : 'error');
  };

  return (
    <div className="p-6 md:p-10 space-y-10 animate-fade-in max-w-5xl mx-auto pb-24">
      <div className="space-y-2">
        <h2 className="text-4xl font-black text-brand-charcoal uppercase tracking-tighter">Terminal Settings</h2>
        <p className="text-brand-muted font-medium text-sm uppercase tracking-widest">System configuration and security protocols.</p>
      </div>

      <div className="athenix-card p-10 space-y-8">
        <h3 className="text-xs font-black text-brand-gold uppercase tracking-[0.3em] border-l-4 border-brand-gold pl-4">Profile Identification</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-2">
            <p className="text-[10px] text-brand-muted uppercase font-black tracking-widest">Full Identity</p>
            <p className="font-black text-brand-charcoal">{user?.fullName || 'Anonymous Trader'}</p>
          </div>
          <div className="space-y-2">
            <p className="text-[10px] text-brand-muted uppercase font-black tracking-widest">Network Email</p>
            <p className="font-black text-brand-charcoal">{user?.email || 'unverified'}</p>
          </div>
          <div className="space-y-2">
            <p className="text-[10px] text-brand-muted uppercase font-black tracking-widest">Access Tier</p>
            <p className="font-black text-brand-gold uppercase">
              {user?.subscriptionPlan || 'LITE'} 
              <span className="ml-2 px-2 py-0.5 bg-brand-gold/10 text-[8px] rounded">ACTIVE</span>
            </p>
          </div>
          <div className="space-y-2">
            <p className="text-[10px] text-brand-muted uppercase font-black tracking-widest">Terminal Initialized</p>
            <p className="font-black text-brand-charcoal">
              {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
            </p>
          </div>
        </div>

        <div className="pt-8 border-t border-brand-sage/20 grid grid-cols-2 gap-4">
          <div className="p-4 bg-brand-sage/5 rounded-xl text-center border border-brand-sage/10">
            <p className="text-[9px] text-brand-muted uppercase font-black tracking-widest mb-1">Analysis Units</p>
            <p className="text-xl font-black text-brand-charcoal">{user?.analysisTokens ?? 0}u</p>
          </div>
          <div className="p-4 bg-brand-sage/5 rounded-xl text-center border border-brand-sage/10">
            <p className="text-[9px] text-brand-muted uppercase font-black tracking-widest mb-1">Education Units</p>
            <p className="text-xl font-black text-brand-charcoal">{user?.educationTokens ?? 0}u</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="athenix-card p-10 bg-brand-sage/5 border-dashed space-y-6">
          <div className="flex justify-between items-center">
             <h3 className="text-xs font-black text-brand-charcoal uppercase tracking-[0.3em]">System Diagnostics</h3>
             <button 
               onClick={runDiagnostics} 
               className="text-[9px] font-black text-brand-gold uppercase tracking-widest hover:underline"
             >
               Run System Scan
             </button>
          </div>
          
          {/* DB Check */}
          <div className="flex items-center gap-4">
            <div className={`w-3 h-3 rounded-full transition-colors duration-300 ${
              dbStatus === 'connected' ? 'bg-brand-success shadow-[0_0_10px_rgba(46,125,50,0.5)]' : 
              dbStatus === 'error' ? 'bg-brand-error shadow-[0_0_10px_rgba(211,47,47,0.5)]' :
              dbStatus === 'checking' ? 'bg-brand-warning animate-pulse' : 'bg-brand-sage'
            }`}></div>
            <div className="flex-1">
              <p className="text-[10px] font-black text-brand-charcoal uppercase tracking-widest">
                Firestore Database
              </p>
              <p className="text-[9px] text-brand-muted font-medium mt-1">
                {dbStatus === 'idle' && 'Waiting for scan...'}
                {dbStatus === 'checking' && 'Pinging Firestore Node...'}
                {dbStatus === 'connected' && 'Bridge Established'}
                {dbStatus === 'error' && 'Connection Failed'}
              </p>
            </div>
          </div>

          {/* API Check */}
          <div className="flex items-center gap-4">
            <div className={`w-3 h-3 rounded-full transition-colors duration-300 ${
              apiStatus === 'connected' ? 'bg-brand-success shadow-[0_0_10px_rgba(46,125,50,0.5)]' : 
              apiStatus === 'error' ? 'bg-brand-error shadow-[0_0_10px_rgba(211,47,47,0.5)]' :
              apiStatus === 'checking' ? 'bg-brand-warning animate-pulse' : 'bg-brand-sage'
            }`}></div>
            <div className="flex-1">
              <p className="text-[10px] font-black text-brand-charcoal uppercase tracking-widest">
                Market Data Feed (Vercel API)
              </p>
              <p className="text-[9px] text-brand-muted font-medium mt-1">
                {apiStatus === 'idle' && 'Waiting for scan...'}
                {apiStatus === 'checking' && 'Testing /api/market endpoint...'}
                {apiStatus === 'connected' && 'Feed Active (JSON Received)'}
                {apiStatus === 'error' && 'Feed Unreachable (Check Vercel/Keys)'}
              </p>
            </div>
          </div>
        </div>

        <div className="athenix-card p-10 space-y-6">
          <h3 className="text-xs font-black text-brand-error uppercase tracking-[0.3em] mb-4">Session Management</h3>
          <button 
            onClick={onLogout}
            className="w-full py-4 bg-brand-error/5 text-brand-error border border-brand-error/20 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-brand-error hover:text-white transition-all"
          >
            Purge Current Session
          </button>
        </div>
      </div>

      <div className="pt-10 border-t border-brand-sage/20">
        <p className="text-[10px] text-brand-muted font-bold uppercase tracking-widest text-center opacity-40">
          Terminal Profile Encrypted & Secure • System v5.1
        </p>
      </div>
    </div>
  );
};

export default Settings;
