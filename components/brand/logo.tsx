import Link from 'next/link'
import { BRAND_NAME } from '@/lib/config/brand'

type Tone = 'light' | 'dark'

const SPARK =
  'M49.00,4.50 L51.14,12.83 L58.55,8.45 L54.17,15.86 L62.50,18.00 L54.17,20.14 L58.55,27.55 L51.14,23.17 L49.00,31.50 L46.86,23.17 L39.45,27.55 L43.83,20.14 L35.50,18.00 L43.83,15.86 L39.45,8.45 L46.86,12.83 Z'

/**
 * The mark: a rounded landscape certificate (the thing being shared) with a
 * raspberry spark popping off the top-right corner (the standing ovation).
 * No letters, so it survives a rename. `light` is for light surfaces, `dark`
 * for ink bands. Colours are the brand tokens ink #17141F, cream #FFF6EF and
 * cheer #D1185C.
 */
export function BrandMark({
  size = 36,
  tone = 'light',
  pop = false,
  className = '',
}: {
  size?: number
  tone?: Tone
  /** Spark pops in once (cancelled by prefers-reduced-motion) */
  pop?: boolean
  className?: string
}) {
  const doc = tone === 'light' ? '#17141F' : '#FFF6EF'
  const line = tone === 'light' ? '#FFF6EF' : '#17141F'
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" className={`shrink-0 ${className}`} data-brand-mark>
      <rect x="5" y="18" width="40" height="28" rx="5.5" fill={doc} />
      <rect x="11.5" y="26.5" width="20" height="2.4" rx="1.2" fill={line} />
      <rect x="11.5" y="32.5" width="13" height="2.4" rx="1.2" fill={line} opacity="0.7" />
      <circle cx="14" cy="39.5" r="2.1" fill="#D1185C" />
      <g className={pop ? 'origin-[49px_18px] animate-spark-pop motion-reduce:animate-none' : ''}>
        <path fill="#D1185C" d={SPARK} />
        <circle cx="49" cy="18" r="3.1" fill={line === '#FFF6EF' ? '#FFF6EF' : '#17141F'} />
        <circle cx="49" cy="18" r="1.45" fill={line === '#FFF6EF' ? '#D1185C' : '#FFF6EF'} />
      </g>
    </svg>
  )
}

/** The wordmark is real text from BRAND_NAME, so a rename is one change */
export function Wordmark({ tone = 'light', className = '' }: { tone?: Tone; className?: string }) {
  return (
    <span
      data-brand-name
      className={`font-display text-[20px] font-bold leading-none tracking-[-0.03em] ${tone === 'light' ? 'text-ink' : 'text-cream'} ${className}`}
    >
      {BRAND_NAME}
    </span>
  )
}

/** Horizontal lockup: mark 36px, 10px gap, wordmark */
export function Logo({
  href = '/',
  tone = 'light',
  markSize = 36,
  pop = false,
  wordmarkClassName = '',
}: {
  href?: string
  tone?: Tone
  markSize?: number
  pop?: boolean
  wordmarkClassName?: string
}) {
  return (
    <Link href={href} className="flex min-w-0 items-center gap-2.5" aria-label={`${BRAND_NAME} home`}>
      <BrandMark size={markSize} tone={tone} pop={pop} />
      <Wordmark tone={tone} className={wordmarkClassName} />
    </Link>
  )
}

/** Friendly "Coming soon" label */
export function ComingSoonBadge({ className = '' }: { className?: string }) {
  return <span className={`badge-soon ${className}`}>Coming soon</span>
}

/** Always on fictional certificates and posts */
export function SamplePill({ children = 'Sample', className = '' }: { children?: React.ReactNode; className?: string }) {
  return <span className={`sample-pill ${className}`}>{children}</span>
}
