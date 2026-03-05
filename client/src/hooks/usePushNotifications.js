import { useEffect, useState, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { authFetch } from '../lib/api';

// Only load the plugin when running natively (Android/iOS)
const isNative = Capacitor.isNativePlatform();

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
    if (!isNative) {
      setError('Push notifications require the native app.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { PushNotifications } = await import('@capacitor/push-notifications');

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
      await PushNotifications.addListener('pushNotificationReceived', (notification) => {
        console.log('Push received in foreground:', notification);
      });

    } catch (err) {
      setError('Could not enable notifications.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [saveToken]);

  // Disable — clear token from backend
  const disable = useCallback(async () => {
    setLoading(true);
    try {
      if (isNative) {
        const { PushNotifications } = await import('@capacitor/push-notifications');
        await PushNotifications.removeAllListeners();
      }
      await saveToken(null); // clear token in DB
      setEnabled(false);
    } catch (err) {
      console.error('Failed to disable notifications:', err);
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
