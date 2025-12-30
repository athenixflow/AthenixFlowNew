
import React from 'react';

interface LandingPageProps {
  onEnter: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onEnter }) => {
  return (
    <div className="min-h-screen bg-premium-gradient flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative Brand Accent */}
      <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-brand-gold/5 blur-[150px] rounded-full"></div>
      
      <div className="max-w-4xl w-full text-center space-y-12 animate-fade-in relative z-10">
        <div className="flex justify-center">
          <div className="w-20 h-20 bg-brand-gold rounded-3xl flex items-center justify-center text-white font-bold text-4xl shadow-2xl shadow-brand-gold/20 transform rotate-3 hover:rotate-0 transition-transform duration-500">A</div>
        </div>
        
        <div className="space-y-4">
          <h1 className="text-6xl md:text-8xl font-black tracking-tight text-brand-charcoal leading-none">
            ATHENIX <br /> 
            <span className="text-brand-gold opacity-90 italic">Intelligence.</span>
          </h1>
          <p className="text-xl text-brand-muted max-w-2xl mx-auto leading-relaxed font-medium">
            Professional AI trading architecture for institutional market analysis, 
            algorithmic trade setups, and elite education.
          </p>
        </div>

        <div className="pt-4">
          <button
            onClick={onEnter}
            className="btn-primary px-12 py-5 font-black rounded-2xl text-lg tracking-widest uppercase shadow-xl hover:scale-105"
          >
            Enter Terminal
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-12">
          {[
            { title: 'Neural Analysis', desc: 'SMC-focused technical & macro breakdowns.' },
            { title: 'Curated Signals', desc: 'Direct alerts from verified Athenix admins.' },
            { title: 'Adaptive Learning', desc: 'AI-driven mentorship and trade journaling.' }
          ].map((feature, i) => (
            <div key={i} className="athenix-card p-8 text-left bg-white/50 backdrop-blur-sm">
              <div className="w-1 h-8 bg-brand-gold mb-4"></div>
              <h3 className="font-bold text-lg text-brand-charcoal mb-2">{feature.title}</h3>
              <p className="text-brand-muted text-sm font-medium leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
