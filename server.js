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
<html><head><meta charset="utf-8"><title>Redirecting…</title></head>
<body>
<script>
(function () {
  var search = window.location.search; // e.g. ?code=abc&state=xyz
  var hash   = window.location.hash;  // e.g. #access_token=… (implicit flow)
  if (/android/i.test(navigator.userAgent)) {
    if (search) {
      // PKCE flow: code in query string → use intent:// (Chrome always dispatches these)
      window.location.replace(
        'intent://login' + search +
        '#Intent;scheme=com.willychili.echo;package=com.willychili.echo;end'
      );
    } else if (hash) {
      // Implicit flow: tokens in fragment → fall back to direct custom scheme
      window.location.replace('com.willychili.echo://login' + hash);
    } else {
      document.body.innerText = 'No auth params received.';
    }
  } else {
    // Non-Android (should not reach here in normal flow)
    window.location.replace('com.willychili.echo://login' + search + hash);
  }
})();
</script>
<p>Redirecting to Echo&hellip;</p>
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
