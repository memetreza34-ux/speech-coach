import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Bot, MessageCircleMore, Sparkles } from 'lucide-react'
import App from './App.jsx'
import ConversationCoach from './ConversationCoach.jsx'
import './conversation.css'

export default function RootApp() {
  const [coachOpen, setCoachOpen] = useState(false)

  return (
    <>
      {!coachOpen && <App />}

      <AnimatePresence>
        {!coachOpen && (
          <motion.button
            className="coach-launcher"
            onClick={() => setCoachOpen(true)}
            initial={{ opacity: 0, scale: 0.86, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ delay: 0.45 }}
            whileHover={{ y: -3 }}
            whileTap={{ scale: 0.97 }}
          >
            <span className="coach-launcher-icon"><Bot size={22} /></span>
            <span className="coach-launcher-copy">
              <small><Sparkles size={12} /> Neu</small>
              <strong>Live-Coach</strong>
              <em>Gespräch mit Rückfragen</em>
            </span>
            <MessageCircleMore size={20} />
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {coachOpen && <ConversationCoach key="live-coach" onClose={() => setCoachOpen(false)} />}
      </AnimatePresence>
    </>
  )
}
