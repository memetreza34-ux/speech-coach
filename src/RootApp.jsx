import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, MotionConfig, motion, useReducedMotion } from 'framer-motion'
import {
  ArrowUpRight,
  AudioLines,
  BarChart3,
  Bot,
  CalendarRange,
  Cloud,
  CloudOff,
  LoaderCircle,
  MessageCircleMore,
  Sparkles,
  UserRound,
  Users,
} from 'lucide-react'
import App from './App.jsx'
import AccountCenter from './AccountCenter.jsx'
import AudioStudio from './AudioStudioPro.jsx'
import ConversationCoach from './ConversationCoach.jsx'
import ProgressDashboard from './ProgressDashboard.jsx'
import TeamCoach from './TeamCoach.jsx'
import TrainingPlanCenter from './TrainingPlanCenter.jsx'
import TrainingPlanCompletionBridge from './TrainingPlanCompletionBridge.jsx'
import { AuthProvider, useAuth } from './cloud/AuthContext.jsx'
import './conversation.css'
import './team-coach.css'
import './progress.css'
import './audio-lab.css'
import './audio-advanced.css'
import './account.css'
import './account-security.css'
import './training-plan.css'
import './launchers.css'
import './accessibility.css'

const VIEW_LABELS = {
  account: 'Konto und Cloud',
  plan: 'Vier-Wochen-Plan',
  progress: 'Fortschritt',
  audio: 'Audio-Labor Pro',
  'team-coach': 'Team-Coach',
  coach: 'Live-Coach',
}

const FOCUSABLE_SELECTOR = [
  'button:not([disabled])',
  'a[href]',
  'input:not([disabled])',
  'textarea:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ')

