
import React from 'react';

interface OnboardingProps {
  onStart: () => void;
  onLogin: () => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ onStart, onLogin }) => {
  return (
    <div className="min-h-screen bg-premium-gradient flex flex-col items-center justify-center p-8 animate-fade-in">
      <div className="max-w-4xl w-full text-center space-y-12">
        <div className="flex justify-center mb-4">
          <div className="w-20 h-20 bg-brand-gold rounded-3xl flex items-center justify-center text-white font-black text-4xl shadow-2xl shadow-brand-gold/20">A</div>
        </div>
        
        <div className="space-y-6">
          <h1 className="text-5xl md:text-7xl font-black text-brand-charcoal tracking-tighter leading-none">
            Welcome to the <br/> <span className="text-brand-gold">Athenix Network.</span>
          </h1>
          <p className="text-lg text-brand-muted font-medium max-w-2xl mx-auto uppercase tracking-wide leading-relaxed">
            Access institutional trading architecture. Precision AI analysis, curated signals, and elite algorithmic education.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
          <button 
            onClick={onStart}
            className="btn-primary px-12 py-5 font-black rounded-2xl text-xs uppercase tracking-widest"
          >
            Create Trading Profile
          </button>
          <button 
            onClick={onLogin}
            className="btn-secondary px-12 py-5 font-black rounded-2xl text-xs uppercase tracking-widest bg-white"
          >
            Access Terminal
          </button>
        </div>

        <div className="pt-16 grid grid-cols-1 md:grid-cols-3 gap-6 opacity-80">
          <div className="text-center space-y-2">
            <p className="text-brand-gold font-black text-xl">SMC Focus</p>
            <p className="text-[10px] text-brand-muted font-bold uppercase tracking-widest">Smart Money Concepts</p>
          </div>
          <div className="text-center space-y-2">
            <p className="text-brand-gold font-black text-xl">Neural Edge</p>
            <p className="text-[10px] text-brand-muted font-bold uppercase tracking-widest">AI Market Scanning</p>
          </div>
          <div className="text-center space-y-2">
            <p className="text-brand-gold font-black text-xl">Elite Alpha</p>
            <p className="text-[10px] text-brand-muted font-bold uppercase tracking-widest">Verified Institutional Data</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
