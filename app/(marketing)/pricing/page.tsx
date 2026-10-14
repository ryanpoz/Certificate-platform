import Link from 'next/link'
import { BRAND } from '@/lib/config/brand'

export const metadata = {
  title: `Pricing - ${BRAND.name}`,
  description: 'Simple, flat pricing that scales with your academy.',
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
            Flat monthly pricing. USD pricing, monthly billing, cancel anytime.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Free Plan */}
          <div className="bg-white border-2 border-gray-200 rounded-lg p-8">
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Free</h3>
              <div className="flex items-baseline">
                <span className="text-5xl font-bold text-gray-900">$0</span>
              </div>
              <p className="mt-2 text-sm text-gray-600">For getting started with credentials</p>
            </div>
            <ul className="space-y-4 mb-8">
              <li className="flex items-start">
                <svg className="h-6 w-6 text-blue-600 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-700">250 recipients/year</span>
              </li>
              <li className="flex items-start">
                <svg className="h-6 w-6 text-blue-600 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-700">Issue digital certificates</span>
              </li>
              <li className="flex items-start">
                <svg className="h-6 w-6 text-blue-600 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-700">Verification with QR code</span>
              </li>
              <li className="flex items-start">
                <svg className="h-6 w-6 text-blue-600 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-700">LinkedIn sharing</span>
              </li>
            </ul>
            <Link
              href="/signup"
              className="block w-full text-center px-6 py-3 text-base font-semibold text-blue-600 border-2 border-blue-600 rounded-md hover:bg-blue-50"
            >
              Start free
            </Link>
          </div>

          {/* Growth Plan */}
          <div className="bg-white border-2 border-blue-600 rounded-lg p-8 relative">
            <div className="absolute top-0 right-6 -translate-y-1/2">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-600 text-white">
                Most popular
              </span>
            </div>
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Growth</h3>
              <div className="flex items-baseline">
                <span className="text-5xl font-bold text-gray-900">$99</span>
                <span className="text-gray-600 ml-2">/month</span>
              </div>
              <p className="mt-2 text-sm text-gray-600">For customer education programs</p>
            </div>
            <ul className="space-y-4 mb-8">
              <li className="flex items-start">
                <svg className="h-6 w-6 text-blue-600 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-700">Up to 25,000 recipients/year</span>
              </li>
              <li className="flex items-start">
                <svg className="h-6 w-6 text-blue-600 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-700">Everything in Free, plus:</span>
              </li>
              <li className="flex items-start">
                <svg className="h-6 w-6 text-blue-600 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-700">Custom domain</span>
              </li>
              <li className="flex items-start">
                <svg className="h-6 w-6 text-blue-600 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-700">LinkedIn share analytics</span>
              </li>
              <li className="flex items-start">
                <svg className="h-6 w-6 text-blue-600 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-700">Webhooks & API</span>
              </li>
            </ul>
            <Link
              href="/signup"
              className="block w-full text-center px-6 py-3 text-base font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              Start Growth
            </Link>
          </div>

          {/* Scale Plan */}
          <div className="bg-white border-2 border-gray-200 rounded-lg p-8">
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Scale</h3>
              <div className="flex items-baseline">
                <span className="text-5xl font-bold text-gray-900">$299</span>
                <span className="text-gray-600 ml-2">/month</span>
              </div>
              <p className="mt-2 text-sm text-gray-600">For large academies and partner programs</p>
            </div>
            <ul className="space-y-4 mb-8">
              <li className="flex items-start">
                <svg className="h-6 w-6 text-blue-600 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-700">Up to 100,000 recipients/year</span>
              </li>
              <li className="flex items-start">
                <svg className="h-6 w-6 text-blue-600 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-700">Everything in Growth, plus:</span>
              </li>
              <li className="flex items-start">
                <svg className="h-6 w-6 text-blue-600 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-700">Priority support</span>
              </li>
              <li className="flex items-start">
                <svg className="h-6 w-6 text-blue-600 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-700">SSO</span>
              </li>
              <li className="flex items-start">
                <svg className="h-6 w-6 text-blue-600 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-700">Leaderboard & public directory</span>
              </li>
            </ul>
            <Link
              href="/signup"
              className="block w-full text-center px-6 py-3 text-base font-semibold text-blue-600 border-2 border-blue-600 rounded-md hover:bg-blue-50"
            >
              Start Scale
            </Link>
          </div>
        </div>

        <div className="mt-12 text-center">
          <p className="text-gray-600">
            <strong>Add-on:</strong> Extra 25,000 recipients for $49
          </p>
        </div>

        {/* FAQ */}
        <div className="mt-24 max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">FAQ</h2>
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">What counts as a recipient?</h3>
              <p className="text-gray-600">
                Each unique person you issue a certificate to in a 12-month period. Reissuing or updating a certificate for the same person doesn&apos;t count again.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">What if a cohort goes past my band?</h3>
              <p className="text-gray-600">
                You&apos;re never blocked. Certificates keep issuing, and you can add 25,000 recipients for $49, or move up to the next plan.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">How do share analytics work?</h3>
              <p className="text-gray-600">
                We count LinkedIn shares and views of each verification page, so you can see which courses drive reach and click-throughs back to your signup page.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Can I white-label and use my own domain?</h3>
              <p className="text-gray-600">
                Yes, on Growth and Scale. Remove the branding mark, use your branding, and host verification pages on your own domain.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
