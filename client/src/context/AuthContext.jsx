import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [oauthError, setOauthError] = useState(null);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        setSession(session);
        setUser(session?.user ?? null);
      })
      .catch((e) => console.error('getSession failed:', e))
      .finally(() => setLoading(false));

    // Listen for auth changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') localStorage.removeItem('echo_display_name');
      setSession(session);
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // OAuth is handled via server-side polling in AuthPage.jsx (no deep links needed)

  const signOut = () => supabase.auth.signOut();

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut, oauthError, clearOauthError: () => setOauthError(null) }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
