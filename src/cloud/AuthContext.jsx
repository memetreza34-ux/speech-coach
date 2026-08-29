import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { getCloudConfiguration, getSupabaseClient, isCloudConfigured } from './supabaseClient'
import {
  activateLocalUser,
  deactivateLocalUser,
  loadOrCreateProfile,
  readLocalProfile,
  readSyncState,
  syncTrainingData,
  updateCloudProfile,
} from './cloudSync'
import { createStaleAccountError } from './accountRaceGuard.js'
import { readLocalTrainingPlan } from '../trainingPlanStore'

const AuthContext = createContext(null)

const LOCAL_STORES = {
  solo: 'speech-coach-history',
  dialog: 'speech-coach-dialog-history',
  audio: 'speech-coach-audio-history',
}
const PROFILE_KEY = 'speech-coach-account-profile'
const SYNC_STATE_KEY = 'speech-coach-sync-state'
const ACTIVE_OWNER_KEY = 'speech-coach-active-local-owner'
const ACTIVE_PLAN_TASK_KEY = 'speech-coach-active-plan-task'
const USER_CACHE_PREFIX = 'speech-coach-user-cache:'
const PLAN_PREFIX = 'speech-coach-training-plan:'
const BASELINE_PREFIX = 'speech-coach-user-baseline:'

const safeReadArray = (key) => {
  try {
    const value = JSON.parse(localStorage.getItem(key) || '[]')
    return Array.isArray(value) ? value : []
  } catch {
    return []
  }
}

const writeEmptyTrainingStores = () => {
  Object.values(LOCAL_STORES).forEach((key) => localStorage.setItem(key, '[]'))
  window.dispatchEvent(new CustomEvent('speechcoach:data-changed', { detail: { source: 'privacy-center' } }))
}

const clearLocalTrainingData = (userId) => {
  writeEmptyTrainingStores()
  if (userId) {
    localStorage.setItem(`${USER_CACHE_PREFIX}${userId}`, JSON.stringify({ solo: [], dialog: [], audio: [] }))
    localStorage.removeItem(`${PLAN_PREFIX}${userId}`)
  }
  localStorage.removeItem(ACTIVE_PLAN_TASK_KEY)
  window.dispatchEvent(new CustomEvent('speechcoach:plan-changed', { detail: { userId: userId || 'guest' } }))
}

const removeStoredAccountArtifacts = (userId) => {
  if (!userId) return
  localStorage.removeItem(`${USER_CACHE_PREFIX}${userId}`)
  localStorage.removeItem(`${PLAN_PREFIX}${userId}`)
  localStorage.removeItem(`${BASELINE_PREFIX}${userId}`)
}

const purgeLocalAccountData = (userId) => {
  clearLocalTrainingData(userId)
  removeStoredAccountArtifacts(userId)
  localStorage.removeItem(ACTIVE_OWNER_KEY)
  localStorage.removeItem(PROFILE_KEY)
  localStorage.removeItem(SYNC_STATE_KEY)
}

const exportAccountData = async (client, currentUser, currentProfile) => {
  const localTrainingSnapshot = {
    solo: safeReadArray(LOCAL_STORES.solo),
    dialog: safeReadArray(LOCAL_STORES.dialog),
    audio: safeReadArray(LOCAL_STORES.audio),
  }
  const localPlanSnapshot = readLocalTrainingPlan(currentUser.id)

  const [
    { data: cloudSessions, error: sessionError },
    { data: cloudProfile, error: profileError },
    { data: cloudPlan, error: planError },
  ] = await Promise.all([
    client.from('speechcoach_sessions').select('*').order('started_at', { ascending: false }).limit(1000),
    client.from('speechcoach_profiles').select('*').eq('user_id', currentUser.id).maybeSingle(),
    client.from('speechcoach_training_plans').select('*').eq('user_id', currentUser.id).maybeSingle(),
  ])
  if (sessionError) throw sessionError
  if (profileError) throw profileError
  if (planError) throw planError

  return {
    exportVersion: 2,
    generatedAt: new Date().toISOString(),
    account: {
      id: currentUser.id,
      email: currentUser.email || '',
      createdAt: currentUser.created_at || null,
      lastSignInAt: currentUser.last_sign_in_at || null,
    },
    profile: cloudProfile || currentProfile || null,
    localTraining: localTrainingSnapshot,
    cloudTraining: cloudSessions || [],
    trainingPlan: {
      local: localPlanSnapshot,
      cloud: cloudPlan || null,
    },
    notes: {
      audioFilesIncluded: false,
      transcriptsMayBeExcluded: currentProfile?.storeTranscripts !== true,
    },
  }
}

