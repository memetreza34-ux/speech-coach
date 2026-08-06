const LOCAL_STORES = {
  solo: 'speech-coach-history',
  dialog: 'speech-coach-dialog-history',
  audio: 'speech-coach-audio-history',
}

const PROFILE_KEY = 'speech-coach-account-profile'
const SYNC_STATE_KEY = 'speech-coach-sync-state'

const safeReadArray = (key) => {
  try {
    const value = JSON.parse(localStorage.getItem(key) || '[]')
    return Array.isArray(value) ? value : []
  } catch {
    return []
  }
}

const safeWrite = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Local storage is optional. Cloud sync can still continue.
  }
}

const clonePayload = (value) => {
  try {
    return JSON.parse(JSON.stringify(value, (key, item) => {
      if (key === 'audioUrl' || typeof item === 'function') return undefined
      return item
    }))
  } catch {
    return {}
  }
}

const average = (values) => {
  const valid = values.map(Number).filter(Number.isFinite)
  return valid.length ? Math.round(valid.reduce((sum, value) => sum + value, 0) / valid.length) : 0
}

const sessionScore = (type, item) => {
  if (type === 'solo') return Number(item.analysis?.score) || 0
  if (type === 'audio') return Number(item.overall) || 0
  return Number(item.scores?.overall) || average([
    item.scores?.clarity,
    item.scores?.structure,
    item.scores?.impact,
  ])
}

const sessionTopic = (type, item) => {
  if (type === 'solo') return item.topic?.title || 'Solo-Training'
  return item.topic || item.title || (type === 'audio' ? 'Audio-Analyse' : 'Live-Coach')
}

const sessionCategory = (type, item) => {
  if (type === 'solo') return item.mode?.title || item.mode?.shortTitle || 'Solo-Training'
  if (type === 'audio') return 'Audio-Labor'
  return item.mode || 'Live-Coach'
}

const sessionDuration = (type, item) => type === 'dialog' ? 0 : Number(item.durationMs) || 0

const toCloudRow = (type, item, userId, storeTranscripts) => {
  const payload = clonePayload(item)
  if (!storeTranscripts && 'transcript' in payload) delete payload.transcript

  return {
    user_id: userId,
    client_id: String(item.id || `${type}-${Date.now()}-${Math.random().toString(16).slice(2)}`),
    session_type: type,
    topic: sessionTopic(type, item).slice(0, 500),
    category: sessionCategory(type, item).slice(0, 160),
    score: Math.max(0, Math.min(100, Math.round(sessionScore(type, item)))),
    duration_ms: Math.max(0, Math.min(7200000, Math.round(sessionDuration(type, item)))),
    payload,
    started_at: item.createdAt || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
}

const fromCloudRow = (row) => ({
  ...(row.payload && typeof row.payload === 'object' ? row.payload : {}),
  id: row.payload?.id || row.client_id,
  createdAt: row.payload?.createdAt || row.started_at,
})

const mergeSessions = (localSessions, remoteSessions) => {
  const merged = new Map()
  remoteSessions.forEach((item) => merged.set(String(item.id), item))
  localSessions.forEach((item) => merged.set(String(item.id), item))
  return [...merged.values()]
    .filter((item) => item?.id && item?.createdAt)
    .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt))
    .slice(0, 100)
}

export const dispatchTrainingDataChanged = (source = 'unknown') => {
  window.dispatchEvent(new CustomEvent('speechcoach:data-changed', { detail: { source } }))
}

export const readLocalProfile = () => {
  try {
    const value = JSON.parse(localStorage.getItem(PROFILE_KEY) || 'null')
    return value && typeof value === 'object' ? value : null
  } catch {
    return null
  }
}

export const saveLocalProfile = (profile) => {
  safeWrite(PROFILE_KEY, profile)
  window.dispatchEvent(new CustomEvent('speechcoach:profile-changed', { detail: profile }))
}

export const readSyncState = () => {
  try {
    return JSON.parse(localStorage.getItem(SYNC_STATE_KEY) || 'null')
  } catch {
    return null
  }
}

const saveSyncState = (state) => safeWrite(SYNC_STATE_KEY, state)

