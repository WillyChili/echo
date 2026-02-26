import { useState, useEffect } from 'react';
import { authFetch } from '../lib/api';
import { useTranslation } from '../hooks/useTranslation';

export default function SettingsPage() {
  const { t } = useTranslation();

  const [digestFreq,    setDigestFreq]    = useState(7);
  const [digestWindow,  setDigestWindow]  = useState(7);
  const [digestSaved,   setDigestSaved]   = useState(false);
  const [digestLoading, setDigestLoading] = useState(false);

  useEffect(() => {
    authFetch('/api/profile')
      .then((r) => r.json())
      .then((d) => {
        if (d.digest_frequency_days != null) setDigestFreq(d.digest_frequency_days);
        if (d.digest_window_days    != null) setDigestWindow(d.digest_window_days);
      })
      .catch(() => {});
  }, []);

  const handleDigestSave = async (e) => {
    e.preventDefault();
    const freq   = Math.max(1, Math.min(365, Number(digestFreq)   || 7));
    const window = Math.max(1, Math.min(365, Number(digestWindow) || 7));
    setDigestLoading(true);
    setDigestSaved(false);
    try {
      await authFetch('/api/profile', {
        method: 'POST',
        body: JSON.stringify({ digest_frequency_days: freq, digest_window_days: window }),
      });
      setDigestFreq(freq);
      setDigestWindow(window);
      setDigestSaved(true);
      setTimeout(() => setDigestSaved(false), 2500);
    } catch { /* silent */ } finally {
      setDigestLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-10">
      <h1 className="text-lg font-semibold text-foreground mb-1">{t('settings_title')}</h1>
      <p className="text-sm text-muted-foreground mb-8">{t('settings_subtitle')}</p>

      {/* Digest settings */}
      <div className="bg-card border border-border/60 rounded-2xl p-5">
        <h2 className="text-sm font-medium text-foreground mb-1">{t('settings_digest_title')}</h2>
        <p className="text-xs text-muted-foreground mb-4">{t('settings_digest_desc')}</p>

        <form onSubmit={handleDigestSave} className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <span className="text-sm text-foreground shrink-0">{t('settings_digest_frequency_label')}</span>
            <input
              type="number"
              min="1"
              max="365"
              value={digestFreq}
              onChange={(e) => { setDigestSaved(false); setDigestFreq(e.target.value); }}
              className="w-16 bg-background border border-input rounded-xl px-3 py-2 text-sm text-foreground text-center focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <span className="text-sm text-muted-foreground">{t('settings_digest_frequency_unit')}</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm text-foreground shrink-0">{t('settings_digest_window_label')}</span>
            <input
              type="number"
              min="1"
              max="365"
              value={digestWindow}
              onChange={(e) => { setDigestSaved(false); setDigestWindow(e.target.value); }}
              className="w-16 bg-background border border-input rounded-xl px-3 py-2 text-sm text-foreground text-center focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <span className="text-sm text-muted-foreground">{t('settings_digest_window_unit')}</span>
          </div>

          {digestSaved && <p className="text-xs text-green-400">{t('settings_digest_saved')}</p>}

          <button
            type="submit"
            disabled={digestLoading}
            className="self-start bg-foreground text-background rounded-xl px-5 py-2.5 text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-40"
          >
            {digestLoading ? t('settings_saving') : t('settings_digest_save')}
          </button>
        </form>
      </div>
    </div>
  );
}
