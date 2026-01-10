
import React from 'react';

interface AboutProps {
  onNavigate: (page: string) => void;
}

const About: React.FC<AboutProps> = ({ onNavigate }) => {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-brand-sage/20 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => onNavigate('landing')}>
            <div className="w-8 h-8 bg-brand-gold rounded-lg flex items-center justify-center text-white font-black text-sm">A</div>
            <span className="text-xl font-black tracking-tighter text-brand-charcoal uppercase">ATHENIX</span>
          </div>
          <button 
            onClick={() => onNavigate('landing')}
            className="text-[10px] font-black uppercase tracking-widest text-brand-muted hover:text-brand-gold transition-colors"
          >
            Back to Home
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative py-24 px-6 overflow-hidden bg-brand-charcoal text-white">
        <div className="absolute top-0 right-0 w-[50%] h-full bg-premium-gradient opacity-5 skew-x-12 transform origin-top-right"></div>
        <div className="max-w-4xl mx-auto text-center space-y-8 relative z-10 animate-fade-in">
          <div className="inline-block px-4 py-1.5 bg-brand-gold/10 border border-brand-gold/20 rounded-full">
            <span className="text-[10px] font-black text-brand-gold uppercase tracking-[0.2em]">Company & Vision</span>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter leading-none">
            INTELLIGENT MARKET INSIGHT <br />
            <span className="text-brand-gold">BUILT FOR THE MODERN TRADER</span>
          </h1>
          
          <p className="text-lg text-white/70 max-w-2xl mx-auto leading-relaxed font-medium">
            Where artificial intelligence, education, and disciplined trading intelligence converge to empower smarter decisions.
          </p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-20 space-y-24">
        
        {/* What Is Athenix */}
        <section className="space-y-6">
          <h2 className="text-xs font-black text-brand-gold uppercase tracking-[0.3em] pl-4 border-l-4 border-brand-gold">What Is Athenix?</h2>
          <div className="prose prose-lg text-brand-charcoal">
            <p className="text-xl font-medium leading-relaxed">
              Athenix is an AI-powered trading intelligence and education platform designed to support traders across all experience levels. The platform combines technical analysis, optional fundamental analysis, and continuous AI learning to deliver structured insights, signals, and educational guidance.
            </p>
            <p className="text-brand-muted mt-4 leading-loose">
              Rather than replacing human decision-making, Athenix enhances it by providing structured analysis, historical context, and educational reinforcement — allowing users to trade with clarity, discipline, and awareness.
            </p>
          </div>
        </section>

        {/* Why Athenix Exists */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h2 className="text-xs font-black text-brand-charcoal uppercase tracking-[0.3em]">Why We Built This</h2>
            <p className="text-brand-muted leading-loose">
              Financial markets are complex, fast-moving, and emotionally demanding. Many traders fail not due to lack of effort, but lack of structure, education, and consistency.
            </p>
            <ul className="space-y-4 pt-4">
              {[
                "Reducing emotional decision-making",
                "Providing structured AI-backed analysis",
                "Educating users alongside analysis",
                "Encouraging disciplined, informed trading"
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 bg-brand-gold rounded-full"></div>
                  <span className="text-sm font-bold text-brand-charcoal uppercase tracking-wide">{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="athenix-card p-8 bg-brand-sage/5 border-dashed">
            <h3 className="text-3xl font-black text-brand-charcoal uppercase tracking-tighter mb-4">The Discipline Gap</h3>
            <p className="text-sm text-brand-muted font-medium leading-relaxed">
              "We believe the gap between retail and institutional performance isn't just information—it's processing power and discipline. Athenix bridges that gap."
            </p>
          </div>
        </section>

        {/* Core Capabilities */}
        <section className="space-y-10">
          <div className="text-center">
            <h2 className="text-3xl font-black text-brand-charcoal uppercase tracking-tighter">Platform Capabilities</h2>
            <div className="w-16 h-1 bg-brand-gold mx-auto mt-4"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { title: "Neural Assistant", desc: "AI Trade Assistant for technical and hybrid analysis." },
              { title: "Market Intelligence", desc: "Forex and stock market data synthesis." },
              { title: "Token Logic", desc: "Fair-use token-based AI usage model." },
              { title: "Education Hub", desc: "AI-powered learning tailored to your gaps." },
              { title: "Curated Signals", desc: "Verified setups for subscribers." },
              { title: "Trade Journal", desc: "Activity tracking and performance auditing." }
            ].map((cap, i) => (
              <div key={i} className="athenix-card p-6 hover:shadow-xl transition-shadow">
                <h3 className="text-sm font-black text-brand-charcoal uppercase tracking-widest mb-2">{cap.title}</h3>
                <p className="text-xs text-brand-muted font-medium leading-relaxed">{cap.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* AI Philosophy */}
        <section className="bg-brand-charcoal text-white p-12 rounded-3xl relative overflow-hidden">
          <div className="absolute top-[-50%] right-[-10%] w-[400px] h-[400px] bg-brand-gold/10 blur-[100px] rounded-full"></div>
          <div className="relative z-10 space-y-6">
            <h2 className="text-xs font-black text-brand-gold uppercase tracking-[0.3em]">Our AI Philosophy</h2>
            <p className="text-lg font-medium leading-relaxed opacity-90">
              Athenix AI is designed to assist, not advise. To inform, not influence. To educate, not promise profits.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6">
              <div>
                <h4 className="text-[10px] font-black uppercase tracking-widest mb-2 opacity-70">Learning Sources</h4>
                <p className="text-xs leading-loose opacity-60">
                  Platform usage patterns, user feedback, uploaded knowledge base materials, and curated web sources aligned with market theory.
                </p>
              </div>
              <div>
                <h4 className="text-[10px] font-black uppercase tracking-widest mb-2 opacity-70">Objective</h4>
                <p className="text-xs leading-loose opacity-60">
                  To provide a neutral, data-driven second opinion that helps traders validate their own thesis before execution.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Target Audience */}
        <section className="space-y-6">
          <h2 className="text-xs font-black text-brand-charcoal uppercase tracking-[0.3em]">Built For</h2>
          <div className="flex flex-wrap gap-3">
            {[
              "Beginner Traders", "Strategy Refiners", "Forex Analysts", "Stock Investors", "Discipline Seekers"
            ].map((tag, i) => (
              <span key={i} className="px-4 py-2 bg-brand-sage/10 border border-brand-sage/20 rounded-full text-[10px] font-black text-brand-charcoal uppercase tracking-widest">
                {tag}
              </span>
            ))}
          </div>
        </section>

        {/* Risk Statement */}
        <section className="athenix-card p-8 border-l-4 border-brand-warning">
          <h3 className="text-xs font-black text-brand-warning uppercase tracking-[0.3em] mb-4">Risk & Responsibility</h3>
          <p className="text-sm text-brand-muted font-medium leading-loose">
            Athenix does not provide financial advice, investment advice, or guaranteed outcomes. Trading involves significant risk, and users are solely responsible for their decisions. Athenix is an analytical and educational tool only.
          </p>
        </section>

        {/* Vision */}
        <section className="text-center space-y-6 pt-10">
          <h2 className="text-3xl font-black text-brand-charcoal uppercase tracking-tighter">Long-Term Vision</h2>
          <p className="text-brand-muted font-medium max-w-2xl mx-auto leading-loose">
            Athenix aims to become a global standard for AI-assisted trading intelligence by continuously improving accuracy, transparency, and educational depth while maintaining ethical AI principles.
          </p>
        </section>

      </main>

      {/* Footer */}
      <footer className="bg-brand-sage/5 border-t border-brand-sage/20 py-12 text-center">
        <p className="text-[9px] text-brand-muted font-black uppercase tracking-[0.3em]">
          &copy; {new Date().getFullYear()} ATHENIX NEURAL NETWORK.
        </p>
      </footer>
    </div>
  );
};

export default About;
