import React, { useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { auth } from '../firebase';
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
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  
  // Internal state to handle 'forgot password' view within the login mode
  const [isForgotPassword, setIsForgotPassword] = useState(false);

  // Reset internal states when mode changes
  useEffect(() => {
    setIsForgotPassword(false);
    setError(null);
    setSuccessMsg(null);
    setEmail('');
    setPassword('');
  }, [mode]);

  const handleGoogleAuth = async () => {
    if (!auth) {
      setError("Terminal synchronization error. Please restart.");
      return;
    }
    
    setIsProcessing(true);
    setError(null);
    
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      // Initialize profile immediately to ensure data consistency
      await initializeUserDocument(result.user.uid, { 
        fullName: result.user.displayName || 'Trader', 
        email: result.user.email || '' 
      });
      
      // onAuthSuccess is handled by the onAuthStateChanged listener in App.tsx
    } catch (err: any) {
      console.error(err);
      let message = "Google Access Denied.";
      if (err.code === 'auth/popup-closed-by-user') message = "Authentication cancelled.";
      if (err.code === 'auth/popup-blocked') message = "Pop-up blocked by browser.";
      setError(message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) {
      setError("Terminal synchronization error. Please restart the terminal.");
      return;
    }

    setIsProcessing(true);
    setError(null);
    setSuccessMsg(null);

    try {
      if (isForgotPassword) {
        // Forgot Password Flow
        await sendPasswordResetEmail(auth, email);
        setSuccessMsg("Reset directive sent. Check your secure inbox.");
        setIsProcessing(false);
        return;
      }

      if (mode === 'signup') {
        // Registration Flow
        if (!fullName.trim()) {
           throw new Error("Identity required.");
        }
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await initializeUserDocument(userCredential.user.uid, { fullName, email });
        // onAuthSuccess is handled by the onAuthStateChanged listener in App.tsx
      } else {
        // Login Flow
        await signInWithEmailAndPassword(auth, email, password);
        // onAuthSuccess is handled by the onAuthStateChanged listener in App.tsx
      }
    } catch (err: any) {
      console.error(err);
      let message = "Authentication failed.";
      
      // Firebase Error Mapping
      if (err.code === 'auth/email-already-in-use') message = "Identity already registered in network.";
      if (err.code === 'auth/invalid-credential') message = "Invalid credentials provided.";
      if (err.code === 'auth/user-not-found') message = "Identity not found in network.";
      if (err.code === 'auth/wrong-password') message = "Secure credentials mismatch.";
      if (err.code === 'auth/weak-password') message = "Security too weak (min 6 chars).";
      if (err.code === 'auth/too-many-requests') message = "Too many attempts. Access temporarily locked.";
      if (err.message === "Identity required.") message = "Please provide your full identity.";

      setError(message);
    } finally {
      setIsProcessing(false);
    }
  };

  const renderForm = () => {
    if (isForgotPassword) {
       return (
         <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-brand-muted uppercase tracking-widest">Registered Email</label>
              <input 
                type="email" 
                required 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                className="w-full px-5 py-4 bg-brand-sage/5 border border-brand-sage rounded-xl focus:ring-1 focus:ring-brand-gold outline-none transition-all" 
                placeholder="trader@athenix.ai" 
              />
            </div>
            {successMsg && <div className="p-4 bg-brand-success/10 border border-brand-success/20 rounded-xl"><p className="text-[10px] text-brand-success font-black uppercase">{successMsg}</p></div>}
            {error && <div className="p-4 bg-brand-error/10 border border-brand-error/20 rounded-xl"><p className="text-[10px] text-brand-error font-black uppercase">{error}</p></div>}
            
            <button type="submit" disabled={isProcessing} className="btn-primary w-full py-5 font-black rounded-xl uppercase tracking-widest disabled:opacity-50 hover:shadow-lg transition-all">
              {isProcessing ? 'Transmitting...' : 'Send Recovery Link'}
            </button>
            
            <button 
              type="button"
              onClick={() => setIsForgotPassword(false)}
              className="w-full py-3 text-[10px] font-black text-brand-muted uppercase tracking-widest hover:text-brand-charcoal"
            >
              Cancel Recovery
            </button>
         </form>
       );
    }

    return (
      <div className="space-y-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          {mode === 'signup' && (
            <div className="space-y-2">
              <label className="text-[10px] font-black text-brand-muted uppercase tracking-widest">Full Identity</label>
              <input 
                type="text" 
                required 
                value={fullName} 
                onChange={(e) => setFullName(e.target.value)} 
                className="w-full px-5 py-4 bg-brand-sage/5 border border-brand-sage rounded-xl focus:ring-1 focus:ring-brand-gold outline-none transition-all" 
                placeholder="Identity Name" 
              />
            </div>
          )}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-brand-muted uppercase tracking-widest">Secure Email</label>
            <input 
              type="email" 
              required 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              className="w-full px-5 py-4 bg-brand-sage/5 border border-brand-sage rounded-xl focus:ring-1 focus:ring-brand-gold outline-none transition-all" 
              placeholder="trader@athenix.ai" 
            />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-black text-brand-muted uppercase tracking-widest">Password</label>
              {mode === 'login' && (
                <button 
                  type="button" 
                  onClick={() => setIsForgotPassword(true)}
                  className="text-[9px] font-black text-brand-gold uppercase tracking-widest hover:underline"
                >
                  Forgot Password?
                </button>
              )}
            </div>
            <input 
              type="password" 
              required 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              className="w-full px-5 py-4 bg-brand-sage/5 border border-brand-sage rounded-xl focus:ring-1 focus:ring-brand-gold outline-none transition-all" 
              placeholder="••••••••" 
            />
          </div>
          
          {error && <div className="p-4 bg-brand-error/10 border border-brand-error/20 rounded-xl"><p className="text-[10px] text-brand-error font-black uppercase">{error}</p></div>}
          
          <button type="submit" disabled={isProcessing || !auth} className="btn-primary w-full py-5 font-black rounded-xl uppercase tracking-widest disabled:opacity-50 hover:shadow-lg transition-all">
            {isProcessing ? 'Verifying...' : mode === 'login' ? 'Enter System' : 'Create Profile'}
          </button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-brand-sage/20"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-white text-[9px] font-bold text-brand-muted uppercase tracking-widest">Or Continue With</span>
          </div>
        </div>

        <button 
          onClick={handleGoogleAuth}
          disabled={isProcessing}
          type="button"
          className="w-full flex items-center justify-center gap-3 py-4 border border-brand-sage/30 rounded-xl hover:bg-brand-sage/5 hover:border-brand-gold/30 transition-all group bg-white"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          <span className="text-[10px] font-black text-brand-charcoal uppercase tracking-widest group-hover:text-brand-gold transition-colors">Google</span>
        </button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-white flex">
      <div className="flex-1 flex flex-col justify-center px-8 md:px-24 py-12">
        <div className="max-w-md w-full mx-auto space-y-10">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 bg-brand-gold rounded-lg flex items-center justify-center text-white font-bold">A</div>
             <span className="text-xl font-black tracking-tighter text-brand-charcoal">ATHENIX</span>
          </div>
          
          <div className="space-y-2 animate-fade-in">
            <h2 className="text-4xl font-black text-brand-charcoal">
              {isForgotPassword ? 'Access Recovery' : (mode === 'login' ? 'Terminal Login' : 'Register Account')}
            </h2>
            <p className="text-brand-muted font-medium">
              {isForgotPassword 
                ? 'Restore your credentials to regain neural network access.' 
                : 'Access institutional-grade AI trading intelligence.'}
            </p>
          </div>

          {renderForm()}

          {!isForgotPassword && (
            <div className="text-center pt-4">
              <button onClick={onToggleMode} className="text-xs font-bold text-brand-muted hover:text-brand-gold tracking-wide uppercase transition-colors">
                {mode === 'login' ? "Unregistered? Join Network" : "Verified? Access Terminal"}
              </button>
            </div>
          )}
        </div>
      </div>
      
      <div className="hidden lg:block flex-1 bg-brand-charcoal relative overflow-hidden">
        <div className="absolute inset-0 bg-premium-gradient opacity-10"></div>
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-brand-gold/10 blur-[120px] rounded-full"></div>
        <div className="h-full flex flex-col justify-end p-20 relative z-10">
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