import React from 'react';
import { UserProfile } from '../types';

interface SubscribeModalProps {
  user: UserProfile | null;
  onClose: () => void;
  onSubscribe: () => void;
}

const PERKS = [
  'Institutional AI market analysis on demand',
  'Your personal AI trading mentor (Education Hub)',
  'Full liquidity, structure & probability engine',
  'Trade journal sync & setup revalidation'
];

const SubscribeModal: React.FC<SubscribeModalProps> = ({ user, onClose, onSubscribe }) => {
  const firstName = user?.fullName ? user.fullName.split(' ')[0] : '';

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label="Subscribe to unlock analysis"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-brand-charcoal/50 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Card */}
      <div className="relative w-full max-w-md bg-white rounded-3xl border border-brand-sage/30 shadow-2xl overflow-hidden animate-slide-up max-h-[90vh] overflow-y-auto">
        {/* Accent header */}
        <div className="relative bg-brand-charcoal p-7 overflow-hidden">
          <div className="absolute -top-12 -right-12 w-40 h-40 bg-brand-gold/20 blur-3xl rounded-full" />
          <button
            onClick={onClose}
            aria-label="Close"
            className="absolute top-4 right-4 w-9 h-9 rounded-lg flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div className="relative flex items-center gap-3">
            <div className="w-12 h-12 bg-brand-gold rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-brand-gold/30">A</div>
            <div>
              <p className="text-[9px] font-black text-brand-gold uppercase tracking-[0.3em]">Athenix Network</p>
              <h3 className="text-xl font-black text-white tracking-tight">Unlock Live Analysis</h3>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-7 space-y-6">
          <p className="text-sm text-brand-charcoal font-medium leading-relaxed">
            {firstName ? `${firstName}, your` : 'Your'} account doesn&apos;t have analysis units yet. Subscribe to fuel the
            engine and start generating institutional-grade setups.
          </p>

          <ul className="space-y-3">
            {PERKS.map((perk, i) => (
              <li key={i} className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-brand-gold/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-3 h-3 text-brand-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-xs font-medium text-brand-charcoal leading-relaxed">{perk}</span>
              </li>
            ))}
          </ul>

          <div className="space-y-3 pt-1">
            <button
              onClick={onSubscribe}
              className="btn-primary w-full py-4 rounded-xl text-[11px] font-black uppercase tracking-[0.2em] shadow-lg"
            >
              View Subscription Plans
            </button>
            <button
              onClick={onClose}
              className="w-full py-3 text-[10px] font-black text-brand-muted uppercase tracking-[0.2em] hover:text-brand-charcoal transition-colors"
            >
              Maybe later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscribeModal;
