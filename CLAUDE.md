# Echo App — Claude Code Guide

## Project Overview

Echo is an AI journaling app for Android (Capacitor). Users write daily notes and chat with Echo, an AI companion that knows their context. Freemium model:

- **Free:** 10 chats/day, unlimited notes, 1 weekly digest (fixed)
- **Pro ($5/mo):** Unlimited chats, custom Echo personality, personalizable digest, digest by email

---

## Stack

| Layer | Tech | Details |
|-------|------|---------|
| Frontend | React + Vite | Port 5173, folder `/client` |
| Backend | Node/Express | Port 3001, entry `server.js` at root |
| Database | Supabase | Tables: `profiles`, `chat_messages`, `notes` |
| AI | Claude Haiku 4.5 | `claude-haiku-4-5-20251001` via Anthropic API |
| Auth | Supabase Google OAuth | Server-side polling, no deep links, no Intent URIs |
| Push | Firebase FCM | `firebase-admin` on server |
| Email | Resend | Weekly digests |
| Payments | RevenueCat | Capacitor plugin, currently disabled in prod |
| Mobile | Capacitor Android | App ID: `com.willychili.echo` |
| Deploy (backend) | Railway | `https://echo-production-c241.up.railway.app` |

---

## Commands

```bash
# Full dev (server + client concurrently)
npm run dev

# Backend only
npm run server

# Frontend only (from project root)
node client/node_modules/vite/bin/vite.js --port 5173 --host

# Cloudflare tunnel (URL changes on every restart)
cloudflared tunnel --url http://localhost:5173

# Install all dependencies (root + client)
npm run install:all

# Android build
cd client && npm run build:android
```

---

## Key Files

### Backend
- `server.js` — Express entry point. Middleware order is critical: `cors()` MUST come before all routes.
- `server/echo-soul.js` — Echo's personality. Exports `buildSystemPrompt(user, notes)`. Tone variants layer on top of base personality.
- `server/routes/chat.js` — `POST /api/chat`. Uses last 20 messages + all notes as context. Calls Claude Haiku.
- `server/routes/messages.js` — `GET /api/messages`. Cursor-based pagination (50 msgs/page, `?before=timestamp`).
- `server/routes/digest.js` — Weekly summaries via Claude + email via Resend.
- `server/routes/speech.js` — `POST /api/speech/cleanup`. Adds punctuation only. Never changes words.
- `server/middleware/auth.js` — Validates Supabase JWT. Sets `req.user`.
- `server/middleware/freemium.js` — Blocks chat at 10/day for Free users. **Fails open** (never blocks on error).

### Frontend
- `client/src/App.jsx` — Router setup, protected routes, auth flow.
- `client/src/lib/translations.js` — All EN/ES strings (200+ keys). Always add both languages.
- `client/src/lib/api.js` — Axios instance. All `/api` calls go through here.
- `client/src/pages/TodayPage.jsx` — Notes manager, largest file (30KB). Date picker, voice input.
- `client/src/pages/ChatPage.jsx` — Chat UI with infinite scroll (load more on scroll up).
- `client/src/pages/OnboardingPage.jsx` — 3-step flow: name → notes → echo.
- `client/src/pages/SettingsPage.jsx` — Settings with Pro gates on tone and digest.
- `client/src/context/ProfileContext.jsx` — Subscription state, RevenueCat integration.
- `client/src/context/AuthContext.jsx` — Supabase session, polling recovery.
- `client/src/components/UpgradeModal.jsx` — Reusable freemium upgrade prompt.

### Animations
- `client/src/animations/echo.json` — Custom Lottie: mint pulse, 3 rings (Echo mascot).
- `client/src/animations/notes.json` — Character with sound waves.

---

## Architecture Patterns

### Google OAuth Flow (Android)
1. App generates `session_id` → calls `signInWithOAuth(redirectTo: Railway/auth/callback?session_id=XXX)`
2. Opens browser via `Browser.open()`
3. App polls `GET /auth/pending?session_id=XXX` every 2s
4. Server returns one-time code → app calls `exchangeCodeForSession(code)`
5. Browser closes, user is logged in
6. If app dies mid-auth: `session_id` in localStorage → AuthPage resumes polling on reopen

