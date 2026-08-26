const clamp = (value, minimum = 0, maximum = 100) => Math.min(maximum, Math.max(minimum, value))

const normalize = (value = '') => String(value).toLowerCase().replace(/[^a-zäöüß0-9\s-]/gi, ' ').replace(/\s+/g, ' ').trim()

const STOP_WORDS = new Set([
  'aber', 'alle', 'als', 'also', 'am', 'an', 'auch', 'auf', 'aus', 'bei', 'bin', 'bis', 'das', 'dass', 'dem', 'den', 'der', 'des',
  'die', 'dies', 'diese', 'dieser', 'ein', 'eine', 'einem', 'einen', 'einer', 'er', 'es', 'für', 'hat', 'haben', 'ich', 'im', 'in',
  'ist', 'ja', 'kann', 'man', 'mit', 'nach', 'nicht', 'noch', 'oder', 'sich', 'sie', 'sind', 'so', 'und', 'uns', 'von', 'war', 'was',
  'weil', 'wenn', 'wie', 'wir', 'wird', 'zu', 'zum', 'zur', 'über', 'mehr', 'sehr', 'dann', 'durch', 'meine', 'mein', 'einen', 'einer',
])

const HEDGES = [
  { label: 'eigentlich', pattern: /\beigentlich\b/gi },
  { label: 'vielleicht', pattern: /\bvielleicht\b/gi },
  { label: 'ich glaube', pattern: /\bich\s+glaube\b/gi },
  { label: 'ich denke', pattern: /\bich\s+denke\b/gi },
  { label: 'irgendwie', pattern: /\birgendwie\b/gi },
  { label: 'ein bisschen', pattern: /\bein\s+bisschen\b/gi },
  { label: 'mehr oder weniger', pattern: /\bmehr\s+oder\s+weniger\b/gi },
  { label: 'sozusagen', pattern: /\bsozusagen\b/gi },
]

const FILLERS = [
  { label: 'ähm', pattern: /\b(?:ähm+|äh+|öhm+)\b/gi },
  { label: 'also', pattern: /\balso\b/gi },
  { label: 'quasi', pattern: /\bquasi\b/gi },
  { label: 'halt', pattern: /\bhalt\b/gi },
  { label: 'genau', pattern: /\bgenau\b/gi },
  { label: 'wie gesagt', pattern: /\bwie\s+gesagt\b/gi },
]

const STRUCTURE_MARKERS = [
  /\bzuerst\b/i,
  /\berstens\b/i,
  /\bzweitens\b/i,
  /\bmein(?:e)?\s+(?:haupt)?aussage\b/i,
  /\bder\s+wichtigste\s+punkt\b/i,
  /\bzum\s+beispiel\b/i,
  /\bbeispielsweise\b/i,
  /\bdeshalb\b/i,
  /\bdaher\b/i,
  /\babschließend\b/i,
  /\bzusammenfassend\b/i,
  /\bnächste(?:r|n)?\s+schritt\b/i,
]

const EXAMPLE_MARKERS = [/\bzum\s+beispiel\b/i, /\bbeispielsweise\b/i, /\bkonkret\b/i, /\betwa\b/i]
const CTA_MARKERS = [/\bich\s+empfehle\b/i, /\bmein\s+vorschlag\b/i, /\bnächste(?:r|n)?\s+schritt\b/i, /\bwir\s+sollten\b/i, /\bdeshalb\s+sollten\b/i]

export const tokenizeSpeechText = (text = '') => normalize(text).split(/\s+/).filter(Boolean)

const countPatternGroup = (text, group) => group.map(({ label, pattern }) => ({
  label,
  count: (String(text).match(pattern) || []).length,
})).filter((item) => item.count > 0)

const repeatedPhrases = (words, size = 3) => {
  if (words.length < size * 2) return []
  const counts = new Map()
  for (let index = 0; index <= words.length - size; index += 1) {
    const slice = words.slice(index, index + size)
    if (slice.filter((word) => !STOP_WORDS.has(word)).length < 2) continue
    const phrase = slice.join(' ')
    counts.set(phrase, (counts.get(phrase) || 0) + 1)
  }
  return [...counts.entries()]
    .filter(([, count]) => count >= 2)
    .sort((left, right) => right[1] - left[1])
    .slice(0, 4)
    .map(([phrase, count]) => ({ phrase, count }))
}

const topKeywords = (text, maximum = 8) => {
  const counts = new Map()
  for (const word of tokenizeSpeechText(text)) {
    if (word.length < 4 || STOP_WORDS.has(word) || /^\d+$/.test(word)) continue
    counts.set(word, (counts.get(word) || 0) + 1)
  }
  return [...counts.entries()]
    .sort((left, right) => right[1] - left[1] || right[0].length - left[0].length)
    .slice(0, maximum)
    .map(([word]) => word)
}

