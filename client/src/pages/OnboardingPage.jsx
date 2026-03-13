import { useState, useEffect, useRef } from 'react';
import Lottie from 'lottie-react';
import { cn } from '@/lib/utils';
import { authFetch } from '../lib/api';
import { useProfile } from '../context/ProfileContext';
import translations from '../lib/translations';
import notesAnim from '../animations/notes.json';
import echoAnim  from '../animations/echo.json';

// Particle orbit animation — loading screen
const PARTICLES = [
  { angle: '0deg',    r: '52px', duration: '2.2s', size: 5, opacity: 1.0 },
  { angle: '90deg',   r: '52px', duration: '2.2s', size: 7, opacity: 0.7 },
  { angle: '180deg',  r: '52px', duration: '2.2s', size: 5, opacity: 1.0 },
  { angle: '270deg',  r: '52px', duration: '2.2s', size: 7, opacity: 0.7 },
  { angle: '45deg',   r: '84px', duration: '3.8s', size: 6, opacity: 0.5 },
  { angle: '135deg',  r: '84px', duration: '3.8s', size: 4, opacity: 0.8 },
  { angle: '225deg',  r: '84px', duration: '3.8s', size: 6, opacity: 0.5 },
  { angle: '315deg',  r: '84px', duration: '3.8s', size: 4, opacity: 0.8 },
];

function ParticleBurst() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setProgress(100), 50);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-6">
      <div className="relative flex items-center justify-center" style={{ width: 200, height: 200 }}>
        {PARTICLES.map((p, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-mint"
            style={{
              width: p.size, height: p.size,
              opacity: p.opacity,
              top: '50%', left: '50%',
              marginTop: -(p.size / 2), marginLeft: -(p.size / 2),
              '--angle': p.angle, '--r': p.r,
              animation: `orbit-particle ${p.duration} linear infinite`,
            }}
          />
        ))}
      </div>
      <div className="mt-6 w-48 h-0.5 bg-border rounded-full overflow-hidden">
        <div
          className="h-full bg-mint rounded-full"
          style={{ width: `${progress}%`, transition: 'width 3200ms ease-out' }}
        />
      </div>
    </div>
  );
}

// Step indicator dots
function Stepper({ step, total = 3 }) {
  return (
    <div className="flex items-center justify-center gap-2">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'rounded-full transition-all duration-300',
            i === step  ? 'w-5 h-1.5 bg-mint'
            : i < step  ? 'w-1.5 h-1.5 bg-mint opacity-60'
            :              'w-1.5 h-1.5 bg-border'
          )}
        />
      ))}
    </div>
  );
}

// ─── Illustrations ────────────────────────────────────────────────────────────

function NotesIllustration() {
  return (
    <div className="flex justify-center mb-6">
      <Lottie animationData={notesAnim} loop style={{ width: 240, height: 240 }} />
    </div>
  );
}

