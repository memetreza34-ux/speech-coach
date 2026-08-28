import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import ErrorBoundary from './ErrorBoundary.jsx'
import RootApp from './RootApp.jsx'
import { normalizeLocalHistoryStores } from './localDataBootstrap.js'

normalizeLocalHistoryStores()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <RootApp />
    </ErrorBoundary>
  </StrictMode>,
)
