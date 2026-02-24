import { useState, useRef, useCallback } from 'react';

export function useSpeech(onTranscript) {
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState(null);
  const recognitionRef = useRef(null);

  // Text accumulated across completed utterance sessions
  const committedTextRef = useRef('');
  // Last text reported in the current session (committed on onend)
  const lastSessionTextRef = useRef('');
  // Stable ref to the SpeechRecognition class (set once on startRecording)
  const speechClassRef = useRef(null);

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
    r.lang = 'es-ES';

    r.onresult = (event) => {
      let sessionText = '';
      for (let i = 0; i < event.results.length; i++) {
        const t = event.results[i][0].transcript.trim();
        if (t) sessionText += (sessionText ? ' ' : '') + t;
      }
      lastSessionTextRef.current = sessionText;

      const committed = committedTextRef.current;
      const total = committed ? committed + ' ' + sessionText : sessionText;
      onTranscript(total.trim());
    };

    r.onerror = (e) => {
      if (e.error === 'not-allowed') {
        setError('Micrófono bloqueado.');
        setIsRecording(false);
        recognitionRef.current = null;
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
        }
        lastSessionTextRef.current = '';
        // Start a brand-new instance (not r.start()) so event.results resets
        startSession();
      } else {
        setIsRecording(false);
      }
    };

    // Set ref BEFORE start so onend sees the reference immediately
    recognitionRef.current = r;
    try {
      r.start();
    } catch {
      recognitionRef.current = null;
      setError('No se pudo iniciar el reconocimiento.');
      setIsRecording(false);
    }
  }, [onTranscript]);

  const startRecording = useCallback(async (onStart) => {
    if (!isSupported) {
      setError('Speech recognition not supported.');
      return;
    }

    setError(null);
    committedTextRef.current = '';
    lastSessionTextRef.current = '';
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
    setIsRecording(false);
  }, []);

  return { isRecording, isSupported, startRecording, stopRecording, error };
}
