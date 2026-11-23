/**
 * The program's own call to action on certificate pages is Growth+, enforced
 * server-side. Below Growth, certificate pages show our default growth-loop CTA;
 * saved CTA label/link are kept and return on upgrade. CTA clicks still record.
 */
import { readFileSync } from 'fs'
import { join } from 'path'
import { FEATURES, can } from '@/lib/billing/entitlements'
import { PLAN_ORDER } from '@/lib/billing/plans'
import { CTA_SOURCES, isCtaSource, isIssuerCtaClick } from '@/lib/growth/tracking'

const read = (p: string) => readFileSync(join(process.cwd(), p), 'utf-8')

describe('customCta entitlement', () => {
  it('is a live, enforced Growth+ feature', () => {
    expect(FEATURES.customCta).toMatchObject({ minPlan: 'growth', status: 'live', enforced: true })
    expect(PLAN_ORDER.map((p) => can(p, 'customCta'))).toEqual([false, false, true, true])
  })
})

describe('certificate page', () => {
  const page = read('app/c/[number]/page.tsx')
  const view = read('app/c/[number]/certificate-view.tsx')

  it("resolves the plan on the server and never sends the issuer's CTA below Growth", () => {
    expect(page).toContain("const showIssuerCta = can(await getAcademyPlan(academy.id), 'customCta')")
    expect(page).toContain('ctaLabel: showIssuerCta ? course.ctaLabel : null')
    expect(page).toContain('ctaUrl: showIssuerCta ? course.ctaUrl : null')
    expect(page).toContain('showPlatformCta={!showIssuerCta}')
  })

  it('shows our default growth-loop CTA instead, linking to signup with the referral', () => {
    const block = view.slice(view.indexOf('{showPlatformCta && ('), view.indexOf('{!showPlatformCta && ctaUrl'))
    expect(block).toContain('href={signupUrl}')
    expect(block).toContain('Verified by {BRAND.name}')
    expect(block).toContain('Create your first certificate')
    expect(view).toContain("const signupUrl = signupRefUrl('', certificate.number)")
  })

  it("issuer's CTA only renders when the platform CTA is off", () => {
    expect(view).toContain('{!showPlatformCta && ctaUrl && course.ctaLabel && (')
  })

  it('both CTAs record cta_click, tagged with their source', () => {
    expect(view).toContain("trackAction('cta_click', { cta: 'platform' })")
    expect(view).toContain("trackAction('cta_click', { cta: 'issuer' })")
    const route = read('app/api/events/track/route.ts')
    expect(route).toContain("...(type === 'cta_click' && isCtaSource(cta) ? { cta } : {}),")
    expect(route).not.toContain('customCta')
  })

  it('the "Verified by" footer stays on every plan', () => {
    expect(view).toContain("<VerifiedByFooter signupUrl={signupUrl} onClick={() => trackAction('verified_by_click')} />")
  })
})

describe('CTA click sources', () => {
  it('accepts only known sources', () => {
    expect(CTA_SOURCES).toEqual(['issuer', 'platform'])
    expect(isCtaSource('issuer')).toBe(true)
    expect(isCtaSource('platform')).toBe(true)
    expect(isCtaSource('evil')).toBe(false)
    expect(isCtaSource(undefined)).toBe(false)
  })

  it('issuer analytics exclude clicks on our default CTA; older untagged clicks count as issuer', () => {
    expect(isIssuerCtaClick({ cta: 'issuer' })).toBe(true)
    expect(isIssuerCtaClick(null)).toBe(true)
    expect(isIssuerCtaClick({ isRecipient: true })).toBe(true)
    expect(isIssuerCtaClick({ cta: 'platform' })).toBe(false)
    const impact = read('app/dashboard/results/share-impact.tsx')
    expect(impact.match(/isIssuerCtaClick\(e\.meta\)/g)?.length).toBe(2)
  })
})

describe('program settings', () => {
  it('new-program form locks the CTA fields with a Growth plan link', () => {
    const form = read('app/dashboard/courses/new/form.tsx')
    expect(form.match(/disabled=\{!canUseCta\}/g)?.length).toBe(2)
    expect(form).toContain('<PlanBadgeLink feature="customCta" />')
    expect(read('app/dashboard/courses/new/page.tsx')).toContain("accountCan(user.academyId, 'customCta')")
    const badge = read('components/dashboard/locked-feature.tsx')
    expect(badge).toContain('href={UPGRADE_URL}')
    expect(badge).toContain('{requiredPlanName(feature)} plan')
  })

  it('program page shows a saved CTA as kept but not shown, with the Growth link', () => {
    const detail = read('app/dashboard/courses/[id]/page.tsx')
    expect(detail).toContain("const canUseCta = can(plan, 'customCta')")
    expect(detail).toContain('(saved, not shown on certificate pages on your plan) <PlanBadgeLink feature="customCta" />')
  })
})

