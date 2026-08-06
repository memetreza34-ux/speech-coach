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

const AuthContext = createContext(null)

const LOCAL_STORES = {
  solo: 'speech-coach-history',
  dialog: 'speech-coach-dialog-history',
  audio: 'speech-coach-audio-history',
}
const PROFILE_KEY = 'speech-coach-account-profile'
const SYNC_STATE_KEY = 'speech-coach-sync-state'
const ACTIVE_OWNER_KEY = 'speech-coach-active-local-owner'
const USER_CACHE_PREFIX = 'speech-coach-user-cache:'

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
  if (userId) localStorage.setItem(`${USER_CACHE_PREFIX}${userId}`, JSON.stringify({ solo: [], dialog: [], audio: [] }))
}

const purgeLocalAccountData = (userId) => {
  clearLocalTrainingData(userId)
  if (userId) localStorage.removeItem(`${USER_CACHE_PREFIX}${userId}`)
  localStorage.removeItem(ACTIVE_OWNER_KEY)
  localStorage.removeItem(PROFILE_KEY)
  localStorage.removeItem(SYNC_STATE_KEY)
}

const exportAccountData = async (client, currentUser, currentProfile) => {
  const [{ data: cloudSessions, error: sessionError }, { data: cloudProfile, error: profileError }] = await Promise.all([
    client.from('speechcoach_sessions').select('*').order('started_at', { ascending: false }).limit(1000),
    client.from('speechcoach_profiles').select('*').eq('user_id', currentUser.id).maybeSingle(),
  ])
  if (sessionError) throw sessionError
  if (profileError) throw profileError

  return {
    exportVersion: 1,
    generatedAt: new Date().toISOString(),
    account: {
      id: currentUser.id,
      email: currentUser.email || '',
      createdAt: currentUser.created_at || null,
      lastSignInAt: currentUser.last_sign_in_at || null,
    },
    profile: cloudProfile || currentProfile || null,
    localTraining: {
      solo: safeReadArray(LOCAL_STORES.solo),
      dialog: safeReadArray(LOCAL_STORES.dialog),
      audio: safeReadArray(LOCAL_STORES.audio),
    },
    cloudTraining: cloudSessions || [],
    notes: {
      audioFilesIncluded: false,
      transcriptsMayBeExcluded: currentProfile?.storeTranscripts !== true,
    },
  }
}

const deleteCloudTrainingData = async (client, currentUser) => {
  const { data, error } = await client
    .from('speechcoach_sessions')
    .delete()
    .eq('user_id', currentUser.id)
    .select('id')
  if (error) throw error
  return { deleted: data?.length || 0 }
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
    if (!client || !user || !profile) return null
    if (syncPromiseRef.current) return syncPromiseRef.current

    if (!silent) setSyncStatus((current) => ({ ...current, status: 'syncing', error: null }))

    const task = syncTrainingData(client, user, profile)
      .then((result) => {
        setSyncStatus(result)
        return result
      })
      .catch((error) => {
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
        syncPromiseRef.current = null
      })

    syncPromiseRef.current = task
    return task
  }, [profile, user])

  const hydrateSession = useCallback(async (client, nextSession) => {
    setSession(nextSession || null)
    if (!nextSession) {
      if (activeUserIdRef.current) deactivateLocalUser(activeUserIdRef.current)
      activeUserIdRef.current = null
      setUser(null)
      setProfile(null)
      setSyncStatus({ status: 'idle' })
      setLoading(false)
      return
    }

    try {
      const { data, error } = await client.auth.getUser()
      if (error || !data?.user) throw error || new Error('Sitzung konnte nicht bestätigt werden.')
      activateLocalUser(data.user.id)
      activeUserIdRef.current = data.user.id
      setUser(data.user)
      const nextProfile = await loadOrCreateProfile(client, data.user)
      setProfile(nextProfile)
      setAuthError('')
    } catch (error) {
      setAuthError(error?.message || 'Konto konnte nicht geladen werden.')
    } finally {
      setLoading(false)
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
      subscription?.unsubscribe()
      if (syncTimerRef.current) window.clearTimeout(syncTimerRef.current)
      if (syncIntervalRef.current) window.clearInterval(syncIntervalRef.current)
    }
  }, [hydrateSession])

  useEffect(() => {
    if (!user || !profile?.syncEnabled) return undefined

    const synchronizeAndRefreshFingerprint = () => runSync({ silent: true })
      .finally(() => {
        fingerprintRef.current = getTrainingFingerprint()
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
  }, [profile?.syncEnabled, runSync, user])

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
    if (!client || !session) throw new Error('Keine bestätigte Sitzung vorhanden.')
    const attributes = { password }
    if (currentPassword) attributes.current_password = currentPassword
    const { data, error } = await client.auth.updateUser(attributes)
    if (error) throw error
    setPasswordRecovery(false)
    removeRecoveryMarker()
    if (data?.user) setUser(data.user)
    return data
  }

  const updateEmail = async (email) => {
    const client = clientRef.current
    if (!client || !user) throw new Error('Du bist nicht angemeldet.')
    const { data, error } = await client.auth.updateUser({ email: email.trim() })
    if (error) throw error
    if (data?.user) setUser(data.user)
    return data
  }

  const signOut = async () => {
    const client = clientRef.current
    const currentUserId = user?.id || activeUserIdRef.current

    if (profile?.syncEnabled) await runSync({ silent: true })

    if (client) {
      const { error } = await client.auth.signOut()
      if (error) throw error
    }

    if (currentUserId) deactivateLocalUser(currentUserId)
    activeUserIdRef.current = null
    setSession(null)
    setUser(null)
    setProfile(null)
    setPasswordRecovery(false)
    setSyncStatus({ status: 'idle' })
  }

  const saveProfile = async (nextProfile) => {
    const client = clientRef.current
    if (!client || !user) throw new Error('Du bist nicht angemeldet.')
    const saved = await updateCloudProfile(client, user, nextProfile)
    setProfile(saved)
    return saved
  }

  const exportData = async () => {
    const client = clientRef.current
    if (!client || !user) throw new Error('Du bist nicht angemeldet.')
    return exportAccountData(client, user, profile)
  }

  const removeCloudTraining = async () => {
    const client = clientRef.current
    if (!client || !user || !profile) throw new Error('Du bist nicht angemeldet.')
    const pausedProfile = await updateCloudProfile(client, user, { ...profile, syncEnabled: false })
    setProfile(pausedProfile)
    const result = await deleteCloudTrainingData(client, user)
    setSyncStatus({ status: 'disabled', lastSyncAt: null, uploaded: 0, downloaded: 0, cloudTotal: 0 })
    return result
  }

  const removeLocalTraining = async () => {
    const client = clientRef.current
    if (!client || !user || !profile) throw new Error('Du bist nicht angemeldet.')
    let nextProfile = profile
    if (profile.syncEnabled) {
      nextProfile = await updateCloudProfile(client, user, { ...profile, syncEnabled: false })
      setProfile(nextProfile)
    }
    clearLocalTrainingData(user.id)
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

  const value = {
    configured: configuration.configured,
    configuration,
    session,
    user,
    profile,
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
