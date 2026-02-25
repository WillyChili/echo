const express = require('express');
const router = express.Router();
const supabase = require('../supabase');
const auth = require('../middleware/auth');

router.use(auth);

// GET /api/messages/dates  —  list of dates that have messages
router.get('/dates', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('date')
      .eq('user_id', req.user.id)
      .order('date', { ascending: false });

    if (error) throw error;

    const unique = [...new Set((data || []).map((r) => r.date))];
    res.json(unique);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load chat dates.' });
  }
});

// GET /api/messages?date=YYYY-MM-DD  —  messages for a specific day
router.get('/', async (req, res) => {
  try {
    const date = req.query.date || new Date().toISOString().slice(0, 10);

    const { data, error } = await supabase
      .from('chat_messages')
      .select('role, content, created_at')
      .eq('user_id', req.user.id)
      .eq('date', date)
      .order('created_at', { ascending: true });

    if (error) throw error;

    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load messages.' });
  }
});

module.exports = router;
