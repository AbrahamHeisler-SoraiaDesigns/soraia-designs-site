import { auditStage1Schema, auditEnrichmentSchema } from '../src/lib/audit-schema.js'
import { DEFAULT_PIXEL_ID, EMAIL_KEYS, HUBSPOT_PORTAL_ID } from './_lib/audit-config.js'
import { buildContactUrl, enrichAuditContactByEmail, findContactByEmail, syncMonitoringPropsByEmail, updateContact, upsertAuditContactByEmail, upsertAuditDeal } from './_lib/hubspot.js'
import { ensureAuditProspectDriveStructure } from './_lib/drive.js'
import { syncLeadToBrevoAndMark } from './_lib/nurture.js'
import { upsertBrevoAuditDeal } from './_lib/brevo.js'
import { makeEventId, sha256Hex } from './_lib/audit-utils.js'

function getMissingCriticalEnv() {
  if (process.env.HUBSPOT_AUDIT_FORM_GUID || process.env.HUBSPOT_SERVICE_KEY) return []
  return ['HUBSPOT_AUDIT_FORM_GUID or HUBSPOT_SERVICE_KEY']
}

async function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function withRetries(label, fn, delays = [1000, 3000, 9000]) {
  let lastErr
  for (let i = 0; i <= delays.length; i += 1) {
    try {
      return await fn()
    } catch (err) {
      lastErr = err
      if (i === delays.length) break
      console.error(`[audit-submit] ${label} failed, retrying in ${delays[i]}ms`, err)
      await wait(delays[i])
    }
  }
  throw lastErr
}

async function postToHubspotForm(payload) {
  const formGuid = process.env.HUBSPOT_AUDIT_FORM_GUID
  if (!formGuid) {
    console.warn('[audit-submit] HUBSPOT_AUDIT_FORM_GUID not set — skipping HubSpot post')
    return { skipped: true, reason: 'missing_form_guid' }
  }

  const fields = [
    { name: 'firstname', value: payload.firstname },
    { name: 'lastname', value: payload.lastname },
    { name: 'email', value: payload.email },
    { name: 'phone', value: payload.phone },
    { name: 'audit_property_street', value: payload.property_street },
    { name: 'audit_property_city', value: payload.property_city },
    { name: 'audit_property_state', value: payload.property_state },
    { name: 'audit_property_zip', value: payload.property_zip },
    { name: 'audit_property_bedrooms', value: String(payload.property_bedrooms) },
    { name: 'audit_property_bathrooms', value: String(payload.property_bathrooms) },
    { name: 'audit_is_listed', value: payload.is_listed },
    { name: 'audit_listing_url', value: payload.listing_url || '' },
    { name: 'audit_primary_goal', value: payload.primary_goal },
    { name: 'audit_target_adr', value: payload.target_adr ? String(payload.target_adr) : '' },
    { name: 'audit_current_performance', value: payload.current_performance || '' },
    { name: 'audit_budget_tier', value: payload.budget_tier },
    { name: 'audit_timeline', value: payload.timeline },
    { name: 'audit_notes', value: payload.notes || '' },
    { name: 'audit_referrer', value: payload.referrer || '' },
    { name: 'audit_landing_page', value: payload.landing_page || '' },
    { name: 'audit_submit_timestamp', value: new Date().toISOString() },
    { name: 'audit_status', value: 'requested' },
  ].filter((f) => f.value !== '' && f.value != null)

  const url = `https://api.hsforms.com/submissions/v3/integration/submit/${HUBSPOT_PORTAL_ID}/${formGuid}`
  const body = {
    fields,
    context: {
      pageUri: payload.landing_page || '',
      pageName: 'Audit Request — Soraia Designs',
      hutk: payload.hubspotutk || undefined,
    },
  }

  return withRetries('HubSpot Forms submit', async () => {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      const text = await res.text()
      throw new Error(`HubSpot Forms API ${res.status}: ${text}`)
    }
    return { ok: true }
  })
}

