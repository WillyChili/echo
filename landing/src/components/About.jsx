import AnimateIn from './AnimateIn';

const STACK = [
  {
    tag: 'AI Engine',
    name: 'Claude AI',
    sub: 'by Anthropic',
    desc: 'The intelligence behind every Echo conversation — fast, thoughtful, and context-aware.',
    visual: (
      <div className="w-12 h-12 rounded-2xl bg-[#7B61FF]/10 border border-[#7B61FF]/20 flex items-center justify-center text-2xl mb-5">
        🤖
      </div>
    ),
    accent: 'border-[#7B61FF]/15 hover:border-[#7B61FF]/30',
    glow: 'bg-[#7B61FF]/06',
  },
  {
    tag: 'Database & Auth',
    name: 'Supabase',
    sub: '',
    desc: 'Secure, real-time database and Google OAuth authentication. Your data stays yours.',
    visual: (
      <div className="w-12 h-12 rounded-2xl bg-[#3ECF8E]/10 border border-[#3ECF8E]/20 flex items-center justify-center text-2xl mb-5">
        🔒
      </div>
    ),
    accent: 'border-[#3ECF8E]/15 hover:border-[#3ECF8E]/30',
    glow: 'bg-[#3ECF8E]/06',
  },
  {
    tag: 'Mobile App',
    name: 'React + Capacitor',
    sub: '',
    desc: 'A native Android experience built with web technology — fast, modern, and cross-platform ready.',
    visual: (
      <div className="w-12 h-12 rounded-2xl bg-[#61DAFB]/10 border border-[#61DAFB]/20 flex items-center justify-center text-2xl mb-5">
        ⚡
      </div>
    ),
    accent: 'border-[#61DAFB]/15 hover:border-[#61DAFB]/30',
    glow: 'bg-[#61DAFB]/06',
  },
];

export default function About() {
  return (
    <section id="about" className="relative py-28 px-6 bg-white/[0.012] border-t border-white/[0.05]">
      <div className="absolute inset-0 dot-grid opacity-[0.18] pointer-events-none" />

      <div className="relative max-w-5xl mx-auto">

        {/* Header */}
        <AnimateIn className="text-center mb-6">
          <p className="text-[#2CD59C] text-xs font-semibold uppercase tracking-[0.18em] mb-4">About</p>
          <h2 className="font-display font-bold tracking-[-0.025em] text-white mb-4"
              style={{ fontSize: 'clamp(1.9rem, 5vw, 3rem)' }}>
            Built with care
          </h2>
          <p className="text-white/40 text-base max-w-lg mx-auto leading-relaxed">
            Echo is an indie app built to give you a private, personal AI that actually knows you.
            No ads. No tracking. Just your thoughts.
          </p>
        </AnimateIn>

        <div className="my-12 border-t border-white/[0.05]" />

        <AnimateIn>
          <p className="text-center text-xs font-medium uppercase tracking-[0.18em] text-white/20 mb-8">
            Powered by
          </p>
        </AnimateIn>

        {/* Stack cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {STACK.map((s, i) => (
            <AnimateIn key={i} delay={i * 100}>
              <div
                className={`relative overflow-hidden rounded-2xl p-7 border bg-white/[0.025] transition-all duration-250 hover:bg-white/[0.04] hover:-translate-y-1 h-full ${s.accent}`}
              >
                {/* Background glow */}
                <div className={`absolute inset-0 ${s.glow} pointer-events-none`} />

                <div className="relative">
                  {s.visual}

                  <span className="inline-block px-2.5 py-0.5 rounded-full bg-white/[0.05] border border-white/[0.08] text-white/30 text-xs font-medium mb-4">
                    {s.tag}
                  </span>

                  <h3 className="text-base font-semibold text-white mb-1">
                    {s.name}
                    {s.sub && <span className="text-white/35 font-normal text-sm ml-1">{s.sub}</span>}
                  </h3>

                  <p className="text-sm text-white/40 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            </AnimateIn>
          ))}
        </div>
      </div>
    </section>
  );
}
