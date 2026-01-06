
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
import { auth } from './lib/firebase';
import { verifyBackendConnectivity } from './services/backend';
import { getUserProfile } from './services/firestore';

// SEO Metadata Configuration
const SEO_CONFIG: Record<string, { title: string; description: string; noindex?: boolean }> = {
  'landing': {
    title: 'Athenix | Institutional AI Trading & Market Intelligence',
    description: 'Master the markets with Athenix. Professional AI-driven forex analysis, institutional signals, and elite trading education for modern traders.'
  },
  'login': {
    title: 'Login | Athenix Trading Terminal',
    description: 'Access your Athenix terminal. Secure login for institutional market analysis, neural trade setups, and verified signal feeds.'
  },
  'signup': {
    title: 'Register Account | Join the Athenix Network',
    description: 'Start your professional trading journey. Create an account to access high-precision AI market scanning and elite education.'
  },
  'onboarding': {
    title: 'Get Started | Athenix Intelligence',
    description: 'Configure your institutional trading profile and enter the Athenix neural network.'
  },
  'dashboard': {
    title: 'Dashboard | Athenix Terminal',
    description: 'Your central hub for market intelligence.',
    noindex: true
  },
  'assistant': {
    title: 'AI Assistant | Neural Analysis',
    description: 'High-precision market scanning.',
    noindex: true
  },
  'education': {
    title: 'Education Hub | Institutional Alpha & Strategy',
    description: 'Deep-dive trading education on Smart Money Concepts, institutional liquidity, and algorithmic market analysis.',
    noindex: false // LIFTED: Now indexable for organic authority growth
  },
  'signals': {
    title: 'Signals Feed | Verified Vectors',
    description: 'Institutional-grade trade setups.',
    noindex: true
  },
  'journal': {
    title: 'Trade Journal | Performance Audit',
    description: 'Track and analyze your trading edge.',
    noindex: true
  },
  'billing': {
    title: 'Billing & Tokens | Athenix Resources',
    description: 'Manage your terminal resource allocations.',
    noindex: true
  },
  'settings': {
    title: 'Settings | Security Protocol',
    description: 'Configure your terminal identity.',
    noindex: true
  },
  'admin': {
    title: 'Admin Panel | Institutional Oversight',
    description: 'Platform management terminal.',
    noindex: true
  }
};

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<string>('splash');
  const [isAuthResolving, setIsAuthResolving] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);

  const getPageFromPath = (path: string) => {
    if (!path || path.startsWith('blob:') || path === 'about:srcdoc') return 'landing';
    if (path === '/' || path === '') return 'landing';
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

  useEffect(() => {
    const config = SEO_CONFIG[currentPage] || SEO_CONFIG['landing'];
    document.title = config.title;
    
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute('content', config.description);

    let robots = document.querySelector('meta[name="robots"]');
    if (!robots) {
      robots = document.createElement('meta');
      robots.setAttribute('name', 'robots');
      document.head.appendChild(robots);
    }
    robots.setAttribute('content', config.noindex ? 'noindex, nofollow' : 'index, follow');

    const origin = window.location.origin.startsWith('blob:') ? 'https://athenix-neural.web.app' : window.location.origin;
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', origin + getPathFromPage(currentPage));

    const updateOG = (property: string, content: string) => {
      let el = document.querySelector(`meta[property="${property}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute('property', property);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    updateOG('og:title', config.title);
    updateOG('og:description', config.description);
    updateOG('og:url', origin + getPathFromPage(currentPage));
    updateOG('og:type', 'website');
  }, [currentPage]);

  useEffect(() => {
    verifyBackendConnectivity();
    const initialPage = getPageFromPath(window.location.pathname);
    setCurrentPage(initialPage);

    let unsubscribe: (() => void) | undefined;
    if (auth) {
      unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
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
    } else {
      setIsAuthResolving(false);
    }

    const handlePopState = () => {
      setCurrentPage(getPageFromPath(window.location.pathname));
    };
    window.addEventListener('popstate', handlePopState);

    const splashTimer = setTimeout(() => {
      if (currentPage === 'splash' && !auth?.currentUser) {
        navigateTo('landing');
      }
    }, 2500);

    return () => {
      if (unsubscribe) unsubscribe();
      clearTimeout(splashTimer);
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

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
    } catch (err) {
      console.warn("Navigation fallback active", err);
    }
    setCurrentPage(page);
  };

  const handleLogout = async () => {
    try {
      if (auth) await signOut(auth);
      setUser(null);
      setIsSidebarOpen(false);
      navigateTo('landing');
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  const isPublicPage = ['landing', 'onboarding', 'login', 'signup', 'splash', 'education'].includes(currentPage);

  const renderPage = () => {
    if (isAuthResolving && currentPage === 'splash') return <Splash />;
    if (isAuthResolving && !isPublicPage) {
      return (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-brand-sage border-t-brand-gold rounded-full animate-spin"></div>
        </div>
      );
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
      case 'admin': return user?.role === UserRole.ADMIN ? <AdminDashboard user={user} /> : <Dashboard user={user} onNavigate={navigateTo} />;
      default: return <LandingPage onEnter={() => navigateTo('onboarding')} />;
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
        {!isPublicPage && user && <Header user={user} onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />}
        <div className="flex-1 overflow-auto">
          {renderPage()}
        </div>
      </main>
    </div>
  );
};

export default App;
