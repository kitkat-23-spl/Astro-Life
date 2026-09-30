import { Component, type ErrorInfo, type ReactNode } from 'react'

interface State { error: Error | null }

/**
 * Shows a recoverable message instead of a blank page if a page crashes.
 * The technical detail is displayed so users can report it.
 */
export default class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Astro Life page error:', error, info.componentStack)
  }

  render() {
    const { error } = this.state
    if (!error) return this.props.children
    const base = import.meta.env.BASE_URL
    return (
      <div className="page-head center" role="alert">
        <p className="eyebrow">Something went wrong</p>
        <h1>This page couldn’t be displayed</h1>
        <p className="lede">
          If your browser is translating this page or an extension is changing it, please turn that off for this site and reload.
        </p>
        <div className="row" style={{ justifyContent: 'center' }}>
          <button className="btn primary" onClick={() => window.location.reload()}>Reload page</button>
          <a className="btn ghost" href={base}>Go to home</a>
        </div>
        <details className="small muted" style={{ marginTop: 16, maxWidth: 640 }}>
          <summary>Technical details (share these if the problem continues)</summary>
          <pre style={{ whiteSpace: 'pre-wrap', textAlign: 'left' }}>{`${error.name}: ${error.message}\n${navigator.userAgent}\n${window.location.pathname}`}</pre>
        </details>
      </div>
    )
  }
}
