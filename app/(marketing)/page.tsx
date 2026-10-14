import Link from 'next/link'
import { BRAND } from '@/lib/config/brand'

export const metadata = {
  title: `${BRAND.name} - ${BRAND.tagline}`,
  description: BRAND.description,
}

export default function HomePage() {
  return (
    <div className="bg-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-b from-blue-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
              Certificates that show what your academy actually drives
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600 max-w-2xl mx-auto">
              Minutes after completion, when learners are proudest to share. Every LinkedIn add tracked back to your academy. Free analytics that prove impact.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link
                href="/signup"
                className="rounded-md bg-blue-600 px-6 py-3 text-base font-semibold text-white shadow-sm hover:bg-blue-700"
              >
                Start free
              </Link>
              <Link href="/product" className="text-base font-semibold leading-7 text-gray-900">
                See how it works <span aria-hidden="true">→</span>
              </Link>
            </div>
            <p className="mt-6 text-sm text-gray-500">
              Free plan: 250 certificates/year • No credit card required
            </p>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="py-24 sm:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              How it works
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Three steps from CSV to LinkedIn shares
            </p>
          </div>
          <div className="grid grid-cols-1 gap-12 md:grid-cols-3">
            <div className="text-center">
              <div className="mx-auto h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg mb-4">
                1
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Upload your graduates</h3>
              <p className="text-gray-600">
                Import a CSV with names and emails. We validate, deduplicate, and create certificates in seconds.
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg mb-4">
                2
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">They share instantly</h3>
              <p className="text-gray-600">
                Email lands with a one-click &quot;Add to LinkedIn&quot; button. Every share is tracked with your academy&apos;s branding.
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg mb-4">
                3
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Watch the reach grow</h3>
              <p className="text-gray-600">
                Free analytics show issued, viewed, shared, and clicks back to your site—no guessing what&apos;s working.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Outcomes Section */}
      <div className="py-24 sm:py-32 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 items-center">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl mb-6">
                LinkedIn shares = signups
              </h2>
              <p className="text-lg text-gray-600 mb-4">
                Every certificate your learners add to LinkedIn becomes a verified signal to their network: your course works.
              </p>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <svg className="h-6 w-6 text-blue-600 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700">Pre-filled with your course name, dates, and certificate URL</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-6 w-6 text-blue-600 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700">Track who clicked through from LinkedIn to your site</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-6 w-6 text-blue-600 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700">See exactly which courses drive the most reach</span>
                </li>
              </ul>
            </div>
            <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
              <div className="text-sm text-gray-500 mb-4">Example: Certificate page</div>
              <div className="space-y-4">
                <div className="border-b border-gray-200 pb-4">
                  <div className="font-semibold text-gray-900 mb-1">Creative Strategy Bootcamp</div>
                  <div className="text-sm text-gray-600">Motion Academy</div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Issued:</span>
                    <span className="text-gray-900">Jan 15, 2026</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Certificate #:</span>
                    <span className="text-gray-900 font-mono">CSB-2026-0123</span>
                  </div>
                </div>
                <button className="w-full bg-[#0a66c2] text-white py-2 rounded font-medium text-sm">
                  Add to LinkedIn
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Preview */}
      <div className="py-24 sm:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Analytics that prove impact
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Free with every plan. No guessing—just clear numbers on reach and engagement.
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-8 border border-gray-200">
            <div className="grid grid-cols-2 gap-6 md:grid-cols-5">
              <div>
                <div className="text-3xl font-bold text-blue-600">2,847</div>
                <div className="text-sm text-gray-600 mt-1">Issued</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-green-600">2,698</div>
                <div className="text-sm text-gray-600 mt-1">Delivered</div>
                <div className="text-xs text-gray-500">94.8%</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-purple-600">1,923</div>
                <div className="text-sm text-gray-600 mt-1">Viewed</div>
                <div className="text-xs text-gray-500">71.3%</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-indigo-600">847</div>
                <div className="text-sm text-gray-600 mt-1">LinkedIn adds</div>
                <div className="text-xs text-gray-500">44.0%</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-pink-600">312</div>
                <div className="text-sm text-gray-600 mt-1">CTA clicks</div>
                <div className="text-xs text-gray-500">16.2%</div>
              </div>
            </div>
            <div className="mt-6 text-xs text-gray-500 text-center">
              Example data • Your dashboard shows real-time metrics per course
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Teaser */}
      <div className="py-24 sm:py-32 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl mb-4">
            A flat price that doesn&apos;t grow with your learners
          </h2>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Start free with 250 certificates per year. Growth and Scale plans for academies that certify thousands.
          </p>
          <Link
            href="/pricing"
            className="inline-flex items-center px-6 py-3 text-base font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700"
          >
            See pricing
          </Link>
        </div>
      </div>

      {/* Switch CTA */}
      <div className="py-24 sm:py-32 bg-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl mb-4">
            Switch from Accredible for free
          </h2>
          <p className="text-lg text-blue-100 mb-8 max-w-2xl mx-auto">
            We import and reissue every certificate as a fresh round of LinkedIn shares—at no cost.
          </p>
          <div className="flex justify-center gap-4">
            <Link
              href="/switch"
              className="inline-flex items-center px-6 py-3 text-base font-semibold text-blue-600 bg-white rounded-md hover:bg-blue-50"
            >
              Learn about switching
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center px-6 py-3 text-base font-semibold text-white border-2 border-white rounded-md hover:bg-blue-700"
            >
              Start free
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
