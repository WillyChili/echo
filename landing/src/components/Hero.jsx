import EchoLogo from '../assets/echo-logo.svg';
import DitherCanvas from './DitherCanvas';
import { useLang } from '../context/LangContext';
import { translations } from '../lib/translations';

const PLAY_STORE = 'https://play.google.com/store/apps/details?id=com.willychili.echo';

export default function Hero() {
  const { lang } = useLang();
  const T = translations[lang].hero;
  const scrollTo = id => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">

      {/* Dither shader background */}
      <div className="absolute inset-0 opacity-50">
        <DitherCanvas pixelSize={2} />
      </div>

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b
        from-[#070707]/85 via-black/40 to-[#070707]/90" />

      {/* Dot grid */}
      <div className="absolute inset-0 dot-grid opacity-[0.22]" />

      {/* Glow orbs */}
      <div className="glow-orb glow-pulse w-[600px] h-[300px] bg-[#2CD59C]/10 top-[30%] left-1/2 -translate-x-1/2 -translate-y-1/2" />
      <div className="glow-orb w-[300px] h-[300px] bg-[#2CD59C]/05 top-[20%] right-[15%]"
           style={{ animationDelay: '1.5s', animation: 'glow-pulse 6s 1.5s ease-in-out infinite' }} />

      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center pt-28 pb-20">

        {/* Badge */}
        <div className="fade-up inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full
          bg-white/[0.07] border border-white/[0.15] text-white/75
          text-sm font-medium tracking-wide mb-8 backdrop-blur-sm">
          <span className="dot-pulse w-2 h-2 rounded-full bg-[#2CD59C]" />
          {T.badge}
          <span className="px-2 py-0.5 rounded-full bg-[#2CD59C]/15 border border-[#2CD59C]/30 text-[#2CD59C] text-[11px] font-semibold tracking-wider leading-none">
            {T.beta}
          </span>
        </div>

        {/* Headline */}
        <h1 className="fade-up-1 font-display font-bold leading-[1.02] tracking-[-0.03em] mb-6"
            style={{ fontSize: 'clamp(2.8rem, 8vw, 5.5rem)' }}>
          <span className="text-white">{T.h1a}</span>
          <br />
          <span className="text-gradient">{T.h1b}</span>
        </h1>

        {/* Subtitle */}
        <p className="fade-up-2 text-lg md:text-xl text-white/80 max-w-[38rem] mx-auto mb-10 leading-[1.7]">
          {T.subtitle}
        </p>

        {/* CTAs */}
        <div className="fade-up-3 flex flex-col sm:flex-row items-center justify-center gap-3 mb-16">

          {/* Primary — Play Store */}
          <a
            href={PLAY_STORE}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-xl
              bg-[#2CD59C] text-[#070707] font-bold text-sm
              hover:bg-[#25c48e] transition-colors duration-200"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3.18 23.76c.33.18.7.24 1.06.2l12.76-11.4-2.76-2.76L3.18 23.76zm17.6-13.37L17.9 8.74l-3.06 3.06 3.06 3.06 2.9-1.66a1.65 1.65 0 000-2.81zM1.16 1.26a1.64 1.64 0 00-.16.72v19.04c0 .26.06.51.16.72l.1.1L13.1 9.9v-.3L1.26 1.16l-.1.1zm7.42 8.88L5.22 6.78l-.12.12 12.76 11.4.12-.12-9.4-8.04z"/>
            </svg>
            {T.cta_primary}
          </a>

          {/* Secondary */}
          <button
            onClick={() => scrollTo('product')}
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl
              border border-white/25 text-white/85
              hover:text-white hover:border-white/45 hover:bg-white/[0.05]
              transition-all text-sm font-medium backdrop-blur-sm"
          >
            {T.cta_secondary}
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
            </svg>
          </button>
        </div>

      </div>

    </section>
  );
}
