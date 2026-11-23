import Link from 'next/link'
import { BRAND } from '@/lib/config/brand'

export const metadata = {
  title: `Pricing - ${BRAND.name}`,
  description:
    'Simple certificate pricing in CA$. Start free with 250 certificates a year, then move up a plan for more volume or features.',
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
      { text: 'Branded email (sender name, reply-to, logo)' },
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

export default function PricingPage() {
  return (
    <div className="bg-white py-24 sm:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            Pricing
          </h1>
          <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
            Prices in CA$, billed monthly. Pay annually at 10x the monthly price and get two months free. Cancel anytime.
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
            Need more? Add 500 certificates for CA$49 on Starter, or CA$39 on Growth and Business. A small 10% grace applies over your plan limit. Tests and duplicates don&apos;t count.
          </p>
          <p className="text-sm text-gray-500">
            Features marked coming soon are included in that plan and are still rolling out.
          </p>
        </div>

        <div className="mt-24 max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">FAQ</h2>
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">What counts as a certificate?</h3>
              <p className="text-gray-600">
                Each certificate you issue in a 12-month period counts toward your plan limit. Tests and duplicates don&apos;t count.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">What if I go over my limit?</h3>
              <p className="text-gray-600">
                A small 10% grace applies over your plan limit. After that, add a 500-certificate pack or move up to the next plan. Certificates you have already issued stay verifiable.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">How does annual billing work?</h3>
              <p className="text-gray-600">
                Pay 10 times the monthly price for a year&mdash;that&apos;s two months free. You can still pay month to month and cancel anytime.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">How do share analytics work?</h3>
              <p className="text-gray-600">
                On Growth and Business, we count shares and views of each verification page, so you can see which certificates get reach and which clicks come back to you.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Can I white-label and use my own domain?</h3>
              <p className="text-gray-600">
                A custom domain and full white-label, including removal of our branding, are on Business. Growth includes a page address on our domain, such as /acme, with a small &ldquo;Verified by&rdquo; mark in the footer.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
