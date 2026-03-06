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

// OAuth callback bridge for Android (Chrome Custom Tab → intent:// → appUrlOpen)
app.get('/auth/callback', (req, res) => {
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
  a#btn{display:none;background:#2dd4a0;color:#0a0a0a;text-decoration:none;
    padding:14px 36px;border-radius:14px;font-weight:600;font-size:16px}
  a#btn.show{display:inline-block}
</style>
</head><body>
<h1>Signing in to Echo…</h1>
<p id="sub">This window should close automatically.</p>
<a id="btn">Open Echo</a>
<script>
(function () {
  var s = window.location.search;
  var h = window.location.hash;
  var android = /android/i.test(navigator.userAgent);
  var url = (android && s)
    ? 'intent://login' + s + '#Intent;scheme=com.willychili.echo;package=com.willychili.echo;end'
    : 'com.willychili.echo://login' + s + h;

  document.getElementById('btn').href = url;

  // Try automatic redirect first (works on some Chrome versions)
  try { window.location.replace(url); } catch (e) {}

  // After 2 s, show tap button as fallback (user-initiated click always works)
  setTimeout(function () {
    document.getElementById('sub').textContent = 'Tap below to open the app:';
    document.getElementById('btn').className = 'show';
  }, 2000);
})();
</script>
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
