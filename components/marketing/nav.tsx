'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { Logo } from '@/components/brand/logo'

const LINKS = [
  { href: '/product', label: 'Product' },
  { href: '/use-cases', label: 'Use Cases' },
  { href: '/pricing', label: 'Pricing' },
]

export default function MarketingNav({ isLoggedIn }: { isLoggedIn?: boolean }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const pathname = usePathname()

  return (
    <nav className="sticky top-0 z-50 border-b border-cream/[0.14] bg-ink text-cream">
      <div className="site-wrap">
        <div className="flex h-[76px] items-center justify-between gap-6">
          <div className="flex items-center gap-10">
            <Logo tone="dark" pop />
            <div className="hidden md:flex md:items-center md:gap-7">
              {LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={pathname === link.href ? 'page' : undefined}
                  className={`text-[15px] font-semibold hover:text-cream ${pathname === link.href ? 'text-cream underline decoration-gold-bright decoration-2 underline-offset-[6px]' : 'text-cream/[0.86]'}`}
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
                <Link href="/auth/login" className="btn btn-ghost-light btn-sm">
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
              className="inline-flex items-center justify-center rounded-btn p-2 text-cream hover:bg-cream/10"
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
        <div className="border-t border-cream/[0.14] bg-ink md:hidden">
          <div className="space-y-1 pb-3 pt-2">
            {LINKS.map((link) => (
              <Link key={link.href} href={link.href} className="block py-2 pl-6 pr-4 text-base font-semibold text-cream/[0.86] hover:bg-cream/10 hover:text-cream">
                {link.label}
              </Link>
            ))}
          </div>
          <div className="border-t border-cream/[0.14] pb-4 pt-4">
            {isLoggedIn ? (
              <Link href="/dashboard" className="btn btn-primary mx-6 flex">
                Go to Dashboard
              </Link>
            ) : (
              <div className="mx-6 space-y-2">
                <Link href="/auth/login" className="btn btn-ghost-light flex">
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
