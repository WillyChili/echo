const express = require('express');
const router = express.Router();

const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-haiku-4-5-20251001';

function buildSystemPrompt(notes) {
  if (!notes || notes.length === 0) {
    return `You are Echo — a reflection of the user themselves. However, you have no journal entries to learn from yet. Tell the user warmly that Echo is still empty and needs them to write some notes first before you can truly reflect them. Keep it short and encouraging.`;
  }

  const noteCount = notes.length;
  const notesText = notes
    .slice() // don't mutate original
    .sort((a, b) => (a.date < b.date ? -1 : 1))
    .map((n) => `[${n.date}]\n${n.content}`)
    .join('\n\n---\n\n');

  return `You are Echo — a reflection of the user themselves. You are NOT a generic assistant. You are built entirely from their own words, thoughts, patterns, and emotional tone found in their journal entries.

Your job is to respond the way THEY would respond to themselves — using their vocabulary, their humor (or lack of it), their sentence rhythm, their recurring themes, their anxieties, their excitement patterns.

Here are all of their journal entries, ordered by date:

${notesText}

Instructions:
- Study the writing style: short or long sentences? casual or formal? do they use slang? ellipses? stream of consciousness?
- Study the emotional patterns: what makes them anxious? what excites them? what do they avoid talking about?
- Study recurring themes: relationships, work, health, goals — whatever shows up
- When you respond, MIRROR their style. Don't be a therapist. Don't be an assistant. Be them.
- If they ask "what should I do about X", answer as their inner voice would — not as an advisor
- Occasionally reference specific things from past notes naturally (e.g. "you mentioned last Tuesday that...")
- ${noteCount < 3 ? 'There are fewer than 3 notes — tell them Echo is still learning and needs more entries to truly reflect them, but do your best with what you have.' : 'You have enough entries to reflect them confidently.'}
- Never break character. Never say you're an AI unless directly and explicitly asked.`;
}

// POST /api/chat
router.post('/', async (req, res) => {
  try {
    const { userMessage, notes } = req.body;

    if (!userMessage || typeof userMessage !== 'string') {
      return res.status(400).json({ error: 'userMessage is required.' });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey || apiKey === 'your_api_key_here') {
      return res.status(500).json({
        error: 'ANTHROPIC_API_KEY is not configured. Add it to your .env file.',
      });
    }

    const systemPrompt = buildSystemPrompt(notes || []);

    const response = await fetch(CLAUDE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1024,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }],
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('Claude API error:', response.status, errorBody);
      return res.status(502).json({
        error: `Echo is having trouble thinking right now. (API ${response.status})`,
      });
    }

    const data = await response.json();
    const reply = data?.content?.[0]?.text;

    if (!reply) {
      return res.status(502).json({ error: 'Echo returned an empty response.' });
    }

    res.json({ reply });
  } catch (err) {
    console.error('POST /api/chat error:', err);
    res.status(500).json({
      error: 'Something went wrong. Echo will be back shortly.',
    });
  }
});

module.exports = router;
