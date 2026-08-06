import { useEffect, useMemo, useRef, useState } from 'react'
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

const fillerPatterns = [
  /\b(?:ähm+|äh+|öhm+)\b/gi,
  /\balso\b/gi,
  /\bquasi\b/gi,
  /\bsozusagen\b/gi,
  /\birgendwie\b/gi,
  /\bgenau\b/gi,
  /\bhalt\b/gi,
]

const chooseMimeType = () => {
  if (!window.MediaRecorder) return ''
  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',
    'audio/ogg;codecs=opus',
  ]
  return candidates.find((type) => MediaRecorder.isTypeSupported?.(type)) || ''
}

const analyseTranscript = (text, durationMs) => {
  const words = text.trim().split(/\s+/).filter(Boolean)
  const minutes = Math.max(durationMs / 60000, 1 / 60)
  const fillerCount = fillerPatterns.reduce((sum, pattern) => sum + (text.match(pattern) || []).length, 0)
  return {
    words: words.length,
    wpm: Math.round(words.length / minutes),
    fillerCount,
  }
}

const storeAudioSession = (session) => {
  try {
    const previous = JSON.parse(localStorage.getItem('speech-coach-audio-history') || '[]')
    localStorage.setItem('speech-coach-audio-history', JSON.stringify([session, ...previous].slice(0, 20)))
  } catch {
    // Progress storage is optional and must never block the result.
  }
}

function Header({ subtitle, onBack, onClose }) {
  return (
    <header className="audio-lab-header">
      <div>{onBack && <button onClick={onBack} aria-label="Zurück"><ChevronLeft size={21} /></button>}</div>
      <div className="audio-lab-brand">
        <span><AudioLines size={20} /></span>
        <div><strong>Audio-Labor</strong><small>{subtitle}</small></div>
      </div>
      <div><button onClick={onClose} aria-label="Audio-Labor schließen"><X size={20} /></button></div>
    </header>
  )
}

function SetupView({ onStart, onClose }) {
  const [topic, setTopic] = useState(TOPICS[0])
  const [customTopic, setCustomTopic] = useState('')
  const [duration, setDuration] = useState(60)

  const randomTopic = () => {
    const alternatives = TOPICS.filter((item) => item !== topic)
    setTopic(alternatives[Math.floor(Math.random() * alternatives.length)] || TOPICS[0])
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

        <section className="audio-privacy-card">
          <ShieldCheck size={22} />
          <div><strong>Lokale Verarbeitung</strong><span>Die Audiodatei wird nicht automatisch hochgeladen. Nur die Kennzahlen werden für deinen lokalen Verlauf gespeichert.</span></div>
        </section>

        <section className="audio-setup-panel">
          <div className="audio-section-heading"><span>1</span><div><h2>Aufgabe</h2><p>Wähle einen Vorschlag oder formuliere ein eigenes Thema.</p></div></div>
          <div className="audio-topic-current">
            <span>Aktuelle Aufgabe</span>
            <strong>{customTopic.trim() || topic}</strong>
            <button onClick={randomTopic}><RotateCcw size={16} /> Zufällig wechseln</button>
          </div>
          <div className="audio-topic-grid">
            {TOPICS.map((item) => (
              <button
                key={item}
                className={!customTopic.trim() && topic === item ? 'active' : ''}
                onClick={() => {
                  setTopic(item)
                  setCustomTopic('')
                }}
              >
                {item}
              </button>
            ))}
          </div>
          <input
            className="audio-custom-topic"
            value={customTopic}
            onChange={(event) => setCustomTopic(event.target.value)}
            placeholder="Eigenes Thema eingeben"
          />
        </section>

        <section className="audio-setup-panel">
          <div className="audio-section-heading"><span>2</span><div><h2>Dauer</h2><p>Die Aufnahme stoppt automatisch.</p></div></div>
          <div className="audio-duration-options">
            {DURATIONS.map((option) => (
              <button key={option} className={duration === option ? 'active' : ''} onClick={() => setDuration(option)}>
                <Clock size={18} />
                <strong>{option < 60 ? option : option / 60}</strong>
                <span>{option < 60 ? 'Sekunden' : option === 60 ? 'Minute' : 'Minuten'}</span>
              </button>
            ))}
          </div>
        </section>

        <button className="audio-primary-action" onClick={() => onStart({ topic: customTopic.trim() || topic, duration })}>
          <Mic size={20} /> Aufnahme vorbereiten <ArrowRight size={19} />
        </button>
      </main>
    </motion.div>
  )
}

