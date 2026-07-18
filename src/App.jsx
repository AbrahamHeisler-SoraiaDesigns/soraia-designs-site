import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { useEffect, useRef } from 'react'
import Home from './pages/Home'
import Privacy from './pages/Privacy'
import Terms from './pages/Terms'
import AuditLanding from './pages/audit/Landing'
import AuditGetStarted from './pages/audit/GetStarted'
import AuditRequested from './pages/audit/Requested'
import Book from './pages/Book'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

// SPA PageView tracking (Meta retargeting fix, Maya 2026-07-17). index.html fires
// ONE PageView on the hard load, so client-side route changes (Home -> /audit,
// /audit -> /audit/get-started) never registered a PageView — the "Website
// Visitors 180d" custom audience couldn't grow past hard-load landings. Fire a
// PageView on every route change AFTER the first render (the first is the hard
// load index.html already counted — skipping it avoids a double PageView).
function PixelRouteTracker() {
  const { pathname } = useLocation()
  const isInitial = useRef(true)
  useEffect(() => {
    if (isInitial.current) {
      isInitial.current = false
      return
    }
    if (typeof window !== 'undefined' && typeof window.fbq === 'function') {
      window.fbq('track', 'PageView')
    }
  }, [pathname])
  return null
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <PixelRouteTracker />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/audit" element={<AuditLanding />} />
        <Route path="/audit/get-started" element={<AuditGetStarted />} />
        <Route path="/audit/requested" element={<AuditRequested />} />
        <Route path="/book" element={<Book />} />
      </Routes>
    </BrowserRouter>
  )
}
