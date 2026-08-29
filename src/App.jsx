import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Activity,
  AlertCircle,
  ArrowRight,
  Briefcase,
  CheckCircle,
  ChevronLeft,
  Clock,
  Gauge,
  Home,
  Lightbulb,
  MessageSquare,
  Mic,
  Play,
  Presentation,
  RotateCcw,
  Scale,
  Search,
  Shuffle,
  Sparkles,
  Square,
  Users,
  Volume2,
  Zap,
} from 'lucide-react'

const DURATIONS = [30, 60, 120]

const TRAINING_MODES = [
  {
    id: 'free-speaking',
    title: 'Freies Sprechen',
    shortTitle: 'Freie Rede',
    description: 'Spontan klare Gedanken entwickeln und sicher formulieren.',
    icon: Mic,
    accent: 'blue',
    topics: [
      { title: 'Internet: Fluch oder Segen?', task: 'Erkläre, warum das Internet gleichzeitig eine der besten und problematischsten Erfindungen ist.', difficulty: 'Mittel' },
      { title: 'Ein perfekter freier Tag', task: 'Beschreibe, wie dein perfekter freier Tag aussehen würde und warum.', difficulty: 'Leicht' },
      { title: 'Eine unterschätzte Fähigkeit', task: 'Sprich über eine Fähigkeit, die im Alltag unterschätzt wird, und begründe deine Wahl.', difficulty: 'Mittel' },
      { title: 'Leben ohne Smartphone', task: 'Erkläre, welche Vor- und Nachteile ein Monat ohne Smartphone hätte.', difficulty: 'Mittel' },
      { title: 'Mut oder Vorbereitung?', task: 'Was ist wichtiger für Erfolg: Mut oder gute Vorbereitung? Begründe deine Antwort.', difficulty: 'Schwer' },
      { title: 'Eine Erfindung für die Zukunft', task: 'Stelle eine Erfindung vor, die den Alltag in Zukunft verbessern könnte.', difficulty: 'Mittel' },
      { title: 'Mein größter Lernmoment', task: 'Erzähle von einer Situation, aus der du besonders viel gelernt hast.', difficulty: 'Leicht' },
      { title: 'Stadt oder Land?', task: 'Vergleiche das Leben in der Stadt mit dem Leben auf dem Land und entscheide dich für eine Seite.', difficulty: 'Leicht' },
    ],
  },
  {
    id: 'argumentation',
    title: 'Argumentieren',
    shortTitle: 'Argumentation',
    description: 'Eine Position logisch aufbauen und überzeugend verteidigen.',
    icon: Scale,
    accent: 'purple',
    topics: [
      { title: 'Kostenloser Nahverkehr', task: 'Argumentiere dafür oder dagegen, dass öffentlicher Nahverkehr kostenlos sein sollte.', difficulty: 'Mittel' },
      { title: 'Vier-Tage-Woche', task: 'Verteidige eine klare Position zur Einführung einer Vier-Tage-Woche.', difficulty: 'Mittel' },
      { title: 'Handyverbot an Schulen', task: 'Argumentiere für oder gegen ein vollständiges Handyverbot während des Schultages.', difficulty: 'Mittel' },
      { title: 'Künstliche Intelligenz im Unterricht', task: 'Begründe, ob KI im Unterricht aktiv eingesetzt werden sollte.', difficulty: 'Schwer' },
      { title: 'Wahlrecht ab 16', task: 'Vertrete eine Position zum Wahlrecht ab 16 Jahren und nenne mindestens zwei Argumente.', difficulty: 'Schwer' },
      { title: 'Homeoffice als Standard', task: 'Sollten Bürojobs grundsätzlich eine Homeoffice-Option anbieten? Argumentiere klar.', difficulty: 'Mittel' },
      { title: 'Noten abschaffen', task: 'Argumentiere dafür oder dagegen, klassische Schulnoten abzuschaffen.', difficulty: 'Schwer' },
      { title: 'Soziale Medien begrenzen', task: 'Sollte die tägliche Nutzung sozialer Medien für Minderjährige begrenzt werden?', difficulty: 'Schwer' },
    ],
  },
  {
    id: 'explaining',
    title: 'Verständlich erklären',
    shortTitle: 'Erklären',
    description: 'Komplexe Inhalte einfach, strukturiert und anschaulich vermitteln.',
    icon: Lightbulb,
    accent: 'amber',
    topics: [
      { title: 'Wie funktioniert ein RCD?', task: 'Erkläre einem Menschen ohne Elektrokenntnisse, was ein Fehlerstrom-Schutzschalter macht.', difficulty: 'Mittel' },
      { title: 'Was ist künstliche Intelligenz?', task: 'Erkläre einem zwölfjährigen Kind, was künstliche Intelligenz ist.', difficulty: 'Leicht' },
      { title: 'Warum brauchen wir Schlaf?', task: 'Erkläre verständlich, warum Schlaf für den Körper wichtig ist.', difficulty: 'Leicht' },
      { title: 'Inflation einfach erklärt', task: 'Erkläre Inflation ohne komplizierte Fachbegriffe und nutze ein Alltagsbeispiel.', difficulty: 'Mittel' },
      { title: 'Wie entsteht Strom?', task: 'Erkläre Schritt für Schritt, wie elektrische Energie erzeugt und zum Haushalt transportiert wird.', difficulty: 'Schwer' },
      { title: 'Was ist Datenschutz?', task: 'Erkläre, warum Datenschutz im digitalen Alltag wichtig ist.', difficulty: 'Mittel' },
      { title: 'Ein Beruf in 60 Sekunden', task: 'Erkläre deinen Beruf oder deine Ausbildung so, dass ein Außenstehender ihn versteht.', difficulty: 'Leicht' },
      { title: 'Ein kompliziertes Hobby', task: 'Erkläre die wichtigsten Regeln oder Abläufe eines Hobbys, das du gut kennst.', difficulty: 'Leicht' },
    ],
  },
  {
    id: 'interview',
    title: 'Bewerbungsgespräch',
    shortTitle: 'Bewerbung',
    description: 'Souveräne, konkrete und glaubwürdige Antworten trainieren.',
    icon: Briefcase,
    accent: 'green',
    topics: [
      { title: 'Erzählen Sie etwas über sich', task: 'Beantworte die Frage: „Erzählen Sie uns bitte etwas über sich.“', difficulty: 'Leicht' },
      { title: 'Warum dieses Unternehmen?', task: 'Beantworte: „Warum möchten Sie gerade bei unserem Unternehmen arbeiten?“', difficulty: 'Mittel' },
      { title: 'Arbeiten unter Druck', task: 'Beschreibe eine konkrete Situation, in der du unter Zeitdruck arbeiten musstest.', difficulty: 'Mittel' },
      { title: 'Eigener Fehler', task: 'Erzähle von einem Fehler, den du gemacht hast, und was du daraus gelernt hast.', difficulty: 'Schwer' },
      { title: 'Stärken und Schwächen', task: 'Nenne eine relevante Stärke und eine echte Schwäche mit konkretem Umgang damit.', difficulty: 'Mittel' },
      { title: 'Konflikt im Team', task: 'Beschreibe eine Situation, in der du einen Konflikt im Team gelöst hast.', difficulty: 'Schwer' },
      { title: 'Warum sollten wir Sie einstellen?', task: 'Beantworte überzeugend: „Warum sollten wir uns für Sie entscheiden?“', difficulty: 'Schwer' },
      { title: 'Ziele in fünf Jahren', task: 'Erkläre realistisch, wo du dich beruflich in fünf Jahren siehst.', difficulty: 'Mittel' },
    ],
  },
  {
    id: 'difficult-conversations',
    title: 'Schwierige Gespräche',
    shortTitle: 'Gespräche',
    description: 'Klar bleiben, Grenzen setzen und Konflikte respektvoll lösen.',
    icon: Users,
    accent: 'red',
    topics: [
      { title: 'Kollege hält Absprachen nicht ein', task: 'Sprich einen Kollegen respektvoll darauf an, dass vereinbarte Aufgaben wiederholt nicht erledigt wurden.', difficulty: 'Mittel' },
      { title: 'Kritik annehmen', task: 'Reagiere auf harte, aber teilweise berechtigte Kritik, ohne defensiv oder aggressiv zu werden.', difficulty: 'Schwer' },
      { title: 'Nein sagen', task: 'Lehne eine zusätzliche Aufgabe ab, weil deine Kapazität bereits vollständig ausgelastet ist.', difficulty: 'Mittel' },
      { title: 'Eigenen Fehler melden', task: 'Erkläre deinem Vorgesetzten einen eigenen Fehler, seine Auswirkungen und deinen Lösungsvorschlag.', difficulty: 'Schwer' },
      { title: 'Unzufriedener Kunde', task: 'Reagiere auf einen verärgerten Kunden, der sich nicht ernst genommen fühlt.', difficulty: 'Schwer' },
      { title: 'Grenze im Privatleben', task: 'Setze einer nahestehenden Person freundlich, aber eindeutig eine persönliche Grenze.', difficulty: 'Mittel' },
      { title: 'Missverständnis klären', task: 'Klär ein Missverständnis, ohne der anderen Person die gesamte Schuld zu geben.', difficulty: 'Mittel' },
      { title: 'Um Unterstützung bitten', task: 'Bitte frühzeitig um Hilfe, weil du eine Aufgabe allein nicht rechtzeitig abschließen kannst.', difficulty: 'Leicht' },
    ],
  },
  {
    id: 'presentation',
    title: 'Präsentieren',
    shortTitle: 'Präsentation',
    description: 'Starke Einstiege, klare Struktur und überzeugende Abschlüsse üben.',
    icon: Presentation,
    accent: 'cyan',
    topics: [
      { title: 'Verbesserungsvorschlag', task: 'Präsentiere einen Verbesserungsvorschlag für deinen Arbeitsplatz mit Problem, Lösung und Nutzen.', difficulty: 'Mittel' },
      { title: 'Ein Projekt vorstellen', task: 'Stelle ein eigenes Projekt verständlich vor: Ziel, Vorgehen, Ergebnis und nächster Schritt.', difficulty: 'Mittel' },
      { title: 'Sicherheit am Arbeitsplatz', task: 'Halte einen kurzen Vortrag darüber, warum Sicherheitsregeln konsequent eingehalten werden müssen.', difficulty: 'Leicht' },
      { title: 'Eine App-Idee pitchen', task: 'Präsentiere eine App-Idee so, dass Problem, Zielgruppe, Lösung und Vorteil klar werden.', difficulty: 'Mittel' },
      { title: 'Technisches Thema', task: 'Erkläre ein technisches Thema mit einer klaren Einleitung, drei Hauptpunkten und einem Abschluss.', difficulty: 'Schwer' },
      { title: 'Motivationsrede', task: 'Halte eine kurze Rede, die ein Team nach einem Rückschlag motiviert.', difficulty: 'Schwer' },
      { title: 'Produkt in 60 Sekunden', task: 'Stelle ein Produkt oder eine Dienstleistung in höchstens 60 Sekunden überzeugend vor.', difficulty: 'Mittel' },
      { title: 'Wochenrückblick', task: 'Präsentiere einen klaren Wochenrückblick mit Erfolgen, Problemen und nächsten Schritten.', difficulty: 'Leicht' },
    ],
  },
]

