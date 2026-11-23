import { db } from '@/lib/db'
import { academies, academyPlans, academyTopUps, certificates, events } from '@/lib/db/schema'
import { and, eq, gte, lt, ne, sql } from 'drizzle-orm'
import {
  DEFAULT_PLAN,
  checkIssueAllowance,
  countsAfterDeletion,
  evaluateUsage,
  getPlanYear,
  isPlanId,
  resolvePlan,
  totalBillable,
  type BillableCounts,
  type IssueCheck,
  type PlanDefinition,
  type PlanId,
  type UsageStatus,
} from './plans'
import {
  can,
  entitlementsFor,
  getLimit,
  type Feature,
  type LimitKey,
  type LimitOverrides,
  type PlanEntitlements,
} from './entitlements'
import { resolveEffectivePlan, topUpAllowance, type TopUp } from './downgrade'
import { emailBrandingFor, type EmailBranding } from '@/lib/email/branding'

export const BILLABLE_DELETED_EVENT = 'billable_certificate_deleted'

export interface AcademyUsage {
  plan: PlanDefinition
  periodStart: Date
  periodEnd: Date
  counts: BillableCounts
  /** Top-up certificates bought in this plan year (0 until sql/006 and billing exist) */
  topUps: number
  status: UsageStatus
}

/** The stored plan row, newest columns first; null if the table isn't migrated yet */
async function readPlanRow(academyId: string): Promise<{
  plan: string
  customLimit: number | null
  seatLimit?: number | null
  brandLimit?: number | null
  pendingPlan?: string | null
  pendingPlanAt?: Date | null
  billingPeriodEnd?: Date | null
} | null> {
  try {
    const [row] = await db
      .select({
        plan: academyPlans.plan,
        customLimit: academyPlans.customLimit,
        seatLimit: academyPlans.seatLimit,
        brandLimit: academyPlans.brandLimit,
        pendingPlan: academyPlans.pendingPlan,
        pendingPlanAt: academyPlans.pendingPlanAt,
        billingPeriodEnd: academyPlans.billingPeriodEnd,
      })
      .from(academyPlans)
      .where(eq(academyPlans.academyId, academyId))
      .limit(1)
    return row ?? null
  } catch {
    // sql/006 not run yet: read the sql/005 columns only
  }
  try {
    const [row] = await db
      .select({ plan: academyPlans.plan, customLimit: academyPlans.customLimit })
      .from(academyPlans)
      .where(eq(academyPlans.academyId, academyId))
      .limit(1)
    return row ?? null
  } catch {
    // academy_plans not migrated yet
    return null
  }
}

export interface AccountPlanState {
  /** Plan in force now (scheduled downgrades applied once due) */
  plan: PlanDefinition
  /** Contract values for getLimit (Business only) */
  overrides: LimitOverrides
  /** Plan stored on the account before any due change */
  storedPlan: PlanId
  pending: { plan: PlanId; at: Date } | null
  /** A due downgrade held back because this year's usage is above the target's limit */
  postponed: boolean
  billingPeriodEnd: Date | null
}

const FREE_STATE = (): AccountPlanState => ({
  plan: resolvePlan(DEFAULT_PLAN),
  overrides: {},
  storedPlan: DEFAULT_PLAN,
  pending: null,
  postponed: false,
  billingPeriodEnd: null,
})

/** Plan state for an account. Free with no overrides if nothing can be read. */
export async function getAccountPlanState(academyId: string, now: Date = new Date()): Promise<AccountPlanState> {
  const row = await readPlanRow(academyId)
  if (!row) return FREE_STATE()
  const stored = resolvePlan(row.plan ?? DEFAULT_PLAN, row.customLimit)
  const pendingPlan = isPlanId(row.pendingPlan) ? row.pendingPlan : null
  let used: number | undefined
  if (pendingPlan && pendingPlan !== 'free' && row.pendingPlanAt && row.pendingPlanAt.getTime() <= now.getTime()) {
    try {
      used = await countBillableThisYear(academyId, now)
    } catch {
      used = undefined
    }
  }
  const effective = resolveEffectivePlan(
    { plan: stored.id, pendingPlan, pendingPlanAt: row.pendingPlanAt ?? null },
    now,
    used
  )
  const plan = resolvePlan(effective.plan, row.customLimit)
  return {
    plan,
    overrides: {
      certificatesPerYear: plan.yearlyLimit,
      adminSeats: row.seatLimit ?? null,
      brands: row.brandLimit ?? null,
    },
    storedPlan: stored.id,
    pending: effective.pending,
    postponed: effective.postponed,
    billingPeriodEnd: row.billingPeriodEnd ?? null,
  }
}

/** Plan for an account. Falls back to Free if no row (or the table is not migrated yet). */
export async function getAcademyPlan(academyId: string): Promise<PlanDefinition> {
  try {
    return (await getAccountPlanState(academyId)).plan
  } catch {
    // academy_plans not migrated yet: everyone is on Free
    return resolvePlan(DEFAULT_PLAN)
  }
}

/** Plan + contract overrides, as an account for can()/getLimit() */
export async function getAccountForEntitlements(academyId: string): Promise<{ plan: PlanDefinition; overrides: LimitOverrides }> {
  try {
    const state = await getAccountPlanState(academyId)
    return { plan: state.plan, overrides: state.overrides }
  } catch {
    return { plan: resolvePlan(DEFAULT_PLAN), overrides: {} }
  }
}

