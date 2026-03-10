import { useTranslation } from '../hooks/useTranslation';

/**
 * MicButton — reusable mic toggle button.
 * Props:
 *   isRecording   boolean
 *   isSupported   boolean
 *   onToggle      () => void
 *   size?         'sm' | 'md' | 'lg'  (default 'md')
 */
export default function MicButton({ isRecording, isSupported, onToggle, size = 'md' }) {
  const { t } = useTranslation();
  const sizeClass =
    size === 'sm'   ? 'w-9 h-9' :
    size === 'lg'   ? 'w-28 h-28' :
    size === 'home' ? 'w-[90px] h-[90px]' :  // EAI-40: 80% of lg (112px)
    'w-11 h-11';

  const iconClass =
    size === 'sm'   ? 'w-4 h-4' :
    size === 'lg'   ? 'w-10 h-10' :
    size === 'home' ? 'w-8 h-8' :             // EAI-40: 80% of lg icon
    'w-5 h-5';

  if (!isSupported) {
    return (
      <button
        disabled
        title={t('mic_not_supported')}
        className={`${sizeClass} rounded-full flex items-center justify-center bg-secondary text-muted-foreground cursor-not-allowed select-none`}
      >
        <MicIcon className={iconClass} />
      </button>
    );
  }

  return (
    <button
      onClick={onToggle}
      title={isRecording ? t('mic_stop') : t('mic_start')}
      className={[
        sizeClass,
        'rounded-full flex items-center justify-center transition-colors duration-150 focus:outline-none select-none',
        isRecording
          ? 'bg-mint text-background mic-recording active:bg-mint/80'
          : 'bg-secondary text-muted-foreground active:bg-secondary/60 active:text-foreground',
      ].join(' ')}
    >
      {isRecording ? <StopIcon className={iconClass} /> : <MicIcon className={iconClass} />}
    </button>
  );
}

function MicIcon({ className = 'w-4 h-4' }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 1a4 4 0 0 1 4 4v6a4 4 0 0 1-8 0V5a4 4 0 0 1 4-4z" />
      <path d="M19 10a1 1 0 0 0-2 0 5 5 0 0 1-10 0 1 1 0 0 0-2 0 7 7 0 0 0 6 6.92V19H9a1 1 0 0 0 0 2h6a1 1 0 0 0 0-2h-2v-2.08A7 7 0 0 0 19 10z" />
    </svg>
  );
}

function StopIcon({ className = 'w-4 h-4' }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <rect x="6" y="6" width="12" height="12" rx="2" />
    </svg>
  );
}
