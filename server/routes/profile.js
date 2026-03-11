const express = require('express');
const router = express.Router();
const supabase = require('../supabase');
const auth = require('../middleware/auth');

router.use(auth);

// GET /api/profile
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('display_name, avatar_url, language, bio, echo_tone, digest_frequency_days, digest_window_days, digest_email_enabled, is_subscribed, daily_chats_used, daily_chats_reset_date')
      .eq('id', req.user.id)
      .single();

    // PGRST116 = no rows found (new user) — return empty profile, not an error
    if (error && error.code !== 'PGRST116') throw error;
    res.json(data || {});
  } catch (err) {
    res.status(500).json({ error: 'Failed to load profile.' });
  }
});

// POST /api/profile
router.post('/', async (req, res) => {
  try {
    const { display_name, avatar_url, language, bio, echo_tone, digest_frequency_days, digest_window_days, digest_email_enabled, fcm_token } = req.body;
    const fields = {};
    if (display_name          !== undefined) fields.display_name          = display_name;
    if (avatar_url            !== undefined) fields.avatar_url            = avatar_url;
    if (language              !== undefined) fields.language              = language;
    if (bio                   !== undefined) fields.bio                   = bio;
    if (echo_tone             !== undefined) fields.echo_tone             = echo_tone;
    if (digest_frequency_days !== undefined) fields.digest_frequency_days = Number(digest_frequency_days);
    if (digest_window_days    !== undefined) fields.digest_window_days    = Number(digest_window_days);
    if (digest_email_enabled  !== undefined) fields.digest_email_enabled  = Boolean(digest_email_enabled);
    if (fcm_token             !== undefined) fields.fcm_token             = fcm_token;

    if (Object.keys(fields).length === 0) return res.json({ success: true });

    // If registering a new FCM token, remove it from any other profile first.
    // This prevents duplicate notifications when the same device is used by
    // multiple accounts (e.g. tester switching between accounts).
    if (fcm_token) {
      await supabase
        .from('profiles')
        .update({ fcm_token: null })
        .eq('fcm_token', fcm_token)
        .neq('id', req.user.id);
    }

    // Use upsert so it works even if the profile row was never auto-created
    const { error } = await supabase
      .from('profiles')
      .upsert({ id: req.user.id, ...fields }, { onConflict: 'id' });
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update profile.' });
  }
});

module.exports = router;
