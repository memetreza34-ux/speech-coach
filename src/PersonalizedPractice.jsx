import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  Bot,
  CheckCircle,
  CircleStop,
  LoaderCircle,
  Mic,
  Send,
  Sparkles,
  Target,
  Volume2,
  VolumeX,
} from 'lucide-react'
import { COACH_MODES, DIFFICULTIES } from './coachScenarios.js'
import { requestCoachTurn } from './coachService.js'
import { abortActiveRequests } from './requestLifecycle.js'
import './personalized-practice.css'

const average = (values) => {
  const valid = values.map(Number).filter(Number.isFinite)
  return valid.length ? Math.round(valid.reduce((sum, value) => sum + value, 0) / valid.length) : 0
}

const savePractice = (preset, scores, rounds, source) => {
  try {
    const previous = JSON.parse(localStorage.getItem('speech-coach-dialog-history') || '[]')
    const entry = {
      id: `${Date.now()}-personalized`,
      mode: preset.modeId === 'interview' ? 'Bewerbung personalisiert' : 'Präsentations-Q&A personalisiert',
      topic: preset.title,
      difficulty: 'Realistisch',
      rounds,
      scores,
      source,
      createdAt: new Date().toISOString(),
    }
    localStorage.setItem('speech-coach-dialog-history', JSON.stringify([entry, ...previous].slice(0, 20)))
    window.dispatchEvent(new CustomEvent('speechcoach:data-changed', { detail: { source: 'personalized-practice' } }))
  } catch {
    // Local history is optional and must never block the result.
  }
}