const FILLER_PATTERNS = [
  { label: 'ähm', pattern: /\b(?:ähm+|äh+|öhm+)\b/gi },
  { label: 'also', pattern: /\balso\b/gi },
  { label: 'sozusagen', pattern: /\bsozusagen\b/gi },
  { label: 'quasi', pattern: /\bquasi\b/gi },
  { label: 'halt', pattern: /\bhalt\b/gi },
  { label: 'genau', pattern: /\bgenau\b/gi },
  { label: 'irgendwie', pattern: /\birgendwie\b/gi },
  { label: 'wie gesagt', pattern: /\bwie\s+gesagt\b/gi },
  { label: 'im Endeffekt', pattern: /\bim\s+Endeffekt\b/gi },
  { label: 'im Prinzip', pattern: /\bim\s+Prinzip\b/gi },
]

const pageVariants = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.28, ease: 'easeOut' } },
  exit: { opacity: 0, y: -10, transition: { duration: 0.2 } },
}

const formatDuration = (seconds) => {
  const minutes = Math.floor(seconds / 60)
  const rest = seconds % 60
  return `${minutes.toString().padStart(2, '0')}:${rest.toString().padStart(2, '0')}`
}

const getWords = (text) => text.trim().split(/\s+/).filter(Boolean)

const analyseSpeech = (transcript, durationMs) => {
  const words = getWords(transcript)
  const seconds = Math.max(1, durationMs / 1000)
  const minutes = seconds / 60
  const wpm = Math.round(words.length / minutes)
  const fillerDetails = FILLER_PATTERNS.map(({ label, pattern }) => {
    const matches = transcript.match(pattern) || []
    return { label, count: matches.length }
  }).filter((item) => item.count > 0)
  const fillerCount = fillerDetails.reduce((sum, item) => sum + item.count, 0)
  const fillersPerMinute = Number((fillerCount / minutes).toFixed(1))
  const uniqueWords = new Set(words.map((word) => word.toLowerCase().replace(/[^a-zäöüß]/gi, ''))).size
  const vocabularyRatio = words.length ? uniqueWords / words.length : 0

  const paceScore = wpm >= 105 && wpm <= 165 ? 100 : wpm < 70 || wpm > 210 ? 40 : 70
  const fillerScore = fillersPerMinute <= 2 ? 100 : fillersPerMinute <= 5 ? 75 : fillersPerMinute <= 8 ? 55 : 35
  const substanceScore = words.length >= 35 ? 100 : words.length >= 18 ? 72 : words.length > 0 ? 50 : 15
  const vocabularyScore = vocabularyRatio >= 0.62 ? 92 : vocabularyRatio >= 0.48 ? 78 : 62
  const score = Math.round(paceScore * 0.3 + fillerScore * 0.3 + substanceScore * 0.25 + vocabularyScore * 0.15)

  const strengths = []
  const improvements = []

  if (wpm >= 105 && wpm <= 165) strengths.push('Dein Sprechtempo lag in einem gut verständlichen Bereich.')
  else if (wpm < 105) improvements.push('Sprich etwas aktiver und verbinde deine Gedanken ohne zu lange Leerräume.')
  else improvements.push('Reduziere dein Tempo und setze nach Kernaussagen bewusste Pausen.')

  if (fillersPerMinute <= 2) strengths.push('Du hast nur wenige Füllwörter verwendet.')
  else improvements.push(`Ersetze häufige Füllwörter durch kurze Denkpausen. Aktuell: ${fillersPerMinute} pro Minute.`)

  if (words.length >= 35) strengths.push('Du hast deine Antwort ausreichend ausgeführt.')
  else improvements.push('Baue deine Antwort mit einer Aussage, einer Begründung und einem Beispiel aus.')

  if (vocabularyRatio >= 0.55) strengths.push('Deine Wortwahl war abwechslungsreich.')
  else improvements.push('Vermeide Wiederholungen und nutze präzisere Verben und Hauptaussagen.')

  return {
    score,
    words: words.length,
    wpm: Number.isFinite(wpm) ? wpm : 0,
    fillerCount,
    fillersPerMinute,
    fillerDetails,
    vocabularyRatio,
    strengths: strengths.slice(0, 3),
    improvements: improvements.slice(0, 3),
  }
}

