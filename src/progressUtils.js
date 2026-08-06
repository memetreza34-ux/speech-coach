const safeRead = (key) => {
  try {
    const value = JSON.parse(localStorage.getItem(key) || '[]')
    return Array.isArray(value) ? value : []
  } catch {
    return []
  }
}

const clamp = (value, minimum = 0, maximum = 100) => Math.min(maximum, Math.max(minimum, value))

const dateKey = (value) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

const startOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate())

const average = (values) => {
  const valid = values.filter((value) => Number.isFinite(value))
  if (!valid.length) return null
  return Math.round(valid.reduce((sum, value) => sum + value, 0) / valid.length)
}

const paceScore = (wpm) => {
  if (!Number.isFinite(wpm) || wpm <= 0) return null
  if (wpm >= 105 && wpm <= 165) return 100
  if (wpm < 105) return clamp(100 - (105 - wpm) * 1.1, 35, 100)
  return clamp(100 - (wpm - 165) * 0.9, 35, 100)
}

const fillerScore = (fillersPerMinute) => {
  if (!Number.isFinite(fillersPerMinute)) return null
  return clamp(100 - fillersPerMinute * 9, 25, 100)
}

const normalizeSolo = (item) => ({
  id: item.id,
  type: 'solo',
  title: item.topic?.title || 'Solo-Training',
  category: item.mode?.title || item.mode?.shortTitle || 'Solo-Training',
  createdAt: item.createdAt,
  durationMs: Number(item.durationMs) || 0,
  overall: Number(item.analysis?.score) || 0,
  details: {
    pace: paceScore(Number(item.analysis?.wpm)),
    fillerControl: fillerScore(Number(item.analysis?.fillersPerMinute)),
    clarity: null,
    structure: null,
    impact: null,
  },
  meta: `${Math.round((Number(item.durationMs) || 0) / 1000)} Sek. · ${Number(item.analysis?.wpm) || 0} Wörter/Min.`,
})

const normalizeDialog = (item) => ({
  id: item.id,
  type: 'dialog',
  title: item.topic || 'Live-Coach',
  category: item.mode || 'Live-Coach',
  createdAt: item.createdAt,
  durationMs: 0,
  overall: Number(item.scores?.overall) || average([
    Number(item.scores?.clarity),
    Number(item.scores?.structure),
    Number(item.scores?.impact),
  ]) || 0,
  details: {
    pace: null,
    fillerControl: null,
    clarity: Number(item.scores?.clarity) || null,
    structure: Number(item.scores?.structure) || null,
    impact: Number(item.scores?.impact) || null,
  },
  meta: `${item.difficulty || 'Simulation'} · ${Number(item.rounds) || 0} Runden`,
})

