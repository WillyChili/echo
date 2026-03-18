/* Bento grid — Linear/Framer inspired
   Desktop layout (3 cols):
   Row 1: Voice & Text [2col]  |  AI Chat [1col]
   Row 2: Weekly Digest [1col] |  Custom Personality [2col] Pro
   Row 3: Email Summaries[1col]|  Bilingual [2col]
*/

import { useEffect, useRef } from 'react';
import AnimateIn from './AnimateIn';

/* ── Mock note visual for Voice card ──────────────────────── */
function NoteVisual() {
  return (
    <div className="rounded-xl bg-white/[0.04] border border-white/[0.07] p-4 mb-6 space-y-2">
      {[
        { w: 'w-full',   o: 'opacity-30' },
        { w: 'w-4/5',    o: 'opacity-20' },
        { w: 'w-3/5',    o: 'opacity-15' },
      ].map((l, i) => (
        <div key={i} className={`h-2 rounded-full bg-white ${l.w} ${l.o}`} />
      ))}
      <div className="flex items-center gap-2 pt-1">
        <div className="w-4 h-4 rounded-full bg-[#2CD59C]/30 border border-[#2CD59C]/40 flex items-center justify-center">
          <div className="w-1.5 h-1.5 rounded-full bg-[#2CD59C]" />
        </div>
        <div className="h-1.5 w-20 rounded-full bg-[#2CD59C]/20" />
      </div>
    </div>
  );
}

/* ── Mock chat bubble for AI Chat card ────────────────────── */
function ChatVisual() {
  return (
    <div className="space-y-2.5 mb-6">
      <div className="flex justify-end">
        <div className="bg-white/[0.07] border border-white/[0.08] rounded-2xl rounded-tr-sm px-3 py-2 text-xs text-white/50 max-w-[80%]">
          What did I write about last week?
        </div>
      </div>
      <div className="flex justify-start">
        <div className="bg-[#2CD59C]/10 border border-[#2CD59C]/20 rounded-2xl rounded-tl-sm px-3 py-2 text-xs text-[#2CD59C]/80 max-w-[85%]">
          You wrote about the hiking trip and a new pasta recipe…
        </div>
      </div>
    </div>
  );
}