const chooseRandom = (items, excludedTitle = '') => {
  const pool = items.filter((item) => item.title !== excludedTitle)
  const source = pool.length ? pool : items
  return source[Math.floor(Math.random() * source.length)]
}

function AppShell({ children }) {
  return (
    <div className="app-shell">
      <div className="background-orb orb-one" />
      <div className="background-orb orb-two" />
      {children}
    </div>
  )
}

function Brand() {
  return (
    <div className="brand">
      <div className="brand-mark"><Zap size={20} /></div>
      <span>Speech<span>Coach</span></span>
    </div>
  )
}

function HomeScreen({ history, onChooseMode, onQuickRandom }) {
  const totalMinutes = Math.round(history.reduce((sum, item) => sum + item.durationMs, 0) / 60000)
  const averageScore = history.length
    ? Math.round(history.reduce((sum, item) => sum + item.analysis.score, 0) / history.length)
    : 0

  return (
    <motion.main className="page home-page" variants={pageVariants} initial="initial" animate="animate" exit="exit">
      <header className="topbar">
        <Brand />
        <div className="level-pill"><Sparkles size={15} /> Dein Kommunikations-Gym</div>
      </header>

      <section className="hero-section">
        <div className="eyebrow"><Volume2 size={16} /> Stimme · Sprache · Wirkung</div>
        <h1>Sprich klarer. Denke schneller. <span>Überzeuge stärker.</span></h1>
        <p>Trainiere freie Rede, Argumentation, Erklärungen, Bewerbungsgespräche und schwierige Situationen mit sofortigem Feedback.</p>
        <div className="hero-actions">
          <button className="primary-button" onClick={onQuickRandom}>
            <Shuffle size={19} /> Zufällige Übung starten
          </button>
          <span className="hero-hint">Startet sofort mit einer zufälligen 60-Sekunden-Aufgabe.</span>
        </div>
      </section>

      <section className="stats-strip" aria-label="Trainingsfortschritt">
        <div><strong>{history.length}</strong><span>Übungen</span></div>
        <div><strong>{totalMinutes}</strong><span>Minuten</span></div>
        <div><strong>{averageScore || '–'}</strong><span>Ø Score</span></div>
      </section>

      <section className="section-block">
        <div className="section-heading">
          <div>
            <span className="section-kicker">Trainingsbereiche</span>
            <h2>Was möchtest du heute verbessern?</h2>
          </div>
          <p>Wähle einen Bereich und danach ein eigenes oder zufälliges Thema.</p>
        </div>

        <div className="mode-grid">
          {TRAINING_MODES.map((mode, index) => {
            const Icon = mode.icon
            return (
              <motion.button
                key={mode.id}
                className={`mode-card accent-${mode.accent}`}
                onClick={() => onChooseMode(mode)}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.045 }}
                whileHover={{ y: -4 }}
                whileTap={{ scale: 0.99 }}
              >
                <div className="mode-icon"><Icon size={23} /></div>
                <div className="mode-card-content">
                  <h3>{mode.title}</h3>
                  <p>{mode.description}</p>
                </div>
                <ArrowRight className="mode-arrow" size={19} />
              </motion.button>
            )
          })}
        </div>
      </section>

      {history.length > 0 && (
        <section className="section-block recent-section">
          <div className="section-heading compact">
            <div>
              <span className="section-kicker">Dein Verlauf</span>
              <h2>Letzte Übungen</h2>
            </div>
          </div>
          <div className="recent-list">
            {history.slice(0, 3).map((item) => (
              <div className="recent-item" key={item.id}>
                <div className="recent-score">{item.analysis.score}</div>
                <div>
                  <strong>{item.topic.title}</strong>
                  <span>{item.mode.shortTitle} · {Math.round(item.durationMs / 1000)} Sek.</span>
                </div>
                <CheckCircle size={18} />
              </div>
            ))}
          </div>
        </section>
      )}
    </motion.main>
  )
}

