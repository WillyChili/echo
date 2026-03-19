import { useState, useEffect } from 'react';
import EchoIcon from './EchoIcon';
import { useLang } from '../context/LangContext';
import { translations } from '../lib/translations';

const scrollTo = (id) =>
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });

export default function Navbar() {
  const { lang, setLang }    = useLang();
  const T                    = translations[lang].nav;
  const [scrolled, setScrolled]           = useState(false);
  const [open, setOpen]                   = useState(false);
  const [activeSection, setActiveSection] = useState('');

  const NAV_LINKS = [
    { label: T.solution, href: 'solution' },
    { label: T.product,  href: 'product'  },
    { label: T.features, href: 'features' },
    { label: T.contact,  href: 'contact'  },
  ];

  /* ── Scroll detection ───────────────────────────────── */
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  /* ── Active section via IntersectionObserver ────────── */
  useEffect(() => {
    const ids = ['solution', 'product', 'features', 'contact'];
    const observers = ids.map(id => {
      const el = document.getElementById(id);
      if (!el) return null;
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActiveSection(id); },
        { rootMargin: '-35% 0px -55% 0px' }
      );
      obs.observe(el);
      return obs;
    });
    return () => observers.forEach(obs => obs?.disconnect());
  }, []);

  /* ── Close mobile menu on resize to desktop ─────────── */
  useEffect(() => {
    const fn = () => { if (window.innerWidth >= 768) setOpen(false); };
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);

  /* ── Language toggle ─────────────────────────────────── */
  const LangToggle = ({ mobile = false }) => (
    <button
      onClick={() => setLang(lang === 'en' ? 'es' : 'en')}
      aria-label="Toggle language"
      className={`flex items-center gap-1 text-xs font-semibold tracking-wide rounded-md px-2 py-1 transition-all
        ${mobile ? 'border border-white/[0.08] bg-white/[0.04]' : 'hover:bg-white/[0.06]'}`}
    >
      <span style={{ color: lang === 'en' ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.30)' }}>EN</span>
      <span className="text-white/20">·</span>
      <span style={{ color: lang === 'es' ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.30)' }}>ES</span>
    </button>
  );

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled
        ? 'bg-[#070707]/85 backdrop-blur-xl border-b border-white/[0.06]'
        : 'bg-transparent'
    }`}>
      <div className="max-w-5xl mx-auto px-6 h-[60px] flex items-center justify-between">

        {/* Logo */}
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="flex items-center gap-2.5 group"
        >
          <EchoIcon size={26} className="group-hover:drop-shadow-[0_0_8px_rgba(44,213,156,0.55)] transition-all duration-300" />
          <span className="font-semibold text-white text-[15px] tracking-[-0.01em]">Echo</span>
        </button>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-6">
          {NAV_LINKS.map(l => {
            const isActive = activeSection === l.href;
            return (
              <button
                key={l.href}
                onClick={() => scrollTo(l.href)}
                className="relative text-sm transition-colors duration-200 pb-0.5"
                style={{ color: isActive ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.50)' }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.color = 'rgba(255,255,255,0.85)'; }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.color = 'rgba(255,255,255,0.50)'; }}
              >
                {l.label}
                <span
                  className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#2CD59C] transition-all duration-300"
                  style={{ opacity: isActive ? 1 : 0, transform: `translateX(-50%) scale(${isActive ? 1 : 0.5})` }}
                />
              </button>
            );
          })}
        </div>

        {/* Desktop right: lang toggle + CTA */}
        <div className="hidden md:flex items-center gap-3">
          <LangToggle />
          <span
            className="px-4 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white/30 text-sm font-medium cursor-not-allowed select-none"
          >
            {T.download}
          </span>
        </div>

        {/* Mobile: lang toggle + hamburger */}
        <div className="md:hidden flex items-center gap-2">
          <LangToggle mobile />
          <button
            className="p-1.5 text-white/50 hover:text-white transition-colors"
            onClick={() => setOpen(o => !o)}
            aria-label={open ? 'Close menu' : 'Open menu'}
          >
            <svg
              className="w-5 h-5 transition-transform duration-300"
              style={{ transform: open ? 'rotate(45deg)' : 'rotate(0deg)' }}
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              {open ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12"/>
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16"/>
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      <div
        className="md:hidden overflow-hidden bg-[#090909]/96 backdrop-blur-xl border-b border-white/[0.06] transition-all duration-300 ease-out"
        style={{ maxHeight: open ? '320px' : '0px', opacity: open ? 1 : 0 }}
      >
        <div className="px-6 pb-5 pt-2">
          {NAV_LINKS.map((l, i) => {
            const isActive = activeSection === l.href;
            return (
              <button
                key={l.href}
                onClick={() => { scrollTo(l.href); setOpen(false); }}
                className="flex items-center justify-between w-full text-left py-3 text-sm border-b border-white/[0.04] last:border-0 transition-colors"
                style={{
                  color: isActive ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.55)',
                  transitionDelay: open ? `${i * 40}ms` : '0ms',
                  transform: open ? 'translateX(0)' : 'translateX(-8px)',
                  transition: `color 0.15s ease, transform 0.25s ease ${i * 40}ms, opacity 0.25s ease ${i * 40}ms`,
                  opacity: open ? 1 : 0,
                }}
              >
                {l.label}
                {isActive && <span className="w-1.5 h-1.5 rounded-full bg-[#2CD59C]" />}
              </button>
            );
          })}
          <span
            className="mt-4 flex items-center justify-center w-full py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white/30 text-sm font-medium cursor-not-allowed select-none"
          >
            {T.download}
          </span>
        </div>
      </div>
    </nav>
  );
}
