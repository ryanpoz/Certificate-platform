import Link from 'next/link'
import { BRAND } from '@/lib/config/brand'

export default function MarketingFooter() {
  return (
    <footer className="bg-gray-50 border-t border-gray-200">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Product</h3>
            <ul className="mt-4 space-y-3">
              <li><Link href="/product" className="text-base text-gray-600 hover:text-gray-900">Features</Link></li>
              <li><Link href="/pricing" className="text-base text-gray-600 hover:text-gray-900">Pricing</Link></li>
              <li><Link href="/switch" className="text-base text-gray-600 hover:text-gray-900">Switch from Accredible</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Use Cases</h3>
            <ul className="mt-4 space-y-3">
              <li><Link href="/use-cases#customer-education" className="text-base text-gray-600 hover:text-gray-900">Customer Education</Link></li>
              <li><Link href="/use-cases#partner-enablement" className="text-base text-gray-600 hover:text-gray-900">Partner Enablement</Link></li>
              <li><Link href="/use-cases#academies" className="text-base text-gray-600 hover:text-gray-900">Course Creators</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Company</h3>
            <ul className="mt-4 space-y-3">
              <li><Link href="/about" className="text-base text-gray-600 hover:text-gray-900">About</Link></li>
              <li><Link href="/contact" className="text-base text-gray-600 hover:text-gray-900">Contact</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Legal</h3>
            <ul className="mt-4 space-y-3">
              <li><Link href="/privacy" className="text-base text-gray-600 hover:text-gray-900">Privacy</Link></li>
              <li><Link href="/terms" className="text-base text-gray-600 hover:text-gray-900">Terms</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t border-gray-200 pt-8">
          <p className="text-base text-gray-500 text-center">
            &copy; {new Date().getFullYear()} {BRAND.name}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
