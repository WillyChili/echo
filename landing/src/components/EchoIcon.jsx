export default function EchoIcon({ size = 28, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <filter id="echo-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1.2" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Outer ring */}
      <circle cx="12" cy="12" r="10.5" stroke="#2CD59C" strokeWidth="1" strokeOpacity="0.25" filter="url(#echo-glow)" />
      {/* Mid ring */}
      <circle cx="12" cy="12" r="7"   stroke="#2CD59C" strokeWidth="1.1" strokeOpacity="0.55" filter="url(#echo-glow)" />
      {/* Inner ring */}
      <circle cx="12" cy="12" r="3.8" stroke="#2CD59C" strokeWidth="1.2" strokeOpacity="0.85" filter="url(#echo-glow)" />
      {/* Center dot */}
      <circle cx="12" cy="12" r="1.6" fill="#2CD59C" filter="url(#echo-glow)" />
    </svg>
  );
}
