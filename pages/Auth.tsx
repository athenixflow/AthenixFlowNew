import React, { useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase'; // FIXED IMPORT
import { initializeUserDocument } from '../services/firestore';
import { UserProfile } from '../types';

interface AuthPageProps {
  mode: 'login' | 'signup';
  onAuthSuccess: (user: UserProfile) => void;
  onToggleMode: () => void;
}

const AuthPage: React.FC<AuthPageProps> = ({ mode, onToggleMode }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) {
      setError("Terminal synchronization error. Please restart the terminal.");
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      if (mode === 'signup') {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await initializeUserDocument(userCredential.user.uid, { fullName, email });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      let message = "Authentication failed.";
      if (err.code === 'auth/email-already-in-use') message = "Identity already exists.";
      if (err.code === 'auth/invalid-credential') message = "Invalid secure credentials.";
      setError(message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex">
      <div className="flex-1 flex flex-col justify-center px-8 md:px-24 py-12">
        <div className="max-w-md w-full mx-auto space-y-10">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 bg-brand-gold rounded-lg flex items-center justify-center text-white font-bold">A</div>
             <span className="text-xl font-black tracking-tighter text-brand-charcoal">ATHENIX</span>
          </div>
          <div className="space-y-2">
            <h2 className="text-4xl font-black text-brand-charcoal">{mode === 'login' ? 'Terminal Login' : 'Register Account'}</h2>
            <p className="text-brand-muted font-medium">Access institutional-grade AI trading intelligence.</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-5">
            {mode === 'signup' && (
              <div className="space-y-2">
                <label className="text-[10px] font-black text-brand-muted uppercase tracking-widest">Full Identity</label>
                <input type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full px-5 py-4 bg-brand-sage/5 border border-brand-sage rounded-xl focus:ring-1 focus:ring-brand-gold outline-none" placeholder="Identity name" />
              </div>
            )}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-brand-muted uppercase tracking-widest">Secure Email</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-5 py-4 bg-brand-sage/5 border border-brand-sage rounded-xl focus:ring-1 focus:ring-brand-gold outline-none" placeholder="trader@athenix.ai" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-brand-muted uppercase tracking-widest">Password</label>
              <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-5 py-4 bg-brand-sage/5 border border-brand-sage rounded-xl focus:ring-1 focus:ring-brand-gold outline-none" placeholder="••••••••" />
            </div>
            {error && <div className="p-4 bg-brand-error/10 border border-brand-error/20 rounded-xl"><p className="text-[10px] text-brand-error font-black uppercase">{error}</p></div>}
            <button type="submit" disabled={isProcessing || !auth} className="btn-primary w-full py-5 font-black rounded-xl uppercase tracking-widest disabled:opacity-50">
              {isProcessing ? 'Verifying...' : mode === 'login' ? 'Enter System' : 'Create Profile'}
            </button>
          </form>
          <div className="text-center">
            <button onClick={onToggleMode} className="text-xs font-bold text-brand-muted hover:text-brand-gold tracking-wide uppercase">
              {mode === 'login' ? "Unregistered? Join Network" : "Verified? Access Terminal"}
            </button>
          </div>
        </div>
      </div>
      <div className="hidden lg:block flex-1 bg-brand-charcoal relative">
        <div className="h-full flex flex-col justify-end p-20">
          <div className="max-w-md">
            <div className="w-16 h-1 bg-brand-gold mb-8"></div>
            <h3 className="text-5xl font-black text-white leading-tight mb-6">Empowering Traders with Neural Intelligence.</h3>
            <p className="text-brand-gold font-bold uppercase tracking-[0.2em] text-sm">Forex • Stocks • Crypto</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;