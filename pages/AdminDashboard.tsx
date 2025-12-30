
import React from 'react';

const AdminDashboard: React.FC = () => {
  return (
    <div className="p-6 md:p-10 space-y-12 animate-fade-in max-w-7xl mx-auto">
      {/* Page Header Section */}
      <section className="space-y-2">
        <h2 className="text-4xl font-black text-brand-charcoal uppercase tracking-tighter">Admin Dashboard</h2>
        <p className="text-brand-muted font-medium text-sm uppercase tracking-widest">
          Comprehensive platform oversight and institutional control center.
        </p>
      </section>

      {/* Overview Metrics Section */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Users', value: 'System Total', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
          { label: 'Active Subscriptions', value: 'Live Tiers', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
          { label: 'Total Signals Posted', value: 'Archived Setups', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
          { label: 'Total Token Usage', value: 'Network Units', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
        ].map((metric, i) => (
          <div key={i} className="athenix-card p-8 group hover:border-brand-gold transition-all">
            <div className="flex justify-between items-start mb-6">
              <p className="text-[10px] text-brand-muted uppercase font-black tracking-widest">{metric.label}</p>
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-brand-sage group-hover:text-brand-gold transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={metric.icon} />
              </svg>
            </div>
            <p className="text-xl font-black text-brand-charcoal uppercase tracking-tighter">{metric.value}</p>
          </div>
        ))}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* User Management Section */}
        <section className="lg:col-span-2 space-y-6">
          <div className="athenix-card flex flex-col min-h-[500px]">
            <div className="p-8 border-b border-brand-sage/10 flex justify-between items-center">
              <h3 className="text-xs font-black text-brand-charcoal uppercase tracking-[0.3em]">User Management</h3>
              <div className="relative">
                <input type="text" placeholder="Search Directory..." className="bg-brand-sage/5 border border-brand-sage/30 rounded-lg px-4 py-2 text-[10px] font-bold uppercase tracking-widest outline-none focus:border-brand-gold w-48 transition-all" />
              </div>
            </div>
            <div className="p-4 space-y-3 flex-1">
              {[1, 2, 3, 4].map((u) => (
                <div key={u} className="p-6 rounded-2xl border border-brand-sage/10 bg-white hover:bg-brand-sage/5 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-brand-gold/10 text-brand-gold flex items-center justify-center font-black text-xs">U</div>
                    <div>
                      <p className="text-sm font-black text-brand-charcoal uppercase tracking-tight">Trader Node {u}</p>
                      <p className="text-[10px] text-brand-muted font-bold tracking-tight">trader_{u}@athenix.network</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="px-3 py-1 bg-brand-gold/10 text-brand-gold text-[9px] font-black uppercase tracking-widest rounded-full">Pro Tier</span>
                    <span className="px-3 py-1 bg-brand-charcoal text-white text-[9px] font-black uppercase tracking-widest rounded-full">User Role</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="p-2 text-brand-muted hover:text-brand-gold transition-colors"><svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg></button>
                    <button className="p-2 text-brand-muted hover:text-brand-gold transition-colors"><svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Subscription & Token Controls */}
        <section className="space-y-8">
          <div className="athenix-card p-8 space-y-8 bg-brand-sage/5 border-dashed">
            <h3 className="text-xs font-black text-brand-charcoal uppercase tracking-[0.3em]">Resource Control</h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[9px] font-black text-brand-muted uppercase tracking-widest block">Adjust Token Balance</label>
                <div className="flex gap-2">
                  <input type="number" placeholder="Amt" className="w-20 px-3 py-3 bg-white border border-brand-sage rounded-xl outline-none text-xs font-black" />
                  <select className="flex-1 px-3 py-3 bg-white border border-brand-sage rounded-xl outline-none text-[10px] font-black uppercase tracking-widest">
                    <option>Analysis</option>
                    <option>Education</option>
                  </select>
                </div>
                <button className="w-full btn-primary py-4 rounded-xl text-[10px] font-black uppercase tracking-widest mt-2">Inject Tokens</button>
              </div>

              <div className="space-y-2 pt-4 border-t border-brand-sage/20">
                <label className="text-[9px] font-black text-brand-muted uppercase tracking-widest block">Modify Subscription</label>
                <select className="w-full px-3 py-3 bg-white border border-brand-sage rounded-xl outline-none text-[10px] font-black uppercase tracking-widest">
                  <option>Set Lite Tier</option>
                  <option>Set Pro Tier</option>
                  <option>Set Elite Tier</option>
                </select>
                <button className="w-full btn-secondary bg-white py-4 rounded-xl text-[10px] font-black uppercase tracking-widest mt-2 border-brand-charcoal">Update Plan</button>
              </div>
            </div>
          </div>

          <div className="athenix-card p-8 space-y-6">
            <h3 className="text-xs font-black text-brand-charcoal uppercase tracking-[0.3em]">Analytics Snapshot</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-brand-sage/5 rounded-xl border border-brand-sage/10 text-center">
                <p className="text-[8px] text-brand-muted font-black uppercase mb-1">AI Runs</p>
                <p className="text-sm font-black text-brand-charcoal">Log Pending</p>
              </div>
              <div className="p-4 bg-brand-sage/5 rounded-xl border border-brand-sage/10 text-center">
                <p className="text-[8px] text-brand-muted font-black uppercase mb-1">Lessons</p>
                <p className="text-sm font-black text-brand-charcoal">Log Pending</p>
              </div>
              <div className="p-4 bg-brand-sage/5 rounded-xl border border-brand-sage/10 text-center">
                <p className="text-[8px] text-brand-muted font-black uppercase mb-1">Purchases</p>
                <p className="text-sm font-black text-brand-charcoal">Log Pending</p>
              </div>
              <div className="p-4 bg-brand-sage/5 rounded-xl border border-brand-sage/10 text-center">
                <p className="text-[8px] text-brand-muted font-black uppercase mb-1">Feedback</p>
                <p className="text-sm font-black text-brand-charcoal">Log Pending</p>
              </div>
            </div>
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Signal Management */}
        <section className="athenix-card overflow-hidden">
          <div className="p-8 border-b border-brand-sage/10 flex justify-between items-center bg-white">
            <h3 className="text-xs font-black text-brand-charcoal uppercase tracking-[0.3em]">Signals Control</h3>
            <button className="btn-primary px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest">Create Signal</button>
          </div>
          <div className="p-6 space-y-4 max-h-[400px] overflow-y-auto">
            {[
              { pair: 'GBP/USD', type: 'SELL', entry: '1.2740', sl: '1.2790', tp: '1.2650', author: 'Root_Admin' },
              { pair: 'XAU/USD', type: 'BUY', entry: '2,042.0', sl: '2,035.0', tp: '2,060.0', author: 'Network_Node' },
            ].map((sig, i) => (
              <div key={i} className="p-5 border border-brand-sage/20 rounded-2xl flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-[10px] text-white shadow-sm ${sig.type === 'BUY' ? 'bg-brand-success' : 'bg-brand-error'}`}>
                    {sig.type}
                  </div>
                  <div>
                    <p className="text-sm font-black text-brand-charcoal">{sig.pair}</p>
                    <p className="text-[9px] text-brand-muted font-bold uppercase">By: {sig.author}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="p-2 text-brand-muted hover:text-brand-charcoal"><svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg></button>
                  <button className="p-2 text-brand-error/60 hover:text-brand-error"><svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Knowledge Base Management */}
        <section className="athenix-card overflow-hidden">
          <div className="p-8 border-b border-brand-sage/10 flex justify-between items-center bg-white">
            <h3 className="text-xs font-black text-brand-charcoal uppercase tracking-[0.3em]">Knowledge Directory</h3>
            <button className="btn-secondary px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest bg-brand-sage/5">Upload Node</button>
          </div>
          <div className="p-6 space-y-4 max-h-[400px] overflow-y-auto">
            {[
              { title: 'Liquidity Matrix v4.0', desc: 'Institutional volume profile updates.' },
              { title: 'SMC Delta Shifts', desc: 'Predicting fractal reversals via delta data.' },
              { title: 'Macro Fundamental Core', desc: 'Central bank policy impact training.' },
            ].map((kb, i) => (
              <div key={i} className="p-5 border border-brand-sage/20 rounded-2xl flex items-center justify-between group hover:border-brand-gold transition-all">
                <div>
                  <p className="text-sm font-black text-brand-charcoal uppercase tracking-tight">{kb.title}</p>
                  <p className="text-[10px] text-brand-muted font-bold tracking-tight">{kb.desc}</p>
                </div>
                <button className="p-2 text-brand-muted hover:text-brand-gold transition-colors"><svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg></button>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="text-center opacity-30 pt-10">
        <p className="text-[9px] font-black text-brand-muted uppercase tracking-[0.5em]">Network Supervisor Active | Admin ID: ATH-ADMIN-001</p>
      </div>
    </div>
  );
};

export default AdminDashboard;
