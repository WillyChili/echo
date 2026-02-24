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
      .select('display_name')
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
    const { display_name } = req.body;
    const { error } = await supabase
      .from('profiles')
      .upsert({ id: req.user.id, display_name });
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update profile.' });
  }
});

module.exports = router;
