import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowLeft,
  ArrowRight,
  Bot,
  CheckCircle,
  ChevronLeft,
  CircleStop,
  Gauge,
  LoaderCircle,
  MessageCircleMore,
  Mic,
  RefreshCw,
  Send,
  Shuffle,
  Sparkles,
  Target,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react'
import { COACH_MODES, DIFFICULTIES, ROUND_OPTIONS, createOpeningMessage, getRandomItem } from './coachScenarios'
import { requestCoachTurn } from './coachService'

const screenMotion = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.25 } },
  exit: { opacity: 0, y: -12, transition: { duration: 0.18 } },
}

const averageScores = (assessments) => {
  if (!assessments.length) return { clarity: 0, structure: 0, impact: 0, overall: 0 }
  const totals = assessments.reduce((sum, item) => ({
    clarity: sum.clarity + item.scores.clarity,
    structure: sum.structure + item.scores.structure,
    impact: sum.impact + item.scores.impact,
  }), { clarity: 0, structure: 0, impact: 0 })

  const result = {
    clarity: Math.round(totals.clarity / assessments.length),
    structure: Math.round(totals.structure / assessments.length),
    impact: Math.round(totals.impact / assessments.length),
  }
  result.overall = Math.round((result.clarity + result.structure + result.impact) / 3)
  return result
}

function CoachHeader({ title, onBack, onClose, voiceEnabled, onToggleVoice, showVoice = false }) {
  return (
    <header className="coach-header">
      <div className="coach-header-side">
        {onBack && <button className="coach-icon-button" onClick={onBack} aria-label="Zurück"><ChevronLeft size={21} /></button>}
      </div>
      <div className="coach-header-title">
        <div className="coach-brand-mark"><Bot size={19} /></div>
        <div><strong>Live-Coach</strong><span>{title}</span></div>
      </div>
      <div className="coach-header-actions">
        {showVoice && (
          <button className="coach-icon-button" onClick={onToggleVoice} aria-label={voiceEnabled ? 'Sprachausgabe ausschalten' : 'Sprachausgabe einschalten'}>
            {voiceEnabled ? <Volume2 size={19} /> : <VolumeX size={19} />}
          </button>
        )}
        <button className="coach-icon-button" onClick={onClose} aria-label="Live-Coach schließen"><X size={20} /></button>
      </div>
    </header>
  )
}

