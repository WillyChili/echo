const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-haiku-4-5-20251001';

router.use(auth);

// POST /api/speech/cleanup
// Receives raw STT transcript, returns punctuated and corrected text via Claude Haiku.
router.post('/cleanup', async (req, res) => {
  try {
    const { text, lang } = req.body;
    if (!text?.trim()) return res.json({ cleaned: text || '' });

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'API key not configured' });

    const systemPrompt = lang === 'en'
      ? 'You are a speech-to-text post-processor. Add proper punctuation (periods, commas, question marks, exclamation marks) and fix obvious transcription errors. Do NOT change the meaning or add new content. Return ONLY the corrected text, nothing else.'
      : 'Eres un post-procesador de voz a texto. Añade puntuación correcta (puntos, comas, signos de interrogación y exclamación) y corrige errores típicos de dictado. NO cambies el significado ni agregues contenido nuevo. Devuelve ÚNICAMENTE el texto corregido, sin explicaciones.';

    const response = await fetch(CLAUDE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 500,
        system: systemPrompt,
        messages: [{ role: 'user', content: text }],
      }),
    });

    const data = await response.json();
    const cleaned = data.content?.[0]?.text?.trim() || text;
    res.json({ cleaned });
  } catch (err) {
    console.error('[speech/cleanup] Error:', err);
    res.status(500).json({ error: 'cleanup failed' });
  }
});

module.exports = router;
