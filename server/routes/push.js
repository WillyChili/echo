const express = require('express');
const router = express.Router();
const supabase = require('../supabase');
const auth = require('../middleware/auth');

// Firebase Admin SDK — only initialized if credentials are present
let firebaseAdmin = null;
let messagingInstance = null;

function getMessaging() {
  if (messagingInstance) return messagingInstance;

  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!serviceAccountJson) return null;

  try {
    if (!firebaseAdmin) {
      const admin = require('firebase-admin');
      const serviceAccount = JSON.parse(serviceAccountJson);
      firebaseAdmin = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    }
    const admin = require('firebase-admin');
    messagingInstance = admin.messaging();
    return messagingInstance;
  } catch (err) {
    console.error('Firebase init error:', err.message);
    return null;
  }
}

router.use(auth);

// POST /api/push/test  —  send a test notification to the current user
router.post('/test', async (req, res) => {
  try {
    const messaging = getMessaging();
    if (!messaging) {
      return res.status(503).json({ error: 'Push notifications not configured on the server.' });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('fcm_token, language')
      .eq('id', req.user.id)
      .single();

    if (!profile?.fcm_token) {
      return res.status(400).json({ error: 'No FCM token registered for this user.' });
    }

    const isEs = (profile.language || 'en') === 'es';

    await messaging.send({
      token: profile.fcm_token,
      notification: {
        title: 'Echo',
        body: isEs ? '¡Las notificaciones funcionan!' : 'Notifications are working!',
      },
      android: { priority: 'high' },
    });

    res.json({ success: true });
  } catch (err) {
    console.error('Push test error:', err);
    res.status(500).json({ error: 'Failed to send test notification.' });
  }
});

// Internal helper — call this from digest or other routes to send a push
async function sendPushToUser(userId, title, body) {
  const messaging = getMessaging();
  if (!messaging) return;

  const { data: profile } = await supabase
    .from('profiles')
    .select('fcm_token')
    .eq('id', userId)
    .single();

  if (!profile?.fcm_token) return;

  try {
    await messaging.send({
      token: profile.fcm_token,
      notification: { title, body },
      android: { priority: 'high' },
    });
  } catch (err) {
    console.error('Push send error:', err.message);
  }
}

module.exports = router;
module.exports.sendPushToUser = sendPushToUser;
