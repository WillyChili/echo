import { useState, useEffect, useRef } from 'react';
import { authFetch } from '../lib/api';
import { useProfile } from '../context/ProfileContext';
import { useTranslation } from '../hooks/useTranslation';

// 8 particles: 4 inner orbit + 4 outer orbit
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

function ParticleBurst({ name, messages }) {
  const [msgIndex, setMsgIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  // Cycle through messages every 875ms
  useEffect(() => {
    const iv = setInterval(() => {
      setMsgIndex((i) => (i + 1) % messages.length);
    }, 875);
    return () => clearInterval(iv);
  }, [messages.length]);

  // Progress bar: trigger CSS transition after 50ms
  useEffect(() => {
    const t = setTimeout(() => setProgress(100), 50);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-neutral-950 px-6">
      {/* Particle orbit container */}
      <div className="relative flex items-center justify-center" style={{ width: 200, height: 200 }}>
        {PARTICLES.map((p, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-mint"
            style={{
              width: p.size,
              height: p.size,
              opacity: p.opacity,
              top: '50%',
              left: '50%',
              marginTop: -(p.size / 2),
              marginLeft: -(p.size / 2),
              '--angle': p.angle,
              '--r': p.r,
              animation: `orbit-particle ${p.duration} linear infinite`,
            }}
          />
        ))}

        {/* Center name */}
        <div className="text-center z-10">
          <span className="text-2xl font-semibold text-foreground">{name}</span>
        </div>
      </div>

      {/* Cycling message */}
      <div className="mt-10 h-6 flex items-center justify-center">
        <p
          key={msgIndex}
          className="text-sm text-muted-foreground text-center"
          style={{ animation: 'fade-message 0.875s ease-in-out forwards' }}
        >
          {messages[msgIndex]}
        </p>
      </div>

      {/* Progress bar */}
      <div className="mt-6 w-48 h-0.5 bg-border rounded-full overflow-hidden">
        <div
          className="h-full bg-mint rounded-full"
          style={{
            width: `${progress}%`,
            transition: 'width 3200ms ease-out',
          }}
        />
      </div>
    </div>
  );
}

// Step dots stepper
function Stepper({ step }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={`rounded-full transition-all duration-300 ${
            i === step
              ? 'w-5 h-1.5 bg-mint'
              : i < step
              ? 'w-1.5 h-1.5 border border-mint'
              : 'w-1.5 h-1.5 bg-border'
          }`}
        />
      ))}
    </div>
  );
}

export default function OnboardingPage() {
  const { setLanguage, refreshProfile } = useProfile();
  const { t } = useTranslation();

  const [step, setStep] = useState(0);
  const [lang, setLang] = useState('en');
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [saving, setSaving] = useState(false);
  const nameRef = useRef(null);

  // Focus name input when step changes to 1
  useEffect(() => {
    if (step === 1) setTimeout(() => nameRef.current?.focus(), 100);
  }, [step]);

  const selectLang = (l) => {
    setLang(l);
    setLanguage(l); // update context so t() reflects choice immediately
    setStep(1);
  };

  const goToBio = () => {
    if (!name.trim()) return;
    setStep(2);
  };

  const finish = async (skipBio = false) => {
    setSaving(true);
    setStep(3);
    const finalBio = skipBio ? '' : bio;
    try {
      await authFetch('/api/profile', {
        method: 'POST',
        body: JSON.stringify({
          display_name: name.trim(),
          language: lang,
          bio: finalBio,
        }),
      });
    } catch (_) {
      // best effort
    }
    // Wait for animation then refresh (gate in App.jsx shows main app once displayName is set)
    setTimeout(async () => {
      await refreshProfile();
    }, 3500);
  };

  // Loading messages with name interpolated
  const loadingMessages = [
    lang === 'es' ? 'Configurando el idioma...' : 'Setting language to English...',
    lang === 'es' ? `Hola ${name}!` : `Hi ${name}!`,
    lang === 'es' ? 'Personalizando tu experiencia...' : 'Personalizing your experience...',
    lang === 'es' ? 'Echo esta listo.' : 'Echo is ready.',
  ];

  // Step 3: particle burst
  if (step === 3) {
    return <ParticleBurst name={name} messages={loadingMessages} />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-950 px-6">
      <div className="w-full max-w-sm">

        {/* Step 0: Language */}
        {step === 0 && (
          <div className="text-center">
            <h1 className="text-xl font-semibold text-foreground mb-2">Choose your language</h1>
            <p className="text-sm text-muted-foreground mb-8">Elegi tu idioma</p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => selectLang('en')}
                className="w-full bg-card border border-border/60 rounded-2xl p-5 text-base font-medium text-foreground active:opacity-70 transition-all hover:border-2 hover:border-mint"
              >
                English
              </button>
              <button
                onClick={() => selectLang('es')}
                className="w-full bg-card border border-border/60 rounded-2xl p-5 text-base font-medium text-foreground active:opacity-70 transition-all hover:border-2 hover:border-mint"
              >
                Español
              </button>
            </div>
            <div className="mt-8"><Stepper step={step} /></div>
          </div>
        )}

        {/* Step 1: Name */}
        {step === 1 && (
          <div className="text-center">
            <h1 className="text-xl font-semibold text-foreground mb-2">{t('onboarding_name_title')}</h1>
            <p className="text-sm text-muted-foreground mb-8">
              {lang === 'es' ? 'Echo te va a llamar por este nombre.' : 'Echo will use this to address you.'}
            </p>
            <input
              ref={nameRef}
              type="text"
              placeholder={t('onboarding_name_placeholder')}
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && goToBio()}
              className="w-full bg-background border border-input rounded-2xl px-4 py-3 text-base text-foreground text-center placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring mb-5"
            />
            <button
              onClick={goToBio}
              disabled={!name.trim()}
              className="w-full bg-foreground text-background rounded-2xl py-3 text-sm font-medium active:opacity-70 transition-opacity disabled:opacity-30"
            >
              {t('onboarding_continue')}
            </button>
            <button
              onClick={() => setStep(0)}
              className="mt-3 text-xs text-muted-foreground active:opacity-70"
            >
              {lang === 'es' ? 'Volver' : 'Back'}
            </button>
            <div className="mt-8"><Stepper step={step} /></div>
          </div>
        )}

        {/* Step 2: Bio */}
        {step === 2 && (
          <div className="text-center">
            <h1 className="text-xl font-semibold text-foreground mb-1">{t('onboarding_bio_title')}</h1>
            <p className="text-sm text-muted-foreground mb-6">{t('onboarding_bio_subtitle')}</p>
            <textarea
              placeholder={t('onboarding_bio_placeholder')}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
              className="w-full bg-background border border-input rounded-2xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none mb-5"
            />
            <button
              onClick={() => finish(false)}
              disabled={saving}
              className="w-full bg-foreground text-background rounded-2xl py-3 text-sm font-medium active:opacity-70 transition-opacity disabled:opacity-30"
            >
              {t('onboarding_continue')}
            </button>
            <button
              onClick={() => finish(true)}
              disabled={saving}
              className="mt-3 block w-full text-xs text-muted-foreground active:opacity-70"
            >
              {t('onboarding_skip')}
            </button>
            <div className="mt-8"><Stepper step={step} /></div>
          </div>
        )}
      </div>
    </div>
  );
}
