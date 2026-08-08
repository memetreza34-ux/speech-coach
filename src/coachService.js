const clamp = (value, minimum = 0, maximum = 100) => Math.min(maximum, Math.max(minimum, value))

const countWords = (text) => text.trim().split(/\s+/).filter(Boolean).length

const includesAny = (text, phrases) => phrases.some((phrase) => text.toLowerCase().includes(phrase))

const buildOfflineCoachTurn = ({ mode, difficulty, round, totalRounds, conversation }) => {
  const latestAnswer = [...conversation].reverse().find((message) => message.role === 'user')?.text || ''
  const words = countWords(latestAnswer)
  const hasStructure = includesAny(latestAnswer, ['erstens', 'zweitens', 'zunächst', 'danach', 'abschließend', 'zum einen', 'zum anderen'])
  const hasExample = includesAny(latestAnswer, ['zum beispiel', 'beispielsweise', 'eine situation', 'konkret', 'damals', 'in meinem'])
  const hasReason = includesAny(latestAnswer, ['weil', 'deshalb', 'daher', 'dadurch', 'der grund', 'folglich'])
  const hedging = (latestAnswer.match(/\b(?:vielleicht|irgendwie|eigentlich|ich glaube|ich denke mal|eventuell)\b/gi) || []).length

  const clarity = clamp(58 + Math.min(words, 80) * 0.28 + (hasReason ? 12 : 0) - hedging * 4)
  const structure = clamp(52 + (hasStructure ? 24 : 0) + (hasExample ? 14 : 0) + (words >= 30 ? 8 : 0))
  const impact = clamp(55 + (hasExample ? 18 : 0) + (hasReason ? 13 : 0) - hedging * 3)

  const feedback = []
  if (words < 20) feedback.push('Deine Antwort war sehr kurz. Ergänze eine klare Begründung und ein konkretes Beispiel.')
  if (!hasReason) feedback.push('Mache deine Begründung sichtbar, zum Beispiel mit „weil“, „dadurch“ oder „der wichtigste Grund ist“.')
  if (!hasExample) feedback.push('Ein konkretes Beispiel würde deine Aussage glaubwürdiger und verständlicher machen.')
  if (hasStructure) feedback.push('Deine sprachliche Struktur war gut erkennbar.')
  if (hasExample) feedback.push('Das konkrete Beispiel hat deiner Antwort Substanz gegeben.')
  if (hedging > 1) feedback.push('Reduziere vorsichtige Formulierungen und sprich deine Kernaussage direkter aus.')

  const nextQuestion = mode.followUps[Math.min(round - 1, mode.followUps.length - 1)]
  const pressurePrefix = difficulty.id === 'challenging'
    ? 'Ich bin noch nicht überzeugt. '
    : difficulty.id === 'supportive'
      ? 'Gute Grundlage. '
      : ''
  const isComplete = round >= totalRounds

  return {
    reply: isComplete
      ? 'Die Simulation ist abgeschlossen. Öffne jetzt die Auswertung und vergleiche deine stärksten und schwächsten Stellen.'
      : `${pressurePrefix}${nextQuestion}`,
    microFeedback: feedback[0] || 'Deine Antwort war verständlich. Im nächsten Schritt solltest du deine Kernaussage noch präziser formulieren.',
    scores: {
      clarity: Math.round(clarity),
      structure: Math.round(structure),
      impact: Math.round(impact),
    },
    isComplete,
    finalSummary: {
      overallScore: Math.round((clarity + structure + impact) / 3),
      strengths: [
        hasStructure ? 'Du hast erkennbare sprachliche Übergänge verwendet.' : 'Du bist auf die gestellte Situation eingegangen.',
        hasExample ? 'Du hast deine Aussage mit einem Beispiel gestützt.' : 'Du hast die Simulation konsequent fortgeführt.',
      ],
      improvements: [
        !hasReason ? 'Begründe deine Kernaussage früher und eindeutiger.' : 'Formuliere deine Kernaussage noch kompakter.',
        !hasExample ? 'Nutze mindestens ein konkretes Beispiel.' : 'Verbinde Beispiel und Schlussfolgerung deutlicher.',
      ],
    },
    source: 'offline',
  }
}

const offlineWithDiagnostics = (payload, diagnostics = {}) => ({
  ...buildOfflineCoachTurn(payload),
  fallbackReason: diagnostics.fallbackReason || 'network',
  requestId: diagnostics.requestId || null,
  retryAfterSeconds: diagnostics.retryAfterSeconds || null,
})

export const requestCoachTurn = async (payload, { signal } = {}) => {
  try {
    const response = await fetch('/api/coach', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mode: {
          id: payload.mode.id,
          title: payload.mode.title,
          description: payload.mode.description,
          persona: payload.mode.persona,
        },
        difficulty: payload.difficulty,
        topic: payload.topic,
        round: payload.round,
        totalRounds: payload.totalRounds,
        conversation: payload.conversation.slice(-10),
      }),
      signal,
    })

    const result = await response.json().catch(() => ({}))
    const requestId = response.headers.get('x-request-id') || result?.requestId || null
    if (!response.ok) {
      return offlineWithDiagnostics(payload, {
        fallbackReason: response.status === 429 ? 'rate-limited' : 'server-error',
        requestId,
        retryAfterSeconds: Number(response.headers.get('retry-after')) || null,
      })
    }

    if (!result?.reply || !result?.scores) return offlineWithDiagnostics(payload, { fallbackReason: 'invalid-response', requestId })
    return { ...result, source: 'ai', requestId }
  } catch (error) {
    if (error?.name === 'AbortError') throw error
    return offlineWithDiagnostics(payload, { fallbackReason: 'network' })
  }
}
