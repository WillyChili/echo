const express = require('express');
const router  = express.Router();
const supabase = require('../supabase');
const auth     = require('../middleware/auth');

router.use(auth);

// DELETE /api/account — permanently delete user and all their data
router.delete('/', async (req, res) => {
  try {
    const { error } = await supabase.auth.admin.deleteUser(req.user.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete account.' });
  }
});

module.exports = router;
