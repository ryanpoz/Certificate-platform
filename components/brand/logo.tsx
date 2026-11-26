import Link from 'next/link'
import { BRAND_NAME } from '@/lib/config/brand'

type Tone = 'light' | 'dark'

/**
 * The mark: a landscape certificate with an official seal over its lower-right
 * corner. No letters, so it survives a rename. `light` is for parchment,
 * paper and cream; `dark` is for ink bands.
 */
export function BrandMark({ size = 40, tone = 'light', className = '' }: { size?: number; tone?: Tone; className?: string }) {
  const doc = tone === 'light' ? '#1C1917' : '#F4EFE6'
  const line = tone === 'light' ? '#F4EFE6' : '#1C1917'
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" className={`shrink-0 ${className}`} data-brand-mark>
      <rect x="5" y="13" width="40" height="28" rx="3.25" fill={doc} />
      <rect x="11" y="22.5" width="22" height="2.1" rx="1.05" fill={line} />
      <rect x="11" y="28.5" width="14" height="2.1" rx="1.05" fill={line} opacity="0.72" />
      <circle cx="46" cy="45" r="14" fill="#8E1B1B" />
      <circle cx="46" cy="45" r="10.6" fill="none" stroke="#F4EFE6" strokeWidth="1.35" />
      <rect x="40.2" y="40.4" width="11.6" height="7.4" rx="1.05" fill="#F4EFE6" />
      <rect x="42" y="42.3" width="6.4" height="1.15" rx="0.5" fill="#8E1B1B" />
      <rect x="42" y="44.7" width="4.2" height="1.15" rx="0.5" fill="#8E1B1B" />
    </svg>
  )
}

/** The wordmark is real text from BRAND_NAME, so a rename is one change */
export function Wordmark({ tone = 'light', className = '' }: { tone?: Tone; className?: string }) {
  return (
    <span
      data-brand-name
      className={`font-display text-[22px] font-semibold leading-none tracking-[-0.02em] ${tone === 'light' ? 'text-ink' : 'text-parchment'} ${className}`}
    >
      {BRAND_NAME}
    </span>
  )
}

/** Horizontal lockup: mark, 10px gap, wordmark */
export function Logo({
  href = '/',
  tone = 'light',
  markSize = 40,
  wordmarkClassName = '',
}: {
  href?: string
  tone?: Tone
  markSize?: number
  wordmarkClassName?: string
}) {
  return (
    <Link href={href} className="flex min-w-0 items-center gap-2.5" aria-label={`${BRAND_NAME} home`}>
      <BrandMark size={markSize} tone={tone} />
      <Wordmark tone={tone} className={wordmarkClassName} />
    </Link>
  )
}

/** Small "Coming soon" rubber stamp */
export function ComingSoonBadge({ className = '' }: { className?: string }) {
  return <span className={`badge-soon ${className}`}>Coming soon</span>
}
