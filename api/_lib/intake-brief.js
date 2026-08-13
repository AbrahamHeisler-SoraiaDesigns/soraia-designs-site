// Writes the human-readable half of an intake submission: a Google Doc named
// "Design Brief — <Client>" in the client's own "Brief & Scope" folder.
//
// Why a Doc and not just the Sheet row: this is what Soraia actually opens before
// a mood board. A 45-column spreadsheet row is unreadable at that moment; the Sheet
// exists for the machines. Both are written from the same normalized answers so
// they cannot drift.
//
// Rendered as HTML and handed to Drive with a Docs mimeType — Drive does the
// conversion, so this needs only the `drive` scope and never touches the Docs API.
import { getAccessToken } from './drive.js'
import { resolveBriefTarget } from './intake-drive.js'
import { CHANGED_PREFIX, isCorrection } from './intake-schema.js'
import strSchema from './intake-questions.js'

const DOC_MIME = 'application/vnd.google-apps.document'

export function briefDocName(clientName) {
  const name = String(clientName || '').replace(/\s+/g, ' ').trim()
  return `Design Brief — ${name || 'Client'}`
}

function esc(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

// Client prose arrives with real line breaks in it. Without this the whole answer
// collapses to one run-on paragraph in the Doc.
function escMultiline(value) {
  return esc(value).replace(/\r?\n/g, '<br/>')
}

function renderValue(schema, question, value) {
  if (question.type === 'files') {
    const items = value
      .map((f) => (f.url ? `<li><a href="${esc(f.url)}">${esc(f.name)}</a></li>` : `<li>${esc(f.name)}</li>`))
      .join('')
    return `<ul>${items}</ul>`
  }
  return `<p>${escMultiline(schema.formatAnswer(question, value))}</p>`
}

/**
 * The brief as HTML. Pure — no network — so the layout is unit-testable.
 *
 * Unanswered questions are omitted rather than printed empty. 35 blank headings
 * would bury the ten answers that matter, and most questions are optional.
 */
export function renderBriefHtml({ schema = strSchema, clientName, propertyAddress, answers, submittedAt, dealId }) {
  const { QUESTIONS, SECTIONS, isQuestionActive } = schema
  const parts = []
  parts.push('<html><head><meta charset="utf-8"></head><body>')
  parts.push(`<h1>${esc(briefDocName(clientName))}</h1>`)
  if (propertyAddress) parts.push(`<p><strong>Property:</strong> ${esc(propertyAddress)}</p>`)
  parts.push(`<p><strong>Submitted:</strong> ${esc(submittedAt)}</p>`)
  if (dealId) parts.push(`<p><strong>Deal:</strong> ${esc(dealId)}</p>`)
  if (schema.title) parts.push(`<p><strong>Form:</strong> ${esc(schema.title)}</p>`)
  parts.push('<hr/>')

  // Corrections first, before anything else.
  //
  // A `confirm` question shows the client something we already believe and asks
  // them to agree. The agreements are noise — we knew those. The disagreements are
  // the entire reason the question type exists, and burying one twelve headings
  // down is how a design gets built on a fact the client already corrected.
  const corrections = QUESTIONS.filter((q) => q.type === 'confirm' && isCorrection(answers[q.id]))
  if (corrections.length) {
    parts.push('<h2>⚠ They corrected us on these</h2>')
    parts.push('<ul>')
    for (const q of corrections) {
      const detail = String(answers[q.id]).slice(CHANGED_PREFIX.length).trim()
      parts.push(
        `<li><strong>${esc(q.label)}</strong>` +
          (q.call ? `<br/><em>We had:</em> ${esc(q.call)}` : '') +
          `<br/><em>They say:</em> ${escMultiline(detail || '(no detail given)')}</li>`,
      )
    }
    parts.push('</ul><hr/>')
  }

  for (const section of SECTIONS) {
    const answered = QUESTIONS.filter(
      (q) => q.section === section.id && answers[q.id] != null && isQuestionActive(q, answers),
    )
    if (!answered.length) continue
    parts.push(`<h2>${esc(section.title)}</h2>`)
    for (const q of answered) {
      parts.push(`<h3>${esc(q.label)}</h3>`)
      // A bare "Confirmed" is meaningless six weeks later without the claim it
      // was confirming, so the brief carries the original statement with it.
      if (q.type === 'confirm' && q.call) {
        parts.push(`<p><em>${esc(q.call)}</em></p>`)
      }
      parts.push(renderValue(schema, q, answers[q.id]))
    }
  }

  const skipped = QUESTIONS.filter((q) => answers[q.id] == null && isQuestionActive(q, answers))
  if (skipped.length) {
    // Named explicitly because a blank is ambiguous otherwise: nobody can tell
    // "the client had nothing to say" from "we never asked". This is the list to
    // walk on the kickoff call.
    parts.push('<hr/><h2>Left blank</h2>')
    parts.push(`<p>${skipped.map((q) => esc(q.label)).join(' · ')}</p>`)
  }

  parts.push('</body></html>')
  return parts.join('\n')
}

async function findExistingBrief(name, parentId) {
  const token = await getAccessToken()
  const q = [
    `name = '${String(name).replace(/'/g, "\\'")}'`,
    `mimeType = '${DOC_MIME}'`,
    `'${parentId}' in parents`,
    'trashed = false',
  ].join(' and ')
  const url = new URL('https://www.googleapis.com/drive/v3/files')
  url.searchParams.set('q', q)
  url.searchParams.set('fields', 'files(id,name,webViewLink)')
  url.searchParams.set('supportsAllDrives', 'true')
  url.searchParams.set('includeItemsFromAllDrives', 'true')
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
  if (!res.ok) throw new Error(`Drive brief lookup failed ${res.status}: ${(await res.text()).slice(0, 300)}`)
  const data = await res.json()
  return data.files?.[0] || null
}

async function createBriefDoc({ name, parentId, html }) {
  const token = await getAccessToken()
  const boundary = `brief-${Math.random().toString(36).slice(2)}${process.hrtime.bigint()}`
  const metadata = { name, parents: [parentId], mimeType: DOC_MIME }
  const body = [
    `--${boundary}`,
    'Content-Type: application/json; charset=UTF-8',
    '',
    JSON.stringify(metadata),
    `--${boundary}`,
    'Content-Type: text/html; charset=UTF-8',
    '',
    html,
    `--${boundary}--`,
    '',
  ].join('\r\n')

  const res = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&supportsAllDrives=true&fields=id,name,webViewLink',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body,
    },
  )
  if (!res.ok) throw new Error(`Drive brief create failed ${res.status}: ${(await res.text()).slice(0, 300)}`)
  return res.json()
}