function SetupView({ configuration, setConfiguration, onStart, onClose }) {
  const selectedMode = configuration.mode
  const selectedDifficulty = configuration.difficulty
  const [customTopic, setCustomTopic] = useState('')

  const setMode = (mode) => {
    setConfiguration((current) => ({
      ...current,
      mode,
      topic: mode.topics[0],
    }))
    setCustomTopic('')
  }

  const chooseRandomTopic = () => {
    const topic = getRandomItem(selectedMode.topics, configuration.topic)
    setConfiguration((current) => ({ ...current, topic }))
    setCustomTopic('')
  }

  const applyCustomTopic = () => {
    const value = customTopic.trim()
    if (!value) return
    setConfiguration((current) => ({ ...current, topic: value }))
  }

  return (
    <motion.div className="coach-screen coach-setup" variants={screenMotion} initial="initial" animate="animate" exit="exit">
      <CoachHeader title="Simulation einrichten" onClose={onClose} />

      <div className="coach-content coach-setup-content">
        <section className="coach-intro">
          <div className="coach-eyebrow"><Sparkles size={15} /> Interaktives Training</div>
          <h1>Übe ein echtes Gespräch – mit Rückfragen.</h1>
          <p>Der Coach reagiert auf deine Antwort, fordert konkrete Beispiele und passt die nächste Frage an deinen Trainingsbereich an.</p>
        </section>

        <section className="coach-config-section">
          <div className="coach-section-heading"><span>1</span><div><h2>Trainingsbereich</h2><p>Welche Situation möchtest du simulieren?</p></div></div>
          <div className="coach-mode-grid">
            {COACH_MODES.map((mode) => (
              <button
                key={mode.id}
                className={selectedMode.id === mode.id ? 'coach-mode-option active' : 'coach-mode-option'}
                onClick={() => setMode(mode)}
              >
                <strong>{mode.title}</strong>
                <span>{mode.description}</span>
                {selectedMode.id === mode.id && <CheckCircle size={18} />}
              </button>
            ))}
          </div>
        </section>

        <section className="coach-config-section">
          <div className="coach-section-heading"><span>2</span><div><h2>Thema auswählen</h2><p>Vorschlag, Zufall oder eigenes Thema.</p></div></div>
          <div className="coach-topic-toolbar">
            <button className="coach-random-topic" onClick={chooseRandomTopic}><Shuffle size={17} /> Zufälliges Thema</button>
            <span>Aktuell: <strong>{configuration.topic}</strong></span>
          </div>
          <div className="coach-topic-chips">
            {selectedMode.topics.map((topic) => (
              <button
                key={topic}
                className={configuration.topic === topic ? 'active' : ''}
                onClick={() => {
                  setConfiguration((current) => ({ ...current, topic }))
                  setCustomTopic('')
                }}
              >
                {topic}
              </button>
            ))}
          </div>
          <div className="coach-custom-topic">
            <input
              value={customTopic}
              onChange={(event) => setCustomTopic(event.target.value)}
              onKeyDown={(event) => event.key === 'Enter' && applyCustomTopic()}
              placeholder="Eigenes Thema eingeben"
            />
            <button onClick={applyCustomTopic} disabled={!customTopic.trim()}><ArrowRight size={18} /> Übernehmen</button>
          </div>
        </section>

        <section className="coach-config-section coach-two-column-config">
          <div>
            <div className="coach-section-heading"><span>3</span><div><h2>Schwierigkeit</h2><p>Wie stark soll der Coach dich fordern?</p></div></div>
            <div className="coach-difficulty-list">
              {DIFFICULTIES.map((difficulty) => (
                <button
                  key={difficulty.id}
                  className={selectedDifficulty.id === difficulty.id ? 'active' : ''}
                  onClick={() => setConfiguration((current) => ({ ...current, difficulty }))}
                >
                  <div><strong>{difficulty.title}</strong><span>{difficulty.description}</span></div>
                  <span className="coach-radio" />
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="coach-section-heading"><span>4</span><div><h2>Gesprächslänge</h2><p>Wie viele Antworten möchtest du trainieren?</p></div></div>
            <div className="coach-round-options">
              {ROUND_OPTIONS.map((rounds) => (
                <button
                  key={rounds}
                  className={configuration.totalRounds === rounds ? 'active' : ''}
                  onClick={() => setConfiguration((current) => ({ ...current, totalRounds: rounds }))}
                >
                  <strong>{rounds}</strong><span>Runden</span>
                </button>
              ))}
            </div>
            <div className="coach-persona-card">
              <Bot size={20} />
              <div><span>Dein Gegenüber</span><strong>{selectedMode.persona}</strong></div>
            </div>
          </div>
        </section>

        <button className="coach-start-button" onClick={onStart}>
          <MessageCircleMore size={20} /> Simulation starten
          <ArrowRight size={19} />
        </button>
      </div>
    </motion.div>
  )
}

function MessageBubble({ message }) {
  const isCoach = message.role === 'coach'
  return (
    <motion.div
      className={isCoach ? 'coach-message-row coach' : 'coach-message-row user'}
      initial={{ opacity: 0, y: 9 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {isCoach && <div className="coach-avatar"><Bot size={18} /></div>}
      <div className="coach-message-body">
        <div className="coach-message-meta">{isCoach ? message.persona || 'Live-Coach' : 'Du'}</div>
        <div className="coach-message-bubble">{message.text}</div>
        {message.microFeedback && (
          <div className="coach-micro-feedback"><Sparkles size={14} /> {message.microFeedback}</div>
        )}
      </div>
    </motion.div>
  )
}

function ConversationView({ configuration, onBack, onClose, onComplete }) {
  const [messages, setMessages] = useState(() => [{
    id: 'opening',
    role: 'coach',
    persona: configuration.mode.persona,
    text: createOpeningMessage(configuration),
  }])
  const [answer, setAnswer] = useState('')
  const [interimAnswer, setInterimAnswer] = useState('')
  const [round, setRound] = useState(1)
  const [assessments, setAssessments] = useState([])
  const [isListening, setIsListening] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [voiceEnabled, setVoiceEnabled] = useState(true)
  const [recognitionError, setRecognitionError] = useState('')
  const [source, setSource] = useState('pending')
  const recognitionRef = useRef(null)
  const answerRef = useRef('')
  const messageEndRef = useRef(null)

  const speak = (text) => {
    if (!voiceEnabled || !('speechSynthesis' in window)) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'de-DE'
    utterance.rate = 0.98
    window.speechSynthesis.speak(utterance)
  }

  useEffect(() => {
    speak(messages[0].text)
    return () => {
      window.speechSynthesis?.cancel()
      try {
        recognitionRef.current?.abort()
      } catch {
        // Recognition can already be inactive.
      }
    }
  }, [])

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages, interimAnswer, isLoading])

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      setRecognitionError('Die Spracheingabe ist in diesem Browser nicht verfügbar. Du kannst deine Antwort eintippen.')
      return
    }

    setRecognitionError('')
    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'de-DE'
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
        answerRef.current = finalText
        setAnswer(finalText)
      }
      setInterimAnswer(interim.trim())
    }

    recognition.onerror = (event) => {
      const message = event.error === 'not-allowed'
        ? 'Der Mikrofonzugriff wurde abgelehnt. Nutze das Textfeld oder erlaube den Zugriff im Browser.'
        : 'Die Spracheingabe wurde unterbrochen. Du kannst deine Antwort trotzdem eintippen.'
      setRecognitionError(message)
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
      setRecognitionError('Die Aufnahme konnte nicht gestartet werden. Bitte versuche es erneut.')
    }
  }

  const stopListening = () => {
    try {
      recognitionRef.current?.stop()
    } catch {
      // Recognition can already be inactive.
    }
    setIsListening(false)
  }

  const submitAnswer = async () => {
    const text = `${answer} ${interimAnswer}`.trim()
    if (!text || isLoading) return
    stopListening()

    const userMessage = { id: `user-${Date.now()}`, role: 'user', text }
    const nextConversation = [...messages, userMessage]
    setMessages(nextConversation)
    setAnswer('')
    answerRef.current = ''
    setInterimAnswer('')
    setIsLoading(true)

    const result = await requestCoachTurn({
      ...configuration,
      round,
      conversation: nextConversation.map(({ role, text: messageText }) => ({ role, text: messageText })),
    })

    setSource(result.source)
    const assessment = {
      round,
      answer: text,
      scores: result.scores,
      microFeedback: result.microFeedback,
      finalSummary: result.finalSummary,
    }
    const nextAssessments = [...assessments, assessment]
    setAssessments(nextAssessments)

    const coachMessage = {
      id: `coach-${Date.now()}`,
      role: 'coach',
      persona: configuration.mode.persona,
      text: result.reply,
      microFeedback: result.microFeedback,
    }
    setMessages((current) => [...current, coachMessage])
    setIsLoading(false)
    speak(result.reply)

    if (result.isComplete || round >= configuration.totalRounds) {
      window.setTimeout(() => onComplete({
        messages: [...nextConversation, coachMessage],
        assessments: nextAssessments,
        summary: result.finalSummary,
        source: result.source,
      }), 650)
    } else {
      setRound((current) => current + 1)
    }
  }

  const progress = ((round - 1) / configuration.totalRounds) * 100

  return (
    <motion.div className="coach-screen coach-conversation" variants={screenMotion} initial="initial" animate="animate" exit="exit">
      <CoachHeader
        title={`${configuration.mode.title} · Runde ${Math.min(round, configuration.totalRounds)}/${configuration.totalRounds}`}
        onBack={onBack}
        onClose={onClose}
        voiceEnabled={voiceEnabled}
        onToggleVoice={() => {
          setVoiceEnabled((current) => !current)
          window.speechSynthesis?.cancel()
        }}
        showVoice
      />

      <div className="coach-progress-line"><span style={{ width: `${progress}%` }} /></div>

      <div className="coach-conversation-layout">
        <aside className="coach-context-panel">
          <span className="coach-context-label">Simulation</span>
          <h2>{configuration.topic}</h2>
          <div className="coach-context-item"><Bot size={17} /><div><span>Gegenüber</span><strong>{configuration.mode.persona}</strong></div></div>
          <div className="coach-context-item"><Target size={17} /><div><span>Schwierigkeit</span><strong>{configuration.difficulty.title}</strong></div></div>
          <div className="coach-context-item"><MessageCircleMore size={17} /><div><span>Umfang</span><strong>{configuration.totalRounds} Antworten</strong></div></div>
          <div className={source === 'offline' ? 'coach-source offline' : 'coach-source'}>
            <span />
            {source === 'offline' ? 'Lokaler Trainingsmodus' : source === 'ai' ? 'KI verbunden' : 'Verbindung wird geprüft'}
          </div>
        </aside>

        <section className="coach-chat-panel">
          <div className="coach-message-list">
            {messages.map((message) => <MessageBubble key={message.id} message={message} />)}
            {isLoading && (
              <div className="coach-message-row coach">
                <div className="coach-avatar"><Bot size={18} /></div>
                <div className="coach-thinking"><LoaderCircle size={18} /> Der Coach analysiert deine Antwort …</div>
              </div>
            )}
            <div ref={messageEndRef} />
          </div>

          <div className="coach-answer-area">
            {recognitionError && <div className="coach-input-error">{recognitionError}</div>}
            {interimAnswer && <div className="coach-interim-text">{interimAnswer}</div>}
            <textarea
              value={answer}
              onChange={(event) => {
                setAnswer(event.target.value)
                answerRef.current = event.target.value
              }}
              onKeyDown={(event) => {
                if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') submitAnswer()
              }}
              placeholder="Sprich deine Antwort ein oder tippe sie hier …"
              disabled={isLoading}
            />
            <div className="coach-answer-actions">
              <button
                className={isListening ? 'coach-mic-button listening' : 'coach-mic-button'}
                onClick={isListening ? stopListening : startListening}
                disabled={isLoading}
              >
                {isListening ? <CircleStop size={19} /> : <Mic size={19} />}
                {isListening ? 'Aufnahme stoppen' : 'Antwort sprechen'}
              </button>
              <button className="coach-send-button" onClick={submitAnswer} disabled={!`${answer} ${interimAnswer}`.trim() || isLoading}>
                <Send size={18} /> Antwort senden
              </button>
            </div>
          </div>
        </section>
      </div>
    </motion.div>
  )
}

