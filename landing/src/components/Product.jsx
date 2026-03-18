import AnimateIn from './AnimateIn';

const STEPS = [
  {
    num: '01',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/>
      </svg>
    ),
    title: 'Write',
    desc: 'Type or speak anything on your mind. A recipe, a feeling, a random idea. No formatting, no setup.',
    detail: 'Voice & text',
  },
  {
    num: '02',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
      </svg>
    ),
    title: 'Echo learns',
    desc: 'Echo reads what you write and builds context over time. The more you share, the better it gets.',
    detail: 'Context memory',
  },
  {
    num: '03',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
      </svg>
    ),
    title: 'Ask anything',
    desc: 'Chat with Echo about your notes. Every answer comes straight from what you have shared.',
    detail: 'AI conversation',
  },
];

export default function Product() {
  return (
    <section id="product" className="relative py-28 px-6 border-t border-white/[0.05]">
      {/* Subtle dot grid */}
      <div className="absolute inset-0 dot-grid opacity-20 pointer-events-none" />

      <div className="relative max-w-5xl mx-auto">
        {/* Header */}
        <AnimateIn className="text-center mb-16">
          <p className="text-[#2CD59C] text-sm font-semibold uppercase tracking-[0.18em] mb-4">How it works</p>
          <h2 className="font-display font-bold tracking-[-0.025em] text-white mb-4"
              style={{ fontSize: 'clamp(1.9rem, 5vw, 3rem)' }}>
            Three steps. That is all.
          </h2>
          <p className="text-white/60 text-lg max-w-md mx-auto leading-relaxed">
            No setup. No prompts. Just write and go.
          </p>
        </AnimateIn>

        {/* Steps with connector */}
        <div className="relative grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Connector line (desktop) */}
          <div className="hidden md:block absolute top-12 left-[calc(16.66%+24px)] right-[calc(16.66%+24px)] h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

          {STEPS.map((step, i) => (
            <AnimateIn key={i} delay={i * 150}>
              <div className="card p-7 group h-full">
                {/* Top row */}
                <div className="flex items-center justify-between mb-6">
                  <div className="w-11 h-11 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-[#2CD59C] group-hover:border-[#2CD59C]/30 group-hover:bg-[#2CD59C]/10 transition-all">
                    {step.icon}
                  </div>
                  <span className="font-mono text-xs text-white/25">{step.num}</span>
                </div>

                <span className="inline-block px-2.5 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.07] text-white/45 text-xs font-medium mb-3">
                  {step.detail}
                </span>

                <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-[#2CD59C] transition-colors">
                  {step.title}
                </h3>
                <p className="text-base text-white/65 leading-relaxed">{step.desc}</p>
              </div>
            </AnimateIn>
          ))}
        </div>
      </div>
    </section>
  );
}
