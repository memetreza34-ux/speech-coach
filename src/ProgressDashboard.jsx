import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Activity,
  ArrowRight,
  BarChart3,
  Bot,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Flame,
  Gauge,
  History,
  MessageCircleMore,
  Mic,
  RefreshCw,
  Sparkles,
  Target,
  Trophy,
  X,
} from 'lucide-react'
import { readProgressData } from './progressUtils'

const SKILL_DEFINITIONS = [
  { key: 'pace', label: 'Sprechtempo', icon: Gauge, description: 'Verständliches und situationsgerechtes Tempo' },
  { key: 'fillerControl', label: 'Füllwortkontrolle', icon: Mic, description: 'Ruhige Pausen statt unnötiger Füllwörter' },
  { key: 'clarity', label: 'Klarheit', icon: Target, description: 'Direkte und leicht verständliche Aussagen' },
  { key: 'structure', label: 'Struktur', icon: BarChart3, description: 'Nachvollziehbarer Aufbau deiner Antworten' },
  { key: 'impact', label: 'Wirkung', icon: Sparkles, description: 'Überzeugungskraft und sprachliche Präsenz' },
]

const formatDate = (value) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Unbekannt'
  return new Intl.DateTimeFormat('de-DE', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

const scoreLabel = (score) => {
  if (score >= 85) return 'Sehr stark'
  if (score >= 70) return 'Solide'
  if (score >= 55) return 'Im Aufbau'
  return 'Trainingsfokus'
}

function EmptyProgress({ onOpenSolo, onOpenCoach }) {
  return (
    <section className="progress-empty">
      <div className="progress-empty-icon"><Activity size={34} /></div>
      <span className="progress-eyebrow">Noch keine Trainingsdaten</span>
      <h1>Dein Fortschritt beginnt mit der ersten Übung.</h1>
      <p>Absolviere ein Solo-Training oder eine Live-Coach-Simulation. Danach werden hier Stärken, Schwächen, Wochenziele und Empfehlungen angezeigt.</p>
      <div className="progress-empty-actions">
        <button className="progress-primary-button" onClick={onOpenSolo}><Mic size={18} /> Solo-Training öffnen</button>
        <button className="progress-secondary-button" onClick={onOpenCoach}><Bot size={18} /> Live-Coach starten</button>
      </div>
    </section>
  )
}

export default function ProgressDashboard({ onClose, onOpenCoach, onOpenSolo }) {
  const [refreshKey, setRefreshKey] = useState(0)
  const [filter, setFilter] = useState('all')
  const data = useMemo(() => readProgressData(), [refreshKey])

  const visibleSessions = useMemo(() => {
    if (filter === 'all') return data.sessions
    return data.sessions.filter((session) => session.type === filter)
  }, [data.sessions, filter])

  const startRecommendation = () => {
    if (data.recommendation.target === 'coach') onOpenCoach()
    else onOpenSolo()
  }

  return (
    <motion.div
      className="progress-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.main
        className="progress-dashboard"
        initial={{ opacity: 0, y: 18, scale: 0.99 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.99 }}
        transition={{ duration: 0.24 }}
      >
        <header className="progress-header">
          <div className="progress-header-title">
            <div className="progress-brand-mark"><BarChart3 size={20} /></div>
            <div><strong>Dein Fortschritt</strong><span>Training, Fähigkeiten und nächste Schritte</span></div>
          </div>
          <div className="progress-header-actions">
            <button onClick={() => setRefreshKey((value) => value + 1)} aria-label="Fortschritt aktualisieren"><RefreshCw size={18} /></button>
            <button onClick={onClose} aria-label="Fortschritt schließen"><X size={20} /></button>
          </div>
        </header>

        {!data.sessions.length ? (
          <EmptyProgress onOpenSolo={onOpenSolo} onOpenCoach={onOpenCoach} />
        ) : (
          <div className="progress-content">
            <section className="progress-hero">
              <div className="progress-score-ring" style={{ '--progress-score': `${data.overall * 3.6}deg` }}>
                <div><strong>{data.overall}</strong><span>Gesamtniveau</span></div>
              </div>
              <div className="progress-hero-copy">
                <span className="progress-eyebrow"><Trophy size={15} /> {scoreLabel(data.overall)}</span>
                <h1>Deine Kommunikation entwickelt sich mit jeder Wiederholung.</h1>
                <p>Der Gesamtscore verbindet deine Solo-Auswertungen mit Klarheit, Struktur und Wirkung aus dem Live-Coach.</p>
              </div>
              <div className="progress-week-goal">
                <div className="progress-week-goal-head"><span>Wochenziel</span><strong>{data.weeklyCount}/{data.weeklyGoal}</strong></div>
                <div className="progress-week-goal-bar"><span style={{ width: `${data.weeklyProgress}%` }} /></div>
                <small>{data.weeklyProgress >= 100 ? 'Wochenziel erreicht.' : `${Math.max(0, data.weeklyGoal - data.weeklyCount)} Übungen bis zum Ziel.`}</small>
              </div>
            </section>

            <section className="progress-metrics">
              <article><div><Flame size={20} /></div><span>Aktuelle Serie</span><strong>{data.streak}</strong><small>{data.streak === 1 ? 'Trainingstag' : 'Trainingstage'}</small></article>
              <article><div><CheckCircle2 size={20} /></div><span>Übungen gesamt</span><strong>{data.sessions.length}</strong><small>{data.soloSessions.length} Solo · {data.dialogSessions.length} Dialog</small></article>
              <article><div><Clock3 size={20} /></div><span>Sprechzeit</span><strong>{data.totalMinutes}</strong><small>erfasste Solo-Minuten</small></article>
              <article><div><Trophy size={20} /></div><span>Häufigster Bereich</span><strong className="progress-category-value">{data.favoriteCategory}</strong><small>dein aktueller Schwerpunkt</small></article>
            </section>

            <section className="progress-grid">
              <div className="progress-panel progress-skills-panel">
                <div className="progress-panel-heading">
                  <div><span className="progress-eyebrow">Fähigkeiten</span><h2>Dein Kommunikationsprofil</h2></div>
                  <p>Fehlende Werte erscheinen, sobald du den passenden Trainingsmodus absolviert hast.</p>
                </div>
                <div className="progress-skill-list">
                  {SKILL_DEFINITIONS.map((skill) => {
                    const value = data.skills[skill.key]
                    const Icon = skill.icon
                    return (
                      <div className="progress-skill" key={skill.key}>
                        <div className="progress-skill-icon"><Icon size={18} /></div>
                        <div className="progress-skill-copy"><strong>{skill.label}</strong><span>{skill.description}</span></div>
                        <div className="progress-skill-value">{Number.isFinite(value) ? value : '–'}</div>
                        <div className="progress-skill-bar"><span style={{ width: `${Number.isFinite(value) ? value : 0}%` }} /></div>
                      </div>
                    )
                  })}
                </div>
              </div>

              <aside className="progress-panel progress-recommendation">
                <div className="progress-recommendation-icon"><Sparkles size={24} /></div>
                <span className="progress-eyebrow">Dein nächster Fokus</span>
                <div className="progress-focus-pill">{data.recommendation.skill}</div>
                <h2>{data.recommendation.title}</h2>
                <p>{data.recommendation.description}</p>
                <button onClick={startRecommendation}>
                  {data.recommendation.target === 'coach' ? <MessageCircleMore size={18} /> : <Mic size={18} />}
                  Training starten <ArrowRight size={17} />
                </button>
              </aside>
            </section>

            <section className="progress-panel progress-week-panel">
              <div className="progress-panel-heading">
                <div><span className="progress-eyebrow">Letzte sieben Tage</span><h2>Deine Trainingsaktivität</h2></div>
                <p>Jeder Balken zeigt die Anzahl deiner abgeschlossenen Übungen.</p>
              </div>
              <div className="progress-week-chart">
                {data.week.map((day) => {
                  const maximum = Math.max(1, ...data.week.map((item) => item.count))
                  const height = day.count ? Math.max(18, (day.count / maximum) * 100) : 5
                  return (
                    <div className={day.isToday ? 'progress-day today' : 'progress-day'} key={day.key}>
                      <div className="progress-day-score">{day.averageScore || '–'}</div>
                      <div className="progress-day-track"><span style={{ height: `${height}%` }} /></div>
                      <strong>{day.count}</strong>
                      <small>{day.label}</small>
                    </div>
                  )
                })}
              </div>
            </section>

            <section className="progress-panel progress-history-panel">
              <div className="progress-history-heading">
                <div><span className="progress-eyebrow"><History size={14} /> Verlauf</span><h2>Deine letzten Trainings</h2></div>
                <div className="progress-filter-tabs">
                  <button className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>Alle</button>
                  <button className={filter === 'solo' ? 'active' : ''} onClick={() => setFilter('solo')}>Solo</button>
                  <button className={filter === 'dialog' ? 'active' : ''} onClick={() => setFilter('dialog')}>Live-Coach</button>
                </div>
              </div>
              <div className="progress-history-list">
                {visibleSessions.slice(0, 12).map((session) => (
                  <article key={`${session.type}-${session.id}`}>
                    <div className={session.type === 'dialog' ? 'progress-history-icon dialog' : 'progress-history-icon'}>
                      {session.type === 'dialog' ? <Bot size={18} /> : <Mic size={18} />}
                    </div>
                    <div className="progress-history-copy">
                      <strong>{session.title}</strong>
                      <span>{session.category} · {session.meta}</span>
                    </div>
                    <div className="progress-history-date"><CalendarDays size={14} /> {formatDate(session.createdAt)}</div>
                    <div className="progress-history-score"><strong>{session.overall}</strong><span>Score</span></div>
                  </article>
                ))}
              </div>
            </section>
          </div>
        )}
      </motion.main>
    </motion.div>
  )
}
