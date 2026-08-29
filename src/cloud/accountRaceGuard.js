const ACTIVE_OWNER_KEY = 'speech-coach-active-local-owner'

const resolveStorage = (storage) => {
  if (storage !== undefined) return storage
  try {
    return globalThis.localStorage || null
  } catch {
    return null
  }
}

export const readActiveLocalOwner = (storage) => {
  const target = resolveStorage(storage)
  if (!target) return null
  try {
    const value = String(target.getItem(ACTIVE_OWNER_KEY) || '').trim()
    return value || null
  } catch {
    return null
  }
}

export const isActiveLocalOwner = (userId, storage) => {
  if (!userId) return false
  return readActiveLocalOwner(storage) === String(userId)
}

export const createStaleAccountError = (userId) => {
  const error = new Error('Kontokontext hat sich während der Operation geändert.')
  error.name = 'AbortError'
  error.code = 'STALE_ACCOUNT_CONTEXT'
  error.userId = userId ? String(userId) : null
  return error
}

export const assertActiveLocalOwner = (userId, storage) => {
  if (!isActiveLocalOwner(userId, storage)) throw createStaleAccountError(userId)
  return true
}
