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
      { text: 'Expiry dates' },
      { text: 'Branded email (your sender name and reply-to)' },
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
      { text: 'Expiry reminder emails and an expiring-soon view' },
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
    <span className="absolute left-0 top-[0.45em] h-1.5 w-1.5 rounded-full bg-teal" aria-hidden="true" />
  )
}

function Feature({ text, comingSoon }: FeatureItem) {
  return (
    <li className="relative pl-4 text-[13.5px] leading-[1.45] text-ink-soft">
      <CheckIcon />
      {text}
      {comingSoon ? <ComingSoonBadge /> : null}
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
  'Claim celebration and share prompt for learners',
]

function ComingSoonBadge() {
  return <span className="badge-soon ml-2">Coming soon</span>
}

function Included({ on }: { on: boolean }) {
  return on ? (
    <span className="font-semibold text-teal" aria-label="Included">Yes</span>
  ) : (
    <span className="text-muted" aria-label="Not included">&mdash;</span>
  )
}

/** Highlighted (recommended) plan column in the comparison table */
const HIGHLIGHT: PlanId = 'growth'

function Price({ plan }: { plan: Plan }) {
  const [, currency, amount] = plan.price.match(/^(CA\$)?(.*)$/) ?? [null, '', plan.price]
  return (
    <div>
      {plan.pricePrefix ? (
        <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-muted">{plan.pricePrefix}</div>
      ) : null}
      <div className="flex items-start gap-[3px] font-display text-[44px] font-extrabold leading-[0.95] tracking-[-0.04em]">
        {currency ? <span className="mt-1.5 font-sans text-[13px] font-semibold tracking-[0.04em] text-ink-soft">{currency}</span> : null}
        {amount}
      </div>
      <div className="mb-1 mt-1.5 text-[13px] text-muted">{plan.period ? 'per month' : '\u00a0'}</div>
    </div>
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
  const th = (plan: PlanId) =>
    `px-3.5 py-3 text-center text-xs font-bold uppercase tracking-[0.08em] ${plan === HIGHLIGHT ? 'bg-cheer text-white' : 'bg-ink text-cream'}`
  const td = (plan: PlanId) => `px-3.5 py-3 text-center text-ink-soft ${plan === HIGHLIGHT ? 'bg-cheer-tint' : ''}`
  const label = 'px-3.5 py-3 text-left font-medium text-ink w-[34%]'
  return (
    <div className="overflow-x-auto rounded-card border border-ink">
      <table className="min-w-full bg-white text-sm" data-comparison-table>
        <thead>
          <tr className="border-b border-rule">
            <th className="bg-ink px-3.5 py-3 text-left text-xs font-bold uppercase tracking-[0.08em] text-cream">Feature</th>
            {PLAN_ORDER.map((plan) => (
              <th key={plan} className={th(plan)}>{PLANS[plan].name}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-rule">
          <tr>
            <td className={label}>Certificates per year</td>
            {PLAN_ORDER.map((plan) => (
              <td key={plan} className={td(plan)}>{certificates(plan)}</td>
            ))}
          </tr>
          <tr>
            <td className={label}>Admin seats<ComingSoonBadge /></td>
            {PLAN_ORDER.map((plan) => (
              <td key={plan} className={td(plan)}>{seats(plan)}</td>
            ))}
          </tr>
          {EVERY_PLAN.map((text) => (
            <tr key={text}>
              <td className={label}>{text}</td>
              {PLAN_ORDER.map((plan) => (
                <td key={plan} className={td(plan)}><Included on /></td>
              ))}
            </tr>
          ))}
          {FEATURE_KEYS.map((feature) => (
            <tr key={feature} data-feature={feature}>
              <td className={label}>
                {FEATURES[feature].label}
                {FEATURES[feature].status === 'coming_soon' ? <ComingSoonBadge /> : null}
              </td>
              {PLAN_ORDER.map((plan) => (
                <td key={plan} className={td(plan)}><Included on={can(plan, feature)} /></td>
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
    <div className="pb-24">
      <section className="band-ink pb-40 pt-16">
        <div className="site-wrap mx-auto max-w-3xl text-center">
          <p className="eyebrow">Pricing in CA$</p>
          <h1 className="mx-auto mb-5 max-w-[13em] font-display text-[44px] font-extrabold leading-[0.96] tracking-[-0.045em] text-cream sm:text-[60px]">
            Start free. Grow when the shares start adding up.
          </h1>
          <p className="lede mx-auto max-w-2xl">
            Prices in CA$. Pay monthly, or pay annually at 10x the monthly price and get two months free. Either way, your full yearly certificate allowance is available from day one.
          </p>
        </div>
      </section>
      <div className="site-wrap">
        <div className="-mt-28 grid grid-cols-1 items-stretch gap-4 pb-6 md:grid-cols-2 xl:grid-cols-4">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative flex flex-col rounded-card px-[22px] pb-[22px] ${
                plan.featured ? 'border-2 border-cheer bg-white pt-8 shadow-paper' : 'border border-ink/[0.16] bg-white pt-6 shadow-soft'
              }`}
            >
              {plan.featured ? (
                <span className="absolute -top-[12px] left-1/2 -translate-x-1/2 rounded-badge bg-cheer px-3 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-white">
                  Recommended
                </span>
              ) : null}
              <h3 className="mb-2 font-display text-[22px] font-bold tracking-[-0.03em] text-ink">{plan.name}</h3>
              <Price plan={plan} />
              <p className={`mb-3 self-start rounded-badge px-2.5 py-1 text-xs font-bold ${plan.featured ? 'bg-cheer-soft text-cheer-hover' : 'bg-sun-soft text-ink'}`}>{plan.volume}</p>
              <p className="mb-4 min-h-[3.2em] text-[13px] leading-[1.45] text-ink-soft">{plan.blurb}</p>
              <ul className="mb-5 flex flex-1 flex-col gap-2">
                {plan.features.map((feature) => (
                  <Feature key={feature.text} {...feature} />
                ))}
              </ul>
              <Link
                href={plan.href}
                className={`btn mt-auto w-full ${plan.ctaStyle === 'solid' ? 'btn-primary' : 'btn-ghost'}`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>

        <div className="mx-auto mt-6 max-w-3xl space-y-3 text-center">
          <p className="text-[15px] text-ink-soft">
            A 10% grace applies over your plan limit. Tests and duplicates don&apos;t count. For bursts, top-ups of 500 certificates will be CA$49 on Starter, or CA$39 on Growth and Business.{' '}
            <span className="badge-soon ml-1">
              Coming soon
            </span>
          </p>
          <p className="fine">
            Features marked coming soon are included in that plan and are still rolling out.
          </p>
        </div>

        <div className="mt-20">
          <h2 className="display-2 mb-6">Compare plans</h2>
          <ComparisonTable />
        </div>

        <div className="mt-20">
          <h2 className="display-2 mb-7">Questions</h2>
          <div className="grid gap-x-10 gap-y-5 md:grid-cols-2 [&>div]:border-b [&>div]:border-rule [&>div]:pb-5">
            <div>
              <h3 className="mb-2 text-base font-semibold text-ink">What counts as a certificate?</h3>
              <p className="text-[15px] text-ink-soft">
                Each certificate you issue in your plan year counts toward your plan limit, including renewals, reissues and certificates imported from another platform. Tests, duplicates (the same person and program again) and certificates you delete within 7 days of issuing don&apos;t count. Your plan year starts on the day you sign up and resets on that date each year.
              </p>
            </div>
            <div>
              <h3 className="mb-2 text-base font-semibold text-ink">Do I get my whole yearly allowance on monthly billing?</h3>
              <p className="text-[15px] text-ink-soft">
                Yes. On monthly or annual billing, your full yearly certificate allowance is available from the start of your plan year, so you can issue a big cohort in one go.
              </p>
            </div>
            <div>
              <h3 className="mb-2 text-base font-semibold text-ink">What if I go over my limit?</h3>
              <p className="text-[15px] text-ink-soft">
                A 10% grace applies over your plan limit. After that, new issuing pauses until your plan year resets or you move up a plan. Top-ups of 500 certificates for bursts are coming soon. Certificates you have already issued stay live and verifiable.
              </p>
            </div>
            <div>
              <h3 className="mb-2 text-base font-semibold text-ink">How does annual billing work?</h3>
              <p className="text-[15px] text-ink-soft">
                Pay 10 times the monthly price for a year&mdash;that&apos;s two months free. You can still pay month to month and cancel anytime.
              </p>
            </div>
            <div>
              <h3 className="mb-2 text-base font-semibold text-ink">What happens if I downgrade or cancel?</h3>
              <ul className="list-disc space-y-2 pl-5 text-[15px] text-ink-soft">
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
              <h3 className="mb-2 text-base font-semibold text-ink">What does branded email include?</h3>
              <p className="text-[15px] text-ink-soft">
                On Starter and above, certificate emails come from your sender name, and replies go to your reply-to address. On Free, emails come from {BRAND.name} and include a small &ldquo;Verified by&rdquo; footer.
              </p>
            </div>
            <div>
              <h3 className="mb-2 text-base font-semibold text-ink">How do share analytics work?</h3>
              <p className="text-[15px] text-ink-soft">
                On Growth and Business, we count shares and views of each verification page, so you can see which certificates get reach and which clicks come back to you. Basic counts (issued, emails sent, claimed) are on every plan.
              </p>
            </div>
            <div>
              <h3 className="mb-2 text-base font-semibold text-ink">Can I white-label and use my own domain?</h3>
              <p className="text-[15px] text-ink-soft">
                A custom domain and full white-label, including removal of our branding, are on Business and coming soon. Growth will include a page address on our domain, such as /acme, with a small &ldquo;Verified by&rdquo; mark in the footer.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
