const clamp = (value, minimum = 0, maximum = 100) => Math.min(maximum, Math.max(minimum, value))

const average = (values) => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0

const percentile = (values, ratio) => {
  if (!values.length) return 0
  const sorted = [...values].sort((left, right) => left - right)
  const index = Math.max(0, Math.min(sorted.length - 1, Math.round((sorted.length - 1) * ratio)))
  return sorted[index]
}

const deviation = (values) => {
  if (values.length < 2) return 0
  const mean = average(values)
  return Math.sqrt(average(values.map((value) => (value - mean) ** 2)))
}

const hzToSemitone = (hz, reference = 110) => 12 * Math.log2(hz / reference)
const semitoneToHz = (semitone, reference = 110) => reference * (2 ** (semitone / 12))
const semitoneDistance = (leftHz, rightHz) => Math.abs(12 * Math.log2(leftHz / rightHz))

const downsample = (samples, sourceRate, targetRate = 8000) => {
  if (sourceRate <= targetRate) return { samples, sampleRate: sourceRate }
  const ratio = sourceRate / targetRate
  const outputLength = Math.floor(samples.length / ratio)
  const output = new Float32Array(outputLength)

  for (let index = 0; index < outputLength; index += 1) {
    const start = Math.floor(index * ratio)
    const end = Math.min(samples.length, Math.floor((index + 1) * ratio))
    let sum = 0
    for (let cursor = start; cursor < end; cursor += 1) sum += samples[cursor]
    output[index] = sum / Math.max(1, end - start)
  }

  return { samples: output, sampleRate: targetRate }
}

const mixToMono = (buffer) => {
  const mono = new Float32Array(buffer.length)
  for (let channel = 0; channel < buffer.numberOfChannels; channel += 1) {
    const source = buffer.getChannelData(channel)
    for (let index = 0; index < source.length; index += 1) mono[index] += source[index] / buffer.numberOfChannels
  }
  return mono
}

const frameRms = (samples, start, length) => {
  let sum = 0
  const end = Math.min(samples.length, start + length)
  for (let index = start; index < end; index += 1) sum += samples[index] * samples[index]
  return Math.sqrt(sum / Math.max(1, end - start))
}

const normalizedCorrelation = (frame, lag) => {
  let product = 0
  let leftEnergy = 0
  let rightEnergy = 0
  for (let index = lag; index < frame.length; index += 2) {
    const left = frame[index]
    const right = frame[index - lag]
    product += left * right
    leftEnergy += left * left
    rightEnergy += right * right
  }
  if (leftEnergy <= 1e-8 || rightEnergy <= 1e-8) return 0
  return product / Math.sqrt(leftEnergy * rightEnergy)
}

const estimatePitch = (frame, sampleRate) => {
  const minimumHz = 65
  const maximumHz = 420
  const minimumLag = Math.max(2, Math.floor(sampleRate / maximumHz))
  const maximumLag = Math.min(frame.length - 2, Math.ceil(sampleRate / minimumHz))
  let bestLag = 0
  let bestCorrelation = 0
  const correlations = new Map()

  for (let lag = minimumLag; lag <= maximumLag; lag += 1) {
    const correlation = normalizedCorrelation(frame, lag)
    correlations.set(lag, correlation)
    if (correlation > bestCorrelation) {
      bestCorrelation = correlation
      bestLag = lag
    }
  }

  if (!bestLag || bestCorrelation < 0.56) return null
  const previous = correlations.get(bestLag - 1) ?? bestCorrelation
  const next = correlations.get(bestLag + 1) ?? bestCorrelation
  const denominator = previous - (2 * bestCorrelation) + next
  const offset = Math.abs(denominator) > 1e-6 ? 0.5 * (previous - next) / denominator : 0
  const refinedLag = bestLag + clamp(offset, -0.5, 0.5)
  const hz = sampleRate / refinedLag

  if (!Number.isFinite(hz) || hz < minimumHz || hz > maximumHz) return null
  return { hz, confidence: bestCorrelation }
}

const compressPitchTimeline = (points, maximum = 120) => {
  if (points.length <= maximum) return points
  const bucketSize = Math.ceil(points.length / maximum)
  const compressed = []
  for (let index = 0; index < points.length; index += bucketSize) {
    const bucket = points.slice(index, index + bucketSize)
    compressed.push({
      timeMs: Math.round(average(bucket.map((point) => point.timeMs))),
      hz: Math.round(average(bucket.map((point) => point.hz))),
      semitone: average(bucket.map((point) => point.semitone)),
      confidence: average(bucket.map((point) => point.confidence)),
    })
  }
  return compressed
}

