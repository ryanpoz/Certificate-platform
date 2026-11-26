import Link from 'next/link'
import { BRAND } from '@/lib/config/brand'
import { CertificateVisual } from '@/components/marketing/certificate-visual'

export const metadata = {
  title: `${BRAND.name} - ${BRAND.tagline}`,
  description: BRAND.description,
}

const STEPS = [
  {
    title: 'Upload your recipients',
    body: 'Import a CSV with names and emails. We validate, deduplicate, and create certificates in seconds.',
  },
  {
    title: 'They share instantly',
    body: 'Email lands with a one-click \u201cAdd to LinkedIn\u201d button and a verification page with a QR code.',
  },
  {
    title: 'Watch the reach grow',
    body: 'On Growth, share and click analytics show issued, viewed, shared, and clicks back to your site\u2014no guessing what\u2019s working.',
  },
]

const OUTCOMES = [
  'Pre-filled with your program name, dates, and certificate URL',
  'Track who clicked through from LinkedIn to your site (Growth plan)',
  'See which certificates drive the most reach (Growth plan)',
]

const METRICS = ['Issued', 'Delivered', 'Viewed', 'LinkedIn adds', 'CTA clicks']

export default function HomePage() {
  return (
    <div>
      {/* Hero */}
      <section className="pb-[88px] pt-14 lg:pt-[72px]">
        <div className="site-wrap grid items-center gap-14 lg:grid-cols-[1fr_1.05fr]">
          <div>
            <p className="eyebrow">For trainers, associations and organisations</p>
            <h1 className="display-1 mb-[22px] max-w-[11.5em]">Issue the credential. Set the expiry. Bring them back to recertify.</h1>
            <p className="lede mb-8 max-w-[36em]">
              Digital certificates with a public verification page, a QR code, and expiry dates employers can trust. Start free, add expiry dates on Starter, and send expiry reminder emails on Growth. Recertification campaigns are coming soon.
            </p>
            <div className="mb-[18px] flex flex-wrap items-center gap-3">
              <Link href="/signup" className="btn btn-primary">
                Start free
              </Link>
              <Link href="/product" className="btn btn-ghost">
                See how it works <span aria-hidden="true">→</span>
              </Link>
            </div>
            <p className="fine">Free plan: 250 certificates/year • No credit card required</p>
          </div>
          <CertificateVisual />
        </div>
      </section>

      {/* How it works */}
      <section className="border-y border-rule bg-paper py-[88px]">
        <div className="site-wrap">
          <div className="mb-12 max-w-[640px]">
            <h2 className="display-2 mb-3.5">How it works</h2>
            <p className="lede">Three steps from CSV to LinkedIn shares</p>
          </div>
          <ol className="relative grid gap-10 md:grid-cols-3 md:gap-0">
            <div className="pointer-events-none absolute left-[18px] right-[calc(33.333%-18px)] top-[17px] hidden h-px bg-[#B7AD9E] md:block" aria-hidden="true" />
            {STEPS.map((step, i) => (
              <li key={step.title} className="relative md:pr-7">
                <div className="relative z-[1] mb-[18px] flex h-9 w-9 items-center justify-center rounded-full bg-ink font-display text-base font-semibold text-parchment">
                  {i + 1}
                </div>
                <h3 className="mb-2 text-xl font-semibold tracking-[-0.01em]">{step.title}</h3>
                <p className="pr-2 text-[15px] leading-[1.55] text-ink-soft">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Outcomes */}
      <section className="py-[88px]">
        <div className="site-wrap grid items-center gap-16 lg:grid-cols-2">
          <div>
            <h2 className="display-2 mb-6">LinkedIn shares = signups</h2>
            <p className="lede mb-6">
              Every certificate your recipients add to LinkedIn becomes a verified signal to their network: your training works.
            </p>
            <ul>
              {OUTCOMES.map((item, i) => (
                <li key={item} className={`grid grid-cols-[18px_1fr] gap-3 py-3 text-base text-ink-soft ${i ? 'border-t border-rule' : ''}`}>
                  <span className="font-bold text-valid" aria-hidden="true">
                    ✓
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="overflow-hidden rounded-frame border border-ink bg-cream shadow-paper">
            <div className="flex items-center gap-2 border-b border-rule bg-parchment px-3.5 py-2.5">
              <span className="h-2 w-2 rounded-full bg-rule-strong" />
              <span className="h-2 w-2 rounded-full bg-rule-strong" />
              <span className="h-2 w-2 rounded-full bg-rule-strong" />
              <div className="flex-1 rounded-btn border border-rule bg-paper px-2.5 py-1 text-[11px] text-muted">Example: Certificate page</div>
            </div>
            <div className="p-7">
              <div className="mb-5 border-b border-rule pb-5">
                <div className="text-[11px] font-semibold uppercase tracking-[0.12em]">Northwind Training</div>
                <div className="mt-1 font-display text-[28px] font-medium leading-tight tracking-[-0.02em]">Creative Strategy Certification</div>
              </div>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-[11px] text-muted">
                <div>
                  <dt>Issued</dt>
                  <dd className="mt-0.5 text-[13px] font-semibold text-ink">Jan 15, 2026</dd>
                </div>
                <div>
                  <dt>Certificate #</dt>
                  <dd className="mt-0.5 font-mono text-[13px] font-semibold text-ink">CSB-2026-0123</dd>
                </div>
              </dl>
              <div className="mt-6">
                <span className="btn btn-sm btn-primary w-full">Add to LinkedIn</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Analytics */}
      <section className="border-y border-rule bg-paper py-[88px]">
        <div className="site-wrap">
          <div className="mb-10 max-w-[640px]">
            <p className="eyebrow">Growth and Business</p>
            <h2 className="display-2 mb-3.5">Analytics that prove impact</h2>
            <p className="lede">On the Growth and Business plans. Clear numbers on reach and engagement.</p>
          </div>
          <ul className="grid grid-cols-2 gap-px overflow-hidden rounded-card border border-rule bg-rule md:grid-cols-5">
            {METRICS.map((metric) => (
              <li key={metric} className="bg-cream px-5 py-6 text-[15px] font-semibold text-ink">
                {metric}
              </li>
            ))}
          </ul>
          <p className="fine mt-4">On Growth, your dashboard shows these metrics per program</p>
        </div>
      </section>

      {/* Pricing teaser */}
      <section className="py-[88px]">
        <div className="site-wrap text-center">
          <h2 className="display-2 mb-4">Simple plans with a yearly certificate limit</h2>
          <p className="lede mx-auto mb-8 max-w-2xl">
            Start free with 250 certificates per year. Move up to Starter, Growth or Business when you need more volume or features. Your full yearly allowance is available up front, billed monthly or annually.
          </p>
          <Link href="/pricing" className="btn btn-primary">
            See pricing
          </Link>
        </div>
      </section>

      {/* Switch CTA */}
      <section className="bg-ink py-20 text-parchment">
        <div className="site-wrap">
          <h2 className="display-2 mb-3.5 !text-parchment">Switching from Accredible? We&apos;ll help you move</h2>
          <p className="lede max-w-2xl !text-[#D8D0C4]">
            We&apos;ll help you import your existing certificates and reissue them with a fresh Add to LinkedIn button. Migration help is free; imported certificates count toward your plan&apos;s yearly allowance.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/switch" className="btn btn-on-ink">
              Learn about switching
            </Link>
            <Link href="/signup" className="btn btn-ghost-light">
              Start free
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
