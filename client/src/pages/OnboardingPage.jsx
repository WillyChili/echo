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

// Language toggle
function LangToggle({ lang, onChange }) {
  return (
    <div className="flex items-center justify-center gap-1 mb-10">
      {['en', 'es'].map((l) => (
        <button
          key={l}
          onClick={() => onChange(l)}
          className={cn(
            'px-3 py-1 rounded-full text-xs font-semibold transition-colors',
            lang === l ? 'bg-mint text-background' : 'text-muted-foreground hover:text-foreground'
          )}
        >
          {l.toUpperCase()}
        </button>
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
  const [name, setName]           = useState('');
  const [saving, setSaving]       = useState(false);
  const nameRef                   = useRef(null);

  const t = (key) => translations[lang]?.[key] ?? translations.en[key] ?? key;

  const goForward = (n) => { setDirection('right'); setStep(n); };
  const goBack    = (n) => { setDirection('left');  setStep(n); };

  // Auto-focus name input on step 1
  useEffect(() => {
    if (step === 1) setTimeout(() => nameRef.current?.focus(), 120);
  }, [step]);

  const changeLang = (l) => {
    setLang(l);
    setLanguage(l);
  };

  const submitName = () => {
    if (name.trim()) goForward(2);
  };

  const finish = async () => {
    if (saving) return;
    setSaving(true);
    goForward(3);
    try {
      await authFetch('/api/profile', {
        method: 'POST',
        body: JSON.stringify({ display_name: name.trim(), language: lang, echo_tone: 'warm' }),
      });
    } catch (_) { /* best effort */ }
    setTimeout(() => setDisplayName(name.trim()), 3500);
  };

  // Loading messages with name interpolated
  const loadingMessages = [
    t('onboarding_loading_1'),
    t('onboarding_loading_2').replace('{name}', name),
    t('onboarding_loading_3'),
    t('onboarding_loading_4'),
  ];

  // ── Loading screen ──────────────────────────────────────────────────────────
  if (step === 3) return <ParticleBurst />;

  const slideStyle = {
    animation: `${direction === 'right' ? 'slide-in-right' : 'slide-in-left'} 0.28s ease-out both`,
  };

  const btnPrimary = 'w-full bg-foreground text-background rounded-2xl py-3 text-sm font-medium active:opacity-70 transition-opacity disabled:opacity-30';
  const btnBack    = 'mt-3 text-xs text-muted-foreground active:opacity-70 transition-opacity';

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6 overflow-hidden">
      <div className="w-full max-w-sm">

        {/* ── Step 0: Echo intro ───────────────────────────────────────────── */}
        {step === 0 && (
          <div key={0} style={slideStyle} className="text-center">
            <LangToggle lang={lang} onChange={changeLang} />
            <EchoIllustration />
            <h1 className="text-xl font-semibold text-foreground mb-3">
              {t('onboarding_intro_title')}
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed mb-8">
              {t('onboarding_intro_body')}
            </p>
            <button onClick={() => goForward(1)} className={btnPrimary}>
              {t('onboarding_continue')}
            </button>
            <div className="mt-10"><Stepper step={0} /></div>
          </div>
        )}

        {/* ── Step 1: Name ─────────────────────────────────────────────────── */}
        {step === 1 && (
          <div key={1} style={slideStyle} className="text-center">
            <h1 className="text-xl font-semibold text-foreground mb-2">
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
            <button onClick={() => goBack(0)} className={btnBack}>
              {t('onboarding_back')}
            </button>
            <div className="mt-10"><Stepper step={1} /></div>
          </div>
        )}

        {/* ── Step 2: How it works ──────────────────────────────────────────── */}
        {step === 2 && (
          <div key={2} style={slideStyle} className="text-center">
            <NotesIllustration />
            <h1 className="text-xl font-semibold text-foreground mb-3">
              {t('onboarding_notes_title')}
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed mb-8">
              {t('onboarding_notes_body')}
            </p>
            <button onClick={finish} disabled={saving} className={btnPrimary}>
              {t('onboarding_finish')}
            </button>
            <button onClick={() => goBack(1)} className={btnBack}>
              {t('onboarding_back')}
            </button>
            <div className="mt-10"><Stepper step={2} /></div>
          </div>
        )}

      </div>
    </div>
  );
}
