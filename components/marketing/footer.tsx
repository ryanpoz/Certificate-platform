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
      { href: '/use-cases#coaches-wellness', label: 'Coaches and wellness' },
      { href: '/use-cases#course-creators', label: 'Course creators and cohorts' },
      { href: '/use-cases#customer-education', label: 'Customer education' },
      { href: '/use-cases#trainers-associations', label: 'Associations' },
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
    <footer className="border-t border-cream/[0.12] bg-ink text-cream">
      <div className="site-wrap py-12">
        <div className="grid gap-10 md:grid-cols-[1.4fr_repeat(4,1fr)]">
          <div className="space-y-3">
            <Logo tone="dark" />
            <p className="text-[13px] text-haze-dim">Prices in CA$.</p>
          </div>
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-gold-bright">{col.title}</h3>
              <ul className="mt-4 space-y-3">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-sm font-semibold text-cream/[0.84] hover:text-cream">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-10 border-t border-cream/[0.12] pt-6">
          <p className="text-[13px] text-haze-dim">
            &copy; {new Date().getFullYear()} {BRAND.name}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
