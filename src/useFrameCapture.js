import { useRef, useCallback, useEffect } from 'react'

const MAX_FRAMES = 5;              // Server erlaubt max. 5 Bilder
const FIRST_FRAME_MS = 1500;
const FRAME_INTERVAL_MS = 8000;

// Webcam-Standbilder für das Körpersprache-Feedback sammeln, solange `active` ist.
export function useFrameCapture(videoRef, active) {
  const framesRef = useRef([]);

  const capture = useCallback(() => {
    const video = videoRef.current;
    if (!video || video.readyState < 2 || framesRef.current.length >= MAX_FRAMES) return;
    const canvas = document.createElement('canvas');
    canvas.width = 320;
    canvas.height = 240;
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
    framesRef.current.push(canvas.toDataURL('image/jpeg', 0.6));
  }, [videoRef]);

  useEffect(() => {
    if (!active) return;
    // Erstes Bild früh — sonst hätten Antworten unter 8 s gar kein Kamera-Feedback.
    const first = setTimeout(capture, FIRST_FRAME_MS);
    const interval = setInterval(capture, FRAME_INTERVAL_MS);
    return () => {
      clearTimeout(first);
      clearInterval(interval);
    };
  }, [active, capture]);

  // Gibt die gesammelten Bilder zurück und leert den Puffer für die nächste Aufnahme.
  const takeFrames = useCallback(() => {
    const frames = framesRef.current;
    framesRef.current = [];
    return frames;
  }, []);

  return { capture, takeFrames };
}
