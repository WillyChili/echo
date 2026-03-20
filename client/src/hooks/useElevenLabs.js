import { useState, useRef, useCallback } from 'react';
import { authFetch } from '../lib/api.js';

export function useElevenLabs() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(() => {
    return localStorage.getItem('echo_voice_enabled') === 'true';
  });
  const audioRef = useRef(null);

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
      setIsPlaying(false);
    }
  }, []);

  const toggleVoice = useCallback(() => {
    setVoiceEnabled((prev) => {
      const next = !prev;
      localStorage.setItem('echo_voice_enabled', String(next));
      if (!next) stopAudio();
      return next;
    });
  }, [stopAudio]);

  const speak = useCallback(async (text) => {
    if (!text) return;
    stopAudio();

    try {
      setIsPlaying(true);
      const res = await authFetch('/api/tts', {
        method: 'POST',
        body: JSON.stringify({ text }),
      });

      if (!res.ok) { setIsPlaying(false); return; }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;

      const cleanup = () => {
        setIsPlaying(false);
        URL.revokeObjectURL(url);
        audioRef.current = null;
      };
      audio.onended = cleanup;
      audio.onerror = cleanup;

      await audio.play();
    } catch {
      setIsPlaying(false);
    }
  }, [stopAudio]);

  return { voiceEnabled, toggleVoice, speak, isPlaying, stop: stopAudio };
}
