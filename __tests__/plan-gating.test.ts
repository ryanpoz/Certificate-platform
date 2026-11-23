/**
 * Feature gating by plan: expiry (Starter+), share and click analytics (Growth+).
 */
import { readFileSync } from 'fs'
import { join } from 'path'
import {
  FEATURE_MIN_PLAN,
  PLANS,
  effectiveValidityMonths,
  planIncludes,
  requiredPlanName,
} from '@/lib/billing/plans'

const read = (p: string) => readFileSync(join(process.cwd(), p), 'utf-8')

describe('planIncludes', () => {
  it('gates expiry to Starter and up', () => {
    expect(planIncludes('free', 'expiry')).toBe(false)
    expect(planIncludes('starter', 'expiry')).toBe(true)
    expect(planIncludes('growth', 'expiry')).toBe(true)
    expect(planIncludes(PLANS.business, 'expiry')).toBe(true)
  })

  it('gates share analytics, reminders and expiring-soon to Growth and up', () => {
    for (const feature of ['shareAnalytics', 'expiryReminders', 'expiringSoonView'] as const) {
      expect(planIncludes('free', feature)).toBe(false)
      expect(planIncludes('starter', feature)).toBe(false)
      expect(planIncludes('growth', feature)).toBe(true)
      expect(planIncludes('business', feature)).toBe(true)
    }
  })

  it('treats unknown plans as Free', () => {
    expect(planIncludes('mystery' as any, 'expiry')).toBe(false)
  })

  it('names the plan to upgrade to', () => {
    expect(requiredPlanName('expiry')).toBe('Starter')
    expect(requiredPlanName('shareAnalytics')).toBe('Growth')
    expect(FEATURE_MIN_PLAN.shareAnalytics).toBe('growth')
  })
})

describe('effectiveValidityMonths', () => {
  it('drops expiry for new certificates on Free', () => {
    expect(effectiveValidityMonths('free', 12)).toBeNull()
  })
  it('keeps expiry on Starter and up', () => {
    expect(effectiveValidityMonths('starter', 12)).toBe(12)
    expect(effectiveValidityMonths(PLANS.growth, 24)).toBe(24)
  })
  it('stays null when no validity is set', () => {
    expect(effectiveValidityMonths('growth', null)).toBeNull()
  })
})

describe('expiry is enforced server-side', () => {
  it('program create ignores validity on plans without expiry', () => {
    const src = read('app/dashboard/courses/actions.ts')
    expect(src).toContain('effectiveValidityMonths(plan, data.validityMonths')
  })

  it('program update leaves the stored validity untouched without expiry', () => {
    const src = read('app/dashboard/courses/actions.ts')
    expect(src).toContain("planIncludes(await getAcademyPlan(existing.academyId), 'expiry')")
    expect(src).toContain('...(canSetExpiry ? { validityMonths } : {})')
  })

  it('every issuing path applies the plan before computing expiry', () => {
    expect(read('app/dashboard/certificates/issue/actions.ts')).toContain(
      'effectiveValidityMonths(await getAcademyPlan(data.academyId), course.validityMonths)'
    )
    const imp = read('lib/import/actions.ts')
    expect(imp.match(/effectiveValidityMonths\(await getAcademyPlan\(academyId\), course\.validityMonths\)/g)?.length).toBe(2)
    expect(read('app/dashboard/certificates/actions.ts')).toContain(
      'effectiveValidityMonths(await getAcademyPlan(cert.certificate.academyId), cert.course.validityMonths)'
    )
  })

  it('never rewrites expiry on already-issued certificates', () => {
    for (const f of ['app/dashboard/courses/actions.ts', 'lib/billing/plans.ts', 'lib/billing/usage.ts']) {
      expect(read(f)).not.toMatch(/update\(certificates\)[\s\S]{0,200}expiryDate/)
    }
  })

  it('shows the expiry control disabled with a Starter plan link on Free', () => {
    const form = read('app/dashboard/courses/new/form.tsx')
    expect(form).toContain('disabled={!canUseExpiry}')
    expect(form).toContain('<PlanBadgeLink feature="expiry" />')
    expect(read('app/dashboard/courses/new/page.tsx')).toContain("academyHasFeature(user.academyId, 'expiry')")
  })
})

describe('share and click analytics are gated to Growth', () => {
  const results = read('app/dashboard/results/page.tsx')

  it('Results only renders the analytics panels on Growth+, else a locked card', () => {
    expect(results).toContain("academyHasFeature(user.academyId, 'shareAnalytics')")
    const gated = results.slice(results.indexOf('{canSeeShareAnalytics ? ('))
    expect(gated.indexOf('<LoopActivity')).toBeGreaterThan(-1)
    expect(gated.indexOf('<ShareImpact')).toBeGreaterThan(-1)
    expect(gated.indexOf('<LockedFeatureCard')).toBeGreaterThan(gated.indexOf('<ShareImpact'))
    expect(results).toContain('feature="shareAnalytics"')
  })

  it('keeps basic counts (issued, sent, claimed) visible on every plan', () => {
    const before = results.slice(0, results.indexOf('{canSeeShareAnalytics ? ('))
    expect(before).toContain('<BasicCounts')
    const counts = read('app/dashboard/results/basic-counts.tsx')
    expect(counts).toContain("'Issued'")
    expect(counts).toContain("'Emails sent'")
    expect(counts).toContain("'Claimed'")
  })

  it('locked card says Available on Growth and links to pricing', () => {
    const card = read('components/dashboard/locked-feature.tsx')
    expect(card).toContain('Available on {planName}')
    expect(card).toContain('href={UPGRADE_URL}')
  })

  it('program list skips view and LinkedIn queries below Growth', () => {
    const page = read('app/dashboard/certificates/page.tsx')
    expect(page).toContain('const [viewCount] = !canSeeShareAnalytics ? [{ count: 0 }] : await db')
    expect(page).toContain('const [linkedinCount] = !canSeeShareAnalytics ? [{ count: 0 }] : await db')
  })

  it('recipient progress hides LinkedIn and PDF stages below Growth', () => {
    const rp = read('app/dashboard/courses/[id]/recipient-progress.tsx')
    expect(rp).toContain("showClickAnalytics && certEvents.some(e => e.type === 'linkedin_add_click')")
    expect(rp).toContain('<PlanBadgeLink feature="shareAnalytics" />')
    expect(read('app/dashboard/courses/[id]/page.tsx')).toContain('showClickAnalytics={canSeeShareAnalytics}')
  })

  it('CSV exports only include click columns on Growth+', () => {
    const actions = read('app/dashboard/certificates/actions.ts')
    expect(actions).toContain("...(includeClicks ? ['LinkedIn Clicked', 'CTA Clicked'] : [])")
    expect(actions.match(/academyHasFeature\([^)]*'shareAnalytics'\)/g)?.length).toBe(2)
  })

  it('event tracking keeps running for every plan', () => {
    const route = read('app/api/events/track/route.ts')
    expect(route).not.toContain('academyHasFeature')
    expect(route).not.toContain('planIncludes')
  })
})
