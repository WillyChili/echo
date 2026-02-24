import { useState, useEffect, useRef } from 'react';
import { authFetch } from '../lib/api';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

function Row({ label, sublabel, children }) {
  return (
    <div className="flex items-center justify-between px-4 py-4">
      <div>
        <p className="text-sm text-foreground">{label}</p>
        {sublabel && <p className="text-xs text-muted-foreground mt-0.5">{sublabel}</p>}
      </div>
      <div className="shrink-0 ml-4">{children}</div>
    </div>
  );
}

function Separator() {
  return <div className="h-px bg-border/40 mx-4" />;
}

export default function EditProfilePage() {
  const { user } = useAuth();
  const fileRef = useRef(null);

  const [displayName, setDisplayName]   = useState('');
  const [avatarUrl, setAvatarUrl]       = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [language, setLanguage]         = useState('en');
  const [fetching, setFetching]         = useState(true);
  const [saving, setSaving]             = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [saved, setSaved]               = useState(false);
  const [error, setError]               = useState(null);

  // Load profile
  useEffect(() => {
    authFetch('/api/profile')
      .then((r) => r.json())
      .then((d) => {
        if (d.display_name) setDisplayName(d.display_name);
        if (d.avatar_url)   setAvatarUrl(d.avatar_url);
        if (d.language)     setLanguage(d.language);
      })
      .catch(() => {})
      .finally(() => setFetching(false));
  }, []);

  // Handle avatar file pick
  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show preview immediately
    const reader = new FileReader();
    reader.onload = (ev) => setAvatarPreview(ev.target.result);
    reader.readAsDataURL(file);

    // Upload to Supabase Storage
    setUploadingAvatar(true);
    setError(null);
    try {
      const path = `${user.id}/avatar`;
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true, contentType: file.type });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(path);

      // Save URL to profile
      await authFetch('/api/profile', {
        method: 'POST',
        body: JSON.stringify({ avatar_url: publicUrl }),
      });

      setAvatarUrl(publicUrl);
    } catch (err) {
      setError('Could not upload photo. Make sure the "avatars" storage bucket exists in Supabase.');
      setAvatarPreview(null);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const res = await authFetch('/api/profile', {
        method: 'POST',
        body: JSON.stringify({ display_name: displayName, language }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save.');
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const currentAvatar = avatarPreview || avatarUrl;
  const initials = user?.email?.[0]?.toUpperCase() || '?';

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <h1 className="text-lg font-semibold text-foreground mb-1">Profile</h1>
      <p className="text-sm text-muted-foreground mb-6">Manage your account settings.</p>

      {fetching ? (
        <p className="text-xs text-muted-foreground">Loading…</p>
      ) : (
        <form onSubmit={handleSave}>
          <div className="bg-card border border-border/60 rounded-2xl overflow-hidden">

            {/* Avatar row */}
            <Row
              label="Photo"
              sublabel={uploadingAvatar ? 'Uploading…' : 'Tap to change'}
            >
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploadingAvatar}
                className="relative w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-secondary to-muted border border-border/60 flex items-center justify-center active:opacity-70 transition-opacity"
              >
                {currentAvatar ? (
                  <img src={currentAvatar} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-base font-semibold text-foreground select-none">{initials}</span>
                )}
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 active:opacity-100 transition-opacity rounded-full">
                  <CameraIcon />
                </div>
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                capture="user"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </Row>

            <Separator />

            {/* Name row */}
            <div className="px-4 py-4">
              <p className="text-sm text-foreground mb-2">Name</p>
              <input
                type="text"
                placeholder="Your name"
                value={displayName}
                onChange={(e) => { setSaved(false); setDisplayName(e.target.value); }}
                className="w-full bg-background border border-input rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <p className="text-xs text-muted-foreground mt-1.5">
                Email: <span className="text-foreground/70">{user?.email}</span>
              </p>
            </div>

            <Separator />

            {/* Language row */}
            <Row label="Language" sublabel="Interface language">
              <div className="flex rounded-xl overflow-hidden border border-input">
                {['en', 'es'].map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => setLanguage(lang)}
                    className={`px-4 py-1.5 text-xs font-medium transition-colors select-none ${
                      language === lang
                        ? 'bg-foreground text-background'
                        : 'bg-background text-muted-foreground active:bg-secondary'
                    }`}
                  >
                    {lang === 'en' ? 'EN' : 'ES'}
                  </button>
                ))}
              </div>
            </Row>

            <Separator />

            {/* Notifications row */}
            <Row label="Notifications" sublabel="Coming soon">
              <div className="w-10 h-6 rounded-full bg-border/50 flex items-center px-0.5 opacity-40 cursor-not-allowed">
                <div className="w-5 h-5 rounded-full bg-muted-foreground" />
              </div>
            </Row>
          </div>

          {error  && <p className="text-xs text-red-400 mt-3 px-1">{error}</p>}
          {saved  && <p className="text-xs text-mint mt-3 px-1">Saved ✓</p>}

          <button
            type="submit"
            disabled={saving || !displayName.trim()}
            className="w-full mt-4 bg-foreground text-background rounded-xl py-3 text-sm font-medium active:opacity-70 transition-opacity disabled:opacity-40"
          >
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </form>
      )}
    </div>
  );
}

function CameraIcon() {
  return (
    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
    </svg>
  );
}
