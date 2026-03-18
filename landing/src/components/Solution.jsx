import AnimateIn from './AnimateIn';

/* ── Inline SVG icons — clean, no external deps ───────────── */
const MinusIcon = () => (
  <svg width="10" height="2" viewBox="0 0 10 2" fill="none">
    <path d="M1 1h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);
const CheckIcon = () => (
  <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
    <path d="M1 4.5L4 7.5L10 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const BEFORE = [
  { label: '01', text: 'Your best ideas vanish the moment they arrive.' },
  { label: '02', text: 'Notes pile up. Journals go unread. Nothing sticks.' },
  { label: '03', text: 'You keep making the same decisions without remembering the last one.' },
];

const AFTER = [
  { label: '01', text: 'Capture any thought in seconds by voice or text.' },
  { label: '02', text: 'Echo reads, learns, and surfaces what actually matters.' },
  { label: '03', text: 'Ask anything. Echo answers from your own words.' },
];

export default function Solution() {
  return (
    <section id="solution" className="relative py-28 px-6 border-t border-white/[0.05]">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <AnimateIn className="text-center mb-16">
          <p className="text-[#2CD59C] text-sm font-semibold uppercase tracking-[0.18em] mb-4">The problem</p>
          <h2 className="font-display font-bold tracking-[-0.025em] text-white mb-4"
              style={{ fontSize: 'clamp(1.9rem, 5vw, 3rem)' }}>
            Ideas vanish. Echo makes them last.
          </h2>
          <p className="text-white/60 text-lg max-w-sm mx-auto">
            Most note apps store what you write. Echo understands it.
          </p>
        </AnimateIn>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-14">

          {/* ── BEFORE ─────────────────────────────────────────── */}
          <AnimateIn delay={0}>
            <div className="card h-full flex flex-col">
              {/* Top bar */}
              <div className="h-px bg-gradient-to-r from-transparent via-white/[0.10] to-transparent" />

              <div className="p-8 flex flex-col flex-1">
                {/* Label */}
                <div className="flex items-center gap-2.5 mb-10">
                  <div className="w-5 h-5 rounded-full bg-white/[0.05] border border-white/[0.12]
                    flex items-center justify-center text-white/40">
                    <MinusIcon />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/30">
                    Before Echo
                  </span>
                </div>

                {/* Items */}
                <ul className="flex flex-col gap-0 flex-1">
                  {BEFORE.map((item, i) => (
                    <li key={i}
                      className={`flex items-start gap-5 py-5
                        ${i < BEFORE.length - 1 ? 'border-b border-white/[0.05]' : ''}`}>
                      {/* Number */}
                      <span className="text-[10px] font-mono text-white/25 mt-0.5 w-4 flex-shrink-0 select-none">
                        {item.label}
                      </span>
                      {/* Text */}
                      <p className="text-base text-white/50 leading-relaxed">{item.text}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </AnimateIn>

          {/* ── WITH ECHO ──────────────────────────────────────── */}
          <AnimateIn delay={150}>
            <div className="card-mint bento-card h-full flex flex-col relative overflow-hidden">
              {/* Top accent bar — mint */}
              <div className="h-px bg-gradient-to-r from-transparent via-[#2CD59C]/60 to-transparent" />

              <div className="p-8 flex flex-col flex-1 relative z-10">
                {/* Label */}
                <div className="flex items-center gap-2.5 mb-10">
                  <div className="w-5 h-5 rounded-full bg-[#2CD59C]/15 border border-[#2CD59C]/35
                    flex items-center justify-center text-[#2CD59C]">
                    <CheckIcon />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#2CD59C]/70">
                    With Echo
                  </span>
                </div>

                {/* Items */}
                <ul className="flex flex-col gap-0 flex-1">
                  {AFTER.map((item, i) => (
                    <li key={i}
                      className={`flex items-start gap-5 py-5
                        ${i < AFTER.length - 1 ? 'border-b border-[#2CD59C]/[0.08]' : ''}`}>
                      {/* Number */}
                      <span className="text-[10px] font-mono text-[#2CD59C]/35 mt-0.5 w-4 flex-shrink-0 select-none">
                        {item.label}
                      </span>
                      {/* Text */}
                      <p className="text-base text-white/85 leading-relaxed">{item.text}</p>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Background glows */}
              <div className="absolute -bottom-10 -right-10 w-52 h-52 bg-[#2CD59C]/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -top-10 -left-10 w-40 h-40 bg-[#2CD59C]/05 rounded-full blur-3xl pointer-events-none" />
            </div>
          </AnimateIn>
        </div>


      </div>
    </section>
  );
}
