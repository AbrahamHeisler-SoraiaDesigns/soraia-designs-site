// The intake engine, extracted so more than one questionnaire can use it.
//
// There are two forms now: the original STR onboarding (intake-questions.js) and
// the new-construction selections intake (intake-questions-newbuild.js). They ask
// almost nothing in common, but normalization, validation, and formatting are
// identical for both — and if those ever forked, the client and the server would
// start disagreeing about what a valid submission is.
//
// So: each form file declares SECTIONS and QUESTIONS as data and calls makeSchema.
// The behaviour lives here, exactly once.

/**
 * Keep only http(s) URLs. The file `url` is client-supplied and lands in an href
 * in the design brief, so a `javascript:` or `data:` value would be written into
 * a document Soraia opens. Anything else is dropped and the id-derived Drive link
 * is used instead.
 */
export function safeHttpUrl(value) {
  if (!value) return null
  try {
    const u = new URL(String(value))
    return u.protocol === 'http:' || u.protocol === 'https:' ? u.href : null
  } catch {
    return null
  }
}

/**
 * Coerce one raw answer into its storage shape, or null when blank.
 *
 * Returns null rather than '' or 0 for absent values so "did they answer this?"
 * is a single check everywhere. Note that a real 0 (zero bedrooms) survives — the
 * blank test is on the trimmed string, not on falsiness.
 */
export function normalizeAnswer(question, raw) {
  if (!question) return null
  if (raw === undefined || raw === null) return null

  if (question.type === 'files') {
    if (!Array.isArray(raw)) return null
    const files = raw
      .map((f) => (typeof f === 'string' ? { name: f } : f))
      .filter((f) => f && typeof f.name === 'string' && f.name.trim())
      .map((f) => ({
        name: String(f.name).trim(),
        id: f.id ? String(f.id) : null,
        url: safeHttpUrl(f.url) || (f.id ? `https://drive.google.com/file/d/${String(f.id)}/view` : null),
      }))
    return files.length ? files : null
  }

  if (question.type === 'multiselect') {
    const list = (Array.isArray(raw) ? raw : [raw])
      .map((v) => String(v).trim())
      .filter(Boolean)
      .filter((v) => !question.options || question.options.includes(v))
    return list.length ? list : null
  }

  const text = String(raw).trim()
  if (!text) return null

  if (question.type === 'number') {
    const n = Number(text.replace(/,/g, ''))
    return Number.isFinite(n) ? n : null
  }
  if (question.type === 'select') {
    return question.options?.includes(text) ? text : null
  }
  // `confirm` stores a plain string too — either CONFIRMED_VALUE or the client's
  // correction, already prefixed by the UI. Treating it as text here means the
  // brief, the Sheet, and validation need no special case for it.
  return text
}

/** What a `confirm` question stores when the client agrees with what we had. */
export const CONFIRMED_VALUE = 'Confirmed'
/** Prefix the UI puts on a correction, so a disagreement is greppable in the brief. */
export const CHANGED_PREFIX = 'Changed — '

/**
 * True when a `confirm` answer is a correction rather than an agreement.
 *
 * Compared against the trimmed prefix on purpose. A client who taps "Not quite"
 * and writes nothing stores exactly CHANGED_PREFIX, whose trailing space
 * normalizeAnswer then trims off — so a strict startsWith would read the bare
 * disagreement as ordinary text and quietly drop it from the corrections list at
 * the top of the brief. Disagreeing without elaborating is still disagreeing.
 */
export function isCorrection(value) {
  return typeof value === 'string' && value.trimEnd().startsWith(CHANGED_PREFIX.trimEnd())
}

/** Human-readable form of one normalized answer, for the brief and the Sheet. */
export function formatAnswer(question, value) {
  if (value === null || value === undefined) return ''
  if (question.type === 'files') return value.map((f) => f.name).join(', ')
  if (question.type === 'multiselect') return value.join(', ')
  return String(value)
}

/**
 * Has a required file question actually been satisfied?
 *
 * A filename alone is not evidence: the answers payload is client-supplied, so
 * `[{name:'kitchen.jpg'}]` with nothing behind it would otherwise pass and the
 * brief would claim inspiration photos that are not in Drive. A real upload comes
 * back from /api/intake-upload-url with a Drive file id, so that is what counts.
 */
function fileAnswerSatisfied(value) {
  return Array.isArray(value) && value.some((f) => f && f.id)
}

/**
 * Bind the engine to one question set.
 *
 * Returns the same shape the original single-form module exported, so a consumer
 * can take a schema object and otherwise not care which form it is holding.
 */
export function makeSchema({ id, title, intro, doneMessage, sections, questions }) {
  if (!id) throw new Error('makeSchema: id required')
  const QUESTIONS_BY_ID = new Map(questions.map((q) => [q.id, q]))

  /**
   * True when a conditional question is currently in play. A question hidden by
   * its own condition must never be treated as unanswered — validation and the
   * brief both consult this, so a required question behind a condition does not
   * quietly block a submission it does not apply to.
   */
  function isQuestionActive(question, answers) {
    const dep = question.dependsOn
    if (!dep) return true
    return normalizeAnswer(QUESTIONS_BY_ID.get(dep.id), answers?.[dep.id]) === dep.equals
  }

  /** Normalize a whole submission. Unknown keys are dropped. */
  function normalizeAnswers(raw = {}) {
    const out = {}
    for (const q of questions) {
      const value = normalizeAnswer(q, raw[q.id])
      if (value !== null) out[q.id] = value
    }
    return out
  }

  /** Returns {ok:true, answers} or {ok:false, missing:[{id,label}]}. */
  function validateAnswers(raw = {}) {
    const answers = normalizeAnswers(raw)
    const missing = questions
      .filter((q) => {
        if (!q.required || !isQuestionActive(q, answers)) return false
        const value = answers[q.id]
        if (value == null) return true
        return q.type === 'files' ? !fileAnswerSatisfied(value) : false
      })
      .map((q) => ({ id: q.id, label: q.label }))
    return missing.length ? { ok: false, missing } : { ok: true, answers }
  }

  function questionsForSection(sectionId) {
    return questions.filter((q) => q.section === sectionId)
  }

  return {
    id,
    title,
    // What the form says above the first question. Lives with the questions
    // because it names which of them are required, and a form that promises
    // "four required" while requiring three is worse than no promise at all.
    intro,
    // Last screen the client sees. Different forms end in different places —
    // the STR intake ends at a mood board, part one of the new-construction
    // intake ends at an architect conversation.
    doneMessage,
    SECTIONS: sections,
    QUESTIONS: questions,
    QUESTIONS_BY_ID,
    REQUIRED_IDS: questions.filter((q) => q.required).map((q) => q.id),
    UPLOAD_QUESTIONS: questions.filter((q) => q.type === 'files'),
    questionsForSection,
    isQuestionActive,
    normalizeAnswer,
    normalizeAnswers,
    validateAnswers,
    formatAnswer,
    safeHttpUrl,
  }
}
