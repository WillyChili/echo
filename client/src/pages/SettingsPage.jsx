import { useState, useEffect } from 'react';
import { authFetch } from '../lib/api';
import { useProfile } from '../context/ProfileContext';
import { useTranslation } from '../hooks/useTranslation';
import UpgradeModal from '../components/UpgradeModal';
import { Capacitor } from '@capacitor/core';

export default function SettingsPage() {
  const { t } = useTranslation();
  const { echoTone: profileEchoTone, setEchoTone: setProfileEchoTone, isSubscribed } = useProfile();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

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
      .catch(() => {});
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
      <div className="bg-card border border-border/60 rounded-2xl p-5 mb-4">
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
      <div className="bg-card border border-border/60 rounded-2xl p-5 mb-4">
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
    </div>

    {showUpgradeModal && <UpgradeModal onClose={() => setShowUpgradeModal(false)} />}
    </>
  );
}
