import { BRAND } from '@/lib/config/brand'
import Link from 'next/link'

export const metadata = {
  title: `Switch from Accredible - ${BRAND.name}`,
  description: 'Free help importing your existing certificates. Imported certificates count toward your plan\'s yearly allowance.',
}

const STEPS = [
  {
    title: 'Export from Accredible',
    body: <>Download your certificate data and recipient list from Accredible.</>,
  },
  {
    title: 'We import and reissue',
    body: (
      <>
        Upload your CSV to {BRAND.name} and we create new certificates with your existing data. Each imported certificate counts toward your plan&apos;s yearly allowance.
      </>
    ),
  },
  {
    title: 'Fresh LinkedIn shares',
    body: (
      <>
        Each reissued certificate triggers a new email with the LinkedIn button. Your learners add it to their profiles again, creating a second wave of visibility.
      </>
    ),
  },
]

const INCLUDED = [
  <>Free migration help (imported certificates count toward your yearly allowance)</>,
  <>Preserve original issue dates</>,
  <>New {BRAND.name} URLs with QR code verification</>,
  <>Analytics on reissue emails and LinkedIn shares (Growth plan)</>,
]

export default function SwitchPage() {
  return (
    <div>
      <section className="site-wrap pb-12 pt-16">
        <div className="max-w-[760px]">
          <p className="eyebrow">For teams leaving another issuer</p>
          <h1 className="display-1 mb-4">Switch from Accredible</h1>
          <p className="lede mb-8">
            We&apos;ll help you import your existing certificates and reissue them with a fresh Add to LinkedIn button. Migration help is free; imported certificates count toward your plan&apos;s yearly allowance.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/signup" className="btn btn-primary">
              Start free
            </Link>
            <Link href="/contact" className="btn btn-ghost">
              Contact us
            </Link>
          </div>
        </div>
      </section>

      <section className="site-wrap pb-[72px] pt-6">
        <p className="eyebrow">Moving across</p>
        <h2 className="display-2 mb-8">How it works</h2>
        <ol className="grid gap-6 md:grid-cols-3">
          {STEPS.map((step, i) => (
            <li key={step.title} className="card p-6">
              <div className="mb-2 font-display text-[28px] font-medium text-stamp">{i + 1}</div>
              <h3 className="mb-2 text-lg font-semibold tracking-[-0.01em] text-ink">{step.title}</h3>
              <p className="text-[15px] leading-[1.55] text-ink-soft">{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="border-y border-rule bg-paper py-[72px]">
        <div className="site-wrap max-w-site">
          <h2 className="display-2 mb-6">What&apos;s included</h2>
          <ul className="max-w-3xl">
            {INCLUDED.map((item, i) => (
              <li key={i} className={`grid grid-cols-[18px_1fr] gap-3 py-3 text-base text-ink-soft ${i ? 'border-t border-rule' : ''}`}>
                <span className="font-bold text-valid" aria-hidden="true">
                  ✓
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="bg-ink py-20 text-parchment">
        <div className="site-wrap">
          <h2 className="display-2 mb-3.5 !text-parchment">Ready to switch?</h2>
          <p className="lede max-w-2xl !text-[#D8D0C4]">
            Contact us to discuss your migration. We&apos;ll help you export from Accredible and get set up on {BRAND.name}.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/contact" className="btn btn-on-ink">
              Contact us
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
