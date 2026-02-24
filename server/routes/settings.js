const express = require('express');
const router = express.Router();
const supabase = require('../supabase');
const auth = require('../middleware/auth');

router.use(auth);

// GET /api/settings — check if user has an API key saved
router.get('/', async (req, res) => {
  try {
    const { data } = await supabase
      .from('profiles')
      .select('api_key')
      .eq('id', req.user.id)
      .single();

    res.json({ hasApiKey: !!data?.api_key });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load settings.' });
  }
});

// POST /api/settings — save user's API key
router.post('/', async (req, res) => {
  try {
    const { apiKey } = req.body;
    if (!apiKey || typeof apiKey !== 'string') {
      return res.status(400).json({ error: 'apiKey is required.' });
    }

    const { error } = await supabase
      .from('profiles')
      .upsert({ id: req.user.id, api_key: apiKey });

    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    console.error('POST /api/settings error:', err);
    res.status(500).json({ error: 'Failed to save API key.' });
  }
});

// DELETE /api/settings — remove user's API key
router.delete('/', async (req, res) => {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ api_key: null })
      .eq('id', req.user.id);

    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to remove API key.' });
  }
});

module.exports = router;
