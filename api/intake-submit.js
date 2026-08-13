// Records the answers half of a client intake submission.
//
// Files do not come through here — the browser has already PUT them straight to
// Drive via /api/intake-upload-url, and arrives with the resulting file ids. This
// endpoint only ever sees small JSON, which is what keeps it inside Vercel's ~4.5 MB
// request cap no matter how many photos a client sent.
//
// Two destinations, written from one normalized answer set so they cannot drift:
//   Google Doc  "Design Brief — <Client>"  -> what Soraia opens before a mood board
//   Master Sheet row                       -> the machine-readable PM seam
//
// Idempotent by deal id. A client who submits twice rewrites their brief and their
// row rather than creating a second of each.
import { verifyIntakeToken } from './_lib/intake-token.js'
import { applyIntakeCors, parseJsonBody, tokenFailureResponse } from './_lib/intake-http.js'
import { assertClientFolder } from './_lib/intake-drive.js'
import { getForm } from './_lib/intake-forms.js'
import { writeDesignBrief } from './_lib/intake-brief.js'
import { writeSubmissionRow } from './_lib/intake-sheet.js'

export default async function handler(req, res) {
  const { origin, allowed, handled } = applyIntakeCors(req, res)
  if (handled) return undefined

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ ok: false, message: 'Method not allowed' })
  }
  if (!allowed) {
    return res.status(403).json({ ok: false, message: 'Origin not allowed' })
  }

  const body = parseJsonBody(req)
  if (body === null) {
    return res.status(400).json({ ok: false, message: 'Invalid JSON body' })
  }

  const verdict = verifyIntakeToken(body.token)
  if (!verdict.ok) return tokenFailureResponse(res, verdict)
  const { dealId, folderId, clientName } = verdict.payload

  // Which questionnaire this is. Comes from the request rather than the token —
  // see intake-forms.js for why that is not a security hole. An unknown value
  // falls back to the STR form instead of rejecting a submission we already
  // authorised.
  const form = getForm(body.form)
  const schema = form.schema

  const check = schema.validateAnswers(body.answers)
  if (!check.ok) {
    return res.status(400).json({
      ok: false,
      reason: 'missing_required',
      missing: check.missing,
      message: `Please fill in: ${check.missing.map((m) => m.label).join(', ')}`,
    })
  }
  const { answers } = check

  // The name on the token is what June resolved from the deal; the typed name is
  // what the client calls themselves. Prefer the token so the brief filename stays
  // stable across resubmits even if they type it differently the second time.
  const name = clientName || answers.full_name || ''
  const submittedAt = new Date().toISOString()

  try {
    const folder = await assertClientFolder(folderId)
    const folderUrl = `https://drive.google.com/drive/folders/${folder.id}`

    const brief = await writeDesignBrief({ schema, folderId, clientName: name, dealId, answers, submittedAt })

    // The Sheet is deliberately not fatal. If it fails the client has still been
    // recorded where the work actually happens — their own Drive folder — and
    // making them re-enter 39 answers to fix our spreadsheet would be the wrong
    // trade. Logged loudly so it gets repaired.
    let sheet = null
    try {
      sheet = await writeSubmissionRow({
        schema,
        tab: form.sheetTab,
        submittedAt,
        dealId,
        clientName: name,
        briefUrl: brief.url,
        folderUrl,
        answers,
      })
    } catch (err) {
      console.error(`[intake-submit] sheet write failed for deal ${dealId} (brief ${brief.id} is written):`, err)
    }

    console.log(
      `[intake-submit] deal ${dealId} (${name}) form=${schema.id} — brief ${brief.created ? 'created' : 'updated'} ${brief.id}` +
        (sheet ? `, sheet row ${sheet.row} ${sheet.updated ? 'updated' : 'appended'}` : ', sheet SKIPPED'),
    )

    return res.status(200).json({
      ok: true,
      resubmitted: !brief.created,
      briefUrl: brief.url,
      folderUrl,
      sheetRecorded: !!sheet,
    })
  } catch (err) {
    console.error(`[intake-submit] failed for deal ${dealId} from ${origin}:`, err)
    return res.status(502).json({
      ok: false,
      reason: 'write_failed',
      message: 'We could not save your answers. Please try again in a moment.',
    })
  }
}
