import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authFetch } from '../lib/api';
import { useAuth } from './AuthContext';

const ProfileContext = createContext(null);

export function ProfileProvider({ children }) {
  const { user } = useAuth();
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [displayName, setDisplayName] = useState('');
  const [language, setLanguage] = useState('en');

  const refreshProfile = useCallback(() => {
    if (!user) return;
    authFetch('/api/profile')
      .then((r) => r.json())
      .then((d) => {
        // Don't clear existing state if the server returned an error
        if (d.error) return;
        if ('avatar_url' in d) setAvatarUrl(d.avatar_url || null);
        if ('display_name' in d) setDisplayName(d.display_name || '');
        if ('language' in d) setLanguage(d.language || 'en');
      })
      .catch(() => {}); // network error — preserve existing state
  }, [user]);

  // Fetch on mount / when user changes
  useEffect(() => {
    refreshProfile();
  }, [refreshProfile]);

  return (
    <ProfileContext.Provider value={{ avatarUrl, setAvatarUrl, displayName, setDisplayName, language, setLanguage, refreshProfile }}>
      {children}
    </ProfileContext.Provider>
  );
}

export const useProfile = () => useContext(ProfileContext);
