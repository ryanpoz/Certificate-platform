import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { BRAND } from '@/lib/config/brand'

const inter = Inter({ subsets: ['latin'] })

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
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
