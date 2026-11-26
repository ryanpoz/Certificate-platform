'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { Logo } from '@/components/brand/logo'

const LINKS = [
  { href: '/product', label: 'Product' },
  { href: '/use-cases', label: 'Use Cases' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/switch', label: 'Switch from Accredible' },
]

export default function MarketingNav({ isLoggedIn }: { isLoggedIn?: boolean }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const pathname = usePathname()

  return (
    <nav className="sticky top-0 z-50 border-b border-rule bg-parchment/[0.92] backdrop-blur">
      <div className="site-wrap">
        <div className="flex h-[72px] items-center justify-between gap-6">
          <div className="flex items-center gap-10">
            <Logo />
            <div className="hidden md:flex md:items-center md:gap-7">
              {LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={pathname === link.href ? 'page' : undefined}
                  className={`text-[15px] font-medium hover:text-ink ${pathname === link.href ? 'text-ink' : 'text-ink-soft'}`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="hidden md:flex md:items-center md:gap-4">
            {isLoggedIn ? (
              <Link href="/dashboard" className="btn btn-primary btn-sm">
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link href="/auth/login" className="text-[15px] font-medium text-ink-soft hover:text-ink">
                  Log in
                </Link>
                <Link href="/signup" className="btn btn-primary btn-sm">
                  Start free
                </Link>
              </>
            )}
          </div>
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center rounded-btn p-2 text-ink-soft hover:bg-paper hover:text-ink"
            >
              <span className="sr-only">Open menu</span>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
        <div className="border-t border-rule bg-parchment md:hidden">
          <div className="space-y-1 pb-3 pt-2">
            {LINKS.map((link) => (
              <Link key={link.href} href={link.href} className="block py-2 pl-6 pr-4 text-base font-medium text-ink-soft hover:bg-paper hover:text-ink">
                {link.label}
              </Link>
            ))}
          </div>
          <div className="border-t border-rule pb-4 pt-4">
            {isLoggedIn ? (
              <Link href="/dashboard" className="btn btn-primary mx-6 flex">
                Go to Dashboard
              </Link>
            ) : (
              <div className="mx-6 space-y-2">
                <Link href="/auth/login" className="btn btn-ghost flex">
                  Log in
                </Link>
                <Link href="/signup" className="btn btn-primary flex">
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
