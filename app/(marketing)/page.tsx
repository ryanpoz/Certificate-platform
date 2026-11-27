import Link from 'next/link'
import { BRAND } from '@/lib/config/brand'
import { ShareStage, Spark } from '@/components/marketing/certificate-visual'
import { ComingSoonBadge } from '@/components/brand/logo'

export const metadata = {
  title: `${BRAND.name} - ${BRAND.tagline}`,
  description: BRAND.description,
}

const STEPS = [
  {
    title: 'Design',
    body: 'Pick a template, add your name and logo, and make a certificate you’d be happy to see posted. Minutes, not a design project.',
  },
  {
    title: 'Issue',
    body: 'Send certificates after a workshop, a cohort, a live session, or a training you already run. CSV, or one at a time.',
  },
  {
    title: 'They share',
    body: 'Learners get a public page and a one-tap Share to LinkedIn, plus X, Facebook and email. You get the visibility.',
  },
]

const FEATURES = [
  {
    title: 'Share to LinkedIn',
    body: 'A ready-made post and a share prompt when they open their certificate, plus X, Facebook and email. The career moment, built in.',
    well: 'bg-cheer-soft text-cheer',
  },
  {
    title: 'A page worth showing',
    body: 'Every certificate gets a public verification page and a QR code. Official enough to trust, handsome enough to post.',
    well: 'bg-sun-pale text-gold',
  },
  {
    title: 'Share analytics',
    body: 'On Growth, see views, shares and clicks back to your site, so you can see the awareness your certificates create.',
    well: 'bg-teal-soft text-teal',
  },
  {
    title: 'A little fanfare',
    body: 'Confetti and a reveal the first time a learner opens their certificate, with a big Share to LinkedIn button right there.',
    well: 'bg-cheer-soft text-cheer',
  },
  {
    title: 'Your next-step link',
    body: 'On Growth, add your own call to action on the certificate page: a path from their proud moment back to your next offer.',
    well: 'bg-sun-pale text-gold',
  },
  {
    title: 'Designer and templates',
    body: 'Professional certificates in minutes. Start from a template, add your branding, and make it yours.',
    well: 'bg-teal-soft text-teal',
  },
]

const AUDIENCES = [
  'Coaches',
  'Yoga and wellness trainers',
  'Course creators',
  'Live and cohort trainers',
  'Marketing teams',
  'SaaS customer education',
  'Associations',
]

