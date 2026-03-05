const express = require('express');
const router = express.Router();
const supabase = require('../supabase');
const auth = require('../middleware/auth');

router.use(auth);

// GET /api/messages/dates  —  list of dates that have messages
router.get('/dates', async (req, res) => {
  try {
    const { data, error } = await supabase
      .rpc('get_distinct_message_dates', { p_user_id: req.user.id });

    if (error) throw error;

    res.json((data || []).map((r) => r.date));
  } catch (err) {
    res.status(500).json({ error: 'Failed to load chat dates.' });
  }
});

// GET /api/messages              —  last 50 messages
// GET /api/messages?before=<ts>  —  50 messages before that timestamp (pagination)
// GET /api/messages?date=…       —  messages for a specific day (kept for compatibility)
router.get('/', async (req, res) => {
  try {
    const PAGE_SIZE = 50;

    // Legacy date filter — return all for that date, no pagination
    if (req.query.date) {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('role, content, created_at, date')
        .eq('user_id', req.user.id)
        .eq('date', req.query.date)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return res.json({ messages: data || [], hasMore: false });
    }

    let query = supabase
      .from('chat_messages')
      .select('role, content, created_at, date')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .limit(PAGE_SIZE);

    if (req.query.before) {
      query = query.lt('created_at', req.query.before);
    }

    const { data, error } = await query;
    if (error) throw error;

    res.json({
      messages: (data || []).reverse(),
      hasMore: (data || []).length === PAGE_SIZE,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load messages.' });
  }
});

module.exports = router;
