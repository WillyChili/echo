const supabase = require('../supabase');

const FREE_CHAT_LIMIT = 10;

module.exports = async function freemiumMiddleware(req, res, next) {
  try {
    const today = new Date().toISOString().slice(0, 10);

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('is_subscribed, daily_chats_used, daily_chats_reset_date')
      .eq('id', req.user.id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    // Subscribed users bypass all limits
    if (profile?.is_subscribed) return next();

    let chatsUsed = profile?.daily_chats_used ?? 0;
    const resetDate = profile?.daily_chats_reset_date;

    // Reset counter if it's a new day
    if (!resetDate || resetDate < today) {
      chatsUsed = 0;
      await supabase
        .from('profiles')
        .update({ daily_chats_used: 0, daily_chats_reset_date: today })
        .eq('id', req.user.id);
    }

    if (chatsUsed >= FREE_CHAT_LIMIT) {
      return res.status(429).json({
        error: 'limit_reached',
        used: chatsUsed,
        limit: FREE_CHAT_LIMIT,
      });
    }

    // Increment counter
    await supabase
      .from('profiles')
      .update({ daily_chats_used: chatsUsed + 1, daily_chats_reset_date: today })
      .eq('id', req.user.id);

    next();
  } catch (err) {
    console.error('freemium middleware error:', err);
    next(); // fail open — never block user due to middleware error
  }
};
