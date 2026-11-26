import { BRAND } from '@/lib/config/brand'

export const metadata = {
  title: `Contact - ${BRAND.name}`,
}

export default function ContactPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
      <h1 className="display-1 mb-4">Contact us</h1>
      <p className="lede mb-8">
        Have questions about switching from Accredible, pricing, or features? We&apos;re here to help.
      </p>
      <div className="bg-paper border border-rule rounded-card p-6">
        <p className="text-ink mb-2">
          <strong>Email:</strong>{' '}
          <a href={`mailto:${BRAND.supportEmail}`} className="text-stamp hover:underline">
            {BRAND.supportEmail}
          </a>
        </p>
        <p className="text-sm text-ink-soft">
          We typically respond within 24 hours on business days.
        </p>
      </div>
    </div>
  )
}
