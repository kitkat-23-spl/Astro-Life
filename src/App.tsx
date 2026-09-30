import { useEffect } from 'react'
import { Link, NavLink, Route, Routes, useLocation } from 'react-router-dom'
import ErrorBoundary from './components/ErrorBoundary'
import UserMenu from './components/UserMenu'
import AccountPage from './pages/AccountPage'
import ChartPage from './pages/ChartPage'
import HomePage from './pages/HomePage'
import LearnPage from './pages/LearnPage'
import LessonPage from './pages/LessonPage'
import CareerPage from './pages/CareerPage'
import MarriagePage from './pages/MarriagePage'
import MatchPage from './pages/MatchPage'
import NotFound from './pages/NotFound'
import PrivacyPage from './pages/PrivacyPage'

export default function App() {
  const { pathname } = useLocation()
  useEffect(() => window.scrollTo(0, 0), [pathname])

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
            <NavLink to="/chart" end>My Chart</NavLink>
            <NavLink to="/match">Match</NavLink>
            <NavLink to="/learn">Learn</NavLink>
          </nav>
          <UserMenu />
        </div>
      </header>
      <main id="main" className="container">
        <ErrorBoundary key={pathname}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/chart" element={<ChartPage />} />
            <Route path="/chart/career" element={<CareerPage />} />
            <Route path="/chart/marriage" element={<MarriagePage />} />
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
          <span>© {new Date().getFullYear()} Astro Life · Rule-based astrology, calculated in your browser.</span>
          <nav aria-label="Footer">
            <Link to="/learn">Learn</Link>
            <Link to="/privacy">Privacy &amp; Security</Link>
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
