import { useTranslation } from '../hooks/useTranslation';

const PLANS = [
  {
    key: 'free',
    en: { name: 'Free', price: '$0 / mo', features: ['100 notes / month', '50 Echo messages / month', 'Basic AI responses'] },
    es: { name: 'Gratis', price: '$0 / mes', features: ['100 notas / mes', '50 mensajes con Echo / mes', 'Respuestas básicas de IA'] },
  },
  {
    key: 'pro',
    en: { name: 'Pro', price: '$8 / mo', features: ['Unlimited notes', 'Unlimited Echo messages', 'Priority AI responses', 'Voice input'] },
    es: { name: 'Pro', price: '$8 / mes', features: ['Notas ilimitadas', 'Mensajes ilimitados con Echo', 'Respuestas de IA prioritarias', 'Entrada por voz'] },
    highlight: true,
  },
];

export default function SubscriptionPage() {
  const { t, language } = useTranslation();
  const lang = language === 'es' ? 'es' : 'en';

  const title       = lang === 'es' ? 'Suscripción' : 'Subscription';
  const subtitle    = lang === 'es' ? 'Elige el plan que mejor se adapte a ti.' : 'Choose the plan that works best for you.';
  const currentPlan = lang === 'es' ? 'Plan actual' : 'Current plan';
  const upgrade     = lang === 'es' ? 'Mejorar a Pro' : 'Upgrade to Pro';
  const comingSoon  = lang === 'es' ? 'Próximamente' : 'Coming soon';

  return (
    <div className="max-w-xl mx-auto px-4 py-10">
      <h1 className="text-lg font-semibold text-foreground mb-1">{title}</h1>
      <p className="text-sm text-muted-foreground mb-8">{subtitle}</p>

      <div className="flex flex-col gap-4">
        {PLANS.map((plan) => {
          const info = plan[lang];
          return (
            <div
              key={plan.key}
              className={`bg-card border rounded-2xl p-5 ${plan.highlight ? 'border-foreground/40' : 'border-border/60'}`}
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <span className="text-sm font-semibold text-foreground">{info.name}</span>
                  {plan.highlight && (
                    <span className="ml-2 text-xs bg-foreground text-background px-2 py-0.5 rounded-full font-medium">
                      {comingSoon}
                    </span>
                  )}
                </div>
                <span className="text-sm font-medium text-muted-foreground">{info.price}</span>
              </div>

              <ul className="flex flex-col gap-1.5 mb-4">
                {info.features.map((f) => (
                  <li key={f} className="text-xs text-muted-foreground flex items-center gap-2">
                    <CheckIcon />
                    {f}
                  </li>
                ))}
              </ul>

              {!plan.highlight ? (
                <div className="text-xs text-muted-foreground font-medium">{currentPlan}</div>
              ) : (
                <button
                  disabled
                  className="w-full bg-foreground text-background rounded-xl py-2.5 text-sm font-medium opacity-40 cursor-not-allowed"
                >
                  {upgrade}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
    </svg>
  );
}
