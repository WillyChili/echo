import { useState, useEffect } from 'react';
import { authFetch } from '../lib/api';
import { useAuth } from '../context/AuthContext';

export default function EditProfilePage() {
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [saved, setSaved]     = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    authFetch('/api/profile')
      .then((r) => r.json())
      .then((d) => { if (d.display_name) setDisplayName(d.display_name); })
      .catch(() => {})
      .finally(() => setFetching(false));
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSaved(false);
    try {
      const res = await authFetch('/api/profile', {
        method: 'POST',
        body: JSON.stringify({ display_name: displayName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save.');
      setSaved(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-10">
      <h1 className="text-lg font-semibold text-foreground mb-1">Edit Profile</h1>
      <p className="text-sm text-muted-foreground mb-8">Update your display name.</p>

      <div className="bg-card border border-border/60 rounded-2xl p-5">
        <p className="text-xs text-muted-foreground mb-4">Email: <span className="text-foreground">{user?.email}</span></p>

        {fetching ? (
          <p className="text-xs text-muted-foreground">Loading…</p>
        ) : (
          <form onSubmit={handleSave} className="flex flex-col gap-3">
            <input
              type="text"
              placeholder="Your name"
              value={displayName}
              onChange={(e) => { setSaved(false); setDisplayName(e.target.value); }}
              className="w-full bg-background border border-input rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            {error && <p className="text-xs text-red-400">{error}</p>}
            {saved && <p className="text-xs text-green-400">Saved ✓</p>}
            <button
              type="submit"
              disabled={loading || !displayName.trim()}
              className="w-full bg-foreground text-background rounded-xl py-2.5 text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-40"
            >
              {loading ? 'Saving…' : 'Save'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
