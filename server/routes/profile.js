const express = require('express');
const router = express.Router();
const supabase = require('../supabase');
const auth = require('../middleware/auth');

router.use(auth);

// GET /api/profile
router.get('/', async (req, res) => {
  try {
    const { data } = await supabase
      .from('profiles')
      .select('display_name, avatar_url, language')
      .eq('id', req.user.id)
      .single();
    res.json(data || {});
  } catch (err) {
    res.status(500).json({ error: 'Failed to load profile.' });
  }
});

// POST /api/profile
router.post('/', async (req, res) => {
  try {
    const { display_name, avatar_url, language } = req.body;
    const update = { id: req.user.id };
    if (display_name !== undefined) update.display_name = display_name;
    if (avatar_url   !== undefined) update.avatar_url   = avatar_url;
    if (language     !== undefined) update.language     = language;

    const { error } = await supabase
      .from('profiles')
      .upsert(update);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update profile.' });
  }
});

module.exports = router;
