const clamp = (value, minimum = 0, maximum = 100) => Math.min(maximum, Math.max(minimum, value))

const average = (values) => {
  if (!values.length) return 0
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

const percentile = (values, ratio) => {
  if (!values.length) return 0
  const sorted = [...values].sort((left, right) => left - right)
  const index = Math.min(sorted.length - 1, Math.max(0, Math.round((sorted.length - 1) * ratio)))
  return sorted[index]
}

const standardDeviation = (values) => {
  if (values.length < 2) return 0
  const mean = average(values)
  return Math.sqrt(average(values.map((value) => (value - mean) ** 2)))
}

const smoothValues = (values, radius = 2) => values.map((_, index) => {
  const start = Math.max(0, index - radius)
  const end = Math.min(values.length, index + radius + 1)
  return average(values.slice(start, end))
})

const compressTimeline = (samples, maximumBars = 120) => {
  if (samples.length <= maximumBars) return samples
  const bucketSize = Math.ceil(samples.length / maximumBars)
  const compressed = []

  for (let index = 0; index < samples.length; index += bucketSize) {
    const bucket = samples.slice(index, index + bucketSize)
    compressed.push({
      timeMs: bucket[0]?.timeMs || 0,
      value: Math.max(...bucket.map((sample) => sample.value)),
      speaking: bucket.some((sample) => sample.speaking),
    })
  }
  return compressed
}

const buildPauses = (samples, threshold, minimumPauseMs = 450) => {
  if (!samples.length) return []
  const firstSpeech = samples.findIndex((sample) => sample.value >= threshold)
  let lastSpeech = -1
  for (let index = samples.length - 1; index >= 0; index -= 1) {
    if (samples[index].value >= threshold) {
      lastSpeech = index
      break
    }
  }
  if (firstSpeech < 0 || lastSpeech <= firstSpeech) return []

  const pauses = []
  let pauseStart = null

  for (let index = firstSpeech; index <= lastSpeech; index += 1) {
    const sample = samples[index]
    const silent = sample.value < threshold
    if (silent && pauseStart === null) pauseStart = sample.timeMs

    if (!silent && pauseStart !== null) {
      const durationMs = sample.timeMs - pauseStart
      if (durationMs >= minimumPauseMs) {
        pauses.push({
          startMs: pauseStart,
          endMs: sample.timeMs,
          durationMs,
          severity: durationMs >= 2200 ? 'long' : durationMs >= 1200 ? 'medium' : 'short',
        })
      }
      pauseStart = null
    }
  }

  return pauses
}

const scoreEnergy = (averageLevel) => {
  if (averageLevel <= 0.015) return 35
  if (averageLevel >= 0.035 && averageLevel <= 0.12) return 92
  if (averageLevel > 0.12) return clamp(92 - (averageLevel - 0.12) * 180, 55, 92)
  return clamp(35 + ((averageLevel - 0.015) / 0.02) * 57, 35, 92)
}

const scoreDynamics = (dynamicRange, deviation) => {
  const rangeScore = clamp((dynamicRange / 0.08) * 100, 35, 100)
  const deviationScore = clamp((deviation / 0.04) * 100, 35, 100)
  return Math.round(rangeScore * 0.65 + deviationScore * 0.35)
}

const scorePauses = (pauses, durationMs, longestPauseMs) => {
  const minutes = Math.max(durationMs / 60000, 0.25)
  const pausesPerMinute = pauses.length / minutes
  let score = 92
  if (pausesPerMinute < 0.8) score -= 18
  if (pausesPerMinute > 8) score -= Math.min(38, (pausesPerMinute - 8) * 4)
  if (longestPauseMs > 3500) score -= 24
  else if (longestPauseMs > 2200) score -= 12
  return clamp(Math.round(score), 30, 100)
}

const scoreFlow = (activeSpeechRatio) => {
  if (activeSpeechRatio >= 0.58 && activeSpeechRatio <= 0.9) return 94
  if (activeSpeechRatio < 0.58) return clamp(94 - (0.58 - activeSpeechRatio) * 150, 35, 94)
  return clamp(94 - (activeSpeechRatio - 0.9) * 180, 55, 94)
}

export const calculateRms = (timeDomainData) => {
  if (!timeDomainData?.length) return 0
  let sum = 0
  for (const value of timeDomainData) {
    const normalized = (value - 128) / 128
    sum += normalized * normalized
  }
  return Math.sqrt(sum / timeDomainData.length)
}

export const analyseAudioSamples = (rawSamples, durationMs) => {
  const validSamples = rawSamples
    .filter((sample) => Number.isFinite(sample.value) && Number.isFinite(sample.timeMs))
    .map((sample) => ({ timeMs: sample.timeMs, value: clamp(sample.value, 0, 1) }))

  if (!validSamples.length) {
    return {
      score: 0,
      averageLevel: 0,
      peakLevel: 0,
      dynamicRange: 0,
      activeSpeechRatio: 0,
      pauses: [],
      pauseCount: 0,
      longestPauseMs: 0,
      averagePauseMs: 0,
      timeline: [],
      scores: { energy: 0, dynamics: 0, pauses: 0, flow: 0 },
      strengths: [],
      improvements: ['Es konnten keine verwertbaren Audiodaten analysiert werden.'],
    }
  }

  const smoothed = smoothValues(validSamples.map((sample) => sample.value))
  const values = smoothed.filter((value) => Number.isFinite(value))
  const noiseFloor = percentile(values, 0.18)
  const speechReference = percentile(values, 0.84)
  const threshold = clamp(Math.max(noiseFloor * 2.15, speechReference * 0.16, 0.012), 0.012, 0.075)

  const samples = validSamples.map((sample, index) => ({
    ...sample,
    value: smoothed[index],
    speaking: smoothed[index] >= threshold,
  }))
  const activeValues = samples.filter((sample) => sample.speaking).map((sample) => sample.value)
  const pauses = buildPauses(samples, threshold)
  const longestPauseMs = pauses.length ? Math.max(...pauses.map((pause) => pause.durationMs)) : 0
  const averagePauseMs = pauses.length ? Math.round(average(pauses.map((pause) => pause.durationMs))) : 0
  const averageLevel = average(activeValues)
  const peakLevel = percentile(activeValues, 0.98)
  const dynamicRange = Math.max(0, percentile(activeValues, 0.9) - percentile(activeValues, 0.2))
  const deviation = standardDeviation(activeValues)
  const activeSpeechRatio = samples.length ? activeValues.length / samples.length : 0

  const scores = {
    energy: Math.round(scoreEnergy(averageLevel)),
    dynamics: scoreDynamics(dynamicRange, deviation),
    pauses: scorePauses(pauses, durationMs, longestPauseMs),
    flow: Math.round(scoreFlow(activeSpeechRatio)),
  }
  const score = Math.round(
    scores.energy * 0.25
    + scores.dynamics * 0.25
    + scores.pauses * 0.25
    + scores.flow * 0.25,
  )

  const strengths = []
  const improvements = []

  if (scores.energy >= 78) strengths.push('Deine Stimme hatte eine gut erkennbare Grundenergie.')
  else improvements.push('Sprich näher am Mikrofon und stütze deine Stimme etwas kräftiger, ohne zu pressen.')

  if (scores.dynamics >= 76) strengths.push('Deine Lautstärke variierte und wirkte dadurch lebendiger.')
  else improvements.push('Betone Schlüsselwörter deutlicher und variiere die Lautstärke zwischen Haupt- und Nebenaussagen.')

  if (scores.pauses >= 76) strengths.push('Deine Pausen lagen insgesamt in einem ausgewogenen Bereich.')
  else if (longestPauseMs > 2200) improvements.push(`Deine längste Pause dauerte ${(longestPauseMs / 1000).toFixed(1)} Sekunden. Bereite den nächsten Satz früher vor.`)
  else improvements.push('Setze nach Kernaussagen bewusst kurze Wirkungspausen statt durchgehend zu sprechen.')

  if (activeSpeechRatio > 0.9) improvements.push('Der Redeanteil war sehr dicht. Mehr kurze Pausen können die Verständlichkeit erhöhen.')
  else if (activeSpeechRatio < 0.5) improvements.push('Es gab viele stille Abschnitte. Formuliere deine nächsten Gedanken kompakter vor.')
  else strengths.push('Dein Verhältnis aus Sprechen und kurzen Ruhephasen war ausgewogen.')

  const maximumLevel = Math.max(peakLevel, 0.045)
  const timeline = compressTimeline(samples.map((sample) => ({
    ...sample,
    value: clamp(sample.value / maximumLevel, 0.03, 1),
  })))

  return {
    score,
    threshold,
    averageLevel,
    peakLevel,
    dynamicRange,
    activeSpeechRatio,
    pauses,
    pauseCount: pauses.length,
    longestPauseMs,
    averagePauseMs,
    timeline,
    scores,
    strengths: strengths.slice(0, 3),
    improvements: improvements.slice(0, 3),
  }
}

export const formatMilliseconds = (milliseconds) => {
  const totalSeconds = Math.max(0, Math.round(milliseconds / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}
