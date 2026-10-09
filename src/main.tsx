import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import ErrorBoundary from './components/ErrorBoundary'
import { installDomGuard } from './lib/domGuard'
import { AuthProvider } from './lib/auth'
import { SettingsProvider } from './lib/settings'
import '@fontsource-variable/fraunces'
import '@fontsource-variable/plus-jakarta-sans'
import './styles.css'

installDomGuard()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '')}>
        <AuthProvider>
          <SettingsProvider>
            <App />
          </SettingsProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>,
)
