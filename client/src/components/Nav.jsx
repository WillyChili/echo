import { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../context/ProfileContext';
import { useTranslation } from '../hooks/useTranslation';
import UpgradeModal from './UpgradeModal';

function Avatar({ email, avatarUrl, isSubscribed, onClick }) {
  const initials = email ? email[0].toUpperCase() : '?';
  return (
    <button
      onClick={onClick}
      className={`w-8 h-8 rounded-full bg-gradient-to-br from-secondary to-muted flex items-center justify-center text-sm font-semibold text-foreground select-none active:opacity-70 transition-all overflow-hidden ${isSubscribed ? 'border-2 border-mint/60' : 'border border-border/60'}`}
    >
      {avatarUrl
        ? <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
        : initials
      }
    </button>
  );
}

function DropdownMenu({ onClose, onSubscribe }) {
  const { signOut } = useAuth();
  const { isSubscribed } = useProfile();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const ref = useRef(null);

  // Close on outside tap
  useEffect(() => {
    function handleOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    }
    document.addEventListener('pointerdown', handleOutside);
    return () => document.removeEventListener('pointerdown', handleOutside);
  }, [onClose]);

  const item = 'w-full text-left px-4 py-3 text-sm text-foreground active:bg-secondary/60 transition-colors flex items-center gap-3 select-none';

  return (
    <div
      ref={ref}
      className="absolute top-11 right-0 w-52 bg-card border border-border/60 rounded-2xl shadow-lg overflow-hidden z-50"
    >
      {!isSubscribed && (
        <>
          <button
            className={cn(item, 'text-mint font-medium')}
            onClick={() => { onSubscribe(); onClose(); }}
          >
            <SparkleIcon /> {t('nav_subscribe')}
          </button>
          <div className="h-px bg-border/40 mx-3" />
        </>
      )}
      <button className={item} onClick={() => { navigate('/settings'); onClose(); }}>
        <SettingsIcon /> {t('nav_settings')}
      </button>
      <div className="h-px bg-border/40 mx-3" />
      <button className={item} onClick={() => { navigate('/edit-profile'); onClose(); }}>
        <EditIcon /> {t('nav_edit_profile')}
      </button>
      <div className="h-px bg-border/40 mx-3" />
      <button className={cn(item, 'text-red-400')} onClick={() => { signOut(); onClose(); }}>
        <SignOutIcon /> {t('nav_sign_out')}
      </button>
    </div>
  );
}

export default function Nav() {
  const { user } = useAuth();
  const { avatarUrl, isSubscribed } = useProfile();
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const linkClass = ({ isActive }) =>
    cn(
      'px-4 py-2 rounded-xl text-sm font-medium transition-colors duration-150 squircle select-none',
      isActive
        ? 'bg-secondary text-foreground'
        : 'text-muted-foreground active:text-foreground active:bg-secondary/50'
    );

  return (
    <>
      <nav className="sticky top-0 z-10 border-b border-border/60 bg-background/90 backdrop-blur-sm">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <EchoLogoIcon isSubscribed={isSubscribed} />
          <div className="flex items-center gap-1">
            <NavLink to="/" end className={linkClass}>{t('nav_today')}</NavLink>
            <NavLink to="/chat" className={linkClass}>{t('nav_echo')}</NavLink>
            <div className="relative ml-2">
              <Avatar email={user?.email} avatarUrl={avatarUrl} isSubscribed={isSubscribed} onClick={() => setOpen((o) => !o)} />
              {open && (
                <DropdownMenu
                  onClose={() => setOpen(false)}
                  onSubscribe={() => setShowUpgradeModal(true)}
                />
              )}
            </div>
          </div>
        </div>
      </nav>
      {showUpgradeModal && (
        <UpgradeModal onClose={() => setShowUpgradeModal(false)} />
      )}
    </>
  );
}

function SparkleIcon() {
  return (
    <svg className="w-4 h-4 text-mint" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg className="w-4 h-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg className="w-4 h-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125" />
    </svg>
  );
}

function SignOutIcon() {
  return (
    <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
    </svg>
  );
}

function EchoLogoIcon({ isSubscribed }) {
  const radii = [8, 14, 20, 26, 32, 38];
  return (
    <svg
      className={`w-7 h-7 transition-colors select-none ${isSubscribed ? 'text-mint' : 'text-foreground'}`}
      viewBox="0 0 100 100"
      fill="none"
    >
      <circle cx="50" cy="50" r="5" fill="currentColor" />
      {radii.map((r) => {
        const C = 2 * Math.PI * r;
        return (
          <circle
            key={r}
            cx="50" cy="50" r={r}
            stroke="currentColor"
            strokeWidth={r <= 14 ? 4 : r <= 26 ? 3.5 : 3}
            strokeLinecap="round"
            strokeDasharray={`${C * 0.1875} ${C * 0.0625}`}
            transform="rotate(-45 50 50)"
          />
        );
      })}
    </svg>
  );
}

function SubscriptionIcon() {
  return (
    <svg className="w-4 h-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
    </svg>
  );
}
