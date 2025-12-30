
import React from 'react';

const Settings: React.FC = () => {
  const sections = [
    { title: 'Profile Configuration', desc: 'Manage your public identity and personal details.', icon: 'User' },
    { title: 'Security Protocol', desc: 'Secure your terminal with 2FA and password management.', icon: 'Lock' },
    { title: 'Subscription Management', desc: 'View billing history and upgrade access level.', icon: 'CreditCard' },
    { title: 'Notification Matrix', desc: 'Configure signal alerts and system updates.', icon: 'Bell' },
    { title: 'Support Terminal', desc: 'Access documentation or contact institutional support.', icon: 'Help' },
  ];

  return (
    <div className="p-6 md:p-10 space-y-10 animate-fade-in max-w-5xl mx-auto">
      <div className="space-y-2">
        <h2 className="text-4xl font-black text-brand-charcoal uppercase tracking-tighter">Terminal Settings</h2>
        <p className="text-brand-muted font-medium text-sm uppercase tracking-widest">System configuration and security protocols.</p>
      </div>

      <div className="space-y-4">
        {sections.map((s, i) => (
          <div key={i} className="athenix-card p-8 flex items-center justify-between group cursor-pointer hover:border-brand-gold transition-all">
            <div className="flex items-center gap-6">
              <div className="w-14 h-14 bg-brand-sage/10 rounded-2xl flex items-center justify-center text-brand-gold transition-all group-hover:bg-brand-gold group-hover:text-white">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
              </div>
              <div className="space-y-1">
                <h4 className="font-black text-lg text-brand-charcoal tracking-tight uppercase tracking-widest">{s.title}</h4>
                <p className="text-xs text-brand-muted font-medium uppercase tracking-tighter">{s.desc}</p>
              </div>
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-brand-muted group-hover:text-brand-gold transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        ))}
      </div>

      <div className="pt-10 border-t border-brand-sage/20">
        <button className="flex items-center gap-3 px-8 py-4 bg-brand-error/5 text-brand-error rounded-xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-brand-error hover:text-white transition-all">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Deactivate Terminal Access
        </button>
      </div>
    </div>
  );
};

export default Settings;
