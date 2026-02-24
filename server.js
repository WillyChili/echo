require('dotenv').config({ override: true });
const express = require('express');
const cors = require('cors');

const notesRouter = require('./server/routes/notes');
const chatRouter = require('./server/routes/chat');

const app = express();
const PORT = process.env.PORT || 3001;

// Allow any local-network origin in dev (phone, tablet, etc.)
app.use(cors({ origin: true }));
app.use(express.json({ limit: '2mb' })); // notes payload can be large

app.use('/api/notes', notesRouter);
app.use('/api/chat', chatRouter);

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Temp: serve mkcert root CA for mobile install
app.get('/rootCA.pem', (req, res) => {
  res.download('C:/Users/charl/AppData/Local/mkcert/rootCA.pem', 'rootCA.pem');
});

app.listen(PORT, () => {
  console.log(`Echo server running on http://localhost:${PORT}`);
});