function RecordingView({ configuration, onCancel, onComplete }) {
  const [status, setStatus] = useState('ready')
  const [elapsedMs, setElapsedMs] = useState(0)
  const [level, setLevel] = useState(0)
  const [transcript, setTranscript] = useState('')
  const [error, setError] = useState('')
  const streamRef = useRef(null)
  const mediaRecorderRef = useRef(null)
  const audioContextRef = useRef(null)
  const analyserRef = useRef(null)
  const animationRef = useRef(null)
  const timerRef = useRef(null)
  const chunksRef = useRef([])
  const samplesRef = useRef([])
  const startTimeRef = useRef(0)
  const recognitionRef = useRef(null)
  const completedRef = useRef(false)
  const lastSampleRef = useRef(0)

  const cleanupCapture = () => {
    if (animationRef.current) cancelAnimationFrame(animationRef.current)
    if (timerRef.current) window.clearInterval(timerRef.current)
    try { recognitionRef.current?.stop() } catch { /* already stopped */ }
    streamRef.current?.getTracks().forEach((track) => track.stop())
    if (audioContextRef.current?.state !== 'closed') audioContextRef.current?.close().catch(() => {})
    animationRef.current = null
    timerRef.current = null
  }

  useEffect(() => cleanupCapture, [])

  const finishRecording = () => {
    if (completedRef.current) return
    completedRef.current = true
    const durationMs = Math.max(1000, performance.now() - startTimeRef.current)
    cleanupCapture()
    const mimeType = mediaRecorderRef.current?.mimeType || 'audio/webm'
    const blob = new Blob(chunksRef.current, { type: mimeType })
    const audioUrl = URL.createObjectURL(blob)
    const audioAnalysis = analyseAudioSamples(samplesRef.current, durationMs)
    const transcriptAnalysis = analyseTranscript(transcript, durationMs)
    const session = {
      id: `${Date.now()}-audio`,
      type: 'audio',
      title: configuration.topic,
      createdAt: new Date().toISOString(),
      durationMs,
      overall: audioAnalysis.score,
      scores: audioAnalysis.scores,
      pauseCount: audioAnalysis.pauseCount,
      longestPauseMs: audioAnalysis.longestPauseMs,
      transcriptAnalysis,
    }
    storeAudioSession(session)
    onComplete({
      topic: configuration.topic,
      durationMs,
      audioUrl,
      mimeType,
      transcript,
      transcriptAnalysis,
      analysis: audioAnalysis,
    })
  }

  const stopRecording = () => {
    if (status !== 'recording') return
    setStatus('processing')
    try {
      if (mediaRecorderRef.current?.state !== 'inactive') mediaRecorderRef.current.stop()
      else finishRecording()
    } catch {
      finishRecording()
    }
  }

  const sampleAudio = () => {
    const analyser = analyserRef.current
    if (!analyser || completedRef.current) return
    const now = performance.now()
    if (now - lastSampleRef.current >= 80) {
      const data = new Uint8Array(analyser.fftSize)
      analyser.getByteTimeDomainData(data)
      const rms = calculateRms(data)
      samplesRef.current.push({ timeMs: now - startTimeRef.current, value: rms })
      setLevel(Math.min(1, rms / 0.12))
      lastSampleRef.current = now
    }
    animationRef.current = requestAnimationFrame(sampleAudio)
  }

  const startTranscription = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) return
    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'de-DE'
    recognition.onresult = (event) => {
      let complete = ''
      for (let index = 0; index < event.results.length; index += 1) complete += `${event.results[index][0].transcript} `
      setTranscript(complete.trim())
    }
    recognition.onerror = () => {}
    recognition.onend = () => {
      if (!completedRef.current && mediaRecorderRef.current?.state === 'recording') {
        try { recognition.start() } catch { /* transcription remains optional */ }
      }
    }
    recognitionRef.current = recognition
    try { recognition.start() } catch { /* transcription remains optional */ }
  }

  const startRecording = async () => {
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      setError('Dieser Browser unterstützt keine lokale Audioaufnahme. Nutze eine aktuelle Version von Chrome, Edge, Firefox oder Safari.')
      return
    }

    setError('')
    completedRef.current = false
    chunksRef.current = []
    samplesRef.current = []
    setTranscript('')

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: false,
          channelCount: 1,
        },
      })
      streamRef.current = stream

      const AudioContextClass = window.AudioContext || window.webkitAudioContext
      const audioContext = new AudioContextClass()
      const analyser = audioContext.createAnalyser()
      analyser.fftSize = 1024
      analyser.smoothingTimeConstant = 0.18
      const source = audioContext.createMediaStreamSource(stream)
      source.connect(analyser)
      audioContextRef.current = audioContext
      analyserRef.current = analyser

      const mimeType = chooseMimeType()
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
      recorder.ondataavailable = (event) => {
        if (event.data?.size) chunksRef.current.push(event.data)
      }
      recorder.onstop = finishRecording
      mediaRecorderRef.current = recorder

      startTimeRef.current = performance.now()
      lastSampleRef.current = 0
      recorder.start(250)
      startTranscription()
      setStatus('recording')
      sampleAudio()

      timerRef.current = window.setInterval(() => {
        const current = performance.now() - startTimeRef.current
        setElapsedMs(current)
        if (current >= configuration.duration * 1000) stopRecording()
      }, 100)
    } catch (captureError) {
      cleanupCapture()
      if (captureError?.name === 'NotAllowedError') setError('Der Mikrofonzugriff wurde abgelehnt. Erlaube ihn in den Browser-Einstellungen und versuche es erneut.')
      else if (captureError?.name === 'NotFoundError') setError('Es wurde kein verfügbares Mikrofon gefunden.')
      else setError('Die Audioaufnahme konnte nicht gestartet werden. Prüfe dein Mikrofon und versuche es erneut.')
    }
  }

  const remainingMs = Math.max(0, configuration.duration * 1000 - elapsedMs)
  const progress = Math.min(100, (elapsedMs / (configuration.duration * 1000)) * 100)
  const bars = useMemo(() => Array.from({ length: 24 }, (_, index) => {
    const distance = Math.abs(index - 11.5) / 11.5
    return Math.max(0.12, level * (1 - distance * 0.55) * (0.72 + Math.random() * 0.28))
  }), [level])

  return (
    <motion.div className="audio-lab-screen" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <Header subtitle={status === 'recording' ? 'Aufnahme läuft' : status === 'processing' ? 'Analyse läuft' : 'Bereit'} onBack={onCancel} onClose={onCancel} />
      <main className="audio-recording-content">
        <section className="audio-recording-task">
          <span>Deine Aufgabe</span>
          <h1>{configuration.topic}</h1>
        </section>

        <div className={`audio-visualizer ${status === 'recording' ? 'active' : ''}`}>
          <div className="audio-visualizer-bars">
            {bars.map((height, index) => <i key={index} style={{ transform: `scaleY(${height})` }} />)}
          </div>
          <div className="audio-level-orb" style={{ '--audio-level': level }}><Mic size={42} /></div>
        </div>

        <div className="audio-recording-timer">
          <strong>{formatMilliseconds(remainingMs)}</strong>
          <span>{status === 'recording' ? 'Verbleibende Zeit' : `${configuration.duration} Sekunden Aufnahmezeit`}</span>
          <div><i style={{ width: `${progress}%` }} /></div>
        </div>

        {error && <div className="audio-error"><AlertCircle size={19} /> {error}</div>}

        <section className="audio-live-transcript" aria-live="polite">
          <span>Optionales Live-Transkript</span>
          <p>{transcript || (status === 'recording' ? 'Die Transkription hört mit …' : 'Während der Aufnahme erscheint hier dein erkannter Text, sofern der Browser dies unterstützt.')}</p>
        </section>

        <div className="audio-recording-actions">
          {status === 'ready' && <button className="audio-primary-action" onClick={startRecording}><Play size={20} fill="currentColor" /> Aufnahme starten</button>}
          {status === 'recording' && <button className="audio-stop-action" onClick={stopRecording}><Square size={19} fill="currentColor" /> Aufnahme beenden</button>}
          {status === 'processing' && <div className="audio-processing"><Waves size={21} /> Audiospur wird ausgewertet …</div>}
        </div>
      </main>
    </motion.div>
  )
}

