export default function Contact() {
  return (
    <section id="contact" className="relative py-28 px-6 border-t border-white/[0.05]">
      <div className="max-w-3xl mx-auto text-center">

        <p className="text-[#2CD59C] text-sm font-semibold uppercase tracking-[0.18em] mb-4">Get in touch</p>
        <h2 className="font-display font-bold tracking-[-0.025em] text-white mb-4"
            style={{ fontSize: 'clamp(1.9rem, 5vw, 3rem)' }}>
          We want to hear from you
        </h2>
        <p className="text-white/60 text-lg mb-10 leading-relaxed max-w-md mx-auto">
          Got a question, a suggestion, or just want to share how Echo is working for you? We read every message.
        </p>

        <a
          href="mailto:hello@echoapp.ai"
          className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-xl bg-[#2CD59C] text-black font-semibold hover:bg-[#25c48f] active:scale-95 transition-all text-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
          </svg>
          Send us an email
        </a>

        <p className="mt-5 text-white/40 text-sm">
          Usually reply within 24 hours.
        </p>
      </div>
    </section>
  );
}
