const clamp = (value, minimum, maximum) => Math.min(maximum, Math.max(minimum, value))

export const PLAN_DURATION_WEEKS = 4

export const PLAN_SKILLS = {
  pace: { label: 'Sprechtempo', shortLabel: 'Tempo' },
  fillerControl: { label: 'Füllwortkontrolle', shortLabel: 'Füllwörter' },
  clarity: { label: 'Klarheit', shortLabel: 'Klarheit' },
  structure: { label: 'Struktur', shortLabel: 'Struktur' },
  impact: { label: 'Wirkung', shortLabel: 'Wirkung' },
  voiceDynamics: { label: 'Stimm-Dynamik', shortLabel: 'Dynamik' },
  pauseControl: { label: 'Pausengestaltung', shortLabel: 'Pausen' },
}

const WEEK_THEMES = [
  {
    title: 'Fundament schaffen',
    description: 'Kernaussagen früh formulieren und kontrolliert sprechen.',
    difficulty: 'Grundlage',
  },
  {
    title: 'Kontrolle aufbauen',
    description: 'Struktur, Tempo und Stimme bewusster steuern.',
    difficulty: 'Aufbau',
  },
  {
    title: 'Unter Druck anwenden',
    description: 'Spontan reagieren und trotzdem klar und überzeugend bleiben.',
    difficulty: 'Realistisch',
  },
  {
    title: 'Transfer festigen',
    description: 'Die stärksten Techniken in anspruchsvollen Situationen verbinden.',
    difficulty: 'Transfer',
  },
]

const EXERCISES = {
  pace: [
    {
      mode: 'solo',
      title: '60 Sekunden mit Tempowechsel',
      instruction: 'Sprich zuerst bewusst ruhig, steigere danach leicht das Tempo und ende wieder kontrolliert.',
      minutes: 4,
    },
    {
      mode: 'audio',
      title: 'Tempo sichtbar machen',
      instruction: 'Nimm eine Minute auf und prüfe anschließend Wörter pro Minute und Sprechanteil.',
      minutes: 5,
    },
    {
      mode: 'solo',
      title: 'Kernaussage ohne Hast',
      instruction: 'Formuliere Aussage, Begründung und Beispiel. Jede Stufe erhält ihr eigenes Tempo.',
      minutes: 5,
    },
  ],
  fillerControl: [
    {
      mode: 'solo',
      title: 'Stille statt Füllwort',
      instruction: 'Ersetze jedes gedachte „ähm“ durch eine kurze stille Pause.',
      minutes: 4,
    },
    {
      mode: 'audio',
      title: 'Füllwort-Check',
      instruction: 'Nimm eine spontane Antwort auf und prüfe anschließend Füllwörter und Denkpausen.',
      minutes: 5,
    },
    {
      mode: 'solo',
      title: 'Kurze Hauptsätze',
      instruction: 'Antworte in kurzen Sätzen. Beginne jeden neuen Gedanken erst nach einer bewussten Pause.',
      minutes: 5,
    },
  ],
  clarity: [
    {
      mode: 'solo',
      title: 'Antwort zuerst',
      instruction: 'Beginne mit einer direkten Antwort in einem Satz. Erkläre erst danach die Begründung.',
      minutes: 5,
    },
    {
      mode: 'coach',
      title: 'Klare Rückfragen beantworten',
      instruction: 'Nutze im Live-Coach zuerst eine eindeutige Position und anschließend ein Beispiel.',
      minutes: 8,
    },
    {
      mode: 'solo',
      title: 'Fachbegriff-freie Erklärung',
      instruction: 'Erkläre ein technisches Thema so, dass eine fachfremde Person es sofort versteht.',
      minutes: 6,
    },
  ],
  structure: [
    {
      mode: 'solo',
      title: 'Drei-Schritte-Antwort',
      instruction: 'Nutze konsequent Aussage, Begründung und konkretes Beispiel.',
      minutes: 5,
    },
    {
      mode: 'coach',
      title: 'Struktur unter Rückfragen',
      instruction: 'Halte im Live-Coach auch nach kritischen Rückfragen an einer klaren Antwortstruktur fest.',
      minutes: 8,
    },
    {
      mode: 'solo',
      title: 'Einleitung, Kern, Abschluss',
      instruction: 'Baue eine kurze Präsentation mit erkennbarem Einstieg, Hauptgedanken und Schluss auf.',
      minutes: 7,
    },
  ],
  impact: [
    {
      mode: 'coach',
      title: 'Überzeugend Position beziehen',
      instruction: 'Vertrete eine Position, nenne einen Nutzen und schließe mit einer klaren Forderung.',
      minutes: 8,
    },
    {
      mode: 'solo',
      title: 'Starker Schlusssatz',
      instruction: 'Beende deine Rede mit einer kurzen Botschaft, die ohne weitere Erklärung stehen kann.',
      minutes: 5,
    },
    {
      mode: 'coach',
      title: 'Einwand behandeln',
      instruction: 'Greife den Einwand auf, ordne ihn ein und führe ruhig zu deiner Kernaussage zurück.',
      minutes: 9,
    },
  ],
  voiceDynamics: [
    {
      mode: 'audio',
      title: 'Schlüsselwörter betonen',
      instruction: 'Markiere drei Schlüsselwörter hörbar, ohne den gesamten Satz lauter zu sprechen.',
      minutes: 5,
    },
    {
      mode: 'audio',
      title: 'Dynamik-Kurve trainieren',
      instruction: 'Variiere Lautstärke und Energie zwischen Erklärung, Beispiel und Abschluss.',
      minutes: 6,
    },
    {
      mode: 'audio',
      title: 'Monotonie durchbrechen',
      instruction: 'Sprich denselben Satz dreimal mit unterschiedlicher Betonung und Wirkung.',
      minutes: 5,
    },
  ],
  pauseControl: [
    {
      mode: 'audio',
      title: 'Wirkungspausen setzen',
      instruction: 'Setze nach jeder Kernaussage eine kurze Pause und prüfe sie anschließend in der Zeitleiste.',
      minutes: 5,
    },
    {
      mode: 'audio',
      title: 'Lange Unterbrechungen reduzieren',
      instruction: 'Plane die nächsten drei Gedanken vor der Aufnahme und vermeide ungeplante lange Pausen.',
      minutes: 6,
    },
    {
      mode: 'solo',
      title: 'Pause vor dem Beispiel',
      instruction: 'Nutze eine bewusste Pause als Übergang von der Begründung zum konkreten Beispiel.',
      minutes: 5,
    },
  ],
}

