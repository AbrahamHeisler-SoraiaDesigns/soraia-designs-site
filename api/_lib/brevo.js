import { DEFAULT_BREVO_LIST_ID, DEFAULT_BREVO_PIPELINE_ID, DEFAULT_BREVO_STAGE_NEW_ID } from './audit-config.js'
import { buildAuditDealName, buildBrevoTags, senderProfile } from './audit-utils.js'

function requireResendKey() {
  const key = process.env.RESEND_API_KEY
  if (!key) throw new Error('RESEND_API_KEY missing')
  return key
}

function requireKey() {
  const key = process.env.BREVO_API_KEY
  if (!key) throw new Error('BREVO_API_KEY missing')
  return key
}

async function brevoFetch(path, { method = 'GET', body } = {}) {
  const key = requireKey()
  const res = await fetch(`https://api.brevo.com/v3${path}`, {
    method,
    headers: {
      'api-key': key,
      'Content-Type': 'application/json',
      accept: 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    const text = await res.text()
    const error = new Error(`Brevo ${method} ${path} failed ${res.status}: ${text}`)
    error.status = res.status
    error.body = text
    throw error
  }
  return res.status === 204 ? null : res.json()
}

function isEmailSuppressed(contact) {
  return new Set(['unsubscribed', 'bounced', 'complained']).has(contact.audit_nurture_status || '')
}

function normalizeSms(phone) {
  const raw = String(phone || '').trim()
  if (!raw) return null

  const keepPlus = raw.startsWith('+')
  const digits = raw.replace(/\D/g, '')
  if (!digits) return null

  if (keepPlus) return `+${digits}`
  if (digits.length === 10) return `+1${digits}`
  return `+${digits}`
}

function attrFromContact(contact) {
  const attributes = {
    FIRSTNAME: contact.firstname || '',
    LASTNAME: contact.lastname || '',
    PROPERTY_STREET: contact.audit_property_street || '',
    PROPERTY_CITY: contact.audit_property_city || '',
    PROPERTY_STATE: contact.audit_property_state || '',
    PROPERTY_ZIP: contact.audit_property_zip || '',
    PROPERTY_BEDROOMS: String(contact.audit_property_bedrooms || ''),
    PROPERTY_BATHROOMS: String(contact.audit_property_bathrooms || ''),
    IS_LISTED: contact.audit_is_listed || '',
    LISTING_URL: contact.audit_listing_url || '',
    PRIMARY_GOAL: contact.audit_primary_goal || '',
    TARGET_ADR: String(contact.audit_target_adr || ''),
    CURRENT_PERFORMANCE: contact.audit_current_performance || '',
    BUDGET_TIER: contact.audit_budget_tier || '',
    TIMELINE: contact.audit_timeline || '',
    AUDIT_STATUS: contact.audit_status || '',
    AUDIT_PDF_URL: contact.audit_pdf_url || '',
    HUBSPOT_LEAD_STATUS: contact.hs_lead_status || '',
    NURTURE_STATUS: contact.audit_nurture_status || '',
    SOURCE_URL: contact.audit_landing_page || '',
    REFERRER_URL: contact.audit_referrer || '',
    AUDIT_TAGS: buildBrevoTags(contact),
  }

  const sms = normalizeSms(contact.phone)
  if (process.env.BREVO_INCLUDE_SMS === 'true' && sms) {
    attributes.SMS = sms
  }

  return attributes
}

export async function upsertBrevoContact(contact) {
  const listId = Number(process.env.BREVO_AUDIT_LIST_ID || DEFAULT_BREVO_LIST_ID)
  const attributes = attrFromContact(contact)
  const body = {
    email: contact.email,
    attributes,
    listIds: [listId],
    emailBlacklisted: isEmailSuppressed(contact),
    updateEnabled: true,
  }
  try {
    await brevoFetch('/contacts', { method: 'POST', body })
  } catch (error) {
    const errorBody = String(error.body || '')
    const smsConflict = errorBody.includes('SMS is already associated with another Contact') || errorBody.includes('duplicate_identifiers":["SMS"]')
    if (smsConflict) {
      const retryBody = {
        ...body,
        attributes: { ...attributes },
      }
      delete retryBody.attributes.SMS
      await brevoFetch('/contacts', { method: 'POST', body: retryBody })
    } else {
      throw error
    }
  }
  return { ok: true, listId, tags: attributes.AUDIT_TAGS }
}

export async function sendBrevoEmail({ toEmail, toName, subject, html, previewText }) {
  const sender = senderProfile()
  const body = {
    sender: { email: sender.email, name: sender.name },
    to: [{ email: toEmail, name: toName || undefined }],
    replyTo: { email: sender.replyTo, name: sender.name },
    subject,
    htmlContent: previewText ? `<!-- ${previewText} -->${html}` : html,
    tags: ['audit-nurture'],
  }
  return brevoFetch('/smtp/email', { method: 'POST', body })
}

export async function getBrevoContactByEmail(email) {
  const identifier = encodeURIComponent(email)
  return brevoFetch(`/contacts/${identifier}?identifierType=email_id`)
}

async function getBrevoDealsForContact(contactId) {
  const params = new URLSearchParams({ 'filters[linkedContactsIds]': String(contactId), limit: '50' })
  const result = await brevoFetch(`/crm/deals?${params.toString()}`)
  return result.items || []
}

export async function upsertBrevoAuditDeal(contact) {
  const brevoContact = await getBrevoContactByEmail(contact.email)
  const contactId = brevoContact.id
  const pipeline = process.env.BREVO_AUDIT_PIPELINE_ID || DEFAULT_BREVO_PIPELINE_ID
  const dealStage = process.env.BREVO_AUDIT_STAGE_NEW_ID || DEFAULT_BREVO_STAGE_NEW_ID
  const name = buildAuditDealName(contact)
  const attributes = {
    pipeline,
    deal_stage: dealStage,
  }

  const existingDeals = await getBrevoDealsForContact(contactId)
  const existing = existingDeals.find((deal) => {
    const attrs = deal.attributes || {}
    return attrs.pipeline === pipeline && attrs.deal_name === name
  })

  if (existing) {
    await brevoFetch(`/crm/deals/${existing.id}`, {
      method: 'PATCH',
      body: {
        name,
        attributes,
        linkedContactsIds: [contactId],
      },
    })
    return { ok: true, id: existing.id, created: false }
  }

  const created = await brevoFetch('/crm/deals', {
    method: 'POST',
    body: {
      name,
      attributes,
      linkedContactsIds: [contactId],
    },
  })
  return { ok: true, id: created.id, created: true }
}

export async function sendResendEmail({ toEmail, subject, html, replyTo }) {
  const key = requireResendKey()
  const sender = senderProfile()
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: `${sender.name} <${sender.email}>`,
      to: [toEmail],
      reply_to: replyTo || sender.replyTo,
      subject,
      html,
    }),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Resend send failed ${res.status}: ${text}`)
  }
  return res.json()
}


export async function setBrevoContactEmailBlacklisted(email, blacklisted = true) {
  const identifier = encodeURIComponent(String(email || '').trim().toLowerCase())
  return brevoFetch(`/contacts/${identifier}?identifierType=email_id`, {
    method: 'PUT',
    body: { emailBlacklisted: !!blacklisted },
  })
}
