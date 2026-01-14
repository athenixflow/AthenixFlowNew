
import React from 'react';

interface LandingPageProps {
  onEnter: () => void;
  onNavigate?: (page: string) => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onEnter, onNavigate }) => {
  // Helper to handle navigation if onNavigate is provided
  const handleNav = (page: string) => {
    if (onNavigate) {
      onNavigate(page);
    } else {
      // Fallback if prop not passed
      window.location.href = `/${page}`;
    }
  };

  return (
    <div className="min-h-screen bg-white selection:bg-brand-gold/30">
      {/* Navigation Bar */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-brand-sage/20 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-brand-gold rounded-lg flex items-center justify-center text-white font-black text-sm">A</div>
            <span className="text-xl font-black tracking-tighter text-brand-charcoal uppercase">ATHENIXFLOW</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-[10px] font-black uppercase tracking-widest text-brand-muted">
            <a href="#features" className="hover:text-brand-gold transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-brand-gold transition-colors">How it Works</a>
            <button onClick={() => handleNav('pricing')} className="hover:text-brand-gold transition-colors uppercase">Pricing</button>
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
            <span className="text-[10px] font-black text-brand-gold uppercase tracking-[0.2em]">Institutional Grade Trading Platform</span>
          </div>
          
          <h1 className="text-5xl md:text-8xl font-black tracking-tighter text-brand-charcoal leading-[0.95] max-w-4xl mx-auto">
            THE ATHENIXFLOW <br /> 
            <span className="text-brand-gold italic">TRADING ECOSYSTEM</span>
          </h1>
          
          <div className="text-lg md:text-xl text-brand-muted max-w-3xl mx-auto leading-relaxed font-medium space-y-4">
            <p>
              <strong>Athenixflow is an AI-powered trading analysis and education platform</strong> designed explicitly for forex and stock market traders. We provide automated technical analysis, high-probability trade setups, and performance journaling tools.
            </p>
            <p className="text-base opacity-80">
              Our system focuses on technical analysis with optional fundamental insights to help you identify institutional market behavior.
            </p>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={onEnter}
              className="btn-primary px-10 py-5 font-black rounded-2xl text-xs tracking-[0.2em] uppercase shadow-2xl hover:scale-105"
            >
              Initialize Profile
            </button>
            <button
              onClick={() => handleNav('pricing')}
              className="px-10 py-5 bg-white border border-brand-sage rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-brand-sage/5 transition-all"
            >
              View Plans
            </button>
          </div>
          
          <p className="text-[9px] text-brand-muted font-bold uppercase tracking-widest pt-4">
            Risk Disclaimer: Athenixflow provides analysis, not financial advice.
          </p>
        </div>
      </header>

      {/* Benefits / Features Section */}
      <section id="features" className="py-24 px-6 max-w-7xl mx-auto">
        <div className="text-center space-y-4 mb-20">
          <h2 className="text-[10px] font-black text-brand-gold uppercase tracking-[0.3em]">Platform Capabilities</h2>
          <p className="text-3xl md:text-5xl font-black text-brand-charcoal tracking-tighter">COMPLETE MARKET INTELLIGENCE.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="athenix-card p-10 space-y-6">
            <div className="w-12 h-12 bg-brand-gold/10 rounded-2xl flex items-center justify-center text-brand-gold font-black">AI</div>
            <h3 className="text-xl font-black text-brand-charcoal uppercase tracking-tight">AI Market Analysis</h3>
            <p className="text-brand-muted text-sm font-medium leading-relaxed">
              Athenixflow utilizes advanced neural networks to perform <strong>technical analysis</strong> on forex pairs and stocks, identifying key liquidity zones and market structure shifts automatically.
            </p>
          </div>

          <div className="athenix-card p-10 space-y-6 border-brand-gold shadow-xl shadow-brand-gold/5">
            <div className="w-12 h-12 bg-brand-gold text-white rounded-2xl flex items-center justify-center font-black">JRNL</div>
            <h3 className="text-xl font-black text-brand-charcoal uppercase tracking-tight">Trade Journaling</h3>
            <p className="text-brand-muted text-sm font-medium leading-relaxed">
              Track your performance with our integrated <strong>trade journal</strong>. Log setups, record execution notes, and audit your trading history to improve consistency over time.
            </p>
          </div>

          <div className="athenix-card p-10 space-y-6">
            <div className="w-12 h-12 bg-brand-gold/10 rounded-2xl flex items-center justify-center text-brand-gold font-black">EDU</div>
            <h3 className="text-xl font-black text-brand-charcoal uppercase tracking-tight">Trading Education</h3>
            <p className="text-brand-muted text-sm font-medium leading-relaxed">
              The platform includes a comprehensive <strong>education hub</strong> covering Smart Money Concepts (SMC), risk management, and algorithmic theory to bridge the gap between retail and institutional trading.
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
                HOW <span className="text-brand-gold italic">ATHENIXFLOW</span> WORKS.
              </h2>
              <p className="text-white/60 font-medium">We synthesize complex market data into actionable intelligence for the modern trader.</p>
              <div className="space-y-8">
                {[
                  { step: "01", title: "Select Your Market", desc: "Choose from major forex pairs, indices, or stocks within the terminal dashboard." },
                  { step: "02", title: "AI Neural Analysis", desc: "Our AI engine processes technical price action and optional fundamental data to generate a structured trade analysis." },
                  { step: "03", title: "Review & Execute", desc: "Review the generated entry, stop loss, and take profit levels. Use the trade journal to log your decision and outcome." }
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
              { q: "What is Athenixflow?", a: "Athenixflow is a professional AI trading platform that provides technical analysis, educational resources, and trade journaling tools for forex and stock market traders." },
              { q: "Does Athenixflow provide financial advice?", a: "No. Athenixflow is an educational and analytical tool. We provide data-driven market analysis, but all trading decisions are the sole responsibility of the user." },
              { q: "Who is this platform for?", a: "Athenixflow is designed for both beginner and advanced traders who want to structure their trading workflow using AI analysis and professional journaling practices." },
              { q: "How does the AI analysis work?", a: "Our AI processes price action data to identify market structure, liquidity zones, and potential trade setups based on technical analysis principles." },
              { q: "Is there a subscription fee?", a: "Yes. Athenixflow offers tiered monthly subscriptions (Lite, Pro, Elite) that grant access to different levels of AI analysis tokens and educational content." }
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
              <span className="text-xl font-black tracking-tighter text-brand-charcoal uppercase">ATHENIXFLOW</span>
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
              <li><button onClick={() => handleNav('about')} className="hover:text-brand-gold transition-colors text-left">About Athenixflow</button></li>
              <li><button onClick={() => handleNav('pricing')} className="hover:text-brand-gold transition-colors text-left">Pricing</button></li>
            </ul>
          </div>

          <div className="space-y-6">
            <h4 className="text-[10px] font-black text-brand-charcoal uppercase tracking-widest">Security</h4>
            <ul className="space-y-3 text-xs text-brand-muted font-bold uppercase tracking-widest">
              <li><button onClick={() => handleNav('privacy')} className="hover:text-brand-gold transition-colors text-left">Privacy Policy</button></li>
              <li><button onClick={() => handleNav('terms')} className="hover:text-brand-gold transition-colors text-left">Terms of Service</button></li>
            </ul>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto mt-20 pt-8 border-t border-brand-sage/10 text-center">
          <p className="text-[9px] text-brand-muted font-black uppercase tracking-[0.3em] leading-relaxed">
            &copy; {new Date().getFullYear()} ATHENIXFLOW NEURAL NETWORK. ALL RIGHTS RESERVED. <br/>
            RISK DISCLOSURE: TRADING INVOLVES SIGNIFICANT RISK. ATHENIXFLOW IS NOT A FINANCIAL ADVISOR.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
