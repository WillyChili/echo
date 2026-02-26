import { useState, useEffect, useRef } from 'react';
import { authFetch } from '../lib/api';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../context/ProfileContext';
import { useTranslation } from '../hooks/useTranslation';

// ── Individual field card (Instagram-style) ──────────────────────────────────
function Field({ label, children }) {
  return (
    <div className="bg-card border border-border/50 rounded-2xl px-4 py-3">
      <p className="text-[11px] text-muted-foreground mb-0.5 select-none">{label}</p>
      {children}
    </div>
  );
}

export default function EditProfilePage() {
  const { user } = useAuth();
  const { language, setLanguage, bio: profileBio, setBio: setProfileBio, setAvatarUrl: setProfileAvatarUrl, refreshProfile } = useProfile();
  const { t } = useTranslation();
  const fileRef = useRef(null);

  const [displayName, setDisplayName]     = useState('');
  const [bio, setBio]                     = useState('');
  const [avatarUrl, setAvatarUrl]         = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [fetching, setFetching]           = useState(true);
  const [saving, setSaving]               = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [saved, setSaved]                 = useState(false);
  const [error, setError]                 = useState(null);

  // Seed bio from ProfileContext immediately (avoids empty field flash)
  useEffect(() => {
    if (profileBio) setBio(profileBio);
  }, [profileBio]);

  useEffect(() => {
    authFetch('/api/profile')
      .then((r) => r.json())
      .then((d) => {
        if (d.display_name) setDisplayName(d.display_name);
        if (d.avatar_url)   setAvatarUrl(d.avatar_url);
        if (d.bio)          setBio(d.bio);
        // language is managed in ProfileContext
      })
      .catch(() => {})
      .finally(() => setFetching(false));
  }, []);

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => setAvatarPreview(ev.target.result);
    reader.readAsDataURL(file);

    setUploadingAvatar(true);
    setError(null);
    try {
      const path = `${user.id}/avatar`;
      const contentType = file.type || 'image/jpeg';
      const arrayBuffer = await file.arrayBuffer();
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, arrayBuffer, { upsert: true, contentType });
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(path);

      // Append cache-busting timestamp so the browser always fetches the new image
      const cacheBustedUrl = `${publicUrl}?t=${Date.now()}`;

      const res = await authFetch('/api/profile', {
        method: 'POST',
        body: JSON.stringify({ avatar_url: cacheBustedUrl }),
      });
      if (!res.ok) throw new Error('Failed to save avatar');

      // Update both local state and ProfileContext so Nav refreshes immediately
      setAvatarUrl(cacheBustedUrl);
      setProfileAvatarUrl(cacheBustedUrl);
    } catch {
      setError(t('edit_profile_photo_error'));
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
        body: JSON.stringify({ display_name: displayName, language, bio }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save.');
      setSaved(true);
      setProfileBio(bio); // sync bio to context
      refreshProfile(); // sync Nav display name
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
    <div className="px-3 py-8">
      {/* Title */}
      <h1 className="text-base font-semibold text-foreground text-center mb-7">{t('edit_profile_title')}</h1>

      {fetching ? (
        <p className="text-xs text-muted-foreground text-center">{t('edit_profile_loading')}</p>
      ) : (
        <form onSubmit={handleSave} className="flex flex-col gap-6">

          {/* ── Avatar ─────────────────────────────────────────────────────── */}
          <div className="flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploadingAvatar}
              className="relative w-20 h-20 rounded-full overflow-hidden bg-gradient-to-br from-secondary to-muted border border-border/50 flex items-center justify-center active:opacity-75 transition-opacity"
            >
              {currentAvatar
                ? <img src={currentAvatar} alt="avatar" className="w-full h-full object-cover" />
                : <span className="text-2xl font-semibold text-foreground select-none">{initials}</span>
              }
              {/* Camera overlay on press */}
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-full opacity-0 active:opacity-100 transition-opacity">
                <CameraIcon />
              </div>
            </button>

            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploadingAvatar}
              className="text-sm text-mint font-medium active:opacity-70 transition-opacity"
            >
              {uploadingAvatar ? t('edit_profile_uploading') : t('edit_profile_edit_photo')}
            </button>

            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>

          {/* ── Fields ─────────────────────────────────────────────────────── */}
          <div className="flex flex-col gap-3">

            <Field label={t('edit_profile_name')}>
              <input
                type="text"
                placeholder={t('edit_profile_name_placeholder')}
                value={displayName}
                onChange={(e) => { setSaved(false); setDisplayName(e.target.value); }}
                className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none"
              />
            </Field>

            <Field label={t('edit_profile_bio')}>
              <textarea
                placeholder={t('edit_profile_bio_placeholder')}
                value={bio}
                onChange={(e) => { setSaved(false); setBio(e.target.value); }}
                rows={3}
                className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none resize-none leading-relaxed"
              />
            </Field>

            <Field label={t('edit_profile_email')}>
              <p className="text-sm text-foreground/50">{user?.email}</p>
            </Field>

            <Field label={t('edit_profile_language')}>
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground">
                  {language === 'en' ? 'English' : 'Español'}
                </span>
                <div className="flex rounded-lg overflow-hidden border border-border/50">
                  {['en', 'es'].map((lang) => (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => { setLanguage(lang); }}
                      className={`px-3 py-1 text-xs font-medium transition-colors select-none ${
                        language === lang
                          ? 'bg-foreground text-background'
                          : 'bg-transparent text-muted-foreground active:bg-secondary'
                      }`}
                    >
                      {lang.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            </Field>

            <Field label={t('edit_profile_notifications')}>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground/50">{t('edit_profile_coming_soon')}</span>
                {/* disabled toggle */}
                <div className="w-10 h-6 rounded-full bg-border/40 flex items-center px-0.5 opacity-40 cursor-not-allowed">
                  <div className="w-5 h-5 rounded-full bg-muted-foreground" />
                </div>
              </div>
            </Field>

          </div>

          {/* ── Feedback ───────────────────────────────────────────────────── */}
          {error && <p className="text-xs text-red-400 px-1">{error}</p>}
          {saved && <p className="text-xs text-mint px-1">{t('edit_profile_saved')}</p>}

          {/* ── Save button ────────────────────────────────────────────────── */}
          <button
            type="submit"
            disabled={saving || !displayName.trim()}
            className="w-full bg-foreground text-background rounded-xl py-3 text-sm font-medium active:opacity-70 transition-opacity disabled:opacity-40"
          >
            {saving ? t('edit_profile_saving') : t('edit_profile_save')}
          </button>
        </form>
      )}
    </div>
  );
}

function CameraIcon() {
  return (
    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
    </svg>
  );
}
