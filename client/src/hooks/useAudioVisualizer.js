import { useState, useEffect, useRef } from 'react';

/**
 * useAudioVisualizer
 *
 * When `isActive` is true, taps into the microphone via getUserMedia + Web Audio API
 * and returns an array of `barCount` normalized heights (0–1) that update in real-time,
 * reacting to the volume and frequency content of the user's voice.
 *
 * Falls back to all-zeros if mic permission is denied.
 */
export function useAudioVisualizer(isActive, barCount = 9) {
  const [heights, setHeights] = useState(() => new Array(barCount).fill(0));
  const refs = useRef({ ctx: null, analyser: null, frame: null, stream: null });

  useEffect(() => {
    const r = refs.current;

    if (!isActive) {
      cancelAnimationFrame(r.frame);
      r.ctx?.close().catch(() => {});
      r.stream?.getTracks().forEach((t) => t.stop());
      r.ctx = null;
      r.analyser = null;
      r.stream = null;
      setHeights(new Array(barCount).fill(0));
      return;
    }

    let alive = true;

    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        if (!alive) { stream.getTracks().forEach((t) => t.stop()); return; }

        r.stream = stream;

        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        r.ctx = ctx;

        const analyser = ctx.createAnalyser();
        // fftSize 128 → 64 frequency bins; smoothing so bars don't jump too fast
        analyser.fftSize = 128;
        analyser.smoothingTimeConstant = 0.75;
        r.analyser = analyser;

        ctx.createMediaStreamSource(stream).connect(analyser);

        const buf = new Uint8Array(analyser.frequencyBinCount); // 64 bins

        const tick = () => {
          if (!alive) return;
          analyser.getByteFrequencyData(buf);

          // Human voice lives roughly in bins 2–28 (out of 64) at 44100 Hz / fftSize 128
          // Each bin ≈ 344 Hz wide; this covers ~690 Hz – 9.6 kHz (fundamental + harmonics)
          const voiceBins = buf.slice(2, 28);
          const step = voiceBins.length / barCount;

          const h = Array.from({ length: barCount }, (_, i) => {
            const start = Math.floor(i * step);
            const end = Math.max(start + 1, Math.floor((i + 1) * step));
            let sum = 0;
            for (let b = start; b < end; b++) sum += voiceBins[b] ?? 0;
            // Normalize and apply a slight power curve so soft sounds still show
            const raw = sum / (Math.max(1, end - start) * 255);
            return Math.min(1, Math.pow(raw, 0.6));
          });

          setHeights(h);
          r.frame = requestAnimationFrame(tick);
        };

        tick();
      } catch {
        // Permission denied or device not available — stay at zero, no crash
      }
    })();

    return () => {
      alive = false;
      cancelAnimationFrame(r.frame);
      refs.current.ctx?.close().catch(() => {});
      refs.current.stream?.getTracks().forEach((t) => t.stop());
    };
  }, [isActive, barCount]);

  return heights;
}
