import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Activity,
  AlertCircle,
  ArrowRight,
  AudioLines,
  CheckCircle,
  ChevronLeft,
  Clock,
  Gauge,
  Mic,
  Pause,
  Play,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Square,
  Volume2,
  Waves,
  X,
} from 'lucide-react'
import { analyseAudioSamples, calculateRms, formatMilliseconds } from './audioAnalysis'

const DURATIONS = [30, 60, 120]
const TOPICS = [
  'Stelle dich und deine wichtigsten Stärken vor.',
  'Erkläre eine Fähigkeit, die im Alltag unterschätzt wird.',
  'Beschreibe einen Fehler und was du daraus gelernt hast.',
  'Argumentiere für oder gegen eine Vier-Tage-Woche.',
  'Erkläre ein technisches Thema ohne Fachbegriffe.',
  'Präsentiere eine eigene Idee in höchstens einer Minute.',
]
const FILLERS = [/\b(?:ähm+|äh+|öhm+)\b/gi, /\balso\b/gi, /\bquasi\b/gi, /\bsozusagen\b/gi, /\birgendwie\b/gi, /\bgenau\b/gi, /\bhalt\b/gi]

const getMimeType = () => {
  if (!window.MediaRecorder) return ''
  return ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus']
    .find((type) => MediaRecorder.isTypeSupported?.(type)) || ''
}

const analyseTranscript = (text, durationMs) => {
  const words = text.trim().split(/\s+/).filter(Boolean)
  const minutes = Math.max(durationMs / 60000, 1 / 60)
  return {
    words: words.length,
    wpm: Math.round(words.length / minutes),
    fillerCount: FILLERS.reduce((sum, pattern) => sum + (text.match(pattern) || []).length, 0),
  }
}

const saveSession = (session) => {
  try {
    const previous = JSON.parse(localStorage.getItem('speech-coach-audio-history') || '[]')
    localStorage.setItem('speech-coach-audio-history', JSON.stringify([session, ...previous].slice(0, 20)))
  } catch {
    // Local history must never block the result.
  }
}

function Header({ subtitle, onBack, onClose }) {
  return (
    <header className="audio-lab-header">
      <div>{onBack && <button onClick={onBack} aria-label="Zurück"><ChevronLeft size={21} /></button>}</div>
      <div className="audio-lab-brand"><span><AudioLines size={20} /></span><div><strong>Audio-Labor</strong><small>{subtitle}</small></div></div>
      <div><button onClick={onClose} aria-label="Audio-Labor schließen"><X size={20} /></button></div>
    </header>
  )
}

function Setup({ onStart, onClose }) {
  const [topic, setTopic] = useState(TOPICS[0])
  const [customTopic, setCustomTopic] = useState('')
  const [duration, setDuration] = useState(60)

  const randomize = () => {
    const pool = TOPICS.filter((item) => item !== topic)
    setTopic(pool[Math.floor(Math.random() * pool.length)] || TOPICS[0])
    setCustomTopic('')
  }

  return (
    <motion.div className="audio-lab-screen" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <Header subtitle="Aufnahme vorbereiten" onClose={onClose} />
      <main className="audio-lab-content audio-setup-content">
        <section className="audio-lab-intro">
          <div className="audio-eyebrow"><Waves size={15} /> Stimme und Pausen sichtbar machen</div>
          <h1>Höre nicht nur, <span>wie du sprichst.</span> Sieh es.</h1>
          <p>Das Audio-Labor zeichnet deine Stimme lokal auf und analysiert Lautstärke, Dynamik, Sprechanteil und Pausen direkt im Browser.</p>
        </section>
        <section className="audio-privacy-card"><ShieldCheck size={22} /><div><strong>Lokale Verarbeitung</strong><span>Die Audiodatei wird nicht automatisch hochgeladen. Nur Kennzahlen werden lokal im Verlauf gespeichert.</span></div></section>

        <section className="audio-setup-panel">
          <div className="audio-section-heading"><span>1</span><div><h2>Aufgabe</h2><p>Vorschlag, Zufall oder eigenes Thema.</p></div></div>
          <div className="audio-topic-current"><span>Aktuelle Aufgabe</span><strong>{customTopic.trim() || topic}</strong><button onClick={randomize}><RotateCcw size={16} /> Zufällig wechseln</button></div>
          <div className="audio-topic-grid">
            {TOPICS.map((item) => <button key={item} className={!customTopic.trim() && topic === item ? 'active' : ''} onClick={() => { setTopic(item); setCustomTopic('') }}>{item}</button>)}
          </div>
          <input className="audio-custom-topic" value={customTopic} onChange={(event) => setCustomTopic(event.target.value)} placeholder="Eigenes Thema eingeben" />
        </section>

        <section className="audio-setup-panel">
          <div className="audio-section-heading"><span>2</span><div><h2>Dauer</h2><p>Die Aufnahme stoppt automatisch.</p></div></div>
          <div className="audio-duration-options">
            {DURATIONS.map((option) => <button key={option} className={duration === option ? 'active' : ''} onClick={() => setDuration(option)}><Clock size={18} /><strong>{option < 60 ? option : option / 60}</strong><span>{option < 60 ? 'Sekunden' : option === 60 ? 'Minute' : 'Minuten'}</span></button>)}
          </div>
        </section>

        <button className="audio-primary-action" onClick={() => onStart({ topic: customTopic.trim() || topic, duration })}><Mic size={20} /> Aufnahme vorbereiten <ArrowRight size={19} /></button>
      </main>
    </motion.div>
  )
}

