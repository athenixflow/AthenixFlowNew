
import React, { useState } from 'react';
import { UserProfile } from '../types';
import { refillTokens } from '../services/backend';

interface BillingProps {
  user: UserProfile | null;
}

const Billing: React.FC<BillingProps> = ({ user }) => {
  const [refillType, setRefillType] = useState<'analysis' | 'education'>('analysis');
  const [refillAmount, setRefillAmount] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null);

  const plans = [
    {
      name: 'Lite',
      price: '20',
      analysis: '10',
      education: '70',
      features: [
        'Technical Analysis Only',
        'Access to Signals',
        'Standard Education Hub',
        'Monthly Token Refill'
      ],
      buttonText: 'Choose Lite'
    },
    {
      name: 'Pro',
      price: '60',
      analysis: '30',
      education: '150',
      features: [
        'Technical + Fundamental Analysis',
        'Access to Signals',
        'Elite Knowledge Base',
        'Priority Node Processing'
      ],
      buttonText: 'Choose Pro',
      highlight: true
    },
    {
      name: 'Elite',
      price: '120',
      analysis: '70',
      education: '300',
      features: [
        'Full Institutional Access',
        'Priority Analysis Queue',
        'Access to All Signals',
        'Advanced Trade Journaling'
      ],
      buttonText: 'Choose Elite'
    }
  ];

  const handleRefill = async () => {
    if (!user || !refillAmount) return;
    const amount = parseFloat(refillAmount);
    if (isNaN(amount) || amount < 5) {
      setStatus({ type: 'error', msg: 'Minimum refill is $5.00' });
      return;
    }

    setIsProcessing(true);
    setStatus(null);

    const response = await refillTokens(user.uid, refillType, amount);

    if (response.status === 'success') {
      setStatus({ type: 'success', msg: response.message });
      setRefillAmount('');
    } else {
      setStatus({ type: 'error', msg: response.message });
    }
    setIsProcessing(false);
  };

  return (
    <div className="p-6 md:p-10 space-y-16 animate-fade-in max-w-7xl mx-auto">
      <section className="text-center space-y-4">
        <h2 className="text-4xl md:text-5xl font-black text-brand-charcoal uppercase tracking-tighter">Subscription & Billing</h2>
        <p className="text-brand-muted font-medium text-sm uppercase tracking-widest max-w-2xl mx-auto leading-relaxed">
          Manage your institutional access level and token-based processing units.
        </p>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {plans.map((plan) => (
          <div 
            key={plan.name} 
            className={`athenix-card p-10 flex flex-col justify-between relative transition-all duration-500 ${
              plan.highlight ? 'border-brand-gold ring-4 ring-brand-gold/5 scale-105 z-10' : 'bg-white'
            }`}
          >
            {plan.highlight && (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-brand-gold text-white px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl shadow-brand-gold/30">
                Recommended Tier
              </div>
            )}
            
            <div className="space-y-8">
              <div className="text-center md:text-left">
                <h3 className="text-xl font-black text-brand-charcoal uppercase tracking-[0.2em] mb-2">{plan.name}</h3>
                <div className="flex items-baseline justify-center md:justify-start gap-1">
                  <span className="text-5xl font-black text-brand-charcoal">${plan.price}</span>
                  <span className="text-xs text-brand-muted font-bold uppercase tracking-widest">/ month</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 bg-brand-sage/5 rounded-2xl border border-brand-sage/20 text-center">
                  <p className="text-[8px] text-brand-muted font-black uppercase tracking-widest mb-1">Analysis</p>
                  <p className="text-lg font-black text-brand-charcoal">{plan.analysis}u</p>
                </div>
                <div className="p-4 bg-brand-sage/5 rounded-2xl border border-brand-sage/20 text-center">
                  <p className="text-[8px] text-brand-muted font-black uppercase tracking-widest mb-1">Education</p>
                  <p className="text-lg font-black text-brand-charcoal">{plan.education}u</p>
                </div>
              </div>

              <div className="space-y-4 pt-4">
                {plan.features.map((feature, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="mt-1 w-1.5 h-1.5 bg-brand-gold rounded-full flex-shrink-0"></div>
                    <span className="text-[11px] font-bold text-brand-muted uppercase tracking-tight leading-snug">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            <button className={`w-full mt-12 py-5 font-black text-[10px] uppercase tracking-[0.3em] rounded-xl transition-all shadow-lg active:scale-95 ${
              plan.highlight 
                ? 'bg-brand-gold text-white shadow-brand-gold/20 hover:bg-brand-charcoal' 
                : 'bg-brand-charcoal text-white hover:bg-brand-gold'
            }`}>
              {plan.buttonText}
            </button>
          </div>
        ))}
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-10 border-t border-brand-sage/20">
        <div className="athenix-card p-10 bg-brand-sage/5 border-dashed space-y-8">
          <div className="space-y-2">
            <h3 className="text-xs font-black text-brand-charcoal uppercase tracking-[0.3em]">Network Consumption Logic</h3>
            <p className="text-[10px] text-brand-muted font-bold uppercase tracking-widest">How tokens power the Athenix Terminal</p>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-white rounded-xl border border-brand-sage/20">
              <div className="w-10 h-10 bg-brand-gold/10 rounded-lg flex items-center justify-center text-brand-gold font-black text-xs">A</div>
              <p className="text-[11px] font-bold text-brand-muted uppercase tracking-wide">
                1 Analysis Request = <span className="text-brand-charcoal font-black">1 Analysis Token</span>
              </p>
            </div>
            <div className="flex items-center gap-4 p-4 bg-white rounded-xl border border-brand-sage/20">
              <div className="w-10 h-10 bg-brand-sage/20 rounded-lg flex items-center justify-center text-brand-muted font-black text-xs">E</div>
              <p className="text-[11px] font-bold text-brand-muted uppercase tracking-wide">
                1 Knowledge Query = <span className="text-brand-charcoal font-black">1 Education Token</span>
              </p>
            </div>
          </div>

          <div className="pt-6 border-t border-brand-sage/10">
            <p className="text-[10px] font-black text-brand-gold uppercase tracking-[0.2em] mb-4">Institutional Refill Rates</p>
            <div className="grid grid-cols-2 gap-4">
              <p className="text-[10px] text-brand-muted font-bold uppercase tracking-widest">$5.00 = 20 Analysis Units</p>
              <p className="text-[10px] text-brand-muted font-bold uppercase tracking-widest">$5.00 = 500 Education Units</p>
            </div>
          </div>
        </div>

        <div className="athenix-card p-10 space-y-8">
          <div className="space-y-2">
            <h3 className="text-xs font-black text-brand-charcoal uppercase tracking-[0.3em]">Instant Resource Refill</h3>
            <p className="text-[10px] text-brand-muted font-bold uppercase tracking-widest">Inject credits directly into your terminal</p>
          </div>

          <div className="space-y-6">
            <div className="space-y-3">
              <label className="text-[9px] font-black text-brand-muted uppercase tracking-widest block">Select Credit Type</label>
              <div className="flex p-1 bg-brand-sage/5 border border-brand-sage/30 rounded-2xl">
                <button 
                  onClick={() => setRefillType('analysis')}
                  className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${
                    refillType === 'analysis' ? 'bg-white shadow-md text-brand-gold' : 'text-brand-muted hover:text-brand-charcoal'
                  }`}
                >
                  Analysis
                </button>
                <button 
                  onClick={() => setRefillType('education')}
                  className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${
                    refillType === 'education' ? 'bg-white shadow-md text-brand-gold' : 'text-brand-muted hover:text-brand-charcoal'
                  }`}
                >
                  Education
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[9px] font-black text-brand-muted uppercase tracking-widest block">Refill Amount (USD)</label>
              <div className="relative">
                <span className="absolute left-6 top-1/2 -translate-y-1/2 text-brand-muted font-black text-sm">$</span>
                <input 
                  type="number" 
                  value={refillAmount}
                  onChange={(e) => setRefillAmount(e.target.value)}
                  placeholder="0.00"
                  min="5"
                  className="w-full pl-12 pr-6 py-5 bg-brand-sage/5 border border-brand-sage rounded-2xl outline-none focus:border-brand-gold transition-all font-black text-sm"
                />
              </div>
            </div>

            {status && (
              <div className={`p-4 rounded-xl text-[10px] font-black uppercase ${
                status.type === 'success' ? 'bg-brand-success/10 text-brand-success' : 'bg-brand-error/10 text-brand-error'
              }`}>
                {status.msg}
              </div>
            )}

            <button 
              disabled={isProcessing}
              onClick={handleRefill}
              className="btn-primary w-full py-5 font-black text-[10px] uppercase tracking-[0.3em] rounded-xl shadow-xl mt-4 disabled:opacity-50"
            >
              {isProcessing ? 'Verifying Transaction...' : 'Authorize Token Purchase'}
            </button>
          </div>
        </div>
      </section>

      <p className="text-[9px] text-center text-brand-muted font-bold uppercase tracking-[0.2em] opacity-50 pb-10">
        Transactions are processed via institutional-grade encrypted channels.
      </p>
    </div>
  );
};

export default Billing;
