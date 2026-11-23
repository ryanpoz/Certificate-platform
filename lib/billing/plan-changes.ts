/**
 * Plan changes, top-ups and downgrade previews (server-side only).
 *
 * NOT a server action file: nothing here may be callable from the browser,
 * because there is no billing yet and an upgrade would otherwise be free.
 * Billing (later) calls these after payment succeeds; until then they're for
 * manual/ops use. Every write needs sql/005 + sql/006; without them the
 * functions return an error and the app keeps running on Free.
 */
import { db } from '@/lib/db'
import { academies, academyPlans, academyTopUps, users } from '@/lib/db/schema'
import { eq, sql } from 'drizzle-orm'
import { getPlanYear, isPlanId, type PlanId } from './plans'
import {
  decidePlanChange,
  nextMonthlyBoundary,
  previewDowngrade,
  type DowngradePreview,
  type PlanChangeDecision,
} from './downgrade'
import { countBillableThisYear, getAccountPlanState } from './usage'
import { academyHasActiveCustomDomain } from './custom-domain'

export const TOP_UP_SIZE = 500
export const NOT_MIGRATED = 'Plan storage is not set up yet: run sql/005-academy-plans.sql and sql/006-entitlement-state.sql.'

/** End of the paid billing period: stored by billing, else the next monthly signup anniversary */
export function billingPeriodEndFor(stored: Date | null, signup: Date, now: Date = new Date()): Date {
  if (stored && stored.getTime() > now.getTime()) return stored
  return nextMonthlyBoundary(signup, now)
}

async function signupDate(academyId: string): Promise<Date | null> {
  const [row] = await db.select({ createdAt: academies.createdAt }).from(academies).where(eq(academies.id, academyId)).limit(1)
  return row?.createdAt ?? null
}

export interface PlanChangeResult {
  ok: boolean
  decision?: PlanChangeDecision
  error?: string
}

/**
 * Ask to move an account to `target`. Upgrades apply now; downgrades and
 * cancellations are scheduled for the end of the billing period; moving to a
 * paid plan whose yearly limit is below this year's usage is refused.
 */
export async function requestPlanChange(academyId: string, target: PlanId, now: Date = new Date()): Promise<PlanChangeResult> {
  if (!isPlanId(target)) return { ok: false, error: 'Unknown plan' }
  const createdAt = await signupDate(academyId)
  if (!createdAt) return { ok: false, error: 'Account not found' }
  const state = await getAccountPlanState(academyId, now)
  const used = await countBillableThisYear(academyId, now)
  const decision = decidePlanChange({
    from: { plan: state.plan, overrides: state.overrides },
    to: target,
    certificatesThisYear: used,
    billingPeriodEnd: billingPeriodEndFor(state.billingPeriodEnd, createdAt, now),
    now,
  })
  if (decision.action === 'refuse') return { ok: false, decision, error: decision.reason }

  const values =
    decision.action === 'apply_now'
      ? { plan: target, pendingPlan: null, pendingPlanAt: null }
      : decision.action === 'schedule'
      ? { pendingPlan: target, pendingPlanAt: decision.effectiveAt }
      : { pendingPlan: null, pendingPlanAt: null }
  try {
    await db
      .insert(academyPlans)
      .values({ academyId, plan: decision.action === 'apply_now' ? target : state.plan.id, ...values, updatedAt: new Date() })
      .onConflictDoUpdate({ target: academyPlans.academyId, set: { ...values, updatedAt: new Date() } })
  } catch {
    return { ok: false, decision, error: NOT_MIGRATED }
  }
  return { ok: true, decision }
}

/** Persist a scheduled change once it is due (reads already treat it as applied). */
export async function applyDuePlanChange(academyId: string, now: Date = new Date()): Promise<boolean> {
  const state = await getAccountPlanState(academyId, now)
  if (state.pending || state.postponed || state.storedPlan === state.plan.id) return false
  try {
    await db
      .update(academyPlans)
      .set({ plan: state.plan.id, pendingPlan: null, pendingPlanAt: null, updatedAt: new Date() })
      .where(eq(academyPlans.academyId, academyId))
    return true
  } catch {
    return false
  }
}

/** Record a top-up (billing calls this after payment). Multiples of 500 only. */
export async function recordTopUp(
  academyId: string,
  certificates: number,
  source: string = 'manual',
  note?: string
): Promise<{ ok: boolean; error?: string }> {
  if (!Number.isInteger(certificates) || certificates <= 0 || certificates % TOP_UP_SIZE !== 0) {
    return { ok: false, error: `Top-ups come in packs of ${TOP_UP_SIZE} certificates` }
  }
  try {
    await db.insert(academyTopUps).values({ academyId, certificates, source, note: note ?? null })
    return { ok: true }
  } catch {
    return { ok: false, error: NOT_MIGRATED }
  }
}

/** What the account would lose by moving to `target` */
export async function getDowngradePreview(academyId: string, target: PlanId, now: Date = new Date()): Promise<DowngradePreview | null> {
  const createdAt = await signupDate(academyId)
  if (!createdAt) return null
  const state = await getAccountPlanState(academyId, now)
  const [seats] = await db
    .select({ count: sql<number>`cast(count(*) as int)` })
    .from(users)
    .where(eq(users.academyId, academyId))
  return previewDowngrade(
    { plan: state.plan, overrides: state.overrides },
    target,
    {
      certificatesThisYear: await countBillableThisYear(academyId, now),
      adminSeats: Number(seats?.count ?? 1),
      // One brand per account until multiple brands ship
      brands: 1,
      customDomainActive: await academyHasActiveCustomDomain(academyId),
    },
    billingPeriodEndFor(state.billingPeriodEnd, createdAt, now),
    getPlanYear(createdAt, now).end,
    now
  )
}
