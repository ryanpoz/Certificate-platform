/**
 * Entitlement additions: scheduled downgrades and the volume rule, seat and
 * brand limits (view-only seats), top-ups, the downgrade preview, the
 * custom-domain redirect, and safe fallbacks before sql/006 is run.
 */
import { readFileSync } from 'fs'
import { join } from 'path'
import { getTableName, is, Table } from 'drizzle-orm'

const ACCOUNT = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
const U1 = '11111111-1111-4111-8111-111111111111'
const U2 = '22222222-2222-4222-8222-222222222222'
const U3 = '33333333-3333-4333-8333-333333333333'

type Call = { op: string; table: string; fields: string[]; values?: any }
const mockDb: { calls: Call[]; rows: (call: Call) => any[] } = { calls: [], rows: () => [] }

function mockChain(call: Call): any {
  const chain: any = new Proxy(
    {},
    {
      get(_t, prop) {
        if (prop === 'then') {
          return (resolve: any, reject: any) => {
            try {
              return Promise.resolve(mockDb.rows(call)).then(resolve, reject)
            } catch (e) {
              return Promise.reject(e).then(resolve, reject)
            }
          }
        }
        if (prop === 'from') {
          return (t: any) => {
            call.table = is(t, Table) ? getTableName(t) : ''
            return chain
          }
        }
        if (prop === 'values') {
          return (v: any) => {
            call.values = v
            return chain
          }
        }
        return () => chain
      },
    }
  )
  return chain
}

jest.mock('@/lib/db', () => {
  const { getTableName: name, is: isA, Table: T } = jest.requireActual('drizzle-orm')
  const start = (op: string) => (arg?: any) => {
    const call: Call = { op, table: '', fields: [] }
    if (op === 'select' && arg) call.fields = Object.keys(arg)
    if ((op === 'insert' || op === 'update') && arg && isA(arg, T)) call.table = name(arg)
    mockDb.calls.push(call)
    return mockChain(call)
  }
  return { db: { select: start('select'), update: start('update'), insert: start('insert'), delete: start('delete') } }
})

const mockSession: { user: any } = { user: null }
jest.mock('@/lib/utils/session', () => ({
  getCurrentUser: jest.fn(async () => mockSession.user),
  requireAuth: jest.fn(async () => mockSession.user),
}))
jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }))
jest.mock('nanoid', () => ({ nanoid: () => 'ABCDEFGH', customAlphabet: () => () => 'ABCD' }))

import {
  decidePlanChange,
  nextMonthlyBoundary,
  previewDowngrade,
  resolveEffectivePlan,
  seatAccess,
  topUpAllowance,
  viewOnlyUsers,
} from '@/lib/billing/downgrade'
import { getLimit } from '@/lib/billing/entitlements'
import { checkIssueAllowance, evaluateUsage, PLANS } from '@/lib/billing/plans'
import { customDomainRedirect, domainAllowedFor, clearCustomDomainCache, isPlatformHost } from '@/lib/billing/custom-domain'
import { getAccountPlanState, getTopUps, getAcademyPlan } from '@/lib/billing/usage'
import { getSeatAccess } from '@/lib/billing/seats'
import { accountFor, requireAccountFor, getWritableAccount, VIEW_ONLY } from '@/lib/auth/ownership'
import { recordTopUp, requestPlanChange, billingPeriodEndFor, NOT_MIGRATED, TOP_UP_SIZE } from '@/lib/billing/plan-changes'

const root = join(__dirname, '..')
const src = (p: string) => readFileSync(join(root, p), 'utf8')

const NOW = new Date('2026-06-10T12:00:00Z')
const PERIOD_END = new Date('2026-07-01T00:00:00Z')
const YEAR_END = new Date('2027-01-01T00:00:00Z')
const SIGNUP = new Date('2026-01-01T00:00:00Z')

beforeEach(() => {
  mockDb.calls = []
  mockDb.rows = () => []
  mockSession.user = null
  clearCustomDomainCache()
})