async function countBillable(academyId: string, start: Date, end: Date): Promise<BillableCounts> {
  const issuedAt = sql`coalesce(${certificates.publishedAt}, ${certificates.createdAt})`

  const [certCounts] = await db
    .select({
      uniqueFirstIssues: sql<number>`cast(count(distinct (${certificates.learnerId}, ${certificates.courseId})) filter (where ${certificates.priorCertificateId} is null and ${certificates.source} <> 'reissue') as int)`,
      renewals: sql<number>`cast(count(*) filter (where ${certificates.priorCertificateId} is not null or ${certificates.source} = 'reissue') as int)`,
    })
    .from(certificates)
    .where(
      and(
        eq(certificates.academyId, academyId),
        ne(certificates.status, 'unpublished'),
        sql`coalesce(${certificates.isPreview}, false) = false`,
        ne(certificates.source, 'system'),
        sql`${issuedAt} >= ${start}`,
        sql`${issuedAt} < ${end}`
      )
    )

  const [deleted] = await db
    .select({ count: sql<number>`cast(count(*) as int)` })
    .from(events)
    .where(
      and(
        eq(events.academyId, academyId),
        eq(events.type, BILLABLE_DELETED_EVENT),
        gte(events.at, start),
        lt(events.at, end)
      )
    )

  return {
    uniqueFirstIssues: Number(certCounts?.uniqueFirstIssues ?? 0),
    renewals: Number(certCounts?.renewals ?? 0),
    deletedAfterRefundWindow: Number(deleted?.count ?? 0),
  }
}

async function academyCreatedAt(academyId: string): Promise<Date | null> {
  const [academy] = await db
    .select({ createdAt: academies.createdAt })
    .from(academies)
    .where(eq(academies.id, academyId))
    .limit(1)
  return academy?.createdAt ?? null
}

/** Billable certificates issued in the current plan year */
export async function countBillableThisYear(academyId: string, now: Date = new Date()): Promise<number> {
  const createdAt = await academyCreatedAt(academyId)
  if (!createdAt) return 0
  const { start, end } = getPlanYear(createdAt, now)
  return totalBillable(await countBillable(academyId, start, end))
}

/** Top-ups on the account (none if sql/006 isn't run yet) */
export async function getTopUps(academyId: string): Promise<TopUp[]> {
  try {
    const rows = await db
      .select({ certificates: academyTopUps.certificates, purchasedAt: academyTopUps.purchasedAt })
      .from(academyTopUps)
      .where(eq(academyTopUps.academyId, academyId))
    return rows.map((r) => ({ certificates: Number(r.certificates), purchasedAt: r.purchasedAt }))
  } catch {
    return []
  }
}

/** Issued (billable) certificates in the account's current plan year */
export async function getAcademyUsage(academyId: string, now: Date = new Date()): Promise<AcademyUsage | null> {
  const createdAt = await academyCreatedAt(academyId)
  if (!createdAt) return null

  const plan = await getAcademyPlan(academyId)
  const { start, end } = getPlanYear(createdAt, now)
  const counts = await countBillable(academyId, start, end)
  // Top-ups count for the plan year they were bought in, then expire at the reset
  const topUps = topUpAllowance(plan, 0, await getTopUps(academyId), start, end).topUps

  return {
    plan,
    periodStart: start,
    periodEnd: end,
    counts,
    topUps,
    status: evaluateUsage(totalBillable(counts), getLimit(plan, 'certificatesPerYear'), topUps),
  }
}

/**
 * Server-side gate for every issuing action. Fails open (allows) if usage
 * cannot be read, so a metering problem never stops a customer issuing.
 */
export async function checkCanIssue(academyId: string, requested: number): Promise<IssueCheck> {
  if (requested <= 0) return { allowed: true, remaining: 0 }
  try {
    const usage = await getAcademyUsage(academyId)
    if (!usage) return { allowed: true, remaining: 0 }
    return checkIssueAllowance(usage.status.used, requested, usage.plan, usage.periodEnd, usage.topUps)
  } catch (error) {
    console.error('Usage check failed, allowing issue:', error)
    return { allowed: true, remaining: 0 }
  }
}

/**
 * Before certificates are deleted, keep a lean marker for each one issued more
 * than 7 days ago so it still counts toward the plan year it was issued in.
 */
export async function recordBillableDeletions(
  academyId: string,
  rows: Array<{
    status: string
    isPreview: boolean | null
    source: string
    publishedAt: Date | null
    createdAt: Date
  }>,
  deletedAt: Date = new Date()
): Promise<number> {
  const markers = rows
    .filter((r) => r.status !== 'unpublished' && !r.isPreview && r.source !== 'system')
    .map((r) => r.publishedAt ?? r.createdAt)
    .filter((issued) => countsAfterDeletion(issued, deletedAt))
    .map((issued) => ({
      academyId,
      certificateId: null,
      type: BILLABLE_DELETED_EVENT,
      at: issued,
    }))

  if (markers.length === 0) return 0
  try {
    await db.insert(events).values(markers)
  } catch (error) {
    console.error('Failed to record billable deletions:', error)
  }
  return markers.length
}

/** Entitlements (limits + feature flags) for an account; Free if the plan can't be read */
export async function getAccountEntitlements(academyId: string): Promise<PlanEntitlements> {
  return entitlementsFor(await getAccountForEntitlements(academyId))
}

/** Server-side can(account, feature) (defaults to Free if the plan can't be read) */
export async function accountCan(academyId: string, feature: Feature): Promise<boolean> {
  return can(await getAcademyPlan(academyId), feature)
}

/** Email branding for an account (unbranded if the plan can't be read) */
export async function getEmailBranding(academyId: string): Promise<EmailBranding> {
  return emailBrandingFor(await getAcademyPlan(academyId))
}

/** Server-side limit getter for an account (defaults to Free if the plan can't be read) */
export async function accountLimit(academyId: string, limit: LimitKey): Promise<number> {
  return getLimit(await getAccountForEntitlements(academyId), limit)
}

