import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import React, { useRef, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProfileProvider, useProfile } from './context/ProfileContext';
import { ThemeProvider } from './context/ThemeContext';
import translations from './lib/translations';

class ErrorBoundary extends React.Component {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(err, info) { console.error('ErrorBoundary:', err, info); }
  render() {
    if (this.state.hasError) {
      const lang = localStorage.getItem('echo_lang') || 'en';
      const t = (key) => translations[lang]?.[key] ?? translations.en[key] ?? key;
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background p-8 text-center">
          <p className="text-foreground text-lg font-medium mb-2">{t('error_boundary_title')}</p>
          <p className="text-muted-foreground text-sm mb-6">{t('error_boundary_desc')}</p>
          <button onClick={() => window.location.reload()} className="bg-mint text-background px-6 py-2.5 rounded-xl text-sm font-medium active:opacity-70 transition-opacity">
            {t('error_boundary_reload')}
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
import Nav from './components/Nav.jsx';
import TodayPage from './pages/TodayPage.jsx';
import ChatPage from './pages/ChatPage.jsx';
import AuthPage from './pages/AuthPage.jsx';
import SettingsPage from './pages/SettingsPage.jsx';
import EditProfilePage from './pages/EditProfilePage.jsx';
import OnboardingPage from './pages/OnboardingPage.jsx';

function Spinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-6 h-6 rounded-full border-2 border-border border-t-foreground animate-spin" />
    </div>
  );
}

function ProtectedRoutes() {
  const { displayName, profileLoading } = useProfile();
  const location = useLocation();
  // Only block with spinner on first load (no cached data yet).
  // On app resume / token refresh, displayName is already in localStorage
  // so we let the profile re-fetch happen silently in the background.
  if (profileLoading && displayName === null) return <Spinner />;
  if (displayName === null) return <Spinner />;
  if (!displayName) return <OnboardingPage />;
  return (
    <div
      className="flex flex-col bg-background overflow-hidden"
      style={{ height: '100dvh', paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <Nav />
      {/* Spacer that matches the fixed Nav height (h-14 + status bar safe area) */}
      <div style={{ height: 'calc(3.5rem + env(safe-area-inset-top))', flexShrink: 0 }} />
      <main key={location.pathname} className="flex-1 flex flex-col overflow-hidden page-transition">
        <ErrorBoundary>
          <Routes>
            <Route path="/"         element={<TodayPage />} />
            <Route path="/chat"     element={<ChatPage />} />
            <Route path="/settings"      element={<SettingsPage />} />
            <Route path="/edit-profile"  element={<EditProfilePage />} />
            <Route path="*"             element={<Navigate to="/" replace />} />
          </Routes>
        </ErrorBoundary>
      </main>
    </div>
  );
}

function AppRoutes() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const prevUserRef = useRef(undefined);

  // Redirect to notes on login (not on page refresh while already logged in)
  useEffect(() => {
    if (prevUserRef.current === null && user) {
      navigate('/', { replace: true });
    }
    if (!loading) {
      prevUserRef.current = user ?? null;
    }
  }, [user, loading, navigate]);

  if (loading) return <Spinner />;
  if (!user) return <AuthPage />;

  return (
    <ProfileProvider>
      <ProtectedRoutes />
    </ProfileProvider>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </ThemeProvider>
  );
}
