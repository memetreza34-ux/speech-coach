import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  AlertCircle,
  AtSign,
  CheckCircle2,
  Cloud,
  CloudOff,
  Database,
  Download,
  FileJson,
  KeyRound,
  LoaderCircle,
  LockKeyhole,
  LogIn,
  LogOut,
  Mail,
  MailCheck,
  MonitorSmartphone,
  RefreshCw,
  Save,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserRound,
  X,
} from 'lucide-react'
import { useAuth } from './cloud/AuthContext'

const DELETE_ACCOUNT_TEXT = 'KONTO LÖSCHEN'
const DELETE_CLOUD_TEXT = 'CLOUD LÖSCHEN'
const DELETE_LOCAL_TEXT = 'LOKAL LÖSCHEN'

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

const downloadJson = (data, filename) => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

function AccountHeader({ onClose }) {
  return (
    <header className="account-header">
      <div className="account-header-title">
        <span><UserRound size={20} /></span>
        <div><strong>Konto & Datenschutz</strong><small>Sicherheit, Cloud und Datenkontrolle</small></div>
      </div>
      <button onClick={onClose} aria-label="Konto schließen"><X size={20} /></button>
    </header>
  )
}

function RecoveryForm() {
  const { updatePassword, cancelPasswordRecovery } = useAuth()
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const submit = async (event) => {
    event.preventDefault()
    if (password !== confirmation) {
      setError('Die beiden Passwörter stimmen nicht überein.')
      return
    }
    setBusy(true)
    setError('')
    setMessage('')
    try {
      await updatePassword({ password })
      setMessage('Dein Passwort wurde geändert. Du kannst das Konto jetzt normal verwenden.')
      setPassword('')
      setConfirmation('')
    } catch (submitError) {
      setError(submitError?.message || 'Passwort konnte nicht geändert werden.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="account-content account-auth-content">
      <section className="account-auth-intro">
        <div className="account-eyebrow"><KeyRound size={15} /> Passwortwiederherstellung</div>
        <h1>Lege ein <span>neues Passwort</span> fest.</h1>
        <p>Der Wiederherstellungslink hat eine geschützte Sitzung geöffnet. Nach dem Speichern wird der Wiederherstellungsmodus beendet.</p>
      </section>
      <section className="account-auth-card account-recovery-card">
        <form onSubmit={submit}>
          <label>
            <span>Neues Passwort</span>
            <div><LockKeyhole size={18} /><input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={8} autoComplete="new-password" placeholder="Mindestens 8 Zeichen" /></div>
          </label>
          <label>
            <span>Passwort wiederholen</span>
            <div><ShieldCheck size={18} /><input type="password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} required minLength={8} autoComplete="new-password" placeholder="Erneut eingeben" /></div>
          </label>
          {error && <div className="account-alert error"><AlertCircle size={18} /><span>{error}</span></div>}
          {message && <div className="account-alert success"><CheckCircle2 size={18} /><span>{message}</span></div>}
          <button className="account-primary-button" type="submit" disabled={busy}>
            {busy ? <LoaderCircle className="spin" size={19} /> : <KeyRound size={19} />} Neues Passwort speichern
          </button>
          <button className="account-magic-button" type="button" onClick={cancelPasswordRecovery} disabled={busy}>Wiederherstellung verlassen</button>
        </form>
      </section>
    </main>
  )
}

function AuthForm() {
  const { signIn, signUp, sendMagicLink, requestPasswordReset } = useAuth()
  const [mode, setMode] = useState('login')
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const resetFeedback = () => {
    setError('')
    setMessage('')
  }

  const submit = async (event) => {
    event.preventDefault()
    setBusy(true)
    resetFeedback()

    try {
      if (mode === 'register') {
        const result = await signUp({ email, password, displayName })
        setMessage(result.needsConfirmation
          ? 'Konto erstellt. Bestätige jetzt die E-Mail, bevor du dich anmeldest.'
          : 'Konto erstellt und angemeldet.')
      } else if (mode === 'reset') {
        await requestPasswordReset(email)
        setMessage('Wenn die Adresse zu einem Konto gehört, wurde ein Wiederherstellungslink versendet.')
      } else {
        await signIn({ email, password })
      }
    } catch (submitError) {
      setError(submitError?.message || 'Aktion fehlgeschlagen.')
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
    resetFeedback()
    try {
      await sendMagicLink(email)
      setMessage('Der Anmeldelink wurde an deine E-Mail-Adresse gesendet.')
    } catch (linkError) {
      setError(linkError?.message || 'Magic Link konnte nicht gesendet werden.')
    } finally {
      setBusy(false)
    }
  }

  const title = mode === 'register' ? 'Kostenlos registrieren' : mode === 'reset' ? 'Passwort zurücksetzen' : 'Sicher anmelden'

  return (
    <main className="account-content account-auth-content">
      <section className="account-auth-intro">
        <div className="account-eyebrow"><Cloud size={15} /> Optionales Cloud-Konto</div>
        <h1>Dein Training auf <span>jedem Gerät.</span></h1>
        <p>SpeechCoach bleibt ohne Anmeldung nutzbar. Ein Konto synchronisiert ausschließlich deinen Fortschritt und deine gewählten Einstellungen.</p>
      </section>

      <section className="account-auth-card">
        <div className="account-auth-tabs">
          <button className={mode === 'login' ? 'active' : ''} onClick={() => { setMode('login'); resetFeedback() }}>Anmelden</button>
          <button className={mode === 'register' ? 'active' : ''} onClick={() => { setMode('register'); resetFeedback() }}>Registrieren</button>
        </div>
        <div className="account-form-title"><strong>{title}</strong>{mode === 'reset' && <span>Wir senden dir einen geschützten Link.</span>}</div>

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
          {mode !== 'reset' && (
            <label>
              <span>Passwort</span>
              <div><LockKeyhole size={18} /><input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={8} autoComplete={mode === 'register' ? 'new-password' : 'current-password'} placeholder="Mindestens 8 Zeichen" /></div>
            </label>
          )}

          {error && <div className="account-alert error"><AlertCircle size={18} /><span>{error}</span></div>}
          {message && <div className="account-alert success"><CheckCircle2 size={18} /><span>{message}</span></div>}

          <button className="account-primary-button" type="submit" disabled={busy}>
            {busy ? <LoaderCircle className="spin" size={19} /> : mode === 'register' ? <Sparkles size={19} /> : mode === 'reset' ? <MailCheck size={19} /> : <LogIn size={19} />}
            {busy ? 'Wird verarbeitet …' : mode === 'register' ? 'Konto erstellen' : mode === 'reset' ? 'Wiederherstellungslink senden' : 'Anmelden'}
          </button>
          {mode === 'login' && (
            <>
              <button className="account-magic-button" type="button" onClick={magicLink} disabled={busy}><Mail size={18} /> Stattdessen Magic Link senden</button>
              <button className="account-text-button" type="button" onClick={() => { setMode('reset'); resetFeedback() }}>Passwort vergessen?</button>
            </>
          )}
          {mode === 'reset' && <button className="account-text-button" type="button" onClick={() => { setMode('login'); resetFeedback() }}>Zurück zur Anmeldung</button>}
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
  const {
    user,
    profile,
    syncStatus,
    syncNow,
    saveProfile,
    signOut,
    updateEmail,
    updatePassword,
    exportData,
    removeCloudTraining,
    removeLocalTraining,
    deleteAccount,
  } = useAuth()
  const [activeTab, setActiveTab] = useState('profile')
  const [form, setForm] = useState({
    displayName: profile?.displayName || '',
    weeklyGoal: profile?.weeklyGoal || 5,
    syncEnabled: profile?.syncEnabled !== false,
    storeTranscripts: profile?.storeTranscripts === true,
  })
  const [securityForm, setSecurityForm] = useState({
    email: user?.email || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [cloudConfirm, setCloudConfirm] = useState('')
  const [localConfirm, setLocalConfirm] = useState('')
  const [deleteEmail, setDeleteEmail] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState('')
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

  useEffect(() => {
    setSecurityForm((current) => ({ ...current, email: user?.email || '' }))
  }, [user?.email])

  const feedback = (type, value) => {
    setError(type === 'error' ? value : '')
    setMessage(type === 'success' ? value : '')
  }

  const run = async (key, action, successMessage) => {
    setBusy(key)
    feedback('', '')
    try {
      const result = await action()
      if (successMessage) setMessage(typeof successMessage === 'function' ? successMessage(result) : successMessage)
      return result
    } catch (actionError) {
      setError(actionError?.message || 'Aktion konnte nicht ausgeführt werden.')
      return null
    } finally {
      setBusy('')
    }
  }

  const save = () => run('save', () => saveProfile(form), 'Einstellungen gespeichert.')
  const synchronize = () => run('sync', syncNow, (result) => `${result?.cloudTotal || 0} Cloud-Trainings verfügbar. ${result?.downloaded || 0} neu auf dieses Gerät geladen.`)
  const logout = () => run('logout', signOut)

  const changeEmail = async () => {
    if (securityForm.email.trim().toLowerCase() === String(user?.email || '').toLowerCase()) {
      setError('Gib eine neue E-Mail-Adresse ein.')
      return
    }
    await run('email', () => updateEmail(securityForm.email), 'Die Änderung wurde gestartet. Je nach Supabase-Einstellung müssen die alte und die neue Adresse bestätigt werden.')
  }

  const changePassword = async () => {
    if (securityForm.newPassword !== securityForm.confirmPassword) {
      setError('Die neuen Passwörter stimmen nicht überein.')
      return
    }
    const result = await run('password', () => updatePassword({
      password: securityForm.newPassword,
      currentPassword: securityForm.currentPassword,
    }), 'Passwort erfolgreich geändert.')
    if (result) setSecurityForm((current) => ({ ...current, currentPassword: '', newPassword: '', confirmPassword: '' }))
  }

  const exportAllData = async () => {
    const data = await run('export', exportData)
    if (!data) return
    const stamp = new Date().toISOString().slice(0, 10)
    downloadJson(data, `speechcoach-datenexport-${stamp}.json`)
    setMessage('Datenexport wurde erstellt. Audiodateien sind nicht enthalten.')
  }

  const deleteCloud = async () => {
    if (cloudConfirm !== DELETE_CLOUD_TEXT) return
    const result = await run('delete-cloud', removeCloudTraining)
    if (result) {
      setCloudConfirm('')
      setForm((current) => ({ ...current, syncEnabled: false }))
      setMessage(`${result.deleted || 0} Cloud-Trainings gelöscht. Die Synchronisierung wurde pausiert, damit sie nicht automatisch erneut hochgeladen werden.`)
    }
  }

  const deleteLocal = async () => {
    if (localConfirm !== DELETE_LOCAL_TEXT) return
    await run('delete-local', async () => removeLocalTraining(), 'Lokaler Trainingsverlauf auf diesem Gerät gelöscht.')
    setLocalConfirm('')
  }

  const deleteCompleteAccount = async () => {
    if (deleteConfirm !== DELETE_ACCOUNT_TEXT || deleteEmail.trim().toLowerCase() !== String(user?.email || '').toLowerCase()) return
    await run('delete-account', () => deleteAccount({ email: deleteEmail, confirmation: deleteConfirm }))
  }

  const syncLabel = syncStatus?.status === 'syncing'
    ? 'Synchronisierung läuft'
    : syncStatus?.status === 'error'
      ? 'Synchronisierung gestört'
      : form.syncEnabled
        ? 'Cloud-Sync aktiv'
        : 'Cloud-Sync pausiert'

  const localCounts = useMemo(() => {
    const read = (key) => {
      try { return JSON.parse(localStorage.getItem(key) || '[]').length } catch { return 0 }
    }
    return {
      solo: read('speech-coach-history'),
      dialog: read('speech-coach-dialog-history'),
      audio: read('speech-coach-audio-history'),
    }
  }, [message, syncStatus?.lastSyncAt])

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

      <nav className="account-section-tabs" aria-label="Kontobereiche">
        <button className={activeTab === 'profile' ? 'active' : ''} onClick={() => setActiveTab('profile')}><Settings size={17} /> Profil</button>
        <button className={activeTab === 'security' ? 'active' : ''} onClick={() => setActiveTab('security')}><KeyRound size={17} /> Sicherheit</button>
        <button className={activeTab === 'privacy' ? 'active' : ''} onClick={() => setActiveTab('privacy')}><ShieldCheck size={17} /> Datenschutz</button>
      </nav>

      {error && <div className="account-alert error"><AlertCircle size={18} /><span>{error}</span></div>}
      {message && <div className="account-alert success"><CheckCircle2 size={18} /><span>{message}</span></div>}

      {activeTab === 'profile' && (
        <>
          <div className="account-dashboard-grid">
            <section className="account-panel">
              <div className="account-panel-heading"><div><span>Profil</span><h2>Persönliche Einstellungen</h2></div><UserRound size={21} /></div>
              <label className="account-setting-field"><span>Anzeigename</span><input value={form.displayName} maxLength={60} onChange={(event) => setForm((current) => ({ ...current, displayName: event.target.value }))} /></label>
              <label className="account-setting-field"><span>Wöchentliches Trainingsziel</span><div className="account-goal-input"><input type="number" min="1" max="50" value={form.weeklyGoal} onChange={(event) => setForm((current) => ({ ...current, weeklyGoal: event.target.value }))} /><small>Übungen pro Woche</small></div></label>
            </section>
            <section className="account-panel">
              <div className="account-panel-heading"><div><span>Geräte</span><h2>Synchronisierung</h2></div><MonitorSmartphone size={21} /></div>
              <label className="account-toggle-row"><div><strong>Fortschritt synchronisieren</strong><span>Verbindet Solo-, Dialog- und Audio-Kennzahlen auf deinen Geräten.</span></div><input type="checkbox" checked={form.syncEnabled} onChange={(event) => setForm((current) => ({ ...current, syncEnabled: event.target.checked }))} /></label>
              <button className="account-secondary-button account-panel-button" onClick={synchronize} disabled={Boolean(busy) || !form.syncEnabled}>{busy === 'sync' ? <LoaderCircle className="spin" size={19} /> : <RefreshCw size={19} />} Jetzt synchronisieren</button>
            </section>
          </div>
          <section className="account-action-bar"><button className="account-primary-button" onClick={save} disabled={Boolean(busy)}>{busy === 'save' ? <LoaderCircle className="spin" size={19} /> : <Save size={19} />} Einstellungen speichern</button><button className="account-logout-button" onClick={logout} disabled={Boolean(busy)}>{busy === 'logout' ? <LoaderCircle className="spin" size={18} /> : <LogOut size={18} />} Abmelden</button></section>
        </>
      )}

      {activeTab === 'security' && (
        <div className="account-security-grid">
          <section className="account-panel">
            <div className="account-panel-heading"><div><span>E-Mail</span><h2>Anmeldeadresse ändern</h2></div><MailCheck size={21} /></div>
            <p className="account-panel-description">Supabase kann je nach Projekteinstellung Bestätigungslinks an die bisherige und die neue Adresse senden.</p>
            <label className="account-setting-field"><span>Neue E-Mail-Adresse</span><input type="email" value={securityForm.email} onChange={(event) => setSecurityForm((current) => ({ ...current, email: event.target.value }))} /></label>
            <button className="account-primary-button account-panel-button" onClick={changeEmail} disabled={Boolean(busy)}>{busy === 'email' ? <LoaderCircle className="spin" size={18} /> : <Mail size={18} />} E-Mail-Änderung starten</button>
          </section>

          <section className="account-panel">
            <div className="account-panel-heading"><div><span>Passwort</span><h2>Passwort ändern</h2></div><KeyRound size={21} /></div>
            <label className="account-setting-field"><span>Aktuelles Passwort</span><input type="password" autoComplete="current-password" value={securityForm.currentPassword} onChange={(event) => setSecurityForm((current) => ({ ...current, currentPassword: event.target.value }))} /></label>
            <label className="account-setting-field"><span>Neues Passwort</span><input type="password" minLength={8} autoComplete="new-password" value={securityForm.newPassword} onChange={(event) => setSecurityForm((current) => ({ ...current, newPassword: event.target.value }))} /></label>
            <label className="account-setting-field"><span>Neues Passwort wiederholen</span><input type="password" minLength={8} autoComplete="new-password" value={securityForm.confirmPassword} onChange={(event) => setSecurityForm((current) => ({ ...current, confirmPassword: event.target.value }))} /></label>
            <button className="account-primary-button account-panel-button" onClick={changePassword} disabled={Boolean(busy) || securityForm.newPassword.length < 8}>{busy === 'password' ? <LoaderCircle className="spin" size={18} /> : <LockKeyhole size={18} />} Passwort ändern</button>
          </section>

          <section className="account-security-summary">
            <ShieldCheck size={22} />
            <div><strong>Sicherheitsstatus</strong><span>Aktive Sitzung serverseitig validiert · Passwortänderung mit aktuellem Passwort · Konto-Löschung nur über geschützte Serverfunktion</span></div>
          </section>
        </div>
      )}

      {activeTab === 'privacy' && (
        <div className="account-privacy-stack">
          <section className="account-panel account-data-overview">
            <div className="account-panel-heading"><div><span>Datenübersicht</span><h2>Was auf diesem Gerät liegt</h2></div><Database size={21} /></div>
            <div className="account-data-counts">
              <div><strong>{localCounts.solo}</strong><span>Solo-Trainings</span></div>
              <div><strong>{localCounts.dialog}</strong><span>Dialoge</span></div>
              <div><strong>{localCounts.audio}</strong><span>Audioanalysen</span></div>
            </div>
            <label className="account-toggle-row"><div><strong>Transkripte in neuen Cloud-Sitzungen speichern</strong><span>Standardmäßig bleiben Transkripte lokal. Audiodateien werden grundsätzlich nie hochgeladen.</span></div><input type="checkbox" checked={form.storeTranscripts} onChange={(event) => setForm((current) => ({ ...current, storeTranscripts: event.target.checked }))} /></label>
            <button className="account-secondary-button account-panel-button" onClick={save} disabled={Boolean(busy)}>{busy === 'save' ? <LoaderCircle className="spin" size={18} /> : <Save size={18} />} Datenschutzoption speichern</button>
          </section>

          <section className="account-panel account-export-card">
            <div className="account-panel-heading"><div><span>Datenportabilität</span><h2>Persönliche Daten exportieren</h2></div><FileJson size={21} /></div>
            <p className="account-panel-description">Erstellt eine JSON-Datei mit Kontoprofil, lokalen Trainings und Cloud-Datensätzen. Temporäre Audiodateien sind nicht enthalten.</p>
            <button className="account-primary-button account-panel-button" onClick={exportAllData} disabled={Boolean(busy)}>{busy === 'export' ? <LoaderCircle className="spin" size={18} /> : <Download size={18} />} Datenexport herunterladen</button>
          </section>

          <section className="account-danger-zone">
            <div className="account-danger-heading"><ShieldAlert size={23} /><div><span>Gefahrenbereich</span><h2>Daten oder Konto löschen</h2></div></div>

            <div className="account-danger-action">
              <div><strong>Cloud-Trainings löschen</strong><span>Löscht alle synchronisierten Trainings, behält aber Konto und lokale Daten. Cloud-Sync wird automatisch pausiert.</span></div>
              <div className="account-confirm-row"><input value={cloudConfirm} onChange={(event) => setCloudConfirm(event.target.value)} placeholder={DELETE_CLOUD_TEXT} /><button onClick={deleteCloud} disabled={busy || cloudConfirm !== DELETE_CLOUD_TEXT}>{busy === 'delete-cloud' ? <LoaderCircle className="spin" size={17} /> : <CloudOff size={17} />} Cloud löschen</button></div>
            </div>

            <div className="account-danger-action">
              <div><strong>Lokalen Verlauf löschen</strong><span>Löscht die Trainingsdaten auf diesem Gerät und aus dem kontogetrennten Browser-Cache. Cloud-Daten bleiben bestehen.</span></div>
              <div className="account-confirm-row"><input value={localConfirm} onChange={(event) => setLocalConfirm(event.target.value)} placeholder={DELETE_LOCAL_TEXT} /><button onClick={deleteLocal} disabled={busy || localConfirm !== DELETE_LOCAL_TEXT}>{busy === 'delete-local' ? <LoaderCircle className="spin" size={17} /> : <MonitorSmartphone size={17} />} Lokal löschen</button></div>
            </div>

            <div className="account-danger-action critical">
              <div><strong>Konto endgültig löschen</strong><span>Löscht den Auth-Nutzer und durch Datenbank-Cascade alle SpeechCoach-Profile und Cloud-Trainings. Dieser Vorgang ist nicht rückgängig zu machen.</span></div>
              <div className="account-delete-fields"><input type="email" value={deleteEmail} onChange={(event) => setDeleteEmail(event.target.value)} placeholder={user?.email || 'Konto-E-Mail'} /><input value={deleteConfirm} onChange={(event) => setDeleteConfirm(event.target.value)} placeholder={DELETE_ACCOUNT_TEXT} /></div>
              <button className="account-delete-account-button" onClick={deleteCompleteAccount} disabled={busy || deleteConfirm !== DELETE_ACCOUNT_TEXT || deleteEmail.trim().toLowerCase() !== String(user?.email || '').toLowerCase()}>{busy === 'delete-account' ? <LoaderCircle className="spin" size={18} /> : <Trash2 size={18} />} Konto endgültig löschen</button>
            </div>
          </section>
        </div>
      )}
    </main>
  )
}

export default function AccountCenter({ onClose }) {
  const { configured, loading, signedIn, authError, passwordRecovery } = useAuth()

  return (
    <motion.div className="account-overlay" role="dialog" aria-modal="true" aria-label="Konto und Datenschutz" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div className="account-shell" initial={{ opacity: 0, y: 18, scale: 0.99 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 12, scale: 0.99 }}>
        <AccountHeader onClose={onClose} />
        {!configured ? (
          <main className="account-content account-unavailable"><CloudOff size={38} /><h1>Cloud ist nicht konfiguriert.</h1><p>Solo-Training, Audio-Labor und Live-Coach funktionieren weiterhin vollständig lokal.</p></main>
        ) : loading ? (
          <main className="account-content account-loading"><LoaderCircle className="spin" size={34} /><h1>Konto wird geladen …</h1></main>
        ) : passwordRecovery ? (
          <RecoveryForm />
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
