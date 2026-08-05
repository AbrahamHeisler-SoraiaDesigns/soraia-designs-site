import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Check } from 'lucide-react'
import Footer from '../components/Footer'
import FileUploader from '../components/intake/FileUploader'
import { clearDraft, loadDraft, peekToken, saveDraft } from '../lib/intake-draft'
import {
  QUESTIONS,
  SECTIONS,
  isQuestionActive,
  questionsForSection,
  validateAnswers,
} from '../../api/_lib/intake-questions'

// The question schema is imported from api/_lib rather than duplicated here. It is
// pure data with no Node dependencies, so Vite bundles it fine — and it means the
// client cannot disagree with the server about what is required. validateAnswers
// below is literally the same function /api/intake-submit runs.

const inputBase =
  'w-full font-sans text-charcoal bg-white border border-stone/50 px-4 py-3 focus:outline-none focus:border-brass transition-colors'
const labelBase = 'font-sans text-charcoal font-medium block mb-2'

function Field({ question, error, children }) {
  return (
    <div>
      <label className={labelBase} htmlFor={question.id}>
        {question.label} {question.required && <span className="text-brass">*</span>}
      </label>
      {question.help && <p className="font-sans text-mid-charcoal/60 text-sm mb-2">{question.help}</p>}
      {children}
      {error && <p className="font-sans text-red-700 mt-1 text-sm">{error}</p>}
    </div>
  )
}

