const MAX_UPLOAD_BYTES = 3 * 1024 * 1024

const blobToBase64 = async (blob) => {
  const bytes = new Uint8Array(await blob.arrayBuffer())
  let binary = ''
  const chunkSize = 0x8000
  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, Math.min(bytes.length, index + chunkSize)))
  }
  return btoa(binary)
}

export const groupTimestampWords = (words, size = 7) => {
  if (!Array.isArray(words)) return []
  const groups = []
  for (let index = 0; index < words.length; index += size) {
    const chunk = words.slice(index, index + size)
    if (!chunk.length) continue
    groups.push({
      text: chunk.map((item) => item.word).join(' ').replace(/\s+([,.!?;:])/g, '$1'),
      start: Number(chunk[0].start) || 0,
      end: Number(chunk.at(-1)?.end) || Number(chunk[0].start) || 0,
    })
  }
  return groups
}

export const requestServerTranscription = async (blob, { topic = '', language = 'de' } = {}) => {
  if (!blob?.size) throw new Error('Keine Audiodatei verfügbar.')
  if (blob.size > MAX_UPLOAD_BYTES) {
    throw new Error('Die Aufnahme ist für die optionale Präzisionstranskription zu groß. Die lokale Analyse bleibt verfügbar.')
  }

  const audioBase64 = await blobToBase64(blob)
  const response = await fetch('/api/transcribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      audioBase64,
      mimeType: blob.type || 'audio/webm',
      language,
      context: String(topic || '').slice(0, 300),
    }),
  })

  const result = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(result?.error || `Transkription fehlgeschlagen (${response.status}).`)
  if (!result?.text) throw new Error('Der Transkriptionsdienst hat keinen Text geliefert.')

  return {
    text: result.text,
    language: result.language || language,
    duration: Number(result.duration) || null,
    words: Array.isArray(result.words) ? result.words : [],
    timestampGroups: groupTimestampWords(result.words),
    model: result.model || 'whisper-1',
  }
}