function TopicScreen({ mode, initialTopic, onBack, onStart }) {
  const [duration, setDuration] = useState(60)
  const [search, setSearch] = useState('')
  const [customTopic, setCustomTopic] = useState('')
  const Icon = mode.icon

  const visibleTopics = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return mode.topics
    return mode.topics.filter((topic) => `${topic.title} ${topic.task}`.toLowerCase().includes(query))
  }, [mode, search])

  const startRandom = () => {
    const topic = chooseRandom(mode.topics, initialTopic?.title)
    onStart(topic, duration)
  }

  const startCustom = () => {
    const value = customTopic.trim()
    if (!value) return
    onStart({
      title: value,
      task: mode.id === 'argumentation'
        ? `Beziehe eine klare Position zu folgendem Thema und begründe sie: ${value}`
        : `Sprich strukturiert und verständlich über folgendes Thema: ${value}`,
      difficulty: 'Eigenes Thema',
    }, duration)
  }

  return (
    <motion.main className="page topic-page" variants={pageVariants} initial="initial" animate="animate" exit="exit">
      <header className="topbar">
        <button className="icon-button" onClick={onBack} aria-label="Zurück"><ChevronLeft size={22} /></button>
        <Brand />
        <div className="topbar-spacer" />
      </header>

      <section className={`topic-hero accent-${mode.accent}`}>
        <div className="topic-hero-icon"><Icon size={28} /></div>
        <div>
          <span className="section-kicker">{mode.shortTitle}</span>
          <h1>Wähle dein Thema</h1>
          <p>{mode.description}</p>
        </div>
      </section>

      <section className="setup-panel">
        <div className="setup-row">
          <div>
            <span className="setup-label"><Clock size={16} /> Trainingsdauer</span>
            <div className="duration-options">
              {DURATIONS.map((option) => (
                <button
                  key={option}
                  className={duration === option ? 'active' : ''}
                  onClick={() => setDuration(option)}
                >
                  {option < 60 ? `${option} Sek.` : `${option / 60} Min.`}
                </button>
              ))}
            </div>
          </div>
          <button className="random-button" onClick={startRandom}>
            <Shuffle size={20} />
            <span><strong>Zufälliges Thema</strong><small>Direkt überraschen lassen</small></span>
          </button>
        </div>

        <div className="custom-topic-box">
          <label htmlFor="custom-topic">Eigenes Thema verwenden</label>
          <div className="custom-topic-input">
            <input
              id="custom-topic"
              value={customTopic}
              onChange={(event) => setCustomTopic(event.target.value)}
              onKeyDown={(event) => event.key === 'Enter' && startCustom()}
              placeholder="Zum Beispiel: Warum Schichtarbeit Vor- und Nachteile hat"
            />
            <button onClick={startCustom} disabled={!customTopic.trim()} aria-label="Eigenes Thema starten">
              <ArrowRight size={19} />
            </button>
          </div>
        </div>
      </section>

      <section className="section-block topic-list-section">
        <div className="topic-list-header">
          <div>
            <span className="section-kicker">Vorschläge</span>
            <h2>Oder wähle eine Aufgabe</h2>
          </div>
          <div className="search-box">
            <Search size={17} />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Thema suchen" />
          </div>
        </div>

        <div className="topic-list">
          {visibleTopics.map((topic) => (
            <button className="topic-card" key={topic.title} onClick={() => onStart(topic, duration)}>
              <div>
                <span className={`difficulty difficulty-${topic.difficulty.toLowerCase()}`}>{topic.difficulty}</span>
                <h3>{topic.title}</h3>
                <p>{topic.task}</p>
              </div>
              <ArrowRight size={19} />
            </button>
          ))}
          {visibleTopics.length === 0 && (
            <div className="empty-state">Kein Vorschlag gefunden. Nutze oben dein eigenes Thema.</div>
          )}
        </div>
      </section>
    </motion.main>
  )
}