// ---------------------------------------------------------------------------
describe('delayed-downgrade rule (decidePlanChange)', () => {
  const base = { billingPeriodEnd: PERIOD_END, now: NOW }

  it('upgrades apply immediately', () => {
    const d = decidePlanChange({ ...base, from: 'starter', to: 'growth', certificatesThisYear: 5000 })
    expect(d.action).toBe('apply_now')
    expect(d.effectiveAt).toEqual(NOW)
  })

  it('downgrades are scheduled for the end of the billing period, not applied now', () => {
    const d = decidePlanChange({ ...base, from: 'growth', to: 'starter', certificatesThisYear: 400 })
    expect(d.action).toBe('schedule')
    expect(d.effectiveAt).toEqual(PERIOD_END)
  })

  it('refuses a paid plan whose yearly limit is below what was issued this plan year', () => {
    const d = decidePlanChange({ ...base, from: 'growth', to: 'starter', certificatesThisYear: 1001 })
    expect(d.action).toBe('refuse')
    expect(d.reason).toBeTruthy()
    expect(decidePlanChange({ ...base, from: 'business', to: 'growth', certificatesThisYear: 5001 }).action).toBe('refuse')
  })

  it('allows a paid plan whose limit exactly equals usage', () => {
    expect(decidePlanChange({ ...base, from: 'growth', to: 'starter', certificatesThisYear: 1000 }).action).toBe('schedule')
  })

  it('cancelling to Free is always allowed (scheduled), even far over the Free limit', () => {
    const d = decidePlanChange({ ...base, from: 'growth', to: 'free', certificatesThisYear: 6000 })
    expect(d.action).toBe('schedule')
    expect(d.effectiveAt).toEqual(PERIOD_END)
  })

  it('asking for the current plan cancels a pending change', () => {
    expect(decidePlanChange({ ...base, from: 'growth', to: 'growth', certificatesThisYear: 0 }).action).toBe('cancel_pending')
  })
})

describe('resolveEffectivePlan (scheduled changes applied on read)', () => {
  it('keeps the current plan until the scheduled date', () => {
    const r = resolveEffectivePlan({ plan: 'growth', pendingPlan: 'starter', pendingPlanAt: PERIOD_END }, NOW, 100)
    expect(r.plan).toBe('growth')
    expect(r.pending).toEqual({ plan: 'starter', at: PERIOD_END })
    expect(r.postponed).toBe(false)
  })

  it('applies a due change', () => {
    const r = resolveEffectivePlan({ plan: 'growth', pendingPlan: 'starter', pendingPlanAt: NOW }, NOW, 100)
    expect(r).toEqual({ plan: 'starter', pending: null, postponed: false })
  })

  it('postpones a due change to a paid plan while usage is above its limit (until the year resets)', () => {
    const r = resolveEffectivePlan({ plan: 'growth', pendingPlan: 'starter', pendingPlanAt: NOW }, NOW, 1500)
    expect(r.plan).toBe('growth')
    expect(r.postponed).toBe(true)
  })

  it('never holds back a cancellation to Free', () => {
    const r = resolveEffectivePlan({ plan: 'business', pendingPlan: 'free', pendingPlanAt: NOW }, NOW, 9000)
    expect(r.plan).toBe('free')
  })

  it('ignores an unknown pending plan or a missing date', () => {
    expect(resolveEffectivePlan({ plan: 'growth', pendingPlan: 'platinum' as any, pendingPlanAt: NOW }, NOW).plan).toBe('growth')
    expect(resolveEffectivePlan({ plan: 'growth', pendingPlan: 'starter', pendingPlanAt: null }, NOW).plan).toBe('growth')
  })
})

describe('billing period end default', () => {
  it('is the next monthly anniversary of signup', () => {
    expect(nextMonthlyBoundary(new Date('2026-01-15T00:00:00Z'), new Date('2026-06-10T00:00:00Z'))).toEqual(new Date('2026-06-15T00:00:00Z'))
    expect(nextMonthlyBoundary(new Date('2026-01-05T00:00:00Z'), new Date('2026-06-10T00:00:00Z'))).toEqual(new Date('2026-07-05T00:00:00Z'))
  })
  it('clamps the 31st to the last day of shorter months', () => {
    expect(nextMonthlyBoundary(new Date('2026-01-31T00:00:00Z'), new Date('2026-02-10T00:00:00Z'))).toEqual(new Date('2026-02-28T00:00:00Z'))
  })
  it('moves to the next month when now is exactly on the boundary', () => {
    expect(nextMonthlyBoundary(new Date('2026-01-10T12:00:00Z'), NOW)).toEqual(new Date('2026-07-10T12:00:00Z'))
  })
  it('uses a stored period end when it is in the future', () => {
    expect(billingPeriodEndFor(PERIOD_END, SIGNUP, NOW)).toEqual(PERIOD_END)
    expect(billingPeriodEndFor(new Date('2026-01-01T00:00:00Z'), SIGNUP, NOW)).toEqual(new Date('2026-07-01T00:00:00Z'))
    expect(billingPeriodEndFor(null, SIGNUP, NOW)).toEqual(new Date('2026-07-01T00:00:00Z'))
  })
})

