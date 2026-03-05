const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const freemium = require('../middleware/freemium');
const supabase = require('../supabase');

const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
const DEFAULT_MODEL = 'claude-haiku-4-5-20251001';

function buildSystemPrompt(notes, language, bio, displayName) {
  const lang = language === 'es' ? 'Spanish' : 'English';
  const name = displayName || 'the user';

  const today = new Date().toLocaleDateString(language === 'es' ? 'es-AR' : 'en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  // Personal context block
  const contextLines = [];
  if (displayName) contextLines.push(`Name: ${displayName}`);
  if (bio && bio.trim()) contextLines.push(`About them: ${bio.trim()}`);
  const personalContext = contextLines.length > 0
    ? `\nPersonal context about ${name}:\n${contextLines.join('\n')}\n`
    : '';

  const notesSection = notes && notes.length > 0
    ? `\nTheir notes (${notes.length} total):\n\n` + notes
        .slice()
        .sort((a, b) => (a.date < b.date ? -1 : 1))
        .map((n) => `[${n.date}]\n${n.content}`)
        .join('\n\n---\n\n')
    : '';

  return `You are Echo, a personal AI assistant for ${name}. Today is ${today}.

You MUST write your ENTIRE response in ${lang} only. Do NOT use any other language.
You MUST NOT use the em dash character. Use commas, periods, or colons instead.
Keep responses concise: 2 to 4 sentences unless a longer answer is clearly needed.
Do not identify yourself as an AI unless directly asked.
${personalContext}${notesSection}
Answer any question the user has, using your full knowledge. When their personal context or notes are relevant to the question, naturally weave that in. Otherwise just answer directly.`;
}

// All chat routes require authentication
router.use(auth);

// POST /api/chat
router.post('/', freemium, async (req, res) => {
  try {
    const { userMessage, notes, language } = req.body;

    if (!userMessage || typeof userMessage !== 'string') {
      return res.status(400).json({ error: 'userMessage is required.' });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: 'Server API key not configured.' });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('bio, display_name')
      .eq('id', req.user.id)
      .single();

    const systemPrompt = buildSystemPrompt(notes || [], language || 'en', profile?.bio || '', profile?.display_name || '');

    // Fetch last 20 messages for conversational context
    const { data: history } = await supabase
      .from('chat_messages')
      .select('role, content')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .limit(20);

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
