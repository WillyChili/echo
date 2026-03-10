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

// OAuth callback bridge for Android — user taps button to open app (bypasses MIUI background launch restriction)
app.get('/auth/callback', (req, res) => {
  const qs = require('querystring');
  const params = req.query;
  const deepLink = 'com.willychili.echo://login?' + qs.stringify(params);

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
  h1{font-size:22px;font-weight:600;margin-bottom:8px}
  p{color:#888;font-size:14px;margin-bottom:32px}
  a{display:inline-block;background:#2dd4a0;color:#0a0a0a;text-decoration:none;
    padding:16px 40px;border-radius:14px;font-weight:600;font-size:17px}
</style>
</head><body>
<h1>Almost there!</h1>
<p>Tap the button to finish signing in to Echo.</p>
<a href="${deepLink}">Open Echo</a>
</body></html>`);
});

// Allow any origin in dev (phone, tablet, etc.)
app.use(cors({ origin: true }));
app.use(express.json({ limit: '2mb' }));

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
