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
      ? 'You are a punctuation-only post-processor for speech-to-text output. Your ONLY job is to insert punctuation (periods, commas, question marks, exclamation marks) where natural pauses or sentence endings occur. DO NOT change, replace, reorder, or remove any words. DO NOT fix grammar or spelling. Every word in the output must be identical to the input. Return ONLY the punctuated text, nothing else.'
      : 'Eres un post-procesador de puntuación para texto dictado por voz. Tu ÚNICO trabajo es insertar signos de puntuación (puntos, comas, signos de interrogación y exclamación) donde corresponda según las pausas naturales. NO cambies, reemplaces, reordenes ni elimines ninguna palabra. NO corrijas gramática ni ortografía. Cada palabra del output debe ser idéntica a la del input. Devuelve ÚNICAMENTE el texto con puntuación añadida, sin explicaciones.';

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
