const GUEST_BASELINE_KEY = 'speech-coach-baseline'
const ACTIVE_OWNER_KEY = 'speech-coach-active-local-owner'
const USER_BASELINE_PREFIX = 'speech-coach-user-baseline:'
const ALLOWED_SKILLS = new Set(['pace', 'fillerControl', 'clarity', 'structure', 'impact'])

const safeReadObject = (key) => {
  try {
    const value = JSON.parse(localStorage.getItem(key) || 'null')
    return value && typeof value === 'object' ? value : null
  } catch {
    return null
  }
}

const safeWrite = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch {
    return false
  }
}

const activeOwner = () => {
  try {
    return String(localStorage.getItem(ACTIVE_OWNER_KEY) || '').trim()
  } catch {
    return ''
  }
}

const keyForOwner = (ownerId) => ownerId ? `${USER_BASELINE_PREFIX}${ownerId}` : GUEST_BASELINE_KEY

const sanitizeBaseline = (profile) => {
  if (!profile || typeof profile !== 'object') return null
  const skills = profile.skills && typeof profile.skills === 'object'
    ? Object.fromEntries(Object.entries(profile.skills)
      .filter(([key, value]) => ALLOWED_SKILLS.has(key) && Number.isFinite(Number(value)))
      .map(([key, value]) => [key, Math.max(0, Math.min(100, Math.round(Number(value))))]))
    : {}
  const weakest = Array.isArray(profile.weakest)
    ? profile.weakest.slice(0, 3).map((item) => ({
      key: String(item?.key || ''),
      value: Math.max(0, Math.min(100, Math.round(Number(item?.value) || 0))),
    })).filter((item) => ALLOWED_SKILLS.has(item.key))
    : []

  return {
    version: 1,
    createdAt: profile.createdAt || new Date().toISOString(),
    durationMs: Math.max(0, Math.round(Number(profile.durationMs) || 0)),
    overall: Math.max(0, Math.min(100, Math.round(Number(profile.overall) || 0))),
    skills,
    weakest,
  }
}

const readSanitizedBaseline = (key) => {
  const stored = safeReadObject(key)
  if (!stored) return null

  const sanitized = sanitizeBaseline(stored)
  if (!sanitized) return null

  // Every read is also a migration: legacy/raw or unexpected fields are removed
  // before the baseline can be shown, exported or adopted by an account.
  safeWrite(key, sanitized)
  return sanitized
}

const readGuestBaseline = () => readSanitizedBaseline(GUEST_BASELINE_KEY)

const dispatchChanged = (source) => {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent('speechcoach:data-changed', { detail: { source } }))
}

export const adoptGuestBaselineForActiveOwner = () => {
  const ownerId = activeOwner()
  if (!ownerId) return null

  const userKey = keyForOwner(ownerId)
  const existing = readSanitizedBaseline(userKey)
  if (existing) return existing

  const anonymous = readGuestBaseline()
  if (!anonymous) return null

  if (!safeWrite(userKey, anonymous)) return null

  try { localStorage.removeItem(GUEST_BASELINE_KEY) } catch { /* storage is optional */ }
  return anonymous
}

export const readBaselineProfile = () => {
  const ownerId = activeOwner()
  if (!ownerId) return readGuestBaseline()
  return readSanitizedBaseline(keyForOwner(ownerId)) || adoptGuestBaselineForActiveOwner()
}

export const saveBaselineProfile = (profile) => {
  const sanitized = sanitizeBaseline(profile)
  if (!sanitized) return null
  const saved = safeWrite(keyForOwner(activeOwner()), sanitized)
  if (saved) dispatchChanged('baseline')
  return saved ? sanitized : null
}

export const clearBaselineProfile = ({ notify = true } = {}) => {
  try {
    localStorage.removeItem(keyForOwner(activeOwner()))
  } catch {
    // Local storage is optional.
  }
  if (notify) dispatchChanged('baseline-cleared')
}

export const getBaselineStorageInfo = () => ({
  ownerId: activeOwner() || null,
  key: keyForOwner(activeOwner()),
  stored: Boolean(readBaselineProfile()),
})

if (typeof window !== 'undefined') {
  window.addEventListener('speechcoach:data-changed', (event) => {
    if (event.detail?.source === 'account-activated') {
      adoptGuestBaselineForActiveOwner()
      return
    }
    if (event.detail?.source !== 'privacy-center') return
    clearBaselineProfile({ notify: false })
    window.queueMicrotask(() => dispatchChanged('baseline-cleared-by-privacy'))
  })
}