function SummaryView({ configuration, result, onRestart, onNewSimulation, onClose }) {
  const scores = useMemo(() => averageScores(result.assessments), [result.assessments])
  const lastSummary = result.summary || result.assessments.at(-1)?.finalSummary
  const strengths = lastSummary?.strengths?.length ? lastSummary.strengths : ['Du hast die Simulation bis zum Ende durchgeführt.', 'Du bist auf mehrere Rückfragen eingegangen.']
  const improvements = lastSummary?.improvements?.length ? lastSummary.improvements : ['Formuliere deine Kernaussage früher.', 'Nutze häufiger konkrete Beispiele.']

  useEffect(() => {
    try {
      const previous = JSON.parse(localStorage.getItem('speech-coach-dialog-history') || '[]')
      const entry = {
        id: `${Date.now()}`,
        mode: configuration.mode.title,
        topic: configuration.topic,
        difficulty: configuration.difficulty.title,
        rounds: configuration.totalRounds,
        scores,
        createdAt: new Date().toISOString(),
      }
      localStorage.setItem('speech-coach-dialog-history', JSON.stringify([entry, ...previous].slice(0, 20)))
    } catch {
      // History is optional and should never block the result screen.
    }
  }, [])

  return (
    <motion.div className="coach-screen coach-summary" variants={screenMotion} initial="initial" animate="animate" exit="exit">
      <CoachHeader title="Gesprächsauswertung" onClose={onClose} />
      <div className="coach-content coach-summary-content">
        <section className="coach-summary-hero">
          <div className="coach-summary-score" style={{ '--coach-score': `${scores.overall * 3.6}deg` }}>
            <div><strong>{scores.overall}</strong><span>Gesamtscore</span></div>
          </div>
          <div>
            <div className="coach-eyebrow"><CheckCircle size={15} /> Simulation abgeschlossen</div>
            <h1>{scores.overall >= 80 ? 'Sehr überzeugend.' : scores.overall >= 65 ? 'Solide Leistung.' : 'Gute Trainingsgrundlage.'}</h1>
            <p>{configuration.mode.title} · {configuration.topic} · {configuration.totalRounds} Runden</p>
            <span className={result.source === 'ai' ? 'coach-result-source ai' : 'coach-result-source'}>
              {result.source === 'ai' ? 'KI-gestützte Auswertung' : 'Lokale Basis-Auswertung'}
            </span>
          </div>
        </section>

        <section className="coach-score-grid">
          <div><span>Klarheit</span><strong>{scores.clarity}</strong><div><i style={{ width: `${scores.clarity}%` }} /></div></div>
          <div><span>Struktur</span><strong>{scores.structure}</strong><div><i style={{ width: `${scores.structure}%` }} /></div></div>
          <div><span>Wirkung</span><strong>{scores.impact}</strong><div><i style={{ width: `${scores.impact}%` }} /></div></div>
        </section>

        <section className="coach-summary-columns">
          <div className="coach-summary-panel strength">
            <div><CheckCircle size={20} /><h2>Deine Stärken</h2></div>
            <ul>{strengths.map((item) => <li key={item}>{item}</li>)}</ul>
          </div>
          <div className="coach-summary-panel focus">
            <div><Target size={20} /><h2>Nächster Fokus</h2></div>
            <ul>{improvements.map((item) => <li key={item}>{item}</li>)}</ul>
          </div>
        </section>

        <section className="coach-round-review">
          <div className="coach-round-heading"><Gauge size={20} /><h2>Auswertung pro Antwort</h2></div>
          <div className="coach-round-list">
            {result.assessments.map((assessment) => (
              <div key={assessment.round} className="coach-round-card">
                <div className="coach-round-number">{assessment.round}</div>
                <div className="coach-round-copy"><strong>{assessment.answer}</strong><span>{assessment.microFeedback}</span></div>
                <div className="coach-round-score">{Math.round((assessment.scores.clarity + assessment.scores.structure + assessment.scores.impact) / 3)}</div>
              </div>
            ))}
          </div>
        </section>

        <div className="coach-summary-actions">
          <button className="coach-primary-action" onClick={onRestart}><RefreshCw size={18} /> Gleiches Gespräch wiederholen</button>
          <button className="coach-secondary-action" onClick={onNewSimulation}><ArrowLeft size={18} /> Neue Simulation</button>
        </div>
      </div>
    </motion.div>
  )
}

