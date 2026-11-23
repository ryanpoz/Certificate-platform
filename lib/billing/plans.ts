/**
 * Plan limits and usage metering rules (pure functions, no database access).
 *
 * Billable unit: certificates issued per plan year. The plan year starts on the
 * account's signup date and renews on that anniversary. Renewals count; test
 * sends (previews), duplicates and certificates deleted within 7 days do not.
 * Accounts get a 10% grace allowance above their limit before issuing is blocked.
 */

export type PlanId = 'free' | 'starter' | 'growth' | 'business'

export interface PlanDefinition {
  id: PlanId
  name: string
  /** Certificates included per plan year */
  yearlyLimit: number
  /** Business limits are set per contract; yearlyLimit is the floor */
  custom?: boolean
}

export const PLANS: Record<PlanId, PlanDefinition> = {
  free: { id: 'free', name: 'Free', yearlyLimit: 250 },
  starter: { id: 'starter', name: 'Starter', yearlyLimit: 1000 },
  growth: { id: 'growth', name: 'Growth', yearlyLimit: 5000 },
  business: { id: 'business', name: 'Business', yearlyLimit: 10000, custom: true },
}

export const DEFAULT_PLAN: PlanId = 'free'

/** Grace allowance above the plan limit before issuing is blocked */
export const GRACE_RATE = 0.1

/** Deleting a certificate within this many days of issue removes it from usage */
export const DELETE_REFUND_DAYS = 7

/** Usage share that triggers the "approaching limit" warning */
export const WARNING_THRESHOLD = 0.8

export const UPGRADE_URL = '/pricing'

export function isPlanId(value: unknown): value is PlanId {
  return typeof value === 'string' && value in PLANS
}

export function resolvePlan(plan: unknown, customLimit?: number | null): PlanDefinition {
  const base = PLANS[isPlanId(plan) ? plan : DEFAULT_PLAN]
  if (base.custom && customLimit && customLimit > base.yearlyLimit) {
    return { ...base, yearlyLimit: customLimit }
  }
  return base
}

/** Hard cap = limit plus the 10% grace allowance */
export function hardCap(limit: number): number {
  return Math.floor(limit * (1 + GRACE_RATE))
}

function anniversary(signup: Date, year: number): Date {
  const d = new Date(Date.UTC(
    year,
    signup.getUTCMonth(),
    signup.getUTCDate(),
    signup.getUTCHours(),
    signup.getUTCMinutes(),
    signup.getUTCSeconds(),
    signup.getUTCMilliseconds()
  ))
  // Feb 29 signups roll to Feb 28 in non-leap years rather than Mar 1
  if (d.getUTCMonth() !== signup.getUTCMonth()) {
    d.setUTCDate(0)
  }
  return d
}

/** Current plan year window [start, end) for an account created at `signupDate` */
export function getPlanYear(signupDate: Date, now: Date = new Date()): { start: Date; end: Date } {
  if (now.getTime() < signupDate.getTime()) {
    return { start: signupDate, end: anniversary(signupDate, signupDate.getUTCFullYear() + 1) }
  }
  let start = anniversary(signupDate, now.getUTCFullYear())
  if (start.getTime() > now.getTime()) {
    start = anniversary(signupDate, now.getUTCFullYear() - 1)
  }
  const end = anniversary(signupDate, start.getUTCFullYear() + 1)
  return { start, end }
}

export type UsageLevel = 'ok' | 'warning' | 'limit' | 'blocked'

export interface UsageStatus {
  used: number
  limit: number
  cap: number
  /** Certificates that can still be issued before the hard cap */
  remaining: number
  percent: number
  level: UsageLevel
}

export function evaluateUsage(used: number, limit: number): UsageStatus {
  const cap = hardCap(limit)
  const safeUsed = Math.max(0, used)
  const percent = limit > 0 ? Math.round((safeUsed / limit) * 100) : 100
  let level: UsageLevel = 'ok'
  if (safeUsed >= cap) level = 'blocked'
  else if (safeUsed >= limit) level = 'limit'
  else if (safeUsed >= limit * WARNING_THRESHOLD) level = 'warning'
  return {
    used: safeUsed,
    limit,
    cap,
    remaining: Math.max(0, cap - safeUsed),
    percent,
    level,
  }
}

export interface IssueCheck {
  allowed: boolean
  remaining: number
  message?: string
}

export function formatResetDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(date)
}

/** Can `requested` more certificates be issued given current usage? */
export function checkIssueAllowance(
  used: number,
  requested: number,
  plan: PlanDefinition,
  resetsOn: Date
): IssueCheck {
  const status = evaluateUsage(used, plan.yearlyLimit)
  if (requested <= status.remaining) {
    return { allowed: true, remaining: status.remaining }
  }
  const reset = formatResetDate(resetsOn)
  const base = `Your ${plan.name} plan includes ${plan.yearlyLimit.toLocaleString('en-US')} certificates per year (plus 10% grace)`
  const message = status.remaining === 0
    ? `${base}, and you've used them all. Upgrade at ${UPGRADE_URL} to keep issuing, or wait until your limit resets on ${reset}.`
    : `${base}. You can issue ${status.remaining.toLocaleString('en-US')} more this plan year, but tried to issue ${requested.toLocaleString('en-US')}. Upgrade at ${UPGRADE_URL} or issue fewer certificates. Your limit resets on ${reset}.`
  return { allowed: false, remaining: status.remaining, message }
}

export interface BillableCounts {
  /** Distinct recipient + program pairs among first-time (non-renewal) certificates */
  uniqueFirstIssues: number
  /** Renewal / reissue certificates (each counts) */
  renewals: number
  /** Certificates deleted more than 7 days after issue (still count) */
  deletedAfterRefundWindow: number
}

export function totalBillable(counts: BillableCounts): number {
  return counts.uniqueFirstIssues + counts.renewals + counts.deletedAfterRefundWindow
}

/** Should a deleted certificate still count toward usage? */
export function countsAfterDeletion(issuedAt: Date | null, deletedAt: Date = new Date()): boolean {
  if (!issuedAt) return false
  return deletedAt.getTime() - issuedAt.getTime() > DELETE_REFUND_DAYS * 24 * 60 * 60 * 1000
}
