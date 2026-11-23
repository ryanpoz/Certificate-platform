/**
 * Downgrade and top-up rules (pure logic, no database, billing or email).
 *
 * Rules:
 * 1. Nothing already issued breaks. Certificates, verification pages, PDFs and
 *    LinkedIn links keep working on every plan, including expiry dates set
 *    while the account was on a plan with expiry.
 * 2. Features lock instead of disappearing. A feature the new plan lacks is
 *    shown as a locked preview with an upgrade link (FEATURES[f].downgrade = 'lock').
 * 3. Over the yearly limit: certificates already issued this plan year still
 *    count, against the NEW plan's limit, and new issuing is blocked once usage
 *    passes the limit plus the 10% grace (checkIssueAllowance). Nothing is
 *    revoked or unpublished.
 * 4. Admin seats, brands and the custom domain keep working until the end of
 *    the current billing period, after a warning email, then switch off.
 *    Nothing is deleted: extra seats lose dashboard access, extra brands and the
 *    custom domain stop being used, and everything comes back on upgrade.
 * 5. Unused top-up certificates carry over across plan changes until the
 *    plan-year reset, then expire.
 *
 * The warning email is a documented hook only (DowngradeHooks.onWarning); this
 * module never sends anything. Billing, top-up storage and seat/brand/domain
 * storage don't exist yet; wire them to planDowngrade / topUpAllowance when
 * they do.
 */
import { evaluateUsage, hardCap, planRank, type PlanId, type UsageStatus } from './plans'
import {
  FEATURES,
  FEATURE_KEYS,
  LIMITS,
  can,
  getLimit,
  planIdOf,
  type AccountLike,
  type Feature,
  type LimitKey,
} from './entitlements'

/** Days before the end of the billing period that the warning email goes out */
export const DOWNGRADE_WARNING_DAYS = 14

const DAY_MS = 24 * 60 * 60 * 1000

export function isDowngrade(from: PlanId, to: PlanId): boolean {
  return planRank(to) < planRank(from)
}

/** Things in use that a period-end switch-off would affect */
export interface CurrentUse {
  /** Billable certificates issued this plan year */
  certificatesThisYear: number
  adminSeats?: number
  brands?: number
  customDomainActive?: boolean
}

export interface PeriodEndChange {
  kind: 'limit' | 'feature'
  key: LimitKey | Feature
  label: string
  inUse: number
  allowed: number
  /** How many must switch off (seats/brands over the new limit, or 1 for the custom domain) */
  excess: number
}

export interface DowngradeWarning {
  /** When the warning email should be sent (never later than now) */
  sendAt: Date
  /** When the period-end changes take effect */
  switchOffAt: Date
  changes: PeriodEndChange[]
}

export interface DowngradePlan {
  from: PlanId
  to: PlanId
  isDowngrade: boolean
  /** Always true: issued certificates, pages, PDFs and links are never affected */
  issuedCertificatesUnaffected: true
  /** Features that lock straight away and show as locked previews */
  lockNow: Feature[]
  /** Seats, brands and custom domain: keep working until the period end, then switch off */
  atPeriodEnd: PeriodEndChange[]
  /** Set when a warning email is needed before atPeriodEnd takes effect */
  warning: DowngradeWarning | null
  /** Usage measured against the new plan's limit */
  usage: UsageStatus
  /** False when usage is already past the new limit plus grace: new issuing is blocked */
  canIssueNew: boolean
}

/** Features lost on `to` that `from` had */
export function featuresLost(from: AccountLike, to: AccountLike): Feature[] {
  return FEATURE_KEYS.filter((f) => can(from, f) && !can(to, f))
}

/**
 * What a plan change does. Pure: the caller decides when to apply it.
 * `billingPeriodEnd` is the end of the period already paid for.
 */
export function planDowngrade(
  from: AccountLike,
  to: AccountLike,
  use: CurrentUse,
  billingPeriodEnd: Date,
  now: Date = new Date()
): DowngradePlan {
  const fromId = planIdOf(from)
  const toId = planIdOf(to)
  const lost = featuresLost(from, to)

  const lockNow = lost.filter((f) => FEATURES[f].downgrade === 'lock')

  const atPeriodEnd: PeriodEndChange[] = []
  for (const key of ['adminSeats', 'brands'] as const) {
    const inUse = key === 'adminSeats' ? use.adminSeats ?? 0 : use.brands ?? 0
    const allowed = getLimit(to, key)
    if (LIMITS[key].downgrade === 'period_end' && inUse > allowed) {
      atPeriodEnd.push({ kind: 'limit', key, label: LIMITS[key].label, inUse, allowed, excess: inUse - allowed })
    }
  }
  for (const f of lost.filter((f) => FEATURES[f].downgrade === 'period_end')) {
    const inUse = f === 'customDomain' ? (use.customDomainActive ? 1 : 0) : f === 'multipleBrands' ? Math.max(0, (use.brands ?? 0) - 1) : 0
    // multipleBrands is covered by the brands limit above; only list features actually in use
    if (f === 'multipleBrands' || inUse === 0) continue
    atPeriodEnd.push({ kind: 'feature', key: f, label: FEATURES[f].label, inUse, allowed: 0, excess: inUse })
  }

  const warning: DowngradeWarning | null = atPeriodEnd.length
    ? {
        sendAt: new Date(Math.max(now.getTime(), billingPeriodEnd.getTime() - DOWNGRADE_WARNING_DAYS * DAY_MS)),
        switchOffAt: billingPeriodEnd,
        changes: atPeriodEnd,
      }
    : null

  const usage = evaluateUsage(use.certificatesThisYear, getLimit(to, 'certificatesPerYear'))

  return {
    from: fromId,
    to: toId,
    isDowngrade: isDowngrade(fromId, toId),
    issuedCertificatesUnaffected: true,
    lockNow,
    atPeriodEnd,
    warning,
    usage,
    canIssueNew: usage.remaining > 0,
  }
}

