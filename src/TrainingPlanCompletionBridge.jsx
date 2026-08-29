import { useEffect } from 'react'
import { completeActiveTrainingPlanTaskFromHistory } from './trainingPlanStore'

export default function TrainingPlanCompletionBridge() {
  useEffect(() => {
    let active = true
    let running = false

    const check = async () => {
      if (!active || running) return
      running = true
      try {
        await completeActiveTrainingPlanTaskFromHistory()
      } finally {
        running = false
      }
    }

    const interval = window.setInterval(check, 1200)
    window.addEventListener('speechcoach:data-changed', check)
    check()

    return () => {
      active = false
      window.clearInterval(interval)
      window.removeEventListener('speechcoach:data-changed', check)
    }
  }, [])

  return null
}
