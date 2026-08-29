import { Component } from 'react'
import { AlertTriangle, Home, RefreshCw } from 'lucide-react'
import './error-boundary.css'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('SpeechCoach render failure', {
      message: error instanceof Error ? error.message : 'Unknown render error',
      componentStack: info?.componentStack || '',
    })
  }

  resetApp = () => {
    this.setState({ error: null })
  }

  reloadApp = () => {
    window.location.reload()
  }

  render() {
    if (!this.state.error) return this.props.children

    return (
      <main className="fatal-error-screen" role="alert">
        <section className="fatal-error-card">
          <div className="fatal-error-icon"><AlertTriangle size={28} /></div>
          <div className="fatal-error-eyebrow">SpeechCoach konnte diese Ansicht nicht laden</div>
          <h1>Die App wurde sicher angehalten.</h1>
          <p>Deine bereits gespeicherten Trainingsdaten bleiben erhalten. Du kannst die Oberfläche neu initialisieren oder die Seite vollständig neu laden.</p>
          <div className="fatal-error-actions">
            <button type="button" onClick={this.resetApp}><Home size={18} /> Oberfläche neu starten</button>
            <button type="button" onClick={this.reloadApp}><RefreshCw size={18} /> Seite neu laden</button>
          </div>
          {import.meta.env.DEV && (
            <details>
              <summary>Technische Details</summary>
              <code>{this.state.error instanceof Error ? this.state.error.message : String(this.state.error)}</code>
            </details>
          )}
        </section>
      </main>
    )
  }
}