function Recorder({ configuration, onBack, onComplete }) {
  const [status, setStatus] = useState('ready')
  const [elapsedMs, setElapsedMs] = useState(0)
  const [level, setLevel] = useState(0)
  const [transcript, setTranscript] = useState('')
  const [error, setError] = useState('')
  const statusRef = useRef('ready')
  const streamRef = useRef(null)
  const recorderRef = useRef(null)
  const audioContextRef = useRef(null)
  const analyserRef = useRef(null)
  const recognitionRef = useRef(null)
  const animationRef = useRef(null)
  const timerRef = useRef(null)
  const samplesRef = useRef([])
  const chunksRef = useRef([])
  const transcriptRef = useRef('')
  const startRef = useRef(0)
  const lastSampleRef = useRef(0)
  const completedRef = useRef(false)

  const updateStatus = (value) => {
    statusRef.current = value
    setStatus(value)
  }

  const stopResources = () => {
    if (animationRef.current) cancelAnimationFrame(animationRef.current)
    if (timerRef.current) clearInterval(timerRef.current)
    animationRef.current = null
    timerRef.current = null
    try { recognitionRef.current?.abort() } catch { /* already inactive */ }
    streamRef.current?.getTracks().forEach((track) => track.stop())
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') audioContextRef.current.close().catch(() => {})
  }

  useEffect(() => () => stopResources(), [])

  const finalize = () => {
    if (completedRef.current) return
    completedRef.current = true
    const durationMs = Math.max(1000, performance.now() - startRef.current)
    stopResources()
    const mimeType = recorderRef.current?.mimeType || 'audio/webm'
    const blob = new Blob(chunksRef.current, { type: mimeType })
    const audioUrl = URL.createObjectURL(blob)
    const analysis = analyseAudioSamples(samplesRef.current, durationMs)
    const transcriptAnalysis = analyseTranscript(transcriptRef.current, durationMs)
    saveSession({
      id: `${Date.now()}-audio`,
      type: 'audio',
      title: configuration.topic,
      createdAt: new Date().toISOString(),
      durationMs,
      overall: analysis.score,
      scores: analysis.scores,
      pauseCount: analysis.pauseCount,
      longestPauseMs: analysis.longestPauseMs,
      transcriptAnalysis,
    })
    onComplete({ topic: configuration.topic, durationMs, audioUrl, transcript: transcriptRef.current, transcriptAnalysis, analysis })
  }

  const requestStop = () => {
    if (statusRef.current !== 'recording') return
    updateStatus('processing')
    try {
      if (recorderRef.current?.state === 'recording') recorderRef.current.stop()
      else finalize()
    } catch {
      finalize()
    }
  }

  const analyseFrame = () => {
    if (!analyserRef.current || statusRef.current !== 'recording') return
    const now = performance.now()
    if (now - lastSampleRef.current >= 80) {
      const values = new Uint8Array(analyserRef.current.fftSize)
      analyserRef.current.getByteTimeDomainData(values)
      const rms = calculateRms(values)
      samplesRef.current.push({ timeMs: now - startRef.current, value: rms })
      setLevel(Math.min(1, rms / 0.12))
      lastSampleRef.current = now
    }
    animationRef.current = requestAnimationFrame(analyseFrame)
  }

  const startRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) return
    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'de-DE'
    recognition.onresult = (event) => {
      let complete = ''
      for (let index = 0; index < event.results.length; index += 1) complete += `${event.results[index][0].transcript} `
      transcriptRef.current = complete.trim()
      setTranscript(transcriptRef.current)
    }
    recognition.onerror = () => {}
    recognition.onend = () => {
      if (statusRef.current === 'recording') {
        try { recognition.start() } catch { /* transcription is optional */ }
      }
    }
    recognitionRef.current = recognition
    try { recognition.start() } catch { /* transcription is optional */ }
  }

  const start = async () => {
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      setError('Dieser Browser unterstützt keine lokale Audioaufnahme. Nutze einen aktuellen Browser.')
      return
    }
    setError('')
    setElapsedMs(0)
    setLevel(0)
    setTranscript('')
    transcriptRef.current = ''
    samplesRef.current = []
    chunksRef.current = []
    completedRef.current = false

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: false, channelCount: 1 } })
      streamRef.current = stream
      const Context = window.AudioContext || window.webkitAudioContext
      const context = new Context()
      const analyser = context.createAnalyser()
      analyser.fftSize = 1024
      analyser.smoothingTimeConstant = 0.18
      context.createMediaStreamSource(stream).connect(analyser)
      audioContextRef.current = context
      analyserRef.current = analyser

      const mimeType = getMimeType()
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
      recorder.ondataavailable = (event) => { if (event.data?.size) chunksRef.current.push(event.data) }
      recorder.onstop = finalize
      recorderRef.current = recorder

      startRef.current = performance.now()
      lastSampleRef.current = 0
      updateStatus('recording')
      recorder.start(250)
      startRecognition()
      analyseFrame()
      timerRef.current = setInterval(() => {
        const current = performance.now() - startRef.current
        setElapsedMs(current)
        if (current >= configuration.duration * 1000) requestStop()
      }, 100)
    } catch (captureError) {
      stopResources()
      updateStatus('ready')
      if (captureError?.name === 'NotAllowedError') setError('Der Mikrofonzugriff wurde abgelehnt. Erlaube ihn in den Browser-Einstellungen.')
      else if (captureError?.name === 'NotFoundError') setError('Es wurde kein verfügbares Mikrofon gefunden.')
      else setError('Die Audioaufnahme konnte nicht gestartet werden. Prüfe dein Mikrofon.')
    }
  }

  const bars = Array.from({ length: 24 }, (_, index) => {
    const distance = Math.abs(index - 11.5) / 11.5
    const variation = 0.82 + ((index * 17) % 10) / 50
    return Math.max(0.12, level * (1 - distance * 0.55) * variation)
  })
  const totalMs = configuration.duration * 1000
  const remainingMs = Math.max(0, totalMs - elapsedMs)
  const progress = Math.min(100, (elapsedMs / totalMs) * 100)

  return (
    <motion.div className="audio-lab-screen" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <Header subtitle={status === 'recording' ? 'Aufnahme läuft' : status === 'processing' ? 'Analyse läuft' : 'Bereit'} onBack={onBack} onClose={onBack} />
      <main className="audio-recording-content">
        <section className="audio-recording-task"><span>Deine Aufgabe</span><h1>{configuration.topic}</h1></section>
        <div className={`audio-visualizer ${status === 'recording' ? 'active' : ''}`}>
          <div className="audio-visualizer-bars">{bars.map((height, index) => <i key={index} style={{ transform: `scaleY(${height})` }} />)}</div>
          <div className="audio-level-orb" style={{ '--audio-level': level }}><Mic size={42} /></div>
        </div>
        <div className="audio-recording-timer"><strong>{formatMilliseconds(remainingMs)}</strong><span>{status === 'recording' ? 'Verbleibende Zeit' : `${configuration.duration} Sekunden Aufnahmezeit`}</span><div><i style={{ width: `${progress}%` }} /></div></div>
        {error && <div className="audio-error"><AlertCircle size={19} /> {error}</div>}
        <section className="audio-live-transcript" aria-live="polite"><span>Optionales Live-Transkript</span><p>{transcript || (status === 'recording' ? 'Die Transkription hört mit …' : 'Der erkannte Text erscheint hier, sofern dein Browser Spracherkennung unterstützt.')}</p></section>
        <div className="audio-recording-actions">
          {status === 'ready' && <button className="audio-primary-action" onClick={start}><Play size={20} fill="currentColor" /> Aufnahme starten</button>}
          {status === 'recording' && <button className="audio-stop-action" onClick={requestStop}><Square size={19} fill="currentColor" /> Aufnahme beenden</button>}
          {status === 'processing' && <div className="audio-processing"><Waves size={21} /> Audiospur wird ausgewertet …</div>}
        </div>
      </main>
    </motion.div>
  )
}

