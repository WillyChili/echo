import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authFetch } from '../lib/api';
import { useAuth } from './AuthContext';

const ProfileContext = createContext(null);

export function ProfileProvider({ children }) {
  const { user } = useAuth();
  const [avatarUrl, setAvatarUrl] = useState(null);
  // null = not yet loaded / fetch failed; '' = loaded but empty (needs onboarding)
  // seed from localStorage so returning users never see onboarding on slow/failed fetches
  const [displayName, setDisplayName] = useState(localStorage.getItem('echo_display_name') || null);
  const [language, setLanguage] = useState('en');
  const [bio, setBio] = useState('');
  const [echoTone, setEchoTone] = useState('warm');
  const [profileLoading, setProfileLoading] = useState(true);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [chatsUsedToday, setChatsUsedToday] = useState(0);
  const [dailyChatsResetDate, setDailyChatsResetDate] = useState(null);

  const refreshProfile = useCallback(() => {
    if (!user) { setProfileLoading(false); return; }
    setProfileLoading(true);
    authFetch('/api/profile')
      .then((r) => {
        if (!r.ok) throw new Error('profile_fetch_failed');
        return r.json();
      })
      .then((d) => {
        // Server-side error — preserve existing state, don't trigger onboarding
        if (d.error) return;
        // Always set displayName so null→'' for new users, null→'Name' for existing
        const name = d.display_name || '';
        if (name) localStorage.setItem('echo_display_name', name);
        setDisplayName(name || localStorage.getItem('echo_display_name') || '');
        setAvatarUrl(d.avatar_url || null);
        if ('language' in d) setLanguage(d.language || 'en');
        if ('bio' in d) setBio(d.bio || '');
        if ('echo_tone' in d) setEchoTone(d.echo_tone || 'warm');
        if ('is_subscribed' in d) setIsSubscribed(!!d.is_subscribed);
        if ('daily_chats_used' in d) {
          const today = new Date().toISOString().slice(0, 10);
          // Reset local counter if the DB date is stale
          const resetDate = d.daily_chats_reset_date;
          setChatsUsedToday(resetDate && resetDate >= today ? (d.daily_chats_used ?? 0) : 0);
          setDailyChatsResetDate(resetDate || today);
        }
      })
      .catch(() => {}) // network/server error — preserve existing state (displayName stays null)
      .finally(() => setProfileLoading(false));
  }, [user]);

  // Fetch on mount / when user changes
  useEffect(() => {
    refreshProfile();
  }, [refreshProfile]);

  // Wrap setDisplayName so it always persists to localStorage
  const setDisplayNameCached = useCallback((name) => {
    if (name) localStorage.setItem('echo_display_name', name);
    setDisplayName(name);
  }, []);

  return (
    <ProfileContext.Provider value={{ avatarUrl, setAvatarUrl, displayName, setDisplayName: setDisplayNameCached, language, setLanguage, bio, setBio, echoTone, setEchoTone, refreshProfile, profileLoading, isSubscribed, chatsUsedToday, setChatsUsedToday, dailyChatsResetDate }}>
      {children}
    </ProfileContext.Provider>
  );
}

export const useProfile = () => useContext(ProfileContext);