// ---------------------------------------------------------------------------
describe('seat and brand limits', () => {
  it('Business has a floor of 5 seats and 1 brand; contract values can only raise it', () => {
    expect(getLimit('business', 'adminSeats')).toBe(5)
    expect(getLimit('business', 'brands')).toBe(1)
    expect(getLimit({ plan: 'business', overrides: { adminSeats: 12, brands: 3 } }, 'adminSeats')).toBe(12)
    expect(getLimit({ plan: 'business', overrides: { adminSeats: 12, brands: 3 } }, 'brands')).toBe(3)
    expect(getLimit({ plan: 'business', overrides: { adminSeats: 2, brands: 0 } }, 'adminSeats')).toBe(5)
    expect(getLimit({ plan: 'business', overrides: { adminSeats: 2, brands: 0 } }, 'brands')).toBe(1)
  })

  it('stored seat/brand counts are ignored below Business', () => {
    expect(getLimit({ plan: 'starter', overrides: { adminSeats: 12 } }, 'adminSeats')).toBe(2)
    expect(getLimit({ plan: 'free', overrides: { brands: 3 } }, 'brands')).toBe(1)
  })

  it('extra admins become view-only (oldest keep admin), nobody is removed', () => {
    const ids = [U1, U2, U3]
    expect(seatAccess(ids, U1, 1)).toBe('admin')
    expect(seatAccess(ids, U2, 1)).toBe('view_only')
    expect(seatAccess(ids, U2, 2)).toBe('admin')
    expect(seatAccess(ids, U3, 2)).toBe('view_only')
    expect(viewOnlyUsers(ids, 1)).toEqual([U2, U3])
    expect(viewOnlyUsers(ids, 5)).toEqual([])
    expect(ids).toHaveLength(3)
  })

  it('always keeps at least one admin, and unknown users default to admin', () => {
    expect(seatAccess([U1, U2], U1, 0)).toBe('admin')
    expect(seatAccess([U1], 'someone-else', 1)).toBe('admin')
  })
})

