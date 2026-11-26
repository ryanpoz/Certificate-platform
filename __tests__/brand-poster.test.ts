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

/** WCAG relative-luminance contrast ratio */
function contrast(a: string, b: string): number {
  const lum = (hex: string) => {
    const [r, g, bl] = [0, 2, 4].map((i) => parseInt(hex.replace('#', '').slice(i, i + 2), 16) / 255)
    const f = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(bl)
  }
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

/** Read a token's hex from tailwind.config.ts, e.g. token('cheer', 'hover') */
const config = read('tailwind.config.ts')
function token(name: string, shade = 'DEFAULT'): string {
  const obj = config.match(new RegExp(`\\n\\s+${name}: \\{([^}]*)\\}`))
  if (obj) {
    const m = obj[1].match(new RegExp(`${shade}: '(#[0-9A-Fa-f]{6})'`))
    if (m) return m[1]
  }
  const flat = config.match(new RegExp(`\\n\\s+${name}: '(#[0-9A-Fa-f]{6})'`))
  if (flat && shade === 'DEFAULT') return flat[1]
  throw new Error(`token ${name}.${shade} not found`)
}

describe('Brand: Poster ink (fun direction, option C)', () => {
  it('keeps the placeholder product name in one constant', () => {
    expect(BRAND_NAME).toBe('Credentially')
    expect(BRAND.name).toBe(BRAND_NAME)
  })

  it('renders the wordmark from BRAND_NAME, not a hard-coded string', () => {
    const logo = read('components/brand/logo.tsx')
    expect(logo).toContain('BRAND_NAME')
    expect(logo).not.toMatch(/>\s*Credentially\s*</)
  })

  it('ships the certificate-and-spark mark as the favicon', () => {
    expect(existsSync(join(process.cwd(), 'app/icon.svg'))).toBe(true)
    expect(existsSync(join(process.cwd(), 'app/icon.tsx'))).toBe(false)
    const icon = read('app/icon.svg')
    expect(icon).toContain('#D1185C')
    expect(icon).toContain('#17141F')
    expect(icon).not.toContain('#8E1B1B')
  })

  it('loads Bricolage Grotesque and Figtree through next/font, and drops the registrar fonts', () => {
    const layout = read('app/layout.tsx')
    expect(layout).toContain("from 'next/font/google'")
    expect(layout).toContain('Bricolage_Grotesque')
    expect(layout).toContain('Figtree')
    expect(layout).not.toMatch(/Fraunces|IBM_Plex|\bInter\b/)
    expect(config).not.toMatch(/Fraunces|IBM Plex/)
  })

  it('defines the Poster ink tokens and retires the registrar palette', () => {
    for (const hex of ['#17141F', '#FFFDF8', '#FFF6EF', '#D1185C', '#FFC44D', '#FFD93D', '#B2F0C8', '#0C6B5C', '#8A5408']) {
      expect(config).toContain(hex)
    }
    const css = read('app/globals.css')
    for (const old of ['#8E1B1B', '#F4EFE6', '#C9A45C', '#1F5C45']) {
      expect(config).not.toContain(old)
      expect(css).not.toContain(old)
    }
    for (const file of MARKETING) {
      expect(read(file)).not.toMatch(/(bg|text|border)-(stamp|parchment|brass|valid)\b/)
    }
  })

  it('meets WCAG AA for the text colours each band uses', () => {
    const ink = token('ink')
    const pairs: Array<[string, string, string]> = [
      ['cream on ink (hero, nav, footer)', token('cream'), ink],
      ['haze lede on ink', token('haze'), ink],
      ['haze-dim fine print on ink', token('haze', 'dim'), ink],
      ['gold-bright eyebrow on ink', token('gold', 'bright'), ink],
      ['white on cheer (buttons, close band)', '#FFFFFF', token('cheer')],
      ['cheer eyebrow on page', token('cheer'), token('page')],
      ['coming-soon label (cheer-hover on cheer-soft)', token('cheer', 'hover'), token('cheer', 'soft')],
      ['ink on sun', ink, token('sun')],
      ['ink-soft lede on sun', token('ink', 'soft'), token('sun')],
      ['teal eyebrow on mint', token('teal'), token('mint')],
      ['ink-soft lede on mint', token('ink', 'soft'), token('mint')],
      ['muted on page', token('muted'), token('page')],
      ['gold on sun-pale (Sample pill)', token('gold'), token('sun', 'pale')],
      ['teal on white (Yes in table)', token('teal'), '#FFFFFF'],
    ]
    for (const [label, fg, bg] of pairs) {
      expect({ label, ratio: contrast(fg, bg) >= 4.5 }).toEqual({ label, ratio: true })
    }
    // Eyebrows on sun and mint must not be cheer (fails AA there)
    const css = read('app/globals.css')
    expect(css).toMatch(/\.band-sun \.eyebrow \{\s*@apply text-ink;/)
    expect(css).toMatch(/\.band-mint \.eyebrow \{\s*@apply text-teal;/)
    expect(css).toMatch(/\.band-ink \.eyebrow \{\s*@apply text-gold-bright;/)
  })

  it('does not ship placeholder boxes, fake logos, testimonials or invented stats', () => {
    for (const file of MARKETING) {
      const src = read(file)
      expect(src).not.toMatch(/placeholder name|logo-slot|trusted by|testimonial|customer logo/i)
      expect(src).not.toMatch(/\b\d{1,3}(,\d{3})+ (shares|learners|customers|certificates issued)\b/i)
    }
    const product = read('app/(marketing)/product/page.tsx')
    expect(product).not.toMatch(/2,847|2,698|1,923|94\.8%|71\.3%|44\.0%/)
  })

  it('labels the fictional hero certificate and post as samples', () => {
    const visual = read('components/marketing/certificate-visual.tsx')
    expect(visual).toContain('<SamplePill className="absolute left-5 top-3">Sample</SamplePill>')
    expect(visual).toContain('Sample post</SamplePill>')
    expect(visual).toContain('aria-label="Sample certificate, fictional"')
    expect(visual).toContain('aria-label="Sample share post, fictional"')
  })

  it('keeps the hero and pricing page free of competitor names', () => {
    const home = read('app/(marketing)/page.tsx')
    expect(home).not.toMatch(/accredible|certifier|credly|sertifier/i)
    expect(read('app/(marketing)/pricing/page.tsx')).not.toMatch(/accredible|certifier|credly|sertifier/i)
    expect(BRAND.description).not.toMatch(/accredible/i)
  })

  it('keeps the main nav items, with Switch from Accredible in the footer only', () => {
    const nav = read('components/marketing/nav.tsx')
    for (const label of ['Product', 'Use Cases', 'Pricing']) {
      expect(nav).toContain(label)
    }
    expect(nav).not.toContain('Switch from Accredible')
    expect(nav).not.toContain("'/switch'")
    const footer = read('components/marketing/footer.tsx')
    expect(footer).toContain('Switch from Accredible')
    expect(footer).toContain("'/switch'")
    expect(existsSync(join(process.cwd(), 'app/(marketing)/switch/page.tsx'))).toBe(true)
  })

  it('labels the Growth plan Recommended, not Most popular', () => {
    const pricing = read('app/(marketing)/pricing/page.tsx')
    expect(pricing).toContain('Recommended')
    for (const file of [...MARKETING, 'app/(marketing)/signup/page.tsx']) {
      expect(read(file)).not.toMatch(/most popular/i)
    }
  })

  it('keeps the current prices', () => {
    const pricing = read('app/(marketing)/pricing/page.tsx')
    expect(pricing).toContain("price: 'CA$0'")
    expect(pricing).toContain("price: 'CA$49'")
    expect(pricing).toContain("price: 'CA$229'")
    expect(pricing).toContain("price: 'CA$499'")
    expect(pricing).toMatch(/pricePrefix: 'From'/)
  })
})

describe('Homepage leads with sharing; expiry is secondary', () => {
  const home = read('app/(marketing)/page.tsx')
  const heroStart = home.indexOf('<h1')
  const hero = home.slice(heroStart, home.indexOf('</section>', heroStart))

  it('poster hero headline with the gold knockout on "proud to share."', () => {
    expect(heroStart).toBeGreaterThan(-1)
    expect(hero).toContain('Certificates people are')
    expect(hero).toMatch(/bg-gold-bright[^>]*>\s*proud to share\.\s*<\/span>/)
    expect(home).toContain('className="band-ink')
  })

  it('the hero says nothing about expiry or recertification, and uses "certificates"', () => {
    expect(hero).not.toMatch(/expir|recert|remind/i)
    expect(hero).not.toMatch(/recipients/i)
    expect(hero).toContain('250 certificates')
  })

  it('cuts to a sun band, then features, then a mint expiry band lower down', () => {
    const sun = home.indexOf('band-sun')
    const share = home.indexOf('Made for the share')
    const mint = home.indexOf('band-mint')
    const expiry = home.indexOf('Expiry and recertification, when you need them.')
    expect(sun).toBeGreaterThan(heroStart)
    expect(share).toBeGreaterThan(sun)
    expect(mint).toBeGreaterThan(share)
    expect(expiry).toBeGreaterThan(mint)
  })

  it('states expiry plans accurately and keeps recertification campaigns Coming soon', () => {
    const expiry = home.slice(home.indexOf('band-mint'), home.indexOf('Who it’s for'))
    expect(expiry).toContain('Starter, Growth and Business')
    expect(expiry).toContain('Reminder emails and an expiring-soon view')
    expect(expiry).toMatch(/Recertification campaigns <ComingSoonBadge \/>/)
  })

  it('presents the live claim celebration without a Coming soon label', () => {
    const card = home.slice(home.indexOf("title: 'A little fanfare'"), home.indexOf("title: 'Your next-step link'"))
    expect(card).toContain('Confetti')
    expect(card).not.toMatch(/coming soon|comingSoon/i)
    const pricing = read('app/(marketing)/pricing/page.tsx')
    const row = pricing.slice(pricing.indexOf('const EVERY_PLAN'), pricing.indexOf(']', pricing.indexOf('const EVERY_PLAN')))
    expect(row).toContain('Claim celebration and share prompt for learners')
  })

  it("lists who it's for, including course creators, and never higher education", () => {
    for (const who of ['Coaches', 'Yoga and wellness trainers', 'Course creators', 'Live and cohort trainers', 'Marketing teams', 'SaaS customer education', 'Associations']) {
      expect(home).toContain(`'${who}'`)
    }
  })
})

describe('Logins and the claim panel use the brand', () => {
  it('login no longer uses academy positioning', () => {
    expect(read('app/auth/login/page.tsx')).not.toMatch(/\bacadem(y|ies)\b/i)
  })

  it('brands the dashboard chrome with the mark', () => {
    expect(read('app/dashboard/layout.tsx')).toContain('<BrandMark')
  })

  it('the claim celebration picks up the Poster ink tokens', () => {
    const css = read('app/globals.css')
    expect(css).toContain('--celebrate-accent: #D1185C;')
    expect(css).toContain('--celebrate-glow: #FFC44D;')
    expect(css).toContain('--confetti-1: #D1185C;')
  })
})
