
import React, { useState } from 'react';
import { UserProfile, UserRole, SubscriptionPlan } from '../types';

interface AuthPageProps {
  mode: 'login' | 'signup';
  onAuthSuccess: (user: UserProfile) => void;
  onToggleMode: () => void;
}

const AuthPage: React.FC<AuthPageProps> = ({ mode, onAuthSuccess, onToggleMode }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const mockUser: UserProfile = {
      uid: Math.random().toString(36).substring(7),
      fullName: mode === 'signup' ? fullName : (email.split('@')[0] || 'Trader'),
      email,
      role: UserRole.USER,
      subscription: SubscriptionPlan.PRO,
      tokens: { analysis: 50, education: 100 },
      createdAt: new Date().toISOString()
    };
    onAuthSuccess(mockUser);
  };

  return (
    <div className="min-h-screen bg-white flex">
      <div className="flex-1 flex flex-col justify-center px-8 md:px-24 py-12">
        <div className="max-w-md w-full mx-auto space-y-10">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 bg-brand-gold rounded-lg flex items-center justify-center text-white font-bold">A</div>
             <span className="text-xl font-black tracking-tighter text-brand-charcoal">ATHENIX</span>
          </div>

          <div className="space-y-2">
            <h2 className="text-4xl font-black text-brand-charcoal">
              {mode === 'login' ? 'Terminal Login' : 'Register Account'}
            </h2>
            <p className="text-brand-muted font-medium">
              Access institutional-grade AI trading intelligence.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {mode === 'signup' && (
              <div className="space-y-2">
                <label className="text-[10px] font-black text-brand-muted uppercase tracking-widest">Full Name</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-5 py-4 bg-brand-sage/5 border border-brand-sage rounded-xl focus:ring-1 focus:ring-brand-gold focus:border-brand-gold transition-all outline-none font-medium"
                  placeholder="E.g. Alexander Elder"
                />
              </div>
            )}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-brand-muted uppercase tracking-widest">Professional Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-5 py-4 bg-brand-sage/5 border border-brand-sage rounded-xl focus:ring-1 focus:ring-brand-gold focus:border-brand-gold transition-all outline-none font-medium"
                placeholder="trader@terminal.com"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-brand-muted uppercase tracking-widest">Secure Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-5 py-4 bg-brand-sage/5 border border-brand-sage rounded-xl focus:ring-1 focus:ring-brand-gold focus:border-brand-gold transition-all outline-none font-medium"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              className="btn-primary w-full py-5 font-black rounded-xl tracking-widest uppercase text-sm mt-4"
            >
              {mode === 'login' ? 'Enter System' : 'Create Profile'}
            </button>
          </form>

          <div className="text-center">
            <button
              onClick={onToggleMode}
              className="text-xs font-bold text-brand-muted hover:text-brand-gold transition-colors tracking-wide"
            >
              {mode === 'login' ? "UNREGISTERED? JOIN ATHENIX" : "ALREADY VERIFIED? LOGIN"}
            </button>
          </div>
        </div>
      </div>

      <div className="hidden lg:block flex-1 bg-brand-sage relative overflow-hidden">
        <div className="absolute inset-0 bg-brand-charcoal opacity-10"></div>
        <div className="absolute top-0 left-0 w-full h-full bg-premium-gradient opacity-30"></div>
        <div className="h-full flex flex-col justify-end p-20 relative z-10">
          <div className="max-w-md">
            <div className="w-16 h-1 bg-brand-gold mb-8"></div>
            <h3 className="text-5xl font-black text-brand-charcoal leading-tight mb-6">
              Empowering Traders with Neural Intelligence.
            </h3>
            <p className="text-brand-muted font-bold uppercase tracking-[0.2em] text-sm">Forex • Stocks • Crypto</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