// ---------------------------------------------------------------------------
describe('top-ups', () => {
  it('add to the yearly allowance (grace applies to the plan limit only)', () => {
    const s = evaluateUsage(1100, 1000, 500)
    expect(s.limit).toBe(1500)
    expect(s.level).not.toBe('blocked')
    expect(evaluateUsage(1600, 1000, 500).level).toBe('blocked')
    expect(evaluateUsage(1599, 1000, 500).level).not.toBe('blocked')
  })

  it('let an issue go through that the plan alone would block', () => {
    expect(checkIssueAllowance(1100, 50, PLANS.starter, YEAR_END).allowed).toBe(false)
    const ok = checkIssueAllowance(1100, 50, PLANS.starter, YEAR_END, 500)
    expect(ok.allowed).toBe(true)
    expect(checkIssueAllowance(1600, 1, PLANS.starter, YEAR_END, 500).message).toMatch(/and 500 top-up certificates/)
  })

  it('expire at the plan-year reset (only top-ups bought this plan year count)', () => {
    const a = topUpAllowance(
      'starter',
      0,
      [
        { certificates: 500, purchasedAt: new Date('2025-12-20T00:00:00Z') },
        { certificates: 500, purchasedAt: new Date('2026-03-01T00:00:00Z') },
        { certificates: 1000, purchasedAt: new Date('2027-01-02T00:00:00Z') },
      ],
      SIGNUP,
      YEAR_END
    )
    expect(a.topUps).toBe(500)
    expect(a.limit).toBe(1500)
  })

  it('survive a plan change (same top-ups on any plan)', () => {
    const t = [{ certificates: 500, purchasedAt: new Date('2026-03-01T00:00:00Z') }]
    expect(topUpAllowance('growth', 0, t, SIGNUP, YEAR_END).topUps).toBe(500)
    expect(topUpAllowance('free', 0, t, SIGNUP, YEAR_END).topUps).toBe(500)
  })

  it('getTopUps returns none when the table is not there yet', async () => {
    mockDb.rows = (c) => {
      if (c.table === 'academy_top_ups') throw new Error('relation "academy_top_ups" does not exist')
      return []
    }
    await expect(getTopUps(ACCOUNT)).resolves.toEqual([])
  })

  it('recordTopUp only accepts packs of 500 and reports when sql/006 is missing', async () => {
    expect(TOP_UP_SIZE).toBe(500)
    expect((await recordTopUp(ACCOUNT, 250)).ok).toBe(false)
    expect((await recordTopUp(ACCOUNT, 0)).ok).toBe(false)
    expect((await recordTopUp(ACCOUNT, -500)).ok).toBe(false)
    expect(mockDb.calls).toHaveLength(0)

    const ok = await recordTopUp(ACCOUNT, 1000, 'manual')
    expect(ok.ok).toBe(true)
    const insert = mockDb.calls.find((c) => c.op === 'insert')!
    expect(insert.table).toBe('academy_top_ups')
    expect(insert.values).toMatchObject({ academyId: ACCOUNT, certificates: 1000, source: 'manual' })

    mockDb.rows = (c) => {
      if (c.op === 'insert') throw new Error('relation does not exist')
      return []
    }
    expect(await recordTopUp(ACCOUNT, 500)).toEqual({ ok: false, error: NOT_MIGRATED })
  })

  it('the UI still says top-ups are Coming soon (no billing yet)', () => {
    const pricing = src('app/(marketing)/pricing/page.tsx')
    expect(pricing).toMatch(/top-up/i)
    expect(pricing).toMatch(/Coming soon/)
  })
})

// ---------------------------------------------------------------------------
describe('downgrade preview', () => {
  const use = { certificatesThisYear: 300, adminSeats: 8, brands: 3, customDomainActive: true }
  const preview = previewDowngrade({ plan: 'business', overrides: { adminSeats: 8, brands: 3 } }, 'free', use, PERIOD_END, YEAR_END, NOW)
  const effect = (key: string) => preview.losses.find((l) => l.key === key)?.effect ?? ''

  it('is a scheduled downgrade effective at the end of the billing period', () => {
    expect(preview.isDowngrade).toBe(true)
    expect(preview.allowed).toBe(true)
    expect(preview.effectiveAt).toEqual(PERIOD_END)
  })

  it('custom-domain links 301 to our domain', () => {
    expect(effect('customDomain')).toMatch(/301/)
    expect(effect('customDomain')).toMatch(/our domain/)
  })
  it('the /acme page address keeps resolving', () => {
    expect(effect('pageAddress')).toMatch(/\/acme/)
    expect(effect('pageAddress')).toMatch(/keeps resolving/)
  })
  it('API keys are kept', () => expect(effect('issueApi')).toMatch(/API keys are kept/))
  it('analytics are still collected but hidden', () => {
    expect(effect('shareAnalytics')).toMatch(/still collected/)
    expect(effect('shareAnalytics')).toMatch(/hidden/)
  })
  it('the audit log is kept but hidden', () => {
    expect(effect('auditLog')).toMatch(/kept/)
    expect(effect('auditLog')).toMatch(/hidden/)
  })
  it('the issuer CTA falls back to "Create your first certificate", saved values kept', () => {
    expect(effect('customCta')).toMatch(/Create your first certificate/)
    expect(effect('customCta')).toMatch(/saved button label and link are kept/)
  })
  it('branded email and expiry are lost below Starter', () => {
    expect(effect('brandedEmail')).toBeTruthy()
    expect(effect('expiry')).toBeTruthy()
    const toStarter = previewDowngrade('growth', 'starter', { certificatesThisYear: 0 }, PERIOD_END, YEAR_END, NOW)
    expect(toStarter.losses.map((l) => l.key)).not.toContain('brandedEmail')
    expect(toStarter.losses.map((l) => l.key)).not.toContain('expiry')
  })
  it('extra admins become view-only and extra brands switch off, nothing removed', () => {
    expect(effect('adminSeats')).toMatch(/7 admins become view-only \(not removed\)/)
    expect(effect('brands')).toMatch(/2 extra brands switch off/)
  })
  it('always keeps issued certificates live and revoking available', () => {
    expect(preview.keeps.join(' ')).toMatch(/stays live/)
    expect(preview.keeps.join(' ')).toMatch(/revoke/)
  })
  it('includes the volume block when issued > the new limit (Free)', () => {
    expect(effect('volume')).toMatch(/new issuing is blocked until your plan year resets on 2027-01-01/)
  })
  it('no volume line when usage fits', () => {
    const p = previewDowngrade('growth', 'starter', { certificatesThisYear: 200 }, PERIOD_END, YEAR_END, NOW)
    expect(p.losses.find((l) => l.key === 'volume')).toBeUndefined()
  })
  it('refuses a paid target below this year’s usage', () => {
    const p = previewDowngrade('growth', 'starter', { certificatesThisYear: 1200 }, PERIOD_END, YEAR_END, NOW)
    expect(p.allowed).toBe(false)
    expect(p.blockedReason).toBeTruthy()
    expect(p.losses.find((l) => l.key === 'volume')?.effect).toBe(p.blockedReason)
  })
  it('an upgrade loses nothing and takes effect now', () => {
    const p = previewDowngrade('starter', 'growth', { certificatesThisYear: 0 }, PERIOD_END, YEAR_END, NOW)
    expect(p.isDowngrade).toBe(false)
    expect(p.losses).toEqual([])
    expect(p.effectiveAt).toEqual(NOW)
  })
})

