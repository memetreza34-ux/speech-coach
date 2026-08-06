import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowUpRight, AudioLines, BarChart3, Bot, MessageCircleMore, Sparkles } from 'lucide-react'
import App from './App.jsx'
import AudioStudio from './AudioStudio.jsx'
import ConversationCoach from './ConversationCoach.jsx'
import ProgressDashboard from './ProgressDashboard.jsx'
import './conversation.css'
import './progress.css'
import './audio-lab.css'
import './launchers.css'

export default function RootApp() {
  const [activeView, setActiveView] = useState(null)
  const appVisible = activeView === null

  const openCoach = () => setActiveView('coach')
  const openProgress = () => setActiveView('progress')
  const openAudio = () => setActiveView('audio')
  const closeOverlay = () => setActiveView(null)

  return (
    <>
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
            <motion.button
              className="progress-launcher"
              onClick={openProgress}
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.98 }}
            >
              <span className="progress-launcher-icon"><BarChart3 size={21} /></span>
              <span className="progress-launcher-copy">
                <strong>Fortschritt</strong>
                <small>Profil und Trainingsplan</small>
              </span>
              <ArrowUpRight size={18} />
            </motion.button>

            <motion.button
              className="audio-launcher"
              onClick={openAudio}
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.98 }}
            >
              <span className="audio-launcher-icon"><AudioLines size={22} /></span>
              <span className="audio-launcher-copy">
                <strong>Audio-Labor</strong>
                <small>Stimme, Dynamik und Pausen</small>
              </span>
              <ArrowUpRight size={18} />
            </motion.button>

            <motion.button
              className="coach-launcher"
              onClick={openCoach}
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.97 }}
            >
              <span className="coach-launcher-icon"><Bot size={22} /></span>
              <span className="coach-launcher-copy">
                <small><Sparkles size={12} /> Interaktiv</small>
                <strong>Live-Coach</strong>
                <em>Gespräch mit Rückfragen</em>
              </span>
              <MessageCircleMore size={20} />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {activeView === 'coach' && <ConversationCoach key="live-coach" onClose={closeOverlay} />}
        {activeView === 'audio' && <AudioStudio key="audio-studio" onClose={closeOverlay} />}
        {activeView === 'progress' && (
          <ProgressDashboard
            key="progress-dashboard"
            onClose={closeOverlay}
            onOpenCoach={openCoach}
            onOpenSolo={closeOverlay}
          />
        )}
      </AnimatePresence>
    </>
  )
}
