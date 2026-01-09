import React, { useState, useEffect, useCallback, useRef } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import AIAssistant from './pages/AIAssistant';
import EducationHub from './pages/EducationHub';
import Signals from './pages/Signals';
import AuthPage from './pages/Auth';
import Splash from './pages/Splash';
import Onboarding from './pages/Onboarding';
import LandingPage from './pages/Landing';
import Journal from './pages/Journal';
import Billing from './pages/Billing';
import Settings from './pages/Settings';
import AdminDashboard from './pages/AdminDashboard';
import { UserProfile, UserRole } from './types';
import { auth } from './firebase';
import { verifyBackendConnectivity } from './services/backend';
import { getUserProfile, initializeUserDocument } from './services/firestore';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<string>('splash');
  const [isAuthResolving, setIsAuthResolving] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);

  // Use refs to access latest state/props inside effects without triggering re-runs
  const userRef = useRef<UserProfile | null>(null);
  useEffect(() => { userRef.current = user; }, [user]);

  const getPageFromPath = useCallback((path: string) => {
    if (!path || path === '/' || path === '') return 'landing';
    if (path === '/login') return 'login';
    if (path === '/register') return 'signup';
    if (path === '/onboarding') return 'onboarding';
    if (path.startsWith('/terminal/')) return path.replace('/terminal/', '');
    return 'landing';
  }, []);

  const getPathFromPage = (page: string) => {
    if (page === 'landing') return '/';
    if (page === 'login') return '/login';
    if (page === 'signup') return '/register';
    if (page === 'onboarding') return '/onboarding';
    return `/terminal/${page}`;
  };

  const navigateTo = useCallback((page: string) => {
    // Access current user from ref to avoid dependency cycle
    const currentUser = userRef.current;
    
    // Admin Guard
    if (page === 'admin' && currentUser?.role !== UserRole.ADMIN) {
      // Recursive call, but safe as 'dashboard' != 'admin'
      // We manually set state here to avoid loop if we called navigateTo recursively
      const dashPath = getPathFromPage('dashboard');
      window.history.pushState({}, '', dashPath);
      setCurrentPage('dashboard');
      return;
    }
    
    const path = getPathFromPage(page);
    try {
      if (window.location.pathname !== path) {
        window.history.pushState({}, '', path);
      }
    } catch (err) {}
    setCurrentPage(page);
    setIsSidebarOpen(false); // Close sidebar on mobile after navigation
  }, []); // Empty dependency array = stable function

  // Sync state with URL when back/forward is clicked
  useEffect(() => {
    const handlePopState = () => {
      const page = getPageFromPath(window.location.pathname);
      setCurrentPage(page);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [getPageFromPath]);

  useEffect(() => {
    const initialPage = getPageFromPath(window.location.pathname);
    setCurrentPage(initialPage);
    verifyBackendConnectivity();

    // Use a stable listener setup
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      // Don't set resolving to true immediately to avoid flash if state is stable
      if (!userRef.current && firebaseUser) setIsAuthResolving(true);
      
      if (firebaseUser) {
        // Attempt to fetch profile
        let profile = await getUserProfile(firebaseUser.uid);
        
        // AUTO-HEALING: If profile is missing, create it instead of kicking user out
        if (!profile) {
          console.log("Athenix: Profile missing. Attempting auto-creation...");
          // Wait briefly to allow DB propagation if this is a fresh signup
          await new Promise(resolve => setTimeout(resolve, 1000));
          profile = await getUserProfile(firebaseUser.uid);
          
          if (!profile) {
             console.log("Athenix: Profile still missing. Initializing default profile.");
             profile = await initializeUserDocument(firebaseUser.uid, {
               fullName: firebaseUser.displayName || 'Trader',
               email: firebaseUser.email || ''
             });
          }
        }

        if (profile) {
          console.log("Athenix: User Profile Authenticated");
          setUser(profile);
          // If we are on an auth page, redirect to dashboard
          const currentPathPage = getPageFromPath(window.location.pathname);
          if (['landing', 'onboarding', 'login', 'signup', 'splash'].includes(currentPathPage)) {
            navigateTo('dashboard');
          } else {
            // Stay on current page if it's a valid internal page
            setCurrentPage(currentPathPage);
          }
        } else {
          // Absolute fail-safe
          console.warn("Athenix: Critical Profile Error. Resetting.");
          await signOut(auth);
          setUser(null);
          navigateTo('login');
        }
      } else {
        setUser(null);
        const current = getPageFromPath(window.location.pathname);
        const protectedPages = ['dashboard', 'assistant', 'signals', 'journal', 'billing', 'settings', 'admin'];
        if (protectedPages.includes(current)) {
          navigateTo('landing');
        } else {
           // Allow staying on login/signup/landing
           if (current === 'splash') navigateTo('landing');
           else setCurrentPage(current);
        }
      }
      setIsAuthResolving(false);
    });

    return () => unsubscribe();
  }, []); // Run once on mount

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      navigateTo('landing');
    } catch (error) {}
  };

  const isPublicPage = ['landing', 'onboarding', 'login', 'signup', 'splash', 'education'].includes(currentPage);

  const renderPage = () => {
    if (isAuthResolving && currentPage === 'splash') return <Splash />;
    // Show spinner if resolving state but not on a public page (waiting for profile)
    if (isAuthResolving && !isPublicPage) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center space-y-4 min-h-[50vh]">
          <div className="w-12 h-12 border-4 border-brand-sage border-t-brand-gold rounded-full animate-spin"></div>
          <p className="text-[10px] font-black text-brand-muted uppercase tracking-widest">Verifying Neural Session...</p>
        </div>
      );
    }

    switch (currentPage) {
      case 'splash': return <Splash />;
      case 'landing': return <LandingPage onEnter={() => navigateTo(user ? 'dashboard' : 'onboarding')} />;
      case 'onboarding': return <Onboarding onStart={() => navigateTo('signup')} onLogin={() => navigateTo('login')} />;
      case 'login': return <AuthPage mode="login" onAuthSuccess={() => {}} onToggleMode={() => navigateTo('signup')} />;
      case 'signup': return <AuthPage mode="signup" onAuthSuccess={() => {}} onToggleMode={() => navigateTo('login')} />;
      case 'dashboard': return <Dashboard user={user} onNavigate={navigateTo} />;
      case 'assistant': return <AIAssistant user={user} onTokenSpend={() => {}} />;
      case 'education': return <EducationHub user={user} onTokenSpend={() => {}} onNavigate={navigateTo} />;
      case 'signals': return <Signals user={user} />;
      case 'journal': return <Journal user={user} />;
      case 'billing': return <Billing user={user} />;
      case 'settings': return <Settings user={user} onLogout={handleLogout} />;
      case 'admin': return <AdminDashboard user={user} />;
      default: return <LandingPage onEnter={() => navigateTo(user ? 'dashboard' : 'onboarding')} />;
    }
  };

  return (
    <div className="min-h-screen bg-white text-brand-charcoal flex flex-col">
      {!isPublicPage && user && (
        <Sidebar 
          user={user} 
          isOpen={isSidebarOpen} 
          activePage={currentPage} 
          onNavigate={navigateTo} 
          onClose={() => setIsSidebarOpen(false)} 
          onLogout={handleLogout} 
        />
      )}
      <main className={`flex-1 flex flex-col min-w-0 transition-all duration-500 ${!isPublicPage && isSidebarOpen && user ? 'md:ml-80' : ''}`}>
        {!isPublicPage && user && (
          <Header 
            user={user} 
            onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} 
            onNavigate={navigateTo}
          />
        )}
        <div className="flex-1 overflow-auto">{renderPage()}</div>
      </main>
    </div>
  );
};

export default App;