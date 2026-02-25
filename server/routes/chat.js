const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const supabase = require('../supabase');

const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
const DEFAULT_MODEL = 'claude-haiku-4-5-20251001';

const LOW_NOTES_HINTS = [
  'There are only a few notes so far. Ask a thoughtful question about their day and suggest they keep adding notes or try a voice note to capture quick thoughts.',
  'Not many notes yet. Guide them by asking what is on their mind and encourage them to add more. Mention voice notes are a fast way to get started.',
  'Still early. Ask them something thoughtful and let them know that writing more notes, or even recording voice notes, helps you give better guidance.',
  'Only a couple of notes to work with. Ask a question to learn more about them and suggest they keep writing or recording whenever something comes to mind.',
];

function buildSystemPrompt(notes, language, bio) {
  const lang = language === 'es' ? 'Spanish' : 'English';

  const rules = [
    `You MUST write your ENTIRE response in ${lang} only. Do NOT include any word from another language. This is mandatory.`,
    'You MUST NOT use the em dash character anywhere. No long dashes between words. Use commas, periods, or colons to separate ideas.',
    'Keep your response to 2 or 3 short sentences maximum.',
  ].join('\n');

  const bioSection = bio && bio.trim()
    ? `\nAbout this person:\n${bio.trim()}\n`
    : '';

  if (!notes || notes.length === 0) {
    return `${rules}

You are Echo, a personal guide that learns from the user's notes over time. You have no notes yet.
${bioSection}
Welcome them briefly and suggest things they could write about: a recipe, a reminder, an idea, a goal, how their day went. Be warm but brief.

Do not identify yourself as an AI unless directly asked.`;
  }

  const noteCount = notes.length;
  const notesText = notes
    .slice()
    .sort((a, b) => (a.date < b.date ? -1 : 1))
    .map((n) => `[${n.date}]\n${n.content}`)
    .join('\n\n---\n\n');

  const lowNotesHint = LOW_NOTES_HINTS[Math.floor(Math.random() * LOW_NOTES_HINTS.length)];

  return `${rules}

You are Echo, a personal guide built from the user's notes. You have read everything they wrote and you use it to give them thoughtful, grounded guidance. You are not their buddy. You are a calm, clear guide who listens and offers direction.
${bioSection}
Their notes:

${notesText}

How to respond:
- Tone: Calm, warm, and clear. Like a mentor, not a friend. No slang, no jokes, no overly casual language.
- If they mention a problem, offer a clear suggestion. If they share a goal, point them in a direction. If they ask something simple, answer directly.
- Reference their notes only when it genuinely adds value.
- ${noteCount < 3 ? lowNotesHint : 'You know them well. Use their notes to give specific, personal guidance.'}
- Do not identify yourself as an AI unless directly asked.`;
}

// All chat routes require authentication
router.use(auth);

// POST /api/chat
router.post('/', async (req, res) => {
  try {
    const { userMessage, notes, language } = req.body;

    if (!userMessage || typeof userMessage !== 'string') {
      return res.status(400).json({ error: 'userMessage is required.' });
    }

    // Use user's own API key if they have one, otherwise fallback to server key
    let apiKey = process.env.ANTHROPIC_API_KEY;

    const { data: profile } = await supabase
      .from('profiles')
      .select('api_key, bio')
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

    const systemPrompt = buildSystemPrompt(notes || [], language || 'en', profile?.bio || '');

    // Fetch last 10 messages for conversational context
    const { data: history } = await supabase
      .from('chat_messages')
      .select('role, content')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    const contextMessages = (history || [])
      .reverse()
      .map((m) => ({
        role: m.role === 'echo' ? 'assistant' : 'user',
        content: m.content,
      }));
    contextMessages.push({ role: 'user', content: userMessage });

    const response = await fetch(CLAUDE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        max_tokens: 300,
        system: systemPrompt,
        messages: contextMessages,
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

    // Persist both messages to Supabase
    const today = new Date().toISOString().slice(0, 10);
    await supabase.from('chat_messages').insert([
      { user_id: req.user.id, role: 'user', content: userMessage, date: today },
      { user_id: req.user.id, role: 'echo', content: reply,       date: today },
    ]);

    res.json({ reply });
  } catch (err) {
    console.error('POST /api/chat error:', err);
    res.status(500).json({
      error: 'Something went wrong. Echo will be back shortly.',
    });
  }
});

module.exports = router;
