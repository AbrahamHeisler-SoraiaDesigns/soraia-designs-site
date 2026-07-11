import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from 'react-router-dom'
import AuditNav from '../../components/AuditNav'
import Footer from '../../components/Footer'
import {
  auditStage1Schema,
  auditEnrichmentSchema,
  US_STATES,
  PRIMARY_GOAL_OPTIONS,
  CURRENT_PERFORMANCE_OPTIONS,
  BUDGET_TIER_OPTIONS,
  TIMELINE_OPTIONS,
  IS_LISTED_OPTIONS,
  SMS_CONSENT_LABEL,
} from '../../lib/audit-schema'

function getUtmAndAttribution() {
  if (typeof window === 'undefined') return {}
  const params = new URLSearchParams(window.location.search)
  const get = (k) => params.get(k) || ''
  const cookie = (name) => {
    const m = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]+)'))
    return m ? decodeURIComponent(m[1]) : ''
  }
  // Synthesize the click-id (_fbc) from fbclid when the pixel hasn't set the
  // cookie yet — without it, ad leads can only attribute view-through, not click.
  const fbclid = get('fbclid')
  let fbc = cookie('_fbc')
  if (!fbc && fbclid) fbc = `fb.1.${Date.now()}.${fbclid}`
  return {
    utm_source: get('utm_source'),
    utm_medium: get('utm_medium'),
    utm_campaign: get('utm_campaign'),
    utm_content: get('utm_content'),
    utm_term: get('utm_term'),
    referrer: document.referrer || '',
    landing_page: window.location.href,
    gclid: get('gclid'),
    fbclid,
    fbp: cookie('_fbp'),
    fbc,
    hubspotutk: cookie('hubspotutk'),
  }
}

const inputBase =
  'w-full font-sans text-charcoal bg-white border border-stone/50 px-4 py-3 focus:outline-none focus:border-brass transition-colors'
const labelBase = 'font-sans text-charcoal font-medium block mb-2'
const errorBase = 'font-sans text-red-700 mt-1 text-sm'
const helpBase = 'font-sans text-mid-charcoal/60 text-sm mt-1'

function Field({ label, error, help, required, children }) {
  return (
    <div>
      <label className={labelBase}>
        {label} {required && <span className="text-brass">*</span>}
      </label>
      {children}
      {help && !error && <p className={helpBase}>{help}</p>}
      {error && <p className={errorBase}>{error.message || error}</p>}
    </div>
  )
}

