import { cn } from '@/lib/utils';
import { useTranslation } from '../hooks/useTranslation.js';

export default function UpgradeModal({ limit, onClose }) {
  const { t } = useTranslation();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Card */}
      <div className="relative w-full max-w-md bg-card border border-border rounded-2xl p-6 flex flex-col gap-5 shadow-xl">

        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col gap-0.5">
            <h2 className="text-base font-semibold text-foreground">
              {t('pricing_title')}
            </h2>
            {limit != null && (
              <p className="text-xs text-muted-foreground">
                {t('pricing_limit_note').replace('{limit}', limit)}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="shrink-0 p-1 -mr-1 -mt-1 text-muted-foreground active:opacity-70 transition-opacity"
          >
            <XIcon />
          </button>
        </div>

        {/* Plans */}
        <div className="grid grid-cols-2 gap-3">

          {/* Free */}
          <div className="rounded-xl border border-border/50 bg-secondary/20 p-4 flex flex-col gap-4">
            <div>
              <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                {t('pricing_free_name')}
              </span>
              <p className="text-xl font-bold text-foreground mt-1.5">
                {t('pricing_free_price')}
              </p>
            </div>
            <ul className="flex flex-col gap-2.5 flex-1">
              <Feature label={t('pricing_feat_chats_free')} />
              <Feature label={t('pricing_feat_notes')} />
              <Feature label={t('pricing_feat_digest_free')} />
            </ul>
            <button
              disabled
              className="w-full h-9 rounded-lg bg-secondary/60 text-muted-foreground text-xs font-medium cursor-default"
            >
              {t('pricing_current_plan')}
            </button>
          </div>

          {/* Pro */}
          <div className="rounded-xl border border-mint/40 bg-mint/[0.06] p-4 flex flex-col gap-4">
            <div>
              <span className="text-xs font-semibold uppercase tracking-widest text-mint">
                {t('pricing_pro_name')}
              </span>
              <p className="text-xl font-bold text-foreground mt-1.5">
                $5
                <span className="text-xs font-normal text-muted-foreground"> /mo</span>
              </p>
            </div>
            <ul className="flex flex-col gap-2.5 flex-1">
              <Feature label={t('pricing_feat_chats_pro')} mint bold />
              <Feature label={t('pricing_feat_notes')} mint />
              <Feature label={t('pricing_feat_tone')} mint bold />
              <Feature label={t('pricing_feat_digest_pro')} mint bold />
            </ul>
            <button
              className="w-full h-9 rounded-lg bg-mint text-background text-xs font-semibold transition-opacity active:opacity-70"
              onClick={() => {
                // Stripe integration goes here
                onClose();
              }}
            >
              {t('pricing_upgrade')}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

function Feature({ label, mint, bold }) {
  return (
    <li className={cn(
      'flex items-start gap-2 text-xs leading-snug',
      bold ? 'text-foreground font-medium' : 'text-muted-foreground'
    )}>
      <CheckIcon mint={mint} />
      {label}
    </li>
  );
}

function XIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
    </svg>
  );
}

function CheckIcon({ mint }) {
  return (
    <svg
      className={cn('w-3.5 h-3.5 shrink-0 mt-[1px]', mint ? 'text-mint' : 'text-muted-foreground/50')}
      fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
    </svg>
  );
}