const deleteCloudTrainingData = async (client, currentUser) => {
  const [sessionResult, planResult] = await Promise.all([
    client
      .from('speechcoach_sessions')
      .delete()
      .eq('user_id', currentUser.id)
      .select('id'),
    client
      .from('speechcoach_training_plans')
      .delete()
      .eq('user_id', currentUser.id)
      .select('user_id'),
  ])
  if (sessionResult.error) throw sessionResult.error
  if (planResult.error) throw planResult.error
  return {
    deleted: sessionResult.data?.length || 0,
    planDeleted: Boolean(planResult.data?.length),
  }
}

const TRAINING_KEYS = [
  'speech-coach-history',
  'speech-coach-dialog-history',
  'speech-coach-audio-history',
]

const getTrainingFingerprint = () => TRAINING_KEYS
  .map((key) => localStorage.getItem(key) || '')
  .join('|')

const recoveryRedirectUrl = () => {
  const url = new URL(window.location.href)
  url.search = ''
  url.hash = ''
  url.searchParams.set('recovery', '1')
  return url.toString()
}

const removeRecoveryMarker = () => {
  const url = new URL(window.location.href)
  url.searchParams.delete('recovery')
  window.history.replaceState({}, document.title, `${url.pathname}${url.search}${url.hash}`)
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}