const medianWindow = (values, radius = 2) => values.map((value, index) => {
  const window = values.slice(Math.max(0, index - radius), Math.min(values.length, index + radius + 1))
  return window.length ? percentile(window, 0.5) : value
})

const correctIsolatedOctaveJumps = (points) => {
  if (points.length < 3) return points.map((point) => ({ ...point, octaveCorrected: false }))

  return points.map((point, index) => {
    if (index === 0 || index === points.length - 1) return { ...point, octaveCorrected: false }
    const previous = points[index - 1]
    const next = points[index + 1]
    if (semitoneDistance(previous.hz, next.hz) > 3.5) return { ...point, octaveCorrected: false }

    const localReference = Math.sqrt(previous.hz * next.hz)
    const originalDistance = semitoneDistance(point.hz, localReference)
    if (originalDistance < 7) return { ...point, octaveCorrected: false }

    const candidates = [point.hz * 0.5, point.hz * 2]
      .filter((hz) => hz >= 65 && hz <= 420)
      .map((hz) => ({ hz, distance: semitoneDistance(hz, localReference) }))
      .sort((left, right) => left.distance - right.distance)
    const best = candidates[0]

    if (!best || best.distance > 3.5 || originalDistance - best.distance < 6) {
      return { ...point, octaveCorrected: false }
    }

    return { ...point, hz: best.hz, octaveCorrected: true }
  })
}

export const stabilizePitchPoints = (points) => {
  const valid = (Array.isArray(points) ? points : [])
    .filter((point) => Number.isFinite(point?.hz) && point.hz >= 65 && point.hz <= 420)
    .map((point) => ({
      timeMs: Number(point.timeMs) || 0,
      hz: Number(point.hz),
      confidence: clamp(Number(point.confidence) || 0, 0, 1),
    }))

  if (!valid.length) return []

  const corrected = correctIsolatedOctaveJumps(valid)
  const referenceHz = percentile(corrected.map((point) => point.hz), 0.5)
  const rawSemitones = corrected.map((point) => hzToSemitone(point.hz, referenceHz))
  const smoothedSemitones = medianWindow(rawSemitones, 2)

  return corrected.map((point, index) => ({
    ...point,
    hz: semitoneToHz(smoothedSemitones[index], referenceHz),
    semitone: smoothedSemitones[index],
  }))
}

const countDirectionChanges = (values) => {
  let previousDirection = 0
  let changes = 0
  for (let index = 1; index < values.length; index += 1) {
    const difference = values[index] - values[index - 1]
    if (Math.abs(difference) < 0.55) continue
    const direction = Math.sign(difference)
    if (previousDirection && direction !== previousDirection) changes += 1
    previousDirection = direction
  }
  return changes
}

const scoreIntonation = (rangeSemitones, variationSemitones) => {
  const rangeScore = rangeSemitones < 2
    ? 38 + rangeSemitones * 18
    : rangeSemitones <= 10
      ? 84 + Math.min(12, (rangeSemitones - 2) * 1.5)
      : clamp(96 - (rangeSemitones - 10) * 3.5, 55, 96)
  const variationScore = variationSemitones < 0.7
    ? 40 + variationSemitones * 45
    : variationSemitones <= 3.5
      ? 86 + Math.min(10, (variationSemitones - 0.7) * 3.5)
      : clamp(96 - (variationSemitones - 3.5) * 5, 55, 96)
  return Math.round(rangeScore * 0.62 + variationScore * 0.38)
}

const scoreMelody = (directionChanges, durationMs, variationSemitones) => {
  const minutes = Math.max(durationMs / 60000, 0.25)
  const changesPerMinute = directionChanges / minutes
  const movementScore = changesPerMinute < 4
    ? clamp(42 + changesPerMinute * 10, 42, 82)
    : changesPerMinute <= 22
      ? clamp(82 + (changesPerMinute - 4) * 0.75, 82, 96)
      : clamp(96 - (changesPerMinute - 22) * 1.6, 58, 96)
  const variationScore = clamp(45 + variationSemitones * 20, 45, 96)
  return Math.round(movementScore * 0.6 + variationScore * 0.4)
}

