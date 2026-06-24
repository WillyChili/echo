# Echo Twitter Posts

3 versions per day (short, medium, long) to rotate throughout the week.
Tone: dev building in public, casual, direct.

---

## Day 1 — The Product

### Short
Building an AI journaling app. You write notes, Echo remembers them and brings them back when they matter. Android beta is live.

### Medium
I've been building Echo, an AI journaling app for Android.

The idea is simple: write whatever you want (a thought, a recipe, how your day went) and Echo learns your context over time. When you chat with it, it actually references your notes. Not generic AI answers.

Free tier gives you 10 chats/day and a weekly digest. Beta is live on the Play Store.

### Long
I've been building Echo for a few months now and wanted to share what it does.

It's an AI journaling app. You write daily notes (text or voice, English or Spanish) and Echo, your AI companion, reads them all. When you chat with it, it references specific things you've written. Not vague "sounds like you're growing" responses. Actual follow-ups: "You mentioned calling the accountant last week, did that happen?"

Every week you get a digest that pulls together your key topics and gives you a short reflection.

Free: 10 chats/day, unlimited notes, weekly digest.
Pro ($5/mo): unlimited chats, custom personality, digest by email.

Android beta is live. Link in bio.

---

## Day 2 — The Stack / Building in Public

### Short
Echo's stack: React + Vite frontend, Node/Express backend, Supabase for auth and data, Claude Haiku for the AI. Shipped on Android with Capacitor.

### Medium
People ask what Echo is built with, so here's the stack:

Frontend: React + Vite
Backend: Node/Express on Railway
Database + Auth: Supabase (Google OAuth)
AI: Claude Haiku 4.5 via Anthropic API
Voice: Web Speech API with AI punctuation cleanup
Mobile: Capacitor for Android

One person project. No team, no funding. Just building something I wanted to exist.

### Long
Sharing Echo's full tech stack for anyone curious about building an AI mobile app as a solo dev.

Frontend is React + Vite, wrapped in Capacitor for Android. Backend is Node/Express deployed on Railway. Supabase handles auth (Google OAuth with server-side polling, no deep links) and the database.

The AI runs on Claude Haiku 4.5. Every chat request pulls the last 20 messages + all your notes as context, so Echo actually knows what you've been writing about. Voice input goes through the Web Speech API and then through a second Haiku call that only adds punctuation, never changes your words.

Weekly digests are generated with Claude and sent via Resend. Push notifications through Firebase FCM.

The hardest part wasn't any single piece. It was making them all work together on a phone. Capacitor has its quirks.

Building in public because I think more people should see what solo dev actually looks like.

---

## Day 3 — Recent Improvements

### Short
Recent Echo updates: rewrote the AI personality to be more direct, added voice input with AI punctuation, and rebuilt the weekly digest from scratch. Small app, constant iteration.

### Medium
Last few weeks of Echo development:

Rewrote Echo's entire AI identity. Less therapist, more thoughtful companion. It references your actual notes now, not abstract patterns.

Added voice-to-text for notes with a Haiku-powered cleanup pass that adds punctuation without changing words.

Rebuilt the weekly digest 5+ times until it felt right. Structured format with key topics and a short reflection. No fluff.

Also: skeleton loading states, better navigation, bilingual support (EN/ES). Every detail matters when you're the only one building it.

### Long
I've been iterating on Echo pretty heavily. Here's what changed recently:

AI personality rewrite: Echo used to sound like every other AI, generic encouragement and open-ended questions. I rewrote the entire system prompt. Now it's direct, references specific things from your notes ("you mentioned X last Tuesday"), and only asks questions when they're concrete and useful. It can disagree with you if your reasoning is weak. That felt important.

Voice input: You can dictate notes now. The speech-to-text goes through a second AI pass that adds punctuation only. It never changes your words. Got the mic button to show a mint idle state, a spinner while cleaning, and a press animation.

Weekly digest: This one took 5+ rewrites. Started conversational, went too abstract. Added a psychologist lens, too weird. Landed on a structured format: key topics (concrete, from actual notes) + a short reflection that only offers help, never assumes your motivations.

Also shipped: better scroll behavior in chat, date sorting fixes, skeleton loaders for first-time users, silenced save confirmations, and moved the language selector to settings where it belongs.

Solo dev life is mostly just fixing the last thing you shipped.