const DEFAULT_SKILL_ORDER = [
  'clarity',
  'structure',
  'pace',
  'fillerControl',
  'voiceDynamics',
  'pauseControl',
  'impact',
]

const hashString = (value) => {
  let hash = 2166136261
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return Math.abs(hash >>> 0)
}

const createPlanId = () => `plan-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`

const rankSkills = (skills = {}) => {
  const available = Object.keys(PLAN_SKILLS).map((key) => ({
    key,
    score: Number.isFinite(skills[key]) ? Number(skills[key]) : null,
  }))
  const measured = available.filter((item) => item.score !== null).sort((left, right) => left.score - right.score)
  const missing = DEFAULT_SKILL_ORDER
    .filter((key) => !measured.some((item) => item.key === key))
    .map((key) => ({ key, score: null }))
  return [...measured, ...missing]
}

const buildWeightedSkillRotation = (rankedSkills) => {
  const keys = rankedSkills.map((item) => item.key)
  const [first, second, third] = keys
  return [
    first,
    first,
    first,
    second,
    second,
    third,
    ...keys,
  ].filter(Boolean)
}

const buildTask = ({ planId, weekIndex, taskIndex, skill, exercise, difficulty }) => {
  const dayIndex = taskIndex % 7
  return {
    id: `${planId}-w${weekIndex + 1}-t${taskIndex + 1}`,
    week: weekIndex + 1,
    order: taskIndex + 1,
    dayIndex,
    skill,
    skillLabel: PLAN_SKILLS[skill].label,
    mode: exercise.mode,
    title: exercise.title,
    instruction: exercise.instruction,
    durationMinutes: exercise.minutes + Math.min(weekIndex, 2),
    difficulty,
  }
}

