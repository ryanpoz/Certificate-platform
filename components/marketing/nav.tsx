'use client'

import Link from 'next/link'
import { useState } from 'react'
import { BRAND } from '@/lib/config/brand'

export default function MarketingNav({ isLoggedIn }: { isLoggedIn?: boolean }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link href="/" className="flex items-center">
              <span className="text-2xl font-bold text-gray-900">{BRAND.name}</span>
            </Link>
            <div className="hidden sm:ml-8 sm:flex sm:space-x-8">
              <Link
                href="/product"
                className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                Product
              </Link>
              <Link
                href="/use-cases"
                className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                Use Cases
              </Link>
              <Link
                href="/pricing"
                className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                Pricing
              </Link>
              <Link
                href="/switch"
                className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                Switch from Accredible
              </Link>
            </div>
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:items-center sm:space-x-4">
            {isLoggedIn ? (
              <Link
                href="/dashboard"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                >
                  Log in
                </Link>
                <Link
                  href="/signup"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  Start free
                </Link>
              </>
            )}
          </div>
          <div className="flex items-center sm:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
            >
              <span className="sr-only">Open menu</span>
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d={mobileMenuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'}
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="sm:hidden border-t border-gray-200">
          <div className="pt-2 pb-3 space-y-1">
            <Link
              href="/product"
              className="block pl-3 pr-4 py-2 text-base font-medium text-gray-700 hover:bg-gray-50"
            >
              Product
            </Link>
            <Link
              href="/use-cases"
              className="block pl-3 pr-4 py-2 text-base font-medium text-gray-700 hover:bg-gray-50"
            >
              Use Cases
            </Link>
            <Link
              href="/pricing"
              className="block pl-3 pr-4 py-2 text-base font-medium text-gray-700 hover:bg-gray-50"
            >
              Pricing
            </Link>
            <Link
              href="/switch"
              className="block pl-3 pr-4 py-2 text-base font-medium text-gray-700 hover:bg-gray-50"
            >
              Switch from Accredible
            </Link>
          </div>
          <div className="pt-4 pb-3 border-t border-gray-200">
            {isLoggedIn ? (
              <Link
                href="/dashboard"
                className="block mx-3 px-4 py-2 text-center text-base font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
              >
                Go to Dashboard
              </Link>
            ) : (
              <div className="space-y-2 mx-3">
                <Link
                  href="/auth/login"
                  className="block px-4 py-2 text-center text-base font-medium text-gray-700 hover:bg-gray-50 rounded-md border border-gray-300"
                >
                  Log in
                </Link>
                <Link
                  href="/signup"
                  className="block px-4 py-2 text-center text-base font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
                >
                  Start free
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
