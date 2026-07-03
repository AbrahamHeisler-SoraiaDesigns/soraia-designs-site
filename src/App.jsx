import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import Home from './pages/Home'
import Privacy from './pages/Privacy'
import Terms from './pages/Terms'
import AuditLanding from './pages/audit/Landing'
import AuditGetStarted from './pages/audit/GetStarted'
import AuditRequested from './pages/audit/Requested'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/audit" element={<AuditLanding />} />
        <Route path="/audit/get-started" element={<AuditGetStarted />} />
        <Route path="/audit/requested" element={<AuditRequested />} />
      </Routes>
    </BrowserRouter>
  )
}
