import { useState, useRef, useCallback } from 'react';
import { useTranslation } from './useTranslation';

// Normalize transcript: lowercase everything, re-capitalize only sentence starters.
// Prevents random mid-sentence caps returned by the Web Speech API.
function normalizeTranscript(text) {
  if (!text) return text;
  return text
    .toLowerCase()
    .replace(/(^|[.?!]\s+)([a-záéíóúüñ])/gi, (_, prefix, letter) => prefix + letter.toUpperCase());
}

const STORAGE_KEY = 'echo_speech_lang';

export function useSpeech(onTranscript) {
  const { t, language } = useTranslation();
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState(null);
  const recognitionRef = useRef(null);

  // Speech language is independent of UI language — persisted in localStorage
  const [speechLang, setSpeechLang] = useState(() => {
    return localStorage.getItem(STORAGE_KEY) || language || 'es';
  });

  const toggleSpeechLang = useCallback(() => {
    setSpeechLang(prev => {
      const next = prev === 'es' ? 'en' : 'es';
      localStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  }, []);

  const committedTextRef = useRef('');
  const lastSessionTextRef = useRef('');
  const speechClassRef = useRef(null);
  // Stable ref so startSession always reads the latest speechLang without re-creating
  const speechLangRef = useRef(speechLang);
  speechLangRef.current = speechLang;
  const silentRestartCountRef = useRef(0);
  const MAX_SILENT_RESTARTS = 6;

  const isSupported =
    typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  const startSession = useCallback(() => {
    const SpeechRecognitionClass = speechClassRef.current;
    if (!SpeechRecognitionClass) return;

    const r = new SpeechRecognitionClass();
    r.continuous = false;
    r.interimResults = true;
    r.lang = speechLangRef.current === 'es' ? 'es-419' : 'en-US';
    r.maxAlternatives = 1;

    r.onresult = (event) => {
      let sessionText = '';
      for (let i = 0; i < event.results.length; i++) {
        const txt = event.results[i][0].transcript.trim();
        if (txt) sessionText += (sessionText ? ' ' : '') + txt;
      }
      lastSessionTextRef.current = sessionText;
      if (sessionText) silentRestartCountRef.current = 0;

      const committed = committedTextRef.current;
      const total = committed ? committed + ' ' + sessionText : sessionText;
      onTranscript(normalizeTranscript(total.trim()));
    };

    r.onerror = (e) => {
      if (e.error === 'not-allowed') {
        setError(t('mic_blocked'));
        setIsRecording(false);
        recognitionRef.current = null;
      }
    };

    r.onend = () => {
      if (recognitionRef.current === r) {
        const finalText = lastSessionTextRef.current;
        if (finalText) {
          committedTextRef.current = committedTextRef.current
            ? committedTextRef.current + ' ' + finalText
            : finalText;
          silentRestartCountRef.current = 0;
        } else {
          silentRestartCountRef.current += 1;
        }
        lastSessionTextRef.current = '';

        if (silentRestartCountRef.current >= MAX_SILENT_RESTARTS) {
          recognitionRef.current = null;
          setIsRecording(false);
          return;
        }

        setTimeout(() => {
          if (recognitionRef.current === r) startSession();
        }, 250);
      } else {
        setIsRecording(false);
      }
    };

    recognitionRef.current = r;
    try {
      r.start();
    } catch (err) {
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
  }, [onTranscript, t]);

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
    recognitionRef.current = null;
    try { rec?.stop(); } catch {}
    committedTextRef.current = '';
    lastSessionTextRef.current = '';
    silentRestartCountRef.current = 0;
    setIsRecording(false);
  }, []);

  return { isRecording, isSupported, startRecording, stopRecording, error, speechLang, toggleSpeechLang };
}
