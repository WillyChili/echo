# Twitter Posts — 2026-09-21

Three versions promoting recent Echo development: AI personality rewrite, weekly digest overhaul, voice input improvements, landing page with Play Store CTAs, and the overall vision.

---

## Version 1 — Short

Building an AI journaling app called Echo.

You write notes. Echo reads them, learns your context, and answers from your own words.

Now on Android (beta). Free.

play.google.com/store/apps/details?id=com.willychili.echo

---

## Version 2 — Medium

Shipping updates to Echo, my AI journaling companion for Android.

Recent work:
- Rewrote the AI personality from scratch. Less generic, more direct. Echo now references your actual notes instead of giving vague advice.
- Weekly digest got a full overhaul. Structured format with a "Reflexion" section that pulls from real entries, not abstract themes.
- Voice input stops recording when you save. Small fix, big difference.

Still in beta, still free. If you journal or want to start, give it a shot.

play.google.com/store/apps/details?id=com.willychili.echo

---

## Version 3 — Long

I've been building Echo for a few months now. It's an AI journaling app for Android, and I want to share what's been happening.

The idea is simple: you write notes (text or voice), and Echo, your AI companion, reads everything you've shared. When you chat with it, every answer comes from your own words. No generic advice. No hallucinated context. Just your notes, reflected back with clarity.

Here's what I shipped recently:

1. Full AI rewrite. Echo's personality was too safe and generic. I rewrote the identity, voice, and response style so it speaks clearly, can disagree with you, and references specific things you wrote — not interpretations of them.

2. Weekly digest overhaul. I iterated on this a lot. The digest now has structured sections with concrete topics from your notes and a "Reflexion" that reads like a thoughtful friend, not a motivational poster. It covers your whole week, not just the last entry.

3. Voice input polish. Recording now stops automatically when you tap save. Language toggle (EN/ES) sits right inside the text area. Small UX wins that make daily use smoother.

4. Landing page went live with real Play Store links. Dither shader background, bilingual support, the whole thing.

Stack: React + Vite frontend, Node/Express backend on Railway, Supabase for auth and data, Claude Haiku for AI. Capacitor wraps it for Android.

It's free in beta (10 chats/day, unlimited notes, weekly digest). Pro plan coming soon with unlimited chats and custom AI personality.

If you journal or think about starting, I'd genuinely appreciate you trying it out and telling me what breaks.

play.google.com/store/apps/details?id=com.willychili.echo
