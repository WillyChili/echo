# Echo — Personal Journaling & AI Companion

Echo is a minimal, dark-mode journaling app with an AI companion that learns from your writing and mirrors your own voice back to you.

---

## Features

- **Daily Notes** — Write freely every day. Auto-saves as you type.
- **Voice Input** — Click the mic button to dictate using your browser's built-in speech recognition.
- **Past Entries** — Click any past day in the sidebar to view or edit it.
- **Echo AI Chat** — Talk to an AI that has read all your notes and responds *in your voice*, not like a generic assistant.

---

## Prerequisites

- **Node.js v18 or later** (v20+ recommended)
- An **Anthropic API key** — get one at [console.anthropic.com](https://console.anthropic.com)

---

## Setup

### 1. Clone / download the project

```bash
cd echo-app
```

### 2. Add your API key

Open `.env` in the project root and replace the placeholder:

```env
ANTHROPIC_API_KEY=sk-ant-...your-key-here...
PORT=3001
```

### 3. Install dependencies

```bash
npm install
npm --prefix client install
```

### 4. Seed the database (optional but recommended)

This adds 3 example journal entries so Echo has something to learn from on day one:

```bash
npm run seed
```

### 5. Start the app

```bash
npm run dev
```

This starts both the Express server (port 3001) and the Vite dev server (port 5173) concurrently.

Open your browser to: **http://localhost:5173**

---

## Project Structure

```
echo-app/
├── server.js               # Express entry point
├── server/
│   ├── db.js               # SQLite setup (better-sqlite3)
│   ├── seed.js             # Seeds 3 example notes
│   └── routes/
│       ├── notes.js        # GET/POST /api/notes
│       └── chat.js         # POST /api/chat (calls Claude)
├── client/                 # Vite + React frontend
│   ├── src/
│   │   ├── App.jsx
│   │   ├── pages/
│   │   │   ├── TodayPage.jsx   # Daily notes page
│   │   │   └── ChatPage.jsx    # Echo chat page
│   │   ├── components/
│   │   │   ├── Nav.jsx
│   │   │   └── MicButton.jsx
│   │   └── hooks/
│   │       └── useSpeech.js    # Web Speech API hook
│   └── vite.config.js      # Proxies /api → localhost:3001
├── echo.db                 # SQLite database (auto-created)
└── .env                    # API key goes here
```

---

## How Echo Learns

Every time you open the chat, Echo fetches **all** your notes and sends them to Claude as context. The system prompt instructs Claude to:

- Mirror your writing style (sentence length, vocabulary, tone)
- Reflect your emotional patterns and recurring themes
- Reference specific past entries naturally
- Respond as your inner voice — not as a therapist or assistant

The more you write, the better Echo sounds like you.

---

## Voice Input

Voice input uses the **Web Speech API** — built into Chrome and Edge. No external service or API key needed.

- Click the mic button to start recording
- Speak naturally; text appends in real-time
- Click again (or the stop button) to stop
- If permission is denied, you'll see a clear error message
- Firefox does not support the Web Speech API — voice input will be disabled automatically

---

## Troubleshooting

**`better-sqlite3` fails to install on Windows**
If you see a native build error, install the latest version:
```bash
npm install better-sqlite3@latest
```
v12+ includes prebuilt binaries for Node.js 18–24.

**Claude API errors in chat**
- Make sure `ANTHROPIC_API_KEY` in `.env` is valid
- The server must be running (`npm run dev` or `npm run server`)
- Errors are shown inline in the chat UI — the app won't crash

**Port conflicts**
- Server defaults to 3001 — change `PORT` in `.env`
- Client runs on 5173 — change in `client/vite.config.js`

---

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start both server and client |
| `npm run server` | Start Express server only |
| `npm run client` | Start Vite dev server only |
| `npm run seed` | Populate DB with example notes |
| `npm --prefix client run build` | Build client for production |
