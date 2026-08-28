const HISTORY_KEYS = [
  'speech-coach-history',
  'speech-coach-dialog-history',
  'speech-coach-audio-history',
]

export const normalizeLocalHistoryStores = (storage = globalThis.localStorage) => {
  if (!storage) return { repaired: [], available: false }

  const repaired = []
  for (const key of HISTORY_KEYS) {
    try {
      const raw = storage.getItem(key)
      if (raw === null) continue
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) continue
      storage.setItem(key, '[]')
      repaired.push(key)
    } catch {
      try {
        storage.setItem(key, '[]')
        repaired.push(key)
      } catch {
        // Storage is optional; startup must continue even when it is blocked.
      }
    }
  }

  return { repaired, available: true }
}

export const LOCAL_HISTORY_KEYS = [...HISTORY_KEYS]
