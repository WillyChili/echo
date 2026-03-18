import EchoLogo from '../assets/echo-logo.svg';

const RAILWAY = 'https://echo-production-c241.up.railway.app';
const scrollTo = id => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });

export default function Footer() {
  return (
    <footer className="border-t border-white/[0.05] bg-[#050505] px-6 py-12">
      <div className="max-w-5xl mx-auto">

        {/* Top */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 mb-10">

          {/* Brand */}
          <div className="flex items-center gap-4">
            <img src={EchoLogo} alt="Echo" className="w-7 h-7 opacity-80" />
            <div>
              <p className="font-semibold text-white text-[15px]">Echo</p>
              <p className="text-white/30 text-xs mt-0.5">Your personal AI reflection</p>
            </div>
            <a
              href="https://x.com/_ChiliWilly"
              target="_blank"
              rel="noreferrer"
              aria-label="X (Twitter)"
              className="ml-1 flex items-center justify-center w-8 h-8 rounded-lg border border-white/[0.08] bg-white/[0.04] text-white/50 hover:text-white hover:border-white/20 hover:bg-white/[0.08] transition-all"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.911-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </a>
          </div>

          {/* Nav */}
          <div className="flex flex-wrap gap-x-7 gap-y-2">
            {[['Product','product'],['Features','features'],['Solution','solution'],['Contact','contact']].map(([label, id]) => (
              <button
                key={id}
                onClick={() => scrollTo(id)}
                className="text-xs text-white/35 hover:text-white/70 transition-colors"
              >
                {label}
              </button>
            ))}
          </div>

          {/* Legal */}
          <div className="flex items-center gap-5">
            <a href={`${RAILWAY}/privacy.html`} target="_blank" rel="noreferrer"
               className="text-xs text-white/30 hover:text-white/60 transition-colors">
              Privacy
            </a>
            <a href={`${RAILWAY}/tos.html`} target="_blank" rel="noreferrer"
               className="text-xs text-white/30 hover:text-white/60 transition-colors">
              Terms
            </a>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-white/[0.04] mb-7" />

        {/* Bottom */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-white/20 text-xs">© {new Date().getFullYear()} Echo. All rights reserved.</p>
          <p className="text-white/20 text-xs">Available on Android</p>
        </div>
      </div>
    </footer>
  );
}
