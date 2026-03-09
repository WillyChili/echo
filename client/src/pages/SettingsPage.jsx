import { useState, useEffect } from 'react';
import { authFetch } from '../lib/api';
import { supabase } from '../lib/supabase';
import { useProfile } from '../context/ProfileContext';
import { useTranslation } from '../hooks/useTranslation';
import UpgradeModal from '../components/UpgradeModal';
import { Capacitor } from '@capacitor/core';

export default function SettingsPage() {
  const { t } = useTranslation();
  const { echoTone: profileEchoTone, setEchoTone: setProfileEchoTone, isSubscribed } = useProfile();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal]   = useState(false);
  const [deleting, setDeleting]                 = useState(false);
  const [deleteError, setDeleteError]           = useState(null);
  const [exporting, setExporting]               = useState(false);

  const [echoTone,      setEchoTone]      = useState('warm');
  const [toneSaved,     setToneSaved]     = useState(false);
  const [toneLoading,   setToneLoading]   = useState(false);

  const [digestFreq,         setDigestFreq]         = useState(7);
  const [digestWindow,       setDigestWindow]       = useState(7);
  const [digestEmailEnabled, setDigestEmailEnabled] = useState(false);
  const [digestSaved,        setDigestSaved]        = useState(false);
  const [digestLoading,      setDigestLoading]      = useState(false);

  // Seed echoTone from ProfileContext immediately
  useEffect(() => {
    if (profileEchoTone) setEchoTone(profileEchoTone);
  }, [profileEchoTone]);

  useEffect(() => {
    authFetch('/api/profile')
      .then((r) => r.json())
      .then((d) => {
        if (d.echo_tone)                     setEchoTone(d.echo_tone);
        if (d.digest_frequency_days != null) setDigestFreq(d.digest_frequency_days);
        if (d.digest_window_days    != null) setDigestWindow(d.digest_window_days);
        if (d.digest_email_enabled  != null) setDigestEmailEnabled(d.digest_email_enabled);
      })
      .catch((e) => console.error('Failed to load settings:', e));
  }, []);

  const handleToneSelect = async (tone) => {
    if (!isSubscribed) { setShowUpgradeModal(true); return; }
    if (toneLoading || tone === echoTone) return;
    setEchoTone(tone);
    setToneLoading(true);
    setToneSaved(false);
    try {
      await authFetch('/api/profile', {
        method: 'POST',
        body: JSON.stringify({ echo_tone: tone }),
      });
      setProfileEchoTone(tone);
      setToneSaved(true);
      setTimeout(() => setToneSaved(false), 2000);
    } catch { /* silent */ } finally {
      setToneLoading(false);
    }
  };

  const handleDigestSave = async (e) => {
    e.preventDefault();
    if (!isSubscribed) { setShowUpgradeModal(true); return; }
    const freq   = Math.max(1, Math.min(365, Number(digestFreq)   || 7));
    const window = Math.max(1, Math.min(365, Number(digestWindow) || 7));
    setDigestLoading(true);
    setDigestSaved(false);
    try {
      await authFetch('/api/profile', {
        method: 'POST',
        body: JSON.stringify({ digest_frequency_days: freq, digest_window_days: window, digest_email_enabled: digestEmailEnabled }),
      });
      setDigestFreq(freq);
      setDigestWindow(window);
      setDigestSaved(true);
      setTimeout(() => setDigestSaved(false), 2500);
    } catch { /* silent */ } finally {
      setDigestLoading(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const [profileRes, notesRes] = await Promise.all([
        authFetch('/api/profile'),
        authFetch('/api/notes'),
      ]);
      const profile = await profileRes.json();
      const notes   = await notesRes.json();

      const payload = {
        exported_at: new Date().toISOString(),
        profile: {
          display_name: profile.display_name,
          bio:          profile.bio,
          language:     profile.language,
          echo_tone:    profile.echo_tone,
        },
        notes,
      };

      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `echo-export-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch { /* silent */ } finally {
      setExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    setDeleteError(null);
    try {
      const res = await authFetch('/api/account', { method: 'DELETE' });
      if (!res.ok) throw new Error('failed');
      await supabase.auth.signOut();
    } catch {
      setDeleteError(t('settings_delete_error'));
      setDeleting(false);
    }
  };

  const TONES = [
    { key: 'warm',    labelKey: 'onboarding_tone_warm',    descKey: 'onboarding_tone_warm_desc' },
    { key: 'direct',  labelKey: 'onboarding_tone_direct',  descKey: 'onboarding_tone_direct_desc' },
    { key: 'curious', labelKey: 'onboarding_tone_curious', descKey: 'onboarding_tone_curious_desc' },
  ];

  return (
    <>
    <div className="max-w-xl mx-auto px-4 py-10">
      <h1 className="text-lg font-semibold text-foreground mb-1">{t('settings_title')}</h1>
      <p className="text-sm text-muted-foreground mb-8">{t('settings_subtitle')}</p>

      {/* Subscription plan */}
      <div className={`bg-card rounded-2xl p-6 mb-4 ${isSubscribed ? 'border-2 border-mint/40' : 'border border-border/60'}`}>
        <h2 className="text-sm font-medium text-foreground mb-1">{t('settings_plan_title')}</h2>
        <p className="text-xs text-muted-foreground mb-4">{t('settings_plan_desc')}</p>
        <div className="flex items-center justify-between">
          {/* Badge */}
          <div className="flex items-center gap-1.5">
            {isSubscribed ? (
              <>
                <span className="text-xs font-semibold uppercase tracking-widest text-mint">{t('pricing_pro_name')}</span>
                <span className="text-xs text-mint">✓</span>
              </>
            ) : (
              <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{t('pricing_free_name')}</span>
            )}
          </div>
          {/* Action */}
          {isSubscribed ? (
            <button
              onClick={() => {
                const url = Capacitor.isNativePlatform()
                  ? 'market://subscriptions?package=com.willychili.echo'
                  : 'https://play.google.com/store/account/subscriptions';
                window.open(url, '_system');
              }}
              className="text-xs text-muted-foreground underline active:opacity-70 transition-opacity"
            >
              {t('settings_plan_manage')}
            </button>
          ) : (
            <button
              onClick={() => setShowUpgradeModal(true)}
              className="text-xs font-semibold text-mint active:opacity-70 transition-opacity"
            >
              {t('nav_subscribe')}
            </button>
          )}
        </div>
      </div>

      {/* Echo personality */}
      <div className="bg-card border border-border/60 rounded-2xl p-6 mb-4">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-sm font-medium text-foreground">{t('settings_echo_tone_title')}</h2>
          {toneSaved && <span className="text-xs text-mint">{t('settings_echo_tone_saved')}</span>}
        </div>
        <p className="text-xs text-muted-foreground mb-4">{t(`onboarding_tone_${echoTone}_desc`)}</p>
        <div className="flex gap-2">
          {TONES.map((opt) => (
            <button
              key={opt.key}
              type="button"
              onClick={() => handleToneSelect(opt.key)}
              disabled={toneLoading}
              className={`flex-1 py-2 rounded-xl text-xs font-medium transition-colors select-none disabled:opacity-50 ${
                isSubscribed && echoTone === opt.key
                  ? 'border border-mint bg-mint/15 text-mint'
                  : 'bg-secondary text-muted-foreground active:opacity-70'
              }`}
            >
              {t(opt.labelKey)}
            </button>
          ))}
        </div>
      </div>

      {/* Digest settings */}
      <div className="bg-card border border-border/60 rounded-2xl p-6">
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
              readOnly={!isSubscribed}
              onClick={!isSubscribed ? () => setShowUpgradeModal(true) : undefined}
              onChange={(e) => { setDigestSaved(false); setDigestFreq(e.target.value); }}
              className="w-16 bg-background border border-input rounded-xl px-3 py-2 text-sm text-foreground text-center focus:outline-none focus:ring-2 focus:ring-ring"
              style={!isSubscribed ? { cursor: 'pointer' } : undefined}
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
              readOnly={!isSubscribed}
              onClick={!isSubscribed ? () => setShowUpgradeModal(true) : undefined}
              onChange={(e) => { setDigestSaved(false); setDigestWindow(e.target.value); }}
              className="w-16 bg-background border border-input rounded-xl px-3 py-2 text-sm text-foreground text-center focus:outline-none focus:ring-2 focus:ring-ring"
              style={!isSubscribed ? { cursor: 'pointer' } : undefined}
            />
            <span className="text-sm text-muted-foreground">{t('settings_digest_window_unit')}</span>
          </div>

          {/* Email toggle */}
          <div
            className="flex items-center justify-between cursor-pointer select-none"
            onClick={() => { if (isSubscribed) setDigestEmailEnabled((v) => !v); else setShowUpgradeModal(true); }}
          >
            <div>
              <p className="text-sm text-foreground">{t('settings_digest_email_label')}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{t('settings_digest_email_desc')}</p>
            </div>
            <div className={`ml-4 shrink-0 w-10 h-6 rounded-full flex items-center px-0.5 transition-colors ${isSubscribed && digestEmailEnabled ? 'bg-mint' : 'bg-border/50'} ${!isSubscribed ? 'opacity-40' : ''}`}>
              <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${isSubscribed && digestEmailEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
            </div>
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
      {/* Export data */}
      <div className="bg-card border border-border/60 rounded-2xl p-6 mt-4">
        <h2 className="text-sm font-medium text-foreground mb-1">{t('settings_export_title')}</h2>
        <p className="text-xs text-muted-foreground mb-4">{t('settings_export_desc')}</p>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="text-sm font-medium text-mint active:opacity-70 transition-opacity disabled:opacity-50"
        >
          {exporting ? t('settings_export_loading') : t('settings_export_btn')}
        </button>
      </div>

      {/* Delete account */}
      <div className="bg-card border border-border/60 rounded-2xl p-6 mt-4">
        <h2 className="text-sm font-medium text-foreground mb-1">{t('settings_delete_title')}</h2>
        <p className="text-xs text-muted-foreground mb-4">{t('settings_delete_desc')}</p>
        <button
          onClick={() => setShowDeleteModal(true)}
          className="text-sm font-medium text-red-400 active:opacity-70 transition-opacity"
        >
          {t('settings_delete_btn')}
        </button>
      </div>
    </div>

    {showUpgradeModal && <UpgradeModal onClose={() => setShowUpgradeModal(false)} />}

    {showDeleteModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !deleting && setShowDeleteModal(false)} />
        <div className="relative w-full max-w-sm bg-card border border-border rounded-2xl p-6 flex flex-col gap-4 shadow-xl">
          <h2 className="text-base font-semibold text-foreground">{t('settings_delete_modal_title')}</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">{t('settings_delete_modal_desc')}</p>
          {deleteError && <p className="text-xs text-red-400">{deleteError}</p>}
          <div className="flex flex-col gap-2 mt-1">
            <button
              onClick={handleDeleteAccount}
              disabled={deleting}
              className="w-full py-2.5 rounded-xl bg-red-500/15 border border-red-500/30 text-sm font-medium text-red-400 active:opacity-70 transition-opacity disabled:opacity-50"
            >
              {deleting ? '…' : t('settings_delete_modal_confirm')}
            </button>
            <button
              onClick={() => { setShowDeleteModal(false); setDeleteError(null); }}
              disabled={deleting}
              className="w-full py-2.5 rounded-xl bg-secondary text-sm font-medium text-foreground active:opacity-70 transition-opacity disabled:opacity-50"
            >
              {t('settings_delete_modal_cancel')}
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
