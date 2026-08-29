import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Bot,
  CheckCircle2,
  ChevronLeft,
  CircleStop,
  Gauge,
  LoaderCircle,
  Mic,
  RefreshCw,
  Send,
  Shuffle,
  Sparkles,
  Target,
  Users,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react'
import { DIFFICULTIES } from './coachScenarios'
import { TEAM_ROUND_OPTIONS, TEAM_SCENARIOS, createTeamOpeningMessages, getRandomTeamItem } from './teamScenarios'
import { requestTeamCoachTurn } from './teamCoachService'

const motionScreen = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.24 } },
  exit: { opacity: 0, y: -10, transition: { duration: 0.16 } },
}

const averageScores = (assessments) => {
  if (!assessments.length) return { clarity: 0, structure: 0, impact: 0, audienceManagement: 0, overall: 0 }
  const totals = assessments.reduce((sum, item) => ({
    clarity: sum.clarity + item.scores.clarity,
    structure: sum.structure + item.scores.structure,
    impact: sum.impact + item.scores.impact,
    audienceManagement: sum.audienceManagement + item.scores.audienceManagement,
  }), { clarity: 0, structure: 0, impact: 0, audienceManagement: 0 })

  const result = {
    clarity: Math.round(totals.clarity / assessments.length),
    structure: Math.round(totals.structure / assessments.length),
    impact: Math.round(totals.impact / assessments.length),
    audienceManagement: Math.round(totals.audienceManagement / assessments.length),
  }
  result.overall = Math.round((result.clarity + result.structure + result.impact + result.audienceManagement) / 4)
  return result
}

function TeamHeader({ title, onBack, onClose, voiceEnabled, onToggleVoice, showVoice = false }) {
  return (
    <header className="team-header">
      <div className="team-header-side">
        {onBack && <button onClick={onBack} aria-label="Zurück"><ChevronLeft size={21} /></button>}
      </div>
      <div className="team-header-title"><span><Users size={20} /></span><div><strong>Team-Coach</strong><small>{title}</small></div></div>
      <div className="team-header-actions">
        {showVoice && <button onClick={onToggleVoice} aria-label={voiceEnabled ? 'Sprachausgabe aus' : 'Sprachausgabe an'}>{voiceEnabled ? <Volume2 size={19} /> : <VolumeX size={19} />}</button>}
        <button onClick={onClose} aria-label="Team-Coach schließen"><X size={20} /></button>
      </div>
    </header>
  )
}

