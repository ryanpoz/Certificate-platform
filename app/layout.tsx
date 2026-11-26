import type { Metadata } from 'next'
import { Fraunces, IBM_Plex_Sans } from 'next/font/google'
import './globals.css'
import { BRAND } from '@/lib/config/brand'

// Display / wordmark / prices. SOFT and WONK are set to 0 in globals.css.
const fraunces = Fraunces({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  axes: ['SOFT', 'WONK', 'opsz'],
  variable: '--font-display',
  display: 'swap',
})

// UI and body text
const plexSans = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: `${BRAND.name} - ${BRAND.tagline}`,
    template: `%s | ${BRAND.name}`,
  },
  description: BRAND.description,
  keywords: ['certificates', 'digital credentials', 'customer education', 'partner enablement', 'LinkedIn sharing'],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: BRAND.url,
    title: `${BRAND.name} - ${BRAND.tagline}`,
    description: BRAND.description,
    siteName: BRAND.name,
  },
  twitter: {
    card: 'summary_large_image',
    title: `${BRAND.name} - ${BRAND.tagline}`,
    description: BRAND.description,
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${fraunces.variable} ${plexSans.variable}`}>
      <body className="font-sans">{children}</body>
    </html>
  )
}