export default function ConversationCoach({ onClose }) {
  const [phase, setPhase] = useState('setup')
  const [configuration, setConfiguration] = useState({
    mode: COACH_MODES[0],
    topic: COACH_MODES[0].topics[0],
    difficulty: DIFFICULTIES[1],
    totalRounds: ROUND_OPTIONS[0],
  })
  const [result, setResult] = useState(null)
  const [sessionKey, setSessionKey] = useState(0)

  const startConversation = () => {
    setResult(null)
    setSessionKey((current) => current + 1)
    setPhase('conversation')
  }

  return (
    <div className="coach-overlay" role="dialog" aria-modal="true" aria-label="Live-Coach">
      <AnimatePresence mode="wait">
        {phase === 'setup' && (
          <SetupView
            key="coach-setup"
            configuration={configuration}
            setConfiguration={setConfiguration}
            onStart={startConversation}
            onClose={onClose}
          />
        )}
        {phase === 'conversation' && (
          <ConversationView
            key={`coach-conversation-${sessionKey}`}
            configuration={configuration}
            onBack={() => setPhase('setup')}
            onClose={onClose}
            onComplete={(completedResult) => {
              setResult(completedResult)
              setPhase('summary')
            }}
          />
        )}
        {phase === 'summary' && result && (
          <SummaryView
            key={`coach-summary-${sessionKey}`}
            configuration={configuration}
            result={result}
            onRestart={startConversation}
            onNewSimulation={() => setPhase('setup')}
            onClose={onClose}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
