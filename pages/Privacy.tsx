
import React from 'react';

interface PrivacyProps {
  onNavigate: (page: string) => void;
}

const Privacy: React.FC<PrivacyProps> = ({ onNavigate }) => {
  return (
    <div className="min-h-screen bg-white font-sans text-brand-charcoal selection:bg-brand-gold/20">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-brand-sage/20 px-6 py-4">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => onNavigate('landing')}>
            <div className="w-8 h-8 bg-brand-charcoal rounded-lg flex items-center justify-center text-white font-black text-sm">A</div>
            <span className="text-lg font-black tracking-tighter text-brand-charcoal uppercase">PRIVACY PROTOCOL</span>
          </div>
          <button 
            onClick={() => onNavigate('landing')} 
            className="text-[10px] font-black uppercase tracking-widest text-brand-muted hover:text-brand-gold transition-colors"
          >
            Close
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="py-20 px-6 bg-brand-sage/5 border-b border-brand-sage/10">
        <div className="max-w-4xl mx-auto text-center space-y-6 animate-fade-in">
          <div className="inline-block p-3 bg-white rounded-2xl shadow-sm mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-brand-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-brand-charcoal uppercase tracking-tighter">
            Privacy Policy
          </h1>
          <p className="text-lg text-brand-muted font-medium max-w-2xl mx-auto leading-relaxed">
            Your privacy matters to us. This policy explains how Athenix collects, uses, and protects your information with institutional-grade security.
          </p>
          <p className="text-[10px] font-black text-brand-muted uppercase tracking-[0.2em] pt-4 opacity-60">
            Last Updated: March 2024
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-16 space-y-12">
        
        {/* Section 1: Introduction */}
        <section className="athenix-card p-10 space-y-4 border-l-4 border-l-brand-gold">
          <h2 className="text-sm font-black text-brand-charcoal uppercase tracking-[0.2em]">1. Introduction</h2>
          <p className="text-sm text-brand-muted leading-loose font-medium">
            Athenix is committed to protecting user data and operating transparently. We understand that trading data is sensitive, and we employ rigorous protocols to ensure its confidentiality. By using the Athenix platform, you agree to the collection and use of information in accordance with this policy.
          </p>
        </section>

        {/* Section 2: Information We Collect */}
        <section className="space-y-6">
          <h2 className="text-sm font-black text-brand-charcoal uppercase tracking-[0.2em] pl-4 border-l-2 border-brand-sage/30">2. Information We Collect</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { title: "Personal Information", desc: "Identity Name, secure email address, and encrypted authentication details." },
              { title: "Account Information", desc: "Subscription plan tier, token usage metrics, and interface preferences." },
              { title: "Usage Data", desc: "Feature interaction logs, pages visited, and AI assistant query patterns." },
              { title: "Device & Technical", desc: "Browser type, IP address (for security), and operating system details." },
              { title: "Payment Data", desc: "Subscription status handled securely by third-party processors. We do not store full credit card numbers." }
            ].map((item, i) => (
              <div key={i} className="p-6 bg-white border border-brand-sage/20 rounded-xl hover:border-brand-gold/50 transition-colors">
                <h3 className="text-xs font-black text-brand-charcoal uppercase tracking-widest mb-2">{item.title}</h3>
                <p className="text-xs text-brand-muted leading-relaxed font-medium">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Section 3: How We Use Information */}
        <section className="space-y-4">
          <h2 className="text-sm font-black text-brand-charcoal uppercase tracking-[0.2em] pl-4 border-l-2 border-brand-sage/30">3. How We Use Your Information</h2>
          <div className="athenix-card p-8 bg-brand-sage/5 border-dashed">
            <ul className="space-y-4">
              {[
                "To create, authenticate, and manage your trading account.",
                "To provide high-precision AI market analysis and educational content.",
                "To improve AI accuracy through anonymized usage patterns and feedback.",
                "To manage subscriptions, billing, and token allocation.",
                "To detect and prevent fraudulent activity or security breaches.",
                "To communicate imperative system updates and support responses."
              ].map((point, i) => (
                <li key={i} className="flex gap-4 items-start">
                  <div className="w-1.5 h-1.5 bg-brand-gold rounded-full mt-2 shrink-0"></div>
                  <span className="text-sm text-brand-muted font-medium leading-relaxed">{point}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Section 4: AI & Data Usage */}
        <section className="space-y-4">
          <h2 className="text-sm font-black text-brand-charcoal uppercase tracking-[0.2em] pl-4 border-l-2 border-brand-sage/30">4. AI & Data Usage</h2>
          <p className="text-sm text-brand-muted leading-loose font-medium">
            Our AI models may utilize uploaded knowledge bases, historical usage data, and permitted web sources to generate responses. While user inputs may be processed to improve system accuracy, your private trading data and conversations are <strong className="text-brand-charcoal">never sold or shared</strong> with third parties for marketing purposes.
          </p>
        </section>

        {/* Section 5: Data Sharing */}
        <section className="space-y-4">
          <h2 className="text-sm font-black text-brand-charcoal uppercase tracking-[0.2em] pl-4 border-l-2 border-brand-sage/30">5. Data Sharing</h2>
          <p className="text-sm text-brand-muted leading-loose font-medium">
            Athenix does not sell user data. We may share data only with trusted service providers necessary for operation (such as cloud hosting, analytics, and payment processors) or when legally required by valid court order or government regulation.
          </p>
        </section>

        {/* Section 6: Data Security */}
        <section className="athenix-card p-8 bg-brand-charcoal text-white">
          <div className="flex items-center gap-4 mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-brand-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <h2 className="text-sm font-black uppercase tracking-[0.2em]">6. Data Security</h2>
          </div>
          <p className="text-sm text-white/70 leading-loose font-medium">
            We employ industry-standard security safeguards including AES-256 encryption, secure authentication (Firebase Auth), strict access controls, and real-time monitoring to protect your data integrity and confidentiality.
          </p>
        </section>

        {/* Section 7: User Rights */}
        <section className="space-y-4">
          <h2 className="text-sm font-black text-brand-charcoal uppercase tracking-[0.2em] pl-4 border-l-2 border-brand-sage/30">7. User Rights</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 border border-brand-sage/20 rounded-xl">
              <h3 className="text-[10px] font-black text-brand-charcoal uppercase tracking-widest mb-2">Access & Portability</h3>
              <p className="text-xs text-brand-muted">Request a copy of the personal data we hold about you.</p>
            </div>
            <div className="p-5 border border-brand-sage/20 rounded-xl">
              <h3 className="text-[10px] font-black text-brand-charcoal uppercase tracking-widest mb-2">Correction & Deletion</h3>
              <p className="text-xs text-brand-muted">Request correction of errors or complete deletion of your account.</p>
            </div>
          </div>
        </section>

        {/* Section 8: Cookies */}
        <section className="space-y-4">
          <h2 className="text-sm font-black text-brand-charcoal uppercase tracking-[0.2em] pl-4 border-l-2 border-brand-sage/30">8. Cookies & Tracking</h2>
          <p className="text-sm text-brand-muted leading-loose font-medium">
            We use cookies and similar tracking technologies to maintain session security, optimize platform performance, and analyze aggregate usage trends. You can control cookie preferences through your browser settings.
          </p>
        </section>

        {/* Section 9: Changes */}
        <section className="space-y-4">
          <h2 className="text-sm font-black text-brand-charcoal uppercase tracking-[0.2em] pl-4 border-l-2 border-brand-sage/30">9. Changes to Policy</h2>
          <p className="text-sm text-brand-muted leading-loose font-medium">
            Athenix reserves the right to update this policy. We will notify users of significant changes via email or prominent platform notices. Continued use of the platform after changes constitutes acceptance.
          </p>
        </section>

        {/* Section 10: Contact */}
        <section className="mt-12 p-8 bg-brand-sage/10 rounded-2xl text-center space-y-4">
          <h2 className="text-sm font-black text-brand-charcoal uppercase tracking-[0.2em]">10. Contact Us</h2>
          <p className="text-sm text-brand-muted font-medium">
            For privacy-related concerns or data requests:
          </p>
          <a href="mailto:help@athenixflow.com" className="inline-block px-6 py-3 bg-white border border-brand-sage/30 rounded-xl text-xs font-black text-brand-gold uppercase tracking-widest hover:border-brand-gold transition-colors">
            help@athenixflow.com
          </a>
        </section>

      </main>

      <footer className="py-10 text-center border-t border-brand-sage/20">
        <p className="text-[9px] font-black text-brand-muted uppercase tracking-[0.3em]">
          &copy; {new Date().getFullYear()} Athenix Neural Network
        </p>
      </footer>
    </div>
  );
};

export default Privacy;