function Question({ question, value, onChange, token, error, onBusyChange }) {
  const common = { id: question.id, className: inputBase }

  if (question.type === 'files') {
    return (
      <Field question={question} error={error}>
        <FileUploader
          question={question}
          token={token}
          value={value || []}
          onChange={onChange}
          onBusyChange={onBusyChange}
        />
      </Field>
    )
  }

  if (question.type === 'select') {
    return (
      <Field question={question} error={error}>
        <select {...common} value={value || ''} onChange={(e) => onChange(e.target.value)}>
          <option value="">—</option>
          {question.options.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
      </Field>
    )
  }

  if (question.type === 'multiselect') {
    const selected = Array.isArray(value) ? value : []
    return (
      <Field question={question} error={error}>
        <div className="flex flex-wrap gap-2">
          {question.options.map((o) => {
            const on = selected.includes(o)
            return (
              <button
                key={o}
                type="button"
                aria-pressed={on}
                onClick={() => onChange(on ? selected.filter((x) => x !== o) : [...selected, o])}
                className={`font-sans text-sm px-4 py-2 border transition-colors ${
                  on
                    ? 'border-brass bg-brass/10 text-charcoal'
                    : 'border-stone/50 bg-white text-mid-charcoal/70 hover:border-brass/60'
                }`}
              >
                {o}
              </button>
            )
          })}
        </div>
      </Field>
    )
  }

  if (question.type === 'longtext') {
    return (
      <Field question={question} error={error}>
        <textarea {...common} rows={4} value={value || ''} onChange={(e) => onChange(e.target.value)} />
      </Field>
    )
  }

  return (
    <Field question={question} error={error}>
      <input
        {...common}
        type={question.type === 'number' ? 'text' : question.type === 'url' ? 'url' : 'text'}
        inputMode={question.type === 'number' ? 'numeric' : undefined}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
      />
    </Field>
  )
}

export default function Intake() {
  const [params] = useSearchParams()
  const token = params.get('t') || ''
  const peeked = useMemo(() => peekToken(token), [token])

  const [answers, setAnswers] = useState({})
  const [sectionIndex, setSectionIndex] = useState(0)
  const [errors, setErrors] = useState({})
  const [uploading, setUploading] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [result, setResult] = useState(null)
  const [restored, setRestored] = useState(false)
  const hydrated = useRef(false)

  useEffect(() => {
    document.title = 'Client Onboarding | Soraia Designs'
  }, [])

  // Restore any saved draft once, before the first autosave can overwrite it.
  useEffect(() => {
    if (hydrated.current || !peeked?.dealId) return
    hydrated.current = true
    const draft = loadDraft(peeked.dealId)
    if (draft && Object.keys(draft.answers).length) {
      setAnswers(draft.answers)
      setRestored(true)
    }
  }, [peeked?.dealId])

  // Autosave. Debounced so typing a paragraph is one write, not eighty.
  useEffect(() => {
    if (!hydrated.current || !peeked?.dealId) return undefined
    const id = setTimeout(() => saveDraft(peeked.dealId, answers), 600)
    return () => clearTimeout(id)
  }, [answers, peeked?.dealId])

  const setAnswer = useCallback((id, value) => {
    setAnswers((prev) => ({ ...prev, [id]: value }))
    setErrors((prev) => (prev[id] ? { ...prev, [id]: undefined } : prev))
  }, [])

  const setBusy = useCallback((id, busy) => {
    setUploading((prev) => ({ ...prev, [id]: busy }))
  }, [])

  const anyUploading = Object.values(uploading).some(Boolean)
  const section = SECTIONS[sectionIndex]
  const isLast = sectionIndex === SECTIONS.length - 1
  const visible = questionsForSection(section.id).filter((q) => isQuestionActive(q, answers))

  const jumpToFirstMissing = (missing) => {
    const firstId = missing[0]?.id
    const q = QUESTIONS.find((x) => x.id === firstId)
    const idx = SECTIONS.findIndex((s) => s.id === q?.section)
    if (idx >= 0) setSectionIndex(idx)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (submitting || anyUploading) return

    const check = validateAnswers(answers)
    if (!check.ok) {
      setErrors(Object.fromEntries(check.missing.map((m) => [m.id, 'This one we do need.'])))
      setSubmitError(`Still needed: ${check.missing.map((m) => m.label).join(', ')}`)
      jumpToFirstMissing(check.missing)
      return
    }

    setSubmitting(true)
    setSubmitError('')
    try {
      const res = await fetch('/api/intake-submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, answers }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok || !body.ok) {
        if (body.missing?.length) {
          setErrors(Object.fromEntries(body.missing.map((m) => [m.id, 'This one we do need.'])))
          jumpToFirstMissing(body.missing)
        }
        throw new Error(body.message || 'We could not save your answers. Please try again.')
      }
      clearDraft(peeked?.dealId)
      setResult(body)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      setSubmitError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const goto = (idx) => {
    setSectionIndex(idx)
    setSubmitError('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const shell = (children) => (
    <div className="bg-ivory min-h-screen flex flex-col">
      <main className="flex-1 px-6 lg:px-12 py-16 lg:py-24">
        <div className="max-w-3xl mx-auto">{children}</div>
      </main>
      <Footer />
    </div>
  )

  // ---- no token ------------------------------------------------------------
  if (!token) {
    return shell(
      <>
        <h1 className="font-serif text-charcoal mb-4" style={{ fontSize: 'clamp(28px, 4vw, 40px)' }}>
          This page needs your personal link.
        </h1>
        <p className="font-sans text-mid-charcoal leading-relaxed">
          Your onboarding form lives at a private link we sent in your kickoff email. Open it from
          there, or email{' '}
          <a href="mailto:hello@soraiadesigns.com" className="underline hover:text-charcoal">
            hello@soraiadesigns.com
          </a>{' '}
          and we will send a fresh one.
        </p>
      </>,
    )
  }

  // ---- submitted -----------------------------------------------------------
  if (result) {
    return shell(
      <>
        <div className="w-12 h-12 border border-brass flex items-center justify-center mb-6">
          <Check className="text-brass" size={22} aria-hidden="true" />
        </div>
        <h1 className="font-serif text-charcoal mb-4" style={{ fontSize: 'clamp(28px, 4vw, 40px)' }}>
          {result.resubmitted ? 'Your answers are updated.' : 'That is everything we need.'}
        </h1>
        <p className="font-sans text-mid-charcoal leading-relaxed mb-8" style={{ fontSize: 17 }}>
          Your photos are filed and Soraia has what she needs to start your mood board. If anything
          changes, reopen your link and submit again. It updates rather than duplicates.
        </p>
        {result.briefUrl && (
          <a
            href={result.briefUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block font-sans text-xs font-medium tracking-widest uppercase px-8 py-4 border border-charcoal text-charcoal hover:bg-charcoal hover:text-ivory transition-colors"
          >
            Read your design brief →
          </a>
        )}
      </>,
    )
  }

  // ---- the form ------------------------------------------------------------
  const firstName = (peeked?.clientName || '').split(' ')[0]

  return shell(
    <>
      <p className="section-label mb-4">Client onboarding</p>
      <h1 className="font-serif text-charcoal mb-4" style={{ fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 400 }}>
        {firstName ? <>Welcome, {firstName}.</> : <>Welcome.</>}
      </h1>
      <p className="font-sans text-mid-charcoal mb-10 leading-relaxed" style={{ fontSize: 17 }}>
        Four questions are required: your name, the address, your furnishings budget, and your
        inspiration photos. Everything else helps, but leave blank anything you are unsure about.
        Your answers save as you go, so you can finish this later on the same device.
      </p>

      {restored && (
        <div className="border border-brass/40 bg-brass/5 px-4 py-3 mb-8 font-sans text-charcoal text-sm">
          We brought back what you filled in last time.
        </div>
      )}

      {/* Section stepper. Doubles as navigation — a client who wants to fix the
          budget on page 3 should not have to walk back through pages 4 and 5. */}
      <nav className="mb-10" aria-label="Sections">
        <div className="flex gap-1.5 mb-4" aria-hidden="true">
          {SECTIONS.map((s, i) => (
            <span
              key={s.id}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                i <= sectionIndex ? 'bg-brass' : 'bg-stone/50'
              }`}
            />
          ))}
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          {SECTIONS.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={() => goto(i)}
              aria-current={i === sectionIndex ? 'step' : undefined}
              className={`font-sans text-xs tracking-wide transition-colors ${
                i === sectionIndex ? 'text-charcoal font-medium' : 'text-mid-charcoal/45 hover:text-mid-charcoal'
              }`}
            >
              {s.title}
            </button>
          ))}
        </div>
      </nav>

      <form onSubmit={handleSubmit} noValidate>
        <fieldset className="space-y-8">
          <legend className="font-serif text-charcoal mb-2" style={{ fontSize: 24, fontWeight: 500 }}>
            {section.title}
          </legend>
          <p className="font-sans text-mid-charcoal/70 text-sm -mt-1 mb-2">{section.blurb}</p>

          {visible.map((q) => (
            <Question
              key={q.id}
              question={q}
              token={token}
              value={answers[q.id]}
              error={errors[q.id]}
              onChange={(v) => setAnswer(q.id, v)}
              onBusyChange={(busy) => setBusy(q.id, busy)}
            />
          ))}
        </fieldset>

        {submitError && (
          <div className="border border-red-300 bg-red-50 px-4 py-3 mt-8 font-sans text-red-800 text-sm">
            {submitError}
          </div>
        )}

        <div className="flex items-center justify-between gap-4 mt-10 pt-8 border-t border-stone/40">
          <button
            type="button"
            onClick={() => goto(sectionIndex - 1)}
            disabled={sectionIndex === 0}
            className="font-sans text-xs tracking-widest uppercase text-mid-charcoal/60 hover:text-charcoal transition-colors disabled:opacity-0 disabled:cursor-default"
          >
            ← Back
          </button>

          {isLast ? (
            <button
              type="submit"
              // Disabled while an upload is running so a client cannot submit a
              // half-uploaded photo set, and while submitting so a double-click
              // cannot create a second brief.
              disabled={submitting || anyUploading}
              className="font-sans text-xs font-medium tracking-widest uppercase px-10 py-4 bg-charcoal text-ivory hover:bg-brass transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Sending…' : anyUploading ? 'Uploading…' : 'Send It Over →'}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => goto(sectionIndex + 1)}
              className="font-sans text-xs font-medium tracking-widest uppercase px-10 py-4 bg-charcoal text-ivory hover:bg-brass transition-all duration-300"
            >
              Continue →
            </button>
          )}
        </div>
      </form>
    </>,
  )
}