/**
 * Entitlements in force during a downgrade: the new plan's features (locked
 * ones show as previews), but seats/brands/custom domain from the old plan
 * until `billingPeriodEnd`.
 */
export function periodEndEntitlement(
  from: AccountLike,
  to: AccountLike,
  key: 'adminSeats' | 'brands' | 'customDomain',
  billingPeriodEnd: Date,
  now: Date = new Date()
): number | boolean {
  const old = now.getTime() < billingPeriodEnd.getTime()
  const account = old ? from : to
  return key === 'customDomain' ? can(account, 'customDomain') : getLimit(account, key)
}

/**
 * Hook points for side effects. Nothing here sends email or charges anyone;
 * whoever wires billing in later supplies these. Default: do nothing.
 */
export interface DowngradeHooks {
  /** Called once when warning.sendAt is reached: send the "these switch off on <date>" email */
  onWarning(academyId: string, warning: DowngradeWarning): Promise<void>
  /** Called at warning.switchOffAt: disable extra seats/brands and the custom domain (no deletion) */
  onSwitchOff(academyId: string, changes: PeriodEndChange[]): Promise<void>
}

export const noopDowngradeHooks: DowngradeHooks = {
  async onWarning() {},
  async onSwitchOff() {},
}

/** Run whichever hook is due. Returns which step ran, for logging. */
export async function runDowngradeHooks(
  academyId: string,
  plan: DowngradePlan,
  state: { warningSent: boolean; switchedOff: boolean },
  hooks: DowngradeHooks = noopDowngradeHooks,
  now: Date = new Date()
): Promise<'none' | 'warning' | 'switch_off'> {
  if (!plan.warning) return 'none'
  if (!state.switchedOff && state.warningSent && now.getTime() >= plan.warning.switchOffAt.getTime()) {
    await hooks.onSwitchOff(academyId, plan.warning.changes)
    return 'switch_off'
  }
  if (!state.warningSent && now.getTime() >= plan.warning.sendAt.getTime()) {
    await hooks.onWarning(academyId, plan.warning)
    return 'warning'
  }
  return 'none'
}

// ---------------------------------------------------------------------------
// Top-ups (not stored yet)
// ---------------------------------------------------------------------------

export interface TopUp {
  certificates: number
  purchasedAt: Date
}

export interface TopUpAllowance {
  planLimit: number
  /** Top-up certificates bought in this plan year */
  topUps: number
  /** Top-up certificates still unused */
  topUpsRemaining: number
  /** Plan limit + top-ups */
  limit: number
  /** Hard cap: plan limit + 10% grace + top-ups (grace applies to the plan limit only) */
  cap: number
  remaining: number
}

/**
 * Allowance with top-ups. Top-ups bought in the current plan year are added on
 * top of the plan limit, survive plan changes (upgrade or downgrade) and expire
 * at the plan-year reset. Usage draws on the plan allowance first, then top-ups.
 */
export function topUpAllowance(
  account: AccountLike,
  used: number,
  topUps: TopUp[],
  periodStart: Date,
  periodEnd: Date
): TopUpAllowance {
  const planLimit = getLimit(account, 'certificatesPerYear')
  const inPeriod = topUps
    .filter((t) => t.purchasedAt.getTime() >= periodStart.getTime() && t.purchasedAt.getTime() < periodEnd.getTime())
    .reduce((sum, t) => sum + Math.max(0, t.certificates), 0)
  const safeUsed = Math.max(0, used)
  const topUpsUsed = Math.min(inPeriod, Math.max(0, safeUsed - planLimit))
  const cap = hardCap(planLimit) + inPeriod
  return {
    planLimit,
    topUps: inPeriod,
    topUpsRemaining: inPeriod - topUpsUsed,
    limit: planLimit + inPeriod,
    cap,
    remaining: Math.max(0, cap - safeUsed),
  }
}