const normalizeProfile = (row, user) => ({
  userId: row?.user_id || user.id,
  email: user.email || '',
  displayName: row?.display_name || user.user_metadata?.display_name || user.email?.split('@')[0] || 'SpeechCoach Nutzer',
  weeklyGoal: Number(row?.weekly_goal) || 5,
  syncEnabled: row?.sync_enabled !== false,
  storeTranscripts: row?.store_transcripts === true,
  updatedAt: row?.updated_at || new Date().toISOString(),
})

export const loadOrCreateProfile = async (client, user) => {
  const { data, error } = await client
    .from('speechcoach_profiles')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  if (error) throw error
  if (data) {
    const profile = normalizeProfile(data, user)
    saveLocalProfile(profile)
    return profile
  }

  const row = {
    user_id: user.id,
    display_name: user.user_metadata?.display_name || user.email?.split('@')[0] || 'SpeechCoach Nutzer',
    weekly_goal: 5,
    sync_enabled: true,
    store_transcripts: false,
    updated_at: new Date().toISOString(),
  }

  const { data: created, error: createError } = await client
    .from('speechcoach_profiles')
    .insert(row)
    .select('*')
    .single()

  if (createError) throw createError
  const profile = normalizeProfile(created, user)
  saveLocalProfile(profile)
  return profile
}

export const updateCloudProfile = async (client, user, profile) => {
  const row = {
    user_id: user.id,
    display_name: String(profile.displayName || 'SpeechCoach Nutzer').trim().slice(0, 60),
    weekly_goal: Math.max(1, Math.min(50, Number(profile.weeklyGoal) || 5)),
    sync_enabled: profile.syncEnabled !== false,
    store_transcripts: profile.storeTranscripts === true,
    updated_at: new Date().toISOString(),
  }

  const { data, error } = await client
    .from('speechcoach_profiles')
    .upsert(row, { onConflict: 'user_id' })
    .select('*')
    .single()

  if (error) throw error
  const normalized = normalizeProfile(data, user)
  saveLocalProfile(normalized)
  return normalized
}

export const syncTrainingData = async (client, user, profile) => {
  if (!client || !user) throw new Error('Keine aktive Cloud-Sitzung.')
  if (profile?.syncEnabled === false) {
    const state = { status: 'disabled', lastSyncAt: null, uploaded: 0, downloaded: 0 }
    saveSyncState(state)
    return state
  }

  const localByType = {
    solo: safeReadArray(LOCAL_STORES.solo),
    dialog: safeReadArray(LOCAL_STORES.dialog),
    audio: safeReadArray(LOCAL_STORES.audio),
  }

  const rows = Object.entries(localByType).flatMap(([type, items]) => (
    items.map((item) => toCloudRow(type, item, user.id, profile?.storeTranscripts === true))
  ))

  if (rows.length) {
    const { error: uploadError } = await client
      .from('speechcoach_sessions')
      .upsert(rows, {
        onConflict: 'user_id,client_id',
        ignoreDuplicates: true,
      })

    if (uploadError) throw uploadError
  }

  const { data: cloudRows, error: downloadError } = await client
    .from('speechcoach_sessions')
    .select('client_id, session_type, payload, started_at')
    .order('started_at', { ascending: false })
    .limit(500)

  if (downloadError) throw downloadError

  const rowsByType = { solo: [], dialog: [], audio: [] }
  ;(cloudRows || []).forEach((row) => {
    if (rowsByType[row.session_type]) rowsByType[row.session_type].push(fromCloudRow(row))
  })

  let downloaded = 0
  Object.entries(LOCAL_STORES).forEach(([type, key]) => {
    const localIds = new Set(localByType[type].map((item) => String(item.id)))
    downloaded += rowsByType[type].filter((item) => !localIds.has(String(item.id))).length
    safeWrite(key, mergeSessions(localByType[type], rowsByType[type]))
  })

  const state = {
    status: 'synced',
    lastSyncAt: new Date().toISOString(),
    uploaded: rows.length,
    downloaded,
    cloudTotal: cloudRows?.length || 0,
  }
  saveSyncState(state)
  window.dispatchEvent(new CustomEvent('speechcoach:cloud-synced', { detail: state }))
  return state
}
