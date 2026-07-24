# Echo Twitter Posts — July 24, 2026

## Version 1: Short

Building an AI journaling app called Echo.

You write notes (voice or text), and Echo actually reads them. Then you can chat with it about your own thoughts. It answers from what you've shared, not generic advice.

Android beta is live.

---

## Version 2: Medium

I've been building Echo, an AI journaling companion for Android.

The idea is simple: write whatever's on your mind (voice or text), and Echo learns from it over time. Then you can ask it anything about your notes, your week, your patterns, and it answers from your own words. Not templated responses.

Latest work has been on the weekly digest. Echo now sends you a personal reflection based on everything you wrote that week. Concrete topics, not vague motivational stuff. It references your actual entries. Also rewrote the entire AI identity so conversations feel more natural, like talking to someone who's been paying attention.

Free to use. Pro unlocks unlimited chat and custom personality.

---

## Version 3: Long

Quick update on Echo, the AI journaling app I've been building solo.

Echo is a personal companion that lives inside a notes app. You write daily entries (type or speak), and it builds context from everything you share. Then you can chat with it, and every answer comes from your own words. No generic advice, no motivational quotes. Just your thoughts, reflected back with clarity.

Here's what I shipped recently:

- Rewrote Echo's entire AI identity and response style. Conversations are now direct and specific. It references actual note content instead of giving abstract interpretations. It can even push back if what you're saying contradicts what you wrote before.

- Rebuilt the weekly digest from scratch. It went through about 8 iterations. The digest now covers all your notes for the week with concrete topics and a personal reflection. No filler, no assumptions about your feelings, just practical observations from what you actually wrote.

- Polished the chat and notes UX. Instant scroll on chat load, better note sorting, cleaner navigation. Small things that add up.

- Voice input cleanup now runs through Claude Haiku to add punctuation without changing your words. Write the way you talk.

The stack: React + Vite frontend, Node/Express backend, Supabase for data, Claude Haiku for AI, all wrapped in Capacitor for Android.

Free tier gives you 10 chats/day, unlimited notes, and a weekly digest. Pro is $5/month for unlimited everything plus custom Echo personality (warm, direct, or curious).

Still early, still building. Android beta is live on the Play Store.