export default function PersonalizedPractice({ preset, onBack }) {
  const mode = useMemo(() => COACH_MODES.find((item) => item.id === preset.modeId) || COACH_MODES[0], [preset.modeId])
  const questions = useMemo(() => (preset.questions || []).map((item) => String(item).trim()).filter(Boolean).slice(0, 5), [preset.questions])
  const difficulty = DIFFICULTIES[1]
  const [round, setRound] = useState(1)
  const [answer, setAnswer] = useState('')
  const [interimAnswer, setInterimAnswer] = useState('')
  const [feedback, setFeedback] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [voiceEnabled, setVoiceEnabled] = useState(true)
  const [error, setError] = useState('')
  const [completed, setCompleted] = useState(false)
  const [source, setSource] = useState('pending')
  const recognitionRef = useRef(null)
  const mountedRef = useRef(true)

  const currentQuestion = questions[Math.min(round - 1, Math.max(0, questions.length - 1))] || 'Erkläre deine Antwort konkret und mit einem Beispiel.'

  const speak = (text) => {
    if (!voiceEnabled || !('speechSynthesis' in window)) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'de-DE'
    utterance.rate = 0.98
    window.speechSynthesis.speak(utterance)
  }

  useEffect(() => {
    mountedRef.current = true
    speak(currentQuestion)
    return () => {
      mountedRef.current = false
      abortActiveRequests()
      window.speechSynthesis?.cancel()
      try { recognitionRef.current?.abort() } catch { /* already inactive */ }
    }
  }, [])

  useEffect(() => {
    if (!completed && round > 1) speak(currentQuestion)
  }, [round])

  const stopListening = () => {
    try { recognitionRef.current?.stop() } catch { /* already inactive */ }
    setIsListening(false)
  }

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      setError('Spracheingabe ist in diesem Browser nicht verfügbar. Du kannst deine Antwort eintippen.')
      return
    }

    setError('')
    const recognition = new SpeechRecognition()
    recognition.lang = 'de-DE'
    recognition.continuous = true
    recognition.interimResults = true
    recognitionRef.current = recognition
    let finalText = answer.trim()

    recognition.onresult = (event) => {
      let interim = ''
      let finalized = ''
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const text = event.results[index][0].transcript
        if (event.results[index].isFinal) finalized += `${text} `
        else interim += `${text} `
      }
      if (finalized.trim()) {
        finalText = `${finalText} ${finalized}`.trim()
        setAnswer(finalText)
      }
      setInterimAnswer(interim.trim())
    }
    recognition.onerror = (event) => {
      if (event.error !== 'aborted') setError(event.error === 'not-allowed' ? 'Mikrofonzugriff wurde abgelehnt.' : 'Spracheingabe wurde unterbrochen.')
      setIsListening(false)
    }
    recognition.onend = () => {
      setIsListening(false)
      setInterimAnswer('')
    }

    try {
      recognition.start()
      setIsListening(true)
    } catch {
      setError('Die Spracheingabe konnte nicht gestartet werden.')
    }
  }

  const finishPractice = (items, lastSource) => {
    const scores = {
      clarity: average(items.map((item) => item.scores.clarity)),
      structure: average(items.map((item) => item.scores.structure)),
      impact: average(items.map((item) => item.scores.impact)),
    }
    scores.overall = average([scores.clarity, scores.structure, scores.impact])
    savePractice(preset, scores, items.length, lastSource)
    setCompleted(true)
  }

  const submit = async () => {
    const text = `${answer} ${interimAnswer}`.trim()
    if (!text || isLoading || completed) return
    stopListening()
    setError('')
    setIsLoading(true)

    const priorConversation = feedback.flatMap((item) => [
      { role: 'coach', text: item.question },
      { role: 'user', text: item.answer },
    ])
    const conversation = [
      ...priorConversation,
      { role: 'coach', text: currentQuestion },
      { role: 'user', text },
    ].slice(-10)

    try {
      const result = await requestCoachTurn({
        mode,
        difficulty,
        topic: preset.title.slice(0, 220),
        round,
        totalRounds: questions.length || 1,
        conversation,
      })
      if (!mountedRef.current) return

      const nextFeedback = [...feedback, {
        round,
        question: currentQuestion,
        answer: text,
        microFeedback: result.microFeedback,
        scores: result.scores,
      }]
      setFeedback(nextFeedback)
      setSource(result.source)
      setAnswer('')
      setInterimAnswer('')

      if (round >= questions.length) finishPractice(nextFeedback, result.source)
      else setRound((current) => current + 1)
    } catch (requestError) {
      if (requestError?.name !== 'AbortError' && mountedRef.current) setError('Die Auswertung wurde unterbrochen. Versuche die Antwort erneut.')
    } finally {
      if (mountedRef.current) setIsLoading(false)
    }
  }

  const scoreSummary = completed ? {
    clarity: average(feedback.map((item) => item.scores.clarity)),
    structure: average(feedback.map((item) => item.scores.structure)),
    impact: average(feedback.map((item) => item.scores.impact)),
  } : null
  if (scoreSummary) scoreSummary.overall = average([scoreSummary.clarity, scoreSummary.structure, scoreSummary.impact])

  const goBack = () => {
    abortActiveRequests()
    onBack()
  }

  if (completed && scoreSummary) {
    return (
      <motion.section className="personalized-practice practice-summary" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <button className="practice-back" onClick={goBack}><ArrowLeft size={18} /> Zurück zum Training Lab</button>
        <div className="practice-summary-hero">
          <div className="practice-overall"><strong>{scoreSummary.overall}</strong><span>Gesamtscore</span></div>
          <div><span className="practice-kicker"><CheckCircle size={15} /> Personalisierte Probe abgeschlossen</span><h2>{preset.title}</h2><p>{feedback.length} vorbereitete Fragen · {source === 'ai' ? 'KI-Feedback' : 'lokales Fallback-Feedback'}</p></div>
        </div>
        <div className="practice-score-grid">
          <div><span>Klarheit</span><strong>{scoreSummary.clarity}</strong></div>
          <div><span>Struktur</span><strong>{scoreSummary.structure}</strong></div>
          <div><span>Wirkung</span><strong>{scoreSummary.impact}</strong></div>
        </div>
        <div className="practice-review-list">
          {feedback.map((item) => <article key={item.round}><span>{item.round}</span><div><strong>{item.question}</strong><p>{item.microFeedback}</p></div><b>{average([item.scores.clarity, item.scores.structure, item.scores.impact])}</b></article>)}
        </div>
        <button className="practice-primary" onClick={() => { setRound(1); setFeedback([]); setCompleted(false); setSource('pending') }}>Noch einmal trainieren</button>
      </motion.section>
    )
  }

  return (
    <motion.section className="personalized-practice" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <div className="practice-topbar">
        <button className="practice-back" onClick={goBack}><ArrowLeft size={18} /> Training Lab</button>
        <button className="practice-voice" onClick={() => { setVoiceEnabled((current) => !current); window.speechSynthesis?.cancel() }} aria-label={voiceEnabled ? 'Sprachausgabe ausschalten' : 'Sprachausgabe einschalten'}>{voiceEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}</button>
      </div>

      <div className="practice-heading">
        <span className="practice-kicker"><Sparkles size={15} /> Personalisierte Probe</span>
        <h2>{preset.title}</h2>
        <p>Nur die lokal erzeugte Frage und deine Antwort gehen in die Coach-Auswertung. Lebenslauf, Stellenanzeige oder vollständige Präsentationsnotizen werden nicht übertragen.</p>
      </div>

      <div className="practice-progress"><span style={{ width: `${((round - 1) / Math.max(1, questions.length)) * 100}%` }} /></div>

      <div className="practice-question-card">
        <div><Bot size={22} /><span>Frage {round} von {questions.length}</span></div>
        <h3>{currentQuestion}</h3>
      </div>

      {feedback.length > 0 && <div className="practice-last-feedback"><Target size={17} /><span><strong>Letzter Fokus:</strong> {feedback.at(-1).microFeedback}</span></div>}
      {error && <div className="practice-error">{error}</div>}
      {interimAnswer && <div className="practice-interim">{interimAnswer}</div>}

      <textarea value={answer} onChange={(event) => setAnswer(event.target.value)} placeholder="Antworte konkret. Nutze bei Bedarf Situation → Handlung → Ergebnis." disabled={isLoading} />
      <div className="practice-actions">
        <button className={isListening ? 'practice-mic active' : 'practice-mic'} onClick={isListening ? stopListening : startListening} disabled={isLoading}>{isListening ? <CircleStop size={18} /> : <Mic size={18} />}{isListening ? 'Aufnahme stoppen' : 'Antwort sprechen'}</button>
        <button className="practice-primary" onClick={submit} disabled={!`${answer} ${interimAnswer}`.trim() || isLoading}>{isLoading ? <LoaderCircle className="practice-spin" size={18} /> : <Send size={18} />}{isLoading ? 'Wird ausgewertet …' : 'Antwort auswerten'}</button>
      </div>
    </motion.section>
  )
}