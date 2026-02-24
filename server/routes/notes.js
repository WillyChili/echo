const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/notes — all notes sorted by created_at DESC
router.get('/', (req, res) => {
  try {
    const notes = db.prepare(
      'SELECT id, date, content, created_at, updated_at FROM notes ORDER BY created_at DESC'
    ).all();
    res.json(notes);
  } catch (err) {
    console.error('GET /api/notes error:', err);
    res.status(500).json({ error: 'Failed to retrieve notes.' });
  }
});

// GET /api/notes/date/:date — all notes for a specific date
router.get('/date/:date', (req, res) => {
  try {
    const { date } = req.params;
    const notes = db.prepare(
      'SELECT id, date, content, created_at, updated_at FROM notes WHERE date = ? ORDER BY created_at ASC'
    ).all(date);
    res.json(notes);
  } catch (err) {
    console.error('GET /api/notes/date/:date error:', err);
    res.status(500).json({ error: 'Failed to retrieve notes.' });
  }
});

// POST /api/notes — create a new note
router.post('/', (req, res) => {
  try {
    const { date, content } = req.body;
    if (!date || typeof content !== 'string') {
      return res.status(400).json({ error: 'date and content are required.' });
    }
    const result = db.prepare(
      `INSERT INTO notes (date, content, created_at, updated_at)
       VALUES (?, ?, datetime('now'), datetime('now'))`
    ).run(date, content);
    const note = db.prepare('SELECT * FROM notes WHERE id = ?').get(result.lastInsertRowid);
    res.json(note);
  } catch (err) {
    console.error('POST /api/notes error:', err);
    res.status(500).json({ error: 'Failed to create note.' });
  }
});

// PUT /api/notes/:id — update an existing note's content
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    if (typeof content !== 'string') {
      return res.status(400).json({ error: 'content must be a string.' });
    }
    const result = db.prepare(
      `UPDATE notes SET content = ?, updated_at = datetime('now') WHERE id = ?`
    ).run(content, id);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Note not found.' });
    }
    const note = db.prepare('SELECT * FROM notes WHERE id = ?').get(id);
    res.json(note);
  } catch (err) {
    console.error('PUT /api/notes/:id error:', err);
    res.status(500).json({ error: 'Failed to update note.' });
  }
});

// DELETE /api/notes/:id — delete a note by id
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const result = db.prepare('DELETE FROM notes WHERE id = ?').run(id);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Note not found.' });
    }
    res.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/notes/:id error:', err);
    res.status(500).json({ error: 'Failed to delete note.' });
  }
});

module.exports = router;