function ScoreRow({ label, value, icon: Icon }) {
  return <div className="audio-score-row"><span><Icon size={17} /> {label}</span><strong>{value}</strong><div><i style={{ width: `${value}%` }} /></div></div>
}

function Result({ result, onRepeat, onNew, onClose }) {
  const audioRef = useRef(null)
  const [playing, setPlaying] = useState(false)
  const [currentMs, setCurrentMs] = useState(0)
  const { analysis } = result

  useEffect(() => () => URL.revokeObjectURL(result.audioUrl), [result.audioUrl])

  const seek = (timeMs) => {
    if (!audioRef.current) return
    audioRef.current.currentTime = timeMs / 1000
    audioRef.current.play().catch(() => {})
  }
  const toggle = () => {
    if (!audioRef.current) return
    if (audioRef.current.paused) audioRef.current.play().catch(() => {})
    else audioRef.current.pause()
  }

  return (
    <motion.div className="audio-lab-screen" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <Header subtitle="Stimm- und Pausenanalyse" onClose={onClose} />
      <main className="audio-lab-content audio-result-content">
        <section className="audio-result-hero">
          <div className="audio-overall-score" style={{ '--audio-score': `${analysis.score * 3.6}deg` }}><div><strong>{analysis.score}</strong><span>Audio-Score</span></div></div>
          <div><div className="audio-eyebrow"><CheckCircle size={15} /> Analyse abgeschlossen</div><h1>{analysis.score >= 82 ? 'Lebendige Stimmwirkung.' : analysis.score >= 65 ? 'Solide stimmliche Grundlage.' : 'Deine Stimme kann deutlich mehr zeigen.'}</h1><p>{result.topic} · {formatMilliseconds(result.durationMs)}</p></div>
        </section>

        <section className="audio-player-panel"><button className="audio-play-button" onClick={toggle}>{playing ? <Pause size={22} fill="currentColor" /> : <Play size={22} fill="currentColor" />}</button><div className="audio-player-copy"><strong>Deine Originalaufnahme</strong><span>{formatMilliseconds(currentMs)} / {formatMilliseconds(result.durationMs)}</span></div><audio ref={audioRef} src={result.audioUrl} onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={() => setPlaying(false)} onTimeUpdate={(event) => setCurrentMs(event.currentTarget.currentTime * 1000)} /></section>

        <section className="audio-timeline-panel">
          <div className="audio-panel-heading"><div><span>Audio-Zeitleiste</span><h2>Lautstärke und erkannte Pausen</h2></div><small>Klicke zum Anhören.</small></div>
          <div className="audio-timeline"><div className="audio-waveform">{analysis.timeline.map((sample, index) => <button key={`${sample.timeMs}-${index}`} className={sample.speaking ? 'speaking' : 'silent'} style={{ height: `${Math.max(8, sample.value * 100)}%` }} onClick={() => seek(sample.timeMs)} aria-label={`Zu ${formatMilliseconds(sample.timeMs)} springen`} />)}</div><div className="audio-pause-markers">{analysis.pauses.map((pause) => <button key={`${pause.startMs}-${pause.endMs}`} className={`pause-${pause.severity}`} style={{ left: `${(pause.startMs / result.durationMs) * 100}%`, width: `${Math.max(0.8, (pause.durationMs / result.durationMs) * 100)}%` }} onClick={() => seek(pause.startMs)} title={`Pause: ${(pause.durationMs / 1000).toFixed(1)} Sekunden`} />)}</div></div>
          <div className="audio-timeline-legend"><span><i className="speech" /> Stimme</span><span><i className="pause" /> Pause</span><span><i className="long-pause" /> Lange Pause</span></div>
        </section>

        <section className="audio-metrics-grid">
          <div><Volume2 size={21} /><span>Stimmenergie</span><strong>{analysis.scores.energy}</strong><small>Grundlautstärke und Präsenz</small></div>
          <div><Activity size={21} /><span>Dynamik</span><strong>{analysis.scores.dynamics}</strong><small>Variation statt Monotonie</small></div>
          <div><Clock size={21} /><span>Pausen</span><strong>{analysis.pauseCount}</strong><small>Längste: {(analysis.longestPauseMs / 1000).toFixed(1)} Sek.</small></div>
          <div><Gauge size={21} /><span>Sprechanteil</span><strong>{Math.round(analysis.activeSpeechRatio * 100)}%</strong><small>Aktive Stimme</small></div>
        </section>

        <section className="audio-score-panel"><ScoreRow label="Energie" value={analysis.scores.energy} icon={Volume2} /><ScoreRow label="Dynamik" value={analysis.scores.dynamics} icon={Waves} /><ScoreRow label="Pausengestaltung" value={analysis.scores.pauses} icon={Clock} /><ScoreRow label="Sprachfluss" value={analysis.scores.flow} icon={Activity} /></section>

        <section className="audio-feedback-grid">
          <div className="audio-feedback-card strength"><div><CheckCircle size={20} /><h2>Stärken</h2></div><ul>{(analysis.strengths.length ? analysis.strengths : ['Die Aufnahme wurde erfolgreich analysiert.']).map((item) => <li key={item}>{item}</li>)}</ul></div>
          <div className="audio-feedback-card improve"><div><Sparkles size={20} /><h2>Nächster Fokus</h2></div><ul>{analysis.improvements.map((item) => <li key={item}>{item}</li>)}</ul></div>
        </section>

        {result.transcript && <section className="audio-transcript-result"><div className="audio-panel-heading"><div><span>Sprachdaten</span><h2>Erkanntes Transkript</h2></div><small>{result.transcriptAnalysis.words} Wörter · {result.transcriptAnalysis.wpm} Wörter/Min. · {result.transcriptAnalysis.fillerCount} Füllwörter</small></div><p>{result.transcript}</p></section>}

        <section className="audio-result-actions"><button className="audio-primary-action" onClick={onRepeat}><RotateCcw size={18} /> Wiederholen</button><button className="audio-secondary-action" onClick={onNew}><ArrowRight size={18} /> Neue Aufgabe</button></section>
        <p className="audio-analysis-note">Die Werte sind browserbasierte Trainingsindikatoren und keine medizinische oder logopädische Beurteilung. Mikrofon, Raum und Abstand beeinflussen die Messung.</p>
      </main>
    </motion.div>
  )
}

export default function AudioStudio({ onClose }) {
  const [view, setView] = useState('setup')
  const [configuration, setConfiguration] = useState(null)
  const [result, setResult] = useState(null)

  const start = (nextConfiguration) => {
    setConfiguration(nextConfiguration)
    setResult(null)
    setView('recording')
  }

  return (
    <div className="audio-lab-overlay">
      {view === 'setup' && <Setup onStart={start} onClose={onClose} />}
      {view === 'recording' && configuration && <Recorder configuration={configuration} onBack={() => setView('setup')} onComplete={(nextResult) => { setResult(nextResult); setView('result') }} />}
      {view === 'result' && result && <Result result={result} onRepeat={() => start(configuration)} onNew={() => setView('setup')} onClose={onClose} />}
    </div>
  )
}