function RecorderScreen({ mode, topic, duration, onCancel, onFinish }) {
  const [isRecording, setIsRecording] = useState(false)
  const [isSupported, setIsSupported] = useState(true)
  const [transcript, setTranscript] = useState('')
  const [elapsedMs, setElapsedMs] = useState(0)
  const [error, setError] = useState('')
  const recognitionRef = useRef(null)
  const transcriptRef = useRef('')
  const startTimeRef = useRef(0)
  const recordingRef = useRef(false)
  const finishRequestedRef = useRef(false)
  const completedRef = useRef(false)
  const cancelledRef = useRef(false)

  const completeSession = () => {
    if (completedRef.current || cancelledRef.current) return
    completedRef.current = true
    const measuredMs = Math.max(1000, Date.now() - startTimeRef.current)
    onFinish(transcriptRef.current.trim(), Math.min(measuredMs, duration * 1000))
  }

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      setIsSupported(false)
      setError('Dein Browser unterstützt die integrierte Spracherkennung nicht. Nutze für diesen Prototyp Chrome oder Edge.')
      return undefined
    }

    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'de-DE'

    recognition.onresult = (event) => {
      let completeTranscript = ''
      for (let index = 0; index < event.results.length; index += 1) {
        completeTranscript += `${event.results[index][0].transcript} `
      }
      transcriptRef.current = completeTranscript.trim()
      setTranscript(transcriptRef.current)
    }

    recognition.onerror = (event) => {
      if (cancelledRef.current) return
      const messages = {
        'not-allowed': 'Der Mikrofonzugriff wurde abgelehnt. Erlaube den Zugriff in den Browser-Einstellungen.',
        'audio-capture': 'Es wurde kein funktionsfähiges Mikrofon gefunden.',
        'no-speech': 'Es wurde keine Sprache erkannt. Starte die Aufnahme erneut und sprich etwas näher am Mikrofon.',
        network: 'Die Spracherkennung hat die Verbindung verloren.',
      }
      setError(messages[event.error] || 'Die Spracherkennung wurde unterbrochen. Bitte versuche es erneut.')
      recordingRef.current = false
      setIsRecording(false)
    }

    recognition.onend = () => {
      if (cancelledRef.current) return
      if (finishRequestedRef.current) {
        completeSession()
        return
      }
      if (recordingRef.current) {
        try {
          recognition.start()
        } catch {
          recordingRef.current = false
          setIsRecording(false)
          setError('Die Aufnahme wurde unerwartet beendet. Bitte starte sie erneut.')
        }
      }
    }

    recognitionRef.current = recognition

    return () => {
      cancelledRef.current = true
      recordingRef.current = false
      try {
        recognition.abort()
      } catch {
        // Browser may already have stopped recognition.
      }
    }
  }, [])

  useEffect(() => {
    if (!isRecording) return undefined
    const interval = window.setInterval(() => {
      const nextElapsed = Date.now() - startTimeRef.current
      setElapsedMs(nextElapsed)
      if (nextElapsed >= duration * 1000 && !finishRequestedRef.current) {
        finishRequestedRef.current = true
        recordingRef.current = false
        setIsRecording(false)
        try {
          recognitionRef.current?.stop()
        } catch {
          completeSession()
        }
      }
    }, 200)
    return () => window.clearInterval(interval)
  }, [duration, isRecording])

  const startRecording = () => {
    if (!recognitionRef.current || !isSupported) return
    setError('')
    setTranscript('')
    transcriptRef.current = ''
    setElapsedMs(0)
    completedRef.current = false
    finishRequestedRef.current = false
    recordingRef.current = true
    startTimeRef.current = Date.now()
    try {
      recognitionRef.current.start()
      setIsRecording(true)
    } catch {
      recordingRef.current = false
      setError('Die Aufnahme konnte nicht gestartet werden. Warte kurz und versuche es erneut.')
    }
  }

  const stopRecording = () => {
    if (!isRecording) return
    finishRequestedRef.current = true
    recordingRef.current = false
    setIsRecording(false)
    setElapsedMs(Date.now() - startTimeRef.current)
    try {
      recognitionRef.current?.stop()
      window.setTimeout(completeSession, 700)
    } catch {
      completeSession()
    }
  }

  const cancel = () => {
    cancelledRef.current = true
    recordingRef.current = false
    try {
      recognitionRef.current?.abort()
    } catch {
      // Recognition may already be inactive.
    }
    onCancel()
  }

  const totalMs = duration * 1000
  const remainingSeconds = Math.max(0, Math.ceil((totalMs - elapsedMs) / 1000))
  const progress = Math.min(100, (elapsedMs / totalMs) * 100)

  return (
    <motion.main className="page recorder-page" variants={pageVariants} initial="initial" animate="animate" exit="exit">
      <header className="topbar">
        <button className="icon-button" onClick={cancel} aria-label="Training verlassen"><ChevronLeft size={22} /></button>
        <div className="recording-label"><span className={isRecording ? 'live-dot active' : 'live-dot'} /> {isRecording ? 'Aufnahme läuft' : 'Bereit'}</div>
        <div className="topbar-spacer" />
      </header>

      <section className="recorder-content">
        <div className="recorder-context">
          <span className="section-kicker">{mode.shortTitle} · {topic.difficulty}</span>
          <h1>{topic.title}</h1>
          <p>{topic.task}</p>
        </div>

        <div className="timer-card">
          <div className="timer-progress" style={{ '--progress': `${progress}%` }}>
            <motion.div
              className={isRecording ? 'mic-orb recording' : 'mic-orb'}
              animate={isRecording ? { scale: [1, 1.06, 1] } : { scale: 1 }}
              transition={{ duration: 1.35, repeat: isRecording ? Infinity : 0 }}
            >
              <Mic size={42} />
            </motion.div>
          </div>
          <strong className="countdown">{formatDuration(remainingSeconds)}</strong>
          <span>{isRecording ? 'Sprich frei und bleib bei deiner Kernaussage.' : `Du hast ${duration} Sekunden Zeit.`}</span>
        </div>

        {error && (
          <div className="error-banner" role="alert"><AlertCircle size={19} /><span>{error}</span></div>
        )}

        <div className="live-transcript" aria-live="polite">
          <span className="transcript-label">Live-Transkript</span>
          <p>{transcript || (isRecording ? 'Ich höre zu …' : 'Dein gesprochener Text erscheint während der Aufnahme hier.')}</p>
        </div>
      </section>

      <div className="recorder-actions">
        {!isRecording ? (
          <button className="primary-button large" onClick={startRecording} disabled={!isSupported}>
            <Play size={20} fill="currentColor" /> Aufnahme starten
          </button>
        ) : (
          <button className="stop-button" onClick={stopRecording}>
            <Square size={19} fill="currentColor" /> Aufnahme beenden
          </button>
        )}
      </div>
    </motion.main>
  )
}

