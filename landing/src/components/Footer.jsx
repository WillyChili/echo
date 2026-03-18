import EchoLogo from '../assets/echo-logo.svg';

const RAILWAY = 'https://echo-production-c241.up.railway.app';
const PLAY_STORE = 'https://play.google.com/store/apps/details?id=com.willychili.echo';
const scrollTo = id => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });

export default function Footer() {
  return (
    <footer className="border-t border-white/[0.06] bg-[#050505] px-6 py-14">
      <div className="max-w-5xl mx-auto">

        {/* Top row */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-10 mb-12">

          {/* Brand */}
          <div className="flex items-center gap-3.5">
            <img src={EchoLogo} alt="Echo" className="w-7 h-7 opacity-85" />
            <div>
              <p className="font-semibold text-white text-[15px]">Echo</p>
              <p className="text-white/45 text-xs mt-0.5">Your personal AI reflection</p>
            </div>
          </div>

          {/* Nav links */}
          <div className="flex flex-wrap gap-x-8 gap-y-2">
            {[['Product','product'],['Features','features'],['Solution','solution'],['Contact','contact']].map(([label, id]) => (
              <button
                key={id}
                onClick={() => scrollTo(id)}
                className="text-sm text-white/50 hover:text-white/85 transition-colors"
              >
                {label}
              </button>
            ))}
          </div>

          {/* Legal */}
          <div className="flex items-center gap-6">
            <a href={`${RAILWAY}/privacy.html`} target="_blank" rel="noreferrer"
               className="text-sm text-white/45 hover:text-white/75 transition-colors">
              Privacy
            </a>
            <a href={`${RAILWAY}/tos.html`} target="_blank" rel="noreferrer"
               className="text-sm text-white/45 hover:text-white/75 transition-colors">
              Terms
            </a>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-white/[0.05] mb-7" />

        {/* Bottom row */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-white/40 text-xs">© {new Date().getFullYear()} Echo. All rights reserved.</p>

          {/* Center: Play Store */}
          <a
            href={PLAY_STORE}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-lg border border-white/[0.10] bg-white/[0.04] text-white/55 text-xs font-medium hover:text-white/85 hover:border-white/20 hover:bg-white/[0.07] transition-all"
          >
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3.18 23.76c.33.18.7.24 1.06.2l12.76-11.4-2.76-2.76L3.18 23.76zm17.6-13.37L17.9 8.74l-3.06 3.06 3.06 3.06 2.9-1.66a1.65 1.65 0 000-2.81zM1.16 1.26a1.64 1.64 0 00-.16.72v19.04c0 .26.06.51.16.72l.1.1L13.1 9.9v-.3L1.26 1.16l-.1.1zm7.42 8.88L5.22 6.78l-.12.12 12.76 11.4.12-.12-9.4-8.04z"/>
            </svg>
            Available on Android
          </a>

          {/* X / Twitter */}
          <a
            href="https://x.com/_ChiliWilly"
            target="_blank"
            rel="noreferrer"
            aria-label="Follow on X"
            className="inline-flex items-center gap-2 text-white/50 hover:text-white transition-colors text-xs"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.911-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
            <span>@_ChiliWilly</span>
          </a>
        </div>

      </div>
    </footer>
  );
}