export default function HomePage() {
  return (
    <div>
      {/* Poster hero */}
      <section className="band-ink overflow-hidden pb-24 pt-16 sm:pb-[100px] sm:pt-[72px]">
        <div className="site-wrap grid items-center gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:gap-10">
          <div>
            <p className="eyebrow">Digital certificates, built to be shared</p>
            <h1 className="mb-6 max-w-[7.4em] font-display text-[54px] font-extrabold leading-[0.92] tracking-[-0.05em] text-cream sm:text-[80px]">
              Certificates people are{' '}
              <span className="bg-gold-bright px-[0.14em] pb-[0.04em] text-ink [box-decoration-break:clone] [-webkit-box-decoration-break:clone]">
                proud to share.
              </span>
            </h1>
            <p className="lede mb-8 max-w-[34em]">
              Design it, issue it after a training, and give learners a one-tap way to share it. Every share is a little more visibility for your brand. Start free with 250 certificates a year.
            </p>
            <div className="mb-5 flex flex-wrap items-center gap-3">
              <Link href="/signup" className="btn btn-primary">
                Start free
              </Link>
              <Link href="/pricing" className="btn btn-ghost-light">
                See pricing
              </Link>
            </div>
            <p className="fine">Free plan: 250 certificates/year • No credit card required • Prices in CA$</p>
          </div>
          <ShareStage />
        </div>
      </section>

      {/* Hard cut to sun */}
      <section id="how-it-works" className="band-sun py-[84px]">
        <div className="site-wrap">
          <div className="mb-11 max-w-[640px]">
            <p className="eyebrow">How it works</p>
            <h2 className="display-2 mb-3.5">Design. Issue. They share.</h2>
            <p className="lede">
              Three steps from a finished training to a career moment in someone’s feed, and a little more awareness for you.
            </p>
          </div>
          <ol className="grid gap-5 md:grid-cols-3">
            {STEPS.map((step, i) => (
              <li key={step.title} className="card p-7">
                <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-full bg-sun font-display text-base font-extrabold text-ink ring-1 ring-ink/20">
                  {i + 1}
                </div>
                <h3 className="mb-2 font-display text-[22px] font-bold tracking-[-0.03em]">{step.title}</h3>
                <p className="text-[15px] leading-[1.55] text-ink-soft">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Made for the share */}
      <section className="bg-page py-[84px]">
        <div className="site-wrap">
          <div className="mb-11 max-w-[700px]">
            <p className="eyebrow">Made for the share</p>
            <h2 className="display-2 mb-3.5">The moment they post it, your brand walks into a new feed.</h2>
            <p className="lede">A ready-made post, a public page worth showing, and the analytics to see what those shares are doing.</p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <article key={f.title} className="card p-6 shadow-soft">
                <div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-xl ${f.well}`} aria-hidden="true">
                  <Spark className="h-5 w-5" />
                </div>
                <h3 className="mb-2 font-display text-lg font-bold tracking-[-0.03em]">{f.title}</h3>
                <p className="text-[15px] leading-[1.55] text-ink-soft">{f.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Quieter, secondary: expiry and recertification */}
      <section id="expiry" className="band-mint py-[84px]">
        <div className="site-wrap grid items-center gap-10 lg:grid-cols-[1.1fr_1fr]">
          <div>
            <p className="eyebrow">When a credential should end</p>
            <h2 className="display-2 mb-3.5">Expiry and recertification, when you need them.</h2>
            <p className="lede">
              Some programs should stay current. Set an expiry date and remind people before it lapses. It’s here if you want it, not the first thing we lead with.
            </p>
          </div>
          <dl className="card divide-y divide-ink/[0.12] px-6">
            <div className="py-4">
              <dt className="font-semibold">Expiry dates</dt>
              <dd className="text-sm text-ink-soft">Starter, Growth and Business</dd>
            </div>
            <div className="py-4">
              <dt className="font-semibold">Reminder emails and an expiring-soon view</dt>
              <dd className="text-sm text-ink-soft">Growth and Business</dd>
            </div>
            <div className="py-4">
              <dt className="font-semibold">
                Recertification campaigns <ComingSoonBadge />
              </dt>
              <dd className="text-sm text-ink-soft">Business</dd>
            </div>
          </dl>
        </div>
      </section>

      {/* Who it's for */}
      <section className="bg-page py-[84px] text-center">
        <div className="site-wrap">
          <p className="eyebrow">Who it’s for</p>
          <h2 className="display-2 mb-8">From a solo coach to a whole association.</h2>
          <ul className="mx-auto flex max-w-[860px] flex-wrap justify-center gap-2.5">
            {AUDIENCES.map((a) => (
              <li key={a} className="rounded-btn border border-ink/[0.14] bg-paper px-4 py-2 text-[15px] font-semibold text-ink">
                {a}
              </li>
            ))}
          </ul>
          <p className="mt-8">
            <Link href="/use-cases" className="font-semibold text-cheer underline decoration-2 underline-offset-4 hover:text-cheer-hover">
              See how each one uses it
            </Link>
          </p>
        </div>
      </section>

      {/* Cheer close */}
      <section className="band-cheer relative overflow-hidden py-[84px] text-center">
        <Spark className="absolute left-[6%] top-8 h-16 w-16 text-cream" />
        <Spark className="absolute bottom-8 right-[7%] h-12 w-12 text-cream" />
        <div className="site-wrap relative">
          <h2 className="display-2 mx-auto mb-3.5 max-w-[16em]">Give your next training a moment worth posting.</h2>
          <p className="lede mx-auto mb-8 max-w-[34em]">
            Start free with 250 certificates a year. Upgrade when you need more room, branding, or the analytics behind the shares.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/signup" className="btn bg-white text-ink shadow-[0_14px_32px_rgba(23,20,31,0.18)] hover:bg-cream">
              Start free
            </Link>
            <Link href="/pricing" className="btn border-white/70 text-white hover:bg-white/10">
              See pricing
            </Link>
          </div>
          <p className="mx-auto mt-8 max-w-[40em] text-sm text-white">
            <Link href="/switch" className="font-semibold underline decoration-2 underline-offset-4">
              Moving from another certificate platform?
            </Link>{' '}
            Migration help is free; imported certificates count toward your plan&apos;s yearly allowance.
          </p>
        </div>
      </section>
    </div>
  )
}
