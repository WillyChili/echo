# Echo App - Twitter Posts (2026-08-14)

Based on recent changes: Play Store CTAs live, AI personality rewrite, weekly digest overhaul, UX polish, voice notes improvements, landing page updates.

---

## POST 1 - Short

Echo is live on the Play Store.

An AI journaling app that actually remembers what you write. Voice or text, English or Spanish. Free to use.

https://play.google.com/store/apps/details?id=com.willychili.echo

#buildinpublic #indiedev #android

---

## POST 2 - Medium

Building an AI journal app as a solo dev, and the last few months have been wild.

What changed recently:
- Rewrote Echo's entire AI personality from scratch. Less generic, more like talking to someone who actually read your notes.
- Overhauled the weekly digest. It now references specific things you wrote instead of vague motivational fluff.
- Voice notes stop recording properly when you save. Sounds small, works huge.
- Landing page CTAs now link straight to the Play Store.

Still in beta. Still free. Still learning.

https://play.google.com/store/apps/details?id=com.willychili.echo

#buildinpublic #indiedev #android #ai

---

## POST 3 - Long

I've been building Echo for months now and I want to share where things are at.

Echo is an AI journaling app for Android. You write notes (voice or text), and Echo reads them, learns your context, and lets you chat about anything you've written. It also sends you a weekly digest summarizing your week.

Here's what I shipped recently:

AI rewrite. Echo used to sound like every other chatbot. I rewrote the entire identity, voice, and response style. Now it references the actual things you wrote, disagrees when your reasoning is weak, and keeps responses between 2-4 sentences. No empty validation, no "that's a great point!" filler.

Weekly digest overhaul. The digest went through maybe 10 iterations. It used to be generic self-help paragraphs. Now it pulls concrete topics from your notes and adds a short reflection that actually says something useful. If it doesn't have enough to say, it stays short instead of padding.

UX cleanup. Settings save silently in the background. Chat scrolls to the bottom instantly. Notes sort correctly. The "new note" button is gone because you never needed it. Small fixes that make the whole app feel tighter.

Landing page is live. Play Store links work. You can download it right now.

The stack: React + Capacitor for the app, Node/Express backend on Railway, Claude Haiku for AI, Supabase for auth and data. Solo dev, building in public.

It's free. It's in beta. I'd love feedback.

https://play.google.com/store/apps/details?id=com.willychili.echo

#buildinpublic #indiedev #android #ai #solodev
