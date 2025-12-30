
import React from 'react';

const Splash: React.FC = () => {
  return (
    <div className="fixed inset-0 bg-white flex flex-col items-center justify-center z-[100] animate-fade-in">
      <div className="relative">
        <div className="w-24 h-24 bg-brand-gold rounded-[32px] flex items-center justify-center text-white font-bold text-5xl shadow-2xl shadow-brand-gold/20 animate-pulse">
          A
        </div>
        <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 flex gap-1.5">
          <div className="w-1.5 h-1.5 bg-brand-gold rounded-full animate-bounce"></div>
          <div className="w-1.5 h-1.5 bg-brand-gold rounded-full animate-bounce [animation-delay:0.2s]"></div>
          <div className="w-1.5 h-1.5 bg-brand-gold rounded-full animate-bounce [animation-delay:0.4s]"></div>
        </div>
      </div>
      <p className="mt-16 text-[10px] font-black text-brand-muted uppercase tracking-[0.5em]">Initializing Neural Terminal</p>
    </div>
  );
};

export default Splash;
