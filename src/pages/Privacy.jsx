import { Link } from 'react-router-dom'
import Nav from '../components/Nav'
import Footer from '../components/Footer'

export default function Privacy() {
  return (
    <>
      <Nav />
      <main className="pt-48 pb-24 px-6 lg:px-12 bg-ivory">
        <div className="max-w-3xl mx-auto">
          <p className="section-label mb-5">Legal</p>
          <h1 className="font-serif text-4xl md:text-5xl font-semibold text-charcoal mb-3">
            Privacy Policy
          </h1>
          <p className="font-sans text-sm text-charcoal/50 mb-12">
            Effective date: July 3, 2026
          </p>

          <div className="font-sans text-charcoal/80 leading-relaxed space-y-6" style={{ fontSize: 16 }}>
            <p>
              Soraia Designs (&ldquo;Soraia Designs,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;) operates the website soraiadesigns.com and provides short-term rental interior design strategy services. This Privacy Policy explains what information we collect, how we use it, and the choices you have.
            </p>
            <p>
              By using our website or submitting your information through any of our forms, you agree to the practices described here.
            </p>

            <h2 className="font-serif text-2xl font-semibold text-charcoal pt-4">Information we collect</h2>
            <p>
              We collect information you give us directly, including when you submit a lead form served through Facebook or Instagram advertising, book a strategy call, or contact us. This may include:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Your name</li>
              <li>Email address</li>
              <li>Phone number (mobile)</li>
              <li>Information about your short-term rental properties</li>
              <li>Any other details you choose to share with us</li>
            </ul>
            <p>
              We also collect limited technical information automatically when you visit our website, such as your IP address, browser type, and pages viewed, through standard cookies and analytics tools.
            </p>

            <h2 className="font-serif text-2xl font-semibold text-charcoal pt-4">How we use your information</h2>
            <p>We use the information we collect to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Respond to your inquiry and schedule your strategy call</li>
              <li>Send you appointment reminders and follow-up messages about the service you requested, including by SMS text message where you have provided your phone number and consent</li>
              <li>Provide, improve, and support our services</li>
              <li>Comply with our legal obligations</li>
            </ul>

            <h2 className="font-serif text-2xl font-semibold text-charcoal pt-4">SMS / text messaging</h2>
            <p>
              When you provide your phone number through one of our lead forms and consent to be contacted, you agree to receive text messages from Soraia Designs related to your inquiry, including appointment scheduling, reminders, and follow-up about our short-term rental design services.
            </p>
            <p>
              Message frequency varies. Message and data rates may apply. You can opt out at any time by replying <strong>STOP</strong>, and you can reply <strong>HELP</strong> for assistance. See our <Link to="/terms" className="text-brass hover:text-charcoal underline">SMS Terms of Service</Link> for full details.
            </p>
            <p className="font-semibold text-charcoal">
              No mobile information will be shared with third parties or affiliates for marketing or promotional purposes. Text messaging originator opt-in data and consent will not be shared with any third parties.
            </p>

            <h2 className="font-serif text-2xl font-semibold text-charcoal pt-4">How we share information</h2>
            <p>We do not sell your personal information. We do not share your information with third parties except:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>With service providers who help us operate our business (for example, our scheduling, email, and SMS delivery providers), who are permitted to use your information only to perform services for us</li>
              <li>When required by law or to protect our legal rights</li>
            </ul>
            <p>
              As stated above, mobile opt-in data and consent are never shared with third parties or affiliates for any purpose.
            </p>

            <h2 className="font-serif text-2xl font-semibold text-charcoal pt-4">Data retention</h2>
            <p>
              We keep your personal information only as long as needed to provide our services and for legitimate business or legal purposes, after which we delete or de-identify it.
            </p>

            <h2 className="font-serif text-2xl font-semibold text-charcoal pt-4">Your choices and rights</h2>
            <p>
              You may request access to, correction of, or deletion of your personal information at any time by contacting us at the address below. You can opt out of text messages at any time by replying STOP, and unsubscribe from emails using the link in any email.
            </p>

            <h2 className="font-serif text-2xl font-semibold text-charcoal pt-4">Children&rsquo;s privacy</h2>
            <p>
              Our services are not directed to individuals under 18, and we do not knowingly collect information from them.
            </p>

            <h2 className="font-serif text-2xl font-semibold text-charcoal pt-4">Changes to this policy</h2>
            <p>
              We may update this Privacy Policy from time to time. Changes take effect when we post the revised version on this page with a new effective date.
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