### Chat Request Flow
```
POST /api/chat
  → auth middleware (validates JWT)
  → freemium middleware (checks 10/day limit)
  → fetch last 20 messages + user bio from Supabase
  → buildSystemPrompt(user, notes)
  → Claude Haiku API call
  → save user message + Echo response to Supabase
  → increment daily chat counter
```

### Freemium Gates
- Chat: `server/middleware/freemium.js` (server-side)
- Digest customization: `SettingsPage.jsx` (client-side gate, Pro only)
- Echo tone/personality: `SettingsPage.jsx` (Pro only)

---

## Conventions & Rules

- **No em dashes (—)** in any app text (onboarding, descriptions, placeholders). Use period or comma instead.
- **CORS before routes**: In `server.js`, `app.use(cors())` must appear before any route that needs it.
- **Echo personality**: Never replace `echo-soul.js` base prompt. Tone variants only overlay on top.
- **Speech cleanup**: Only add punctuation. Never change, remove, or add words.
- **RevenueCat**: `Purchases.configure()` block in `client/src/main.jsx` is commented out. Do NOT uncomment without a production key (test keys show "Wrong API Key" dialog and crash the app).
- **Translations**: Every new string must be added to both `en` and `es` objects in `translations.js`.
- **Supabase admin client** (`server/supabase.js`) uses `SUPABASE_SERVICE_ROLE_KEY` and bypasses RLS. Server-side only, never expose to client.

---

## Environment Variables

### Server (`.env` at root)
```
PORT=3001
ANTHROPIC_API_KEY=sk-ant-...
RESEND_API_KEY=re_...
FIREBASE_SERVICE_ACCOUNT_JSON={...}
SUPABASE_URL=https://vivogpsftiuxmpeongto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
SUPABASE_ANON_KEY=eyJ...
```

### Client (Vite, `.env.local` in `/client`)
```
VITE_API_URL=https://echo-production-c241.up.railway.app
VITE_SUPABASE_URL=https://vivogpsftiuxmpeongto.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

---

## Deploy

- **Backend:** Railway — `https://echo-production-c241.up.railway.app`
- **Frontend:** Capacitor Android only (no separate web deploy)
  - Build: `cd client && npm run build:android`
  - `capacitor.config.json` has no `server` block (uses Railway in prod)
  - `VITE_API_URL` must point to Railway in the build
- **Keystore:** `C:\Users\charl\Documents\echo-release-v2.keystore` (alias: `upload`)
- **AAB:** `client/android/app/release/app-release.aab`

---

## Pending / Known Issues

- **RevenueCat production key:** Configure at `app.revenuecat.com` → Project Settings → API Keys. Replace `'YOUR_PRODUCTION_KEY_HERE'` in `client/src/main.jsx`. Also check `UpgradeModal.jsx` and `ProfileContext.jsx`.
- **Play Store AAB:** Must regenerate with `echo-release-v2.keystore` (old keystore SHA1 `A5:79:DC` won't work after upload key reset).
- **Cloudflare tunnel URL:** Changes on every `cloudflared` restart. Update Supabase redirect URLs if needed.
- **Google OAuth login fails for new users:** Si un usuario no puede loguearse con Google, verificar que su URL de acceso esté whitelisteada en Supabase > Authentication > URL Configuration > Redirect URLs.

## Branches en espera (no mergear a main)

- **`claude/check-undeployed-changes-4Hmlf`** — Cambios del frontend que están en evaluación. No mergear a main todavía. El APK se construye siempre desde main, así que estos cambios no llegan a la app mientras no se mergeen.

---

## Recent Changes

_Last updated: 2026-03-19_

- landing: storytelling refactor, contrast fixes, Trust section, functional CTAs
- Add landing page (Vite + React + Tailwind)
- chore: bump versionCode 40 → 41
- fix(chat+speech): auto-grow input to 3 lines; restrict Haiku to punctuation-only
- fix(visualizer): enable audio wave on web, disable only on Android
- feat(mic): improve notes mic button — mint idle state, spinner while cleaning, press scale
- feat(speech): post-process STT transcript with Claude Haiku on stop
- chore: bump versionCode 39 → 40
- fix(speech): move ES/EN toggle inside textarea — bottom left, same row as Guardar
- feat(speech): independent speech language toggle (ES/EN pill) persisted in localStorage

_This section is auto-updated daily by `scripts/update-claude-md.js`_
