import { useState, useRef, useCallback, useEffect } from 'react'

const SILENCE_RMS = 0.02;      // darunter gilt als Stille
const MIN_PAUSE_MS = 600;      // ab dieser Länge zählt eine Sprechpause
const SAMPLE_INTERVAL_MS = 50;

// Pausen, Redeanteil und Dynamik aus den Lautstärke-Samples ableiten.
const analyzeSamples = (samples, durationMs, threshold) => {
  if (samples.length === 0) {
    return { pauseCount: 0, longestPauseMs: 0, speakingRatio: 0, dynamics: 0, durationMs };
  }

  const speaking = samples.filter(rms => rms >= threshold);
  const speakingRatio = speaking.length / samples.length;

  // Stille-Blöcke zählen, führende/abschließende Stille ignorieren
  const firstVoice = samples.findIndex(rms => rms >= threshold);
  const lastVoice = samples.length - 1 - [...samples].reverse().findIndex(rms => rms >= threshold);

  let pauseCount = 0;
  let longestPauseMs = 0;
  let run = 0;
  for (let i = firstVoice; i <= lastVoice && firstVoice !== -1; i++) {
    if (samples[i] < threshold) {
      run++;
    } else {
      const runMs = run * SAMPLE_INTERVAL_MS;
      if (runMs >= MIN_PAUSE_MS) {
        pauseCount++;
        longestPauseMs = Math.max(longestPauseMs, runMs);
      }
      run = 0;
    }
  }

  // Dynamik: Streuung der Lautstärke beim Sprechen (monoton vs. betont)
  let dynamics = 0;
  if (speaking.length > 1) {
    const mean = speaking.reduce((a, b) => a + b, 0) / speaking.length;
    const variance = speaking.reduce((a, b) => a + (b - mean) ** 2, 0) / speaking.length;
    dynamics = mean > 0 ? Math.sqrt(variance) / mean : 0;
  }

  return {
    pauseCount,
    longestPauseMs,
    speakingRatio: Math.round(speakingRatio * 100),
    dynamics: Math.round(dynamics * 100),
    durationMs
  };
};

export const getDynamicsLabel = (dynamics) => {
  if (dynamics < 35) return "Monoton";
  if (dynamics > 75) return "Sehr bewegt";
  return "Ausgewogen";
};

export function useRecorder(lang, withVideo = false) {
  const [isRecording, setIsRecording] = useState(false);
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [level, setLevel] = useState(0);
  const [error, setError] = useState(null);
  const [stream, setStream] = useState(null);

  const transcriptRef = useRef('');
  const recognitionRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const audioCtxRef = useRef(null);
  const timerRef = useRef(null);
  const samplesRef = useRef([]);
  const chunksRef = useRef([]);
  const startedAtRef = useRef(0);
  const silenceThresholdRef = useRef(SILENCE_RMS);

  const cleanup = useCallback(() => {
    clearInterval(timerRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch { /* bereits gestoppt */ }
      recognitionRef.current = null;
    }
  }, []);

  useEffect(() => cleanup, [cleanup]);

  const start = useCallback(async () => {
    setError(null);
    setTranscript('');
    transcriptRef.current = '';
    samplesRef.current = [];
    chunksRef.current = [];

    let streamObj;
    try {
      streamObj = await navigator.mediaDevices.getUserMedia({ audio: true, video: withVideo });
    } catch {
      setError('Kein Mikrofon-Zugriff. Bitte erlaube den Zugriff und versuch es erneut.');
      return false;
    }
    streamRef.current = streamObj;
    setStream(streamObj);

    // Pegel messen für Pausen, Redeanteil und Dynamik
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 2048;
    audioCtx.createMediaStreamSource(streamObj).connect(analyser);
    audioCtxRef.current = audioCtx;

    const buffer = new Uint8Array(analyser.fftSize);
    
    // Adaptive Noise Floor Calibration (ca. 300ms)
    setIsCalibrating(true);
    let calibrationSamples = [];
    for(let k=0; k<6; k++) {
      analyser.getByteTimeDomainData(buffer);
      let sum = 0;
      for (let i = 0; i < buffer.length; i++) {
        const v = (buffer[i] - 128) / 128;
        sum += v * v;
      }
      calibrationSamples.push(Math.sqrt(sum / buffer.length));
      await new Promise(r => setTimeout(r, 50));
    }
    setIsCalibrating(false);
    
    // Use median (or lower quartile) to ignore sudden speech spikes
    calibrationSamples.sort((a, b) => a - b);
    const noiseFloor = calibrationSamples[2]; // Median of 6 samples
    // Set threshold slightly above noise floor, but within safe bounds
    silenceThresholdRef.current = Math.max(0.015, Math.min(0.08, noiseFloor * 2.0));

    // Audio aufnehmen (bleibt lokal im Browser, wird nirgends hochgeladen)
    const recorder = new MediaRecorder(streamObj);
    recorder.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
    recorder.start();
    mediaRecorderRef.current = recorder;

    timerRef.current = setInterval(() => {
      analyser.getByteTimeDomainData(buffer);
      let sum = 0;
      for (let i = 0; i < buffer.length; i++) {
        const v = (buffer[i] - 128) / 128;
        sum += v * v;
      }
      const rms = Math.sqrt(sum / buffer.length);
      samplesRef.current.push(rms);
      setLevel(Math.min(1, rms * 6));
    }, SAMPLE_INTERVAL_MS);

    // Transkript für die inhaltliche KI-Analyse
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = lang;
      recognition.onresult = (event) => {
        let text = '';
        for (let i = 0; i < event.results.length; i++) text += event.results[i][0].transcript + ' ';
        transcriptRef.current = text;
        setTranscript(text);
      };
      recognition.onerror = () => { /* Aufnahme läuft auch ohne Transkript weiter */ };
      try { recognition.start(); } catch { /* bereits gestartet */ }
      recognitionRef.current = recognition;
    } else {
      setError('Live-Transkription wird von diesem Browser nicht unterstützt. Bitte nutze Chrome oder Safari.');
    }

    startedAtRef.current = Date.now();
    setIsRecording(true);
    return true;
  }, [lang, withVideo]);

  const stop = useCallback(() => new Promise(resolve => {
    const durationMs = Date.now() - startedAtRef.current;
    const samples = samplesRef.current;
    const recorder = mediaRecorderRef.current;

    const finish = (audioUrl) => {
      cleanup();
      setIsRecording(false);
      setLevel(0);
      resolve({
        transcript: transcriptRef.current,
        audioUrl,
        ...analyzeSamples(samples, durationMs, silenceThresholdRef.current)
      });
    };

    if (recorder && recorder.state !== 'inactive') {
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType });
        finish(URL.createObjectURL(blob));
      };
      recorder.stop();
    } else {
      finish(null);
    }
    mediaRecorderRef.current = null;
  }), [cleanup]);

  return { isRecording, isCalibrating, transcript, level, error, start, stop, stream };
}
