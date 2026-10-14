// Brand configuration - centralized for easy renaming
export const BRAND = {
  name: 'Recert', // TODO: Replace with final product name
  tagline: 'Certificates that show what your academy actually drives',
  description: 'A lower-cost alternative to Accredible for companies that certify external learners.',
  url: process.env.NEXT_PUBLIC_APP_URL || 'https://certificate-platform-eta.vercel.app',
  
  // Brand colors
  colors: {
    primary: '#2563eb', // blue-600
    primaryHover: '#1d4ed8', // blue-700
    accent: '#0ea5e9', // sky-500
  },
  
  // Contact
  supportEmail: 'support@recert.io', // TODO: Update with real email
  
  // Social
  twitter: '@recert', // TODO: Update if needed
  linkedin: 'company/recert', // TODO: Update if needed
}