export const generateTrainingPlan = ({ progress = {}, weeklyGoal = 5, previousPlanId = null } = {}) => {
  const planId = previousPlanId || createPlanId()
  const rankedSkills = rankSkills(progress.skills)
  const focusSkills = rankedSkills.slice(0, 3).map(({ key, score }) => ({
    key,
    label: PLAN_SKILLS[key].label,
    baselineScore: score,
  }))
  const rotation = buildWeightedSkillRotation(rankedSkills)
  const sessionsPerWeek = clamp(Math.round(Number(weeklyGoal) || 5), 3, 7)
  const seed = hashString(`${planId}-${progress.overall || 0}-${sessionsPerWeek}`)

  const weeks = WEEK_THEMES.map((theme, weekIndex) => {
    const tasks = Array.from({ length: sessionsPerWeek }, (_, taskIndex) => {
      const rotationIndex = (seed + weekIndex * sessionsPerWeek + taskIndex) % rotation.length
      const skill = rotation[rotationIndex]
      const library = EXERCISES[skill]
      const exercise = library[(seed + weekIndex + taskIndex) % library.length]
      return buildTask({ planId, weekIndex, taskIndex, skill, exercise, difficulty: theme.difficulty })
    })

    return {
      number: weekIndex + 1,
      title: theme.title,
      description: theme.description,
      difficulty: theme.difficulty,
      tasks,
    }
  })

  const now = new Date().toISOString()
  return {
    id: planId,
    version: 1,
    createdAt: now,
    updatedAt: now,
    startedOn: now.slice(0, 10),
    durationWeeks: PLAN_DURATION_WEEKS,
    sessionsPerWeek,
    baseline: {
      overall: Number(progress.overall) || 0,
      sessionCount: Number(progress.sessions?.length) || 0,
      skills: Object.fromEntries(Object.keys(PLAN_SKILLS).map((key) => [key, Number.isFinite(progress.skills?.[key]) ? progress.skills[key] : null])),
    },
    focusSkills,
    weeks,
    completedTaskIds: [],
    completionTimestamps: {},
  }
}

export const getCurrentPlanWeek = (plan, now = new Date()) => {
  if (!plan?.startedOn) return 1
  const start = new Date(`${plan.startedOn}T00:00:00`)
  if (Number.isNaN(start.getTime())) return 1
  const elapsedDays = Math.max(0, Math.floor((now.getTime() - start.getTime()) / 86400000))
  return clamp(Math.floor(elapsedDays / 7) + 1, 1, PLAN_DURATION_WEEKS)
}

export const getPlanStats = (plan) => {
  const tasks = plan?.weeks?.flatMap((week) => week.tasks || []) || []
  const completed = new Set(plan?.completedTaskIds || [])
  const completedCount = tasks.filter((task) => completed.has(task.id)).length
  const totalCount = tasks.length
  const currentWeek = getCurrentPlanWeek(plan)
  const currentWeekTasks = plan?.weeks?.[currentWeek - 1]?.tasks || []
  const currentWeekCompleted = currentWeekTasks.filter((task) => completed.has(task.id)).length
  const nextTask = tasks.find((task) => !completed.has(task.id)) || null
  const totalMinutes = tasks.reduce((sum, task) => sum + (Number(task.durationMinutes) || 0), 0)
  const completedMinutes = tasks
    .filter((task) => completed.has(task.id))
    .reduce((sum, task) => sum + (Number(task.durationMinutes) || 0), 0)

  return {
    tasks,
    totalCount,
    completedCount,
    progressPercent: totalCount ? Math.round((completedCount / totalCount) * 100) : 0,
    currentWeek,
    currentWeekCompleted,
    currentWeekTotal: currentWeekTasks.length,
    nextTask,
    totalMinutes,
    completedMinutes,
    finished: totalCount > 0 && completedCount === totalCount,
  }
}

export const togglePlanTask = (plan, taskId) => {
  const completed = new Set(plan?.completedTaskIds || [])
  const timestamps = { ...(plan?.completionTimestamps || {}) }
  if (completed.has(taskId)) {
    completed.delete(taskId)
    delete timestamps[taskId]
  } else {
    completed.add(taskId)
    timestamps[taskId] = new Date().toISOString()
  }

  return {
    ...plan,
    completedTaskIds: [...completed],
    completionTimestamps: timestamps,
    updatedAt: new Date().toISOString(),
  }
}

export const modeLabel = (mode) => ({
  solo: 'Solo-Training',
  audio: 'Audio-Labor',
  coach: 'Live-Coach',
}[mode] || 'Training')