function SpeechCoachExperience() {
  const [activeView, setActiveView] = useState(null)
  const { signedIn, profile, syncStatus } = useAuth()
  const reduceMotion = useReducedMotion()
  const returnFocusRef = useRef(null)
  const appVisible = activeView === null

  const restoreLauncherFocus = useCallback(() => {
    window.requestAnimationFrame(() => {
      const focusKey = returnFocusRef.current
      const target = focusKey
        ? document.querySelector(`[data-focus-key="${focusKey}"]`)
        : document.querySelector('.feature-launchers button')
      if (target instanceof HTMLElement) target.focus()
      returnFocusRef.current = null
    })
  }, [])

  const openView = useCallback((view) => {
    if (activeView === null && document.activeElement instanceof HTMLElement) {
      returnFocusRef.current = document.activeElement.dataset.focusKey || null
    }
    setActiveView(view)
  }, [activeView])

  const openCoach = () => openView('coach')
  const openTeamCoach = () => openView('team-coach')
  const openProgress = () => openView('progress')
  const openPlan = () => openView('plan')
  const openAudio = () => openView('audio')
  const openAccount = () => openView('account')

  const closeOverlay = useCallback(() => {
    setActiveView(null)
    restoreLauncherFocus()
  }, [restoreLauncherFocus])

  useEffect(() => {
    if (!activeView) return undefined

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handleKeyDown = (event) => {
      if (event.key !== 'Escape' || event.defaultPrevented) return
      event.preventDefault()
      closeOverlay()
    }

    document.addEventListener('keydown', handleKeyDown)
    const focusFrame = window.requestAnimationFrame(() => {
      const firstInteractive = document.querySelector(FOCUSABLE_SELECTOR)
      if (firstInteractive instanceof HTMLElement) firstInteractive.focus()
    })

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      window.cancelAnimationFrame(focusFrame)
      document.body.style.overflow = previousOverflow
    }
  }, [activeView, closeOverlay])

  const AccountStatusIcon = syncStatus?.status === 'syncing'
    ? LoaderCircle
    : signedIn
      ? Cloud
      : CloudOff

  const launcherMotion = reduceMotion
    ? { initial: false, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: { duration: 0 } }
    : {
        initial: { opacity: 0, y: 18 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: 12 },
        transition: { delay: 0.4 },
      }

  return (
    <>
      <TrainingPlanCompletionBridge />
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {activeView ? `${VIEW_LABELS[activeView]} geöffnet` : 'Hauptansicht geöffnet'}
      </div>
      {appVisible && <App />}

      <AnimatePresence>
        {appVisible && (
          <motion.div
            className="feature-launchers"
            initial={launcherMotion.initial}
            animate={launcherMotion.animate}
            exit={launcherMotion.exit}
            transition={launcherMotion.transition}
          >
            <motion.button data-focus-key="account" className="account-launcher" onClick={openAccount} whileHover={reduceMotion ? undefined : { y: -3 }} whileTap={reduceMotion ? undefined : { scale: 0.98 }}>
              <span className="account-launcher-icon"><UserRound size={21} /></span>
              <span className="account-launcher-copy">
                <strong>{signedIn ? profile?.displayName || 'Mein Konto' : 'Konto & Cloud'}</strong>
                <small>{signedIn ? (syncStatus?.status === 'syncing' ? 'Synchronisierung läuft' : 'Fortschritt wird gesichert') : 'Optional geräteübergreifend'}</small>
              </span>
              <AccountStatusIcon className={syncStatus?.status === 'syncing' ? 'launcher-spin' : ''} size={18} />
            </motion.button>

            <motion.button data-focus-key="plan" className="plan-launcher" onClick={openPlan} whileHover={reduceMotion ? undefined : { y: -3 }} whileTap={reduceMotion ? undefined : { scale: 0.98 }}>
              <span className="plan-launcher-icon"><CalendarRange size={21} /></span>
              <span className="plan-launcher-copy"><strong>4-Wochen-Plan</strong><small>Adaptiv und täglich geführt</small></span>
              <ArrowUpRight size={18} />
            </motion.button>

            <motion.button data-focus-key="progress" className="progress-launcher" onClick={openProgress} whileHover={reduceMotion ? undefined : { y: -3 }} whileTap={reduceMotion ? undefined : { scale: 0.98 }}>
              <span className="progress-launcher-icon"><BarChart3 size={21} /></span>
              <span className="progress-launcher-copy"><strong>Fortschritt</strong><small>Profil und Trainingsplan</small></span>
              <ArrowUpRight size={18} />
            </motion.button>

            <motion.button data-focus-key="audio" className="audio-launcher" onClick={openAudio} whileHover={reduceMotion ? undefined : { y: -3 }} whileTap={reduceMotion ? undefined : { scale: 0.98 }}>
              <span className="audio-launcher-icon"><AudioLines size={22} /></span>
              <span className="audio-launcher-copy"><strong>Audio-Labor Pro</strong><small>Stimme, Pitch und Pausen</small></span>
              <ArrowUpRight size={18} />
            </motion.button>

            <motion.button data-focus-key="team-coach" className="team-launcher" onClick={openTeamCoach} whileHover={reduceMotion ? undefined : { y: -3 }} whileTap={reduceMotion ? undefined : { scale: 0.97 }}>
              <span className="team-launcher-icon"><Users size={22} /></span>
              <span className="team-launcher-copy"><small><Sparkles size={12} /> Mehrpersonen</small><strong>Team-Coach</strong><em>Mehrere Rollen gleichzeitig</em></span>
              <MessageCircleMore size={20} />
            </motion.button>

            <motion.button data-focus-key="coach" className="coach-launcher" onClick={openCoach} whileHover={reduceMotion ? undefined : { y: -3 }} whileTap={reduceMotion ? undefined : { scale: 0.97 }}>
              <span className="coach-launcher-icon"><Bot size={22} /></span>
              <span className="coach-launcher-copy"><small><Sparkles size={12} /> Interaktiv</small><strong>Live-Coach</strong><em>Gespräch mit Rückfragen</em></span>
              <MessageCircleMore size={20} />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {activeView === 'account' && <AccountCenter key="account-center" onClose={closeOverlay} />}
        {activeView === 'plan' && (
          <TrainingPlanCenter
            key="training-plan"
            onClose={closeOverlay}
            onOpenCoach={openCoach}
            onOpenAudio={openAudio}
            onOpenSolo={closeOverlay}
          />
        )}
        {activeView === 'coach' && <ConversationCoach key="live-coach" onClose={closeOverlay} />}
        {activeView === 'team-coach' && <TeamCoach key="team-coach" onClose={closeOverlay} />}
        {activeView === 'audio' && <AudioStudio key="audio-studio" onClose={closeOverlay} />}
        {activeView === 'progress' && (
          <ProgressDashboard
            key="progress-dashboard"
            onClose={closeOverlay}
            onOpenPlan={openPlan}
            onOpenCoach={openCoach}
            onOpenAudio={openAudio}
            onOpenSolo={closeOverlay}
          />
        )}
      </AnimatePresence>
    </>
  )
}

export default function RootApp() {
  return (
    <MotionConfig reducedMotion="user">
      <AuthProvider>
        <SpeechCoachExperience />
      </AuthProvider>
    </MotionConfig>
  )
}