function SetupView({ configuration, setConfiguration, onStart, onClose }) {
  const [customTopic, setCustomTopic] = useState('')
  const scenario = configuration.scenario

  const selectScenario = (nextScenario) => {
    setConfiguration((current) => ({ ...current, scenario: nextScenario, topic: nextScenario.topics[0] }))
    setCustomTopic('')
  }

  const randomTopic = () => {
    setConfiguration((current) => ({ ...current, topic: getRandomTeamItem(scenario.topics, current.topic) }))
    setCustomTopic('')
  }

  const applyCustomTopic = () => {
    const value = customTopic.trim()
    if (!value) return
    setConfiguration((current) => ({ ...current, topic: value }))
  }

  return (
    <motion.div className="team-screen" variants={motionScreen} initial="initial" animate="animate" exit="exit">
      <TeamHeader title="Mehrpersonen-Simulation einrichten" onClose={onClose} />
      <div className="team-content">
        <section className="team-intro">
          <span className="team-eyebrow"><Sparkles size={15} /> Mehrere echte Interessen</span>
          <h1>Trainiere Gespräche, in denen <span>mehr als eine Person</span> etwas von dir will.</h1>
          <p>Jede Rolle verfolgt eine eigene Perspektive. Du musst Einwände aufnehmen, Prioritäten setzen und trotzdem zu einer klaren Aussage kommen.</p>
        </section>

        <section className="team-config-section">
          <div className="team-section-heading"><span>1</span><div><h2>Situation auswählen</h2><p>Welche Gruppendynamik möchtest du trainieren?</p></div></div>
          <div className="team-scenario-grid">
            {TEAM_SCENARIOS.map((item) => (
              <button key={item.id} className={scenario.id === item.id ? 'active' : ''} onClick={() => selectScenario(item)}>
                <Users size={19} />
                <strong>{item.title}</strong>
                <span>{item.description}</span>
                <small>{item.participants.length} Rollen</small>
                {scenario.id === item.id && <CheckCircle2 size={18} />}
              </button>
            ))}
          </div>
        </section>

        <section className="team-config-section">
          <div className="team-section-heading"><span>2</span><div><h2>Teilnehmer</h2><p>Diese Personen vertreten unterschiedliche Interessen.</p></div></div>
          <div className="team-roster-grid">
            {scenario.participants.map((participant) => (
              <article key={participant.id}>
                <div className="team-roster-avatar">{participant.name.split(' ').at(-1)?.slice(0, 1)}</div>
                <div><strong>{participant.name}</strong><span>{participant.role}</span><small>{participant.stance}</small></div>
              </article>
            ))}
          </div>
        </section>

        <section className="team-config-section">
          <div className="team-section-heading"><span>3</span><div><h2>Thema</h2><p>Nutze einen Vorschlag oder dein eigenes Thema.</p></div></div>
          <div className="team-topic-toolbar"><button onClick={randomTopic}><Shuffle size={17} /> Zufall</button><span>Aktuell: <strong>{configuration.topic}</strong></span></div>
          <div className="team-topic-chips">
            {scenario.topics.map((topic) => <button key={topic} className={configuration.topic === topic ? 'active' : ''} onClick={() => { setConfiguration((current) => ({ ...current, topic })); setCustomTopic('') }}>{topic}</button>)}
          </div>
          <div className="team-custom-topic"><input value={customTopic} onChange={(event) => setCustomTopic(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && applyCustomTopic()} placeholder="Eigenes Gruppenthema" /><button onClick={applyCustomTopic} disabled={!customTopic.trim()}><ArrowRight size={17} /> Übernehmen</button></div>
        </section>

        <section className="team-config-split">
          <div className="team-config-section">
            <div className="team-section-heading"><span>4</span><div><h2>Schwierigkeit</h2><p>Wie viel Gegenwind möchtest du?</p></div></div>
            <div className="team-choice-list">
              {DIFFICULTIES.map((difficulty) => <button key={difficulty.id} className={configuration.difficulty.id === difficulty.id ? 'active' : ''} onClick={() => setConfiguration((current) => ({ ...current, difficulty }))}><div><strong>{difficulty.title}</strong><span>{difficulty.description}</span></div><i /></button>)}
            </div>
          </div>
          <div className="team-config-section">
            <div className="team-section-heading"><span>5</span><div><h2>Runden</h2><p>Wie lange soll die Gruppensimulation dauern?</p></div></div>
            <div className="team-round-options">{TEAM_ROUND_OPTIONS.map((rounds) => <button key={rounds} className={configuration.totalRounds === rounds ? 'active' : ''} onClick={() => setConfiguration((current) => ({ ...current, totalRounds: rounds }))}><strong>{rounds}</strong><span>Antworten</span></button>)}</div>
          </div>
        </section>

        <button className="team-start-button" onClick={onStart}><Users size={20} /> Team-Simulation starten <ArrowRight size={18} /></button>
      </div>
    </motion.div>
  )
}

function TeamMessage({ message }) {
  const isUser = message.role === 'user'
  return (
    <motion.div className={isUser ? 'team-message-row user' : 'team-message-row participant'} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      {!isUser && <div className="team-message-avatar">{message.speakerName === 'Simulation' ? <Bot size={17} /> : message.speakerName?.split(' ').at(-1)?.slice(0, 1)}</div>}
      <div className="team-message-body">
        <div className="team-message-meta">{isUser ? 'Du' : <><strong>{message.speakerName}</strong><span>{message.speakerRole}</span></>}</div>
        <div className="team-message-bubble">{message.text}</div>
        {message.microFeedback && <div className="team-feedback"><Sparkles size={14} /> {message.microFeedback}</div>}
      </div>
    </motion.div>
  )
}

function ConversationView({ configuration, onBack, onClose, onComplete }) {
  const [messages, setMessages] = useState(() => createTeamOpeningMessages(configuration))
  const [answer, setAnswer] = useState('')
  const [interim, setInterim] = useState('')
  const [round, setRound] = useState(1)
  const [assessments, setAssessments] = useState([])
  const [isListening, setIsListening] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [voiceEnabled, setVoiceEnabled] = useState(true)
  const [recognitionError, setRecognitionError] = useState('')
  const [source, setSource] = useState('pending')
  const recognitionRef = useRef(null)
  const endRef = useRef(null)

  const speak = (text) => {
    if (!voiceEnabled || !('speechSynthesis' in window)) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'de-DE'
    utterance.rate = 0.98
    window.speechSynthesis.speak(utterance)
  }

  useEffect(() => {
    speak(messages.at(-1)?.text || '')
    return () => {
      window.speechSynthesis?.cancel()
      try { recognitionRef.current?.abort() } catch { /* already inactive */ }
    }
  }, [])

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }) }, [messages, interim, isLoading])

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      setRecognitionError('Spracheingabe ist in diesem Browser nicht verfügbar. Nutze das Textfeld.')
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
      let nextInterim = ''
      let finalized = ''
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const text = event.results[index][0].transcript
        if (event.results[index].isFinal) finalized += `${text} `
        else nextInterim += `${text} `
      }
      if (finalized.trim()) {
        finalText = `${finalText} ${finalized}`.trim()
        setAnswer(finalText)
      }
      setInterim(nextInterim.trim())
    }
    recognition.onerror = (event) => {
      setRecognitionError(event.error === 'not-allowed' ? 'Mikrofonzugriff wurde abgelehnt.' : 'Spracheingabe wurde unterbrochen.')
      setIsListening(false)
    }
    recognition.onend = () => { setIsListening(false); setInterim('') }
    try { recognition.start(); setIsListening(true) } catch { setRecognitionError('Aufnahme konnte nicht gestartet werden.') }
  }

  const stopListening = () => {
    try { recognitionRef.current?.stop() } catch { /* already inactive */ }
    setIsListening(false)
  }

  const submit = async () => {
    const text = `${answer} ${interim}`.trim()
    if (!text || isLoading) return
    stopListening()
    const userMessage = { id: `team-user-${Date.now()}`, role: 'user', text }
    const conversation = [...messages, userMessage]
    setMessages(conversation)
    setAnswer('')
    setInterim('')
    setIsLoading(true)

    const result = await requestTeamCoachTurn({ ...configuration, round, conversation })
    setSource(result.source)
    const assessment = { round, answer: text, speakerName: result.speakerName, scores: result.scores, microFeedback: result.microFeedback, finalSummary: result.finalSummary }
    const nextAssessments = [...assessments, assessment]
    setAssessments(nextAssessments)

    const teamMessage = {
      id: `team-${Date.now()}`,
      role: 'team',
      speakerId: result.speakerId,
      speakerName: result.speakerName,
      speakerRole: result.speakerRole,
      text: result.reply,
      microFeedback: result.microFeedback,
    }
    const finalMessages = [...conversation, teamMessage]
    setMessages(finalMessages)
    setIsLoading(false)
    speak(result.reply)

    if (result.isComplete || round >= configuration.totalRounds) {
      window.setTimeout(() => onComplete({ messages: finalMessages, assessments: nextAssessments, summary: result.finalSummary, source: result.source }), 650)
    } else {
      setRound((current) => current + 1)
    }
  }

  const progress = ((round - 1) / configuration.totalRounds) * 100

  return (
    <motion.div className="team-screen" variants={motionScreen} initial="initial" animate="animate" exit="exit">
      <TeamHeader title={`${configuration.scenario.title} · Runde ${Math.min(round, configuration.totalRounds)}/${configuration.totalRounds}`} onBack={onBack} onClose={onClose} voiceEnabled={voiceEnabled} onToggleVoice={() => { setVoiceEnabled((current) => !current); window.speechSynthesis?.cancel() }} showVoice />
      <div className="team-progress"><span style={{ width: `${progress}%` }} /></div>
      <div className="team-conversation-layout">
        <aside className="team-context">
          <span className="team-context-label">Situation</span>
          <h2>{configuration.topic}</h2>
          <div className="team-participant-list">{configuration.scenario.participants.map((participant) => <article key={participant.id}><div>{participant.name.split(' ').at(-1)?.slice(0, 1)}</div><p><strong>{participant.name}</strong><span>{participant.role}</span></p></article>)}</div>
          <div className="team-context-fact"><Target size={17} /><div><span>Schwierigkeit</span><strong>{configuration.difficulty.title}</strong></div></div>
          <div className={source === 'offline' ? 'team-source offline' : 'team-source'}><i />{source === 'offline' ? 'Lokale Rollen-Simulation' : source === 'ai' ? 'KI-Team verbunden' : 'Verbindung wird geprüft'}</div>
        </aside>

        <section className="team-chat">
          <div className="team-message-list">
            {messages.map((message) => <TeamMessage key={message.id} message={message} />)}
            {isLoading && <div className="team-thinking"><LoaderCircle size={18} /> Die Gruppe reagiert auf deine Antwort …</div>}
            <div ref={endRef} />
          </div>
          <div className="team-answer-area">
            {recognitionError && <div className="team-input-error"><AlertCircle size={16} /> {recognitionError}</div>}
            {interim && <div className="team-interim">{interim}</div>}
            <textarea value={answer} onChange={(event) => setAnswer(event.target.value)} onKeyDown={(event) => { if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') submit() }} placeholder="Antworte der Gruppe …" disabled={isLoading} />
            <div className="team-answer-actions">
              <button className={isListening ? 'listening' : ''} onClick={isListening ? stopListening : startListening} disabled={isLoading}>{isListening ? <CircleStop size={19} /> : <Mic size={19} />}{isListening ? 'Aufnahme stoppen' : 'Antwort sprechen'}</button>
              <button onClick={submit} disabled={!`${answer} ${interim}`.trim() || isLoading}><Send size={18} /> Antwort senden</button>
            </div>
          </div>
        </section>
      </div>
    </motion.div>
  )
}

function SummaryView({ configuration, result, onRestart, onNewSimulation, onClose }) {
  const scores = useMemo(() => averageScores(result.assessments), [result.assessments])
  const summary = result.summary || result.assessments.at(-1)?.finalSummary || {}
  const strengths = summary.strengths?.length ? summary.strengths : ['Du hast die Mehrpersonen-Simulation abgeschlossen.', 'Du hast auf wechselnde Gesprächspartner reagiert.']
  const improvements = summary.improvements?.length ? summary.improvements : ['Greife Gegenpositionen noch expliziter auf.', 'Formuliere Entscheidungen und nächste Schritte früher.']

  useEffect(() => {
    try {
      const previous = JSON.parse(localStorage.getItem('speech-coach-dialog-history') || '[]')
      const entry = {
        id: `${Date.now()}-team`,
        mode: `Team-Coach · ${configuration.scenario.title}`,
        topic: configuration.topic,
        difficulty: configuration.difficulty.title,
        rounds: configuration.totalRounds,
        scores: {
          overall: scores.overall,
          clarity: scores.clarity,
          structure: scores.structure,
          impact: scores.impact,
          audienceManagement: scores.audienceManagement,
        },
        teamSimulation: true,
        participants: configuration.scenario.participants.map(({ id, name, role }) => ({ id, name, role })),
        createdAt: new Date().toISOString(),
      }
      localStorage.setItem('speech-coach-dialog-history', JSON.stringify([entry, ...previous].slice(0, 20)))
      window.dispatchEvent(new CustomEvent('speechcoach:data-changed', { detail: { source: 'team-coach' } }))
    } catch {
      // Result rendering must not depend on local history.
    }
  }, [])

  const scoreItems = [
    ['Klarheit', scores.clarity],
    ['Struktur', scores.structure],
    ['Wirkung', scores.impact],
    ['Gruppenführung', scores.audienceManagement],
  ]

  return (
    <motion.div className="team-screen" variants={motionScreen} initial="initial" animate="animate" exit="exit">
      <TeamHeader title="Team-Auswertung" onClose={onClose} />
      <div className="team-content team-summary-content">
        <section className="team-summary-hero">
          <div className="team-score-ring" style={{ '--team-score': `${scores.overall * 3.6}deg` }}><div><strong>{scores.overall}</strong><span>Gesamtscore</span></div></div>
          <div><span className="team-eyebrow"><CheckCircle2 size={15} /> Mehrpersonen-Simulation abgeschlossen</span><h1>{scores.overall >= 80 ? 'Starke Gruppenführung.' : scores.overall >= 65 ? 'Solide im Mehrpersonen-Gespräch.' : 'Gute Trainingsbasis.'}</h1><p>{configuration.scenario.title} · {configuration.topic}</p><small>{result.source === 'ai' ? 'KI-gestützte Gruppenauswertung' : 'Lokale Basis-Auswertung'}</small></div>
        </section>

        <section className="team-score-grid">{scoreItems.map(([label, score]) => <article key={label}><span>{label}</span><strong>{score}</strong><div><i style={{ width: `${score}%` }} /></div></article>)}</section>

        <section className="team-summary-columns">
          <article><div><CheckCircle2 size={20} /><h2>Stärken</h2></div><ul>{strengths.map((item) => <li key={item}>{item}</li>)}</ul></article>
          <article><div><Target size={20} /><h2>Nächster Fokus</h2></div><ul>{improvements.map((item) => <li key={item}>{item}</li>)}</ul></article>
        </section>

        <section className="team-round-review">
          <div><Gauge size={20} /><h2>Antworten im Verlauf</h2></div>
          <div>{result.assessments.map((assessment) => <article key={assessment.round}><span>{assessment.round}</span><p><strong>Reaktion von {assessment.speakerName}</strong><em>{assessment.answer}</em><small>{assessment.microFeedback}</small></p><b>{Math.round((assessment.scores.clarity + assessment.scores.structure + assessment.scores.impact + assessment.scores.audienceManagement) / 4)}</b></article>)}</div>
        </section>

        <div className="team-summary-actions"><button onClick={onRestart}><RefreshCw size={18} /> Gleiche Runde wiederholen</button><button onClick={onNewSimulation}><ArrowLeft size={18} /> Neue Simulation</button></div>
      </div>
    </motion.div>
  )
}

export default function TeamCoach({ onClose }) {
  const [phase, setPhase] = useState('setup')
  const [configuration, setConfiguration] = useState({
    scenario: TEAM_SCENARIOS[0],
    topic: TEAM_SCENARIOS[0].topics[0],
    difficulty: DIFFICULTIES[1],
    totalRounds: TEAM_ROUND_OPTIONS[0],
  })
  const [result, setResult] = useState(null)
  const [sessionKey, setSessionKey] = useState(0)

  const start = () => {
    setResult(null)
    setSessionKey((current) => current + 1)
    setPhase('conversation')
  }

  return (
    <div className="team-overlay" role="dialog" aria-modal="true" aria-label="Team-Coach">
      <AnimatePresence mode="wait">
        {phase === 'setup' && <SetupView key="team-setup" configuration={configuration} setConfiguration={setConfiguration} onStart={start} onClose={onClose} />}
        {phase === 'conversation' && <ConversationView key={`team-conversation-${sessionKey}`} configuration={configuration} onBack={() => setPhase('setup')} onClose={onClose} onComplete={(completed) => { setResult(completed); setPhase('summary') }} />}
        {phase === 'summary' && result && <SummaryView key={`team-summary-${sessionKey}`} configuration={configuration} result={result} onRestart={start} onNewSimulation={() => setPhase('setup')} onClose={onClose} />}
      </AnimatePresence>
    </div>
  )
}