function EchoIllustration() {
  return (
    <div className="flex justify-center mb-6">
      <Lottie animationData={echoAnim} loop style={{ width: 240, height: 240 }} />
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const { setLanguage, setDisplayName } = useProfile();

  const [step, setStep]           = useState(0);
  const [direction, setDirection] = useState('right');
  const [lang, setLang]           = useState('en');
  const [selectedLang, setSelectedLang] = useState(null); // tracks which button was tapped
  const [name, setName]           = useState('');
  const [saving, setSaving]       = useState(false);
  const nameRef                   = useRef(null);

  const t = (key) => translations[lang]?.[key] ?? translations.en[key] ?? key;

  const goForward = (n) => { setDirection('right'); setStep(n); };
  const goBack    = (n) => { setDirection('left');  setStep(n); };

  // Auto-focus name input on step 2
  useEffect(() => {
    if (step === 2) setTimeout(() => nameRef.current?.focus(), 120);
  }, [step]);

  // Language selection — update immediately and advance after brief visual feedback
  const chooseLang = (l) => {
    setSelectedLang(l);
    setLang(l);
    setLanguage(l);
    setTimeout(() => goForward(1), 320);
  };

  const submitName = () => {
    if (name.trim()) goForward(3);
  };

  const finish = async () => {
    if (saving) return;
    setSaving(true);
    goForward(4);
    try {
      await authFetch('/api/profile', {
        method: 'POST',
        body: JSON.stringify({ display_name: name.trim(), language: lang, echo_tone: 'warm' }),
      });
    } catch (_) { /* best effort */ }
    setTimeout(() => setDisplayName(name.trim()), 3500);
  };

  // ── Loading screen ──────────────────────────────────────────────────────────
  if (step === 4) return <ParticleBurst />;

  const slideStyle = {
    animation: `${direction === 'right' ? 'slide-in-right' : 'slide-in-left'} 0.28s ease-out both`,
  };

  const btnPrimary = 'w-full bg-foreground text-background rounded-2xl py-3 text-sm font-medium active:opacity-70 transition-opacity disabled:opacity-30';
  const btnBack    = 'mt-3 text-xs text-muted-foreground active:opacity-70 transition-opacity';

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6 overflow-hidden">
      <div className="w-full max-w-sm">

        {/* ── Step 0: Language selection ───────────────────────────────────── */}
        {step === 0 && (
          <div key={0} style={slideStyle} className="text-center">
            {/* Globe icon */}
            <div className="flex justify-center mb-8">
              <div className="w-16 h-16 rounded-full bg-mint/10 border border-mint/20 flex items-center justify-center">
                <svg className="w-8 h-8 text-mint" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418" />
                </svg>
              </div>
            </div>

            {/* Title — bilingual since we don't know language yet */}
            <h1 className="text-2xl font-semibold text-foreground mb-1">Choose your language</h1>
            <p className="text-sm text-muted-foreground mb-10">Elige tu idioma</p>

            {/* Language cards */}
            <div className="flex flex-col gap-3">
              <button
                onClick={() => chooseLang('en')}
                className={cn(
                  'w-full flex items-center gap-4 px-5 py-4 rounded-2xl border transition-all duration-200 active:scale-95',
                  selectedLang === 'en'
                    ? 'border-mint bg-mint/10 text-foreground'
                    : 'border-border/60 bg-card/40 text-foreground hover:border-mint/40'
                )}
              >
                <span className="text-2xl">🇺🇸</span>
                <div className="text-left">
                  <p className="text-base font-semibold">English</p>
                  <p className="text-xs text-muted-foreground">Continue in English</p>
                </div>
                {selectedLang === 'en' && (
                  <div className="ml-auto w-5 h-5 rounded-full bg-mint flex items-center justify-center">
                    <svg className="w-3 h-3 text-background" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                    </svg>
                  </div>
                )}
              </button>

              <button
                onClick={() => chooseLang('es')}
                className={cn(
                  'w-full flex items-center gap-4 px-5 py-4 rounded-2xl border transition-all duration-200 active:scale-95',
                  selectedLang === 'es'
                    ? 'border-mint bg-mint/10 text-foreground'
                    : 'border-border/60 bg-card/40 text-foreground hover:border-mint/40'
                )}
              >
                <span className="text-2xl">🇦🇷</span>
                <div className="text-left">
                  <p className="text-base font-semibold">Español</p>
                  <p className="text-xs text-muted-foreground">Continuar en español</p>
                </div>
                {selectedLang === 'es' && (
                  <div className="ml-auto w-5 h-5 rounded-full bg-mint flex items-center justify-center">
                    <svg className="w-3 h-3 text-background" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                    </svg>
                  </div>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ── Step 1: Echo intro ───────────────────────────────────────────── */}
        {step === 1 && (
          <div key={1} style={slideStyle} className="text-center">
            <EchoIllustration />
            <h1 className="text-2xl font-semibold text-foreground mb-3">
              {t('onboarding_intro_title')}
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed mb-8">
              {t('onboarding_intro_body')}
            </p>
            <button onClick={() => goForward(2)} className={btnPrimary}>
              {t('onboarding_continue')}
            </button>
            <div className="mt-10"><Stepper step={0} /></div>
          </div>
        )}

        {/* ── Step 2: Name ─────────────────────────────────────────────────── */}
        {step === 2 && (
          <div key={2} style={slideStyle} className="text-center">
            <h1 className="text-2xl font-semibold text-foreground mb-2">
              {t('onboarding_name_title')}
            </h1>
            <p className="text-sm text-muted-foreground mb-8">
              {t('onboarding_name_subtitle')}
            </p>
            <input
              ref={nameRef}
              type="text"
              placeholder={t('onboarding_name_placeholder')}
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submitName()}
              className="w-full bg-background border border-input rounded-2xl px-4 py-3 text-base text-foreground text-center placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring mb-5"
            />
            <button onClick={submitName} disabled={!name.trim()} className={btnPrimary}>
              {t('onboarding_continue')}
            </button>
            <button onClick={() => goBack(1)} className={btnBack}>
              {t('onboarding_back')}
            </button>
            <div className="mt-10"><Stepper step={1} /></div>
          </div>
        )}

        {/* ── Step 3: How it works ──────────────────────────────────────────── */}
        {step === 3 && (
          <div key={3} style={slideStyle} className="text-center">
            <NotesIllustration />
            <h1 className="text-2xl font-semibold text-foreground mb-3">
              {t('onboarding_notes_title')}
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed mb-8">
              {t('onboarding_notes_body')}
            </p>
            <button onClick={finish} disabled={saving} className={btnPrimary}>
              {t('onboarding_finish')}
            </button>
            <button onClick={() => goBack(2)} className={btnBack}>
              {t('onboarding_back')}
            </button>
            <div className="mt-10"><Stepper step={2} /></div>
          </div>
        )}

      </div>
    </div>
  );
}
