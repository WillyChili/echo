import { useState, useEffect } from 'react';
import { authFetch } from '../lib/api';

export default function SettingsPage() {
  const [apiKey, setApiKey]   = useState('');
  const [saved, setSaved]     = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError]     = useState(null);

  // Load existing key on mount (masked)
  useEffect(() => {
    authFetch('/api/settings')
      .then((r) => r.json())
      .then((d) => { if (d.hasApiKey) setApiKey('••••••••••••••••••••'); })
      .catch(() => {})
      .finally(() => setFetching(false));
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!apiKey || apiKey.startsWith('•')) return;
    setLoading(true);
    setError(null);
    setSaved(false);

    try {
      const res = await authFetch('/api/settings', {
        method: 'POST',
        body: JSON.stringify({ apiKey }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save.');
      setSaved(true);
      setApiKey('••••••••••••••••••••');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = async () => {
    setLoading(true);
    setError(null);
    try {
      await authFetch('/api/settings', { method: 'DELETE' });
      setApiKey('');
      setSaved(false);
    } catch {
      setError('Failed to remove key.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-10">
      <h1 className="text-lg font-semibold text-foreground mb-1">Settings</h1>
      <p className="text-sm text-muted-foreground mb-8">Manage your Echo preferences.</p>

      {/* BYOK */}
      <div className="bg-card border border-border/60 rounded-2xl p-5">
        <h2 className="text-sm font-medium text-foreground mb-1">Your Anthropic API Key</h2>
        <p className="text-xs text-muted-foreground mb-4">
          Bring your own key so Echo uses your Anthropic account directly. If left empty, Echo uses the shared server key.
        </p>

        {fetching ? (
          <p className="text-xs text-muted-foreground">Loading…</p>
        ) : (
          <form onSubmit={handleSave} className="flex flex-col gap-3">
            <input
              type="text"
              placeholder="sk-ant-api03-…"
              value={apiKey}
              onFocus={() => { if (apiKey.startsWith('•')) setApiKey(''); }}
              onChange={(e) => { setSaved(false); setApiKey(e.target.value); }}
              className="w-full bg-background border border-input rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring font-mono"
            />

            {error && <p className="text-xs text-red-400">{error}</p>}
            {saved && <p className="text-xs text-green-400">API key saved ✓</p>}

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={loading || !apiKey || apiKey.startsWith('•')}
                className="flex-1 bg-foreground text-background rounded-xl py-2.5 text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-40"
              >
                {loading ? 'Saving…' : 'Save key'}
              </button>
              <button
                type="button"
                onClick={handleClear}
                disabled={loading}
                className="px-4 bg-destructive/20 text-red-400 border border-destructive/40 rounded-xl text-sm hover:bg-destructive/30 transition-colors disabled:opacity-40"
              >
                Remove
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
