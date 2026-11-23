/**
 * Entitlements: one map of plan -> limits + feature flags, can()/getLimit(),
 * coming-soon features at their pricing-page tiers, and downgrade rules.
 */
import { readFileSync } from 'fs'
import { join } from 'path'
import { PLANS, PLAN_ORDER, resolvePlan, type PlanId } from '@/lib/billing/plans'
import {
  ENTITLEMENTS,
  FEATURES,
  FEATURE_KEYS,
  FEATURE_MIN_PLAN,
  LIMITS,
  LIMIT_KEYS,
  can,
  effectiveValidityMonths,
  entitlementsFor,
  featureAccess,
  featuresUnlockedBy,
  getLimit,
  planIdOf,
  requiredPlanName,
  type Feature,
} from '@/lib/billing/entitlements'
import {
  DOWNGRADE_WARNING_DAYS,
  canChangePlan,
  featuresLost,
  isDowngrade,
  noopDowngradeHooks,
  periodEndEntitlement,
  planDowngrade,
  runDowngradeHooks,
  topUpAllowance,
} from '@/lib/billing/downgrade'

const read = (p: string) => readFileSync(join(process.cwd(), p), 'utf-8')
const DAY = 24 * 60 * 60 * 1000

describe('entitlements map', () => {
  it('has every plan, every limit and every feature', () => {
    expect(Object.keys(ENTITLEMENTS).sort()).toEqual([...PLAN_ORDER].sort())
    for (const plan of PLAN_ORDER) {
      expect(Object.keys(ENTITLEMENTS[plan].limits).sort()).toEqual([...LIMIT_KEYS].sort())
      expect(Object.keys(ENTITLEMENTS[plan].features).sort()).toEqual([...FEATURE_KEYS].sort())
      expect(ENTITLEMENTS[plan].planName).toBe(PLANS[plan].name)
    }
  })

  it('takes certificate limits from PLANS', () => {
    for (const plan of PLAN_ORDER) {
      expect(ENTITLEMENTS[plan].limits.certificatesPerYear).toBe(PLANS[plan].yearlyLimit)
    }
    expect(ENTITLEMENTS.free.limits.certificatesPerYear).toBe(250)
    expect(ENTITLEMENTS.starter.limits.certificatesPerYear).toBe(1000)
    expect(ENTITLEMENTS.growth.limits.certificatesPerYear).toBe(5000)
    expect(ENTITLEMENTS.business.limits.certificatesPerYear).toBe(10000)
  })

  it('admin seats match the pricing page (Starter 2, Growth 5)', () => {
    expect(ENTITLEMENTS.free.limits.adminSeats).toBe(1)
    expect(ENTITLEMENTS.starter.limits.adminSeats).toBe(2)
    expect(ENTITLEMENTS.growth.limits.adminSeats).toBe(5)
  })

  it('higher plans include everything lower plans do, and limits never go down', () => {
    for (let i = 1; i < PLAN_ORDER.length; i++) {
      const lower = ENTITLEMENTS[PLAN_ORDER[i - 1]]
      const higher = ENTITLEMENTS[PLAN_ORDER[i]]
      for (const f of FEATURE_KEYS) {
        if (lower.features[f]) expect(higher.features[f]).toBe(true)
      }
      for (const k of LIMIT_KEYS) {
        expect(higher.limits[k]).toBeGreaterThanOrEqual(lower.limits[k])
      }
    }
  })

  it('every feature is on its min plan and above, and off below', () => {
    for (const f of FEATURE_KEYS) {
      const min = PLAN_ORDER.indexOf(FEATURES[f].minPlan)
      PLAN_ORDER.forEach((plan, i) => expect(ENTITLEMENTS[plan].features[f]).toBe(i >= min))
    }
  })

  it('FEATURE_MIN_PLAN is derived from FEATURES', () => {
    for (const f of FEATURE_KEYS) expect(FEATURE_MIN_PLAN[f]).toBe(FEATURES[f].minPlan)
  })

  it('never describes anything as unlimited', () => {
    expect(read('lib/billing/entitlements.ts')).not.toMatch(/unlimited/i)
    expect(read('lib/billing/downgrade.ts')).not.toMatch(/unlimited/i)
    for (const plan of PLAN_ORDER) {
      for (const k of LIMIT_KEYS) expect(Number.isFinite(ENTITLEMENTS[plan].limits[k])).toBe(true)
    }
  })
})