function FeedbackScreen({ topic, durationMs, transcript, analysis, onRepeat, onNewTopic, onHome }) {
  const paceLabel = analysis.wpm < 105 ? 'Eher langsam' : analysis.wpm > 165 ? 'Eher schnell' : 'Gut verständlich'

  return (
    <motion.main className="page feedback-page" variants={pageVariants} initial="initial" animate="animate" exit="exit">
      <header className="topbar">
        <button className="icon-button" onClick={onHome} aria-label="Startseite"><Home size={20} /></button>
        <Brand />
        <div className="topbar-spacer" />
      </header>

      <section className="result-hero">
        <div className="score-ring" style={{ '--score': `${analysis.score * 3.6}deg` }}>
          <div><strong>{analysis.score}</strong><span>von 100</span></div>
        </div>
        <div>
          <span className="section-kicker">Analyse abgeschlossen</span>
          <h1>{analysis.score >= 80 ? 'Starker Auftritt.' : analysis.score >= 60 ? 'Gute Grundlage.' : 'Hier liegt viel Potenzial.'}</h1>
          <p>{topic.title} · {Math.round(durationMs / 1000)} Sekunden</p>
        </div>
      </section>

      <section className="metrics-grid">
        <div className="metric-card"><Gauge size={21} /><span>Tempo</span><strong>{analysis.wpm}</strong><small>Wörter/Min. · {paceLabel}</small></div>
        <div className="metric-card"><Activity size={21} /><span>Füllwörter</span><strong>{analysis.fillerCount}</strong><small>{analysis.fillersPerMinute} pro Minute</small></div>
        <div className="metric-card"><MessageSquare size={21} /><span>Umfang</span><strong>{analysis.words}</strong><small>gesprochene Wörter</small></div>
      </section>

      <section className="feedback-columns">
        <div className="feedback-panel positive">
          <div className="panel-title"><CheckCircle size={20} /><h2>Das war stark</h2></div>
          <ul>
            {(analysis.strengths.length ? analysis.strengths : ['Du hast die Übung abgeschlossen und eine Grundlage für die nächste Wiederholung geschaffen.']).map((item) => <li key={item}>{item}</li>)}
          </ul>
        </div>
        <div className="feedback-panel improve">
          <div className="panel-title"><Sparkles size={20} /><h2>Dein nächster Fokus</h2></div>
          <ul>
            {(analysis.improvements.length ? analysis.improvements : ['Wiederhole die Antwort mit einer klaren Hauptaussage und einem konkreten Beispiel.']).map((item) => <li key={item}>{item}</li>)}
          </ul>
        </div>
      </section>

      {analysis.fillerDetails.length > 0 && (
        <section className="filler-panel">
          <span className="section-kicker">Persönliches Muster</span>
          <h2>Diese Füllwörter kamen vor</h2>
          <div className="filler-tags">
            {analysis.fillerDetails.map((item) => <span key={item.label}>{item.label}<strong>{item.count}×</strong></span>)}
          </div>
        </section>
      )}

      <section className="transcript-panel">
        <div className="panel-title"><MessageSquare size={20} /><h2>Dein Transkript</h2></div>
        <p>{transcript || 'Es wurde kein verwertbarer Text erkannt. Prüfe dein Mikrofon und wiederhole die Übung.'}</p>
      </section>

      <section className="result-actions">
        <button className="primary-button" onClick={onRepeat}><RotateCcw size={18} /> Gleiches Thema wiederholen</button>
        <button className="secondary-button" onClick={onNewTopic}><Shuffle size={18} /> Neues Thema wählen</button>
      </section>
    </motion.main>
  )
}

