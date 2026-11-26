import { BRAND } from '@/lib/config/brand'
import Link from 'next/link'

export const metadata = {
  title: `Use Cases - ${BRAND.name}`,
  description: 'Certificates people are proud to share, for coaches, wellness trainers, course creators, cohort trainers, marketing teams, customer education and associations',
}

function Check() {
  return (
    <span className="mr-3 mt-[0.55em] h-1.5 w-1.5 flex-shrink-0 rounded-full bg-teal" aria-hidden="true" />
  )
}

function Segment({
  id,
  title,
  lede,
  challenge,
  outcome,
  getsTitle,
  gets,
}: {
  id: string
  title: string
  lede: string
  challenge: string
  outcome: string
  getsTitle: string
  gets: string[]
}) {
  return (
    <div id={id} className="scroll-mt-24">
      <div className="mb-12 text-center">
        <h2 className="display-2 mb-4">{title}</h2>
        <p className="lede mx-auto max-w-2xl">{lede}</p>
      </div>
      <div className="mb-12 grid grid-cols-1 gap-8 md:grid-cols-2">
        <div className="rounded-card bg-sun-pale p-8">
          <h3 className="mb-3 font-display text-lg font-bold tracking-[-0.02em] text-ink">The challenge</h3>
          <p className="text-ink-soft">{challenge}</p>
        </div>
        <div className="rounded-card bg-mint p-8">
          <h3 className="mb-3 font-display text-lg font-bold tracking-[-0.02em] text-ink">The {BRAND.name} outcome</h3>
          <p className="text-ink-soft">{outcome}</p>
        </div>
      </div>
      <div className="card p-8">
        <h3 className="mb-4 font-display text-lg font-bold tracking-[-0.02em] text-ink">{getsTitle}</h3>
        <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {gets.map((g) => (
            <li key={g} className="flex items-start text-ink-soft">
              <Check />
              {g}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export default function UseCasesPage() {
  return (
    <div className="">
      {/* Hero */}
      <div className="band-ink py-24">
        <div className="site-wrap text-center">
          <p className="eyebrow">Use cases</p>
          <h1 className="display-1 mx-auto mb-6 max-w-[14em]">
            Certificates for every kind of training you run
          </h1>
          <p className="lede mx-auto max-w-3xl">
            Coaches, yoga and wellness trainers, course creators, live and cohort trainers, marketing teams, SaaS customer education and associations. Give everyone you train a certificate they&apos;re proud to share.
          </p>
        </div>
      </div>

      {/* Use Cases */}
      <div className="site-wrap py-24 space-y-32">
        
        <Segment
          id="coaches-wellness"
          title="Coaches, yoga and wellness trainers"
          lede="Mark a finished program, retreat or teacher training with a certificate worth posting, and let every share introduce you to someone new."
          challenge="Your clients and students finish something they worked hard for, but there's nothing to show for it beyond a thank-you email, and word of mouth stays small."
          outcome="A designed certificate arrives with a public page, a QR code and a one-tap Share to LinkedIn. Each post puts your name in front of their network."
          getsTitle="What coaches and wellness trainers get"
          gets={[
            'Start free with 250 certificates a year',
            'The certificate designer and templates',
            'Issue one at a time or in bulk by CSV',
            'A claim celebration and share prompt for learners',
            'Emails from your sender name (Starter plan)',
            'Your own call to action on certificate pages (Growth plan)',
          ]}
        />

        <Segment
          id="course-creators"
          title="Course creators, live and cohort trainers"
          lede="When a course, workshop or cohort wraps, completion is a great moment to be seen. Make the certificate the thing they want to post."
          challenge="Most completion certificates arrive as a PDF nobody posts, so the proudest moment of the course happens quietly."
          outcome="Send a whole cohort's certificates by CSV the day it ends. Learners get a reveal, a ready-made post and a one-tap share, so people who might join the next cohort see it."
          getsTitle="What course creators and cohort trainers get"
          gets={[
            'CSV issuing for a whole cohort, or one at a time',
            'A ready-made post, plus X, Facebook and email sharing',
            'Share and click analytics per program (Growth plan)',
            'A next-step link back to your next cohort (Growth plan)',
            'Expiry dates for programs that need renewing (Starter plan)',
            'Move up a plan when you need more volume or features',
          ]}
        />

        {/* Customer Education */}
        <div id="customer-education" className="scroll-mt-24">
          <div className="text-center mb-12">
            <h2 className="display-2 mb-4">Marketing teams and SaaS customer education</h2>
            <p className="lede max-w-2xl mx-auto">
              Turn product education into a signup channel. Every certificate your customers share becomes a verified signal that your product works.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <div className="bg-sun-pale rounded-card p-8">
              <h3 className="mb-3 font-display text-lg font-bold tracking-[-0.02em] text-ink">The challenge</h3>
              <p className="text-ink-soft">
                Your customer education team certifies hundreds or thousands of users each quarter. Those certificates sit unused—no one sees them, and you can&apos;t prove they drive signups.
              </p>
            </div>
            <div className="bg-mint rounded-card p-8">
              <h3 className="mb-3 font-display text-lg font-bold tracking-[-0.02em] text-ink">The {BRAND.name} outcome</h3>
              <p className="text-ink-soft">
                Certificates land in email with a one-click LinkedIn button. Each share reaches their network with your product name and certification URL. On Growth, those clicks can be tracked back to your signup page.
              </p>
            </div>
          </div>

          <div className="card p-8">
            <h3 className="mb-4 font-display text-lg font-bold tracking-[-0.02em] text-ink">What customer education teams get</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ul className="space-y-3">
                <li className="flex items-start">
                  <Check />
                  <span className="text-ink-soft">Bulk import of everyone who completes your program</span>
                </li>
                <li className="flex items-start">
                  <Check />
                  <span className="text-ink-soft">Branded certificate pages</span>
                </li>
                <li className="flex items-start">
                  <Check />
                  <span className="text-ink-soft">LinkedIn share tracking (Growth plan)</span>
                </li>
              </ul>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <Check />
                  <span className="text-ink-soft">Click-through analytics to signup page (Growth plan)</span>
                </li>
                <li className="flex items-start">
                  <Check />
                  <span className="text-ink-soft">Per-program performance metrics (Growth plan)</span>
                </li>
                <li className="flex items-start">
                  <Check />
                  <span className="text-ink-soft">A yearly certificate limit on each plan, available up front, with 500-certificate top-ups for bursts (coming soon)</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Partner Enablement */}
        <div id="partner-enablement" className="scroll-mt-24">
          <div className="text-center mb-12">
            <h2 className="display-2 mb-4">Partner Enablement</h2>
            <p className="lede max-w-2xl mx-auto">
              Certify partners, resellers, and service providers. Track who&apos;s promoting your product and turn certifications into referral channels.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <div className="bg-sun-pale rounded-card p-8">
              <h3 className="mb-3 font-display text-lg font-bold tracking-[-0.02em] text-ink">The challenge</h3>
              <p className="text-ink-soft">
                You need partners to complete your certification program and promote it to their networks. You have no visibility into who shares their credentials or what reach they generate.
              </p>
            </div>
            <div className="bg-mint rounded-card p-8">
              <h3 className="mb-3 font-display text-lg font-bold tracking-[-0.02em] text-ink">The {BRAND.name} outcome</h3>
              <p className="text-ink-soft">
                Partners add certifications to LinkedIn with one click. On Growth, you can see who shares, how many views each partner drives, and which cohorts generate the most reach.
              </p>
            </div>
          </div>

          <div className="card p-8">
            <h3 className="mb-4 font-display text-lg font-bold tracking-[-0.02em] text-ink">What partner teams get</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ul className="space-y-3">
                <li className="flex items-start">
                  <Check />
                  <span className="text-ink-soft">Tiered certification levels</span>
                </li>
                <li className="flex items-start">
                  <Check />
                  <span className="text-ink-soft">Expiry dates (Starter plan)</span>
                </li>
                <li className="flex items-start">
                  <Check />
                  <span className="text-ink-soft">Partner reach analytics (Growth plan)</span>
                </li>
              </ul>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <Check />
                  <span className="text-ink-soft">Revocation for compliance</span>
                </li>
                <li className="flex items-start">
                  <Check />
                  <span className="text-ink-soft">Reissue certificates for renewals</span>
                </li>
                <li className="flex items-start">
                  <Check />
                  <span className="text-ink-soft">Recertification campaigns (Business plan, coming soon)</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Trainers & Associations */}
        <div id="trainers-associations" className="scroll-mt-24">
          <div className="text-center mb-12">
            <h2 className="display-2 mb-4">Associations and professional trainers</h2>
            <p className="lede max-w-2xl mx-auto">
              Run professional training or a membership certification. Give everyone you certify a credential they&apos;re proud to share.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <div className="bg-sun-pale rounded-card p-8">
              <h3 className="mb-3 font-display text-lg font-bold tracking-[-0.02em] text-ink">The challenge</h3>
              <p className="text-ink-soft">
                You certify professionals or members and need certificates that look as credible as your organisation. You want to know if people share them and whether that brings new people to you.
              </p>
            </div>
            <div className="bg-mint rounded-card p-8">
              <h3 className="mb-3 font-display text-lg font-bold tracking-[-0.02em] text-ink">The {BRAND.name} outcome</h3>
              <p className="text-ink-soft">
                Certificate pages in your brand colors, issued one at a time or in bulk by CSV. On Growth, LinkedIn shares can be tracked to your site, and analytics show which cohorts drive the most reach.
              </p>
            </div>
          </div>

          <div className="card p-8">
            <h3 className="mb-4 font-display text-lg font-bold tracking-[-0.02em] text-ink">What trainers and associations get</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ul className="space-y-3">
                <li className="flex items-start">
                  <Check />
                  <span className="text-ink-soft">Custom brand colors on certificate pages</span>
                </li>
                <li className="flex items-start">
                  <Check />
                  <span className="text-ink-soft">Issue one at a time or in bulk by CSV</span>
                </li>
                <li className="flex items-start">
                  <Check />
                  <span className="text-ink-soft">Custom email templates, sent from your sender name (Starter plan)</span>
                </li>
              </ul>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <Check />
                  <span className="text-ink-soft">LinkedIn reach analytics (Growth plan)</span>
                </li>
                <li className="flex items-start">
                  <Check />
                  <span className="text-ink-soft">Per-cohort performance tracking (Growth plan)</span>
                </li>
                <li className="flex items-start">
                  <Check />
                  <span className="text-ink-soft">Move up a plan when you need more volume or features</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="band-ink py-20">
        <div className="site-wrap text-center">
          <h2 className="display-2 mb-6">
            Give your next training a moment worth posting.
          </h2>
          <div className="flex justify-center gap-4">
            <Link
              href="/signup"
              className="btn btn-primary"
            >
              Start free
            </Link>
            <Link
              href="/contact"
              className="btn btn-ghost-light"
            >
              Talk to us
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
