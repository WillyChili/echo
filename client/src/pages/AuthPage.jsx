import { useState } from 'react';
import { supabase } from '../lib/supabase';
import translations from '../lib/translations';

// AuthPage renders outside ProfileProvider, so we use translations directly (always English)
const t = (key) => translations.en[key] ?? key;

// Waveform bar pattern: height (px) + animation delay (s)
const BARS = [
  { h: 10, d: 0.00 }, { h: 20, d: 0.07 }, { h: 34, d: 0.14 },
  { h: 26, d: 0.21 }, { h: 16, d: 0.28 }, { h: 30, d: 0.35 },
  { h: 44, d: 0.42 }, { h: 36, d: 0.49 }, { h: 22, d: 0.56 },
  { h: 38, d: 0.63 }, { h: 48, d: 0.70 }, { h: 36, d: 0.77 },
  { h: 48, d: 0.84 }, { h: 38, d: 0.91 }, { h: 22, d: 0.98 },
  { h: 36, d: 1.05 }, { h: 44, d: 1.12 }, { h: 30, d: 1.19 },
  { h: 16, d: 1.26 }, { h: 26, d: 1.33 }, { h: 34, d: 1.40 },
  { h: 20, d: 1.47 }, { h: 10, d: 1.54 },
];

function GoogleIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}

export default function AuthPage() {
  const [mode, setMode]         = useState('login');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState(null);
  const [message, setMessage]   = useState(null);
  const [loading, setLoading]   = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);
    try {
      if (mode === 'register') {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMessage(t('auth_confirm_email'));
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin },
      });
      if (error) throw error;
    } catch (err) {
      setError(err.message);
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-950 px-4">
      <div className="w-full max-w-sm">

        {/* ── Branding ── */}
        <div className="text-center mb-8">
          {/* Animated waveform */}
          <div className="flex items-center justify-center gap-[3px] mb-5" style={{ height: '48px' }}>
            {BARS.map((bar, i) => (
              <div
                key={i}
                className="w-[3px] rounded-full bg-mint"
                style={{
                  height: `${bar.h}px`,
                  transformOrigin: 'center',
                  animation: `wave-bar 1.6s ease-in-out ${bar.d}s infinite`,
                }}
              />
            ))}
          </div>
          <h1 className="text-2xl font-semibold text-foreground tracking-tight">echo</h1>
          <p className="text-sm text-muted-foreground mt-1">{t('auth_tagline')}</p>
        </div>

        {/* ── Card ── */}
        <div className="bg-card border border-border/60 rounded-2xl p-6">
          <h2 className="text-base font-medium text-foreground mb-5">
            {mode === 'login' ? t('auth_sign_in') : t('auth_create_account')}
          </h2>

          {/* Email / password */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <input
              type="email"
              placeholder={t('auth_email')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-background border border-input rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <input
              type="password"
              placeholder={t('auth_password')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full bg-background border border-input rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />

            {error   && <p className="text-xs text-red-400">{error}</p>}
            {message && <p className="text-xs text-green-400">{message}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-foreground text-background rounded-xl py-2.5 text-sm font-medium active:opacity-70 transition-opacity disabled:opacity-50 mt-1"
            >
              {loading ? t('auth_loading') : mode === 'login' ? t('auth_sign_in') : t('auth_create_account')}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-border/50" />
            <span className="text-xs text-muted-foreground">{t('auth_or')}</span>
            <div className="flex-1 h-px bg-border/50" />
          </div>

          {/* Google */}
          <button
            onClick={handleGoogle}
            disabled={googleLoading}
            className="w-full flex items-center justify-center gap-2.5 bg-background border border-input rounded-xl py-2.5 text-sm text-foreground font-medium active:opacity-70 transition-opacity disabled:opacity-50"
          >
            <GoogleIcon />
            {googleLoading ? t('auth_redirecting') : t('auth_continue_google')}
          </button>

          <p className="text-xs text-muted-foreground text-center mt-4">
            {mode === 'login' ? t('auth_no_account') : t('auth_have_account')}{' '}
            <button
              onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(null); setMessage(null); }}
              className="text-foreground underline"
            >
              {mode === 'login' ? t('auth_sign_up') : t('auth_sign_in')}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
