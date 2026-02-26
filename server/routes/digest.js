const express = require('express');
const router = express.Router();
const supabase = require('../supabase');
const auth = require('../middleware/auth');

const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
const DEFAULT_MODEL  = 'claude-haiku-4-5-20251001';

router.use(auth);

// GET /api/digest
// Returns { digest: "..." } if a new digest was generated, or { digest: null } if not due yet.
router.get('/', async (req, res) => {
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('api_key, language, bio, echo_tone, digest_frequency_days, digest_window_days, last_digest_at')
      .eq('id', req.user.id)
      .single();

    const frequencyDays = profile?.digest_frequency_days ?? 7;
    const windowDays    = profile?.digest_window_days    ?? 7;
    const lastDigestAt  = profile?.last_digest_at;

    // Check if digest is due
    const msSinceLastDigest = lastDigestAt
      ? Date.now() - new Date(lastDigestAt).getTime()
      : Infinity;
    const isDue = msSinceLastDigest >= frequencyDays * 86400 * 1000;

    if (!isDue) {
      return res.json({ digest: null });
    }

    // Fetch notes from the last windowDays days
    const since = new Date(Date.now() - windowDays * 86400 * 1000)
      .toISOString()
      .slice(0, 10);

    const { data: notes } = await supabase
      .from('notes')
      .select('date, content')
      .eq('user_id', req.user.id)
      .gte('date', since)
      .order('date', { ascending: true });

    if (!notes || notes.length === 0) {
      return res.json({ digest: null });
    }

    // Resolve API key
    let apiKey = process.env.ANTHROPIC_API_KEY;
    if (profile?.api_key) apiKey = profile.api_key;
    if (!apiKey || apiKey === 'your_api_key_here') {
      return res.json({ digest: null });
    }

    const lang = (profile?.language || 'en') === 'es' ? 'Spanish' : 'English';
    const tone = profile?.echo_tone || 'warm';
    const bio  = (profile?.bio || '').trim();

    const toneGuide =
      tone === 'direct'
        ? 'Be clear and direct. No filler. Get to the point.'
        : tone === 'curious'
        ? 'Be thoughtful and curious. End with one reflection question.'
        : 'Be warm and encouraging. Acknowledge their efforts.';

    const bioSection = bio ? `\nAbout this person:\n${bio}\n` : '';

    const notesText = notes
      .map((n) => `[${n.date}]\n${n.content}`)
      .join('\n\n---\n\n');

    const systemPrompt = `You MUST write your ENTIRE response in ${lang} only. Do NOT include any word from another language.
You MUST NOT use the em dash character. Use commas, periods, or colons to separate ideas.
Keep your response to 4-6 sentences maximum.
${bioSection}
You are Echo. The user asked for a digest of their notes from the last ${windowDays} days. Summarize the key themes, patterns, and ideas you notice in their writing. Be specific and reference what they actually wrote. Address them directly.
${toneGuide}
Do not identify yourself as an AI unless directly asked.`;

    const apiResponse = await fetch(CLAUDE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        max_tokens: 400,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: `Here are my notes from the last ${windowDays} days:\n\n${notesText}\n\nGenerate my digest.`,
          },
        ],
      }),
    });

    if (!apiResponse.ok) {
      console.error('Digest Claude API error:', apiResponse.status);
      return res.json({ digest: null });
    }

    const apiData = await apiResponse.json();
    const reply   = apiData?.content?.[0]?.text;

    if (!reply) {
      return res.json({ digest: null });
    }

    // Save digest as a chat message
    const today = new Date().toISOString().slice(0, 10);
    await supabase.from('chat_messages').insert([
      { user_id: req.user.id, role: 'echo', content: reply, date: today },
    ]);

    // Mark digest as delivered
    await supabase
      .from('profiles')
      .update({ last_digest_at: new Date().toISOString() })
      .eq('id', req.user.id);

    res.json({ digest: reply });
  } catch (err) {
    console.error('GET /api/digest error:', err);
    res.json({ digest: null }); // never hard-fail for a digest
  }
});

module.exports = router;
