import { Link } from 'react-router-dom'
import Nav from '../components/Nav'
import Footer from '../components/Footer'

export default function Terms() {
  return (
    <>
      <Nav />
      <main className="pt-48 pb-24 px-6 lg:px-12 bg-ivory">
        <div className="max-w-3xl mx-auto">
          <p className="section-label mb-5">Legal</p>
          <h1 className="font-serif text-4xl md:text-5xl font-semibold text-charcoal mb-3">
            SMS Terms of Service
          </h1>
          <p className="font-sans text-sm text-charcoal/50 mb-12">
            Effective date: July 3, 2026
          </p>

          <div className="font-sans text-charcoal/80 leading-relaxed space-y-6" style={{ fontSize: 16 }}>
            <p>
              These SMS Terms of Service govern the text messaging program operated by Soraia Designs (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;). By providing your mobile phone number and consenting to be contacted, you agree to these terms.
            </p>

            <h2 className="font-serif text-2xl font-semibold text-charcoal pt-4">Program description</h2>
            <p>
              When you submit a lead form served through our Facebook or Instagram advertising, or otherwise provide your mobile number and opt in, Soraia Designs may send you text messages related to your inquiry about our short-term rental interior design services. These messages include appointment scheduling, reminders, follow-ups, and responses to your questions.
            </p>

            <h2 className="font-serif text-2xl font-semibold text-charcoal pt-4">How you opt in</h2>
            <p>
              You opt in by submitting your mobile phone number through our lead form and affirmatively agreeing to receive text messages from Soraia Designs. Consent to receive text messages is not a condition of purchasing any goods or services.
            </p>

            <h2 className="font-serif text-2xl font-semibold text-charcoal pt-4">Message frequency</h2>
            <p>Message frequency varies based on your interaction with us.</p>

            <h2 className="font-serif text-2xl font-semibold text-charcoal pt-4">Cost</h2>
            <p>
              Message and data rates may apply, depending on your mobile carrier and plan. Soraia Designs does not charge for the messages themselves.
            </p>

            <h2 className="font-serif text-2xl font-semibold text-charcoal pt-4">Opting out</h2>
            <p>
              You can cancel the SMS service at any time by replying <strong>STOP</strong> to any message. After you send STOP, we will send one message confirming that you have been unsubscribed. You will no longer receive text messages from us unless you opt in again.
            </p>

            <h2 className="font-serif text-2xl font-semibold text-charcoal pt-4">Help</h2>
            <p>
              For help, reply <strong>HELP</strong> to any message, or contact us at <a href="mailto:abe@soraiadesigns.com" className="text-brass hover:text-charcoal underline">abe@soraiadesigns.com</a>. You can also visit soraiadesigns.com.
            </p>

            <h2 className="font-serif text-2xl font-semibold text-charcoal pt-4">Carriers</h2>
            <p>Carriers are not liable for delayed or undelivered messages.</p>

            <h2 className="font-serif text-2xl font-semibold text-charcoal pt-4">Privacy</h2>
            <p>
              Your privacy matters to us. Information collected through our text messaging program is handled in accordance with our <Link to="/privacy" className="text-brass hover:text-charcoal underline">Privacy Policy</Link>. No mobile information will be shared with third parties or affiliates for marketing or promotional purposes.
            </p>

            <h2 className="font-serif text-2xl font-semibold text-charcoal pt-4">Changes to these terms</h2>
            <p>
              We may update these SMS Terms from time to time. Changes take effect when posted on this page with a new effective date.
            </p>

            <h2 className="font-serif text-2xl font-semibold text-charcoal pt-4">Contact us</h2>
            <p>
              Soraia Designs<br />
              Tampa, FL<br />
              Email: <a href="mailto:abe@soraiadesigns.com" className="text-brass hover:text-charcoal underline">abe@soraiadesigns.com</a>
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
