import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { AlertCircle, ArrowRight, AudioLines, Bot, CalendarDays, CalendarRange, Check, CheckCircle2, Circle, Cloud, CloudOff, LoaderCircle, Mic, RefreshCw, RotateCcw, Sparkles, Target, Timer, Trophy, X } from 'lucide-react'
import { useAuth } from './cloud/AuthContext'
import { readProgressData } from './progressUtils'
import { generateTrainingPlan, getCurrentPlanWeek, getPlanStats, modeLabel, togglePlanTask } from './trainingPlanEngine'
import { loadTrainingPlan, saveTrainingPlan, setActiveTrainingPlanTask } from './trainingPlanStore'

const MODE_ICONS = { solo: Mic, audio: AudioLines, coach: Bot }
const WEEKDAY_LABELS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']
const formatDate = (value) => {
  if (!value) return 'Noch nicht gestartet'
  const date = new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('de-DE', { day: '2-digit', month: 'long', year: 'numeric' }).format(date)
}

function PlanHeader({ onClose, source, signedIn, syncEnabled }) {
  const cloudActive = signedIn && syncEnabled
  const label = !signedIn ? 'Lokal gespeichert' : !syncEnabled ? 'Cloud-Sync pausiert' : source === 'cloud' ? 'Cloud-Plan' : 'Wird synchronisiert'
  return <header className="plan-header"><div className="plan-header-title"><span><CalendarRange size={21} /></span><div><strong>Dein Trainingsplan</strong><small>Vier Wochen adaptives Kommunikationstraining</small></div></div><div className="plan-header-actions"><div className="plan-storage-badge">{cloudActive ? <Cloud size={16} /> : <CloudOff size={16} />}<span>{label}</span></div><button onClick={onClose} aria-label="Trainingsplan schließen"><X size={20} /></button></div></header>
}

function PlanLoading({ onClose }) {
  return <motion.div className="plan-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><main className="plan-shell"><PlanHeader onClose={onClose} source="local" signedIn={false} syncEnabled={false} /><div className="plan-loading"><LoaderCircle className="plan-spin" size={38} /><h1>Dein Plan wird berechnet …</h1><p>Fähigkeiten, Trainingshistorie und Wochenziel werden ausgewertet.</p></div></main></motion.div>
}

