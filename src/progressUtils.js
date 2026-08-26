const safeRead = (key) => {
  try {
    const value = JSON.parse(localStorage.getItem(key) || '[]')
    return Array.isArray(value) ? value : []
  } catch {
    return []
  }
}

const readBaseline = () => {
  try {
    const value = JSON.parse(localStorage.getItem('speech-coach-baseline') || 'null')
    return value && typeof value === 'object' ? value : null
  } catch {
    return null
  }
}

const readWeeklyGoal = () => {
  try {
    const profile = JSON.parse(localStorage.getItem('speech-coach-account-profile') || 'null')
    const value = Number(profile?.weeklyGoal)
    return Number.isFinite(value) ? Math.max(1, Math.min(50, Math.round(value))) : 5
  } catch {
    return 5
  }
}

const clamp = (value, minimum = 0, maximum = 100) => Math.min(maximum, Math.max(minimum, value))
const average = (values) => {
  const valid = values.filter((value) => Number.isFinite(value))
  return valid.length ? Math.round(valid.reduce((sum, value) => sum + value, 0) / valid.length) : null
}
const dateKey = (value) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}
const startOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate())

const paceScore = (wpm) => {
  if (!Number.isFinite(wpm) || wpm <= 0) return null
  if (wpm >= 105 && wpm <= 165) return 100
  if (wpm < 105) return clamp(100 - (105 - wpm) * 1.1, 35, 100)
  return clamp(100 - (wpm - 165) * 0.9, 35, 100)
}
const fillerScore = (perMinute) => Number.isFinite(perMinute) ? clamp(100 - perMinute * 9, 25, 100) : null

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
    voiceDynamics: null,
    pauseControl: null,
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
  overall: Number(item.scores?.overall) || average([Number(item.scores?.clarity), Number(item.scores?.structure), Number(item.scores?.impact)]) || 0,
  details: {
    pace: null,
    fillerControl: null,
    clarity: Number(item.scores?.clarity) || null,
    structure: Number(item.scores?.structure) || null,
    impact: Number(item.scores?.impact) || null,
    voiceDynamics: null,
    pauseControl: null,
  },
  meta: `${item.difficulty || 'Simulation'} · ${Number(item.rounds) || 0} Runden`,
})

const normalizeAudio = (item) => {
  const durationMs = Number(item.durationMs) || 0
  const transcript = item.transcriptAnalysis || {}
  const fillersPerMinute = durationMs > 0 ? (Number(transcript.fillerCount) || 0) / (durationMs / 60000) : null
  return {
    id: item.id,
    type: 'audio',
    title: item.title || 'Audio-Analyse',
    category: 'Audio-Labor',
    createdAt: item.createdAt,
    durationMs,
    overall: Number(item.overall) || 0,
    details: {
      pace: paceScore(Number(transcript.wpm)),
      fillerControl: fillerScore(fillersPerMinute),
      clarity: null,
      structure: null,
      impact: null,
      voiceDynamics: Number(item.scores?.dynamics) || null,
      pauseControl: Number(item.scores?.pauses) || null,
    },
    meta: `${Math.round(durationMs / 1000)} Sek. · ${Number(item.pauseCount) || 0} Pausen`,
  }
}

