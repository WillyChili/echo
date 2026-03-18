import { useState, useEffect } from 'react';
import EchoLogo from '../assets/echo-logo.svg';

const NAV_LINKS = [
  { label: 'Solution',   href: 'solution' },
  { label: 'Product',    href: 'product'  },
  { label: 'Features',   href: 'features' },
  { label: 'Contact Us', href: 'contact'  },
];

const scrollTo = (id) =>
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });

export default function Navbar() {
  const [scrolled,       setScrolled]       = useState(false);
  const [open,           setOpen]           = useState(false);
  const [activeSection,  setActiveSection]  = useState('');

  /* ── Scroll detection ───────────────────────────────── */
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  /* ── Active section via IntersectionObserver ────────── */
  useEffect(() => {
    const ids = NAV_LINKS.map(l => l.href);
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
          <img
            src={EchoLogo}
            alt="Echo"
            className="w-6 h-6 group-hover:drop-shadow-[0_0_8px_rgba(44,213,156,0.55)] transition-all duration-300"
          />
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
                {/* Active dot indicator */}
                <span
                  className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#2CD59C] transition-all duration-300"
                  style={{ opacity: isActive ? 1 : 0, transform: `translateX(-50%) scale(${isActive ? 1 : 0.5})` }}
                />
              </button>
            );
          })}
        </div>

        {/* Desktop CTA */}
        <div className="hidden md:block">
          <a
            href="https://play.google.com/store/apps/details?id=com.willychili.echo"
            target="_blank"
            rel="noreferrer"
            className="px-4 py-1.5 rounded-lg bg-[#2CD59C]/10 border border-[#2CD59C]/30 text-[#2CD59C] text-sm font-medium hover:bg-[#2CD59C]/20 hover:border-[#2CD59C]/50 transition-all"
          >
            Download Free
          </a>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-1.5 text-white/50 hover:text-white transition-colors"
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

      {/* Mobile drawer — always rendered, animated via max-height */}
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
          <a
            href="https://play.google.com/store/apps/details?id=com.willychili.echo"
            target="_blank"
            rel="noreferrer"
            className="mt-4 flex items-center justify-center w-full py-2.5 rounded-xl bg-[#2CD59C]/10 border border-[#2CD59C]/30 text-[#2CD59C] text-sm font-medium hover:bg-[#2CD59C]/20 transition-all"
          >
            Download Free
          </a>
        </div>
      </div>
    </nav>
  );
}
