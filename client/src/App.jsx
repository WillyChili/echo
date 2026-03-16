import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useRef, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProfileProvider, useProfile } from './context/ProfileContext';
import { ThemeProvider } from './context/ThemeContext';
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
  // Only block with spinner on first load (no cached data yet).
  // On app resume / token refresh, displayName is already in localStorage
  // so we let the profile re-fetch happen silently in the background.
  if (profileLoading && displayName === null) return <Spinner />;
  if (displayName === null) return <Spinner />;
  if (!displayName) return <OnboardingPage />;
  return (
    <div
      className="h-screen flex flex-col bg-background overflow-hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <Nav />
      {/* Spacer that matches the fixed Nav height (h-14 + status bar safe area) */}
      <div style={{ height: 'calc(3.5rem + env(safe-area-inset-top))', flexShrink: 0 }} />
      <main className="flex-1 flex flex-col overflow-hidden">
        <Routes>
          <Route path="/"         element={<TodayPage />} />
          <Route path="/chat"     element={<ChatPage />} />
          <Route path="/settings"      element={<SettingsPage />} />
          <Route path="/edit-profile"  element={<EditProfilePage />} />
          <Route path="*"             element={<Navigate to="/" replace />} />
        </Routes>
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
