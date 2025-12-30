
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import AIAssistant from './pages/AIAssistant';
import EducationHub from './pages/EducationHub';
import Signals from './pages/Signals';
import AuthPage from './pages/Auth';
import LandingPage from './pages/Landing';
import Splash from './pages/Splash';
import Onboarding from './pages/Onboarding';
import Journal from './pages/Journal';
import Billing from './pages/Billing';
import Settings from './pages/Settings';
import AdminDashboard from './pages/AdminDashboard';
import { UserProfile, UserRole, SubscriptionPlan } from './types';
import './lib/firebase'; // Initialize Firebase Infrastructure

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<string>('splash');
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Structural user for placeholder data (no logic yet)
  const mockUser: UserProfile = {
    uid: 'ATH-78X-NEURAL',
    fullName: 'Alexander Matrix',
    email: 'terminal@athenix.ai',
    role: UserRole.ADMIN,
    subscription: SubscriptionPlan.ELITE,
    tokens: { analysis: 42, education: 88 },
    createdAt: new Date().toISOString()
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
      if (currentPage === 'splash') setCurrentPage('onboarding');
    }, 2500);
    return () => clearTimeout(timer);
  }, [currentPage]);

  const renderPage = () => {
    switch (currentPage) {
      case 'splash': return <Splash />;
      case 'onboarding': return <Onboarding onStart={() => setCurrentPage('signup')} onLogin={() => setCurrentPage('login')} />;
      case 'login': return <AuthPage mode="login" onAuthSuccess={() => setCurrentPage('dashboard')} onToggleMode={() => setCurrentPage('signup')} />;
      case 'signup': return <AuthPage mode="signup" onAuthSuccess={() => setCurrentPage('dashboard')} onToggleMode={() => setCurrentPage('login')} />;
      case 'dashboard': return <Dashboard onNavigate={setCurrentPage} />;
      case 'assistant': return <AIAssistant user={mockUser} onTokenSpend={() => {}} />;
      case 'education': return <EducationHub user={mockUser} onTokenSpend={() => {}} />;
      case 'signals': return <Signals user={mockUser} />;
      case 'journal': return <Journal />;
      case 'billing': return <Billing />;
      case 'settings': return <Settings />;
      case 'admin': return <AdminDashboard />;
      default: return <Dashboard onNavigate={setCurrentPage} />;
    }
  };

  const isPublicPage = ['splash', 'onboarding', 'login', 'signup'].includes(currentPage);

  if (currentPage === 'splash') return <Splash />;

  return (
    <div className="min-h-screen bg-white text-brand-charcoal flex flex-col">
      {!isPublicPage && (
        <Sidebar 
          user={mockUser} 
          isOpen={isSidebarOpen}
          activePage={currentPage} 
          onNavigate={setCurrentPage} 
          onClose={() => setIsSidebarOpen(false)}
          onLogout={() => {
            setIsSidebarOpen(false);
            setCurrentPage('onboarding');
          }}
        />
      )}
      
      <main className={`flex-1 flex flex-col min-w-0 transition-all duration-500 ${!isPublicPage && isSidebarOpen ? 'md:ml-80' : ''}`}>
        {!isPublicPage && <Header user={mockUser} onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />}
        <div className="flex-1 overflow-auto">
          {renderPage()}
        </div>
      </main>
    </div>
  );
};

export default App;
