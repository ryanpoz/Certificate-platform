// Brand configuration - centralized for easy renaming

/**
 * The product name. Placeholder until a final name is chosen: change it here
 * (and --brand-name in app/globals.css) and the wordmark, metadata and copy
 * follow. The logo mark has no letters, so it doesn't change.
 */
export const BRAND_NAME = 'Credentially'

export const BRAND = {
  name: BRAND_NAME,
  tagline: 'Certificates that show what your training actually drives',
  description: 'A lower-cost alternative to Accredible for companies that certify external learners.',
  url: process.env.NEXT_PUBLIC_APP_URL || 'https://certificate-platform-eta.vercel.app',
  
  // Brand colors
  // Brand colours ("the registrar"); Tailwind tokens in tailwind.config.ts
  colors: {
    ink: '#1C1917',
    parchment: '#F4EFE6',
    paper: '#FBF8F3',
    cream: '#FFFDF9',
    stamp: '#8E1B1B',
    stampHover: '#6F1414',
    brass: '#6E5424',
    brassBright: '#C9A45C',
    valid: '#1F5C45',
    primary: '#8E1B1B',
    primaryHover: '#6F1414',
  },
  
  // Contact
  supportEmail: 'support@credentially.io', // TODO: Update with real email
  
  // Social
  twitter: '@credentially', // TODO: Update if needed
  linkedin: 'company/credentially', // TODO: Update if needed
}
