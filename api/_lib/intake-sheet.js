// The machine-readable half of an intake submission: one row per client in a single
// master Sheet. This is the seam a PM tool reads later, which is why it is a flat
// table rather than a Doc.
//
// Columns are addressed by HEADER TEXT, never by position. The header row is read
// on every write and any missing column is appended before values are placed. That
// costs one extra read per submission and buys two things worth more: reordering
// QUESTIONS cannot silently shift everyone's data one column left, and adding a
// question does not require a migration.
//
// Uses the Sheets API with the existing `drive` OAuth scope — Sheets accepts it, so
// no re-consent was needed.
import { getAccessToken } from './drive.js'
import { QUESTIONS, formatAnswer } from './intake-questions.js'

const TAB = 'Submissions'

// Written before the per-question columns. 'Deal ID' is the row identity — the
// lookup key that makes a resubmit an update instead of a second row.
export const META_COLUMNS = ['Submitted At', 'Deal ID', 'Client Name', 'Design Brief', 'Client Folder']

export function requireSheetId() {
  const id = process.env.INTAKE_MASTER_SHEET_ID
  if (!id) throw new Error('INTAKE_MASTER_SHEET_ID is not set')
  return id
}

/** 0-based column index to A1 letters (0 -> A, 26 -> AA). */
export function columnLetter(index) {
  let n = index + 1
  let out = ''
  while (n > 0) {
    const rem = (n - 1) % 26
    out = String.fromCharCode(65 + rem) + out
    n = Math.floor((n - 1) / 26)
  }
  return out
}

/** Every header this schema expects, in canonical order. */
export function expectedHeaders() {
  return [...META_COLUMNS, ...QUESTIONS.map((q) => q.label)]
}

/**
 * The values for one submission, keyed by header text.
 * Pure — no network — so the mapping is unit-testable.
 */
export function buildRowMap({ submittedAt, dealId, clientName, briefUrl, folderUrl, answers }) {
  const row = {
    'Submitted At': submittedAt || '',
    'Deal ID': dealId || '',
    'Client Name': clientName || '',
    'Design Brief': briefUrl || '',
    'Client Folder': folderUrl || '',
  }
  for (const q of QUESTIONS) {
    const value = answers[q.id]
    row[q.label] = value == null ? '' : formatAnswer(q, value)
  }
  return row
}

async function sheetsFetch(path, { method = 'GET', body, params } = {}) {
  const token = await getAccessToken()
  const url = new URL(`https://sheets.googleapis.com/v4/spreadsheets${path}`)
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v != null && v !== '') url.searchParams.set(k, String(v))
    })
  }
  const res = await fetch(url, {
    method,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    throw new Error(`Sheets ${method} ${path} failed ${res.status}: ${(await res.text()).slice(0, 300)}`)
  }
  return res.status === 204 ? null : res.json()
}

async function readHeaders(sheetId) {
  const data = await sheetsFetch(`/${sheetId}/values/${encodeURIComponent(`${TAB}!1:1`)}`)
  return data.values?.[0] || []
}

/** Append any headers this schema knows about that the sheet does not have yet. */
async function ensureHeaders(sheetId) {
  const current = await readHeaders(sheetId)
  const missing = expectedHeaders().filter((h) => !current.includes(h))
  if (!missing.length) return current

  const headers = [...current, ...missing]
  const range = `${TAB}!${columnLetter(current.length)}1:${columnLetter(headers.length - 1)}1`
  await sheetsFetch(`/${sheetId}/values/${encodeURIComponent(range)}`, {
    method: 'PUT',
    params: { valueInputOption: 'RAW' },
    body: { values: [missing] },
  })
  return headers
}

/** 1-based sheet row number for a deal id, or null. */
async function findRowByDealId(sheetId, headers, dealId) {
  const col = headers.indexOf('Deal ID')
  if (col < 0) return null
  const letter = columnLetter(col)
  const data = await sheetsFetch(`/${sheetId}/values/${encodeURIComponent(`${TAB}!${letter}:${letter}`)}`)
  const values = data.values || []
  for (let i = 1; i < values.length; i += 1) {
    if (String(values[i]?.[0] || '').trim() === String(dealId)) return i + 1
  }
  return null
}

/**
 * Write one submission. Updates the client's existing row when their deal id is
 * already present, appends otherwise. Returns {row, updated, sheetUrl}.
 */
export async function writeSubmissionRow(input) {
  const sheetId = requireSheetId()
  const headers = await ensureHeaders(sheetId)
  const rowMap = buildRowMap(input)
  // Ordered to the sheet's actual headers, not ours — a column added by hand in
  // the middle of the table must not shift everything after it.
  const values = headers.map((h) => (h in rowMap ? rowMap[h] : ''))

  const existingRow = await findRowByDealId(sheetId, headers, input.dealId)
  const lastCol = columnLetter(headers.length - 1)

  if (existingRow) {
    const range = `${TAB}!A${existingRow}:${lastCol}${existingRow}`
    await sheetsFetch(`/${sheetId}/values/${encodeURIComponent(range)}`, {
      method: 'PUT',
      params: { valueInputOption: 'RAW' },
      body: { values: [values] },
    })
    return { row: existingRow, updated: true, sheetUrl: sheetUrlFor(sheetId) }
  }

  const appended = await sheetsFetch(`/${sheetId}/values/${encodeURIComponent(`${TAB}!A1`)}:append`, {
    method: 'POST',
    params: { valueInputOption: 'RAW', insertDataOption: 'INSERT_ROWS' },
    body: { values: [values] },
  })
  const updatedRange = appended?.updates?.updatedRange || ''
  const row = Number(updatedRange.match(/!\D+(\d+)/)?.[1]) || null
  return { row, updated: false, sheetUrl: sheetUrlFor(sheetId) }
}

export function sheetUrlFor(sheetId = requireSheetId()) {
  return `https://docs.google.com/spreadsheets/d/${sheetId}/edit`
}
