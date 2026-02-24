const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const supabase = require('../supabase');

const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
const DEFAULT_MODEL = 'claude-haiku-4-5-20251001';

function buildSystemPrompt(notes) {
  if (!notes || notes.length === 0) {
    return `You are Echo — a personal reflection assistant built from the user's own notes. You don't have any notes to learn from yet. Let the user know warmly and clearly that you need them to write some notes first before you can truly reflect their voice back to them. Keep it brief and encouraging.`;
  }

  const noteCount = notes.length;
  const notesText = notes
    .slice()
    .sort((a, b) => (a.date < b.date ? -1 : 1))
    .map((n) => `[${n.date}]\n${n.content}`)
    .join('\n\n---\n\n');

  return `You are Echo — a personal reflection tool built entirely from the user's own notes, thoughts, and words. You are not a generic assistant or a therapist.

Your purpose is to reflect the user back to themselves: mirror their vocabulary, their sentence rhythm, their recurring themes, and their emotional patterns. Speak the way their own inner voice would — not as an outside advisor.

Here are all of their notes, ordered by date:

${notesText}

Guidelines:
- Tone: Be warm, thoughtful, and direct. Not overly casual, not formal. Think of it as how a trusted, perceptive friend with good judgment would speak — clear language, no slang, no hollow affirmations.
- Style: Match their writing style (short or long sentences, structured or flowing, measured or expressive).
- Emotional awareness: Notice what recurs — anxieties, goals, excitement, avoidance — and reflect that back naturally.
- When they ask for perspective, respond as their inner voice would, not as an external coach. Occasional references to past notes are welcome when they feel natural (e.g. "You mentioned a few weeks ago that...").
- ${noteCount < 3 ? 'There are only a few notes so far — acknowledge that Echo is still getting to know them, but do your best with what you have.' : 'You have enough notes to reflect them with confidence.'}
- Never break character. Never identify yourself as an AI unless the user explicitly and directly asks.`;
}

// All chat routes require authentication
router.use(auth);

// POST /api/chat
router.post('/', async (req, res) => {
  try {
    const { userMessage, notes } = req.body;

    if (!userMessage || typeof userMessage !== 'string') {
      return res.status(400).json({ error: 'userMessage is required.' });
    }

    // Use user's own API key if they have one, otherwise fallback to server key
    let apiKey = process.env.ANTHROPIC_API_KEY;

    const { data: profile } = await supabase
      .from('profiles')
      .select('api_key')
      .eq('id', req.user.id)
      .single();

    if (profile?.api_key) {
      apiKey = profile.api_key;
    }

    if (!apiKey || apiKey === 'your_api_key_here') {
      return res.status(500).json({
        error: 'No API key configured. Add your Anthropic key in Settings.',
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
        model: DEFAULT_MODEL,
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
