import Link from 'next/link'
import { BRAND } from '@/lib/config/brand'
import { PLANS, PLAN_ORDER, type PlanId } from '@/lib/billing/plans'
import { FEATURES, FEATURE_KEYS, LIMITS, can } from '@/lib/billing/entitlements'

export const metadata = {
  title: `Pricing - ${BRAND.name}`,
  description:
    'Simple certificate pricing in CA$. Start free with 250 certificates a year. Your full yearly allowance is available up front, billed monthly or annually.',
}

type FeatureItem = {
  text: string
  comingSoon?: boolean
}

type Plan = {
  name: string
  price: string
  pricePrefix?: string
  period?: string
  blurb: string
  volume: string
  features: FeatureItem[]
  cta: string
  href: string
  featured?: boolean
  ctaStyle: 'outline' | 'solid'
}

const plans: Plan[] = [
  {
    name: 'Free',
    price: 'CA$0',
    blurb: 'For getting started with certificates',
    volume: '250 certificates per year',
    features: [
      { text: 'Certificate designer and templates' },
      { text: 'CSV sending' },
      { text: 'PDF' },
      { text: 'Verification page' },
      { text: 'QR code' },
      { text: 'Add to LinkedIn' },
      { text: 'Basic counts: issued, emails sent, claimed' },
      { text: 'Includes a \u201cVerified by\u201d link' },
    ],
    cta: 'Start free',
    href: '/signup',
    ctaStyle: 'outline',
  },
  {
    name: 'Starter',
    price: 'CA$49',
    period: '/month',
    blurb: 'For trainers and organisations issuing regularly',
    volume: '1,000 certificates per year',
    features: [
      { text: 'Everything in Free, plus:' },
      { text: 'Issue API', comingSoon: true },
      { text: 'Webhook', comingSoon: true },
      { text: 'Zapier', comingSoon: true },
      { text: 'Pass-score rule', comingSoon: true },
      { text: 'Expiry dates' },
      { text: 'Branded email (your sender name and reply-to)' },
      { text: 'Badgr / Open Badges import', comingSoon: true },
      { text: '2 admin seats', comingSoon: true },
    ],
    cta: 'Choose Starter',
    href: '/signup',
    ctaStyle: 'outline',
  },
  {
    name: 'Growth',
    price: 'CA$229',
    period: '/month',
    blurb: 'For organisations that need analytics and reminders',
    volume: '5,000 certificates per year',
    features: [
      { text: 'Everything in Starter, plus:' },
      { text: 'Expiry reminder emails and an expiring-soon view', comingSoon: true },
      { text: 'Share and click analytics' },
      { text: 'Your own call to action on certificate pages' },
      { text: 'Your own page address on our domain (e.g. /acme)', comingSoon: true },
      { text: '5 admin seats', comingSoon: true },
    ],
    cta: 'Start Growth',
    href: '/signup',
    featured: true,
    ctaStyle: 'solid',
  },
  {
    name: 'Business',
    price: 'CA$499',
    pricePrefix: 'From',
    period: '/month',
    blurb: 'Custom domain, white-label and SSO, priced on request',
    volume: '10,000+ certificates per year, contact us',
    features: [
      { text: 'Everything in Growth, plus:' },
      { text: 'Custom domain', comingSoon: true },
      { text: 'Full white-label (remove our branding)', comingSoon: true },
      { text: 'SSO (SAML, setup fee applies)', comingSoon: true },
      { text: 'Multiple brands', comingSoon: true },
      { text: 'Audit log', comingSoon: true },
      { text: 'Recertification campaigns', comingSoon: true },
    ],
    cta: 'Contact us',
    href: '/contact',
    ctaStyle: 'outline',
  },
]

function CheckIcon() {
  return (
    <svg
      className="h-6 w-6 text-blue-600 mr-3 flex-shrink-0"
      fill="currentColor"
      viewBox="0 0 20 20"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
        clipRule="evenodd"
      />
    </svg>
  )
}

