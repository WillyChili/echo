import { useState, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { authFetch } from '../lib/api';

// Echo is a native-only app — always show the notifications toggle.
const isNative = true;

export function usePushNotifications() {
  const [enabled, setEnabled]   = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);

  // Register token with backend
  const saveToken = useCallback(async (token) => {
    try {
      await authFetch('/api/profile', {
        method: 'POST',
        body: JSON.stringify({ fcm_token: token }),
      });
    } catch (err) {
      console.error('Failed to save FCM token:', err);
    }
  }, []);

  // Request permission and register
  const enable = useCallback(async () => {
    setLoading(true);
    setError(null);

    // Diagnostic — visible in logcat and Chrome remote debugger
    const platform = Capacitor.getPlatform();
    const pluginAvailable = Capacitor.isPluginAvailable('PushNotifications');
    console.log('[Echo] Capacitor platform:', platform);
    console.log('[Echo] PushNotifications available:', pluginAvailable);

    if (!Capacitor.isNativePlatform()) {
      setError(`Native bridge not ready (platform: ${platform}). Rebuild with: npm run build:android`);
      setLoading(false);
      return;
    }

    try {
      const permResult = await PushNotifications.requestPermissions();
      if (permResult.receive !== 'granted') {
        setError('Permission denied.');
        setLoading(false);
        return;
      }

      await PushNotifications.register();

      // Listen for registration token (fires once after register())
      const tokenListener = await PushNotifications.addListener('registration', async (token) => {
        await saveToken(token.value);
        setEnabled(true);
        tokenListener.remove();
      });

      // Listen for errors
      const errorListener = await PushNotifications.addListener('registrationError', (err) => {
        setError('Registration failed. Try again.');
        errorListener.remove();
      });

      // Handle foreground notifications
      PushNotifications.addListener('pushNotificationReceived', (notification) => {
        console.log('[Echo] Push received in foreground:', notification);
      });

    } catch (err) {
      const msg = err?.message || err?.toString() || 'Unknown error';
      setError(`Error: ${msg}`);
      console.error('[Echo] Push enable error:', err);
    } finally {
      setLoading(false);
    }
  }, [saveToken]);

  // Disable — clear token from backend
  const disable = useCallback(async () => {
    setLoading(true);
    try {
      if (Capacitor.isNativePlatform()) {
        await PushNotifications.removeAllListeners();
      }
      await saveToken(null); // clear token in DB
      setEnabled(false);
    } catch (err) {
      console.error('[Echo] Failed to disable notifications:', err);
    } finally {
      setLoading(false);
    }
  }, [saveToken]);

  const toggle = useCallback(() => {
    if (enabled) disable();
    else enable();
  }, [enabled, enable, disable]);

  return { enabled, loading, error, toggle, isSupported: isNative };
}
