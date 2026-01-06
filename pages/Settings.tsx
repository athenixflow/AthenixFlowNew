import React from 'react';
import { UserProfile } from '../types';

interface SettingsProps {
  user: UserProfile | null;
}

const Settings: React.FC<SettingsProps> = ({ user }) => {
  return (
    <div className="p-6 md:p-10 space-y-10 animate-fade-in max-w-5xl mx-auto">
      <div className="space-y-2">
        <h2 className="text-4xl font-black text-brand-charcoal uppercase tracking-tighter">Terminal Settings</h2>
        <p className="text-brand-muted font-medium text-sm uppercase tracking-widest">System configuration and security protocols.</p>
      </div>

      <div className="athenix-card p-10 space-y-8">
        <h3 className="text-xs font-black text-brand-gold uppercase tracking-[0.3em]">Profile Identification</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-2">
            <p className="text-[10px] text-brand-muted uppercase font-black tracking-widest">Full Identity</p>
            <p className="font-black text-brand-charcoal">{user?.fullName || 'Not available yet'}</p>
          </div>
          <div className="space-y-2">
            <p className="text-[10px] text-brand-muted uppercase font-black tracking-widest">Network Email</p>
            <p className="font-black text-brand-charcoal">{user?.email || 'Not available yet'}</p>
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

      <div className="athenix-card p-10 bg-brand-sage/5 border-dashed">
        <h3 className="text-xs font-black text-brand-muted uppercase tracking-[0.3em] mb-4">Security Protocol</h3>
        <p className="text-[10px] text-brand-muted font-medium leading-relaxed uppercase tracking-wider">
          Profile data is synchronized via Google Cloud Firestore. Settings are currently in "READ-ONLY" mode to preserve institutional integrity during backend synchronization.
        </p>
      </div>

      <div className="pt-10 border-t border-brand-sage/20">
        <p className="text-[10px] text-brand-muted font-bold uppercase tracking-widest text-center opacity-40">
          Terminal Profile Encrypted & Secure
        </p>
      </div>
    </div>
  );
};

export default Settings;