/**
 * Usage metering: plan limits, plan-year windows, grace, and server-side enforcement.
 */
import { readFileSync } from 'fs'
import { join } from 'path'
import {
  PLANS,
  checkIssueAllowance,
  countsAfterDeletion,
  evaluateUsage,
  getPlanYear,
  hardCap,
  resolvePlan,
  totalBillable,
} from '@/lib/billing/plans'

const read = (p: string) => readFileSync(join(process.cwd(), p), 'utf-8')

describe('plan definitions', () => {
  it('matches the published yearly limits', () => {
    expect(PLANS.free.yearlyLimit).toBe(250)
    expect(PLANS.starter.yearlyLimit).toBe(1000)
    expect(PLANS.growth.yearlyLimit).toBe(5000)
    expect(PLANS.business.yearlyLimit).toBe(10000)
  })

  it('defaults unknown or missing plans to Free', () => {
    expect(resolvePlan(undefined).id).toBe('free')
    expect(resolvePlan('enterprise-unlimited').id).toBe('free')
    expect(resolvePlan('growth').yearlyLimit).toBe(5000)
  })

  it('lets Business use a custom limit above 10,000 but not other plans', () => {
    expect(resolvePlan('business', 25000).yearlyLimit).toBe(25000)
    expect(resolvePlan('business', 5000).yearlyLimit).toBe(10000)
    expect(resolvePlan('starter', 25000).yearlyLimit).toBe(1000)
  })

  it('adds a 10% grace allowance', () => {
    expect(hardCap(250)).toBe(275)
    expect(hardCap(1000)).toBe(1100)
  })
})

describe('getPlanYear', () => {
  it('starts on the signup anniversary', () => {
    const signup = new Date('2025-03-15T10:00:00Z')
    const { start, end } = getPlanYear(signup, new Date('2026-11-23T00:00:00Z'))
    expect(start.toISOString()).toBe('2026-03-15T10:00:00.000Z')
    expect(end.toISOString()).toBe('2027-03-15T10:00:00.000Z')
  })

  it('uses the previous anniversary before this year\'s has passed', () => {
    const signup = new Date('2025-12-01T00:00:00Z')
    const { start, end } = getPlanYear(signup, new Date('2026-11-23T00:00:00Z'))
    expect(start.toISOString()).toBe('2025-12-01T00:00:00.000Z')
    expect(end.toISOString()).toBe('2026-12-01T00:00:00.000Z')
  })

  it('handles a brand new account', () => {
    const signup = new Date('2026-11-23T12:00:00Z')
    const { start, end } = getPlanYear(signup, new Date('2026-11-23T12:00:01Z'))
    expect(start.toISOString()).toBe(signup.toISOString())
    expect(end.toISOString()).toBe('2027-11-23T12:00:00.000Z')
  })

  it('rolls Feb 29 signups to Feb 28 in non-leap years', () => {
    const signup = new Date('2024-02-29T00:00:00Z')
    const { start, end } = getPlanYear(signup, new Date('2026-06-01T00:00:00Z'))
    expect(start.toISOString()).toBe('2026-02-28T00:00:00.000Z')
    expect(end.toISOString()).toBe('2027-02-28T00:00:00.000Z')
  })
})

describe('evaluateUsage', () => {
  it('is ok below 80%', () => {
    expect(evaluateUsage(199, 250).level).toBe('ok')
  })
  it('warns at 80%', () => {
    expect(evaluateUsage(200, 250).level).toBe('warning')
  })
  it('flags the limit at 100% while grace remains', () => {
    const s = evaluateUsage(250, 250)
    expect(s.level).toBe('limit')
    expect(s.remaining).toBe(25)
  })
  it('blocks at limit + 10%', () => {
    const s = evaluateUsage(275, 250)
    expect(s.level).toBe('blocked')
    expect(s.remaining).toBe(0)
  })
})

describe('checkIssueAllowance', () => {
  const resets = new Date('2027-03-15T00:00:00Z')

  it('allows issuing inside the grace allowance', () => {
    expect(checkIssueAllowance(260, 15, PLANS.free, resets).allowed).toBe(true)
  })

  it('blocks a batch that would pass the cap and explains how many remain', () => {
    const check = checkIssueAllowance(260, 16, PLANS.free, resets)
    expect(check.allowed).toBe(false)
    expect(check.remaining).toBe(15)
    expect(check.message).toContain('/pricing')
    expect(check.message).toContain('15 more')
    expect(check.message).toContain('March 15, 2027')
  })

  it('blocks when everything is used', () => {
    const check = checkIssueAllowance(275, 1, PLANS.free, resets)
    expect(check.allowed).toBe(false)
    expect(check.message).toContain('Upgrade at /pricing')
  })
})

