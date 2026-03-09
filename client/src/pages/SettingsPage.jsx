import { useState, useEffect } from 'react';
import { authFetch } from '../lib/api';
import { useTranslation } from '../hooks/useTranslation';

export default function SettingsPage() {
  const { t } = useTranslation();
  const [apiKey, setApiKey]   = useState('');
  const [saved, setSaved]     = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError]     = useState(null);

  // Load existing key on mount (masked)
  useEffect(() => {
    authFetch('/api/settings')
      .then((r) => r.json())
      .then((d) => { if (d.hasApiKey) setApiKey('••••••••••••••••••••'); })
      .catch((e) => console.error('Failed to load settings:', e))
      .finally(() => setFetching(false));
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!apiKey || apiKey.startsWith('•')) return;
    setLoading(true);
    setError(null);
    setSaved(false);

    try {
      const res = await authFetch('/api/settings', {
        method: 'POST',
        body: JSON.stringify({ apiKey }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save.');
      setSaved(true);
      setApiKey('••••••••••••••••••••');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = async () => {
    setLoading(true);
    setError(null);
    try {
      await authFetch('/api/settings', { method: 'DELETE' });
      setApiKey('');
      setSaved(false);
    } catch {
      setError(t('settings_failed_remove'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-10">
      <h1 className="text-lg font-semibold text-foreground mb-1">{t('settings_title')}</h1>
      <p className="text-sm text-muted-foreground mb-8">{t('settings_subtitle')}</p>

      {/* BYOK */}
      <div className="bg-card border border-border/60 rounded-2xl p-5">
        <h2 className="text-sm font-medium text-foreground mb-1">{t('settings_api_key_title')}</h2>
        <p className="text-xs text-muted-foreground mb-4">
          {t('settings_api_key_desc')}
        </p>

        {fetching ? (
          <p className="text-xs text-muted-foreground">{t('settings_loading')}</p>
        ) : (
          <form onSubmit={handleSave} className="flex flex-col gap-3">
            <input
              type="text"
              placeholder={t('settings_placeholder')}
              value={apiKey}
              onFocus={() => { if (apiKey.startsWith('•')) setApiKey(''); }}
              onChange={(e) => { setSaved(false); setApiKey(e.target.value); }}
              className="w-full bg-background border border-input rounded-2xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring font-mono"
            />

            {error && <p className="text-xs text-red-400">{error}</p>}
            {saved && <p className="text-xs text-green-400">{t('settings_saved')}</p>}

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={loading || !apiKey || apiKey.startsWith('•')}
                className="flex-1 bg-foreground text-background rounded-2xl py-2.5 text-sm font-medium active:opacity-70 transition-opacity disabled:opacity-40"
              >
                {loading ? t('settings_saving') : t('settings_save_key')}
              </button>
              <button
                type="button"
                onClick={handleClear}
                disabled={loading}
                className="px-4 bg-destructive/20 text-red-400 border border-destructive/40 rounded-2xl text-sm active:bg-destructive/30 transition-colors disabled:opacity-40"
              >
                {t('settings_remove')}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