const calculateStreak = (sessions) => {
  const days = new Set(sessions.map((session) => dateKey(session.createdAt)).filter(Boolean))
  if (!days.size) return 0
  const cursor = startOfDay(new Date())
  if (!days.has(dateKey(cursor))) {
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
  const today = startOfDay(new Date())
  return Array.from({ length: 7 }, (_, index) => {
    const offset = 6 - index
    const day = new Date(today)
    day.setDate(today.getDate() - offset)
    const key = dateKey(day)
    const daySessions = sessions.filter((session) => dateKey(session.createdAt) === key)
    return {
      key,
      label: formatter.format(day).replace('.', ''),
      count: daySessions.length,
      averageScore: average(daySessions.map((session) => session.overall)) || 0,
      isToday: offset === 0,
    }
  })
}

const recommendationFor = (skills, hasDialog, hasAudio) => {
  const available = Object.entries(skills).filter(([, value]) => Number.isFinite(value))
  if (!available.length) return { skill: 'Grundlage', title: 'Starte mit einer 60-Sekunden-Rede', description: 'Sprich mit Aussage, Begründung und Beispiel.', target: 'solo' }
  const [weakest] = available.sort((left, right) => left[1] - right[1])[0]
  const options = {
    pace: { skill: 'Sprechtempo', title: 'Tempo und Wirkungspausen trainieren', description: 'Sprich 60 Sekunden und setze nach jeder Kernaussage eine kurze Pause.', target: 'solo' },
    fillerControl: { skill: 'Füllwörter', title: 'Antwort ohne Ausweichwörter', description: 'Nutze kurze Hauptsätze und stille Denkpausen.', target: 'solo' },
    clarity: { skill: 'Klarheit', title: 'Direkte Antworten im Live-Coach', description: 'Antworte zuerst in einem Satz und begründe anschließend.', target: 'coach' },
    structure: { skill: 'Struktur', title: 'Drei-Schritte-Antwort trainieren', description: 'Nutze Aussage, Begründung und konkretes Beispiel.', target: 'coach' },
    impact: { skill: 'Wirkung', title: 'Anspruchsvolle Gesprächssimulation', description: 'Trainiere kritische Rückfragen und klare Abschlüsse.', target: 'coach' },
    voiceDynamics: { skill: 'Stimm-Dynamik', title: 'Betonung im Audio-Labor trainieren', description: 'Betone Schlüsselwörter und variiere deine Lautstärke bewusst.', target: 'audio' },
    pauseControl: { skill: 'Pausen', title: 'Pausengestaltung sichtbar trainieren', description: 'Nutze das Audio-Labor und prüfe Wirkungspausen in der Zeitleiste.', target: 'audio' },
  }
  const result = options[weakest]
  if (result.target === 'coach' && !hasDialog) return { ...result, title: 'Erste Live-Coach-Simulation starten' }
  if (result.target === 'audio' && !hasAudio) return { ...result, title: 'Erste Audioanalyse aufnehmen' }
  return result
}

export const readProgressData = () => {
  const baseline = readBaseline()
  const soloSessions = safeRead('speech-coach-history').map(normalizeSolo)
  const dialogSessions = safeRead('speech-coach-dialog-history').map(normalizeDialog)
  const audioSessions = safeRead('speech-coach-audio-history').map(normalizeAudio)
  const sessions = [...soloSessions, ...dialogSessions, ...audioSessions]
    .filter((session) => session.createdAt)
    .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt))

  const measuredSkills = {
    pace: average(sessions.map((session) => session.details.pace)),
    fillerControl: average(sessions.map((session) => session.details.fillerControl)),
    clarity: average(sessions.map((session) => session.details.clarity)),
    structure: average(sessions.map((session) => session.details.structure)),
    impact: average(sessions.map((session) => session.details.impact)),
    voiceDynamics: average(sessions.map((session) => session.details.voiceDynamics)),
    pauseControl: average(sessions.map((session) => session.details.pauseControl)),
  }

  const skills = {
    pace: measuredSkills.pace ?? Number(baseline?.skills?.pace) || null,
    fillerControl: measuredSkills.fillerControl ?? Number(baseline?.skills?.fillerControl) || null,
    clarity: measuredSkills.clarity ?? Number(baseline?.skills?.clarity) || null,
    structure: measuredSkills.structure ?? Number(baseline?.skills?.structure) || null,
    impact: measuredSkills.impact ?? Number(baseline?.skills?.impact) || null,
    voiceDynamics: measuredSkills.voiceDynamics,
    pauseControl: measuredSkills.pauseControl,
  }

  const categoryCounts = sessions.reduce((counts, session) => ({ ...counts, [session.category]: (counts[session.category] || 0) + 1 }), {})
  const favoriteCategory = Object.entries(categoryCounts).sort((left, right) => right[1] - left[1])[0]?.[0] || 'Noch offen'
  const week = buildWeek(sessions)
  const weeklyCount = week.reduce((sum, day) => sum + day.count, 0)
  const weeklyGoal = readWeeklyGoal()

  return {
    baseline,
    sessions,
    soloSessions,
    dialogSessions,
    audioSessions,
    skills,
    overall: average(sessions.map((session) => session.overall)) || Number(baseline?.overall) || 0,
    streak: calculateStreak(sessions),
    totalMinutes: Math.round(sessions.reduce((sum, session) => sum + session.durationMs, 0) / 60000),
    favoriteCategory,
    week,
    weeklyCount,
    weeklyGoal,
    weeklyProgress: clamp(Math.round((weeklyCount / weeklyGoal) * 100)),
    recommendation: recommendationFor(skills, dialogSessions.length > 0, audioSessions.length > 0),
  }
}
