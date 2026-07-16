import { nextEmailKey, sendNurtureEmail } from './_lib/nurture.js'
import { searchContactsForNurture } from './_lib/hubspot.js'
import { isDryRun } from './_lib/gmail.js'

function authorized(req) {
  const cronSecret = process.env.CRON_SECRET
  const bearer = req.headers.authorization || ''
  if (cronSecret && bearer === `Bearer ${cronSecret}`) return true
  if (req.headers['x-vercel-cron']) return true
  return false
}

function withinSendWindow() {
  const now = new Date()
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    weekday: 'short',
    hour: 'numeric',
    hour12: false,
  })
  const parts = Object.fromEntries(fmt.formatToParts(now).map((p) => [p.type, p.value]))
  const weekday = parts.weekday
  const hour = Number(parts.hour)
  const isWeekday = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].includes(weekday)
  return isWeekday && hour >= 9 && hour <= 11
}

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST')
    return res.status(405).json({ message: 'Method not allowed' })
  }
  if (!authorized(req)) {
    return res.status(401).json({ ok: false, message: 'Unauthorized' })
  }
  // DRY_RUN generates the send-plan on demand, so it bypasses the live send window.
  if (!isDryRun() && !withinSendWindow()) {
    return res.status(200).json({ ok: true, skipped: true, reason: 'outside_send_window' })
  }

  const contacts = await searchContactsForNurture()
  const results = []

  for (const contact of contacts) {
    const emailKey = nextEmailKey(contact)
    if (!emailKey) continue
    try {
      const r = await sendNurtureEmail(contact, emailKey)
      results.push(r?.dryRun
        ? { email: contact.email, emailKey, dryRun: true, subject: r.subject, text: r.text }
        : { email: contact.email, emailKey, ok: r?.ok !== false, skipped: r?.skipped, reason: r?.reason })
    } catch (error) {
      results.push({ email: contact.email, emailKey, ok: false, error: String(error) })
    }
  }

  return res.status(200).json({ ok: true, dryRun: isDryRun(), processed: results.length, results })
}
