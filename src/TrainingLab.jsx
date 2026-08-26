import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Activity,
  ArrowRight,
  BarChart3,
  Briefcase,
  CheckCircle,
  Clipboard,
  Download,
  FileText,
  Gauge,
  Lightbulb,
  MessageSquare,
  Mic,
  Play,
  Presentation,
  Sparkles,
  Square,
  Target,
  TimerReset,
  Trash2,
  X,
  Zap,
} from 'lucide-react'
import {
  analyseContentQuality,
  buildInterviewQuestions,
  buildPresentationQuestions,
  createBaselineProfile,
  QUICK_DRILLS,
} from './contentAnalysis.js'
import { clearBaselineProfile, readBaselineProfile, saveBaselineProfile } from './baselineStore.js'
import PersonalizedPractice from './PersonalizedPractice.jsx'

const BASELINE_DURATION = 60

const readHistory = () => {
  try {
    return JSON.parse(localStorage.getItem('speech-coach-history') || '[]')
  } catch {
    return []
  }
}

const skillLabels = {
  pace: 'Tempo',
  fillerControl: 'Füllwortkontrolle',
  clarity: 'Klarheit',
  structure: 'Struktur',
  impact: 'Wirkung',
}

function LabHeader({ onClose }) {
  return (
    <header className="training-lab-header">
      <div className="training-lab-brand"><span><Target size={20} /></span><div><strong>Training Lab</strong><small>Persönlich · konkret · messbar</small></div></div>
      <button className="lab-icon-button" onClick={onClose} aria-label="Training Lab schließen"><X size={20} /></button>
    </header>
  )
}