describe('billable counting rules', () => {
  it('sums unique first issues, renewals and late deletions', () => {
    expect(totalBillable({ uniqueFirstIssues: 10, renewals: 3, deletedAfterRefundWindow: 2 })).toBe(15)
  })

  it('refunds certificates deleted within 7 days of issue', () => {
    const issued = new Date('2026-11-01T00:00:00Z')
    expect(countsAfterDeletion(issued, new Date('2026-11-07T23:00:00Z'))).toBe(false)
    expect(countsAfterDeletion(issued, new Date('2026-11-09T00:00:00Z'))).toBe(true)
    expect(countsAfterDeletion(null)).toBe(false)
  })
})

describe('usage query', () => {
  const usage = read('lib/billing/usage.ts')

  it('excludes previews, drafts and sample certificates', () => {
    expect(usage).toContain('coalesce(${certificates.isPreview}, false) = false')
    expect(usage).toContain("ne(certificates.status, 'unpublished')")
    expect(usage).toContain("ne(certificates.source, 'system')")
  })

  it('de-duplicates recipient + program pairs but counts every renewal', () => {
    expect(usage).toContain('count(distinct (${certificates.learnerId}, ${certificates.courseId}))')
    expect(usage).toContain("${certificates.source} = 'reissue'")
  })

  it('falls back to the Free plan when no plan row exists', () => {
    expect(usage).toContain('resolvePlan(DEFAULT_PLAN)')
  })

  it('ships an additive migration for academy_plans', () => {
    const sqlFile = read('sql/005-academy-plans.sql')
    expect(sqlFile).toContain('CREATE TABLE IF NOT EXISTS academy_plans')
    expect(sqlFile).not.toMatch(/DROP TABLE|DELETE FROM|TRUNCATE/i)
    expect(read('lib/db/schema.ts')).toContain("pgTable('academy_plans'")
  })
})

describe('server-side enforcement in issuing actions', () => {
  it('gates the single issue action', () => {
    const src = read('app/dashboard/certificates/issue/actions.ts')
    expect(src).toContain('checkCanIssue(data.academyId, 1)')
    expect(src.indexOf('checkCanIssue')).toBeLessThan(src.indexOf('.insert(certificates)'))
    expect(src).toContain('publishedAt: new Date()')
  })

  it('gates the wizard before creating the template or certificates', () => {
    const src = read('app/dashboard/wizard/actions.ts')
    const fn = src.slice(src.indexOf('export async function createCertificateFromWizard'))
    expect(fn).toContain('checkCanIssue(academyId, uniqueRecipients)')
    expect(fn.indexOf('checkCanIssue')).toBeLessThan(fn.indexOf('.insert(templates)'))
  })

  it('gates publishing drafts and single published certificates', () => {
    const src = read('lib/import/actions.ts')
    expect(src).toContain('checkCanIssue(academyId, requested)')
    expect(src).toContain('if (data.publish && !data.isPreview)')
  })

  it('surfaces limit errors in the publish UIs', () => {
    expect(read('app/dashboard/certificates/publish-button.tsx')).toContain('result.error')
    expect(read('app/dashboard/certificates/bulk-actions.tsx')).toContain('result.error')
    expect(read('app/dashboard/certificates/[id]/actions-panel.tsx')).toContain('result.error')
    expect(read('app/dashboard/courses/[id]/single/form.tsx')).toContain('result.error')
  })

  it('keeps late deletions billable in both delete paths', () => {
    expect(read('app/dashboard/certificates/actions.ts')).toContain('recordBillableDeletions(user.academyId, certRows)')
    expect(read('app/dashboard/wizard/actions.ts')).toContain('recordBillableDeletions(user.academyId, certRows)')
  })
})

describe('dashboard usage banner', () => {
  const banner = read('components/dashboard/usage-banner.tsx')

  it('shows usage, reset date, warnings and an upgrade link', () => {
    expect(banner).toContain('certificates this year')
    expect(banner).toContain('resets on')
    expect(banner).toContain("status.level === 'warning'")
    expect(banner).toContain("status.level === 'limit'")
    expect(banner).toContain("status.level === 'blocked'")
    expect(banner).toContain('UPGRADE_URL')
  })

  it('is rendered in the dashboard layout', () => {
    expect(read('app/dashboard/layout.tsx')).toContain('<UsageBanner academyId={user.academyId} />')
  })
})