function ScoreBar({ label, score, icon: Icon }) {
  return (
    <div className="audio-score-row">
      <span><Icon size={17} /> {label}</span>
      <strong>{score}</strong>
      <div><i style={{ width: `${score}%` }} /></div>
    </div>
  )
}

function ResultView({ result, onRepeat, onNew, onClose }) {
  const audioRef = useRef(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentMs, setCurrentMs] = useState(0)
  const { analysis } = result

  useEffect(() => () => URL.revokeObjectURL(result.audioUrl), [result.audioUrl])

  const seekTo = (timeMs) => {
    if (!audioRef.current) return
    audioRef.current.currentTime = timeMs / 1000
    audioRef.current.play().catch(() => {})
  }

  const togglePlayback = () => {
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
          <div>
            <div className="audio-eyebrow"><CheckCircle size={15} /> Analyse abgeschlossen</div>
            <h1>{analysis.score >= 82 ? 'Lebendige Stimmwirkung.' : analysis.score >= 65 ? 'Solide stimmliche Grundlage.' : 'Deine Stimme kann deutlich mehr zeigen.'}</h1>
            <p>{result.topic} · {formatMilliseconds(result.durationMs)}</p>
          </div>
        </section>

        <section className="audio-player-panel">
          <button className="audio-play-button" onClick={togglePlayback}>{isPlaying ? <Pause size={22} fill="currentColor" /> : <Play size={22} fill="currentColor" />}</button>
          <div className="audio-player-copy"><strong>Deine Originalaufnahme</strong><span>{formatMilliseconds(currentMs)} / {formatMilliseconds(result.durationMs)}</span></div>
          <audio
            ref={audioRef}
            src={result.audioUrl}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onEnded={() => setIsPlaying(false)}
            onTimeUpdate={(event) => setCurrentMs(event.currentTarget.currentTime * 1000)}
          />
        </section>

        <section className="audio-timeline-panel">
          <div className="audio-panel-heading"><div><span>Audio-Zeitleiste</span><h2>Lautstärke und erkannte Pausen</h2></div><small>Klicke auf eine Stelle zum Anhören.</small></div>
          <div className="audio-timeline">
            <div className="audio-waveform">
              {analysis.timeline.map((sample, index) => (
                <button
                  key={`${sample.timeMs}-${index}`}
                  className={sample.speaking ? 'speaking' : 'silent'}
                  style={{ height: `${Math.max(8, sample.value * 100)}%` }}
                  onClick={() => seekTo(sample.timeMs)}
                  aria-label={`Zu ${formatMilliseconds(sample.timeMs)} springen`}
                />
              ))}
            </div>
            <div className="audio-pause-markers">
              {analysis.pauses.map((pause) => (
                <button
                  key={`${pause.startMs}-${pause.endMs}`}
                  className={`pause-${pause.severity}`}
                  style={{ left: `${(pause.startMs / result.durationMs) * 100}%`, width: `${Math.max(0.8, (pause.durationMs / result.durationMs) * 100)}%` }}
                  onClick={() => seekTo(pause.startMs)}
                  title={`Pause: ${(pause.durationMs / 1000).toFixed(1)} Sekunden`}
                />
              ))}
            </div>
          </div>
          <div className="audio-timeline-legend"><span><i className="speech" /> Stimme</span><span><i className="pause" /> Pause ab 0,45 Sek.</span><span><i className="long-pause" /> Lange Pause</span></div>
        </section>

        <section className="audio-metrics-grid">
          <div><Volume2 size={21} /><span>Stimmenergie</span><strong>{analysis.scores.energy}</strong><small>Grundlautstärke und Präsenz</small></div>
          <div><Activity size={21} /><span>Dynamik</span><strong>{analysis.scores.dynamics}</strong><small>Variation statt Monotonie</small></div>
          <div><Clock size={21} /><span>Pausen</span><strong>{analysis.pauseCount}</strong><small>Längste: {(analysis.longestPauseMs / 1000).toFixed(1)} Sek.</small></div>
          <div><Gauge size={21} /><span>Sprechanteil</span><strong>{Math.round(analysis.activeSpeechRatio * 100)}%</strong><small>Aktive Stimme in der Aufnahme</small></div>
        </section>

        <section className="audio-score-panel">
          <ScoreBar label="Energie" score={analysis.scores.energy} icon={Volume2} />
          <ScoreBar label="Dynamik" score={analysis.scores.dynamics} icon={Waves} />
          <ScoreBar label="Pausengestaltung" score={analysis.scores.pauses} icon={Clock} />
          <ScoreBar label="Sprachfluss" score={analysis.scores.flow} icon={Activity} />
        </section>

        <section className="audio-feedback-grid">
          <div className="audio-feedback-card strength"><div><CheckCircle size={20} /><h2>Stärken</h2></div><ul>{(analysis.strengths.length ? analysis.strengths : ['Die Aufnahme wurde erfolgreich analysiert.']).map((item) => <li key={item}>{item}</li>)}</ul></div>
          <div className="audio-feedback-card improve"><div><Sparkles size={20} /><h2>Nächster Fokus</h2></div><ul>{analysis.improvements.map((item) => <li key={item}>{item}</li>)}</ul></div>
        </section>

        {result.transcript && (
          <section className="audio-transcript-result">
            <div className="audio-panel-heading"><div><span>Sprachdaten</span><h2>Erkanntes Transkript</h2></div><small>{result.transcriptAnalysis.words} Wörter · {result.transcriptAnalysis.wpm} Wörter/Min. · {result.transcriptAnalysis.fillerCount} Füllwörter</small></div>
            <p>{result.transcript}</p>
          </section>
        )}

        <section className="audio-result-actions">
          <button className="audio-primary-action" onClick={onRepeat}><RotateCcw size={18} /> Gleiche Aufgabe wiederholen</button>
          <button className="audio-secondary-action" onClick={onNew}><ArrowRight size={18} /> Neue Aufgabe</button>
        </section>

        <p className="audio-analysis-note">Die Werte sind browserbasierte Trainingsindikatoren und keine medizinische oder logopädische Beurteilung. Mikrofon, Raum und Abstand beeinflussen die Lautstärkewerte.</p>
      </main>
    </motion.div>
  )
}

export default function AudioLab({ onClose }) {
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
      {view === 'setup' && <SetupView onStart={start} onClose={onClose} />}
      {view === 'recording' && configuration && (
        <RecordingView
          configuration={configuration}
          onCancel={() => setView('setup')}
          onComplete={(nextResult) => {
            setResult(nextResult)
            setView('result')
          }}
        />
      )}
      {view === 'result' && result && (
        <ResultView
          result={result}
          onRepeat={() => start(configuration)}
          onNew={() => setView('setup')}
          onClose={onClose}
        />
      )}
    </div>
  )
}