const pitchQualityLabel = (confidence) => confidence >= 75 ? 'high' : confidence >= 55 ? 'medium' : 'low'

export const summarizePitchPoints = (rawPoints, { durationMs = 0, totalFrameCount = 0 } = {}) => {
  if (!Array.isArray(rawPoints) || rawPoints.length < 5) return {
    available: false,
    reason: 'Zu wenig stabile stimmhafte Abschnitte für eine Tonhöhenanalyse.',
    timeline: [],
    scores: { intonation: 0, melody: 0 },
    analysisConfidence: 0,
    voicedFrameRatio: 0,
    quality: 'low',
  }

  const stablePoints = stabilizePitchPoints(rawPoints)
  if (stablePoints.length < 5) return {
    available: false,
    reason: 'Das Tonhöhensignal war für eine stabile Auswertung zu unklar.',
    timeline: [],
    scores: { intonation: 0, melody: 0 },
    analysisConfidence: 0,
    voicedFrameRatio: 0,
    quality: 'low',
  }

  const frequencies = stablePoints.map((point) => point.hz)
  const medianPitchHz = percentile(frequencies, 0.5)
  const lowPitchHz = percentile(frequencies, 0.1)
  const highPitchHz = percentile(frequencies, 0.9)
  const semitones = stablePoints.map((point) => hzToSemitone(point.hz, medianPitchHz))
  const pitchRangeSemitones = highPitchHz > lowPitchHz ? 12 * Math.log2(highPitchHz / lowPitchHz) : 0
  const pitchVariationSemitones = deviation(semitones)
  const directionChanges = countDirectionChanges(semitones)
  const averageConfidence = average(rawPoints.map((point) => Number(point.confidence) || 0))
  const voicedFrameRatio = totalFrameCount > 0 ? clamp(rawPoints.length / totalFrameCount, 0, 1) : 1
  const octaveCorrectionCount = stablePoints.filter((point) => point.octaveCorrected).length
  const correlationQuality = clamp(((averageConfidence - 0.56) / 0.28) * 100, 0, 100)
  const coverageQuality = clamp((voicedFrameRatio / 0.35) * 100, 0, 100)
  const correctionPenalty = clamp((octaveCorrectionCount / stablePoints.length) * 100 * 1.5, 0, 25)
  const analysisConfidence = clamp(Math.round((correlationQuality * 0.72) + (coverageQuality * 0.28) - correctionPenalty), 0, 100)
  const scores = {
    intonation: scoreIntonation(pitchRangeSemitones, pitchVariationSemitones),
    melody: scoreMelody(directionChanges, durationMs, pitchVariationSemitones),
  }
  const monotonyRisk = clamp(Math.round(100 - ((scores.intonation * 0.6) + (scores.melody * 0.4))), 0, 100)
  const timeline = compressPitchTimeline(stablePoints.map((point, index) => ({
    timeMs: point.timeMs,
    hz: Math.round(point.hz),
    semitone: semitones[index],
    confidence: point.confidence,
  })))

  const strengths = []
  const improvements = []
  if (scores.intonation >= 78) strengths.push('Deine Tonhöhe variierte deutlich genug, um Kernaussagen stimmlich zu markieren.')
  else improvements.push('Variiere die Tonhöhe stärker zwischen Kernaussagen und Erläuterungen, statt auf einer ähnlichen Lage zu bleiben.')
  if (scores.melody >= 76) strengths.push('Deine Sprechmelodie zeigte erkennbare Auf- und Abbewegungen.')
  else improvements.push('Setze hörbare Tonhöhenbewegungen gezielter an Satzanfängen, Schlüsselwörtern und Abschlüssen ein.')
  if (pitchRangeSemitones > 14) improvements.push('Der Tonhöhenumfang war sehr groß. Nutze starke Ausschläge gezielter, damit die Wirkung kontrolliert bleibt.')
  if (analysisConfidence < 55) improvements.push('Die Tonhöhenerkennung war nur begrenzt stabil. Wiederhole die Aufnahme möglichst näher am Mikrofon und mit weniger Hintergrundgeräuschen.')

  return {
    available: true,
    medianPitchHz: Math.round(medianPitchHz),
    lowPitchHz: Math.round(lowPitchHz),
    highPitchHz: Math.round(highPitchHz),
    pitchRangeSemitones: Number(pitchRangeSemitones.toFixed(1)),
    pitchVariationSemitones: Number(pitchVariationSemitones.toFixed(2)),
    directionChanges,
    voicedFrameCount: rawPoints.length,
    voicedFrameRatio: Number(voicedFrameRatio.toFixed(3)),
    averageConfidence: Number(averageConfidence.toFixed(3)),
    analysisConfidence,
    quality: pitchQualityLabel(analysisConfidence),
    octaveCorrectionCount,
    monotonyRisk,
    timeline,
    scores,
    strengths: strengths.slice(0, 2),
    improvements: improvements.slice(0, 2),
  }
}