function Feature({ text, comingSoon }: FeatureItem) {
  return (
    <li className="flex items-start">
      <CheckIcon />
      <span className="text-gray-700">
        {text}
        {comingSoon ? (
          <span className="ml-2 inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500 align-middle">
            Coming soon
          </span>
        ) : null}
      </span>
    </li>
  )
}

const EVERY_PLAN = [
  'Certificate designer and templates',
  'CSV sending',
  'PDF, verification page and QR code',
  'Add to LinkedIn',
  'Basic counts: issued, emails sent, claimed',
  'Revoke certificates at any time',
]

function ComingSoonBadge() {
  return (
    <span className="ml-2 inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500 align-middle">
      Coming soon
    </span>
  )
}

function Included({ on }: { on: boolean }) {
  return on ? (
    <span className="text-blue-600 font-semibold" aria-label="Included">&#10003;</span>
  ) : (
    <span className="text-gray-300" aria-label="Not included">&mdash;</span>
  )
}

/** Plan comparison built from the entitlements map, so it always matches what the app enforces */
function ComparisonTable() {
  const certificates = (plan: PlanId) => {
    const n = LIMITS.certificatesPerYear.perPlan[plan].toLocaleString('en-US')
    return LIMITS.certificatesPerYear.contractPlans.includes(plan) ? `${n}+` : n
  }
  const seats = (plan: PlanId) =>
    LIMITS.adminSeats.contractPlans.includes(plan) ? 'Custom' : String(LIMITS.adminSeats.perPlan[plan])
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm" data-comparison-table>
        <thead>
          <tr className="border-b border-gray-200">
            <th className="py-3 pr-4 text-left font-semibold text-gray-900">Feature</th>
            {PLAN_ORDER.map((plan) => (
              <th key={plan} className="py-3 px-4 text-center font-semibold text-gray-900">{PLANS[plan].name}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          <tr>
            <td className="py-3 pr-4 text-gray-700">Certificates per year</td>
            {PLAN_ORDER.map((plan) => (
              <td key={plan} className="py-3 px-4 text-center text-gray-900">{certificates(plan)}</td>
            ))}
          </tr>
          <tr>
            <td className="py-3 pr-4 text-gray-700">Admin seats<ComingSoonBadge /></td>
            {PLAN_ORDER.map((plan) => (
              <td key={plan} className="py-3 px-4 text-center text-gray-900">{seats(plan)}</td>
            ))}
          </tr>
          {EVERY_PLAN.map((label) => (
            <tr key={label}>
              <td className="py-3 pr-4 text-gray-700">{label}</td>
              {PLAN_ORDER.map((plan) => (
                <td key={plan} className="py-3 px-4 text-center"><Included on /></td>
              ))}
            </tr>
          ))}
          {FEATURE_KEYS.map((feature) => (
            <tr key={feature} data-feature={feature}>
              <td className="py-3 pr-4 text-gray-700">
                {FEATURES[feature].label}
                {FEATURES[feature].status === 'coming_soon' ? <ComingSoonBadge /> : null}
              </td>
              {PLAN_ORDER.map((plan) => (
                <td key={plan} className="py-3 px-4 text-center"><Included on={can(plan, feature)} /></td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function PricingPage() {
  return (
    <div className="bg-white py-24 sm:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            Pricing
          </h1>
          <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
            Prices in CA$. Pay monthly, or pay annually at 10x the monthly price and get two months free. Either way, your full yearly certificate allowance is available from day one.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-4">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`bg-white rounded-lg p-8 relative flex flex-col ${
                plan.featured ? 'border-2 border-blue-600' : 'border-2 border-gray-200'
              }`}
            >
              {plan.featured ? (
                <div className="absolute top-0 right-6 -translate-y-1/2">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-600 text-white">
                    Most popular
                  </span>
                </div>
              ) : null}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{plan.name}</h3>
                <div className="flex items-baseline flex-wrap">
                  {plan.pricePrefix ? (
                    <span className="text-base font-medium text-gray-500 mr-2">{plan.pricePrefix}</span>
                  ) : null}
                  <span className="text-5xl font-bold text-gray-900">{plan.price}</span>
                  {plan.period ? <span className="text-gray-600 ml-2">{plan.period}</span> : null}
                </div>
                <p className="mt-2 text-sm font-medium text-gray-900">{plan.volume}</p>
                <p className="mt-1 text-sm text-gray-600">{plan.blurb}</p>
              </div>
              <ul className="space-y-4 mb-8 flex-1">
                {plan.features.map((feature) => (
                  <Feature key={feature.text} {...feature} />
                ))}
              </ul>
              <Link
                href={plan.href}
                className={
                  plan.ctaStyle === 'solid'
                    ? 'block w-full text-center px-6 py-3 text-base font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700'
                    : 'block w-full text-center px-6 py-3 text-base font-semibold text-blue-600 border-2 border-blue-600 rounded-md hover:bg-blue-50'
                }
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center max-w-3xl mx-auto space-y-3">
          <p className="text-gray-600">
            A 10% grace applies over your plan limit. Tests and duplicates don&apos;t count. For bursts, top-ups of 500 certificates will be CA$49 on Starter, or CA$39 on Growth and Business.{' '}
            <span className="ml-1 inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500 align-middle">
              Coming soon
            </span>
          </p>
          <p className="text-sm text-gray-500">
            Features marked coming soon are included in that plan and are still rolling out.
          </p>
        </div>

        <div className="mt-24">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Compare plans</h2>
          <ComparisonTable />
        </div>

        <div className="mt-24 max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">FAQ</h2>
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">What counts as a certificate?</h3>
              <p className="text-gray-600">
                Each certificate you issue in your plan year counts toward your plan limit, including renewals, reissues and certificates imported from another platform. Tests, duplicates (the same person and program again) and certificates you delete within 7 days of issuing don&apos;t count. Your plan year starts on the day you sign up and resets on that date each year.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Do I get my whole yearly allowance on monthly billing?</h3>
              <p className="text-gray-600">
                Yes. On monthly or annual billing, your full yearly certificate allowance is available from the start of your plan year, so you can issue a big cohort in one go.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">What if I go over my limit?</h3>
              <p className="text-gray-600">
                A 10% grace applies over your plan limit. After that, new issuing pauses until your plan year resets or you move up a plan. Top-ups of 500 certificates for bursts are coming soon. Certificates you have already issued stay live and verifiable.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">How does annual billing work?</h3>
              <p className="text-gray-600">
                Pay 10 times the monthly price for a year&mdash;that&apos;s two months free. You can still pay month to month and cancel anytime.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">What happens if I downgrade or cancel?</h3>
              <ul className="list-disc pl-5 space-y-2 text-gray-600">
                <li>Certificates you have issued always stay live and verifiable, and you can always revoke a certificate, on any plan.</li>
                <li>Plan changes and cancellations take effect at the end of your current billing period.</li>
                <li>
                  You can&apos;t move to a plan whose yearly limit is below what you&apos;ve already issued this plan year until your plan year resets. You can still cancel to Free, but new issuing is paused until your plan year resets or you upgrade (or add a top-up, once top-ups are available).
                </li>
                <li>Features above your new plan lock rather than disappear. Your data and settings are kept and come back when you upgrade.</li>
                <li>
                  If you use a custom domain, links on it redirect to our domain after you leave Business, so shared links don&apos;t break, as long as you keep your DNS pointed at us.
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">What does branded email include?</h3>
              <p className="text-gray-600">
                On Starter and above, certificate emails come from your sender name, and replies go to your reply-to address. On Free, emails come from {BRAND.name} and include a small &ldquo;Verified by&rdquo; footer.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">How do share analytics work?</h3>
              <p className="text-gray-600">
                On Growth and Business, we count shares and views of each verification page, so you can see which certificates get reach and which clicks come back to you. Basic counts (issued, emails sent, claimed) are on every plan.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Can I white-label and use my own domain?</h3>
              <p className="text-gray-600">
                A custom domain and full white-label, including removal of our branding, are on Business and coming soon. Growth will include a page address on our domain, such as /acme, with a small &ldquo;Verified by&rdquo; mark in the footer.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