function BaselineCard({ baseline, onOpenSolo, onOpenAudio }) {
  const [status, setStatus] = useState(baseline ? 'result' : 'ready')
  const [transcript, setTranscript] = useState('')
  const [elapsed, setElapsed] = useState(0)
  const [error, setError] = useState('')
  const [result, setResult] = useState(baseline)
  const recognitionRef = useRef(null)
  const timerRef = useRef(null)
  const startedRef = useRef(0)
  const transcriptRef = useRef('')
  const activeRef = useRef(false)

  useEffect(() => () => {
    activeRef.current = false
    if (timerRef.current) window.clearInterval(timerRef.current)
    try { recognitionRef.current?.abort() } catch { /* already inactive */ }
  }, [])

  useEffect(() => {
    if (!baseline || activeRef.current) return
    setResult(baseline)
    setStatus('result')
  }, [baseline])

  const finish = () => {
    if (!activeRef.current) return
    activeRef.current = false
    if (timerRef.current) window.clearInterval(timerRef.current)
    timerRef.current = null
    try { recognitionRef.current?.stop() } catch { /* browser already stopped */ }
    const durationMs = Math.max(1000, Math.min(BASELINE_DURATION * 1000, Date.now() - startedRef.current))
    const profile = createBaselineProfile(transcriptRef.current, durationMs)
    const stored = saveBaselineProfile(profile)
    setResult(stored || profile)
    setStatus('result')
    setElapsed(durationMs)
    transcriptRef.current = ''
    setTranscript('')
  }

  const start = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      setError('Die 60-Sekunden-Baseline benötigt Browser-Spracherkennung. Nutze einen aktuellen Chrome- oder Edge-Browser.')
      return
    }

    setError('')
    setTranscript('')
    transcriptRef.current = ''
    setElapsed(0)
    setStatus('recording')
    activeRef.current = true
    startedRef.current = Date.now()

    const recognition = new SpeechRecognition()
    recognition.lang = 'de-DE'
    recognition.continuous = true
    recognition.interimResults = true
    recognition.onresult = (event) => {
      let complete = ''
      for (let index = 0; index < event.results.length; index += 1) complete += `${event.results[index][0].transcript} `
      transcriptRef.current = complete.trim()
      setTranscript(transcriptRef.current)
    }
    recognition.onerror = (event) => {
      if (!activeRef.current || event.error === 'aborted') return
      setError(event.error === 'not-allowed' ? 'Der Mikrofonzugriff wurde abgelehnt.' : 'Die Spracherkennung wurde unterbrochen.')
      activeRef.current = false
      setStatus(result ? 'result' : 'ready')
      if (timerRef.current) window.clearInterval(timerRef.current)
    }
    recognition.onend = () => {
      if (!activeRef.current) return
      if (Date.now() - startedRef.current >= BASELINE_DURATION * 1000) finish()
      else {
        try { recognition.start() } catch { finish() }
      }
    }
    recognitionRef.current = recognition

    try {
      recognition.start()
      timerRef.current = window.setInterval(() => {
        const next = Date.now() - startedRef.current
        setElapsed(next)
        if (next >= BASELINE_DURATION * 1000) finish()
      }, 200)
    } catch {
      activeRef.current = false
      setStatus(result ? 'result' : 'ready')
      setError('Die Baseline konnte nicht gestartet werden. Prüfe den Mikrofonzugriff.')
    }
  }

  const stop = () => finish()
  const removeBaseline = () => {
    clearBaselineProfile()
    setResult(null)
    setTranscript('')
    transcriptRef.current = ''
    setElapsed(0)
    setStatus('ready')
  }
  const exportBaseline = () => {
    if (!result) return
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `speechcoach-baseline-${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    URL.revokeObjectURL(url)
  }
  const remaining = Math.max(0, BASELINE_DURATION - Math.floor(elapsed / 1000))

  return (
    <section className="lab-panel lab-baseline">
      <div className="lab-panel-heading"><span><Target size={20} /></span><div><small>Startprofil</small><h2>60-Sekunden-Baseline</h2><p>Eine freie Antwort erstellt dein persönliches Startprofil für Tempo, Klarheit, Struktur und Wirkung.</p></div></div>

      {status !== 'result' && (
        <>
          <div className="baseline-prompt"><Lightbulb size={18} /><div><strong>Aufgabe</strong><span>Erkläre in 60 Sekunden eine Fähigkeit, die im Alltag oder Beruf unterschätzt wird. Begründe deine Wahl mit einem Beispiel.</span></div></div>
          <div className="baseline-recorder">
            <div className={status === 'recording' ? 'baseline-orb active' : 'baseline-orb'}><Mic size={30} /></div>
            <strong>{status === 'recording' ? `${remaining}s` : '01:00'}</strong>
            <span>{status === 'recording' ? 'Sprich frei. Eine kurze Denkpause ist besser als ein Füllwort.' : 'Gespeichert werden nur die abgeleiteten Startwerte – nicht dein Baseline-Rohtranskript.'}</span>
          </div>
          {transcript && <div className="lab-transcript" aria-live="polite">{transcript}</div>}
          {error && <div className="lab-warning">{error}</div>}
          <button className="lab-primary" onClick={status === 'recording' ? stop : start}>{status === 'recording' ? <><Square size={18} /> Baseline beenden</> : <><Play size={18} /> Baseline starten</>}</button>
        </>
      )}

      {status === 'result' && result && (
        <div className="baseline-result">
          <div className="baseline-score"><strong>{result.overall}</strong><span>Startniveau</span></div>
          <div className="baseline-skills">{Object.entries(result.skills).map(([key, value]) => <div key={key}><span>{skillLabels[key]}</span><strong>{value}</strong><i><b style={{ width: `${value}%` }} /></i></div>)}</div>
          <div className="baseline-focus"><Sparkles size={18} /><span>Erster Fokus: <strong>{result.weakest.map((item) => skillLabels[item.key]).join(' + ')}</strong></span></div>
          <div className="lab-actions"><button onClick={onOpenSolo}><Zap size={17} /> Solo trainieren</button><button onClick={onOpenAudio}><Activity size={17} /> Stimme messen</button><button onClick={start}><Play size={17} /> Neu messen</button><button onClick={exportBaseline}><Download size={17} /> Baseline exportieren</button><button onClick={removeBaseline}><Trash2 size={17} /> Baseline löschen</button></div>
        </div>
      )}
    </section>
  )
}

function ContentInsights() {
  const history = useMemo(readHistory, [])
  const soloSessions = history.filter((item) => item?.transcript)
  const [selectedId, setSelectedId] = useState(soloSessions[0]?.id || '')
  const selected = soloSessions.find((item) => item.id === selectedId) || soloSessions[0]
  const analysis = useMemo(() => selected ? analyseContentQuality(selected.transcript, { durationMs: selected.durationMs }) : null, [selected])

  return (
    <section className="lab-panel">
      <div className="lab-panel-heading"><span><BarChart3 size={20} /></span><div><small>Analyse 2.0</small><h2>Was du sagst – nicht nur wie schnell</h2><p>Regelbasierte Hinweise zu Präzision, Abschwächungen, Wiederholungen, Struktur und Belegen.</p></div></div>
      {!analysis ? <div className="lab-empty">Schließe zuerst eine Solo-Übung mit Transkript ab. Danach erscheint hier die Inhaltsanalyse.</div> : (
        <>
          <label className="lab-field"><span>Solo-Aufnahme auswählen</span><select value={selected?.id || ''} onChange={(event) => setSelectedId(event.target.value)}>{soloSessions.slice(0, 12).map((item) => <option key={item.id} value={item.id}>{item.topic?.title || 'Training'} · {new Date(item.createdAt).toLocaleDateString('de-DE')}</option>)}</select></label>
          <div className="content-score-grid">
            <div><Gauge size={18} /><span>Präzision</span><strong>{analysis.precision}</strong></div>
            <div><Target size={18} /><span>Struktur</span><strong>{analysis.structure}</strong></div>
            <div><MessageSquare size={18} /><span>Kürze</span><strong>{analysis.conciseness}</strong></div>
            <div><CheckCircle size={18} /><span>Belege</span><strong>{analysis.evidence}</strong></div>
          </div>
          <div className="content-signals"><span>Abschwächungen <strong>{analysis.hedgeCount}</strong></span><span>Wiederholungen <strong>{analysis.repeatedPhraseCount}</strong></span><span>Beispiel <strong>{analysis.hasExample ? 'Ja' : 'Nein'}</strong></span><span>Nächster Schritt <strong>{analysis.hasCallToAction ? 'Ja' : 'Nein'}</strong></span></div>
          {analysis.hedgeDetails.length > 0 && <div className="lab-tags">{analysis.hedgeDetails.map((item) => <span key={item.label}>{item.label} <strong>{item.count}×</strong></span>)}</div>}
          <div className="lab-feedback"><div><strong>Stärken</strong>{analysis.strengths.map((item) => <p key={item}>{item}</p>)}</div><div><strong>Nächster Fokus</strong>{analysis.improvements.map((item) => <p key={item}>{item}</p>)}</div></div>
        </>
      )}
    </section>
  )
}

function InterviewBuilder({ onStartPractice }) {
  const [cv, setCv] = useState('')
  const [job, setJob] = useState('')
  const result = useMemo(() => cv.trim() && job.trim() ? buildInterviewQuestions(cv, job) : null, [cv, job])

  const readTextFile = (setter) => (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (file.size > 300_000) return
    file.text().then(setter).catch(() => {})
  }

  return (
    <section className="lab-panel">
      <div className="lab-panel-heading"><span><Briefcase size={20} /></span><div><small>Bewerbung personalisieren</small><h2>Lebenslauf + Stellenanzeige → echte Fragen</h2><p>SpeechCoach baut daraus lokal einen fokussierten Fragenkatalog. Textdateien bleiben im Browser.</p></div></div>
      <div className="builder-grid">
        <label className="lab-field"><span>Lebenslauf / Erfahrung</span><textarea value={cv} onChange={(event) => setCv(event.target.value)} placeholder="Ausbildung, Erfahrung, Projekte, Stärken …" /><em><FileText size={14} /> Textdatei laden <input type="file" accept=".txt,.md,.csv,text/plain,text/markdown,text/csv" onChange={readTextFile(setCv)} /></em></label>
        <label className="lab-field"><span>Stellenanzeige</span><textarea value={job} onChange={(event) => setJob(event.target.value)} placeholder="Aufgaben, Anforderungen, gewünschte Fähigkeiten …" /><em><FileText size={14} /> Textdatei laden <input type="file" accept=".txt,.md,.csv,text/plain,text/markdown,text/csv" onChange={readTextFile(setJob)} /></em></label>
      </div>
      {result && <div className="builder-result"><div className="lab-tags">{result.jobKeywords.slice(0, 6).map((item) => <span key={item}>{item}</span>)}</div><ol>{result.questions.map((question) => <li key={question}>{question}</li>)}</ol><button className="lab-primary" onClick={() => onStartPractice({ modeId: 'interview', title: 'Personalisierte Bewerbungssimulation', questions: result.questions })}><MessageSquare size={18} /> Personalisierte Probe starten <ArrowRight size={17} /></button></div>}
    </section>
  )
}

function PresentationBuilder({ onStartPractice }) {
  const [notes, setNotes] = useState('')
  const result = useMemo(() => notes.trim() ? buildPresentationQuestions(notes) : null, [notes])

  return (
    <section className="lab-panel">
      <div className="lab-panel-heading"><span><Presentation size={20} /></span><div><small>Präsentation 2.0</small><h2>Notizen → Publikums-Q&A</h2><p>Bereite kritische Rückfragen vor, bevor du vor echtem Publikum präsentierst.</p></div></div>
      <label className="lab-field"><span>Präsentationsnotizen oder Folieninhalt</span><textarea className="presentation-notes" value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Füge hier Kernaussagen, Foliennotizen oder deinen Pitch ein …" /></label>
      {result && <div className="presentation-result"><div><strong><Clipboard size={17} /> Vorher prüfen</strong>{result.checklist.map((item) => <p key={item}><CheckCircle size={15} /> {item}</p>)}</div><div><strong><MessageSquare size={17} /> Kritische Fragen</strong>{result.questions.map((item) => <p key={item}>{item}</p>)}</div><button className="lab-primary" onClick={() => onStartPractice({ modeId: 'presentation', title: 'Personalisierte Präsentations-Q&A', questions: result.questions })}>Personalisierte Q&A-Probe starten <ArrowRight size={17} /></button></div>}
    </section>
  )
}

function QuickDrills({ onOpenSolo, onOpenCoach, onOpenAudio }) {
  return (
    <section className="lab-panel">
      <div className="lab-panel-heading"><span><TimerReset size={20} /></span><div><small>Warm-up</small><h2>5-Minuten-Drills</h2><p>Kleine Übungen für Tage, an denen ein komplettes Training zu viel wäre.</p></div></div>
      <div className="drill-grid">{QUICK_DRILLS.map((drill) => <article key={drill.id}><div><TimerReset size={17} /><span>{drill.duration}</span></div><h3>{drill.title}</h3><p>{drill.instruction}</p></article>)}</div>
      <div className="lab-actions"><button onClick={onOpenSolo}>Solo öffnen</button><button onClick={onOpenCoach}>Live-Coach öffnen</button><button onClick={onOpenAudio}>Audio-Labor öffnen</button></div>
    </section>
  )
}

export default function TrainingLab({ onClose, onOpenSolo, onOpenCoach, onOpenAudio }) {
  const [baseline, setBaseline] = useState(readBaselineProfile)
  const [practice, setPractice] = useState(null)

  useEffect(() => {
    const refresh = () => setBaseline(readBaselineProfile())
    window.addEventListener('speechcoach:data-changed', refresh)
    return () => window.removeEventListener('speechcoach:data-changed', refresh)
  }, [])

  return (
    <motion.div className="training-lab-overlay" role="dialog" aria-modal="true" aria-label="Training Lab" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <LabHeader onClose={onClose} />
      <main className="training-lab-content">
        {practice ? (
          <PersonalizedPractice preset={practice} onBack={() => setPractice(null)} />
        ) : (
          <>
            <section className="training-lab-hero"><div className="training-lab-eyebrow"><Sparkles size={15} /> Persönlicher als Standardübungen</div><h1>Trainiere genau das, <span>was dir noch fehlt.</span></h1><p>Baseline, Inhaltsanalyse, Bewerbungspersonalisierung, Präsentations-Q&A und schnelle Warm-ups in einem Bereich.</p></section>
            <BaselineCard baseline={baseline} onOpenSolo={onOpenSolo} onOpenAudio={onOpenAudio} />
            <ContentInsights />
            <InterviewBuilder onStartPractice={setPractice} />
            <PresentationBuilder onStartPractice={setPractice} />
            <QuickDrills onOpenSolo={onOpenSolo} onOpenCoach={onOpenCoach} onOpenAudio={onOpenAudio} />
            <p className="training-lab-note">Die Inhaltsanalyse nutzt transparente sprachliche Heuristiken. Sie bewertet keine Persönlichkeit, Emotionen, Eignung oder psychischen Zustände. Das Baseline-Rohtranskript wird nach der Auswertung nicht dauerhaft gespeichert. Bewerbungstexte und Präsentationsnotizen bleiben lokal. Erst beim bewussten Start einer personalisierten Probe werden die daraus lokal erzeugten Fragen und deine Antworten an die vorhandene Coach-Auswertung gesendet.</p>
          </>
        )}
      </main>
    </motion.div>
  )
}