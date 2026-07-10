# Echo - Twitter Posts (3 days)

## Day 1: The AI Companion Angle

### Short
Building an AI journaling app that actually remembers what you wrote. Voice, text, weekly digests. Echo is in beta on Android.

### Medium
Most note apps store what you write. Echo understands it.

I've been building an AI journaling companion that reads your notes, learns your context, and answers questions from your own words. Voice or text, English or Spanish.

Free on Android. Beta is live.

### Long
I've been working on Echo for a while now and it's finally taking shape.

The idea: you write whatever is on your mind (a thought, a recipe, how your day went) by voice or text. Echo reads everything, builds context over time, and when you ask it something, it answers from your own words. Not generic AI responses. Your actual notes, your actual life.

It also sends you a weekly digest summarizing what you wrote, so nothing gets lost.

Free tier gives you 10 chats/day, unlimited notes, and a weekly summary. Pro unlocks unlimited chats, custom personality (warm, direct, or curious), and email digests.

Beta is live on Android. Link in bio.

---

## Day 2: The Dev/Building in Public Angle

### Short
Rewrote Echo's entire AI personality this week. Less corporate, more honest. It can disagree with you now.

### Medium
Spent the last few weeks rewriting how Echo talks to you.

Old version: generic, overly enthusiastic, "That's a great thought!" on everything. New version: references your actual notes, follows up on things you mentioned, and can push back when your reasoning doesn't add up.

Still iterating. Building an AI that feels like a real companion is harder than it sounds.

### Long
Dev update on Echo, the AI journaling app I'm building.

This month I rewrote the AI's entire personality from scratch. The old Echo was too polished, too agreeable. It said things like "Absolutely!" and "You're so right!" which felt hollow.

The new Echo is direct. It references specific things from your notes ("You said you wanted to call the accountant last week, did that happen?"). It can disagree with you calmly when your actions don't match what you wrote. It doesn't use motivational language or try to be your therapist.

Also rebuilt the weekly digest. It now pulls concrete topics from your notes instead of giving you abstract "themes." If you wrote about a job interview, a recipe, and a deadline, it talks about those things specifically, not about "personal growth."

Small changes, but they make the whole thing feel real. Building in public, shipping weekly.

---

## Day 3: The Product/Feature Angle

### Short
Echo now supports voice notes in English and Spanish with automatic punctuation cleanup. Just talk, it handles the rest.

### Medium
New in Echo: voice input that actually works.

Speak in English or Spanish, Echo transcribes it and cleans up punctuation without changing your words. No formatting, no setup. Just hit the mic and talk.

Also rebuilt the landing page from scratch. Dither shader background, bento grid features, bilingual support. Looks nothing like v1.

Android beta is free. Link in bio.

### Long
Feature drop for Echo, the AI journal app.

Voice input got a major upgrade. You can speak in English or Spanish, and Echo transcribes and cleans up the punctuation automatically. The key constraint: it never changes, removes, or adds words. Your voice, your exact words, just properly formatted.

The landing page got a full redesign too. New dither shader background, animated glow effects, a bento grid showing all features (voice notes, AI chat, weekly digest, custom personality, email summaries, bilingual support). Built with React + Tailwind. It finally looks like a real product.

Under the hood: rewrote the chat context system to only pull the last 14 days of notes (was pulling everything before, which got noisy). Fixed note sorting, improved the navigation layout, and made settings save silently in the background instead of showing confirmation messages for every toggle.

Android beta is live and free. 10 chats/day, unlimited notes, weekly digest included.
