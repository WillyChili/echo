const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

const VOICE_EN = process.env.ELEVENLABS_VOICE_ID    || 'DXFkLCBUTmvXpp2QwZjA';
const VOICE_ES = process.env.ELEVENLABS_VOICE_ID_ES || 'p5EUznrYaWnafKvUkNiR';

router.post('/', auth, async (req, res) => {
  const { text, language } = req.body;
  if (!text) return res.status(400).json({ error: 'text required' });

  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) return res.status(503).json({ error: 'TTS not configured' });

  const voiceId = language === 'es' ? VOICE_ES : VOICE_EN;

  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': apiKey,
          'Content-Type': 'application/json',
          'Accept': 'audio/mpeg',
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_multilingual_v2',
          voice_settings: { stability: 0.5, similarity_boost: 0.75 },
        }),
      }
    );

    if (!response.ok) {
      const err = await response.text();
      console.error('ElevenLabs error:', err);
      return res.status(502).json({ error: 'TTS failed' });
    }

    res.set('Content-Type', 'audio/mpeg');
    res.set('Cache-Control', 'no-store');
    const buffer = await response.arrayBuffer();
    res.send(Buffer.from(buffer));
  } catch (e) {
    console.error('TTS error:', e);
    res.status(500).json({ error: 'TTS error' });
  }
});

module.exports = router;
