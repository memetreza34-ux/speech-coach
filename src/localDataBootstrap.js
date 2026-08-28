const HISTORY_KEYS = [
  'speech-coach-history',
  'speech-coach-dialog-history',
  'speech-coach-audio-history',
]

const resolveStorage = (storage) => {
  if (storage !== undefined) return storage
  try {
    return globalThis.localStorage || null
  } catch {
    return null
  }
}

export const normalizeLocalHistoryStores = (storage) => {
  const target = resolveStorage(storage)
  if (!target) return { repaired: [], available: false }

  const repaired = []
  for (const key of HISTORY_KEYS) {
    try {
      const raw = target.getItem(key)
      if (raw === null) continue
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) continue
      target.setItem(key, '[]')
      repaired.push(key)
    } catch {
      try {
        target.setItem(key, '[]')
        repaired.push(key)
      } catch {
        // Storage is optional; startup must continue even when it is blocked.
      }
    }
  }

  return { repaired, available: true }
}

export const LOCAL_HISTORY_KEYS = [...HISTORY_KEYS]
