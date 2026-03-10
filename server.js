require('dotenv').config({ override: true });
const express = require('express');
const cors = require('cors');

const notesRouter    = require('./server/routes/notes');
const chatRouter     = require('./server/routes/chat');
const messagesRouter = require('./server/routes/messages');
const profileRouter  = require('./server/routes/profile');
const digestRouter   = require('./server/routes/digest');
const pushRouter     = require('./server/routes/push');
const accountRouter  = require('./server/routes/account');

const path = require('path');

const app  = express();
const PORT = process.env.PORT || 3001;

// Serve static pages (privacy policy, terms of service)
app.use(express.static(path.join(__dirname, 'public')));

// Android App Links verification (express.static skips dotfile dirs by default)
app.get('/.well-known/assetlinks.json', (req, res) => {
  res.json([{
    relation: ['delegate_permission/common.handle_all_urls'],
    target: {
      namespace: 'android_app',
      package_name: 'com.willychili.echo',
      sha256_cert_fingerprints: [
        // Debug key (Android Studio wireless debug)
        '06:1B:1C:D8:30:11:88:0C:37:E3:34:B0:6B:D5:FA:D3:D4:64:A6:84:65:27:66:1E:72:2F:96:0F:CE:31:85:ED',
        // App signing key (Google Play signs distributed APKs with this key)
        '80:96:3B:CB:C6:1C:43:9D:9A:7F:8B:FD:E2:4B:49:DB:92:1C:5C:B6:A4:28:FA:C9:F5:45:C4:20:1F:8B:15:59'
      ]
    }
  }]);
});

// Allow any origin — must be before ALL routes so /auth/pending gets CORS headers
app.use(cors({ origin: true }));
app.use(express.json({ limit: '2mb' }));

// ── OAuth polling store ───────────────────────────────────────────────────────
// Maps session_id → { code, createdAt }. The Android app polls /auth/pending
// after opening the browser — no deep links or Intent URIs needed.
const pendingAuth = new Map();

// Clean up expired entries every 60 s (TTL = 5 min)
setInterval(() => {
  const now = Date.now();
  for (const [id, entry] of pendingAuth) {
    if (now - entry.createdAt > 5 * 60 * 1000) pendingAuth.delete(id);
  }
}, 60 * 1000);

// OAuth callback — Supabase redirects here after Google auth
app.get('/auth/callback', (req, res) => {
  const { session_id, code } = req.query;
  if (session_id && code) {
    pendingAuth.set(session_id, { code, createdAt: Date.now() });
  }

  res.setHeader('Content-Type', 'text/html');
  res.send(`<!DOCTYPE html>
<html><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Echo – Sign in</title>
<style>
  body{margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
    background:#0a0a0a;color:#fff;display:flex;flex-direction:column;
    align-items:center;justify-content:center;min-height:100vh;padding:24px;text-align:center}
  h1{font-size:22px;font-weight:600;margin:0 0 12px}
  p{color:#aaa;font-size:15px;margin:0 0 32px}
  .dots{display:flex;gap:8px;justify-content:center}
  .dot{width:8px;height:8px;background:#2dd4a0;border-radius:50%;
    animation:pulse 1.2s ease-in-out infinite}
  .dot:nth-child(2){animation-delay:.2s}
  .dot:nth-child(3){animation-delay:.4s}
  @keyframes pulse{0%,80%,100%{transform:scale(.6);opacity:.4}40%{transform:scale(1);opacity:1}}
</style>
</head><body>
<h1>Signed in!</h1>
<p>Return to the Echo app to continue.</p>
<div class="dots"><div class="dot"></div><div class="dot"></div><div class="dot"></div></div>
</body></html>`);
});

// App polls this every 2 s while browser is open
app.get('/auth/pending', (req, res) => {
  const { session_id } = req.query;
  if (!session_id) return res.status(400).json({ error: 'missing session_id' });

  const entry = pendingAuth.get(session_id);
  if (!entry || Date.now() - entry.createdAt > 5 * 60 * 1000) {
    pendingAuth.delete(session_id);
    return res.json({ pending: true });
  }

  pendingAuth.delete(session_id); // single-use
  res.json({ code: entry.code });
});

// (cors and express.json already applied above)

app.use('/api/notes',    notesRouter);
app.use('/api/chat',     chatRouter);
app.use('/api/messages', messagesRouter);
app.use('/api/profile',  profileRouter);
app.use('/api/digest',   digestRouter);
app.use('/api/push',     pushRouter);
app.use('/api/account',  accountRouter);

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => {
  console.log(`Echo server running on http://localhost:${PORT}`);
});
