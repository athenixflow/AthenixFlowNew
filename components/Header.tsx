import React from 'react';
import { UserProfile } from '../types';
import { ICONS } from '../constants';

interface HeaderProps {
  user: UserProfile;
  onToggleSidebar: () => void;
  onNavigate: (page: string) => void;
}

const Header: React.FC<HeaderProps> = ({ user, onToggleSidebar, onNavigate }) => {
  return (
    <header className="h-16 md:h-20 border-b border-brand-sage px-4 md:px-8 flex items-center justify-between bg-white/95 backdrop-blur-sm sticky top-0 z-40">
      <div className="flex items-center gap-4">
        <button 
          onClick={onToggleSidebar}
          className="p-2 -ml-2 text-brand-charcoal hover:bg-brand-sage/10 rounded-xl transition-all"
          aria-label="Toggle Menu"
        >
          <ICONS.Menu />
        </button>
        
        <div 
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => onNavigate('dashboard')}
        >
          <div className="w-8 h-8 bg-brand-gold rounded-lg flex items-center justify-center text-white font-black text-sm">A</div>
          <span className="text-sm font-black tracking-widest text-brand-charcoal hidden sm:inline">ATHENIX</span>
        </div>
      </div>

      <div className="flex items-center gap-5">
        <div className="hidden sm:flex flex-col items-end">
          <span className="text-[9px] font-black text-brand-gold uppercase tracking-[0.2em]">{user.subscriptionPlan} Network</span>
          <span className="text-[9px] text-brand-muted font-bold uppercase">System Operational</span>
        </div>
        <button 
          onClick={() => onNavigate('settings')}
          className="w-10 h-10 rounded-full bg-brand-sage/10 flex items-center justify-center text-brand-gold border border-brand-sage transition-all hover:scale-105 hover:border-brand-gold"
        >
          <ICONS.User />
        </button>
      </div>
    </header>
  );
};

export default Header;