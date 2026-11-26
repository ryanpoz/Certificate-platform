import Link from 'next/link'
import { BRAND } from '@/lib/config/brand'
import { Logo } from '@/components/brand/logo'

const COLUMNS = [
  {
    title: 'Product',
    links: [
      { href: '/product', label: 'Features' },
      { href: '/pricing', label: 'Pricing' },
      { href: '/switch', label: 'Switch from Accredible' },
    ],
  },
  {
    title: 'Use Cases',
    links: [
      { href: '/use-cases#customer-education', label: 'Customer Education' },
      { href: '/use-cases#partner-enablement', label: 'Partner Enablement' },
      { href: '/use-cases#trainers-associations', label: 'Trainers & Associations' },
    ],
  },
  {
    title: 'Company',
    links: [{ href: '/contact', label: 'Contact' }],
  },
  {
    title: 'Legal',
    links: [
      { href: '/privacy', label: 'Privacy' },
      { href: '/terms', label: 'Terms' },
    ],
  },
]

export default function MarketingFooter() {
  return (
    <footer className="border-t border-rule bg-parchment">
      <div className="site-wrap py-12">
        <div className="grid gap-10 md:grid-cols-[1.4fr_repeat(4,1fr)]">
          <div className="space-y-3">
            <Logo markSize={32} wordmarkClassName="text-[20px]" />
            <p className="fine">Prices in CA$.</p>
          </div>
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-brass">{col.title}</h3>
              <ul className="mt-4 space-y-3">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-sm font-medium text-ink-soft hover:text-ink">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-10 border-t border-rule pt-6">
          <p className="fine">
            &copy; {new Date().getFullYear()} {BRAND.name}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
