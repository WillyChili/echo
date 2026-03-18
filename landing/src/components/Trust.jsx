import AnimateIn from './AnimateIn';

const PILLARS = [
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/>
      </svg>
    ),
    title: 'No ads. Ever.',
    desc: 'Your thoughts are not a product. We will never sell your data or show you ads.',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
      </svg>
    ),
    title: 'Private by design',
    desc: 'What you write stays between you and Echo. Nobody else reads your notes.',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
      </svg>
    ),
    title: 'Free to start',
    desc: 'Use Echo every day at no cost. No credit card, no trial expiry, no catch.',
  },
];

export default function Trust() {
  return (
    <section className="relative py-28 px-6 border-t border-white/[0.05] overflow-hidden">
      <div className="absolute inset-0 dot-grid opacity-[0.15] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
        w-[700px] h-[300px] bg-[#2CD59C]/[0.04] rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-4xl mx-auto text-center">

        <AnimateIn>
          <p className="text-[#2CD59C] text-sm font-semibold uppercase tracking-[0.18em] mb-8">
            Why Echo
          </p>
          <h2
            className="font-display font-bold tracking-[-0.03em] text-white leading-[1.12] mb-6"
            style={{ fontSize: 'clamp(2rem, 4.5vw, 3.2rem)' }}
          >
            Your thoughts deserve more than
            <br />
            <span className="text-white/50">a list that nobody reads.</span>
          </h2>
          <p className="text-white/60 text-lg max-w-xl mx-auto mb-20 leading-relaxed">
            Echo was built because the best tools for thinking
            were made for productivity, not for people.
          </p>
        </AnimateIn>

        {/* Pillars */}
        <AnimateIn delay={150}>
          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-white/[0.06] rounded-2xl border border-white/[0.06] overflow-hidden bg-white/[0.015]">
            {PILLARS.map((p, i) => (
              <div key={i} className="p-8 text-left group hover:bg-white/[0.02] transition-colors">
                <div className="w-10 h-10 rounded-xl bg-[#2CD59C]/10 border border-[#2CD59C]/20
                  flex items-center justify-center text-[#2CD59C] mb-5 group-hover:bg-[#2CD59C]/15 transition-colors">
                  {p.icon}
                </div>
                <h3 className="font-semibold text-white text-base mb-2">{p.title}</h3>
                <p className="text-white/55 text-sm leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </AnimateIn>

      </div>
    </section>
  );
}