export const analyseContentQuality = (text, { durationMs = 0 } = {}) => {
  const source = String(text || '').trim()
  const words = tokenizeSpeechText(source)
  const wordCount = words.length
  const minutes = durationMs > 0 ? Math.max(durationMs / 60000, 1 / 60) : 0
  const wpm = minutes ? Math.round(wordCount / minutes) : 0
  const hedgeDetails = countPatternGroup(source, HEDGES)
  const fillerDetails = countPatternGroup(source, FILLERS)
  const hedgeCount = hedgeDetails.reduce((sum, item) => sum + item.count, 0)
  const fillerCount = fillerDetails.reduce((sum, item) => sum + item.count, 0)
  const repeats = repeatedPhrases(words)
  const repeatedPhraseCount = repeats.reduce((sum, item) => sum + Math.max(0, item.count - 1), 0)
  const uniqueWordRatio = wordCount ? new Set(words).size / wordCount : 0
  const structureHits = STRUCTURE_MARKERS.filter((pattern) => pattern.test(source)).length
  const hasExample = EXAMPLE_MARKERS.some((pattern) => pattern.test(source))
  const hasCallToAction = CTA_MARKERS.some((pattern) => pattern.test(source))
  const hasNumber = /\b\d+(?:[.,]\d+)?\b/.test(source)

  const hedgeRate = wordCount ? hedgeCount / wordCount * 100 : 0
  const repeatRate = wordCount ? repeatedPhraseCount / Math.max(1, wordCount / 40) : 0
  const precision = clamp(Math.round(96 - hedgeRate * 12 - repeatRate * 7 - Math.max(0, fillerCount - 2) * 2.5), 25, 100)
  const structure = clamp(Math.round(48 + Math.min(32, structureHits * 8) + (hasExample ? 10 : 0) + (hasCallToAction ? 10 : 0)), 35, 100)
  const conciseness = clamp(Math.round(94 - hedgeRate * 10 - repeatRate * 9 - Math.max(0, 0.5 - uniqueWordRatio) * 55), 30, 100)
  const evidence = clamp(45 + (hasExample ? 25 : 0) + (hasNumber ? 15 : 0) + (structureHits >= 2 ? 10 : 0), 35, 100)
  const overall = Math.round(precision * 0.3 + structure * 0.3 + conciseness * 0.22 + evidence * 0.18)

  const strengths = []
  const improvements = []
  if (precision >= 78) strengths.push('Deine Formulierungen waren überwiegend direkt und präzise.')
  else improvements.push('Streiche Abschwächungen und formuliere Kernaussagen direkter.')
  if (structure >= 78) strengths.push('Deine Antwort enthält erkennbare Struktur- oder Übergangssignale.')
  else improvements.push('Nutze eine sichtbare Reihenfolge: Aussage → Begründung → Beispiel → Schluss.')
  if (hasExample) strengths.push('Du hast mindestens ein Beispiel oder eine konkrete Einordnung verwendet.')
  else improvements.push('Ergänze mindestens ein konkretes Beispiel statt nur allgemein zu argumentieren.')
  if (repeatedPhraseCount > 1) improvements.push('Mehrere Wortgruppen wiederholen sich. Kürze Dopplungen und führe den Gedanken weiter.')
  if (hasCallToAction) strengths.push('Dein Text enthält einen klaren Vorschlag oder nächsten Schritt.')

  return {
    overall,
    wordCount,
    wpm,
    precision,
    structure,
    conciseness,
    evidence,
    hedgeCount,
    hedgeDetails,
    fillerCount,
    fillerDetails,
    repeatedPhraseCount,
    repeatedPhrases: repeats,
    uniqueWordRatio: Number(uniqueWordRatio.toFixed(3)),
    hasExample,
    hasCallToAction,
    hasNumber,
    keywords: topKeywords(source),
    strengths: strengths.slice(0, 4),
    improvements: improvements.slice(0, 4),
  }
}

export const createBaselineProfile = (text, durationMs) => {
  const analysis = analyseContentQuality(text, { durationMs })
  const pace = analysis.wpm >= 105 && analysis.wpm <= 165 ? 92 : analysis.wpm >= 85 && analysis.wpm <= 185 ? 72 : 52
  const fillerControl = clamp(100 - analysis.fillerCount * 7, 30, 100)
  const clarity = Math.round(analysis.precision * 0.55 + analysis.conciseness * 0.45)
  const structure = analysis.structure
  const impact = Math.round(analysis.evidence * 0.55 + (analysis.hasCallToAction ? 90 : 58) * 0.45)
  const skills = { pace, fillerControl, clarity, structure, impact }
  const weakest = Object.entries(skills).sort((left, right) => left[1] - right[1]).slice(0, 2).map(([key, value]) => ({ key, value }))

  return {
    createdAt: new Date().toISOString(),
    durationMs,
    transcript: String(text || '').trim(),
    overall: Math.round(Object.values(skills).reduce((sum, value) => sum + value, 0) / Object.values(skills).length),
    skills,
    weakest,
    content: analysis,
  }
}

