import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Capacitor } from '@capacitor/core';

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

  // Handle Google OAuth deep link callback on native Android
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const handleOAuthUrl = async (url) => {
      if (!url) return;
      console.log('[Echo] appUrlOpen received:', url);
      localStorage.setItem('echo_oauth_debug', 'STEP1: received url=' + url.substring(0, 120));

      // PKCE flow: URL contains ?code=...
      const queryParams = new URLSearchParams(url.split('?')[1] || '');
      // Implicit flow fallback: URL contains #access_token=...
      const hashParams  = new URLSearchParams(url.split('#')[1] || '');

      const code         = queryParams.get('code');
      const accessToken  = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');
      const urlError     = queryParams.get('error') || hashParams.get('error');

      if (urlError) {
        const desc = queryParams.get('error_description') || hashParams.get('error_description') || urlError;
        setOauthError(`OAuth error: ${desc}`);
        return;
      }

      try {
        if (code) {
          localStorage.setItem('echo_oauth_debug', 'STEP2: exchanging code=' + code.substring(0, 20));
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            localStorage.setItem('echo_oauth_debug', 'STEP3_ERR: ' + error.message);
            setOauthError(`Code exchange failed: ${error.message}`);
            return;
          }
          localStorage.setItem('echo_oauth_debug', 'STEP3_OK: session=' + (data?.session ? 'yes' : 'null'));
        } else if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
          if (error) { setOauthError(`Set session failed: ${error.message}`); return; }
        } else {
          localStorage.setItem('echo_oauth_debug', 'STEP2_ERR: no code, no tokens. url=' + url.substring(0, 80));
          setOauthError(`No auth params in callback URL`);
          return;
        }
        // Close the system browser that was opened for OAuth
        const { Browser } = await import('@capacitor/browser');
        Browser.close().catch(() => {});
      } catch (e) {
        localStorage.setItem('echo_oauth_debug', 'EXCEPTION: ' + e.message);
        setOauthError(`OAuth exception: ${e.message}`);
        console.error('[Echo] OAuth callback error:', e);
      }
    };

    let appUrlListener;

    const setup = async () => {
      const { App: CapApp } = await import('@capacitor/app');

      const isOAuthCallback = (u) =>
        u?.startsWith('com.willychili.echo://') ||
        u?.includes('echo-production-c241.up.railway.app/auth/callback');

      // Handle case where app was launched fresh via deep link
      const { url } = await CapApp.getLaunchUrl();
      if (isOAuthCallback(url)) await handleOAuthUrl(url);

      // Handle case where app was already running and deep link fires
      // (fires for both custom scheme and verified HTTPS App Links)
      appUrlListener = await CapApp.addListener('appUrlOpen', ({ url }) => {
        localStorage.setItem('echo_oauth_debug', 'appUrlOpen fired: ' + (url || 'null').substring(0, 120));
        if (isOAuthCallback(url)) handleOAuthUrl(url);
      });
    };

    setup().catch(console.error);

    return () => { appUrlListener?.remove(); };
  }, []);

  const signOut = () => supabase.auth.signOut();

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut, oauthError, clearOauthError: () => setOauthError(null) }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
