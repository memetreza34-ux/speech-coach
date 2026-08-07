import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
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

function SpeechCoachExperience() {
  const [activeView, setActiveView] = useState(null)
  const { signedIn, profile, syncStatus } = useAuth()
  const appVisible = activeView === null

  const openCoach = () => setActiveView('coach')
  const openTeamCoach = () => setActiveView('team-coach')
  const openProgress = () => setActiveView('progress')
  const openPlan = () => setActiveView('plan')
  const openAudio = () => setActiveView('audio')
  const openAccount = () => setActiveView('account')
  const closeOverlay = () => setActiveView(null)

  const AccountStatusIcon = syncStatus?.status === 'syncing'
    ? LoaderCircle
    : signedIn
      ? Cloud
      : CloudOff

  return (
    <>
      <TrainingPlanCompletionBridge />
      {appVisible && <App />}

      <AnimatePresence>
        {appVisible && (
          <motion.div
            className="feature-launchers"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ delay: 0.4 }}
          >
            <motion.button className="account-launcher" onClick={openAccount} whileHover={{ y: -3 }} whileTap={{ scale: 0.98 }}>
              <span className="account-launcher-icon"><UserRound size={21} /></span>
              <span className="account-launcher-copy">
                <strong>{signedIn ? profile?.displayName || 'Mein Konto' : 'Konto & Cloud'}</strong>
                <small>{signedIn ? (syncStatus?.status === 'syncing' ? 'Synchronisierung läuft' : 'Fortschritt wird gesichert') : 'Optional geräteübergreifend'}</small>
              </span>
              <AccountStatusIcon className={syncStatus?.status === 'syncing' ? 'launcher-spin' : ''} size={18} />
            </motion.button>

            <motion.button className="plan-launcher" onClick={openPlan} whileHover={{ y: -3 }} whileTap={{ scale: 0.98 }}>
              <span className="plan-launcher-icon"><CalendarRange size={21} /></span>
              <span className="plan-launcher-copy"><strong>4-Wochen-Plan</strong><small>Adaptiv und täglich geführt</small></span>
              <ArrowUpRight size={18} />
            </motion.button>

            <motion.button className="progress-launcher" onClick={openProgress} whileHover={{ y: -3 }} whileTap={{ scale: 0.98 }}>
              <span className="progress-launcher-icon"><BarChart3 size={21} /></span>
              <span className="progress-launcher-copy"><strong>Fortschritt</strong><small>Profil und Trainingsplan</small></span>
              <ArrowUpRight size={18} />
            </motion.button>

            <motion.button className="audio-launcher" onClick={openAudio} whileHover={{ y: -3 }} whileTap={{ scale: 0.98 }}>
              <span className="audio-launcher-icon"><AudioLines size={22} /></span>
              <span className="audio-launcher-copy"><strong>Audio-Labor Pro</strong><small>Stimme, Pitch und Pausen</small></span>
              <ArrowUpRight size={18} />
            </motion.button>

            <motion.button className="team-launcher" onClick={openTeamCoach} whileHover={{ y: -3 }} whileTap={{ scale: 0.97 }}>
              <span className="team-launcher-icon"><Users size={22} /></span>
              <span className="team-launcher-copy"><small><Sparkles size={12} /> Mehrpersonen</small><strong>Team-Coach</strong><em>Mehrere Rollen gleichzeitig</em></span>
              <MessageCircleMore size={20} />
            </motion.button>

            <motion.button className="coach-launcher" onClick={openCoach} whileHover={{ y: -3 }} whileTap={{ scale: 0.97 }}>
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
    <AuthProvider>
      <SpeechCoachExperience />
    </AuthProvider>
  )
}
