import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, Link } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Home, Target, User, Brain, BookOpen } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';

import { LoginScreen } from './screens/Login';
import { DashboardScreen } from './screens/Dashboard';
import { ArenaScreen } from './screens/Arena';
import { AnalyticsScreen } from './screens/Analytics';
import { AcademyScreen } from './screens/Academy';
import { ProfileScreen } from './screens/Profile';
import { PaywallScreen } from './screens/Paywall';
import { OnboardingScreen } from './screens/Onboarding';
import { RecorderFlow } from './screens/RecorderFlow';
import InterviewFlow from './screens/InterviewFlow';

const BottomNav = () => {
  const location = useLocation();
  const tabs = [
    { id: '/dashboard', label: 'Home', icon: Home },
    { id: '/arena', label: 'Arena', icon: Target },
    { id: '/analytics', label: 'Analyse', icon: Brain },
    { id: '/academy', label: 'Lernen', icon: BookOpen },
    { id: '/profile', label: 'Profil', icon: User }
  ];

  // Hide nav on specific screens
  if (['/', '/paywall', '/onboarding'].includes(location.pathname) || location.pathname.startsWith('/record') || location.pathname.startsWith('/interview')) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 pb-[env(safe-area-inset-bottom)] z-40">
      <div className="max-w-md mx-auto flex h-16">
        {tabs.map(({ id, label, icon: Icon }) => (
          <Link key={id} to={id} className={`flex-1 flex flex-col items-center justify-center gap-1 border-t-2 transition-colors ${location.pathname === id ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
            <Icon size={20} strokeWidth={location.pathname === id ? 2.5 : 2} />
            <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
};

const ProtectedRoute = ({ children, requireOnboarding = true }) => {
  const { user, profile, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/" replace />;
  if (requireOnboarding && profile && !profile.isOnboarded) {
    return <Navigate to="/onboarding" replace />;
  }
  return children;
};

const AppRoutes = () => {
  const { user } = useAuth();
  return (
    <div className="w-full min-h-screen bg-slate-50 relative">
      <AnimatePresence mode="wait">
        <Routes>
          <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <LoginScreen />} />
          <Route path="/onboarding" element={<ProtectedRoute requireOnboarding={false}><OnboardingScreen /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><DashboardScreen /></ProtectedRoute>} />
          <Route path="/arena" element={<ProtectedRoute><ArenaScreen /></ProtectedRoute>} />
          <Route path="/analytics" element={<ProtectedRoute><AnalyticsScreen /></ProtectedRoute>} />
          <Route path="/academy" element={<ProtectedRoute><AcademyScreen /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><ProfileScreen /></ProtectedRoute>} />
          <Route path="/paywall" element={<ProtectedRoute><PaywallScreen /></ProtectedRoute>} />
          <Route path="/record/:modeId" element={<ProtectedRoute><RecorderFlow /></ProtectedRoute>} />
          <Route path="/interview/:modeId" element={<ProtectedRoute><InterviewFlow /></ProtectedRoute>} />
        </Routes>
      </AnimatePresence>
      <BottomNav />
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;