// ---------------------------------------------------------------------------
describe('custom-domain redirect', () => {
  const primaryUrl = 'https://credentially.example'

  it('never redirects our own hosts', () => {
    for (const host of ['credentially.example', 'localhost:3000', '127.0.0.1', 'certificate-platform-eta.vercel.app', '']) {
      expect(isPlatformHost(host, primaryUrl)).toBe(true)
      expect(customDomainRedirect({ host, pathAndQuery: '/c/1', domainAllowed: false, primaryUrl })).toBeNull()
    }
  })

  it('serves normally while the plan includes custom domains, or when the host is unknown', () => {
    expect(customDomainRedirect({ host: 'certs.acme.org', pathAndQuery: '/c/1', domainAllowed: true, primaryUrl })).toBeNull()
    expect(customDomainRedirect({ host: 'certs.acme.org', pathAndQuery: '/c/1', domainAllowed: null, primaryUrl })).toBeNull()
  })

  it('redirects to the same path and query on our domain when the plan no longer includes it', () => {
    expect(customDomainRedirect({ host: 'Certs.Acme.org:443', pathAndQuery: '/c/ABC123?ref=li', domainAllowed: false, primaryUrl })).toBe(
      'https://credentially.example/c/ABC123?ref=li'
    )
    expect(customDomainRedirect({ host: 'certs.acme.org', pathAndQuery: '/', domainAllowed: false, primaryUrl: primaryUrl + '/' })).toBe(
      'https://credentially.example/'
    )
  })

  it('looks up the owning account’s plan', async () => {
    mockDb.rows = (c) => (c.table === 'academy_domains' ? [{ academyId: ACCOUNT }] : [])
    // No plan row: Free, which has no custom domains
    await expect(domainAllowedFor('certs.acme.org')).resolves.toBe(false)
    clearCustomDomainCache()
    mockDb.rows = (c) => {
      if (c.table === 'academy_domains') return [{ academyId: ACCOUNT }]
      if (c.table === 'academy_plans') return [{ plan: 'business', customLimit: null }]
      return []
    }
    await expect(domainAllowedFor('certs.acme.org')).resolves.toBe(true)
  })

  it('passes through (null) when domains cannot be looked up (sql/006 not run)', async () => {
    mockDb.rows = () => {
      throw new Error('relation "academy_domains" does not exist')
    }
    await expect(domainAllowedFor('certs.acme.org')).resolves.toBeNull()
  })

  it('caches lookups briefly', async () => {
    mockDb.rows = (c) => (c.table === 'academy_domains' ? [] : [])
    await domainAllowedFor('a.example', 1000)
    const n = mockDb.calls.length
    await domainAllowedFor('a.example', 2000)
    expect(mockDb.calls.length).toBe(n)
    await domainAllowedFor('a.example', 1000 + 61_000)
    expect(mockDb.calls.length).toBeGreaterThan(n)
  })

  it('proxy.ts issues a permanent (301) redirect and skips static assets', () => {
    const proxy = src('proxy.ts')
    expect(proxy).toMatch(/export async function proxy\(/)
    expect(proxy).toMatch(/NextResponse\.redirect\(target, 301\)/)
    expect(proxy).toMatch(/isPlatformHost\(host\)\) return NextResponse\.next\(\)/)
    expect(proxy).toMatch(/_next\/static\|_next\/image\|favicon\.ico/)
  })
})

