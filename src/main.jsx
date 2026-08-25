import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { initGA4 } from './lib/analytics.js'
import { captureFirstTouch } from './lib/attribution.js'

// Before render: the ad's utms live in the query string of this hard load and
// the first <Link> click throws them away.
captureFirstTouch()
initGA4()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
