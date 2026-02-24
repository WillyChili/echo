const express = require('express');
const router = express.Router();
const supabase = require('../supabase');
const auth = require('../middleware/auth');

// All notes routes require authentication
router.use(auth);

// GET /api/notes — all notes for the logged-in user
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('notes')
      .select('id, date, content, created_at, updated_at')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error('GET /api/notes error:', err);
    res.status(500).json({ error: 'Failed to retrieve notes.' });
  }
});

// GET /api/notes/date/:date — notes for a specific date
router.get('/date/:date', async (req, res) => {
  try {
    const { date } = req.params;
    const { data, error } = await supabase
      .from('notes')
      .select('id, date, content, created_at, updated_at')
      .eq('user_id', req.user.id)
      .eq('date', date)
      .order('created_at', { ascending: true });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error('GET /api/notes/date/:date error:', err);
    res.status(500).json({ error: 'Failed to retrieve notes.' });
  }
});

// POST /api/notes — create a new note
router.post('/', async (req, res) => {
  try {
    const { date, content } = req.body;
    if (!date || typeof content !== 'string') {
      return res.status(400).json({ error: 'date and content are required.' });
    }

    const { data, error } = await supabase
      .from('notes')
      .insert({ user_id: req.user.id, date, content })
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error('POST /api/notes error:', err);
    res.status(500).json({ error: 'Failed to create note.' });
  }
});

// PUT /api/notes/:id — update a note
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    if (typeof content !== 'string') {
      return res.status(400).json({ error: 'content must be a string.' });
    }

    const { data, error } = await supabase
      .from('notes')
      .update({ content, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', req.user.id)
      .select()
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Note not found.' });
    res.json(data);
  } catch (err) {
    console.error('PUT /api/notes/:id error:', err);
    res.status(500).json({ error: 'Failed to update note.' });
  }
});

// DELETE /api/notes/:id — delete a note
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase
      .from('notes')
      .delete()
      .eq('id', id)
      .eq('user_id', req.user.id);

    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/notes/:id error:', err);
    res.status(500).json({ error: 'Failed to delete note.' });
  }
});

module.exports = router;
