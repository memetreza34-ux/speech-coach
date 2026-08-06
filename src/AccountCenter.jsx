import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  AlertCircle,
  AtSign,
  CheckCircle2,
  Cloud,
  CloudOff,
  KeyRound,
  LoaderCircle,
  LockKeyhole,
  LogIn,
  LogOut,
  Mail,
  RefreshCw,
  Save,
  ShieldCheck,
  Sparkles,
  UserRound,
  X,
} from 'lucide-react'
import { useAuth } from './cloud/AuthContext'

const formatSyncTime = (value) => {
  if (!value) return 'Noch nicht synchronisiert'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Unbekannter Zeitpunkt'
  return new Intl.DateTimeFormat('de-DE', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function AccountHeader({ onClose }) {
  return (
    <header className="account-header">
      <div className="account-header-title">
        <span><UserRound size={20} /></span>
        <div><strong>Konto & Cloud</strong><small>Geräteübergreifender Fortschritt</small></div>
      </div>
      <button onClick={onClose} aria-label="Konto schließen"><X size={20} /></button>
    </header>
  )
}

function AuthForm() {
  const { signIn, signUp, sendMagicLink } = useAuth()
  const [mode, setMode] = useState('login')
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const submit = async (event) => {
    event.preventDefault()
    setBusy(true)
    setError('')
    setMessage('')

    try {
      if (mode === 'register') {
        const result = await signUp({ email, password, displayName })
        setMessage(result.needsConfirmation
          ? 'Konto erstellt. Bestätige jetzt die E-Mail, bevor du dich anmeldest.'
          : 'Konto erstellt und angemeldet.')
      } else {
        await signIn({ email, password })
      }
    } catch (submitError) {
      setError(submitError?.message || 'Anmeldung fehlgeschlagen.')
    } finally {
      setBusy(false)
    }
  }

  const magicLink = async () => {
    if (!email.trim()) {
      setError('Gib zuerst deine E-Mail-Adresse ein.')
      return
    }
    setBusy(true)
    setError('')
    setMessage('')
    try {
      await sendMagicLink(email)
      setMessage('Der Anmeldelink wurde an deine E-Mail-Adresse gesendet.')
    } catch (linkError) {
      setError(linkError?.message || 'Magic Link konnte nicht gesendet werden.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="account-content account-auth-content">
      <section className="account-auth-intro">
        <div className="account-eyebrow"><Cloud size={15} /> Optionales Cloud-Konto</div>
        <h1>Dein Training auf <span>jedem Gerät.</span></h1>
        <p>SpeechCoach bleibt ohne Anmeldung nutzbar. Ein Konto synchronisiert ausschließlich deinen Fortschritt und deine gewählten Einstellungen.</p>
      </section>

      <section className="account-auth-card">
        <div className="account-auth-tabs">
          <button className={mode === 'login' ? 'active' : ''} onClick={() => { setMode('login'); setError(''); setMessage('') }}>Anmelden</button>
          <button className={mode === 'register' ? 'active' : ''} onClick={() => { setMode('register'); setError(''); setMessage('') }}>Registrieren</button>
        </div>

        <form onSubmit={submit}>
          {mode === 'register' && (
            <label>
              <span>Name</span>
              <div><UserRound size={18} /><input value={displayName} onChange={(event) => setDisplayName(event.target.value)} required minLength={1} maxLength={60} placeholder="Wie sollen wir dich nennen?" /></div>
            </label>
          )}
          <label>
            <span>E-Mail-Adresse</span>
            <div><AtSign size={18} /><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" placeholder="name@beispiel.de" /></div>
          </label>
          <label>
            <span>Passwort</span>
            <div><LockKeyhole size={18} /><input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={8} autoComplete={mode === 'register' ? 'new-password' : 'current-password'} placeholder="Mindestens 8 Zeichen" /></div>
          </label>

          {error && <div className="account-alert error"><AlertCircle size={18} /><span>{error}</span></div>}
          {message && <div className="account-alert success"><CheckCircle2 size={18} /><span>{message}</span></div>}

          <button className="account-primary-button" type="submit" disabled={busy}>
            {busy ? <LoaderCircle className="spin" size={19} /> : mode === 'register' ? <Sparkles size={19} /> : <LogIn size={19} />}
            {busy ? 'Wird verarbeitet …' : mode === 'register' ? 'Kostenloses Konto erstellen' : 'Anmelden'}
          </button>
          <button className="account-magic-button" type="button" onClick={magicLink} disabled={busy}>
            <Mail size={18} /> Stattdessen Magic Link senden
          </button>
        </form>
      </section>

      <section className="account-security-note">
        <ShieldCheck size={21} />
        <div><strong>Geschützte Nutzerdaten</strong><span>Row Level Security sorgt dafür, dass jedes Konto ausschließlich seine eigenen SpeechCoach-Daten lesen und verändern kann.</span></div>
      </section>
    </main>
  )
}

function SignedInAccount() {
  const { user, profile, syncStatus, syncNow, saveProfile, signOut } = useAuth()
  const [form, setForm] = useState({
    displayName: profile?.displayName || '',
    weeklyGoal: profile?.weeklyGoal || 5,
    syncEnabled: profile?.syncEnabled !== false,
    storeTranscripts: profile?.storeTranscripts === true,
  })
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    setForm({
      displayName: profile?.displayName || '',
      weeklyGoal: profile?.weeklyGoal || 5,
      syncEnabled: profile?.syncEnabled !== false,
      storeTranscripts: profile?.storeTranscripts === true,
    })
  }, [profile])

  const save = async () => {
    setBusy('save')
    setError('')
    setMessage('')
    try {
      await saveProfile(form)
      setMessage('Einstellungen gespeichert.')
    } catch (saveError) {
      setError(saveError?.message || 'Einstellungen konnten nicht gespeichert werden.')
    } finally {
      setBusy('')
    }
  }

  const synchronize = async () => {
    setBusy('sync')
    setError('')
    setMessage('')
    try {
      const result = await syncNow()
      setMessage(`${result?.cloudTotal || 0} Cloud-Trainings verfügbar. ${result?.downloaded || 0} neu auf dieses Gerät geladen.`)
    } catch (syncError) {
      setError(syncError?.message || 'Synchronisierung fehlgeschlagen.')
    } finally {
      setBusy('')
    }
  }

  const logout = async () => {
    setBusy('logout')
    setError('')
    try {
      await signOut()
    } catch (logoutError) {
      setError(logoutError?.message || 'Abmeldung fehlgeschlagen.')
      setBusy('')
    }
  }

  const syncLabel = syncStatus?.status === 'syncing'
    ? 'Synchronisierung läuft'
    : syncStatus?.status === 'error'
      ? 'Synchronisierung gestört'
      : form.syncEnabled
        ? 'Cloud-Sync aktiv'
        : 'Cloud-Sync pausiert'

  return (
    <main className="account-content account-dashboard-content">
      <section className="account-profile-hero">
        <div className="account-avatar">{(profile?.displayName || user?.email || 'S').slice(0, 1).toUpperCase()}</div>
        <div>
          <div className="account-eyebrow"><CheckCircle2 size={15} /> Angemeldet</div>
          <h1>{profile?.displayName || 'SpeechCoach Nutzer'}</h1>
          <p>{user?.email}</p>
        </div>
        <div className={`account-sync-badge ${syncStatus?.status === 'error' ? 'error' : ''}`}>
          {form.syncEnabled ? <Cloud size={18} /> : <CloudOff size={18} />}
          <div><strong>{syncLabel}</strong><span>{formatSyncTime(syncStatus?.lastSyncAt)}</span></div>
        </div>
      </section>

      <div className="account-dashboard-grid">
        <section className="account-panel">
          <div className="account-panel-heading"><div><span>Profil</span><h2>Persönliche Einstellungen</h2></div><UserRound size={21} /></div>
          <label className="account-setting-field">
            <span>Anzeigename</span>
            <input value={form.displayName} maxLength={60} onChange={(event) => setForm((current) => ({ ...current, displayName: event.target.value }))} />
          </label>
          <label className="account-setting-field">
            <span>Wöchentliches Trainingsziel</span>
            <div className="account-goal-input"><input type="number" min="1" max="50" value={form.weeklyGoal} onChange={(event) => setForm((current) => ({ ...current, weeklyGoal: event.target.value }))} /><small>Übungen pro Woche</small></div>
          </label>
        </section>

        <section className="account-panel">
          <div className="account-panel-heading"><div><span>Datenschutz</span><h2>Cloud-Synchronisierung</h2></div><ShieldCheck size={21} /></div>
          <label className="account-toggle-row">
            <div><strong>Fortschritt synchronisieren</strong><span>Überträgt Solo-, Dialog- und Audio-Kennzahlen auf deine Geräte.</span></div>
            <input type="checkbox" checked={form.syncEnabled} onChange={(event) => setForm((current) => ({ ...current, syncEnabled: event.target.checked }))} />
          </label>
          <label className="account-toggle-row">
            <div><strong>Transkripte speichern</strong><span>Standardmäßig werden nur Kennzahlen synchronisiert. Audiodateien werden niemals hochgeladen.</span></div>
            <input type="checkbox" checked={form.storeTranscripts} onChange={(event) => setForm((current) => ({ ...current, storeTranscripts: event.target.checked }))} />
          </label>
          <div className="account-privacy-footnote"><KeyRound size={17} /> Keine Audioaufnahme wird im SpeechCoach-Cloudverlauf gespeichert.</div>
        </section>
      </div>

      {error && <div className="account-alert error"><AlertCircle size={18} /><span>{error}</span></div>}
      {message && <div className="account-alert success"><CheckCircle2 size={18} /><span>{message}</span></div>}

      <section className="account-action-bar">
        <button className="account-primary-button" onClick={save} disabled={Boolean(busy)}>{busy === 'save' ? <LoaderCircle className="spin" size={19} /> : <Save size={19} />} Einstellungen speichern</button>
        <button className="account-secondary-button" onClick={synchronize} disabled={Boolean(busy) || !form.syncEnabled}>{busy === 'sync' ? <LoaderCircle className="spin" size={19} /> : <RefreshCw size={19} />} Jetzt synchronisieren</button>
        <button className="account-logout-button" onClick={logout} disabled={Boolean(busy)}>{busy === 'logout' ? <LoaderCircle className="spin" size={18} /> : <LogOut size={18} />} Abmelden</button>
      </section>
    </main>
  )
}

export default function AccountCenter({ onClose }) {
  const { configured, loading, signedIn, authError } = useAuth()

  return (
    <motion.div className="account-overlay" role="dialog" aria-modal="true" aria-label="Konto und Cloud" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div className="account-shell" initial={{ opacity: 0, y: 18, scale: 0.99 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 12, scale: 0.99 }}>
        <AccountHeader onClose={onClose} />
        {!configured ? (
          <main className="account-content account-unavailable">
            <CloudOff size={38} />
            <h1>Cloud ist nicht konfiguriert.</h1>
            <p>Solo-Training, Audio-Labor und Live-Coach funktionieren weiterhin vollständig lokal.</p>
          </main>
        ) : loading ? (
          <main className="account-content account-loading"><LoaderCircle className="spin" size={34} /><h1>Konto wird geladen …</h1></main>
        ) : signedIn ? (
          <SignedInAccount />
        ) : (
          <>
            {authError && <div className="account-global-error"><AlertCircle size={18} /> {authError}</div>}
            <AuthForm />
          </>
        )}
      </motion.div>
    </motion.div>
  )
}