// ---------------------------------------------------------------------------
describe('plan state fallbacks (sql/005 and sql/006 not run)', () => {
  it('is Free when academy_plans does not exist', async () => {
    mockDb.rows = (c) => {
      if (c.table === 'academy_plans') throw new Error('relation "academy_plans" does not exist')
      return []
    }
    const state = await getAccountPlanState(ACCOUNT, NOW)
    expect(state.plan.id).toBe('free')
    expect(state.pending).toBeNull()
    expect((await getAcademyPlan(ACCOUNT)).id).toBe('free')
  })

  it('reads the sql/005 columns when the sql/006 columns are missing', async () => {
    mockDb.rows = (c) => {
      if (c.table === 'academy_plans' && c.fields.includes('pendingPlan')) throw new Error('column "pending_plan" does not exist')
      if (c.table === 'academy_plans') return [{ plan: 'growth', customLimit: null }]
      return []
    }
    const state = await getAccountPlanState(ACCOUNT, NOW)
    expect(state.plan.id).toBe('growth')
    expect(state.overrides.adminSeats).toBeNull()
  })

  it('applies a due scheduled downgrade on read', async () => {
    mockDb.rows = (c) => {
      if (c.table === 'academy_plans') return [{ plan: 'growth', customLimit: null, pendingPlan: 'free', pendingPlanAt: new Date('2026-06-01T00:00:00Z') }]
      return []
    }
    const state = await getAccountPlanState(ACCOUNT, NOW)
    expect(state.plan.id).toBe('free')
    expect(state.storedPlan).toBe('growth')
  })

  it('keeps the current plan while a scheduled downgrade is not yet due', async () => {
    mockDb.rows = (c) => {
      if (c.table === 'academy_plans') return [{ plan: 'growth', customLimit: null, pendingPlan: 'starter', pendingPlanAt: PERIOD_END }]
      return []
    }
    const state = await getAccountPlanState(ACCOUNT, NOW)
    expect(state.plan.id).toBe('growth')
    expect(state.pending).toEqual({ plan: 'starter', at: PERIOD_END })
  })

  it('carries stored Business seat and brand counts', async () => {
    mockDb.rows = (c) => {
      if (c.table === 'academy_plans') return [{ plan: 'business', customLimit: 20000, seatLimit: 12, brandLimit: 3 }]
      return []
    }
    const state = await getAccountPlanState(ACCOUNT, NOW)
    expect(getLimit({ plan: state.plan, overrides: state.overrides }, 'adminSeats')).toBe(12)
    expect(getLimit({ plan: state.plan, overrides: state.overrides }, 'brands')).toBe(3)
    expect(getLimit({ plan: state.plan, overrides: state.overrides }, 'certificatesPerYear')).toBe(20000)
  })
})

