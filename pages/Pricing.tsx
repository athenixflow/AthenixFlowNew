
import React from 'react';
import { UserProfile } from '../types';

interface PricingProps {
  user: UserProfile | null;
  onNavigate: (page: string) => void;
}

const Pricing: React.FC<PricingProps> = ({ user, onNavigate }) => {
  const handlePlanClick = (plan: string) => {
    if (user) {
      onNavigate('billing');
    } else {
      onNavigate('signup');
    }
  };

  const plans = [
    {
      title: 'Lite',
      price: '20',
      description: 'Essential tools for the disciplined technical trader.',
      tokens: { analysis: 10, education: 70 },
      features: [
        'AI Assistant (Technical Only)',
        'Access to Trading Signals',
        'Standard Education Hub',
        'Trade Journaling',
        'Dashboard Progress Tracking',
        'Community-level Insights'
      ],
      limitations: ['No Fundamental Analysis', 'No Hybrid AI Analysis'],
      buttonText: 'Get Started with Lite',
      highlight: false
    },
    {
      title: 'Pro',
      price: '60',
      description: 'Advanced hybrid intelligence for serious market participants.',
      tokens: { analysis: 30, education: 150 },
      features: [
        'Hybrid AI (Technical + Fundamentals)',
        'AI Assistant (Full Context)',
        'Access to Trading Signals',
        'Elite Knowledge Base',
        'Trade Journaling',
        'Advanced Dashboard Insights',
        'Priority AI Processing'
      ],
      limitations: [],
      buttonText: 'Upgrade to Pro',
      highlight: true
    },
    {
      title: 'Elite',
      price: '120',
      description: 'Maximum institutional power and priority network access.',
      tokens: { analysis: 70, education: 300 },
      features: [
        'Full Institutional Access',
        'Advanced Hybrid Analysis',
        'Priority Signals Access',
        'Education Hub (Advanced Content)',
        'Trade Journaling & Metrics',
        'Fastest AI Response Time',
        'Early Access to Features'
      ],
      limitations: [],
      buttonText: 'Go Elite',
      highlight: false
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-brand-sage/20 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => onNavigate('landing')}>
            <div className="w-8 h-8 bg-brand-gold rounded-lg flex items-center justify-center text-white font-black text-sm">A</div>
            <span className="text-xl font-black tracking-tighter text-brand-charcoal uppercase">ATHENIX</span>
          </div>
          <div className="flex items-center gap-6">
            {!user && (
              <button 
                onClick={() => onNavigate('login')}
                className="text-[10px] font-black uppercase tracking-widest text-brand-muted hover:text-brand-charcoal"
              >
                Log In
              </button>
            )}
            <button 
              onClick={() => onNavigate(user ? 'dashboard' : 'signup')}
              className="btn-primary px-5 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest"
            >
              {user ? 'Dashboard' : 'Get Started'}
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="py-20 px-6 text-center space-y-6 bg-brand-sage/5 border-b border-brand-sage/10">
        <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
          <div className="inline-block px-4 py-1.5 bg-brand-gold/10 border border-brand-gold/20 rounded-full">
            <span className="text-[10px] font-black text-brand-gold uppercase tracking-[0.2em]">Institutional Access</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-brand-charcoal tracking-tighter uppercase leading-none">
            Choose the Plan That Fits <br/> <span className="text-brand-gold">Your Trading Journey</span>
          </h1>
          <p className="text-lg text-brand-muted font-medium max-w-2xl mx-auto leading-relaxed">
            Flexible subscriptions designed to power intelligent analysis, continuous learning, and smarter trading decisions.
          </p>
          <p className="text-[10px] text-brand-muted font-black uppercase tracking-widest opacity-60">
            Upgrade, downgrade, or refill tokens anytime.
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-20 space-y-24">
        
        {/* Pricing Cards */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          {plans.map((plan, idx) => (
            <div 
              key={idx}
              className={`athenix-card flex flex-col relative transition-all duration-300 ${
                plan.highlight 
                  ? 'border-brand-gold shadow-2xl shadow-brand-gold/10 scale-105 z-10' 
                  : 'bg-white hover:border-brand-sage/50'
              }`}
            >
              {plan.highlight && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-brand-gold text-white px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg">
                  Most Popular
                </div>
              )}

              <div className="p-8 border-b border-brand-sage/10 space-y-4">
                <h3 className="text-xl font-black text-brand-charcoal uppercase tracking-[0.2em]">{plan.title}</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-5xl font-black text-brand-charcoal tracking-tighter">${plan.price}</span>
                  <span className="text-xs text-brand-muted font-bold uppercase tracking-widest">/ month</span>
                </div>
                <p className="text-xs text-brand-muted font-medium leading-relaxed min-h-[40px]">
                  {plan.description}
                </p>
              </div>

              <div className="p-8 space-y-8 flex-1 flex flex-col">
                {/* Token Allowance */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-brand-sage/5 rounded-xl text-center border border-brand-sage/10">
                    <p className="text-[8px] text-brand-muted font-black uppercase tracking-widest mb-1">Analysis</p>
                    <p className="text-sm font-black text-brand-charcoal">{plan.tokens.analysis} / mo</p>
                  </div>
                  <div className="p-3 bg-brand-sage/5 rounded-xl text-center border border-brand-sage/10">
                    <p className="text-[8px] text-brand-muted font-black uppercase tracking-widest mb-1">Education</p>
                    <p className="text-sm font-black text-brand-charcoal">{plan.tokens.education} / mo</p>
                  </div>
                </div>

                {/* Features List */}
                <div className="space-y-4 flex-1">
                  {plan.features.map((feature, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="mt-1.5 w-1.5 h-1.5 bg-brand-gold rounded-full flex-shrink-0"></div>
                      <span className="text-[11px] font-bold text-brand-charcoal uppercase tracking-tight leading-snug">{feature}</span>
                    </div>
                  ))}
                  {plan.limitations.map((limit, i) => (
                    <div key={i} className="flex items-start gap-3 opacity-50">
                      <div className="mt-1.5 w-1.5 h-1.5 bg-brand-sage rounded-full flex-shrink-0"></div>
                      <span className="text-[11px] font-medium text-brand-muted uppercase tracking-tight leading-snug line-through">{limit}</span>
                    </div>
                  ))}
                </div>

                <button 
                  onClick={() => handlePlanClick(plan.title)}
                  className={`w-full py-5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-lg active:scale-95 ${
                    plan.highlight 
                      ? 'bg-brand-gold text-white hover:bg-brand-charcoal shadow-brand-gold/20' 
                      : 'bg-brand-charcoal text-white hover:bg-brand-gold'
                  }`}
                >
                  {plan.buttonText}
                </button>
              </div>
            </div>
          ))}
        </section>

        {/* Token Refill Section */}
        <section className="athenix-card p-12 bg-brand-charcoal text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-brand-gold/10 blur-[80px] rounded-full"></div>
          
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Need More Tokens?</h2>
              <p className="text-brand-sage text-sm font-medium leading-relaxed max-w-md">
                Running high-volume analysis? Top up your balance anytime without changing your subscription tier. Tokens never expire as long as your subscription is active.
              </p>
              <button 
                onClick={() => handlePlanClick('refill')}
                className="px-8 py-4 bg-brand-gold text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-brand-charcoal transition-colors shadow-lg shadow-brand-gold/20"
              >
                Refill Tokens
              </button>
            </div>

            <div className="space-y-6">
              <h3 className="text-xs font-black text-brand-gold uppercase tracking-[0.3em] mb-4">Refill Rates</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="p-6 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-sm">
                  <p className="text-[10px] font-black text-brand-sage uppercase tracking-widest mb-2">Analysis Rate</p>
                  <p className="text-2xl font-black text-white mb-2">$5.00</p>
                  <p className="text-[10px] font-bold text-brand-gold uppercase tracking-widest">= 20 Analysis Tokens</p>
                  <p className="text-[9px] text-white/40 mt-2">Example: $20 = 80 Tokens</p>
                </div>
                <div className="p-6 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-sm">
                  <p className="text-[10px] font-black text-brand-sage uppercase tracking-widest mb-2">Education Rate</p>
                  <p className="text-2xl font-black text-white mb-2">$5.00</p>
                  <p className="text-[10px] font-bold text-brand-gold uppercase tracking-widest">= 500 Education Tokens</p>
                  <p className="text-[9px] text-white/40 mt-2">Example: $20 = 2,000 Tokens</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Flexibility Notice */}
        <section className="text-center max-w-3xl mx-auto space-y-6">
          <h2 className="text-xs font-black text-brand-charcoal uppercase tracking-[0.3em]">Plan Flexibility</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left p-8 bg-brand-sage/5 rounded-2xl border border-brand-sage/10">
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-brand-gold/10 flex items-center justify-center text-brand-gold font-bold">✓</div>
              <div>
                <h4 className="text-sm font-black text-brand-charcoal uppercase tracking-wide">Change Anytime</h4>
                <p className="text-xs text-brand-muted mt-1 leading-relaxed">Upgrade or downgrade instantly. Your new limits apply immediately.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-brand-gold/10 flex items-center justify-center text-brand-gold font-bold">✓</div>
              <div>
                <h4 className="text-sm font-black text-brand-charcoal uppercase tracking-wide">No Contracts</h4>
                <p className="text-xs text-brand-muted mt-1 leading-relaxed">Cancel your subscription at any time. No hidden fees or lock-in periods.</p>
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* Footer CTA */}
      <footer className="bg-brand-charcoal text-white py-20 px-6 text-center">
        <div className="max-w-2xl mx-auto space-y-8">
          <h2 className="text-3xl md:text-5xl font-black tracking-tighter uppercase leading-none">
            Start Trading Smarter <br/> with Athenix
          </h2>
          <button 
            onClick={() => onNavigate(user ? 'dashboard' : 'signup')}
            className="px-10 py-5 bg-brand-gold text-white rounded-2xl text-xs font-black uppercase tracking-[0.2em] hover:scale-105 transition-transform shadow-2xl shadow-brand-gold/30"
          >
            Go to App
          </button>
          <p className="text-[9px] text-white/40 font-black uppercase tracking-[0.3em] pt-8">
            &copy; {new Date().getFullYear()} Athenix Neural Network
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Pricing;
