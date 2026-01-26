
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
import About from './pages/About';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import Pricing from './pages/Pricing';
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
    if (path === '/about') return 'about';
    if (path === '/privacy-policy' || path === '/privacy') return 'privacy';
    if (path === '/terms-of-service' || path === '/terms') return 'terms';
    if (path === '/pricing') return 'pricing';
    if (path === '/admin') return 'admin';
    if (path.startsWith('/terminal/')) return path.replace('/terminal/', '');
    return 'landing';
  }, []);

  const getPathFromPage = (page: string) => {
    if (page === 'landing') return '/';
    if (page === 'login') return '/login';
    if (page === 'signup') return '/register';
    if (page === 'onboarding') return '/onboarding';
    if (page === 'about') return '/about';
    if (page === 'privacy') return '/privacy-policy';
    if (page === 'terms') return '/terms-of-service';
    if (page === 'pricing') return '/pricing';
    if (page === 'admin') return '/admin';
    return `/terminal/${page}`;
  };

  const navigateTo = useCallback((page: string) => {
    // Access current user from ref to avoid dependency cycle
    const currentUser = userRef.current;
    
    // Admin Guard
    if (page === 'admin') {
      if (!currentUser || currentUser.role !== UserRole.ADMIN) {
        // Redirect unauthorized access to dashboard if logged in, or login if not
        const fallback = currentUser ? 'dashboard' : 'login';
        window.history.pushState({}, '', getPathFromPage(fallback));
        setCurrentPage(fallback);
        return;
      }
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
    
    // Immediate Admin Check on Load
    // We defer slightly to allow auth to resolve, handled in onAuthStateChanged
    setCurrentPage(initialPage);
    verifyBackendConnectivity();

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!userRef.current && firebaseUser) setIsAuthResolving(true);
      
      if (firebaseUser) {
        let profile = await getUserProfile(firebaseUser.uid);
        
        if (!profile) {
          console.log("Athenix: Profile missing. Attempting auto-creation...");
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
          
          const currentPathPage = getPageFromPath(window.location.pathname);
          
          // Strict Admin Route Check on Auth Load
          if (currentPathPage === 'admin' && profile.role !== UserRole.ADMIN) {
            navigateTo('dashboard');
            setIsAuthResolving(false);
            return;
          }

          if (['landing', 'onboarding', 'login', 'signup', 'splash'].includes(currentPathPage)) {
            navigateTo('dashboard');
          } else {
            setCurrentPage(currentPathPage);
          }
        } else {
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
           if (current === 'splash') navigateTo('landing');
           else setCurrentPage(current);
        }
      }
      setIsAuthResolving(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      navigateTo('landing');
    } catch (error) {}
  };

  const isPublicPage = ['landing', 'onboarding', 'login', 'signup', 'splash', 'education', 'about', 'privacy', 'terms', 'pricing'].includes(currentPage);
  const isAdminPage = currentPage === 'admin';
  const showMainLayout = !isPublicPage && !isAdminPage && !!user;

  const renderPage = () => {
    if (isAuthResolving && currentPage === 'splash') return <Splash />;
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
      case 'landing': return <LandingPage onEnter={() => navigateTo(user ? 'dashboard' : 'onboarding')} onNavigate={navigateTo} />;
      case 'onboarding': return <Onboarding onStart={() => navigateTo('signup')} onLogin={() => navigateTo('login')} />;
      case 'login': return <AuthPage mode="login" onAuthSuccess={() => {}} onToggleMode={() => navigateTo('signup')} />;
      case 'signup': return <AuthPage mode="signup" onAuthSuccess={() => {}} onToggleMode={() => navigateTo('login')} />;
      case 'about': return <About onNavigate={navigateTo} />;
      case 'privacy': return <Privacy onNavigate={navigateTo} />;
      case 'terms': return <Terms onNavigate={navigateTo} />;
      case 'pricing': return <Pricing user={user} onNavigate={navigateTo} />;
      case 'dashboard': return <Dashboard user={user} onNavigate={navigateTo} />;
      case 'assistant': return <AIAssistant user={user} onTokenSpend={() => {}} />;
      case 'education': return <EducationHub user={user} onTokenSpend={() => {}} onNavigate={navigateTo} />;
      case 'signals': return <Signals user={user} />;
      case 'journal': return <Journal user={user} />;
      case 'billing': return <Billing user={user} />;
      case 'settings': return <Settings user={user} onLogout={handleLogout} />;
      case 'admin': return <AdminDashboard user={user} onNavigate={navigateTo} onLogout={handleLogout} />;
      default: return <LandingPage onEnter={() => navigateTo(user ? 'dashboard' : 'onboarding')} onNavigate={navigateTo} />;
    }
  };

  return (
    <div className="min-h-screen bg-white text-brand-charcoal flex flex-col">
      {showMainLayout && (
        <Sidebar 
          user={user} 
          isOpen={isSidebarOpen} 
          activePage={currentPage} 
          onNavigate={navigateTo} 
          onClose={() => setIsSidebarOpen(false)} 
          onLogout={handleLogout} 
        />
      )}
      <main className={`flex-1 flex flex-col min-w-0 transition-all duration-500 ${showMainLayout && isSidebarOpen ? 'md:ml-80' : ''}`}>
        {showMainLayout && (
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
