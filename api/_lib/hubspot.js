import { HUBSPOT_OWNER_ID, HUBSPOT_PORTAL_ID, HUBSPOT_SEARCH_PROPS } from './audit-config.js'
import { formatPropertyLine, isoNow, splitName } from './audit-utils.js'

function requireKey() {
  const key = process.env.HUBSPOT_SERVICE_KEY
  if (!key) throw new Error('HUBSPOT_SERVICE_KEY missing')
  return key
}

async function hubspotFetch(path, { method = 'GET', body, search = false } = {}) {
  const key = requireKey()
  const base = search ? 'https://api.hubapi.com' : 'https://api.hubapi.com'
  const res = await fetch(`${base}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    const text = await res.text()
    const err = new Error(`HubSpot ${method} ${path} failed ${res.status}: ${text}`)
    err.status = res.status
    err.body = text
    throw err
  }
  return res.status === 204 ? null : res.json()
}

export async function findContactByEmail(email) {
  const body = {
    filterGroups: [{ filters: [{ propertyName: 'email', operator: 'EQ', value: email }] }],
    properties: HUBSPOT_SEARCH_PROPS,
    limit: 1,
  }
  const result = await hubspotFetch('/crm/v3/objects/contacts/search', { method: 'POST', body, search: true })
  const row = result.results?.[0]
  if (!row) return null
  return { id: row.id, ...row.properties }
}

// Defensive non-atomic write (Maya's enum-drift spec, 2026-07-17). HubSpot
// PATCHes are ATOMIC: one invalid property (e.g. an enum value the property
// definition doesn't have yet) rejects the ENTIRE write with 400 VALIDATION_ERROR.
// For a suppression/unsubscribe write that was fail-OPEN — the handler 500s and
// the contact stays enrolled. On a validation error we retry each property alone
// so the valid ones still land, and surface exactly which ones were dropped
// instead of losing the whole write. NOTE: this is insurance, not the primary
// fix — the real fix is keeping the property enums in sync with the code (add the
// missing options). Deploy this WITH the enum fix, never as a substitute: on its
// own it would silently drop the status prop and convert a loud 500 into a quiet
// stays-enrolled. The loud console.error below is the tripwire for that drift.
export async function updateContact(contactId, properties) {
  const path = `/crm/v3/objects/contacts/${contactId}`
  try {
    return await hubspotFetch(path, { method: 'PATCH', body: { properties } })
  } catch (err) {
    const entries = Object.entries(properties || {})
    // Only salvage genuine validation rejections, and only when there's more than
    // one property to isolate. Anything else (auth, 404, 429, 5xx) rethrows.
    if (err?.status !== 400 || entries.length <= 1) throw err
    const applied = {}
    const dropped = []
    for (const [k, v] of entries) {
      try {
        await hubspotFetch(path, { method: 'PATCH', body: { properties: { [k]: v } } })
        applied[k] = v
      } catch (perErr) {
        if (perErr?.status !== 400) throw perErr
        dropped.push({ property: k, value: v, error: String(perErr.body || perErr.message || perErr) })
      }
    }
    console.error(
      `[hubspot] updateContact(${contactId}) atomic PATCH rejected; non-atomic fallback dropped invalid props ` +
        `(likely enum drift — reconcile the property definition):`,
      JSON.stringify(dropped),
    )
    return { _partial: true, appliedCount: Object.keys(applied).length, dropped }
  }
}

export async function createContact(properties) {
  const created = await hubspotFetch('/crm/v3/objects/contacts', {
    method: 'POST',
    body: { properties },
  })
  return { id: created.id, ...created.properties }
}

export function buildContactUrl(contactId) {
  return `https://app.hubspot.com/contacts/${HUBSPOT_PORTAL_ID}/record/0-1/${contactId}`
}

export function buildDealUrl(dealId) {
  return `https://app.hubspot.com/contacts/${HUBSPOT_PORTAL_ID}/record/0-3/${dealId}`
}

export function monitoringPropsForSubmit(payload) {
  const { firstname, lastname } = splitName(payload.full_name)
  return {
    firstname,
    lastname,
    phone: payload.phone || '',
    audit_status: 'requested',
    audit_nurture_status: 'not_enrolled',
    audit_brevo_sync_status: 'pending',
    audit_submit_timestamp: isoNow(),
    hubspot_owner_id: HUBSPOT_OWNER_ID,
    hs_lead_status: 'NEW_AUDIT_REQUESTED',
  }
}

// Stage-1 writeback: monitoring props + the audit spine (property block, beds,
// is_listed, and the now-required listing link). We PATCH these via the CRM API
// on every Stage-1 submit so beds/street/link land in the custom audit_* props
// even when the HubSpot Forms-API form definition maps street to standard
// `address` or drops unmapped fields. Empty values are filtered so we never
// blank a value the Forms API may have already set.
export function stage1WritebackProps(payload) {
  const core = {
    ...monitoringPropsForSubmit(payload),
    audit_property_street: payload.property_street || '',
    audit_property_city: payload.property_city || '',
    audit_property_state: payload.property_state || '',
    audit_property_zip: payload.property_zip || '',
    audit_property_bedrooms: payload.property_bedrooms != null ? String(payload.property_bedrooms) : '',
    audit_is_listed: payload.is_listed || '',
    audit_listing_url: payload.listing_url || '',
  }
  return Object.fromEntries(Object.entries(core).filter(([, v]) => v !== '' && v != null))
}

export function auditContactProps(payload) {
  return {
    email: payload.email,
    firstname: payload.firstname || splitName(payload.full_name).firstname,
    lastname: payload.lastname || splitName(payload.full_name).lastname,
    phone: payload.phone || '',
    audit_property_street: payload.property_street || '',
    audit_property_city: payload.property_city || '',
    audit_property_state: payload.property_state || '',
    audit_property_zip: payload.property_zip || '',
    audit_property_bedrooms: payload.property_bedrooms != null ? String(payload.property_bedrooms) : '',
    audit_property_bathrooms: payload.property_bathrooms != null ? String(payload.property_bathrooms) : '',
    audit_is_listed: payload.is_listed || '',
    audit_listing_url: payload.listing_url || '',
    audit_primary_goal: payload.primary_goal || '',
    audit_target_adr: payload.target_adr != null ? String(payload.target_adr) : '',
    audit_current_performance: payload.current_performance || '',
    audit_budget_tier: payload.budget_tier || '',
    audit_timeline: payload.timeline || '',
    audit_notes: payload.notes || '',
    audit_referrer: payload.referrer || '',
    audit_landing_page: payload.landing_page || '',
    utm_source: payload.utm_source || '',
    utm_medium: payload.utm_medium || '',
    utm_campaign: payload.utm_campaign || '',
    utm_content: payload.utm_content || '',
    utm_term: payload.utm_term || '',
    ...monitoringPropsForSubmit(payload),
  }
}

// Stage-2 enrichment: only the fields collected after capture. Blank/missing
// values are dropped so we never overwrite a captured value with an empty one.
export function enrichmentContactProps(payload) {
  const candidate = {
    phone: payload.phone || '',
    audit_property_bathrooms: payload.property_bathrooms != null ? String(payload.property_bathrooms) : '',
    audit_is_listed: payload.is_listed || '',
    audit_listing_url: payload.listing_url || '',
    audit_primary_goal: payload.primary_goal || '',
    audit_target_adr: payload.target_adr != null ? String(payload.target_adr) : '',
    audit_current_performance: payload.current_performance || '',
    audit_budget_tier: payload.budget_tier || '',
    audit_timeline: payload.timeline || '',
    audit_notes: payload.notes || '',
  }
  // SMS opt-in: only write consent props on an actual opt-in (checkbox checked).
  // Absence of an opt-in is never a recordable "no" here, so we don't clobber a
  // prior consent on a later Stage-2 pass. Records verbatim text + source + ts
  // for the A2P consent audit trail. This makes the lead textable by the setter.
  if (payload.sms_consent === true) {
    candidate.audit_sms_consent = 'true'
    candidate.audit_sms_consent_at = isoNow()
    candidate.audit_sms_consent_text = payload.sms_consent_text || ''
    candidate.audit_sms_consent_source = 'web_audit_form'
  }
  return Object.fromEntries(Object.entries(candidate).filter(([, v]) => v !== '' && v != null))
}

export async function enrichAuditContactByEmail(payload) {
  // Stage 2 can race ahead of the Stage-1 contact propagating in HubSpot search.
  // Retry the lookup on the same 0/750/2000/5000ms backoff Stage 1 uses, so a
  // fast finisher's qualifiers aren't silently dropped on a first-pass miss.
  let existing = null
  for (const delay of [0, 750, 2000, 5000]) {
    if (delay) await wait(delay)
    existing = await findContactByEmail(payload.email)
    if (existing?.id) break
  }
  if (!existing?.id) return null
  const props = enrichmentContactProps(payload)
  if (Object.keys(props).length === 0) return { id: existing.id, ...existing, updated: false }
  await updateContact(existing.id, props)
  return { id: existing.id, ...existing, ...props, updated: true }
}

export async function upsertAuditContactByEmail(payload) {
  const existing = await findContactByEmail(payload.email)
  const properties = auditContactProps(payload)
  if (existing?.id) {
    await updateContact(existing.id, properties)
    return { id: existing.id, ...existing, ...properties, created: false }
  }
  const created = await createContact(properties)
  return { ...created, ...properties, created: true }
}

async function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function syncMonitoringPropsByEmail(email, payload) {
  let contact = null
  for (const delay of [0, 750, 2000, 5000]) {
    if (delay) await wait(delay)
    contact = await findContactByEmail(email)
    if (contact?.id) break
  }
  if (!contact?.id) return null
  const props = stage1WritebackProps(payload)
  await updateContact(contact.id, props)
  return { id: contact.id, ...contact, ...props }
}

// Phone-capture A/B (2026-07-10): record which variant the user saw and whether
// a phone landed, WITHOUT ever touching the core lead path. Isolated + fully
// best-effort: its own lookup + PATCH in a try/catch, so if the two measurement
// props (`audit_phone_capture_variant`, `audit_phone_present`) don't exist in
// the portal yet, the 400 is swallowed here and Stage-1 nurture is unaffected.
// Once Maya creates the props, data starts flowing with no code change.
export async function recordPhoneAbSignals(email, { variant, phonePresent } = {}) {
  const props = {}
  if (variant) props.audit_phone_capture_variant = String(variant)
  if (phonePresent != null) props.audit_phone_present = phonePresent ? 'true' : 'false'
  if (Object.keys(props).length === 0) return null
  try {
    const contact = await findContactByEmail(email)
    if (!contact?.id) return null
    await updateContact(contact.id, props)
    return { id: contact.id, ...props }
  } catch (error) {
    console.warn('[hubspot] recordPhoneAbSignals skipped (props may not exist yet):', error?.message || error)
    return null
  }
}

export async function searchContactsForNurture() {
  const body = {
    filterGroups: [
      {
        filters: [
          { propertyName: 'audit_nurture_status', operator: 'HAS_PROPERTY' },
        ],
      },
    ],
    properties: HUBSPOT_SEARCH_PROPS,
    limit: 100,
    sorts: [{ propertyName: 'lastmodifieddate', direction: 'ASCENDING' }],
  }
  const result = await hubspotFetch('/crm/v3/objects/contacts/search', { method: 'POST', body, search: true })
  return (result.results || []).map((row) => ({ id: row.id, ...row.properties }))
}

function requireDealConfig() {
  const pipeline = process.env.HUBSPOT_AUDIT_DEAL_PIPELINE_ID
  const stage = process.env.HUBSPOT_AUDIT_DEAL_STAGE_ID
  if (!pipeline || !stage) {
    throw new Error('HUBSPOT_AUDIT_DEAL_PIPELINE_ID or HUBSPOT_AUDIT_DEAL_STAGE_ID missing')
  }
  return { pipeline, stage }
}

function auditDealName(payload) {
  return `${String(payload.full_name || '').trim()} - Audit`
}

async function findDealByName(name) {
  const body = {
    filterGroups: [{ filters: [{ propertyName: 'dealname', operator: 'EQ', value: name }] }],
    properties: ['dealname', 'pipeline', 'dealstage', 'description'],
    limit: 1,
  }
  const result = await hubspotFetch('/crm/v3/objects/deals/search', { method: 'POST', body, search: true })
  const row = result.results?.[0]
  if (!row) return null
  return { id: row.id, ...row.properties }
}

function buildDealDescription(payload, driveFolderUrl, auditReportUrl) {
  const parts = [
    `Property: ${formatPropertyLine(payload)}`,
    payload.listing_url ? `Listing URL: ${payload.listing_url}` : null,
    driveFolderUrl ? `Prospect folder: ${driveFolderUrl}` : null,
    auditReportUrl ? `Audit report: ${auditReportUrl}` : null,
    payload.notes ? `Notes: ${payload.notes}` : null,
  ].filter(Boolean)
  return parts.join('\n')
}

// Deal-stage suppression lookup (Abe's ask 2026-07-17). Returns the associated
// deals' stages so the sequencer can stop mailing a lead a human has engaged
// (moved out of "New Lead"). Uses the v4 associations endpoint — the v3 shape
// differs and threw `KeyError: toObjectId` per Maya's spec. Batch-reads dealstage
// so it's one associations call + one batch read per contact per run (trivial at
// current volume). Throws on any API error so the caller can fail CLOSED.
export async function getAssociatedDealStages(contactId) {
  const assoc = await hubspotFetch(`/crm/v4/objects/contacts/${contactId}/associations/deals`)
  let dealIds = (assoc?.results || [])
    .map((r) => r.toObjectId ?? r.to?.id ?? r.id)
    .filter(Boolean)
    .map(String)
  if (dealIds.length === 0) return []
  // HubSpot batch/read hard-caps inputs at 100. A contact with >100 associated
  // deals isn't realistic here (a lead has 1–2), and the first page of the v4
  // associations call isn't paginated — but cap defensively so an anomalous contact
  // can't 400 the whole lookup (which would fail the send closed via the caller).
  if (dealIds.length > 100) {
    console.warn(`[hubspot] contact ${contactId} has ${dealIds.length} associated deals — checking first 100`)
    dealIds = dealIds.slice(0, 100)
  }
  const batch = await hubspotFetch('/crm/v3/objects/deals/batch/read', {
    method: 'POST',
    body: { properties: ['dealstage', 'pipeline', 'dealname'], inputs: dealIds.map((id) => ({ id })) },
  })
  return (batch?.results || []).map((row) => ({ id: row.id, ...row.properties }))
}

export async function upsertAuditDeal({ contactId, payload, driveFolderUrl, auditReportUrl }) {
  const { pipeline, stage } = requireDealConfig()
  const dealname = auditDealName(payload)
  const description = buildDealDescription(payload, driveFolderUrl, auditReportUrl)
  const properties = {
    dealname,
    pipeline,
    dealstage: stage,
    hubspot_owner_id: HUBSPOT_OWNER_ID,
    description,
  }

  const existing = await findDealByName(dealname)
  if (existing?.id) {
    await hubspotFetch(`/crm/v3/objects/deals/${existing.id}`, {
      method: 'PATCH',
      body: { properties },
    })
    return { id: existing.id, url: buildDealUrl(existing.id), created: false }
  }

  const createBody = {
    properties,
    associations: contactId
      ? [{
          to: { id: String(contactId) },
          types: [{ associationCategory: 'HUBSPOT_DEFINED', associationTypeId: 3 }],
        }]
      : undefined,
  }

  const created = await hubspotFetch('/crm/v3/objects/deals', {
    method: 'POST',
    body: createBody,
  })

  return { id: created.id, url: buildDealUrl(created.id), created: true }
}