// --- Behavioural: create / update programs -----------------------------------

const USER = { id: 'u1', academyId: 'acct-1', email: 'o@example.com', name: 'O' }

function setup(plan: 'free' | 'starter' | 'growth') {
  jest.resetModules()
  const writes: Array<{ op: string; data: any }> = []
  const chain: any = new Proxy({}, {
    get(_t, prop) {
      if (prop === 'then') return (res: any, rej: any) => Promise.resolve([{ id: 'x', academyId: 'acct-1' }]).then(res, rej)
      if (prop === 'values') return (v: any) => { writes.push({ op: 'insert', data: v }); return chain }
      if (prop === 'set') return (v: any) => { writes.push({ op: 'update', data: v }); return chain }
      return () => chain
    },
  })
  jest.doMock('@/lib/db', () => ({ db: { select: () => chain, insert: () => chain, update: () => chain, delete: () => chain } }))
  jest.doMock('@/lib/utils/session', () => ({ getCurrentUser: jest.fn(async () => USER) }))
  jest.doMock('next/cache', () => ({ revalidatePath: jest.fn() }))
  jest.doMock('nanoid', () => ({ nanoid: () => 'ABCDEFGH', customAlphabet: () => () => 'ABCD' }))
  jest.doMock('@/lib/billing/usage', () => {
    const { resolvePlan } = jest.requireActual('@/lib/billing/plans')
    return { getAcademyPlan: jest.fn(async () => resolvePlan(plan)) }
  })
  return writes
}

const DATA = { name: 'Safety', code: 'SAF', description: '', validityMonths: '', ctaLabel: 'Book a demo', ctaUrl: 'https://acme.example/demo' }

describe.each(['free', 'starter'] as const)('below Growth (%s)', (plan) => {
  it('creating a program ignores the CTA', async () => {
    const writes = setup(plan)
    const { createCourse } = await import('@/app/dashboard/courses/actions')
    await createCourse('acct-1', DATA)
    const course = writes.find((w) => w.op === 'insert' && 'code' in w.data)!
    expect(course.data.ctaLabel).toBeNull()
    expect(course.data.ctaUrl).toBeNull()
  })

  it('updating a program keeps the saved CTA untouched (never cleared)', async () => {
    const writes = setup(plan)
    const { updateCourse } = await import('@/app/dashboard/courses/actions')
    expect(await updateCourse('course-1', { ...DATA, ctaLabel: '', ctaUrl: '' })).toEqual({ success: true })
    const update = writes.find((w) => w.op === 'update')!
    expect(update.data).not.toHaveProperty('ctaLabel')
    expect(update.data).not.toHaveProperty('ctaUrl')
  })

  it('an invalid CTA URL is ignored rather than blocking the save', async () => {
    setup(plan)
    const { updateCourse } = await import('@/app/dashboard/courses/actions')
    expect(await updateCourse('course-1', { ...DATA, ctaUrl: 'not a url' })).toEqual({ success: true })
  })
})

describe('on Growth', () => {
  it('creating and updating a program saves the CTA', async () => {
    let writes = setup('growth')
    let actions = await import('@/app/dashboard/courses/actions')
    await actions.createCourse('acct-1', DATA)
    expect(writes.find((w) => w.op === 'insert' && 'code' in w.data)!.data).toMatchObject({
      ctaLabel: 'Book a demo', ctaUrl: 'https://acme.example/demo',
    })
    writes = setup('growth')
    actions = await import('@/app/dashboard/courses/actions')
    await actions.updateCourse('course-1', DATA)
    expect(writes.find((w) => w.op === 'update')!.data).toMatchObject({ ctaLabel: 'Book a demo', ctaUrl: 'https://acme.example/demo' })
  })

  it('still validates the CTA URL', async () => {
    setup('growth')
    const { updateCourse } = await import('@/app/dashboard/courses/actions')
    expect(await updateCourse('course-1', { ...DATA, ctaUrl: 'not a url' })).toEqual({ error: 'Please enter a valid CTA URL' })
  })
})

describe('import copy: imports count toward the yearly allowance', () => {
  it.each(['app/(marketing)/page.tsx', 'app/(marketing)/switch/page.tsx'])('%s', (p) => {
    const src = read(p)
    expect(src).toContain('imported certificates count toward your plan&apos;s yearly allowance')
    expect(src).toContain('Migration help is free')
    expect(src).not.toMatch(/at no cost|no cost for existing|for free|free trial|unlimited/i)
  })

  it('pricing says imported certificates count', () => {
    expect(read('app/(marketing)/pricing/page.tsx')).toContain('certificates imported from another platform')
  })
})
