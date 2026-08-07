const clamp = (value, minimum = 0, maximum = 100) => Math.min(maximum, Math.max(minimum, value))

const countWords = (text) => text.trim().split(/\s+/).filter(Boolean).length
const includesAny = (text, phrases) => phrases.some((phrase) => text.toLowerCase().includes(phrase))

const buildOfflineTeamTurn = ({ scenario, difficulty, round, totalRounds, conversation }) => {
  const latestAnswer = [...conversation].reverse().find((message) => message.role === 'user')?.text || ''
  const words = countWords(latestAnswer)
  const hasStructure = includesAny(latestAnswer, ['erstens', 'zweitens', 'zunächst', 'danach', 'abschließend', 'zum einen', 'zum anderen'])
  const hasExample = includesAny(latestAnswer, ['zum beispiel', 'beispielsweise', 'konkret', 'eine situation', 'in der praxis'])
  const hasReason = includesAny(latestAnswer, ['weil', 'deshalb', 'daher', 'dadurch', 'der grund', 'folglich'])
  const acknowledgesOthers = includesAny(latestAnswer, ['verstehe', 'einwand', 'punkt', 'stimme zu', 'sehe ich anders', 'berücksichtigen', 'interesse'])
  const hasDecision = includesAny(latestAnswer, ['ich schlage vor', 'mein vorschlag', 'nächster schritt', 'wir sollten', 'entscheidung', 'konkret machen'])
  const hedging = (latestAnswer.match(/\b(?:vielleicht|irgendwie|eigentlich|ich glaube|ich denke mal|eventuell)\b/gi) || []).length

  const clarity = clamp(56 + Math.min(words, 90) * 0.27 + (hasReason ? 11 : 0) - hedging * 4)
  const structure = clamp(50 + (hasStructure ? 22 : 0) + (hasExample ? 12 : 0) + (words >= 35 ? 8 : 0))
  const impact = clamp(52 + (hasDecision ? 18 : 0) + (hasReason ? 12 : 0) + (hasExample ? 8 : 0) - hedging * 3)
  const audienceManagement = clamp(48 + (acknowledgesOthers ? 24 : 0) + (hasDecision ? 12 : 0) + (words >= 25 ? 8 : 0))

  const participant = scenario.participants[(round - 1) % scenario.participants.length]
  const nextQuestions = [
    'Was ist aus deiner Sicht der wichtigste konkrete nächste Schritt und wer übernimmt ihn?',
    'Ich sehe dabei noch ein Risiko. Wie würdest du meinen Einwand berücksichtigen, ohne dein Ziel aufzugeben?',
    'Welche messbare oder überprüfbare Wirkung erwartest du von deinem Vorschlag?',
    'Was würdest du tun, wenn die Gruppe deinem bevorzugten Weg nicht vollständig zustimmt?',
    'Fasse deine Entscheidung und Begründung jetzt so zusammen, dass alle Beteiligten wissen, was als Nächstes passiert.',
  ]

  const feedback = !acknowledgesOthers
    ? 'Beziehe die Interessen oder Einwände der anderen Person sichtbar in deine Antwort ein.'
    : !hasDecision
      ? 'Formuliere den nächsten Schritt oder deine Entscheidung noch konkreter.'
      : !hasReason
        ? 'Begründe deutlicher, warum dein vorgeschlagener Weg sinnvoll ist.'
        : 'Du verbindest Gegenposition und eigenen Vorschlag bereits gut; halte die Kernaussage jetzt noch kompakter.'

  const isComplete = round >= totalRounds
  const pressurePrefix = difficulty.id === 'challenging'
    ? 'Ich brauche eine belastbarere Antwort. '
    : difficulty.id === 'supportive'
      ? 'Das ist eine gute Grundlage. '
      : ''

  return {
    speakerId: participant.id,
    speakerName: participant.name,
    speakerRole: participant.role,
    reply: isComplete
      ? 'Die Runde ist abgeschlossen. In der Auswertung siehst du, wie klar du mehrere Interessen gleichzeitig geführt hast.'
      : `${pressurePrefix}${nextQuestions[Math.min(round - 1, nextQuestions.length - 1)]}`,
    microFeedback: feedback,
    scores: {
      clarity: Math.round(clarity),
      structure: Math.round(structure),
      impact: Math.round(impact),
      audienceManagement: Math.round(audienceManagement),
    },
    isComplete,
    finalSummary: {
      overallScore: Math.round((clarity + structure + impact + audienceManagement) / 4),
      strengths: [
        acknowledgesOthers ? 'Du hast andere Interessen oder Einwände sichtbar berücksichtigt.' : 'Du bist auf die Gruppensituation eingegangen.',
        hasDecision ? 'Du hast einen konkreten nächsten Schritt formuliert.' : 'Du hast deine Position in der Runde vertreten.',
      ],
      improvements: [
        !acknowledgesOthers ? 'Greife Gegenpositionen ausdrücklich auf, bevor du deinen Vorschlag verteidigst.' : 'Halte die Reaktion auf Einwände noch kompakter.',
        !hasDecision ? 'Beende wichtige Beiträge mit einer konkreten Entscheidung oder Bitte.' : 'Verbinde Entscheidung und Begründung noch direkter.',
      ],
    },
    source: 'offline',
  }
}

const offlineWithDiagnostics = (payload, diagnostics = {}) => ({
  ...buildOfflineTeamTurn(payload),
  fallbackReason: diagnostics.fallbackReason || 'network',
  requestId: diagnostics.requestId || null,
  retryAfterSeconds: diagnostics.retryAfterSeconds || null,
})

export const requestTeamCoachTurn = async (payload) => {
  try {
    const response = await fetch('/api/team-coach', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        scenario: {
          id: payload.scenario.id,
          title: payload.scenario.title,
          description: payload.scenario.description,
        },
        difficulty: payload.difficulty,
        topic: payload.topic,
        round: payload.round,
        totalRounds: payload.totalRounds,
        conversation: payload.conversation.slice(-14).map((message) => ({
          role: message.role,
          text: message.text,
          speakerId: message.speakerId || null,
        })),
      }),
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

    if (!result?.reply || !result?.scores || !result?.speakerId) return offlineWithDiagnostics(payload, { fallbackReason: 'invalid-response', requestId })
    return { ...result, source: 'ai', requestId }
  } catch {
    return offlineWithDiagnostics(payload, { fallbackReason: 'network' })
  }
}
