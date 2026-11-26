import type { Metadata } from 'next'
import { Bricolage_Grotesque, Figtree } from 'next/font/google'
import './globals.css'
import { BRAND } from '@/lib/config/brand'

// Display / wordmark / prices / plan names (variable: opsz + wdth)
const bricolage = Bricolage_Grotesque({
  subsets: ['latin'],
  axes: ['opsz', 'wdth'],
  variable: '--font-display',
  display: 'swap',
})

// UI and body text
const figtree = Figtree({
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
    <html lang="en" className={`${bricolage.variable} ${figtree.variable}`}>
      <body className="font-sans">{children}</body>
    </html>
  )
}
