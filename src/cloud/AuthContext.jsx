import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { getCloudConfiguration, getSupabaseClient, isCloudConfigured } from './supabaseClient'
import {
  loadOrCreateProfile,
  readLocalProfile,
  readSyncState,
  syncTrainingData,
  updateCloudProfile,
} from './cloudSync'

const AuthContext = createContext(null)
const TRAINING_KEYS = [
  'speech-coach-history',
  'speech-coach-dialog-history',
  'speech-coach-audio-history',
]

const getTrainingFingerprint = () => TRAINING_KEYS
  .map((key) => localStorage.getItem(key) || '')
  .join('|')

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}

export function AuthProvider({ children }) {
  const clientRef = useRef(null)
  const syncTimerRef = useRef(null)
  const syncIntervalRef = useRef(null)
  const syncPromiseRef = useRef(null)
  const fingerprintRef = useRef('')
  const [session, setSession] = useState(null)
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(() => readLocalProfile())
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState('')
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
      setUser(null)
      setProfile(readLocalProfile())
      setLoading(false)
      return
    }

    try {
      const { data, error } = await client.auth.getUser()
      if (error || !data?.user) throw error || new Error('Sitzung konnte nicht bestätigt werden.')
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

        const authListener = client.auth.onAuthStateChange((_event, nextSession) => {
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

  const signOut = async () => {
    const client = clientRef.current
    if (client) {
      const { error } = await client.auth.signOut()
      if (error) throw error
    }
    setSession(null)
    setUser(null)
    setSyncStatus({ status: 'idle' })
  }

  const saveProfile = async (nextProfile) => {
    const client = clientRef.current
    if (!client || !user) throw new Error('Du bist nicht angemeldet.')
    const saved = await updateCloudProfile(client, user, nextProfile)
    setProfile(saved)
    return saved
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
    signUp,
    signIn,
    sendMagicLink,
    signOut,
    saveProfile,
    syncNow: () => runSync({ silent: false }),
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
