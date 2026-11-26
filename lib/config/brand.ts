// Brand configuration - centralized for easy renaming

/**
 * The product name. Placeholder until a final name is chosen: change it here
 * (and --brand-name in app/globals.css) and the wordmark, metadata and copy
 * follow. The logo mark has no letters, so it doesn't change.
 */
export const BRAND_NAME = 'Credentially'

export const BRAND = {
  name: BRAND_NAME,
  tagline: 'Certificates people are proud to share',
  description: 'Design a certificate, issue it after a training, and give learners a one-tap way to share it. Start free with 250 certificates a year.',
  url: process.env.NEXT_PUBLIC_APP_URL || 'https://certificate-platform-eta.vercel.app',
  
  // Brand colours ("Poster ink"); Tailwind tokens in tailwind.config.ts
  colors: {
    ink: '#17141F',
    inkSoft: '#3E3851',
    muted: '#5C5668',
    page: '#FFFDF8',
    cream: '#FFF6EF',
    cheer: '#D1185C',
    cheerHover: '#B0124D',
    gold: '#8A5408',
    goldBright: '#FFC44D',
    teal: '#0C6B5C',
    sun: '#FFD93D',
    mint: '#B2F0C8',
    primary: '#D1185C',
    primaryHover: '#B0124D',
  },
  
  // Contact
  supportEmail: 'support@credentially.io', // TODO: Update with real email
  
  // Social
  twitter: '@credentially', // TODO: Update if needed
  linkedin: 'company/credentially', // TODO: Update if needed
}
