import { BRAND } from '@/lib/config/brand'

export const metadata = {
  title: `Contact - ${BRAND.name}`,
}

export default function ContactPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
      <h1 className="text-4xl font-bold text-gray-900 mb-4">Contact us</h1>
      <p className="text-lg text-gray-600 mb-8">
        Have questions about switching from Accredible, pricing, or features? We&apos;re here to help.
      </p>
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <p className="text-gray-900 mb-2">
          <strong>Email:</strong>{' '}
          <a href={`mailto:${BRAND.supportEmail}`} className="text-blue-600 hover:underline">
            {BRAND.supportEmail}
          </a>
        </p>
        <p className="text-sm text-gray-600">
          We typically respond within 24 hours on business days.
        </p>
      </div>
    </div>
  )
}
