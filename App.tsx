import React, { useState, useEffect } from 'react';
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
import { auth } from './firebase'; // FIXED IMPORT
import { verifyBackendConnectivity } from './services/backend';
import { getUserProfile } from './services/firestore';

const SEO_CONFIG: Record<string, { title: string; description: string; noindex?: boolean }> = {
  'landing': { title: 'Athenix | Institutional AI Trading', description: 'Master markets with AI analysis.' },
  'dashboard': { title: 'Dashboard | Athenix Terminal', description: 'Market intelligence hub.', noindex: true },
  'assistant': { title: 'AI Assistant | Neural Analysis', description: 'Market scanning.', noindex: true },
  'education': { title: 'Education Hub', description: 'Trading education.', noindex: false },
  'signals': { title: 'Signals Feed', description: 'Trade setups.', noindex: true },
  'journal': { title: 'Trade Journal', description: 'Performance audit.', noindex: true },
  'billing': { title: 'Billing', description: 'Resources.', noindex: true },
  'settings': { title: 'Settings', description: 'Identity.', noindex: true },
  'admin': { title: 'Admin Panel', description: 'Management.', noindex: true }
};

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<string>('splash');
  const [isAuthResolving, setIsAuthResolving] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);

  const getPageFromPath = (path: string) => {
    if (!path || path === '/' || path === '') return 'landing';
    if (path === '/login') return 'login';
    if (path === '/register') return 'signup';
    if (path === '/onboarding') return 'onboarding';
    if (path.startsWith('/terminal/')) return path.replace('/terminal/', '');
    return 'landing';
  };

  const getPathFromPage = (page: string) => {
    if (page === 'landing') return '/';
    if (page === 'login') return '/login';
    if (page === 'signup') return '/register';
    if (page === 'onboarding') return '/onboarding';
    return `/terminal/${page}`;
  };

  const navigateTo = (page: string) => {
    if (page === 'admin' && user?.role !== UserRole.ADMIN) {
      navigateTo('dashboard');
      return;
    }
    const path = getPathFromPage(page);
    try {
      if (window.history && window.history.pushState) {
        window.history.pushState({}, '', path);
      }
    } catch (err) {}
    setCurrentPage(page);
  };

  useEffect(() => {
    const initialPage = getPageFromPath(window.location.pathname);
    setCurrentPage(initialPage);
    verifyBackendConnectivity();

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setIsAuthResolving(true);
      if (firebaseUser) {
        const profile = await getUserProfile(firebaseUser.uid);
        if (profile) {
          setUser(profile);
          if (['landing', 'onboarding', 'login', 'signup'].includes(currentPage)) {
            navigateTo('dashboard');
          }
        } else {
          setUser(null);
          navigateTo('onboarding');
        }
      } else {
        setUser(null);
        const current = getPageFromPath(window.location.pathname);
        if (!['landing', 'onboarding', 'login', 'signup', 'education'].includes(current)) {
          navigateTo('landing');
        }
      }
      setIsAuthResolving(false);
    });

    return () => unsubscribe();
  }, [currentPage]);

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
    if (isAuthResolving && !isPublicPage) {
      return <div className="flex-1 flex items-center justify-center"><div className="w-10 h-10 border-4 border-brand-sage border-t-brand-gold rounded-full animate-spin"></div></div>;
    }
    switch (currentPage) {
      case 'splash': return <Splash />;
      case 'landing': return <LandingPage onEnter={() => navigateTo('onboarding')} />;
      case 'onboarding': return <Onboarding onStart={() => navigateTo('signup')} onLogin={() => navigateTo('login')} />;
      case 'login': return <AuthPage mode="login" onAuthSuccess={() => {}} onToggleMode={() => navigateTo('signup')} />;
      case 'signup': return <AuthPage mode="signup" onAuthSuccess={() => {}} onToggleMode={() => navigateTo('login')} />;
      case 'dashboard': return <Dashboard user={user} onNavigate={navigateTo} />;
      case 'assistant': return <AIAssistant user={user} onTokenSpend={() => {}} />;
      case 'education': return <EducationHub user={user} onTokenSpend={() => {}} onNavigate={navigateTo} />;
      case 'signals': return <Signals user={user} />;
      case 'journal': return <Journal user={user} />;
      case 'billing': return <Billing user={user} />;
      case 'settings': return <Settings user={user} />;
      case 'admin': return <AdminDashboard user={user} />;
      default: return <LandingPage onEnter={() => navigateTo('onboarding')} />;
    }
  };

  return (
    <div className="min-h-screen bg-white text-brand-charcoal flex flex-col">
      {!isPublicPage && user && (
        <Sidebar user={user} isOpen={isSidebarOpen} activePage={currentPage} onNavigate={navigateTo} onClose={() => setIsSidebarOpen(false)} onLogout={handleLogout} />
      )}
      <main className={`flex-1 flex flex-col min-w-0 transition-all duration-500 ${!isPublicPage && isSidebarOpen && user ? 'md:ml-80' : ''}`}>
        {!isPublicPage && user && <Header user={user} onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />}
        <div className="flex-1 overflow-auto">{renderPage()}</div>
      </main>
    </div>
  );
};

export default App;