export default function TrainingPlanCenter({ onClose, onOpenSolo, onOpenAudio, onOpenCoach }) {
  const { user, signedIn, profile } = useAuth()
  const [plan, setPlan] = useState(null)
  const [source, setSource] = useState('local')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [selectedWeek, setSelectedWeek] = useState(1)
  const [regenerateArmed, setRegenerateArmed] = useState(false)
  const progress = useMemo(() => readProgressData(), [])
  const weeklyGoal = Number(profile?.weeklyGoal) || Number(progress.weeklyGoal) || 5
  const syncEnabled = profile?.syncEnabled !== false

  useEffect(() => {
    let active = true
    const initialize = async () => {
      setLoading(true)
      setError('')
      try {
        const result = await loadTrainingPlan(user, signedIn && syncEnabled)
        let nextPlan = result.plan
        let nextSource = result.source
        if (!nextPlan) {
          nextPlan = generateTrainingPlan({ progress, weeklyGoal })
          const saved = await saveTrainingPlan(nextPlan, user, signedIn && syncEnabled)
          nextSource = saved.source
        }
        if (!active) return
        setPlan(nextPlan)
        setSource(nextSource)
        setSelectedWeek(getCurrentPlanWeek(nextPlan))
      } catch (loadError) {
        if (!active) return
        const fallback = generateTrainingPlan({ progress, weeklyGoal })
        setPlan(fallback)
        setSource('local')
        setSelectedWeek(getCurrentPlanWeek(fallback))
        setError(loadError?.message || 'Cloud-Plan konnte nicht geladen werden. Der Plan läuft lokal weiter.')
      } finally {
        if (active) setLoading(false)
      }
    }
    initialize()
    return () => { active = false }
  }, [progress, signedIn, syncEnabled, user, weeklyGoal])

  const stats = useMemo(() => getPlanStats(plan), [plan])
  const selected = plan?.weeks?.[selectedWeek - 1]
  const completed = useMemo(() => new Set(plan?.completedTaskIds || []), [plan?.completedTaskIds])

  const persist = async (nextPlan, action = 'save') => {
    setPlan(nextPlan)
    setBusy(action)
    setError('')
    try {
      const result = await saveTrainingPlan(nextPlan, user, signedIn && syncEnabled)
      setSource(result.source)
    } catch (saveError) {
      setSource('local')
      setError(saveError?.message || 'Der Plan wurde lokal gespeichert, aber die Cloud-Synchronisierung ist fehlgeschlagen.')
    } finally { setBusy('') }
  }

  const toggleTask = (taskId) => persist(togglePlanTask(plan, taskId), `task-${taskId}`)
  const startTask = (task) => {
    setActiveTrainingPlanTask(task, user?.id)
    if (task.mode === 'coach') onOpenCoach()
    else if (task.mode === 'audio') onOpenAudio()
    else onOpenSolo()
  }
  const regenerate = async () => {
    if (!regenerateArmed) {
      setRegenerateArmed(true)
      setMessage('Erneutes Klicken ersetzt den aktuellen Plan und setzt dessen Aufgabenstatus zurück.')
      return
    }
    setRegenerateArmed(false)
    setMessage('')
    const nextPlan = generateTrainingPlan({ progress: readProgressData(), weeklyGoal })
    setSelectedWeek(1)
    await persist(nextPlan, 'regenerate')
    setMessage('Der Plan wurde mit deinen aktuellen Leistungswerten neu berechnet.')
  }

  if (loading || !plan) return <PlanLoading onClose={onClose} />

  return <motion.div className="plan-overlay" role="dialog" aria-modal="true" aria-label="Adaptiver Trainingsplan" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><motion.main className="plan-shell" initial={{ opacity: 0, y: 18, scale: 0.99 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 12, scale: 0.99 }}><PlanHeader onClose={onClose} source={source} signedIn={signedIn} syncEnabled={syncEnabled} /><div className="plan-content"><section className="plan-hero"><div className="plan-progress-ring" style={{ '--plan-progress': `${stats.progressPercent * 3.6}deg` }}><div><strong>{stats.progressPercent}%</strong><span>abgeschlossen</span></div></div><div className="plan-hero-copy"><span className="plan-eyebrow"><Sparkles size={15} /> Adaptiv aus deinem Profil</span><h1>Vier Wochen. Ein klarer Fokus. <span>Messbare Wiederholung.</span></h1><p>Der Plan gewichtet deine schwächsten Fähigkeiten stärker und steigert die Anforderungen von der Grundlage bis zum realistischen Transfer.</p><div className="plan-focus-list">{plan.focusSkills.map((skill, index) => <span key={skill.key}><strong>{index + 1}</strong>{skill.label}{Number.isFinite(skill.baselineScore) && <small>{skill.baselineScore}</small>}</span>)}</div></div><aside className="plan-current-card"><span>Aktuelle Woche</span><strong>{stats.currentWeek} von {plan.durationWeeks}</strong><div><i style={{ width: `${stats.currentWeekTotal ? (stats.currentWeekCompleted / stats.currentWeekTotal) * 100 : 0}%` }} /></div><small>{stats.currentWeekCompleted}/{stats.currentWeekTotal} Einheiten · Start {formatDate(plan.startedOn)}</small></aside></section><section className="plan-summary-grid"><article><CalendarDays size={20} /><span>Planlänge</span><strong>4 Wochen</strong><small>{plan.sessionsPerWeek} Kerneinheiten pro Woche</small></article><article><CheckCircle2 size={20} /><span>Erledigt</span><strong>{stats.completedCount}/{stats.totalCount}</strong><small>automatisch oder manuell markiert</small></article><article><Timer size={20} /><span>Trainingsumfang</span><strong>{stats.completedMinutes}/{stats.totalMinutes} Min.</strong><small>geplante aktive Übungszeit</small></article><article><Trophy size={20} /><span>Ausgangsniveau</span><strong>{plan.baseline.overall || 'Start'}</strong><small>{plan.baseline.sessionCount} Trainings ausgewertet</small></article></section>{error && <div className="plan-alert error"><AlertCircle size={18} /><span>{error}</span></div>}{message && <div className="plan-alert success"><CheckCircle2 size={18} /><span>{message}</span></div>}<section className="plan-week-navigation">{plan.weeks.map((week) => { const weekCompleted = week.tasks.filter((task) => completed.has(task.id)).length; const isCurrent = week.number === stats.currentWeek; return <button key={week.number} className={`${selectedWeek === week.number ? 'active' : ''} ${isCurrent ? 'current' : ''}`} onClick={() => setSelectedWeek(week.number)}><span>Woche {week.number}</span><strong>{week.title}</strong><small>{weekCompleted}/{week.tasks.length} erledigt</small>{weekCompleted === week.tasks.length && <CheckCircle2 size={17} />}</button> })}</section><section className="plan-week-panel"><div className="plan-week-heading"><div><span className="plan-eyebrow">Woche {selected.number} · {selected.difficulty}</span><h2>{selected.title}</h2><p>{selected.description}</p></div><div className="plan-week-count"><strong>{selected.tasks.filter((task) => completed.has(task.id)).length}</strong><span>von {selected.tasks.length}</span></div></div><div className="plan-task-list">{selected.tasks.map((task) => { const done = completed.has(task.id); const Icon = MODE_ICONS[task.mode] || Target; return <article className={done ? 'plan-task done' : 'plan-task'} key={task.id}><button className="plan-task-check" onClick={() => toggleTask(task.id)} aria-label={done ? 'Aufgabe als offen markieren' : 'Aufgabe als erledigt markieren'} disabled={busy === `task-${task.id}`}>{busy === `task-${task.id}` ? <LoaderCircle className="plan-spin" size={20} /> : done ? <Check size={20} /> : <Circle size={20} />}</button><div className={`plan-task-mode ${task.mode}`}><Icon size={20} /></div><div className="plan-task-copy"><div><span>{WEEKDAY_LABELS[task.dayIndex]} · {modeLabel(task.mode)}</span><em>{task.skillLabel}</em></div><h3>{task.title}</h3><p>{task.instruction}</p><small><Timer size={14} /> ca. {task.durationMinutes} Minuten · {task.difficulty}</small></div><button className="plan-task-start" onClick={() => startTask(task)} disabled={done}>{done ? <><CheckCircle2 size={17} /> Erledigt</> : <>Training starten <ArrowRight size={17} /></>}</button></article> })}</div></section><section className="plan-footer-panel"><div><RotateCcw size={21} /><div><strong>Plan an aktuelle Werte anpassen</strong><span>Eine Neuberechnung berücksichtigt alle inzwischen abgeschlossenen Trainings. Der bisherige Aufgabenstatus wird zurückgesetzt.</span></div></div><button className={regenerateArmed ? 'armed' : ''} onClick={regenerate} disabled={busy === 'regenerate'}>{busy === 'regenerate' ? <LoaderCircle className="plan-spin" size={18} /> : <RefreshCw size={18} />}{regenerateArmed ? 'Jetzt wirklich ersetzen' : 'Plan neu berechnen'}</button></section></div></motion.main></motion.div>
}
