/**
 * Marketing copy matches plan rules and positioning decisions.
 */
import { readFileSync } from 'fs'
import { join } from 'path'
import { BRAND } from '@/lib/config/brand'

const read = (p: string) => readFileSync(join(process.cwd(), p), 'utf-8')
const PAGES = [
  'app/(marketing)/page.tsx',
  'app/(marketing)/pricing/page.tsx',
  'app/(marketing)/product/page.tsx',
  'app/(marketing)/use-cases/page.tsx',
  'app/(marketing)/switch/page.tsx',
  'app/(marketing)/terms/page.tsx',
  'app/(marketing)/privacy/page.tsx',
  'app/(marketing)/contact/page.tsx',
  'app/(marketing)/signup/page.tsx',
  'components/marketing/footer.tsx',
  'components/marketing/nav.tsx',
]
/** JSX text and string literals only (drops imports, identifiers like academyName) */
const copy = (p: string) =>
  read(p)
    .split('\n')
    .filter((l) => !/^\s*(import|\/\/|\*)/.test(l))
    .join('\n')
    .replace(/[A-Za-z]*academy[A-Z][A-Za-z]*/g, '')

describe('marketing copy', () => {
  it.each(PAGES)('%s never says unlimited', (p) => {
    expect(read(p)).not.toMatch(/unlimited/i)
  })

  // Course creators are now an audience (the non-compete no longer applies),
  // but the product is still certificates, not an academy or course platform,
  // and higher education is out of scope.
  it.each(PAGES)('%s has no academy or higher-education positioning', (p) => {
    expect(copy(p)).not.toMatch(/\bacadem(y|ies)\b|bootcamp|graduates|higher education|universit(y|ies)|\bcolleges?\b|\bLMS\b|sell your course/i)
  })

  it('names course creators as an audience on the homepage and use cases', () => {
    expect(copy('app/(marketing)/page.tsx')).toContain('Course creators')
    expect(copy('app/(marketing)/use-cases/page.tsx')).toContain('Course creators')
  })

  it('tagline and signup form drop academy wording; product name unchanged', () => {
    expect(BRAND.name).toBe('Credentially')
    expect(BRAND.tagline).not.toMatch(/academy/i)
    const form = read('app/(marketing)/signup/form.tsx')
    expect(form).toContain('Organisation name')
    expect(form).not.toContain('placeholder="Acme Academy"')
  })

  it('footer anchor points at a real use-case section', () => {
    const footer = read('components/marketing/footer.tsx')
    const uses = read('app/(marketing)/use-cases/page.tsx')
    for (const [, id] of footer.matchAll(/\/use-cases#([a-z-]+)/g)) {
      expect(uses).toContain(`id="${id}"`)
    }
  })
})

describe('pricing page states the plan rules', () => {
  const pricing = read('app/(marketing)/pricing/page.tsx')

  it('full yearly allowance up front, annual = 10x monthly, 10% grace', () => {
    expect(pricing).toContain('full yearly certificate allowance is available from day one')
    expect(pricing).toContain('10x the monthly price and get two months free')
    expect(pricing).toContain('A 10% grace applies over your plan limit')
  })

  it('top-ups of 500 are marked coming soon', () => {
    const line = pricing.slice(pricing.indexOf('top-ups of 500 certificates'), pricing.indexOf('top-ups of 500 certificates') + 400)
    expect(line).toContain('Coming soon')
    expect(pricing).toContain('Top-ups of 500 certificates for bursts are coming soon')
  })

  it('downgrade / cancellation FAQ covers every rule', () => {
    expect(pricing).toContain('What happens if I downgrade or cancel?')
    expect(pricing).toContain('always stay live and verifiable, and you can always revoke')
    expect(pricing).toContain('take effect at the end of your current billing period')
    expect(pricing).toContain('can&apos;t move to a plan whose yearly limit is below what you&apos;ve already issued this plan year')
    expect(pricing).toContain('You can still cancel to Free, but new issuing is paused')
    expect(pricing).toContain('lock rather than disappear. Your data and settings are kept')
    expect(pricing).toContain('redirect to our domain')
    expect(pricing).toContain('keep your DNS pointed at us')
  })

  it('comparison table is generated from the entitlements map', () => {
    expect(pricing).toContain("from '@/lib/billing/entitlements'")
    expect(pricing).toContain('FEATURE_KEYS.map((feature)')
    expect(pricing).toContain('can(plan, feature)')
    expect(pricing).toContain("FEATURES[feature].status === 'coming_soon' ? <ComingSoonBadge /> : null")
    expect(pricing).toContain('<ComparisonTable />')
  })

  it('branded email FAQ matches the Starter gate', () => {
    expect(pricing).toContain('On Starter and above, certificate emails come from your sender name')
  })

  it('Growth lists its own call to action as built (not coming soon)', () => {
    expect(pricing).toContain("{ text: 'Your own call to action on certificate pages' },")
    expect(pricing).not.toContain("{ text: 'Your own call to action on certificate pages', comingSoon: true }")
  })
})

describe('terms reflect plan-change rules', () => {
  const terms = read('app/(marketing)/terms/page.tsx')
  it('has the plan change section and keeps the draft banner', () => {
    expect(terms).toContain('Plan Changes and Cancellation')
    expect(terms).toContain('take effect at the end of your current billing period')
    expect(terms).toContain('stay live and verifiable')
    expect(terms).toContain('<strong>Draft:</strong>')
  })
})

describe('removed features: pass-score rule and Badgr / Open Badges import', () => {
  const { readdirSync, statSync } = require('fs') as typeof import('fs')
  const walk = (dir: string): string[] =>
    readdirSync(dir).flatMap((name) => {
      const p = join(dir, name)
      return statSync(p).isDirectory() ? walk(p) : /\.(tsx?|mdx?)$/.test(name) ? [p] : []
    })
  const files = [
    ...walk(join(process.cwd(), 'app/(marketing)')),
    ...walk(join(process.cwd(), 'components')),
    join(process.cwd(), 'lib/config/brand.ts'),
    join(process.cwd(), 'lib/billing/entitlements.ts'),
    join(process.cwd(), 'lib/billing/plans.ts'),
  ]

  it.each(files.map((f) => [f.replace(process.cwd() + '/', ''), f]))('%s does not mention them', (_name, file) => {
    const text = readFileSync(file as string, 'utf8')
    expect(text).not.toMatch(/pass-score|pass score|passScore|minimum score|badgr|open badges|openBadges/i)
  })

  it('other coming-soon labels stay on the pricing cards', () => {
    const pricing = read('app/(marketing)/pricing/page.tsx')
    for (const text of ['Issue API', 'Webhook', 'Zapier', 'Custom domain']) {
      expect(pricing).toContain(`{ text: '${text}', comingSoon: true }`)
    }
  })
})