export function AuthProvider({ children }) {
  const clientRef = useRef(null)
  const activeUserIdRef = useRef(null)
  const hydrateGenerationRef = useRef(0)
  const syncTimerRef = useRef(null)
  const syncIntervalRef = useRef(null)
  const syncPromiseRef = useRef(null)
  const fingerprintRef = useRef('')
  const [session, setSession] = useState(null)
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(() => readLocalProfile())
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState('')
  const [passwordRecovery, setPasswordRecovery] = useState(() => new URLSearchParams(window.location.search).get('recovery') === '1')
  const [syncStatus, setSyncStatus] = useState(() => readSyncState() || { status: 'idle' })
  const configuration = useMemo(() => getCloudConfiguration(), [])

  const runSync = useCallback(async ({ silent = false } = {}) => {
    const client = clientRef.current
    const syncUser = user
    const syncProfile = profile
    const syncUserId = syncUser?.id
    if (!client || !syncUserId || !syncProfile) return null
    if (activeUserIdRef.current !== syncUserId) return null
    if (syncProfile.userId && syncProfile.userId !== syncUserId) return null

    const existing = syncPromiseRef.current
    if (existing?.userId === syncUserId) return existing.promise

    if (!silent) setSyncStatus((current) => ({ ...current, status: 'syncing', error: null }))

    let task
    task = syncTrainingData(client, syncUser, syncProfile)
      .then((result) => {
        if (activeUserIdRef.current === syncUserId && result) setSyncStatus(result)
        return result
      })
      .catch((error) => {
        if (error?.name === 'AbortError' || activeUserIdRef.current !== syncUserId) return null

        let next
        setSyncStatus((current) => {
          next = {
            status: 'error',
            error: error?.message || 'Synchronisierung fehlgeschlagen.',
            lastSyncAt: current?.lastSyncAt || null,
          }
          return next
        })
        if (!silent) throw error
        return next
      })
      .finally(() => {
        if (syncPromiseRef.current?.promise === task) syncPromiseRef.current = null
      })

    syncPromiseRef.current = { userId: syncUserId, promise: task }
    return task
  }, [profile, user])

  const hydrateSession = useCallback(async (client, nextSession) => {
    const generation = ++hydrateGenerationRef.current
    setSession(nextSession || null)

    if (!nextSession) {
      syncPromiseRef.current = null
      if (activeUserIdRef.current) deactivateLocalUser(activeUserIdRef.current)
      activeUserIdRef.current = null
      setUser(null)
      setProfile(null)
      setSyncStatus({ status: 'idle' })
      setAuthError('')
      setLoading(false)
      return
    }

    const hintedUserId = nextSession.user?.id || null
    if (hintedUserId && activeUserIdRef.current && activeUserIdRef.current !== hintedUserId) {
      setUser(null)
      setProfile(null)
      setSyncStatus({ status: 'idle' })
    }
    setLoading(true)

    try {
      const { data, error } = await client.auth.getUser()
      if (error || !data?.user) throw error || new Error('Sitzung konnte nicht bestätigt werden.')
      if (generation !== hydrateGenerationRef.current) return

      const nextUser = data.user
      const switchedAccount = Boolean(activeUserIdRef.current && activeUserIdRef.current !== nextUser.id)
      activateLocalUser(nextUser.id)
      if (generation !== hydrateGenerationRef.current) return

      activeUserIdRef.current = nextUser.id
      setUser(nextUser)
      setProfile((current) => current?.userId === nextUser.id ? current : null)
      if (switchedAccount) setSyncStatus({ status: 'idle' })

      const nextProfile = await loadOrCreateProfile(client, nextUser)
      if (generation !== hydrateGenerationRef.current || activeUserIdRef.current !== nextUser.id) return

      setProfile(nextProfile)
      setAuthError('')
    } catch (error) {
      if (generation === hydrateGenerationRef.current && error?.name !== 'AbortError') {
        setAuthError(error?.message || 'Konto konnte nicht geladen werden.')
      }
    } finally {
      if (generation === hydrateGenerationRef.current) setLoading(false)
    }
  }, [])

  useEffect(() => {
    let active = true
    let subscription

    const initialize = async () => {
      if (!isCloudConfigured()) {
        setLoading(false)
        return
      }

      try {
        const client = await getSupabaseClient()
        if (!active || !client) return
        clientRef.current = client

        const { data, error } = await client.auth.getSession()
        if (error) throw error
        await hydrateSession(client, data.session)

        const authListener = client.auth.onAuthStateChange((event, nextSession) => {
          if (event === 'PASSWORD_RECOVERY') setPasswordRecovery(true)
          window.setTimeout(() => {
            if (active) hydrateSession(client, nextSession)
          }, 0)
        })
        subscription = authListener.data.subscription
      } catch (error) {
        if (active) {
          setAuthError(error?.message || 'Cloud-Verbindung konnte nicht geladen werden.')
          setLoading(false)
        }
      }
    }

    initialize()
    return () => {
      active = false
      hydrateGenerationRef.current += 1
      syncPromiseRef.current = null
      subscription?.unsubscribe()
      if (syncTimerRef.current) window.clearTimeout(syncTimerRef.current)
      if (syncIntervalRef.current) window.clearInterval(syncIntervalRef.current)
    }
  }, [hydrateSession])

  useEffect(() => {
    if (!user || !profile?.syncEnabled || profile.userId !== user.id) return undefined

    const synchronizeAndRefreshFingerprint = () => runSync({ silent: true })
      .finally(() => {
        if (activeUserIdRef.current === user.id) fingerprintRef.current = getTrainingFingerprint()
      })

    const scheduleSync = () => {
      if (syncTimerRef.current) window.clearTimeout(syncTimerRef.current)
      syncTimerRef.current = window.setTimeout(synchronizeAndRefreshFingerprint, 1400)
    }

    fingerprintRef.current = getTrainingFingerprint()
    synchronizeAndRefreshFingerprint()

    syncIntervalRef.current = window.setInterval(() => {
      const nextFingerprint = getTrainingFingerprint()
      if (nextFingerprint !== fingerprintRef.current) {
        fingerprintRef.current = nextFingerprint
        scheduleSync()
      }
    }, 2500)

    window.addEventListener('speechcoach:data-changed', scheduleSync)
    window.addEventListener('online', scheduleSync)
    return () => {
      window.removeEventListener('speechcoach:data-changed', scheduleSync)
      window.removeEventListener('online', scheduleSync)
      if (syncTimerRef.current) window.clearTimeout(syncTimerRef.current)
      if (syncIntervalRef.current) window.clearInterval(syncIntervalRef.current)
    }
  }, [profile?.syncEnabled, profile?.userId, runSync, user])

  const signUp = async ({ email, password, displayName }) => {
    const client = clientRef.current || await getSupabaseClient()
    if (!client) throw new Error('Cloud-Anmeldung ist nicht konfiguriert.')

    const { data, error } = await client.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { display_name: displayName.trim() },
      },
    })
    if (error) throw error
    if (data.session) await hydrateSession(client, data.session)
    return { needsConfirmation: !data.session, user: data.user }
  }

  const signIn = async ({ email, password }) => {
    const client = clientRef.current || await getSupabaseClient()
    if (!client) throw new Error('Cloud-Anmeldung ist nicht konfiguriert.')
    const { data, error } = await client.auth.signInWithPassword({ email: email.trim(), password })
    if (error) throw error
    await hydrateSession(client, data.session)
    return data
  }

  const sendMagicLink = async (email) => {
    const client = clientRef.current || await getSupabaseClient()
    if (!client) throw new Error('Cloud-Anmeldung ist nicht konfiguriert.')
    const { error } = await client.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: window.location.origin },
    })
    if (error) throw error
  }

  const requestPasswordReset = async (email) => {
    const client = clientRef.current || await getSupabaseClient()
    if (!client) throw new Error('Cloud-Anmeldung ist nicht konfiguriert.')
    const { error } = await client.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: recoveryRedirectUrl(),
    })
    if (error) throw error
  }

  const updatePassword = async ({ password, currentPassword = '' }) => {
    const client = clientRef.current
    const expectedUserId = activeUserIdRef.current
    if (!client || !session || !expectedUserId) throw new Error('Keine bestätigte Sitzung vorhanden.')
    const attributes = { password }
    if (currentPassword) attributes.current_password = currentPassword
    const { data, error } = await client.auth.updateUser(attributes)
    if (error) throw error
    if (activeUserIdRef.current === expectedUserId && data?.user?.id === expectedUserId) {
      setPasswordRecovery(false)
      removeRecoveryMarker()
      setUser(data.user)
    }
    return data
  }

  const updateEmail = async (email) => {
    const client = clientRef.current
    const expectedUserId = user?.id
    if (!client || !expectedUserId) throw new Error('Du bist nicht angemeldet.')
    const { data, error } = await client.auth.updateUser({ email: email.trim() })
    if (error) throw error
    if (activeUserIdRef.current === expectedUserId && data?.user?.id === expectedUserId) setUser(data.user)
    return data
  }

  const signOut = async () => {
    const client = clientRef.current
    const currentUserId = user?.id || activeUserIdRef.current

    if (profile?.syncEnabled && profile?.userId === currentUserId) await runSync({ silent: true })
    if (currentUserId && activeUserIdRef.current !== currentUserId) throw createStaleAccountError(currentUserId)

    hydrateGenerationRef.current += 1
    syncPromiseRef.current = null

    if (client) {
      const { error } = await client.auth.signOut()
      if (error) throw error
    }

    if (currentUserId && activeUserIdRef.current === currentUserId) deactivateLocalUser(currentUserId)
    if (!currentUserId || activeUserIdRef.current === currentUserId) activeUserIdRef.current = null
    setSession(null)
    setUser(null)
    setProfile(null)
    setPasswordRecovery(false)
    setSyncStatus({ status: 'idle' })
  }

  const saveProfile = async (nextProfile) => {
    const client = clientRef.current
    const currentUser = user
    if (!client || !currentUser) throw new Error('Du bist nicht angemeldet.')
    const saved = await updateCloudProfile(client, currentUser, nextProfile)
    if (activeUserIdRef.current === currentUser.id) setProfile(saved)
    return saved
  }

  const exportData = async () => {
    const client = clientRef.current
    const currentUser = user
    const currentProfile = profile
    if (!client || !currentUser) throw new Error('Du bist nicht angemeldet.')
    const exported = await exportAccountData(client, currentUser, currentProfile)
    if (activeUserIdRef.current !== currentUser.id) throw createStaleAccountError(currentUser.id)
    return exported
  }

  const removeCloudTraining = async () => {
    const client = clientRef.current
    const currentUser = user
    const currentProfile = profile
    if (!client || !currentUser || !currentProfile) throw new Error('Du bist nicht angemeldet.')

    const pausedProfile = await updateCloudProfile(client, currentUser, { ...currentProfile, syncEnabled: false })
    if (activeUserIdRef.current === currentUser.id) setProfile(pausedProfile)

    const result = await deleteCloudTrainingData(client, currentUser)
    if (activeUserIdRef.current === currentUser.id) {
      setSyncStatus({ status: 'disabled', lastSyncAt: null, uploaded: 0, downloaded: 0, cloudTotal: 0 })
    }
    return result
  }

  const removeLocalTraining = async () => {
    const client = clientRef.current
    const currentUser = user
    const currentProfile = profile
    if (!client || !currentUser || !currentProfile) throw new Error('Du bist nicht angemeldet.')

    let nextProfile = currentProfile
    if (currentProfile.syncEnabled) {
      nextProfile = await updateCloudProfile(client, currentUser, { ...currentProfile, syncEnabled: false })
    }
    if (activeUserIdRef.current !== currentUser.id) throw createStaleAccountError(currentUser.id)

    setProfile(nextProfile)
    clearLocalTrainingData(currentUser.id)
    fingerprintRef.current = getTrainingFingerprint()
    setSyncStatus({ status: 'disabled', lastSyncAt: null, uploaded: 0, downloaded: 0 })
    return { syncPaused: nextProfile.syncEnabled === false }
  }

  const deleteAccount = async ({ email, confirmation }) => {
    const client = clientRef.current
    const currentUserId = user?.id
    if (!client || !user || !currentUserId) throw new Error('Du bist nicht angemeldet.')

    const { data, error } = await client.functions.invoke('delete-speechcoach-account', {
      body: { email: email.trim(), confirmation },
    })
    if (error) throw error
    if (!data?.deleted) throw new Error(data?.error || 'Konto konnte nicht gelöscht werden.')

    if (activeUserIdRef.current !== currentUserId) {
      removeStoredAccountArtifacts(currentUserId)
      return data
    }

    hydrateGenerationRef.current += 1
    syncPromiseRef.current = null
    purgeLocalAccountData(currentUserId)
    try {
      await client.auth.signOut({ scope: 'local' })
    } catch {
      // The account no longer exists; local state is cleared below regardless.
    }

    activeUserIdRef.current = null
    setSession(null)
    setUser(null)
    setProfile(null)
    setPasswordRecovery(false)
    setSyncStatus({ status: 'idle' })
    return data
  }

  const visibleProfile = user && profile?.userId === user.id ? profile : null

  const value = {
    configured: configuration.configured,
    configuration,
    session,
    user,
    profile: visibleProfile,
    loading,
    authError,
    syncStatus,
    signedIn: Boolean(user),
    passwordRecovery,
    signUp,
    signIn,
    sendMagicLink,
    requestPasswordReset,
    updatePassword,
    updateEmail,
    signOut,
    saveProfile,
    exportData,
    removeCloudTraining,
    removeLocalTraining,
    deleteAccount,
    cancelPasswordRecovery: () => {
      setPasswordRecovery(false)
      removeRecoveryMarker()
    },
    syncNow: () => runSync({ silent: false }),
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
