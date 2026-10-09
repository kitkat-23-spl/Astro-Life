import { useEffect } from 'react'
import { Link, NavLink, Route, Routes, useLocation } from 'react-router-dom'
import ErrorBoundary from './components/ErrorBoundary'
import UserMenu from './components/UserMenu'
import AccountPage from './pages/AccountPage'
import AnnualPage from './pages/AnnualPage'
import ChartPage from './pages/ChartPage'
import HomePage from './pages/HomePage'
import LearnPage from './pages/LearnPage'
import LessonPage from './pages/LessonPage'
import MatchPage from './pages/MatchPage'
import NotFound from './pages/NotFound'
import PanchangPage from './pages/PanchangPage'
import PrivacyPage from './pages/PrivacyPage'
import ReportPage from './pages/ReportPage'
import SettingsPage from './pages/SettingsPage'

export default function App() {
  const { pathname } = useLocation()
  // Braces matter: newer browsers return a Promise from scrollTo, which React would treat as a cleanup function.
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return (
    <div className="app">
      <a className="skip" href="#main">Skip to content</a>
      <header className="site-header">
        <div className="container header-inner">
          <Link to="/" className="brand" aria-label="Astro Life home">
            <Logo />
            <span>Astro Life</span>
          </Link>
          <nav className="main-nav" aria-label="Main">
            <NavLink to="/chart">Kundali</NavLink>
            <NavLink to="/panchang">Panchang</NavLink>
            <NavLink to="/match">Match</NavLink>
            <NavLink to="/learn">Learn</NavLink>
          </nav>
          <NavLink to="/settings" className="icon-link" aria-label="Settings" title="Settings">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
            </svg>
          </NavLink>
          <UserMenu />
        </div>
      </header>
      <main id="main" className="container">
        <ErrorBoundary key={pathname}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/chart" element={<ChartPage />} />
            <Route path="/chart/annual" element={<AnnualPage />} />
            <Route path="/chart/:report" element={<ReportPage />} />
            <Route path="/panchang" element={<PanchangPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/match" element={<MatchPage />} />
            <Route path="/learn" element={<LearnPage />} />
            <Route path="/learn/:slug" element={<LessonPage />} />
            <Route path="/account" element={<AccountPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </ErrorBoundary>
      </main>
      <footer className="site-footer">
        <div className="container footer-inner">
          <span>© {new Date().getFullYear()} Astro Life</span>
          <nav aria-label="Footer">
            <Link to="/chart">Kundali</Link>
            <Link to="/panchang">Panchang</Link>
            <Link to="/match">Match</Link>
            <Link to="/learn">Learn</Link>
            <Link to="/settings">Settings</Link>
            <Link to="/privacy">Privacy</Link>
          </nav>
        </div>
      </footer>
    </div>
  )
}

export function Logo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" className="logo">
      <circle cx="16" cy="16" r="14" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="16" cy="16" r="9" fill="none" stroke="currentColor" strokeWidth="1" opacity=".6" />
      <line x1="2" y1="16" x2="30" y2="16" stroke="currentColor" strokeWidth="1" opacity=".6" />
      <circle cx="16" cy="7" r="2.6" fill="var(--gold)" />
    </svg>
  )
}
