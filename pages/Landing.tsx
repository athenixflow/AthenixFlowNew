
import React from 'react';

interface LandingPageProps {
  onEnter: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onEnter }) => {
  return (
    <div className="min-h-screen bg-white selection:bg-brand-gold/30">
      {/* Navigation Bar */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-brand-sage/20 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-brand-gold rounded-lg flex items-center justify-center text-white font-black text-sm">A</div>
            <span className="text-xl font-black tracking-tighter text-brand-charcoal uppercase">ATHENIX</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-[10px] font-black uppercase tracking-widest text-brand-muted">
            <a href="#features" className="hover:text-brand-gold transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-brand-gold transition-colors">How it Works</a>
            <a href="#pricing" className="hover:text-brand-gold transition-colors">Pricing</a>
            <a href="#faq" className="hover:text-brand-gold transition-colors">FAQ</a>
          </div>
          <button 
            onClick={onEnter}
            className="btn-primary px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-brand-gold/10"
          >
            Terminal Access
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative pt-20 pb-32 px-6 overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-brand-gold/5 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-sage/10 blur-[100px] rounded-full"></div>
        
        <div className="max-w-5xl mx-auto text-center space-y-8 relative z-10 animate-fade-in">
          <div className="inline-block px-4 py-1.5 bg-brand-gold/10 border border-brand-gold/20 rounded-full">
            <span className="text-[10px] font-black text-brand-gold uppercase tracking-[0.2em]">Institutional Grade Neural Network</span>
          </div>
          
          <h1 className="text-5xl md:text-8xl font-black tracking-tighter text-brand-charcoal leading-[0.95] max-w-4xl mx-auto">
            THE NEXT GEN <br /> 
            <span className="text-brand-gold italic">AI TRADING PLATFORM</span>
          </h1>
          
          <p className="text-lg md:text-xl text-brand-muted max-w-2xl mx-auto leading-relaxed font-medium">
            <strong>Athenix is a professional AI trading platform</strong> designed for modern market conditions. We solve the complexity of technical analysis by providing professional <strong>Forex trading AI</strong>, high-precision institutional signals, and smart trading analysis powered by the Gemini 3 Pro neural engine.
          </p>

          <div className="pt-6 flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={onEnter}
              className="btn-primary px-10 py-5 font-black rounded-2xl text-xs tracking-[0.2em] uppercase shadow-2xl hover:scale-105"
            >
              Initialize Profile
            </button>
            <button
              className="px-10 py-5 bg-white border border-brand-sage rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-brand-sage/5 transition-all"
            >
              Explore Alpha
            </button>
          </div>
        </div>
      </header>

      {/* Benefits / Features Section */}
      <section id="features" className="py-24 px-6 max-w-7xl mx-auto">
        <div className="text-center space-y-4 mb-20">
          <h2 className="text-[10px] font-black text-brand-gold uppercase tracking-[0.3em]">Core Advantage</h2>
          <p className="text-3xl md:text-5xl font-black text-brand-charcoal tracking-tighter">WHY PROFESSIONAL TRADERS <br/> CHOOSE ATHENIX.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="athenix-card p-10 space-y-6">
            <div className="w-12 h-12 bg-brand-gold/10 rounded-2xl flex items-center justify-center text-brand-gold font-black">AI</div>
            <h3 className="text-xl font-black text-brand-charcoal uppercase tracking-tight">Smart Trading Analysis</h3>
            <p className="text-brand-muted text-sm font-medium leading-relaxed">
              Athenix provides <strong>smart trading analysis</strong> by using neural networks to identify high-probability setups using <strong>Smart Money Concepts (SMC)</strong> and institutional liquidity patterns.
            </p>
          </div>

          <div className="athenix-card p-10 space-y-6 border-brand-gold shadow-xl shadow-brand-gold/5">
            <div className="w-12 h-12 bg-brand-gold text-white rounded-2xl flex items-center justify-center font-black">SIG</div>
            <h3 className="text-xl font-black text-brand-charcoal uppercase tracking-tight">Institutional Signals</h3>
            <p className="text-brand-muted text-sm font-medium leading-relaxed">
              Access <strong>verified trading signals</strong> directly from the terminal. Every signal is vetted by institutional analysts and includes detailed risk/reward parameters.
            </p>
          </div>

          <div className="athenix-card p-10 space-y-6">
            <div className="w-12 h-12 bg-brand-gold/10 rounded-2xl flex items-center justify-center text-brand-gold font-black">EDU</div>
            <h3 className="text-xl font-black text-brand-charcoal uppercase tracking-tight">Elite Trading Education</h3>
            <p className="text-brand-muted text-sm font-medium leading-relaxed">
              The Athenix <strong>trading education platform</strong> features algorithmic theory and psychological conditioning modules designed to bridge the gap between retail and institutional trading.
            </p>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="py-24 px-6 bg-brand-charcoal text-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div className="space-y-10">
              <h2 className="text-4xl md:text-6xl font-black tracking-tighter leading-none">
                HOW THE <span className="text-brand-gold italic">TERMINAL</span> OPERATES.
              </h2>
              <p className="text-white/60 font-medium">Athenix operates as a decentralized intelligence node, synthesizing global market data into actionable trading alpha.</p>
              <div className="space-y-8">
                {[
                  { step: "01", title: "Data Aggregation", desc: "We pull real-time institutional liquidity data and macro-economic fundamentals from across the global network." },
                  { step: "02", title: "Neural Processing", desc: "The Athenix AI engine processes this data using advanced technical pattern recognition and fundamental confluence filters." },
                  { step: "03", title: "Alpha Distribution", desc: "High-conviction trade setups are distributed to verified user terminals with precise entry, stop, and target parameters." }
                ].map((item, i) => (
                  <div key={i} className="flex gap-6">
                    <span className="text-brand-gold font-black text-xl italic tracking-widest">{item.step}</span>
                    <div className="space-y-2">
                      <h4 className="font-black uppercase tracking-widest text-sm">{item.title}</h4>
                      <p className="text-white/60 text-sm font-medium leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="athenix-card bg-white p-8 space-y-6 transform rotate-2">
              <div className="flex justify-between items-center border-b border-brand-sage pb-4">
                <span className="text-[10px] font-black text-brand-gold uppercase tracking-widest">Neural Scan Active</span>
                <span className="text-[10px] font-black text-brand-success uppercase tracking-widest">LIVE</span>
              </div>
              <div className="space-y-4">
                <div className="h-4 bg-brand-sage/10 rounded-full w-3/4 animate-pulse"></div>
                <div className="h-4 bg-brand-sage/10 rounded-full w-1/2 animate-pulse [animation-delay:0.2s]"></div>
                <div className="pt-4 grid grid-cols-2 gap-4">
                  <div className="p-4 border border-brand-sage/20 rounded-xl text-center">
                    <p className="text-[8px] font-black text-brand-muted uppercase">Neural Confluence</p>
                    <p className="text-xl font-black text-brand-charcoal">94.2%</p>
                  </div>
                  <div className="p-4 border border-brand-sage/20 rounded-xl text-center">
                    <p className="text-[8px] font-black text-brand-muted uppercase">Success Probability</p>
                    <p className="text-xl font-black text-brand-charcoal">88.7%</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-24 px-6 bg-brand-sage/5">
        <div className="max-w-4xl mx-auto space-y-16">
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-black text-brand-charcoal uppercase tracking-tighter">Common Inquiries (FAQ)</h2>
            <p className="text-[10px] font-black text-brand-muted uppercase tracking-[0.3em]">Detailed information for institutional transparency</p>
          </div>

          <article className="grid gap-6">
            {[
              { q: "What is Athenix?", a: "Athenix is a professional-grade AI trading terminal that uses neural networks to provide market analysis and institutional signals for Forex, Stocks, and Crypto." },
              { q: "How does AI trading analysis work on this platform?", a: "Our AI analysis works by processing technical data and fundamental news through the Gemini 3 Pro model, identifying confluences based on Smart Money Concepts (SMC)." },
              { q: "Is Athenix good for beginners?", a: "Yes. While designed for professional workflows, our Education Hub provides comprehensive trading education that guides beginners through institutional concepts." },
              { q: "What makes Athenix different from other trading tools?", a: "Unlike static indicators, Athenix uses a dynamic neural network to interpret context. We focus on institutional liquidity and macro confluence rather than simple retail patterns." },
              { q: "How much does Athenix cost?", a: "Athenix offers transparent subscription tiers starting at $20/month for Lite access, with Pro and Elite tiers available for advanced traders." }
            ].map((faq, i) => (
              <section key={i} className="athenix-card p-8 bg-white">
                <h3 className="text-sm font-black text-brand-charcoal uppercase tracking-widest mb-4">{faq.q}</h3>
                <p className="text-brand-muted text-sm font-medium leading-relaxed">{faq.a}</p>
              </section>
            ))}
          </article>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-brand-sage/20 pt-20 pb-12 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-brand-gold rounded-lg flex items-center justify-center text-white font-black text-sm">A</div>
              <span className="text-xl font-black tracking-tighter text-brand-charcoal uppercase">ATHENIX</span>
            </div>
            <p className="text-xs text-brand-muted font-medium leading-loose">
              Professional AI trading architecture for institutional market analysis, algorithmic trade setups, and elite education.
            </p>
          </div>
          
          <div className="space-y-6">
            <h4 className="text-[10px] font-black text-brand-charcoal uppercase tracking-widest">Platform</h4>
            <ul className="space-y-3 text-xs text-brand-muted font-bold uppercase tracking-widest">
              <li><a href="#" className="hover:text-brand-gold transition-colors">AI Assistant</a></li>
              <li><a href="#" className="hover:text-brand-gold transition-colors">Signal Feed</a></li>
            </ul>
          </div>

          <div className="space-y-6">
            <h4 className="text-[10px] font-black text-brand-charcoal uppercase tracking-widest">Company</h4>
            <ul className="space-y-3 text-xs text-brand-muted font-bold uppercase tracking-widest">
              <li><a href="#" className="hover:text-brand-gold transition-colors">About Athenix</a></li>
              <li><a href="#" className="hover:text-brand-gold transition-colors">Pricing</a></li>
            </ul>
          </div>

          <div className="space-y-6">
            <h4 className="text-[10px] font-black text-brand-charcoal uppercase tracking-widest">Security</h4>
            <ul className="space-y-3 text-xs text-brand-muted font-bold uppercase tracking-widest">
              <li><a href="/privacy" className="hover:text-brand-gold transition-colors">Privacy Policy</a></li>
              <li><a href="/terms" className="hover:text-brand-gold transition-colors">Terms of Service</a></li>
            </ul>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto mt-20 pt-8 border-t border-brand-sage/10 text-center">
          <p className="text-[9px] text-brand-muted font-black uppercase tracking-[0.3em]">
            &copy; {new Date().getFullYear()} ATHENIX NEURAL NETWORK. ALL RIGHTS RESERVED. RISK DISCLOSURE: TRADING INVOLVES SIGNIFICANT RISK.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
