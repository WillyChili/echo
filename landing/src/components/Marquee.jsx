/* Scrolling marquee strip — placed between Hero and Product */
import { useLang } from '../context/LangContext';
import { translations } from '../lib/translations';

const Row = ({ items }) => (
  <div className="marquee-inner flex items-center">
    {items.map((item, i) => (
      <span key={i} className="flex items-center gap-6 flex-shrink-0 pl-6">
        <span className="text-white/40 text-xs font-medium tracking-[0.06em] uppercase whitespace-nowrap select-none">
          {item}
        </span>
        <span className="text-[#2CD59C]/35 text-[8px]">◆</span>
      </span>
    ))}
  </div>
);

export default function Marquee() {
  const { lang } = useLang();
  const items = translations[lang].marquee;

  return (
    <div className="relative border-y border-white/[0.05] py-3.5 overflow-hidden bg-white/[0.008]">
      {/* Fade masks on both sides */}
      <div className="absolute inset-y-0 left-0  w-24 bg-gradient-to-r from-[#0A0A0A] to-transparent z-10 pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-[#0A0A0A] to-transparent z-10 pointer-events-none" />

      <div className="marquee-wrap">
        <Row items={items} />
        <div className="marquee-inner-2 flex items-center">
          {items.map((item, i) => (
            <span key={i} className="flex items-center gap-6 flex-shrink-0 pl-6">
              <span className="text-white/40 text-xs font-medium tracking-[0.06em] uppercase whitespace-nowrap select-none">
                {item}
              </span>
              <span className="text-[#2CD59C]/35 text-[8px]">◆</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