describe('no behaviour change for gates that were live before', () => {
  // The 5de9a48 gate table, frozen here
  const BEFORE: Record<string, PlanId> = {
    expiry: 'starter',
    brandedEmail: 'starter',
    shareAnalytics: 'growth',
    expiryReminders: 'growth',
    expiringSoonView: 'growth',
  }
  it.each(Object.entries(BEFORE))('%s keeps its tier', (feature, minPlan) => {
    PLAN_ORDER.forEach((plan, i) => {
      expect(can(plan, feature as Feature)).toBe(i >= PLAN_ORDER.indexOf(minPlan))
    })
  })

  it('only the previously enforced gates are marked enforced', () => {
    const enforced = FEATURE_KEYS.filter((f) => FEATURES[f].enforced).sort()
    expect(enforced).toEqual(['brandedEmail', 'expiry', 'shareAnalytics'])
  })

  it('usage metering reads the yearly limit through getLimit', () => {
    const usage = read('lib/billing/usage.ts')
    expect(usage).toContain("getLimit(plan, 'certificatesPerYear')")
    expect(usage).toContain('export async function accountCan(')
    expect(usage).toContain('export async function accountLimit(')
    expect(usage).toContain('export async function getAccountEntitlements(')
  })

  it('no plan check bypasses the entitlements module', () => {
    const files = [
      'app/dashboard/courses/actions.ts',
      'app/dashboard/courses/[id]/page.tsx',
      'app/dashboard/courses/new/page.tsx',
      'app/dashboard/results/page.tsx',
      'app/dashboard/certificates/page.tsx',
      'app/dashboard/certificates/actions.ts',
      'app/dashboard/certificates/issue/actions.ts',
      'lib/import/actions.ts',
      'components/dashboard/locked-feature.tsx',
      'lib/billing/usage.ts',
    ]
    for (const f of files) {
      const src = read(f)
      expect(src).not.toMatch(/planIncludes|academyHasFeature|FEATURE_MIN_PLAN\[/)
      expect(src).not.toMatch(/plan\.id\s*===\s*'(free|starter|growth|business)'/)
    }
    expect(read('lib/billing/plans.ts')).not.toContain('FEATURE_MIN_PLAN')
  })
})

describe('coming-soon features sit at their pricing-page tiers', () => {
  const pricing = read('app/(marketing)/pricing/page.tsx')
  const section = (name: string) => {
    const start = pricing.indexOf(`name: '${name}'`)
    const next = PLAN_ORDER.map((p) => pricing.indexOf(`name: '${PLANS[p].name}'`)).filter((i) => i > start).sort((a, b) => a - b)[0]
    return pricing.slice(start, next ?? pricing.indexOf('function CheckIcon'))
  }
  const PHRASE: Record<Feature, string> = {
    expiry: 'Expiry dates',
    brandedEmail: 'Branded email',
    issueApi: 'Issue API',
    webhooks: 'Webhook',
    zapier: 'Zapier',
    passScoreRule: 'Pass-score rule',
    openBadgesImport: 'Open Badges import',
    shareAnalytics: 'Share and click analytics',
    expiryReminders: 'Expiry reminder emails',
    expiringSoonView: 'expiring-soon view',
    customCta: 'Your own call to action on certificate pages',
    pageAddress: 'Your own page address',
    customDomain: 'Custom domain',
    whiteLabel: 'Full white-label',
    sso: 'SSO',
    multipleBrands: 'Multiple brands',
    auditLog: 'Audit log',
    recertificationCampaigns: 'Recertification campaigns',
  }

  it.each(FEATURE_KEYS)('%s', (f) => {
    expect(section(PLANS[FEATURES[f].minPlan].name)).toContain(PHRASE[f])
  })

  it('features shown as coming soon on the pricing page are registered as coming soon', () => {
    for (const f of FEATURE_KEYS) {
      const s = section(PLANS[FEATURES[f].minPlan].name)
      const line = s.split('\n').find((l) => l.includes("text: '") && l.includes(PHRASE[f])) ?? ''
      expect([f, line]).not.toEqual([f, ''])
      expect([f, line.includes('comingSoon: true')]).toEqual([f, FEATURES[f].status === 'coming_soon'])
    }
  })

  it('registers reminders, expiring-soon, custom domain, white-label, SSO, brands, audit log', () => {
    expect(FEATURE_MIN_PLAN.expiryReminders).toBe('growth')
    expect(FEATURE_MIN_PLAN.expiringSoonView).toBe('growth')
    expect(FEATURE_MIN_PLAN.customDomain).toBe('business')
    expect(FEATURE_MIN_PLAN.whiteLabel).toBe('business')
    expect(FEATURE_MIN_PLAN.sso).toBe('business')
    expect(FEATURE_MIN_PLAN.multipleBrands).toBe('business')
    expect(FEATURE_MIN_PLAN.auditLog).toBe('business')
  })
})

describe('can() and getLimit()', () => {
  it('accept a plan ID, a resolved plan or an account', () => {
    expect(can('growth', 'shareAnalytics')).toBe(true)
    expect(can(PLANS.growth, 'shareAnalytics')).toBe(true)
    expect(can({ plan: 'growth' }, 'shareAnalytics')).toBe(true)
    expect(can({ plan: PLANS.starter }, 'shareAnalytics')).toBe(false)
  })

  it('treat unknown or missing plans as Free', () => {
    expect(planIdOf('mystery' as any)).toBe('free')
    expect(planIdOf(null)).toBe('free')
    expect(can(null, 'expiry')).toBe(false)
    expect(can('mystery' as any, 'expiry')).toBe(false)
    expect(getLimit(undefined, 'certificatesPerYear')).toBe(250)
  })

  it('Business contract values raise the floor but never lower it', () => {
    expect(getLimit({ plan: 'business', overrides: { adminSeats: 25 } }, 'adminSeats')).toBe(25)
    expect(getLimit({ plan: 'business', overrides: { adminSeats: 1 } }, 'adminSeats')).toBe(5)
    expect(getLimit({ plan: 'business', overrides: { brands: 4 } }, 'brands')).toBe(4)
    expect(getLimit(resolvePlan('business', 20000), 'certificatesPerYear')).toBe(20000)
    expect(getLimit(resolvePlan('business', 500), 'certificatesPerYear')).toBe(10000)
  })

  it('ignores overrides on non-contract plans', () => {
    expect(getLimit({ plan: 'growth', overrides: { adminSeats: 50 } }, 'adminSeats')).toBe(5)
    expect(getLimit({ plan: 'free', overrides: { certificatesPerYear: 9999 } }, 'certificatesPerYear')).toBe(250)
    expect(LIMITS.adminSeats.contractPlans).toEqual(['business'])
  })

  it('entitlementsFor includes overrides', () => {
    const e = entitlementsFor({ plan: 'business', overrides: { adminSeats: 12 } })
    expect(e.limits.adminSeats).toBe(12)
    expect(e.features.sso).toBe(true)
  })

  it('featureAccess locks instead of hiding', () => {
    expect(featureAccess('free', 'shareAnalytics')).toEqual({
      state: 'locked', comingSoon: false, requiredPlan: 'growth', requiredPlanName: 'Growth',
    })
    expect(featureAccess('starter', 'expiryReminders')).toMatchObject({ state: 'locked', comingSoon: true })
    expect(featureAccess('growth', 'shareAnalytics')).toEqual({ state: 'enabled', comingSoon: false })
    expect(requiredPlanName('auditLog')).toBe('Business')
  })

  it('featuresUnlockedBy lists what an upgrade adds', () => {
    expect(featuresUnlockedBy('starter', 'growth').sort()).toEqual(['customCta', 'expiringSoonView', 'expiryReminders', 'pageAddress', 'shareAnalytics'])
    expect(featuresUnlockedBy('business', 'free')).toEqual([])
  })

  it('effectiveValidityMonths drops expiry below Starter', () => {
    expect(effectiveValidityMonths('free', 12)).toBeNull()
    expect(effectiveValidityMonths({ plan: 'starter' }, 12)).toBe(12)
    expect(effectiveValidityMonths('growth', 0)).toBeNull()
  })
})

describe('server helpers default to Free when the plan cannot be read', () => {
  beforeEach(() => jest.resetModules())

  it('accountCan / accountLimit / getAccountEntitlements', async () => {
    jest.doMock('@/lib/db', () => ({
      db: { select: () => { throw new Error('relation "academy_plans" does not exist') } },
    }))
    const { accountCan, accountLimit, getAccountEntitlements } = await import('@/lib/billing/usage')
    expect(await accountCan('acct', 'expiry')).toBe(false)
    expect(await accountCan('acct', 'shareAnalytics')).toBe(false)
    expect(await accountLimit('acct', 'certificatesPerYear')).toBe(250)
    expect((await getAccountEntitlements('acct')).plan).toBe('free')
  })

  it('uses the stored plan when there is one', async () => {
    const chain: any = { from: () => chain, where: () => chain, limit: async () => [{ plan: 'business', customLimit: 30000 }] }
    jest.doMock('@/lib/db', () => ({ db: { select: () => chain } }))
    const { accountCan, accountLimit } = await import('@/lib/billing/usage')
    expect(await accountCan('acct', 'sso')).toBe(true)
    expect(await accountLimit('acct', 'certificatesPerYear')).toBe(30000)
  })
})

describe('downgrade rules', () => {
  const now = new Date('2026-11-23T12:00:00Z')
  const periodEnd = new Date('2026-12-31T00:00:00Z')

  it('detects downgrades', () => {
    expect(isDowngrade('growth', 'starter')).toBe(true)
    expect(isDowngrade('free', 'business')).toBe(false)
    expect(isDowngrade('starter', 'starter')).toBe(false)
  })

  it('never touches issued certificates', () => {
    const plan = planDowngrade('business', 'free', { certificatesThisYear: 9000 }, periodEnd, now)
    expect(plan.issuedCertificatesUnaffected).toBe(true)
    const src = read('lib/billing/downgrade.ts')
    expect(src).not.toMatch(/from '@\/lib\/db'|resend|stripe|sendEmail/i)
  })

  it('locks lost features straight away (as previews), except period-end ones', () => {
    const plan = planDowngrade('growth', 'free', { certificatesThisYear: 0 }, periodEnd, now)
    expect(plan.locks.sort()).toEqual(
      ['brandedEmail', 'customCta', 'expiringSoonView', 'expiry', 'expiryReminders', 'issueApi', 'openBadgesImport', 'pageAddress', 'passScoreRule', 'shareAnalytics', 'webhooks', 'zapier'].sort()
    )
    for (const f of plan.locks) expect(featureAccess('free', f).state).toBe('locked')
    const fromBusiness = planDowngrade('business', 'growth', { certificatesThisYear: 0 }, periodEnd, now)
    expect(fromBusiness.locks).not.toContain('customDomain')
    expect(fromBusiness.locks).not.toContain('multipleBrands')
    expect(fromBusiness.locks).toEqual(expect.arrayContaining(['whiteLabel', 'sso', 'auditLog']))
  })

  it('downgrades take effect at the end of the billing period; upgrades straight away', () => {
    expect(planDowngrade('growth', 'starter', { certificatesThisYear: 0 }, periodEnd, now).effectiveAt).toEqual(periodEnd)
    expect(planDowngrade('starter', 'growth', { certificatesThisYear: 0 }, periodEnd, now).effectiveAt).toEqual(now)
  })

  it("can't move to a paid plan whose yearly limit is below this year's usage; cancelling to Free is allowed", () => {
    expect(canChangePlan('starter', 1000)).toEqual({ allowed: true })
    expect(canChangePlan('starter', 1001).allowed).toBe(false)
    expect(canChangePlan('starter', 1001).reason).toContain('cancel to Free')
    expect(canChangePlan('free', 4000)).toEqual({ allowed: true })
    const blocked = planDowngrade('growth', 'starter', { certificatesThisYear: 3000 }, periodEnd, now)
    expect(blocked.allowed).toBe(false)
    expect(blocked.blockedReason).toBeDefined()
    const cancel = planDowngrade('growth', 'free', { certificatesThisYear: 3000 }, periodEnd, now)
    expect(cancel.allowed).toBe(true)
    expect(cancel.canIssueNew).toBe(false)
    expect(cancel.issuedCertificatesUnaffected).toBe(true)
  })

  it('featuresLost is empty on upgrade', () => {
    expect(featuresLost('free', 'growth')).toEqual([])
    const plan = planDowngrade('free', 'growth', { certificatesThisYear: 10 }, periodEnd, now)
    expect(plan.isDowngrade).toBe(false)
    expect(plan.locks).toEqual([])
    expect(plan.warning).toBeNull()
  })

  it('measures this year against the new limit and blocks new issuing after the 10% grace', () => {
    // Free: 250 limit, 275 hard cap
    const within = planDowngrade('starter', 'free', { certificatesThisYear: 260 }, periodEnd, now)
    expect(within.usage.level).toBe('limit')
    expect(within.usage.remaining).toBe(15)
    expect(within.canIssueNew).toBe(true)
    const over = planDowngrade('starter', 'free', { certificatesThisYear: 600 }, periodEnd, now)
    expect(over.usage.level).toBe('blocked')
    expect(over.canIssueNew).toBe(false)
    const atCap = planDowngrade('starter', 'free', { certificatesThisYear: 275 }, periodEnd, now)
    expect(atCap.canIssueNew).toBe(false)
  })

  it('seats, brands and custom domain switch off at period end, after a warning', () => {
    const from = { plan: 'business' as const, overrides: { adminSeats: 10, brands: 3 } }
    const plan = planDowngrade(from, 'growth', { certificatesThisYear: 100, adminSeats: 8, brands: 3, customDomainActive: true }, periodEnd, now)
    expect(plan.atPeriodEnd).toEqual([
      { kind: 'limit', key: 'adminSeats', label: 'Admin seats', inUse: 8, allowed: 5, excess: 3 },
      { kind: 'limit', key: 'brands', label: 'Brands', inUse: 3, allowed: 1, excess: 2 },
      { kind: 'feature', key: 'customDomain', label: 'Custom domain', inUse: 1, allowed: 0, excess: 1 },
    ])
    expect(plan.warning?.switchOffAt).toEqual(periodEnd)
    expect(plan.warning?.sendAt).toEqual(new Date(periodEnd.getTime() - DOWNGRADE_WARNING_DAYS * DAY))
  })

  it('sends the warning immediately when the period ends sooner than the notice window', () => {
    const soon = new Date(now.getTime() + 3 * DAY)
    const plan = planDowngrade('growth', 'free', { certificatesThisYear: 0, adminSeats: 4 }, soon, now)
    expect(plan.warning?.sendAt).toEqual(now)
  })

  it('no warning when nothing is over the new limits', () => {
    const plan = planDowngrade('business', 'growth', { certificatesThisYear: 0, adminSeats: 5, brands: 1, customDomainActive: false }, periodEnd, now)
    expect(plan.atPeriodEnd).toEqual([])
    expect(plan.warning).toBeNull()
  })

  it('old seats/brands/domain stay in force until the period end', () => {
    const from = { plan: 'business' as const, overrides: { adminSeats: 10 } }
    expect(periodEndEntitlement(from, 'growth', 'adminSeats', periodEnd, now)).toBe(10)
    expect(periodEndEntitlement(from, 'growth', 'customDomain', periodEnd, now)).toBe(true)
    const after = new Date(periodEnd.getTime() + DAY)
    expect(periodEndEntitlement(from, 'growth', 'adminSeats', periodEnd, after)).toBe(5)
    expect(periodEndEntitlement(from, 'growth', 'customDomain', periodEnd, after)).toBe(false)
  })

  it('hooks run warning first, then switch-off, and the default hooks do nothing', async () => {
    const plan = planDowngrade('growth', 'free', { certificatesThisYear: 0, adminSeats: 3 }, periodEnd, now)
    const calls: string[] = []
    const hooks = {
      onWarning: jest.fn(async () => { calls.push('warning') }),
      onSwitchOff: jest.fn(async () => { calls.push('switch_off') }),
    }
    const early = new Date(plan.warning!.sendAt.getTime() - DAY)
    expect(await runDowngradeHooks('a', plan, { warningSent: false, switchedOff: false }, hooks, early)).toBe('none')
    expect(await runDowngradeHooks('a', plan, { warningSent: false, switchedOff: false }, hooks, plan.warning!.sendAt)).toBe('warning')
    // Never switches off before the warning has gone out
    expect(await runDowngradeHooks('a', plan, { warningSent: false, switchedOff: false }, hooks, new Date(periodEnd.getTime() + DAY))).toBe('warning')
    expect(await runDowngradeHooks('a', plan, { warningSent: true, switchedOff: false }, hooks, periodEnd)).toBe('switch_off')
    expect(await runDowngradeHooks('a', plan, { warningSent: true, switchedOff: true }, hooks, periodEnd)).toBe('none')
    expect(calls).toEqual(['warning', 'warning', 'switch_off'])
    await expect(noopDowngradeHooks.onWarning('a', plan.warning!)).resolves.toBeUndefined()
    await expect(runDowngradeHooks('a', plan, { warningSent: false, switchedOff: false }, undefined, periodEnd)).resolves.toBe('warning')
  })
})

describe('top-ups', () => {
  const start = new Date('2026-03-01T00:00:00Z')
  const end = new Date('2027-03-01T00:00:00Z')
  const topUps = [
    { certificates: 500, purchasedAt: new Date('2026-06-01T00:00:00Z') },
    { certificates: 200, purchasedAt: new Date('2026-01-01T00:00:00Z') }, // previous plan year: expired
  ]

  it('adds this year’s top-ups on top of the plan limit; grace applies to the plan limit only', () => {
    const a = topUpAllowance('starter', 0, topUps, start, end)
    expect(a).toEqual({ planLimit: 1000, topUps: 500, topUpsRemaining: 500, limit: 1500, cap: 1600, remaining: 1600 })
  })

  it('uses the plan allowance first, then top-ups', () => {
    expect(topUpAllowance('starter', 900, topUps, start, end).topUpsRemaining).toBe(500)
    expect(topUpAllowance('starter', 1200, topUps, start, end).topUpsRemaining).toBe(300)
    expect(topUpAllowance('starter', 5000, topUps, start, end)).toMatchObject({ topUpsRemaining: 0, remaining: 0 })
  })

  it('unused top-ups carry over a downgrade until the year resets', () => {
    const before = topUpAllowance('growth', 100, topUps, start, end)
    const after = topUpAllowance('free', 100, topUps, start, end)
    expect(after.topUpsRemaining).toBe(before.topUpsRemaining)
    expect(after.cap).toBe(275 + 500)
    const nextYear = topUpAllowance('free', 0, topUps, end, new Date('2028-03-01T00:00:00Z'))
    expect(nextYear.topUps).toBe(0)
  })

  it('ignores negative top-ups', () => {
    expect(topUpAllowance('free', 0, [{ certificates: -50, purchasedAt: new Date('2026-06-01') }], start, end).topUps).toBe(0)
  })
})