/* ── Personality selector for Custom card ─────────────────── */
function PersonalityVisual() {
  return (
    <div className="flex gap-2 mb-6">
      {[
        { label: 'Warm',    active: true  },
        { label: 'Direct',  active: false },
        { label: 'Curious', active: false },
      ].map(p => (
        <div
          key={p.label}
          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
            p.active
              ? 'bg-[#2CD59C]/15 border-[#2CD59C]/40 text-[#2CD59C]'
              : 'bg-white/[0.03] border-white/[0.08] text-white/35'
          }`}
        >
          {p.label}
        </div>
      ))}
    </div>
  );
}

/* ── Language toggle for Bilingual card ───────────────────── */
function BilingualVisual() {
  return (
    <div className="flex items-center gap-3 mb-6">
      <div className="flex-1 rounded-xl bg-white/[0.04] border border-white/[0.07] p-3 text-center">
        <p className="text-xs text-white/30 mb-1">English</p>
        <p className="text-sm font-medium text-white/70">"How was your day?"</p>
      </div>
      <div className="text-white/20 text-xs">⇄</div>
      <div className="flex-1 rounded-xl bg-[#2CD59C]/[0.04] border border-[#2CD59C]/15 p-3 text-center">
        <p className="text-xs text-[#2CD59C]/40 mb-1">Español</p>
        <p className="text-sm font-medium text-[#2CD59C]/70">"¿Cómo estuvo tu día?"</p>
      </div>
    </div>
  );
}

/* ── Main component ───────────────────────────────────────── */
export default function Features() {
  const gridRef = useRef(null);

  /* Cursor spotlight: track mouse per-card via CSS custom properties */
  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;
    const handler = (e) => {
      const card = e.target.closest('.bento-card');
      if (!card) return;
      const r = card.getBoundingClientRect();
      card.style.setProperty('--mx', `${e.clientX - r.left}px`);
      card.style.setProperty('--my', `${e.clientY - r.top}px`);
    };
    grid.addEventListener('mousemove', handler);
    return () => grid.removeEventListener('mousemove', handler);
  }, []);

  return (
    <section id="features" className="relative py-28 px-6 bg-white/[0.012] border-t border-white/[0.05]">
      <div className="absolute inset-0 dot-grid opacity-[0.18] pointer-events-none" />

      <div className="relative max-w-5xl mx-auto">
        {/* Header */}
        <AnimateIn className="text-center mb-14">
          <p className="text-[#2CD59C] text-sm font-semibold uppercase tracking-[0.18em] mb-4">What you get</p>
          <h2 className="font-display font-bold tracking-[-0.025em] text-white mb-4"
              style={{ fontSize: 'clamp(1.9rem, 5vw, 3rem)' }}>
            Built around how you actually think
          </h2>
          <p className="text-white/60 text-lg max-w-sm mx-auto">
            Capture fast. Review often. Echo remembers everything in between.
          </p>
        </AnimateIn>

        {/* Bento grid */}
        <div ref={gridRef} className="grid grid-cols-1 md:grid-cols-3 gap-4">

          {/* ① Voice & Text — col-span-2 */}
          <AnimateIn delay={0} className="md:col-span-2">
            <div className="card bento-card p-7 group h-full">
              <span className="inline-block px-2.5 py-0.5 rounded-full bg-white/[0.05] border border-white/[0.08] text-white/80 text-xs font-medium mb-4">
                Notes
              </span>
              <NoteVisual />
              <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-[#2CD59C] transition-colors">
                Voice & Text Notes
              </h3>
              <p className="text-base text-white/65 leading-relaxed">
                Capture ideas however they come. Type freely or speak naturally. Echo listens either way.
              </p>
            </div>
          </AnimateIn>

          {/* ② AI Chat — col-span-1 */}
          <AnimateIn delay={150} className="md:col-span-1">
            <div className="card bento-card p-7 group h-full">
              <span className="inline-block px-2.5 py-0.5 rounded-full bg-white/[0.05] border border-white/[0.08] text-white/80 text-xs font-medium mb-4">
                Chat
              </span>
              <ChatVisual />
              <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-[#2CD59C] transition-colors">
                AI Chat
              </h3>
              <p className="text-base text-white/65 leading-relaxed">
                Ask Echo anything about your notes. It answers from your own words.
              </p>
            </div>
          </AnimateIn>

          {/* ③ Weekly Digest — col-span-1 */}
          <AnimateIn delay={0} className="md:col-span-1">
            <div className="card bento-card p-7 group h-full">
              <span className="inline-block px-2.5 py-0.5 rounded-full bg-white/[0.05] border border-white/[0.08] text-white/80 text-xs font-medium mb-4">
                Summary
              </span>
              {/* Calendar visual */}
              <div className="rounded-xl bg-white/[0.04] border border-white/[0.07] p-4 mb-6 grid grid-cols-7 gap-1">
                {Array.from({ length: 14 }, (_, i) => (
                  <div key={i}
                    className={`h-4 w-full rounded-sm ${
                      [2, 5, 8, 11].includes(i)
                        ? 'bg-[#2CD59C]/40'
                        : 'bg-white/[0.06]'
                    }`}
                  />
                ))}
              </div>
              <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-[#2CD59C] transition-colors">
                Weekly Digest
              </h3>
              <p className="text-base text-white/65 leading-relaxed">
                A curated summary of your notes, delivered on a schedule you choose.
              </p>
            </div>
          </AnimateIn>

          {/* ④ Custom Personality — col-span-2 */}
          <AnimateIn delay={150} className="md:col-span-2">
            <div className="card-mint bento-card p-7 group relative overflow-hidden h-full">
              <div className="flex items-center gap-2 mb-4">
                <span className="inline-block px-2.5 py-0.5 rounded-full bg-white/[0.05] border border-white/[0.08] text-white/80 text-xs font-medium">
                  Personality
                </span>
              </div>
              <PersonalityVisual />
              <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-[#2CD59C] transition-colors">
                Custom Personality
              </h3>
              <p className="text-base text-white/65 leading-relaxed">
                Warm, Direct, or Curious. Tune how Echo sounds so it truly feels like yours.
              </p>
              <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-[#2CD59C]/10 rounded-full blur-2xl pointer-events-none" />
            </div>
          </AnimateIn>

          {/* ⑤ Email Summaries — col-span-1 */}
          <AnimateIn delay={0} className="md:col-span-1">
            <div className="card bento-card p-7 group relative overflow-hidden h-full">
              <span className="inline-block px-2.5 py-0.5 rounded-full bg-white/[0.05] border border-white/[0.08] text-white/80 text-xs font-medium mb-4">
                Email
              </span>
              {/* Email preview */}
              <div className="rounded-xl bg-white/[0.04] border border-white/[0.07] p-3 mb-6">
                <div className="flex items-center gap-2 mb-2 pb-2 border-b border-white/[0.06]">
                  <div className="w-5 h-5 rounded-full bg-[#2CD59C]/20 flex-shrink-0" />
                  <div className="h-1.5 w-16 rounded-full bg-white/20" />
                  <div className="ml-auto h-1.5 w-8 rounded-full bg-white/10" />
                </div>
                <div className="space-y-1.5">
                  <div className="h-1.5 w-full rounded-full bg-white/10" />
                  <div className="h-1.5 w-3/4 rounded-full bg-white/7" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-[#2CD59C] transition-colors">
                Email Summaries
              </h3>
              <p className="text-base text-white/65 leading-relaxed">
                Get your weekly digest straight in your inbox.
              </p>
            </div>
          </AnimateIn>

          {/* ⑥ Bilingual — col-span-2 */}
          <AnimateIn delay={150} className="md:col-span-2">
            <div className="card bento-card p-7 group h-full">
              <span className="inline-block px-2.5 py-0.5 rounded-full bg-white/[0.05] border border-white/[0.08] text-white/80 text-xs font-medium mb-4">
                Language
              </span>
              <BilingualVisual />
              <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-[#2CD59C] transition-colors">
                Bilingual
              </h3>
              <p className="text-base text-white/65 leading-relaxed">
                Fully available in English and Español. Echo speaks your language.
              </p>
            </div>
          </AnimateIn>

        </div>

      </div>
    </section>
  );
}
