import { readFileSync, existsSync } from 'fs'
import { join } from 'path'
import { BRAND, BRAND_NAME } from '@/lib/config/brand'

const read = (p: string) => readFileSync(join(process.cwd(), p), 'utf-8')

const MARKETING = [
  'app/(marketing)/page.tsx',
  'app/(marketing)/pricing/page.tsx',
  'app/(marketing)/switch/page.tsx',
  'app/(marketing)/product/page.tsx',
  'app/(marketing)/use-cases/page.tsx',
  'components/marketing/nav.tsx',
  'components/marketing/footer.tsx',
  'components/marketing/certificate-visual.tsx',
]

describe('Brand refresh (registrar direction)', () => {
  it('keeps the placeholder product name in one constant', () => {
    expect(BRAND_NAME).toBe('Credentially')
    expect(BRAND.name).toBe(BRAND_NAME)
  })

  it('renders the wordmark from BRAND_NAME, not a hard-coded string', () => {
    const logo = read('components/brand/logo.tsx')
    expect(logo).toContain('BRAND_NAME')
    expect(logo).not.toMatch(/>\s*Credentially\s*</)
  })

  it('ships the new favicon and removes the old generated icon', () => {
    expect(existsSync(join(process.cwd(), 'app/icon.svg'))).toBe(true)
    expect(existsSync(join(process.cwd(), 'app/icon.tsx'))).toBe(false)
    expect(read('app/icon.svg')).toContain('#8E1B1B')
  })

  it('loads Fraunces and IBM Plex Sans through next/font', () => {
    const layout = read('app/layout.tsx')
    expect(layout).toContain("from 'next/font/google'")
    expect(layout).toContain('Fraunces')
    expect(layout).toContain('IBM_Plex_Sans')
    expect(layout).not.toMatch(/\bInter\b/)
  })

  it('defines the palette tokens in the Tailwind config', () => {
    const config = read('tailwind.config.ts')
    for (const hex of ['#1C1917', '#F4EFE6', '#FBF8F3', '#8E1B1B', '#6E5424', '#1F5C45', '#E4DCD0']) {
      expect(config).toContain(hex)
    }
  })

  it('does not ship placeholder boxes, fake logos, testimonials or invented stats', () => {
    for (const file of MARKETING) {
      const src = read(file)
      expect(src).not.toMatch(/placeholder name|logo-slot|trusted by|testimonial|customer logo/i)
    }
    const product = read('app/(marketing)/product/page.tsx')
    expect(product).not.toMatch(/2,847|2,698|1,923|94\.8%|71\.3%|44\.0%/)
  })

  it('keeps the hero and pricing page free of competitor names', () => {
    const home = read('app/(marketing)/page.tsx')
    const hero = home.slice(0, home.indexOf('How it works'))
    expect(hero).not.toMatch(/accredible|certifier|credly|sertifier/i)
    expect(read('app/(marketing)/pricing/page.tsx')).not.toMatch(/accredible|certifier|credly|sertifier/i)
  })

  it('keeps the existing nav items', () => {
    const nav = read('components/marketing/nav.tsx')
    for (const label of ['Product', 'Use Cases', 'Pricing', 'Switch from Accredible']) {
      expect(nav).toContain(label)
    }
  })

  it('login no longer uses academy positioning', () => {
    expect(read('app/auth/login/page.tsx')).not.toMatch(/\bacadem(y|ies)\b/i)
  })

  it('brands the dashboard chrome with the mark', () => {
    expect(read('app/dashboard/layout.tsx')).toContain('<BrandMark')
  })
})
