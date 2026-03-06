import { useTranslation } from '../hooks/useTranslation.js';
import { useProfile } from '../context/ProfileContext';
import { Purchases } from '@revenuecat/purchases-capacitor';
import { Capacitor } from '@capacitor/core';

export default function UpgradeModal({ limit, onClose }) {
  const { t } = useTranslation();
  const { refreshProfile } = useProfile();

  const handleSubscribe = async () => {
    if (!Capacitor.isNativePlatform()) {
      alert(t('pricing_android_only'));
      onClose();
      return;
    }
    try {
      const offerings = await Purchases.getOfferings();
      const pkg = offerings.current?.availablePackages?.[0];
      if (pkg) {
        await Purchases.purchasePackage({ aPackage: pkg });
        await refreshProfile();
      }
    } catch (e) {
      if (!e.userCancelled) console.error('Purchase failed', e);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Sheet */}
      <div className="relative w-full max-w-lg bg-[#0c0e11] border border-white/[0.07] rounded-t-3xl overflow-hidden shadow-2xl">

        {/* Mint glow blob */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-72 h-32 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(ellipse, rgba(44,213,156,0.18) 0%, transparent 70%)', filter: 'blur(12px)' }}
        />

        {/* Close pill */}
        <div className="flex justify-center pt-3 pb-1">
          <button onClick={onClose} className="w-10 h-1 rounded-full bg-white/20 active:bg-white/30 transition-colors" />
        </div>

        {/* Content */}
        <div className="px-6 pt-4 pb-8">

          {/* Pro badge */}
          <div className="flex items-center gap-2 mb-4">
            <span className="inline-flex items-center gap-1.5 bg-mint/15 border border-mint/25 text-mint text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">
              <SparkleIcon />
              {t('pricing_pro_name')}
            </span>
          </div>

          {/* Headline + limit note */}
          <h2 className="text-2xl font-bold text-foreground leading-tight mb-1">
            {t('pricing_headline')}
          </h2>
          {limit != null && (
            <p className="text-sm text-muted-foreground mb-5">
              {t('pricing_limit_note').replace('{limit}', limit)}
            </p>
          )}

          {/* Price */}
          <div className="flex items-end gap-1.5 mb-6">
            <span className="text-5xl font-extrabold text-foreground tracking-tight">$5</span>
            <span className="text-sm text-muted-foreground mb-2">{t('pricing_per_month')}</span>
          </div>

          {/* Divider */}
          <div className="h-px bg-gradient-to-r from-transparent via-mint/20 to-transparent mb-5" />

          {/* Features */}
          <ul className="flex flex-col gap-3 mb-7">
            <Feature label={t('pricing_feat_chats_pro')} />
            <Feature label={t('pricing_feat_tone')} />
            <Feature label={t('pricing_feat_digest_pro')} />
            <Feature label={t('pricing_feat_notes')} />
          </ul>

          {/* CTA */}
          <button
            onClick={handleSubscribe}
            className="w-full h-13 py-3.5 rounded-2xl bg-mint text-background text-base font-bold tracking-wide transition-opacity active:opacity-75 shadow-lg"
            style={{ boxShadow: '0 4px 24px rgba(44,213,156,0.30)' }}
          >
            {t('pricing_upgrade')} — $5/mo
          </button>

          {/* Maybe later */}
          <button
            onClick={onClose}
            className="w-full mt-3 py-2.5 text-sm text-muted-foreground active:opacity-70 transition-opacity"
          >
            {t('pricing_maybe_later')}
          </button>
        </div>
      </div>
    </div>
  );
}

function Feature({ label }) {
  return (
    <li className="flex items-center gap-3 text-sm text-foreground/90">
      <span className="w-5 h-5 rounded-full bg-mint/15 border border-mint/30 flex items-center justify-center shrink-0">
        <CheckIcon />
      </span>
      {label}
    </li>
  );
}

function SparkleIcon() {
  return (
    <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg className="w-3 h-3 text-mint" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
    </svg>
  );
}