export default function AuditGetStarted() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [phoneErr, setPhoneErr] = useState('') // variant-B required-phone message (controlled)
  const [captured, setCaptured] = useState(null) // { full_name, email } carried into Stage 2

  // Phone-capture A/B (2026-07-10). 'optional' = control (phone not required),
  // 'required' = phone required to complete Stage 2. Assigned once, made sticky
  // via localStorage so a reload/return keeps the same variant, then persisted
  // to HubSpot at capture for measurement.
  const [phoneVariant] = useState(() => {
    if (typeof window === 'undefined') return 'optional'
    try {
      const saved = window.localStorage.getItem('audit_phone_variant')
      if (saved === 'optional' || saved === 'required') return saved
      const assigned = Math.random() < 0.5 ? 'optional' : 'required'
      window.localStorage.setItem('audit_phone_variant', assigned)
      return assigned
    } catch {
      return Math.random() < 0.5 ? 'optional' : 'required'
    }
  })
  const phoneRequired = phoneVariant === 'required'

  useEffect(() => {
    document.title = 'Request Your Audit | Soraia Designs'
  }, [])

  const stage1 = useForm({
    resolver: zodResolver(auditStage1Schema),
    defaultValues: { is_listed: 'Yes' },
    mode: 'onBlur',
  })

  const stage2 = useForm({
    resolver: zodResolver(auditEnrichmentSchema),
    mode: 'onBlur',
  })

  // Drives the property-link helper copy + placeholder. Listed → live Airbnb/VRBO
  // (performance audit); Not-yet / coming-soon → Zillow/Realtor/Redfin (launch audit).
  const isListed = stage1.watch('is_listed')
  const linkHelp =
    isListed === 'Yes'
      ? 'Listed? Paste your Airbnb or VRBO link so we can pull live performance.'
      : "Not live yet? A Zillow, Realtor.com, or Redfin link works — we just need eyes on the property."
  const linkPlaceholder =
    isListed === 'Yes'
      ? 'https://www.airbnb.com/rooms/...'
      : 'https://www.zillow.com/homedetails/...'

  // Stage 1 — the conversion event. Capture the lead server-side, fire the
  // Lead pixel, then advance to the optional enrichment step.
  const onCapture = async (data) => {
    setSubmitting(true)
    setSubmitError('')
    try {
      const payload = { ...data, ...getUtmAndAttribution(), phone_capture_variant: phoneVariant, stage: 1 }
      const res = await fetch('/api/audit-submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(
          body.message ||
          'Audit request form is temporarily unavailable. Please email abe@soraiadesigns.com directly.'
        )
      }
      const result = await res.json().catch(() => ({}))
      if (typeof window !== 'undefined' && window.fbq) {
        window.fbq('track', 'Lead', {}, { eventID: result.event_id })
      }
      setCaptured({ full_name: data.full_name, email: data.email })
      setSubmitting(false)
      setStep(2)
      if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      setSubmitError(err.message || 'Something went wrong. Please try again or email abe@soraiadesigns.com.')
      setSubmitting(false)
    }
  }

  // Stage 2 — enrich the captured lead. Best-effort: the lead is already ours,
  // so we route to the confirmation page even if enrichment hiccups.
  const onEnrich = async (data) => {
    // Variant B (phone required): zod keeps phone optional server-side so a
    // captured lead is never 400'd, so we enforce the required-ness on the
    // client here with a controlled error (RHF setError is cleared by the
    // resolver on submit). data.phone is already normalized to '' or E.164.
    setPhoneErr('')
    if (phoneRequired && !data.phone) {
      setPhoneErr('Add a phone number so we can text your audit the moment it lands.')
      stage2.setFocus('phone')
      return
    }
    setSubmitting(true)
    setSubmitError('')
    try {
      const payload = {
        ...data,
        email: captured?.email,
        full_name: captured?.full_name,
        // When they opt in, carry the verbatim label so the backend can store
        // the exact consent text shown for the compliance audit trail.
        sms_consent_text: data.sms_consent ? SMS_CONSENT_LABEL : '',
        phone_capture_variant: phoneVariant,
        ...getUtmAndAttribution(),
        stage: 2,
      }
      await fetch('/api/audit-submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
    } catch {
      // non-blocking — the lead was captured at Stage 1
    }
    navigate('/audit/requested')
  }

  return (
    <div className="bg-ivory min-h-screen">
      <AuditNav />

      <main className="pt-20">
        <section className="px-6 lg:px-12 py-16 lg:py-24">
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)] gap-12 items-start">
            <div>
              <p className="section-label mb-4">{step === 1 ? 'Get the audit' : 'Step 2 of 2'}</p>
              <h1
                className="font-serif text-charcoal mb-4"
                style={{ fontSize: 'clamp(32px, 4vw, 48px)', fontWeight: 400 }}
              >
                {step === 1 ? (
                  <>Tell us about the <em className="not-italic font-medium">property</em>.</>
                ) : (
                  <>Shape your <em className="not-italic font-medium">audit</em>.</>
                )}
              </h1>
              <p className="font-sans text-mid-charcoal mb-8 leading-relaxed max-w-2xl" style={{ fontSize: 17 }}>
                {step === 1
                  ? 'Senior strategist on every audit. Written report back within 48 hours.'
                  : 'Three quick questions decide what we analyze and the plan we send back.'}
              </p>

              <div className="relative overflow-hidden border border-stone/40 bg-white/70 mb-12 lg:hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-charcoal/35 via-charcoal/10 to-transparent" />
                <img
                  src="https://pub-b732a2cfd217455192c17bafa7883c05.r2.dev/129-web-or-mls-Lets%20Go%20Click-056.jpeg"
                  alt="Warm, elevated STR interior"
                  className="w-full h-[240px] object-cover"
                />
              </div>

              {/* ── STAGE 1 — lead capture (≤6 fields) ── */}
              {step === 1 && (
                <form onSubmit={stage1.handleSubmit(onCapture)} className="space-y-10" noValidate>
                  {/* Honeypot */}
                  <div aria-hidden="true" style={{ position: 'absolute', left: '-9999px' }}>
                    <label>Company legal name (do not fill)
                      <input type="text" tabIndex={-1} autoComplete="off" {...stage1.register('_company_legal_name')} />
                    </label>
                  </div>

                  <fieldset className="space-y-6">
                    <legend className="font-serif text-charcoal mb-4" style={{ fontSize: 22, fontWeight: 500 }}>
                      About you
                    </legend>
                    <Field label="Full name" required error={stage1.formState.errors.full_name}>
                      <input type="text" {...stage1.register('full_name')} className={inputBase} autoComplete="name" />
                    </Field>
                    <Field label="Email" required error={stage1.formState.errors.email} help="Personal email reaches you faster than a role-based one.">
                      <input type="email" {...stage1.register('email')} className={inputBase} autoComplete="email" />
                    </Field>
                  </fieldset>

                  <fieldset className="space-y-6">
                    <legend className="font-serif text-charcoal mb-4" style={{ fontSize: 22, fontWeight: 500 }}>
                      The property
                    </legend>
                    <Field label="Street address" required error={stage1.formState.errors.property_street}>
                      <input type="text" {...stage1.register('property_street')} className={inputBase} autoComplete="address-line1" />
                    </Field>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <Field label="City" required error={stage1.formState.errors.property_city}>
                        <input type="text" {...stage1.register('property_city')} className={inputBase} autoComplete="address-level2" />
                      </Field>
                      <Field label="State" required error={stage1.formState.errors.property_state}>
                        <select {...stage1.register('property_state')} className={inputBase} defaultValue="">
                          <option value="" disabled>Select…</option>
                          {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </Field>
                      <Field label="ZIP" required error={stage1.formState.errors.property_zip}>
                        <input type="text" {...stage1.register('property_zip')} className={inputBase} autoComplete="postal-code" maxLength={5} />
                      </Field>
                    </div>
                    <Field label="Bedrooms" required error={stage1.formState.errors.property_bedrooms}>
                      <select {...stage1.register('property_bedrooms')} className={inputBase} defaultValue="">
                        <option value="" disabled>Select…</option>
                        {[1,2,3,4,5,6,7,8,9].map((n) => (
                          <option key={n} value={n}>{n === 9 ? '8+' : n}</option>
                        ))}
                      </select>
                    </Field>

                    <Field label="Currently listed on Airbnb / VRBO?" required error={stage1.formState.errors.is_listed}>
                      <div className="flex flex-wrap gap-6">
                        {IS_LISTED_OPTIONS.map((opt) => (
                          <label key={opt} className="flex items-center gap-2 font-sans text-charcoal cursor-pointer">
                            <input type="radio" value={opt} {...stage1.register('is_listed')} className="accent-brass" />
                            <span>{opt}</span>
                          </label>
                        ))}
                      </div>
                    </Field>

                    <Field label="Property link" required error={stage1.formState.errors.listing_url} help={linkHelp}>
                      <input
                        type="url"
                        {...stage1.register('listing_url')}
                        className={inputBase}
                        placeholder={linkPlaceholder}
                      />
                      <p className="font-sans text-mid-charcoal/55 text-sm mt-2">
                        No link yet? Email your photos to{' '}
                        <a href="mailto:audit@soraiadesigns.com" className="underline hover:text-charcoal">audit@soraiadesigns.com</a>{' '}
                        and we'll build from those.
                      </p>
                    </Field>
                  </fieldset>

                  {submitError && (
                    <div className="border border-red-300 bg-red-50 px-4 py-3 font-sans text-red-800 text-sm">
                      {submitError}
                    </div>
                  )}

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full sm:w-auto font-sans text-xs font-medium tracking-widest uppercase px-10 py-4 bg-charcoal text-ivory hover:bg-brass transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submitting ? 'Submitting…' : 'Get My Free Audit →'}
                    </button>
                    <p className="mt-4 font-sans text-mid-charcoal/55" style={{ fontSize: 13 }}>
                      Your information is kept confidential. We never share, sell, or syndicate your property data.
                    </p>
                  </div>
                </form>
              )}

              {/* ── STAGE 2 — enrichment (all optional) ── */}
              {step === 2 && (
                <>
                  {/* Progress indicator — step 2 of 2. Motivates finishing; no
                      "you're done" completion cue that reads as an exit. */}
                  <div className="mb-10">
                    <div className="flex items-center gap-2 mb-3" aria-hidden="true">
                      <span className="h-1.5 flex-1 bg-brass rounded-full" />
                      <span className="h-1.5 flex-1 bg-brass rounded-full" />
                    </div>
                    <p className="font-sans text-mid-charcoal/80 text-sm">
                      {captured?.full_name ? `${captured.full_name.split(' ')[0]}, you're` : "You're"} on the last step. These three answers change what we analyze and the plan we send back.
                    </p>
                  </div>

                  <form onSubmit={stage2.handleSubmit(onEnrich)} className="space-y-10" noValidate>
                    {/* Honeypot */}
                    <div aria-hidden="true" style={{ position: 'absolute', left: '-9999px' }}>
                      <label>Company legal name (do not fill)
                        <input type="text" tabIndex={-1} autoComplete="off" {...stage2.register('_company_legal_name')} />
                      </label>
                    </div>

                    <fieldset className="space-y-6">
                      <legend className="font-serif text-charcoal mb-2" style={{ fontSize: 22, fontWeight: 500 }}>
                        3 quick questions that shape your audit
                      </legend>
                      <p className="font-sans text-mid-charcoal/70 text-sm -mt-2 mb-2">
                        These change what we analyze and the plan we send.
                      </p>

                      {/* Phone — benefit-framed + visually prominent. A/B: variant
                          B requires it (enforced client-side in onEnrich), variant
                          A leaves it optional (control). */}
                      <div className="border border-brass/40 bg-brass/5 px-4 py-4">
                        <Field
                          label="Where should we text your audit when it's ready?"
                          required={phoneRequired}
                          error={stage2.formState.errors.phone || phoneErr}
                          help="US/CA number. We text the moment your report lands, so you're not refreshing your inbox."
                        >
                          <input
                            type="tel"
                            {...stage2.register('phone', {
                              onChange: () => phoneErr && setPhoneErr(''),
                            })}
                            className={inputBase}
                            autoComplete="tel"
                            placeholder="(813) 555-1234"
                          />
                        </Field>
                      </div>

                      {/* Optional SMS opt-in. Unchecked by default. Label is the
                          A2P-registered verbatim consent language — do not edit. */}
                      <div className="border border-stone/40 bg-white/60 px-4 py-4">
                        <label className="flex items-start gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            {...stage2.register('sms_consent')}
                            className="accent-brass mt-1 shrink-0"
                          />
                          <span className="font-sans text-mid-charcoal leading-relaxed" style={{ fontSize: 14 }}>
                            {SMS_CONSENT_LABEL}{' '}
                            <a href="/privacy" target="_blank" rel="noopener noreferrer" className="underline hover:text-charcoal">
                              Privacy Policy
                            </a>
                            {' · '}
                            <a href="/terms" target="_blank" rel="noopener noreferrer" className="underline hover:text-charcoal">
                              SMS Terms
                            </a>
                          </span>
                        </label>
                      </div>

                      <Field label="Bathrooms (optional)" error={stage2.formState.errors.property_bathrooms}>
                        <select {...stage2.register('property_bathrooms')} className={inputBase} defaultValue="">
                          <option value="">—</option>
                          {[1,1.5,2,2.5,3,3.5,4,4.5,5,5.5,6,6.5,7,7.5,8,9].map((n) => (
                            <option key={n} value={n}>{n === 9 ? '8+' : n}</option>
                          ))}
                        </select>
                      </Field>

                      <Field label="Primary goal" required error={stage2.formState.errors.primary_goal}>
                        <select {...stage2.register('primary_goal')} className={inputBase} defaultValue="">
                          <option value="" disabled>Select…</option>
                          {PRIMARY_GOAL_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                      </Field>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Field label="Target ADR (optional)" error={stage2.formState.errors.target_adr} help="USD per night. Leave blank if unsure.">
                          <input type="number" min="50" max="2000" {...stage2.register('target_adr')} className={inputBase} placeholder="350" />
                        </Field>
                        <Field label="Current performance (optional)" error={stage2.formState.errors.current_performance}>
                          <select {...stage2.register('current_performance')} className={inputBase} defaultValue="">
                            <option value="">—</option>
                            {CURRENT_PERFORMANCE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                          </select>
                        </Field>
                      </div>
                      <Field label="Budget tier" required error={stage2.formState.errors.budget_tier}>
                        <select {...stage2.register('budget_tier')} className={inputBase} defaultValue="">
                          <option value="" disabled>Select…</option>
                          {BUDGET_TIER_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                      </Field>
                      <Field label="Timeline" required error={stage2.formState.errors.timeline}>
                        <select {...stage2.register('timeline')} className={inputBase} defaultValue="">
                          <option value="" disabled>Select…</option>
                          {TIMELINE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                      </Field>
                      <Field label="Anything else? (optional)" error={stage2.formState.errors.notes}>
                        <textarea
                          {...stage2.register('notes')}
                          className={inputBase}
                          rows={4}
                          maxLength={1000}
                          placeholder="Refinance plans, exit timeline, design preferences, partnership structure — anything that helps us frame the audit."
                        />
                      </Field>
                    </fieldset>

                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={submitting}
                        className="w-full sm:w-auto font-sans text-xs font-medium tracking-widest uppercase px-10 py-4 bg-charcoal text-ivory hover:bg-brass transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {submitting ? 'Sending…' : 'Send These Details →'}
                      </button>
                      {/* Unobtrusive skip — kept for tab-close honesty, deliberately
                          low-contrast so it doesn't read as an invitation to leave. */}
                      <button
                        type="button"
                        onClick={() => navigate('/audit/requested')}
                        disabled={submitting}
                        className="block mt-5 font-sans text-xs text-mid-charcoal/45 underline hover:text-mid-charcoal/70 transition-colors disabled:opacity-50"
                      >
                        Skip for now
                      </button>
                    </div>
                  </form>
                </>
              )}
            </div>

            <div className="hidden lg:block lg:sticky lg:top-32">
              <div className="relative overflow-hidden border border-stone/40 bg-white/70 shadow-[0_10px_30px_rgba(44,42,39,0.08)]">
                <div className="absolute inset-0 bg-gradient-to-t from-charcoal/45 via-charcoal/10 to-transparent" />
                <img
                  src="https://pub-b732a2cfd217455192c17bafa7883c05.r2.dev/129-web-or-mls-Lets%20Go%20Click-056.jpeg"
                  alt="Warm, elevated STR interior"
                  className="w-full h-[520px] object-cover"
                />
                <div className="absolute left-0 right-0 bottom-0 p-8 text-ivory">
                  <p className="font-sans text-xs tracking-[0.24em] uppercase text-stone/80 mb-3">What you get</p>
                  <h2 className="font-serif text-3xl mb-3">A written audit built for booking performance.</h2>
                  <p className="font-sans text-sm leading-relaxed text-stone/90">
                    We review the property, the market, and the revenue story — then send back a clear written report you can actually use.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