async function updateBriefDoc({ fileId, html }) {
  const token = await getAccessToken()
  // uploadType=media on an existing Docs file replaces the body and re-converts,
  // which keeps the file id — so any link already shared with Soraia stays live.
  const res = await fetch(
    `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media&supportsAllDrives=true&fields=id,name,webViewLink`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'text/html; charset=UTF-8',
      },
      body: html,
    },
  )
  if (!res.ok) throw new Error(`Drive brief update failed ${res.status}: ${(await res.text()).slice(0, 300)}`)
  return res.json()
}

/**
 * Create or refresh the client's design brief.
 *
 * Idempotent by document NAME within the client's own Brief & Scope folder, so a
 * resubmit rewrites one Doc instead of leaving Soraia to guess which of three is
 * current. Returns {id, url, created}.
 */
export async function writeDesignBrief({ schema = strSchema, folderId, clientName, dealId, answers, submittedAt }) {
  const brief = await resolveBriefTarget(folderId)
  const name = briefDocName(clientName)
  const html = renderBriefHtml({
    schema,
    clientName,
    // The two forms name this field differently — the STR form asks about a
    // property, the new-construction form about a project. Check both rather than
    // silently dropping the address off half the briefs.
    propertyAddress: answers.property_address || answers.project_address || '',
    answers,
    submittedAt,
    dealId,
  })

  const existing = await findExistingBrief(name, brief.id)
  const file = existing
    ? await updateBriefDoc({ fileId: existing.id, html })
    : await createBriefDoc({ name, parentId: brief.id, html })

  return {
    id: file.id,
    url: file.webViewLink || `https://docs.google.com/document/d/${file.id}/edit`,
    created: !existing,
    folder: brief.name,
  }
}