const calculateStreak = (sessions) => {
  const days = new Set(sessions.map((session) => dateKey(session.createdAt)).filter(Boolean))
  if (!days.size) return 0

  let cursor = startOfDay(new Date())
  const todayKey = dateKey(cursor)
  if (!days.has(todayKey)) {
    cursor.setDate(cursor.getDate() - 1)
    if (!days.has(dateKey(cursor))) return 0
  }

  let streak = 0
  while (days.has(dateKey(cursor))) {
    streak += 1
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}

const buildWeek = (sessions) => {
  const formatter = new Intl.DateTimeFormat('de-DE', { weekday: 'short' })
  const result = []
  const today = startOfDay(new Date())

  for (let offset = 6; offset >= 0; offset -= 1) {
    const day = new Date(today)
    day.setDate(today.getDate() - offset)
    const key = dateKey(day)
    const daySessions = sessions.filter((session) => dateKey(session.createdAt) === key)
    result.push({
      key,
      label: formatter.format(day).replace('.', ''),
      count: daySessions.length,
      averageScore: average(daySessions.map((session) => session.overall)) || 0,
      isToday: offset === 0,
    })
  }
  return result
}

const recommendationFor = (skills, hasDialogSessions) => {
  const available = Object.entries(skills).filter(([, value]) => Number.isFinite(value))
  if (!available.length) {
    return {
      skill: 'Grundlage',
      title: 'Starte mit einer 60-Sekunden-Rede',
      description: 'Wähle ein einfaches Thema und sprich mit einer klaren Aussage, Begründung und einem Beispiel.',
      target: 'solo',
    }
  }

  const [weakest] = available.sort((left, right) => left[1] - right[1])[0]
  const recommendations = {
    pace: {
      skill: 'Sprechtempo',
      title: 'Tempo und Wirkungspausen trainieren',
      description: 'Sprich 60 Sekunden und setze nach jeder Kernaussage bewusst eine kurze Pause.',
      target: 'solo',
    },
    fillerControl: {
      skill: 'Füllwörter',
      title: 'Antwort ohne Ausweichwörter',
      description: 'Formuliere kurze Hauptsätze und ersetze Füllwörter konsequent durch stille Denkpausen.',
      target: 'solo',
    },
    clarity: {
      skill: 'Klarheit',
      title: 'Direkte Antworten im Live-Coach',
      description: 'Beantworte jede Rückfrage zuerst in einem klaren Satz und begründe sie anschließend.',
      target: 'coach',
    },
    structure: {
      skill: 'Struktur',
      title: 'Drei-Schritte-Antwort trainieren',
      description: 'Nutze im Live-Coach die Reihenfolge Aussage, Begründung und konkretes Beispiel.',
      target: 'coach',
    },
    impact: {
      skill: 'Wirkung',
      title: 'Anspruchsvolle Gesprächssimulation',
      description: 'Trainiere mit kritischen Rückfragen und schließe jede Antwort mit einer eindeutigen Kernaussage ab.',
      target: 'coach',
    },
  }

  const recommendation = recommendations[weakest]
  if (recommendation.target === 'coach' && !hasDialogSessions) {
    return {
      ...recommendation,
      title: 'Erste Live-Coach-Simulation starten',
      description: 'Der Live-Coach stellt Rückfragen und bewertet Klarheit, Struktur und Wirkung deiner Antworten.',
    }
  }
  return recommendation
}

export const readProgressData = () => {
  const soloSessions = safeRead('speech-coach-history').map(normalizeSolo)
  const dialogSessions = safeRead('speech-coach-dialog-history').map(normalizeDialog)
  const sessions = [...soloSessions, ...dialogSessions]
    .filter((session) => session.createdAt)
    .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt))

  const skills = {
    pace: average(sessions.map((session) => session.details.pace)),
    fillerControl: average(sessions.map((session) => session.details.fillerControl)),
    clarity: average(sessions.map((session) => session.details.clarity)),
    structure: average(sessions.map((session) => session.details.structure)),
    impact: average(sessions.map((session) => session.details.impact)),
  }

  const categoryCounts = sessions.reduce((counts, session) => {
    counts[session.category] = (counts[session.category] || 0) + 1
    return counts
  }, {})

  const favoriteCategory = Object.entries(categoryCounts).sort((left, right) => right[1] - left[1])[0]?.[0] || 'Noch offen'
  const week = buildWeek(sessions)
  const weeklyCount = week.reduce((sum, day) => sum + day.count, 0)
  const weeklyGoal = 5

  return {
    sessions,
    soloSessions,
    dialogSessions,
    skills,
    overall: average(sessions.map((session) => session.overall)) || 0,
    streak: calculateStreak(sessions),
    totalMinutes: Math.round(soloSessions.reduce((sum, session) => sum + session.durationMs, 0) / 60000),
    favoriteCategory,
    week,
    weeklyCount,
    weeklyGoal,
    weeklyProgress: clamp(Math.round((weeklyCount / weeklyGoal) * 100)),
    recommendation: recommendationFor(skills, dialogSessions.length > 0),
  }
}
