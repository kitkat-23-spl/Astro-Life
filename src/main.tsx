import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import ErrorBoundary from './components/ErrorBoundary'
import { installDomGuard } from './lib/domGuard'
import { AuthProvider } from './lib/auth'
import '@fontsource-variable/fraunces'
import '@fontsource-variable/plus-jakarta-sans'
import './styles.css'

installDomGuard()

// GitHub Pages serves 404.html for deep links; it stashes the path so we can restore it.
try {
  const redirect = sessionStorage.getItem('astrolife:redirect')
  if (redirect) {
    sessionStorage.removeItem('astrolife:redirect')
    history.replaceState(null, '', redirect)
  }
} catch {
  // Storage blocked (strict privacy settings): deep links fall back to the home page.
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '')}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>,
)