export const analysePitchFromBlob = async (blob) => {
  if (!blob?.size) return null
  const Context = window.AudioContext || window.webkitAudioContext
  if (!Context) return null
  const context = new Context()

  try {
    const sourceBuffer = await blob.arrayBuffer()
    const decoded = await context.decodeAudioData(sourceBuffer.slice(0))
    const mono = mixToMono(decoded)
    const reduced = downsample(mono, decoded.sampleRate)
    const frameSize = Math.max(320, Math.round(reduced.sampleRate * 0.08))
    const hopSize = Math.max(160, Math.round(reduced.sampleRate * 0.04))
    const rmsValues = []

    for (let start = 0; start + frameSize <= reduced.samples.length; start += hopSize) {
      rmsValues.push(frameRms(reduced.samples, start, frameSize))
    }

    const energyReference = percentile(rmsValues, 0.85)
    const voicedThreshold = Math.max(0.006, energyReference * 0.13)
    const rawPoints = []

    for (let frameIndex = 0, start = 0; start + frameSize <= reduced.samples.length; frameIndex += 1, start += hopSize) {
      if ((rmsValues[frameIndex] || 0) < voicedThreshold) continue
      const frame = reduced.samples.subarray(start, start + frameSize)
      const pitch = estimatePitch(frame, reduced.sampleRate)
      if (!pitch) continue
      rawPoints.push({
        timeMs: Math.round((start / reduced.sampleRate) * 1000),
        hz: pitch.hz,
        confidence: pitch.confidence,
      })
    }

    return summarizePitchPoints(rawPoints, {
      durationMs: decoded.duration * 1000,
      totalFrameCount: rmsValues.length,
    })
  } catch {
    return null
  } finally {
    if (context.state !== 'closed') await context.close().catch(() => {})
  }
}

export const combineAudioAndPitchAnalysis = (audioAnalysis, pitchAnalysis) => {
  if (!pitchAnalysis?.available) return { ...audioAnalysis, pitch: pitchAnalysis || null }

  const loudnessDynamics = Number(audioAnalysis.scores?.dynamics) || 0
  const confidenceWeight = clamp((pitchAnalysis.analysisConfidence || 50) / 100, 0.45, 1)
  const pitchDynamics = Math.round(
    pitchAnalysis.scores.intonation * 0.64
    + pitchAnalysis.scores.melody * 0.36,
  )
  const voiceDynamics = Math.round(
    loudnessDynamics * (1 - (0.55 * confidenceWeight))
    + pitchDynamics * (0.55 * confidenceWeight),
  )
  const scores = {
    ...audioAnalysis.scores,
    loudnessDynamics,
    dynamics: voiceDynamics,
    intonation: pitchAnalysis.scores.intonation,
    melody: pitchAnalysis.scores.melody,
  }
  const pitchContribution = 0.22 * confidenceWeight
  const baseContribution = 1 - pitchContribution
  const baseScore = Math.round(
    scores.energy * 0.23
    + loudnessDynamics * 0.27
    + scores.pauses * 0.23
    + scores.flow * 0.27,
  )
  const pitchScore = Math.round(scores.intonation * 0.55 + scores.melody * 0.45)
  const score = Math.round((baseScore * baseContribution) + (pitchScore * pitchContribution))

  return {
    ...audioAnalysis,
    score,
    scores,
    pitch: pitchAnalysis,
    strengths: [...audioAnalysis.strengths, ...(pitchAnalysis.strengths || [])].slice(0, 4),
    improvements: [...audioAnalysis.improvements, ...(pitchAnalysis.improvements || [])].slice(0, 4),
  }
}
