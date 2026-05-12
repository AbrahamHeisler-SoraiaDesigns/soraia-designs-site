import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from 'react-router-dom'
import AuditNav from '../../components/AuditNav'
import Footer from '../../components/Footer'
import {
  auditFormSchema,
  US_STATES,
  PRIMARY_GOAL_OPTIONS,
  CURRENT_PERFORMANCE_OPTIONS,
  BUDGET_TIER_OPTIONS,
  TIMELINE_OPTIONS,
  IS_LISTED_OPTIONS,
} from '../../lib/audit-schema'

function getUtmAndAttribution() {
  if (typeof window === 'undefined') return {}
  const params = new URLSearchParams(window.location.search)
  const get = (k) => params.get(k) || ''
  const cookie = (name) => {
    const m = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]+)'))
    return m ? decodeURIComponent(m[1]) : ''
  }
  return {
    utm_source: get('utm_source'),
    utm_medium: get('utm_medium'),
    utm_campaign: get('utm_campaign'),
    utm_content: get('utm_content'),
    utm_term: get('utm_term'),
    referrer: document.referrer || '',
    landing_page: window.location.href,
    gclid: get('gclid'),
    fbp: cookie('_fbp'),
    fbc: cookie('_fbc'),
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
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  useEffect(() => {
    document.title = 'Request Your Audit | Soraia Designs'
  }, [])

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(auditFormSchema),
    defaultValues: { is_listed: 'No' },
    mode: 'onBlur',
  })

  const isListed = watch('is_listed')

  const onSubmit = async (data) => {
    setSubmitting(true)
    setSubmitError('')
    try {
      const payload = { ...data, ...getUtmAndAttribution() }
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
      navigate('/audit/requested')
    } catch (err) {
      setSubmitError(err.message || 'Something went wrong. Please try again or email abe@soraiadesigns.com.')
      setSubmitting(false)
    }
  }

  return (
    <div className="bg-ivory min-h-screen">
      <AuditNav />

      <main className="pt-20">
        <section className="px-6 lg:px-12 py-16 lg:py-24">
          <div className="max-w-3xl mx-auto">
            <p className="section-label mb-4">Get the audit</p>
            <h1
              className="font-serif text-charcoal mb-4"
              style={{ fontSize: 'clamp(32px, 4vw, 48px)', fontWeight: 400 }}
            >
              Tell us about the <em className="not-italic font-medium">property</em>.
            </h1>
            <p className="font-sans text-mid-charcoal mb-12 leading-relaxed" style={{ fontSize: 17 }}>
              Senior strategist on every audit. Written report back inside 5 business days. No follow-up pressure.
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-10" noValidate>
              {/* Honeypot */}
              <div aria-hidden="true" style={{ position: 'absolute', left: '-9999px' }}>
                <label>Company legal name (do not fill)
                  <input type="text" tabIndex={-1} autoComplete="off" {...register('_company_legal_name')} />
                </label>
              </div>

              {/* About you */}
              <fieldset className="space-y-6">
                <legend className="font-serif text-charcoal mb-4" style={{ fontSize: 22, fontWeight: 500 }}>
                  About you
                </legend>
                <Field label="Full name" required error={errors.full_name}>
                  <input type="text" {...register('full_name')} className={inputBase} autoComplete="name" />
                </Field>
                <Field label="Email" required error={errors.email} help="Personal email reaches you faster than a role-based one.">
                  <input type="email" {...register('email')} className={inputBase} autoComplete="email" />
                </Field>
                <Field
                  label="Phone"
                  error={errors.phone}
                  help="Optional. US/CA — any format works (e.g. 813-555-1234, (813) 555 1234, 8135551234)."
                >
                  <input
                    type="tel"
                    {...register('phone')}
                    className={inputBase}
                    autoComplete="tel"
                    placeholder="(813) 555-1234"
                  />
                </Field>
              </fieldset>

              {/* Property details */}
              <fieldset className="space-y-6">
                <legend className="font-serif text-charcoal mb-4" style={{ fontSize: 22, fontWeight: 500 }}>
                  Property details
                </legend>
                <Field label="Street address" required error={errors.property_street}>
                  <input type="text" {...register('property_street')} className={inputBase} autoComplete="address-line1" />
                </Field>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Field label="City" required error={errors.property_city}>
                    <input type="text" {...register('property_city')} className={inputBase} autoComplete="address-level2" />
                  </Field>
                  <Field label="State" required error={errors.property_state}>
                    <select {...register('property_state')} className={inputBase} defaultValue="">
                      <option value="" disabled>Select…</option>
                      {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </Field>
                  <Field label="ZIP" required error={errors.property_zip}>
                    <input type="text" {...register('property_zip')} className={inputBase} autoComplete="postal-code" maxLength={5} />
                  </Field>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Bedrooms" required error={errors.property_bedrooms}>
                    <select {...register('property_bedrooms')} className={inputBase} defaultValue="">
                      <option value="" disabled>Select…</option>
                      {[1,2,3,4,5,6,7,8,9].map((n) => (
                        <option key={n} value={n}>{n === 9 ? '8+' : n}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Bathrooms" required error={errors.property_bathrooms}>
                    <select {...register('property_bathrooms')} className={inputBase} defaultValue="">
                      <option value="" disabled>Select…</option>
                      {[1,1.5,2,2.5,3,3.5,4,4.5,5,5.5,6,6.5,7,7.5,8,9].map((n) => (
                        <option key={n} value={n}>{n === 9 ? '8+' : n}</option>
                      ))}
                    </select>
                  </Field>
                </div>
              </fieldset>

              {/* Listing + goals */}
              <fieldset className="space-y-6">
                <legend className="font-serif text-charcoal mb-4" style={{ fontSize: 22, fontWeight: 500 }}>
                  Listing &amp; goals
                </legend>
                <Field label="Currently listed on Airbnb / VRBO?" required error={errors.is_listed}>
                  <div className="flex flex-wrap gap-6">
                    {IS_LISTED_OPTIONS.map((opt) => (
                      <label key={opt} className="flex items-center gap-2 font-sans text-charcoal cursor-pointer">
                        <input type="radio" value={opt} {...register('is_listed')} className="accent-brass" />
                        <span>{opt}</span>
                      </label>
                    ))}
                  </div>
                </Field>
                {isListed === 'Yes' && (
                  <Field label="Listing URL" required error={errors.listing_url}>
                    <input
                      type="url"
                      {...register('listing_url')}
                      className={inputBase}
                      placeholder="https://www.airbnb.com/rooms/..."
                    />
                  </Field>
                )}
                <Field label="Primary goal" required error={errors.primary_goal}>
                  <select {...register('primary_goal')} className={inputBase} defaultValue="">
                    <option value="" disabled>Select…</option>
                    {PRIMARY_GOAL_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </Field>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Target ADR (optional)" error={errors.target_adr} help="USD per night. Leave blank if unsure.">
                    <input type="number" min="50" max="2000" {...register('target_adr')} className={inputBase} placeholder="350" />
                  </Field>
                  <Field label="Current performance (optional)" error={errors.current_performance}>
                    <select {...register('current_performance')} className={inputBase} defaultValue="">
                      <option value="">—</option>
                      {CURRENT_PERFORMANCE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </Field>
                </div>
                <Field label="Budget tier" required error={errors.budget_tier}>
                  <select {...register('budget_tier')} className={inputBase} defaultValue="">
                    <option value="" disabled>Select…</option>
                    {BUDGET_TIER_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </Field>
                <Field label="Timeline" required error={errors.timeline}>
                  <select {...register('timeline')} className={inputBase} defaultValue="">
                    <option value="" disabled>Select…</option>
                    {TIMELINE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </Field>
                <Field label="Anything else? (optional)" error={errors.notes}>
                  <textarea
                    {...register('notes')}
                    className={inputBase}
                    rows={4}
                    maxLength={1000}
                    placeholder="Refinance plans, exit timeline, design preferences, partnership structure — anything that helps us frame the audit."
                  />
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
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