// ---------------------------------------------------------------------------
describe('requestPlanChange', () => {
  const rows = (plan: string, used = 0, failWrites = false) => (c: Call) => {
    if ((c.op === 'insert' || c.op === 'update') && failWrites) throw new Error('column does not exist')
    if (c.table === 'academies') return [{ createdAt: SIGNUP }]
    if (c.table === 'academy_plans') return [{ plan, customLimit: null }]
    if (c.table === 'certificates') return [{ uniqueFirstIssues: used, renewals: 0 }]
    return []
  }

  it('applies an upgrade now', async () => {
    mockDb.rows = rows('starter')
    const r = await requestPlanChange(ACCOUNT, 'growth', NOW)
    expect(r.ok).toBe(true)
    expect(r.decision?.action).toBe('apply_now')
    const insert = mockDb.calls.find((c) => c.op === 'insert')!
    expect(insert.table).toBe('academy_plans')
    expect(insert.values).toMatchObject({ academyId: ACCOUNT, plan: 'growth', pendingPlan: null })
  })

  it('schedules a downgrade for the billing period end and keeps the current plan', async () => {
    mockDb.rows = rows('growth', 100)
    const r = await requestPlanChange(ACCOUNT, 'starter', NOW)
    expect(r.decision?.action).toBe('schedule')
    expect(r.decision?.effectiveAt).toEqual(new Date('2026-07-01T00:00:00Z'))
    const insert = mockDb.calls.find((c) => c.op === 'insert')!
    expect(insert.values).toMatchObject({ plan: 'growth', pendingPlan: 'starter' })
  })

  it('refuses a paid plan below this year’s usage and writes nothing', async () => {
    mockDb.rows = rows('growth', 1500)
    const r = await requestPlanChange(ACCOUNT, 'starter', NOW)
    expect(r.ok).toBe(false)
    expect(r.decision?.action).toBe('refuse')
    expect(mockDb.calls.some((c) => c.op === 'insert' || c.op === 'update')).toBe(false)
  })

  it('allows cancelling to Free even when over the Free limit', async () => {
    mockDb.rows = rows('growth', 4000)
    const r = await requestPlanChange(ACCOUNT, 'free', NOW)
    expect(r.ok).toBe(true)
    expect(r.decision?.action).toBe('schedule')
  })

  it('reports when sql/006 has not been run', async () => {
    mockDb.rows = rows('growth', 100, true)
    expect((await requestPlanChange(ACCOUNT, 'starter', NOW)).error).toBe(NOT_MIGRATED)
  })

  it('is not callable from the browser (not a server action file)', () => {
    const file = src('lib/billing/plan-changes.ts')
    expect(file).not.toMatch(/^\s*['"]use server['"]/m)
    for (const p of ['app', 'components']) {
      const { execSync } = require('child_process')
      const hits = execSync(`grep -rl "plan-changes" ${join(root, p)} || true`).toString().trim()
      expect(hits).toBe('')
    }
  })
})

// ---------------------------------------------------------------------------
describe('view-only seats', () => {
  const seatRows = (plan: string) => (c: Call) => {
    if (c.table === 'users') return [{ id: U1 }, { id: U2 }, { id: U3 }]
    if (c.table === 'academy_plans') return [{ plan, customLimit: null }]
    return []
  }

  it('Free has 1 admin seat: the oldest user is admin, the others view-only', async () => {
    mockDb.rows = seatRows('free')
    expect(await getSeatAccess(U1, ACCOUNT)).toBe('admin')
    expect(await getSeatAccess(U2, ACCOUNT)).toBe('view_only')
  })

  it('upgrading restores access automatically', async () => {
    mockDb.rows = seatRows('growth')
    expect(await getSeatAccess(U3, ACCOUNT)).toBe('admin')
  })

  it('defaults to admin when seats cannot be read', async () => {
    mockDb.rows = () => {
      throw new Error('db down')
    }
    expect(await getSeatAccess(U2, ACCOUNT)).toBe('admin')
  })

  it('a view-only user can read and export but not write', async () => {
    mockDb.rows = seatRows('free')
    mockSession.user = { id: U2, academyId: ACCOUNT }
    expect(await accountFor(ACCOUNT)).toBeNull()
    expect(await getWritableAccount()).toBeNull()
    expect(await accountFor(ACCOUNT, { read: true })).toEqual({ userId: U2, academyId: ACCOUNT })
    await expect(requireAccountFor(ACCOUNT)).rejects.toThrow(VIEW_ONLY)
    await expect(requireAccountFor(ACCOUNT, { read: true })).resolves.toEqual({ userId: U2, academyId: ACCOUNT })
  })

  it('an admin seat can write', async () => {
    mockDb.rows = seatRows('free')
    mockSession.user = { id: U1, academyId: ACCOUNT }
    expect(await accountFor(ACCOUNT)).toEqual({ userId: U1, academyId: ACCOUNT })
  })

  it('write actions check the seat; read/export actions do not', () => {
    const certs = src('app/dashboard/certificates/actions.ts')
    expect(certs).toMatch(/exportCertificatesToCSVFiltered[\s\S]{0,200}requireAccountFor\(academyId, \{ read: true \}\)/)
    expect(certs).toMatch(/exportCertificatesToCSV\(certificateIds[\s\S]{0,200}requireAccountFor\(undefined, \{ read: true \}\)/)
    expect(certs).toMatch(/deleteCertificateProgram[\s\S]{0,400}isViewOnly\(user\.id, user\.academyId\)/)
    expect(src('app/dashboard/certificates/issue/actions.ts')).toMatch(/isViewOnly\(user\.id, user\.academyId\)/)
    const wizard = src('app/dashboard/wizard/actions.ts')
    expect(wizard.match(/isViewOnly\(user\.id, user\.academyId\)/g)?.length).toBeGreaterThanOrEqual(2)
    for (const f of [
      'app/dashboard/courses/actions.ts',
      'app/dashboard/templates/actions.ts',
      'app/dashboard/templates/[id]/actions.ts',
      'app/dashboard/templates/[id]/editor/actions.ts',
      'lib/import/actions.ts',
    ]) {
      expect(src(f)).toMatch(/getWritableAccount\(\)/)
    }
  })

  it('the dashboard shows a view-only notice', () => {
    const layout = src('app/dashboard/layout.tsx')
    expect(layout).toMatch(/getSeatAccess\(user\.id, user\.academyId\)\) === 'view_only'/)
    expect(layout).toMatch(/view-only/)
  })
})

// ---------------------------------------------------------------------------
describe('what never changes on a downgrade', () => {
  const certs = src('app/dashboard/certificates/actions.ts')
  const body = (name: string) => {
    const start = certs.indexOf(`export async function ${name}(`)
    const next = certs.indexOf('export async function', start + 10)
    return certs.slice(start, next === -1 ? undefined : next)
  }

  it('revoking never checks the plan or usage', () => {
    for (const fn of ['revokeCertificates', 'revokeCertificatesFiltered', 'revokeSingleCertificate']) {
      const b = body(fn)
      expect(b.length).toBeGreaterThan(0)
      expect(b).not.toMatch(/getAcademyPlan|checkCanIssue|accountCan|getAccountEntitlements/)
    }
  })

  it('certificate pages stay live: the only plan check is the CTA', () => {
    const page = src('app/c/[number]/page.tsx')
    expect(page.match(/getAcademyPlan\(/g)).toHaveLength(1)
    expect(page).toMatch(/can\(await getAcademyPlan\(academy\.id\), 'customCta'\)/)
  })
})

describe('sql/006', () => {
  const sql = src('sql/006-entitlement-state.sql')
  // Statements only (comments stripped); ON DELETE CASCADE is a foreign-key rule, not a delete
  const statements = sql.replace(/--[^\n]*/g, '').replace(/ON DELETE CASCADE/g, '')
  it('is additive and re-runnable', () => {
    expect(statements).not.toMatch(/\b(DROP|DELETE|TRUNCATE|UPDATE)\b/i)
    expect(sql).not.toMatch(/ALTER TABLE \w+ ALTER COLUMN/i)
    for (const stmt of sql.match(/CREATE TABLE[^\n]*/g) ?? []) expect(stmt).toMatch(/IF NOT EXISTS/)
    for (const stmt of sql.match(/ADD COLUMN[^\n]*/g) ?? []) expect(stmt).toMatch(/IF NOT EXISTS/)
  })
  it('stores seat/brand counts, scheduled changes, top-ups and custom domains', () => {
    for (const s of ['seat_limit', 'brand_limit', 'pending_plan', 'pending_plan_at', 'billing_period_end', 'academy_top_ups', 'academy_domains']) {
      expect(sql).toContain(s)
    }
  })
  it('enables row level security on new tables', () => {
    expect(sql).toMatch(/ALTER TABLE academy_top_ups ENABLE ROW LEVEL SECURITY/)
    expect(sql).toMatch(/ALTER TABLE academy_domains ENABLE ROW LEVEL SECURITY/)
  })
})