async function fireMetaCAPI(payload, eventId, clientIp, userAgent) {
  const pixelId = process.env.META_PIXEL_ID || DEFAULT_PIXEL_ID
  const token = process.env.META_CAPI_ACCESS_TOKEN
  if (!token) {
    console.warn('[audit-submit] META_CAPI_ACCESS_TOKEN not set — skipping CAPI')
    return { skipped: true, reason: 'missing_token' }
  }
  const phoneDigits = (payload.phone || '').replace(/\D/g, '')
  const userData = {
    em: [sha256Hex(payload.email)],
    ph: phoneDigits ? [sha256Hex(phoneDigits)] : undefined,
    client_ip_address: clientIp,
    client_user_agent: userAgent,
  }
  if (payload.fbp) userData.fbp = payload.fbp
  if (payload.fbc) userData.fbc = payload.fbc

  const body = {
    data: [{
      event_name: 'Lead',
      event_time: Math.floor(Date.now() / 1000),
      event_id: eventId,
      action_source: 'website',
      event_source_url: payload.landing_page || 'https://www.soraiadesigns.com/audit/get-started',
      user_data: userData,
    }],
  }

  const res = await fetch(`https://graph.facebook.com/v19.0/${pixelId}/events?access_token=${token}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const text = await res.text()
    console.error('[audit-submit] CAPI failed (non-blocking):', res.status, text)
    return { ok: false, status: res.status }
  }
  return { ok: true }
}

async function notifyInternal(payload, eventId, contactUrl, driveFolderUrl, dealUrl) {
  const apiKey = process.env.RESEND_API_KEY
  const to = process.env.INTERNAL_NOTIFY_EMAIL || 'abe@soraiadesigns.com'
  if (!apiKey) {
    console.warn('[audit-submit] RESEND_API_KEY not set — skipping internal notify')
    return { skipped: true, reason: 'missing_resend_key' }
  }
  const lines = Object.entries(payload)
    .filter(([k]) => !k.startsWith('_'))
    .map(([k, v]) => `<p><strong>${k}:</strong> ${String(v ?? '')}</p>`)
    .join('')
  const html = `
    <h2>New audit request — ${payload.full_name}</h2>
    <p>Property: ${payload.property_street}, ${payload.property_city}, ${payload.property_state} ${payload.property_zip}</p>
    <p>Event ID: ${eventId}</p>
    ${contactUrl ? `<p><a href="${contactUrl}">Open HubSpot contact</a></p>` : ''}
    ${dealUrl ? `<p><a href="${dealUrl}">Open HubSpot deal</a></p>` : ''}
    ${driveFolderUrl ? `<p><a href="${driveFolderUrl}">Open Drive prospect folder</a></p>` : ''}
    <hr>
    ${lines}
  `
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      from: process.env.INTERNAL_NOTIFY_FROM || 'Soraia Designs <audit@soraiadesigns.com>',
      to: [to],
      subject: `New audit request — ${payload.full_name} (${payload.property_city}, ${payload.property_state})`,
      html,
    }),
  })
  if (!res.ok) {
    const text = await res.text()
    console.error('[audit-submit] Resend notify failed:', res.status, text)
    return { ok: false }
  }
  return { ok: true }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ message: 'Method not allowed' })
  }

  let raw
  try {
    raw = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
  } catch {
    return res.status(400).json({ message: 'Invalid JSON body' })
  }

  if (raw && raw._company_legal_name) {
    return res.status(200).json({ ok: true, event_id: null, honeypot: true })
  }

  const stage = Number(raw?.stage) || 1

  // ── Stage 2: enrich an already-captured lead (best-effort, non-blocking) ──
  // The lead was created server-side at Stage 1, so a failure here never costs
  // us the lead. We update the contact's audit_* props; the Lead pixel/CAPI and
  // nurture enrollment already fired at capture and are not repeated.
  if (stage === 2) {
    const parsedEnrich = auditEnrichmentSchema.safeParse(raw)
    if (!parsedEnrich.success) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: parsedEnrich.error.flatten?.() ?? parsedEnrich.error,
      })
    }
    const enrichData = parsedEnrich.data
    let enriched = null
    try {
      enriched = await enrichAuditContactByEmail({ ...raw, ...enrichData })
    } catch (error) {
      console.error('[audit-submit] stage-2 enrichment failed (non-blocking):', error)
    }
    return res.status(200).json({
      ok: true,
      stage: 2,
      enriched: enriched?.updated ?? false,
      contact_url: enriched?.id ? buildContactUrl(enriched.id) : null,
    })
  }

  const parsed = auditStage1Schema.safeParse(raw)
  if (!parsed.success) {
    return res.status(400).json({
      message: 'Validation failed',
      errors: parsed.error.flatten?.() ?? parsed.error,
    })
  }

  const data = parsed.data
  const missingCriticalEnv = getMissingCriticalEnv()
  if (missingCriticalEnv.length > 0) {
    console.error('[audit-submit] Missing critical env:', missingCriticalEnv.join(', '))
    return res.status(503).json({
      ok: false,
      message: 'Audit request form is temporarily unavailable. Please email abe@soraiadesigns.com directly.',
      code: 'FORM_MISCONFIGURED',
    })
  }

  const { firstname, lastname } = (() => {
    const parts = String(data.full_name || '').trim().split(/\s+/)
    return { firstname: parts[0] || '', lastname: parts.slice(1).join(' ') }
  })()

  const merged = { ...raw, ...data, firstname, lastname }
  const eventId = makeEventId(data.email, `${data.property_street} ${data.property_zip}`)
  const clientIp = (req.headers['x-forwarded-for']?.toString().split(',')[0] || req.socket?.remoteAddress || '').trim()
  const userAgent = req.headers['user-agent'] || ''

  let hubspotSubmit
  try {
    hubspotSubmit = await postToHubspotForm(merged)
  } catch (error) {
    console.error('[audit-submit] HubSpot post failed:', error)
    if (!process.env.HUBSPOT_SERVICE_KEY) {
      return res.status(502).json({
        ok: false,
        message: 'We could not save this audit request right now. Please try again in a few minutes or email abe@soraiadesigns.com.',
        code: 'HUBSPOT_SUBMIT_FAILED',
      })
    }
    hubspotSubmit = { skipped: true, reason: 'hubspot_form_failed_fallback_to_service_key' }
  }

  let contact = null
  let contactUrl = null
  let driveFolder = null
  let deal = null
  let brevoDeal = null
  try {
    contact = await syncMonitoringPropsByEmail(data.email, merged)
    if (!contact && process.env.HUBSPOT_SERVICE_KEY) {
      contact = await upsertAuditContactByEmail(merged)
    }
    if (!contact) {
      contact = await findContactByEmail(data.email)
    }
    if (contact?.id) {
      contactUrl = buildContactUrl(contact.id)
      const brevoContactPayload = { ...contact, ...merged, id: contact.id }
      await syncLeadToBrevoAndMark(brevoContactPayload, EMAIL_KEYS.EMAIL_1)
      brevoDeal = await upsertBrevoAuditDeal(brevoContactPayload)
    }
  } catch (error) {
    console.error('[audit-submit] HubSpot/Brevo sync failed:', error)
    if (contact?.id) {
      try {
        await updateContact(contact.id, {
          audit_brevo_sync_status: 'errored',
          audit_brevo_last_sync_at: new Date().toISOString(),
        })
      } catch (secondary) {
        console.error('[audit-submit] failed to mark HubSpot sync error:', secondary)
      }
    }
  }

  try {
    driveFolder = await ensureAuditProspectDriveStructure(merged)
  } catch (error) {
    console.error('[audit-submit] Drive prospect folder setup failed:', error)
  }

  try {
    if (contact?.id) {
      deal = await upsertAuditDeal({
        contactId: contact.id,
        payload: merged,
        driveFolderUrl: driveFolder?.url,
        auditReportUrl: merged.audit_pdf_url || null,
      })
    }
  } catch (error) {
    console.error('[audit-submit] HubSpot deal upsert failed:', error)
  }

  const tasks = await Promise.allSettled([
    fireMetaCAPI(merged, eventId, clientIp, userAgent),
    notifyInternal(merged, eventId, contactUrl, driveFolder?.url, deal?.url),
  ])
  const [capi, notify] = tasks

  return res.status(200).json({
    ok: true,
    event_id: eventId,
    hubspot: hubspotSubmit,
    contact_url: contactUrl,
    drive_folder_url: driveFolder?.url || null,
    deal_url: deal?.url || null,
    brevo_deal_id: brevoDeal?.id || null,
    capi: capi.status === 'fulfilled' ? capi.value : { error: String(capi.reason) },
    notify: notify.status === 'fulfilled' ? notify.value : { error: String(notify.reason) },
  })
}