function App() {
  const [screen, setScreen] = useState('home')
  const [mode, setMode] = useState(null)
  const [topic, setTopic] = useState(null)
  const [duration, setDuration] = useState(60)
  const [session, setSession] = useState(null)
  const [history, setHistory] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('speech-coach-history') || '[]')
    } catch {
      return []
    }
  })

  useEffect(() => {
    localStorage.setItem('speech-coach-history', JSON.stringify(history.slice(0, 20)))
  }, [history])

  const chooseMode = (selectedMode) => {
    setMode(selectedMode)
    setScreen('topic')
  }

  const quickRandom = () => {
    const selectedMode = TRAINING_MODES[Math.floor(Math.random() * TRAINING_MODES.length)]
    setMode(selectedMode)
    setTopic(chooseRandom(selectedMode.topics))
    setDuration(60)
    setSession(null)
    setScreen('recorder')
  }

  const startTraining = (selectedTopic, selectedDuration) => {
    setTopic(selectedTopic)
    setDuration(selectedDuration)
    setSession(null)
    setScreen('recorder')
  }

  const finishTraining = (transcript, durationMs) => {
    const analysis = analyseSpeech(transcript, durationMs)
    const completedSession = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      mode: { id: mode.id, title: mode.title, shortTitle: mode.shortTitle },
      topic,
      transcript,
      durationMs,
      analysis,
      createdAt: new Date().toISOString(),
    }
    setSession(completedSession)
    setHistory((current) => [completedSession, ...current].slice(0, 20))
    setScreen('feedback')
  }

  return (
    <AppShell>
      <AnimatePresence mode="wait">
        {screen === 'home' && (
          <HomeScreen key="home" history={history} onChooseMode={chooseMode} onQuickRandom={quickRandom} />
        )}
        {screen === 'topic' && mode && (
          <TopicScreen
            key={`topic-${mode.id}`}
            mode={mode}
            initialTopic={topic}
            onBack={() => setScreen('home')}
            onStart={startTraining}
          />
        )}
        {screen === 'recorder' && mode && topic && (
          <RecorderScreen
            key={`recorder-${mode.id}-${topic.title}`}
            mode={mode}
            topic={topic}
            duration={duration}
            onCancel={() => setScreen('topic')}
            onFinish={finishTraining}
          />
        )}
        {screen === 'feedback' && session && (
          <FeedbackScreen
            key={`feedback-${session.id}`}
            {...session}
            onRepeat={() => startTraining(topic, duration)}
            onNewTopic={() => setScreen('topic')}
            onHome={() => setScreen('home')}
          />
        )}
      </AnimatePresence>
    </AppShell>
  )
}

export default App
