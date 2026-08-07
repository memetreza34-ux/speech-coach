import { guardApiRequest } from './_security.js'

const MAX_AUDIO_BYTES = 3 * 1024 * 1024
const MAX_REQUEST_BYTES = Math.ceil(MAX_AUDIO_BYTES * 4 / 3) + 16 * 1024
const ALLOWED_MIME_TYPES = new Map([
  ['audio/webm', 'speech.webm'],
  ['audio/webm;codecs=opus', 'speech.webm'],
  ['audio/mp4', 'speech.m4a'],
  ['audio/m4a', 'speech.m4a'],
  ['audio/ogg', 'speech.ogg'],
  ['audio/ogg;codecs=opus', 'speech.ogg'],
  ['audio/wav', 'speech.wav'],
  ['audio/x-wav', 'speech.wav'],
  ['audio/mpeg', 'speech.mp3'],
])

const parseBody = (body) => {
  if (typeof body === 'string') return JSON.parse(body)
  return body || {}
}

const normalizeMimeType = (value) => String(value || '').toLowerCase().trim()

const normalizeWords = (words) => Array.isArray(words)
  ? words
    .filter((item) => item && typeof item.word === 'string' && Number.isFinite(Number(item.start)) && Number.isFinite(Number(item.end)))
    .slice(0, 4000)
    .map((item) => ({
      word: item.word,
      start: Number(item.start),
      end: Number(item.end),
    }))
  : []

export default async function handler(request, response) {
  const guard = guardApiRequest(request, response, {
    scope: 'transcribe',
    maxBodyBytes: MAX_REQUEST_BYTES,
    rateLimit: 6,
  })
  if (!guard.ok) return
  const { requestId } = guard

  if (!process.env.OPENAI_API_KEY) {
    return response.status(503).json({ error: 'Präzisionstranskription ist serverseitig nicht konfiguriert.', requestId })
  }

  let payload
  try {
    payload = parseBody(request.body)
  } catch {
    return response.status(400).json({ error: 'Ungültige Anfrage.', requestId })
  }

  const mimeType = normalizeMimeType(payload.mimeType)
  const fileName = ALLOWED_MIME_TYPES.get(mimeType)
  if (!fileName) return response.status(400).json({ error: 'Dieses Audioformat wird nicht unterstützt.', requestId })
  if (typeof payload.audioBase64 !== 'string' || !payload.audioBase64.length) {
    return response.status(400).json({ error: 'Keine Audiodaten übermittelt.', requestId })
  }
  if (payload.audioBase64.length > Math.ceil(MAX_AUDIO_BYTES * 4 / 3) + 64) {
    return response.status(413).json({ error: 'Die Aufnahme ist für diesen Transkriptionsweg zu groß.', requestId })
  }

  let audioBuffer
  try {
    audioBuffer = Buffer.from(payload.audioBase64, 'base64')
  } catch {
    return response.status(400).json({ error: 'Audiodaten konnten nicht gelesen werden.', requestId })
  }
  if (!audioBuffer.length || audioBuffer.length > MAX_AUDIO_BYTES) {
    return response.status(413).json({ error: 'Die Aufnahme ist für diesen Transkriptionsweg zu groß.', requestId })
  }

  const language = typeof payload.language === 'string' && /^[a-z]{2,3}(?:-[a-z]{2})?$/i.test(payload.language)
    ? payload.language.toLowerCase()
    : 'de'
  const context = typeof payload.context === 'string' ? payload.context.trim().slice(0, 300) : ''

  try {
    const form = new FormData()
    form.append('file', new Blob([audioBuffer], { type: mimeType }), fileName)
    form.append('model', 'whisper-1')
    form.append('language', language)
    form.append('response_format', 'verbose_json')
    form.append('timestamp_granularities[]', 'word')
    form.append('temperature', '0')
    if (context) form.append('prompt', `Deutschsprachiges Speech-Coaching. Thema: ${context}`)

    const apiResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      body: form,
    })
    const data = await apiResponse.json().catch(() => ({}))

    if (!apiResponse.ok) {
      console.error('OpenAI transcription error', requestId, data?.error?.code || apiResponse.status)
      return response.status(502).json({ error: 'Der Transkriptionsdienst konnte die Aufnahme nicht auswerten.', requestId })
    }

    const text = typeof data.text === 'string' ? data.text.trim() : ''
    if (!text) return response.status(502).json({ error: 'Es wurde kein verwertbarer Text erkannt.', requestId })

    return response.status(200).json({
      text,
      language: data.language || language,
      duration: Number(data.duration) || null,
      words: normalizeWords(data.words),
      model: 'whisper-1',
      requestId,
    })
  } catch (error) {
    console.error('Transcription endpoint failure', requestId, error instanceof Error ? error.message : 'Unknown error')
    return response.status(500).json({ error: 'Interner Fehler bei der Transkription.', requestId })
  }
}
