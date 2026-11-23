import { db } from '@/lib/db'
import { academies, academyPlans, certificates, events } from '@/lib/db/schema'
import { and, eq, gte, lt, ne, sql } from 'drizzle-orm'
import {
  DEFAULT_PLAN,
  checkIssueAllowance,
  countsAfterDeletion,
  evaluateUsage,
  getPlanYear,
  resolvePlan,
  totalBillable,
  type BillableCounts,
  type IssueCheck,
  type PlanDefinition,
  type UsageStatus,
} from './plans'

export const BILLABLE_DELETED_EVENT = 'billable_certificate_deleted'

export interface AcademyUsage {
  plan: PlanDefinition
  periodStart: Date
  periodEnd: Date
  counts: BillableCounts
  status: UsageStatus
}

/** Plan for an account. Falls back to Free if no row (or the table is not migrated yet). */
export async function getAcademyPlan(academyId: string): Promise<PlanDefinition> {
  try {
    const [row] = await db
      .select({ plan: academyPlans.plan, customLimit: academyPlans.customLimit })
      .from(academyPlans)
      .where(eq(academyPlans.academyId, academyId))
      .limit(1)
    return resolvePlan(row?.plan ?? DEFAULT_PLAN, row?.customLimit)
  } catch {
    // academy_plans not migrated yet: everyone is on Free
    return resolvePlan(DEFAULT_PLAN)
  }
}

/** Issued (billable) certificates in the account's current plan year */
export async function getAcademyUsage(academyId: string, now: Date = new Date()): Promise<AcademyUsage | null> {
  const [academy] = await db
    .select({ createdAt: academies.createdAt })
    .from(academies)
    .where(eq(academies.id, academyId))
    .limit(1)
  if (!academy) return null

  const plan = await getAcademyPlan(academyId)
  const { start, end } = getPlanYear(academy.createdAt, now)
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

  const counts: BillableCounts = {
    uniqueFirstIssues: Number(certCounts?.uniqueFirstIssues ?? 0),
    renewals: Number(certCounts?.renewals ?? 0),
    deletedAfterRefundWindow: Number(deleted?.count ?? 0),
  }

  return {
    plan,
    periodStart: start,
    periodEnd: end,
    counts,
    status: evaluateUsage(totalBillable(counts), plan.yearlyLimit),
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
    return checkIssueAllowance(usage.status.used, requested, usage.plan, usage.periodEnd)
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
