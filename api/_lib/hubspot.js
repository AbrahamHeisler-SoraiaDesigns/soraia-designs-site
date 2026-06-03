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
    throw new Error(`HubSpot ${method} ${path} failed ${res.status}: ${text}`)
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

export async function updateContact(contactId, properties) {
  return hubspotFetch(`/crm/v3/objects/contacts/${contactId}`, {
    method: 'PATCH',
    body: { properties },
  })
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
  const props = monitoringPropsForSubmit(payload)
  await updateContact(contact.id, props)
  return { id: contact.id, ...contact, ...props }
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
