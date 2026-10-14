import { BRAND } from '@/lib/config/brand'
import Link from 'next/link'

export const metadata = {
  title: `Switch from Accredible - ${BRAND.name}`,
  description: 'Import and reissue every certificate for free',
}

export default function SwitchPage() {
  return (
    <div className="bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Switch from Accredible for free
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            We import and reissue every certificate as a fresh round of LinkedIn shares—at no cost.
          </p>
        </div>

        <div className="space-y-12">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">How it works</h2>
            <ol className="space-y-4">
              <li className="flex">
                <span className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold mr-4">1</span>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Export from Accredible</h3>
                  <p className="text-gray-600">Download your certificate data and recipient list from Accredible.</p>
                </div>
              </li>
              <li className="flex">
                <span className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold mr-4">2</span>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">We import and reissue</h3>
                  <p className="text-gray-600">Upload your CSV to {BRAND.name}. We create new certificates with your existing data.</p>
                </div>
              </li>
              <li className="flex">
                <span className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold mr-4">3</span>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Fresh LinkedIn shares</h3>
                  <p className="text-gray-600">Each reissued certificate triggers a new email with the LinkedIn button. Your learners add it to their profiles again, creating a second wave of visibility.</p>
                </div>
              </li>
            </ol>
          </div>

          <div className="border-t border-gray-200 pt-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">What&apos;s included</h2>
            <ul className="space-y-3">
              <li className="flex items-start">
                <svg className="h-6 w-6 text-blue-600 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-700">Free import and reissue (no cost for existing certificates)</span>
              </li>
              <li className="flex items-start">
                <svg className="h-6 w-6 text-blue-600 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-700">Preserve original issue dates</span>
              </li>
              <li className="flex items-start">
                <svg className="h-6 w-6 text-blue-600 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-700">New {BRAND.name} URLs with QR code verification</span>
              </li>
              <li className="flex items-start">
                <svg className="h-6 w-6 text-blue-600 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-700">Analytics on reissue emails and LinkedIn shares</span>
              </li>
            </ul>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="font-semibold text-gray-900 mb-2">Ready to switch?</h3>
            <p className="text-gray-600 mb-4">
              Contact us to discuss your migration. We&apos;ll help you export from Accredible and get set up on {BRAND.name}.
            </p>
            <div className="flex gap-4">
              <Link
                href="/contact"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                Contact us
              </Link>
              <Link
                href="/signup"
                className="inline-flex items-center px-4 py-2 border border-blue-600 text-sm font-medium rounded-md text-blue-600 bg-white hover:bg-blue-50"
              >
                Start free trial
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
