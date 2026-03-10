import { useState, useRef, useCallback } from 'react';
import { useTranslation } from './useTranslation';

const LOCALE_MAP = { en: 'en-US', es: 'es-ES' };

// Use the device/browser language for speech recognition, NOT the app's UI language.
// This ensures the microphone understands what the user actually speaks regardless of
// which display language they've chosen in Echo.
function getVoiceLang(appLanguage) {
  // navigator.language is the device/browser preferred language (e.g. 'es-AR', 'en-US')
  const deviceLang = typeof navigator !== 'undefined' ? navigator.language : '';
  return deviceLang || LOCALE_MAP[appLanguage] || 'en-US';
}

export function useSpeech(onTranscript) {
  const { t, language } = useTranslation();
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState(null);
  const recognitionRef = useRef(null);

  // Text accumulated across completed utterance sessions
  const committedTextRef = useRef('');
  // Last text reported in the current session (committed on onend)
  const lastSessionTextRef = useRef('');
  // Stable ref to the SpeechRecognition class (set once on startRecording)
  const speechClassRef = useRef(null);
  // Count silent restarts in a row — stop after too many to prevent infinite loops
  const silentRestartCountRef = useRef(0);
  const MAX_SILENT_RESTARTS = 6;

  const isSupported =
    typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  // Creates a FRESH SpeechRecognition instance every call – avoids stale
  // event.results from a previous session being re-read on restart.
  const startSession = useCallback(() => {
    const SpeechRecognitionClass = speechClassRef.current;
    if (!SpeechRecognitionClass) return;

    const r = new SpeechRecognitionClass();
    r.continuous = false;    // one utterance at a time → clean result list each session
    r.interimResults = true; // show text while speaking
    r.lang = getVoiceLang(language); // use device language, not app UI language
    r.maxAlternatives = 1;

    r.onresult = (event) => {
      let sessionText = '';
      for (let i = 0; i < event.results.length; i++) {
        const t = event.results[i][0].transcript.trim();
        if (t) sessionText += (sessionText ? ' ' : '') + t;
      }
      lastSessionTextRef.current = sessionText;
      // User spoke — reset the silent restart counter
      if (sessionText) silentRestartCountRef.current = 0;

      const committed = committedTextRef.current;
      const total = committed ? committed + ' ' + sessionText : sessionText;
      onTranscript(total.trim());
    };

    r.onerror = (e) => {
      if (e.error === 'not-allowed') {
        setError(t('mic_blocked'));
        setIsRecording(false);
        recognitionRef.current = null;
        return;
      }
      // no-speech / aborted / network → onend will handle restart
    };

    r.onend = () => {
      if (recognitionRef.current === r) {
        // Commit this session's final text before creating the next session
        const finalText = lastSessionTextRef.current;
        if (finalText) {
          committedTextRef.current = committedTextRef.current
            ? committedTextRef.current + ' ' + finalText
            : finalText;
          silentRestartCountRef.current = 0;
        } else {
          // Nothing was spoken this session
          silentRestartCountRef.current += 1;
        }
        lastSessionTextRef.current = '';

        // Stop auto-restarting after too many silent cycles (user probably stopped talking)
        if (silentRestartCountRef.current >= MAX_SILENT_RESTARTS) {
          recognitionRef.current = null;
          setIsRecording(false);
          return;
        }

        // Delay before restarting — 250ms is safer on Android to let the previous
        // session fully clean up (avoids InvalidStateError from calling start() too fast)
        setTimeout(() => {
          if (recognitionRef.current === r) startSession();
        }, 250);
      } else {
        setIsRecording(false);
      }
    };

    // Set ref BEFORE start so onend sees the reference immediately
    recognitionRef.current = r;
    try {
      r.start();
    } catch (err) {
      // InvalidStateError can happen if start() is called before the previous session
      // fully terminated. Retry once after a longer delay instead of giving up.
      if (err?.name === 'InvalidStateError' && recognitionRef.current === r) {
        setTimeout(() => {
          if (recognitionRef.current === r) {
            recognitionRef.current = null;
            startSession();
          }
        }, 400);
        return;
      }
      recognitionRef.current = null;
      setError(t('mic_error'));
      setIsRecording(false);
    }
  }, [onTranscript, t, language]);

  const startRecording = useCallback(async (onStart) => {
    if (!isSupported) {
      setError(t('mic_error'));
      return;
    }

    setError(null);
    committedTextRef.current = '';
    lastSessionTextRef.current = '';
    silentRestartCountRef.current = 0;
    speechClassRef.current = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (onStart) onStart();
    setIsRecording(true);
    startSession();
  }, [isSupported, startSession]);

  const stopRecording = useCallback(() => {
    const rec = recognitionRef.current;
    recognitionRef.current = null; // signal onend NOT to restart
    try { rec?.stop(); } catch {}
    committedTextRef.current = '';
    lastSessionTextRef.current = '';
    silentRestartCountRef.current = 0;
    setIsRecording(false);
  }, []);

  return { isRecording, isSupported, startRecording, stopRecording, error };
}
