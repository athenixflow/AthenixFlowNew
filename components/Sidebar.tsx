
import React from 'react';
import { UserProfile, UserRole } from '../types';
import { ICONS } from '../constants';

interface SidebarProps {
  user: UserProfile;
  isOpen: boolean;
  activePage: string;
  onNavigate: (page: string) => void;
  onClose: () => void;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ user, isOpen, activePage, onNavigate, onClose, onLogout }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: ICONS.Dashboard },
    { id: 'assistant', label: 'AI Assistant', icon: ICONS.Assistant },
    { id: 'education', label: 'Education Hub', icon: ICONS.Education },
    { id: 'signals', label: 'Trading Signals', icon: ICONS.Signals },
    { id: 'journal', label: 'Trade Journal', icon: ICONS.Journal },
    { id: 'billing', label: 'Subscription', icon: ICONS.Billing },
    { id: 'settings', label: 'Settings', icon: ICONS.Settings },
    { id: 'admin', label: 'Admin Panel', icon: ICONS.Admin },
  ];

  const handleLinkClick = (id: string) => {
    onNavigate(id);
    // Auto-close on small screens after selection
    if (window.innerWidth < 768) {
      onClose();
    }
  };

  return (
    <>
      {/* Overlay for mobile / backdrop */}
      <div 
        className={`fixed inset-0 bg-brand-charcoal/20 backdrop-blur-sm z-[60] transition-opacity duration-300 md:hidden ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      <aside 
        className={`fixed top-0 left-0 bottom-0 w-80 bg-white border-r border-brand-sage/20 flex flex-col z-[70] transition-transform duration-500 cubic-bezier(0.16, 1, 0.3, 1) ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-brand-gold rounded-[14px] flex items-center justify-center text-white font-black text-xl shadow-xl shadow-brand-gold/10">A</div>
            <h1 className="text-2xl font-black tracking-tighter text-brand-charcoal">ATHENIX</h1>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-brand-muted hover:bg-brand-sage/10 rounded-xl transition-all"
          >
            <ICONS.Close />
          </button>
        </div>

        <nav className="flex-1 px-5 py-4 space-y-2 overflow-y-auto">
          <p className="px-4 text-[9px] font-black text-brand-muted uppercase tracking-[0.3em] mb-4">Core Terminal</p>
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleLinkClick(item.id)}
              className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 group ${
                activePage === item.id 
                  ? 'bg-brand-gold text-white shadow-xl shadow-brand-gold/10' 
                  : 'text-brand-muted hover:bg-brand-sage/10 hover:text-brand-gold'
              }`}
            >
              <div className={`transition-transform duration-300 ${activePage === item.id ? 'scale-110' : 'group-hover:scale-110'}`}>
                <item.icon />
              </div>
              <span className="text-[11px] font-black uppercase tracking-widest">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-6 border-t border-brand-sage/10 bg-brand-sage/5">
          <div className="bg-white athenix-card p-5 mb-6 border-dashed">
            <p className="text-[9px] text-brand-muted uppercase font-black tracking-widest mb-4">Active Resources</p>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-brand-muted font-bold uppercase">Analysis</span>
                <span className="text-xs font-black text-brand-charcoal">{user.tokens.analysis}u</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-brand-muted font-bold uppercase">Education</span>
                <span className="text-xs font-black text-brand-charcoal">{user.tokens.education}u</span>
              </div>
            </div>
          </div>

          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-3 px-4 py-4 rounded-xl text-brand-error bg-brand-error/5 hover:bg-brand-error hover:text-white transition-all duration-300 font-black text-[10px] uppercase tracking-[0.2em]"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Exit System
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