export const buildInterviewQuestions = (cvText, jobText) => {
  const cvKeywords = new Set(topKeywords(cvText, 12))
  const jobKeywords = topKeywords(jobText, 10)
  const missing = jobKeywords.filter((keyword) => !cvKeywords.has(keyword)).slice(0, 3)
  const shared = jobKeywords.filter((keyword) => cvKeywords.has(keyword)).slice(0, 3)
  const roleFocus = jobKeywords.slice(0, 2).join(' und ') || 'die wichtigsten Anforderungen der Stelle'
  const questions = [
    `Warum interessiert dich diese Stelle besonders – vor allem im Hinblick auf ${roleFocus}?`,
    shared.length
      ? `Dein Profil und die Stellenanzeige überschneiden sich bei ${shared.join(', ')}. Nenne dafür ein konkretes Beispiel aus deiner Erfahrung.`
      : 'Welche deiner bisherigen Erfahrungen passt am stärksten zu den Anforderungen dieser Stelle?',
    missing.length
      ? `Die Anzeige betont ${missing.join(', ')}. Wie gehst du damit um, wenn du darin noch nicht die meiste Erfahrung hast?`
      : 'Welche Anforderung der Stelle wäre für dich am anspruchsvollsten und wie würdest du sie angehen?',
    'Beschreibe eine Situation nach STAR: Aufgabe, dein konkretes Handeln und ein sichtbares Ergebnis.',
    'Nenne einen Fehler oder Rückschlag, den du selbst verantwortet hast, und was du danach konkret verändert hast.',
    'Warum sollten wir uns für dich entscheiden? Antworte in höchstens 60 Sekunden mit drei klaren Gründen.',
  ]
  return { questions, jobKeywords, sharedKeywords: shared, gapKeywords: missing }
}

export const buildPresentationQuestions = (notesText) => {
  const keywords = topKeywords(notesText, 6)
  const focus = keywords[0] || 'deiner Kernaussage'
  const secondary = keywords[1] || 'deinem vorgeschlagenen Nutzen'
  return {
    keywords,
    questions: [
      `Was ist die eine Aussage zu ${focus}, die dein Publikum nach der Präsentation behalten soll?`,
      `Welchen konkreten Nutzen hat ${secondary} für dein Publikum?`,
      `Welcher Beleg oder welches Beispiel stützt deine wichtigste Aussage am stärksten?`,
      'Was wäre der stärkste Einwand gegen deine Präsentation und wie antwortest du darauf?',
      'Was soll das Publikum unmittelbar nach deiner Präsentation tun oder entscheiden?',
    ],
    checklist: [
      'Einstieg erklärt Relevanz für das Publikum.',
      'Eine klare Kernaussage ist in einem Satz formulierbar.',
      'Mindestens ein Beispiel oder Beleg unterstützt die Aussage.',
      'Übergänge zwischen Hauptpunkten sind hörbar.',
      'Der Abschluss enthält einen konkreten nächsten Schritt.',
    ],
  }
}

export const QUICK_DRILLS = [
  { id: 'claim', title: 'Aussage in 30 Sekunden', duration: '3 Min.', instruction: 'Nenne eine klare Position, eine Begründung und genau ein Beispiel. Keine Einleitung.' },
  { id: 'pause', title: 'Füllwort-Stopp', duration: '4 Min.', instruction: 'Sprich langsam und ersetze jedes geplante Füllwort bewusst durch eine kurze stille Pause.' },
  { id: 'star', title: 'STAR kompakt', duration: '5 Min.', instruction: 'Erzähle eine Erfahrung mit Situation, Aufgabe, Handlung und Ergebnis. Dein eigener Anteil muss klar sein.' },
  { id: 'explain', title: 'Erklären ohne Fachsprache', duration: '4 Min.', instruction: 'Erkläre ein Fachthema so, dass ein zwölfjähriges Kind es versteht. Nutze eine Analogie.' },
  { id: 'pitch', title: '60-Sekunden-Pitch', duration: '5 Min.', instruction: 'Problem → Zielgruppe → Lösung → Nutzen → nächster Schritt. Bleibe unter einer Minute.' },
  { id: 'objection', title: 'Einwand behandeln', duration: '4 Min.', instruction: 'Formuliere zuerst den stärksten Einwand gegen deine eigene Position und beantworte ihn fair.' },
]
