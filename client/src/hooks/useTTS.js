import { useState, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';

const API_BASE = import.meta.env.VITE_API_URL || '';

/**
 * useTTS — Text-to-speech via ElevenLabs backend.
 *
 * Returns:
 *   speak(text, language)  — fetch audio and play it
 *   stop()                 — stop playback
 *   isSpeaking             — true while audio is playing
 *   speakingText           — the text currently being spoken (used to match to a bubble)
 *   isLoadingTTS           — true while fetching audio from server
 */
export function useTTS() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speakingText, setSpeakingText] = useState(null);
  const [isLoadingTTS, setIsLoadingTTS] = useState(false);
  const audioRef = useRef(null);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      URL.revokeObjectURL(audioRef.current.src);
      audioRef.current = null;
    }
    setIsSpeaking(false);
    setSpeakingText(null);
    setIsLoadingTTS(false);
  }, []);

  const speak = useCallback(async (text, language = 'en') => {
    // If already speaking this text, stop it
    if (speakingText === text) {
      stop();
      return;
    }

    // Stop any current playback first
    stop();

    setIsLoadingTTS(true);
    setSpeakingText(text);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const res = await fetch(`${API_BASE}/api/tts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ text, language }),
      });

      if (!res.ok) {
        console.error('TTS request failed:', res.status);
        stop();
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;

      audio.onplay = () => {
        setIsLoadingTTS(false);
        setIsSpeaking(true);
      };

      audio.onended = () => {
        URL.revokeObjectURL(url);
        audioRef.current = null;
        setIsSpeaking(false);
        setSpeakingText(null);
      };

      audio.onerror = () => {
        URL.revokeObjectURL(url);
        audioRef.current = null;
        setIsSpeaking(false);
        setSpeakingText(null);
        setIsLoadingTTS(false);
      };

      await audio.play();
    } catch (e) {
      console.error('TTS error:', e);
      stop();
    }
  }, [speakingText, stop]);

  return { speak, stop, isSpeaking, speakingText, isLoadingTTS };
}
