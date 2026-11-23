/**
 * Downgrade and top-up rules (pure logic, no database, billing or email).
 *
 * Rules:
 * 0. Plan changes (downgrades and cancellations) take effect at the end of the
 *    current billing period; upgrades take effect straight away.
 * 1. Nothing already issued breaks. Certificates, verification pages, PDFs and
 *    LinkedIn links keep working on every plan, including expiry dates set
 *    while the account was on a plan with expiry. Revoking is always allowed.
 * 2. Features lock instead of disappearing. When the change takes effect, a
 *    feature the new plan lacks is shown as a locked preview with an upgrade
 *    link (FEATURES[f].downgrade = 'lock'). Data and settings are kept.
 * 2b. You can't move to a paid plan whose yearly limit is below what you've
 *    already issued this plan year until the plan year resets. Cancelling to
 *    Free is always allowed; new issuing is then blocked until the reset, an
 *    upgrade or a top-up.
 * 3. Over the yearly limit: certificates already issued this plan year still
 *    count, against the NEW plan's limit, and new issuing is blocked once usage
 *    passes the limit plus the 10% grace (checkIssueAllowance). Nothing is
 *    revoked or unpublished.
 * 4. Admin seats, brands and the custom domain keep working until the end of
 *    the current billing period, after a warning email, then switch off.
 *    Nothing is deleted: extra seats lose dashboard access, extra brands and the
 *    custom domain stop being used, and everything comes back on upgrade.
 *    Custom-domain links redirect to our domain (while DNS still points at us)
 *    so shared links don't break.
 * 5. Unused top-up certificates carry over across plan changes until the
 *    plan-year reset, then expire.
 *
 * The warning email is a documented hook only (DowngradeHooks.onWarning); this
 * module never sends anything. Billing, top-up storage and seat/brand/domain
 * storage don't exist yet; wire them to planDowngrade / topUpAllowance when
 * they do.
 */
import { PLANS, evaluateUsage, hardCap, planRank, type PlanId, type UsageStatus } from './plans'
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
  /** Can the account make this change now? (false: limit below this year's usage) */
  allowed: boolean
  blockedReason?: string
  /** When the change takes effect: end of billing period for downgrades, now for upgrades */
  effectiveAt: Date
  /** Features that lock (as locked previews) when the change takes effect */
  locks: Feature[]
  /** Seats, brands and custom domain: keep working until the period end, then switch off */
  atPeriodEnd: PeriodEndChange[]
  /** Set when a warning email is needed before atPeriodEnd takes effect */
  warning: DowngradeWarning | null
  /** Usage measured against the new plan's limit */
  usage: UsageStatus
  /** False when usage is already past the new limit plus grace: new issuing is blocked */
  canIssueNew: boolean
}

/**
 * Can the account move to `to` given what it has issued this plan year?
 * Free (cancel) is always allowed; paid plans need a yearly limit at or above usage.
 */
export function canChangePlan(to: AccountLike, certificatesThisYear: number): { allowed: boolean; reason?: string } {
  const toId = planIdOf(to)
  if (toId === 'free') return { allowed: true }
  const limit = getLimit(to, 'certificatesPerYear')
  if (certificatesThisYear > limit) {
    return {
      allowed: false,
      reason: `You've issued ${certificatesThisYear.toLocaleString('en-US')} certificates this plan year, more than the ${limit.toLocaleString('en-US')} on that plan. You can move to it after your plan year resets, or cancel to Free.`,
    }
  }
  return { allowed: true }
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

  const locks = lost.filter((f) => FEATURES[f].downgrade === 'lock')
  const downgrade = isDowngrade(fromId, toId)
  const check = canChangePlan(to, use.certificatesThisYear)

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
    isDowngrade: downgrade,
    allowed: check.allowed,
    ...(check.reason ? { blockedReason: check.reason } : {}),
    effectiveAt: downgrade ? billingPeriodEnd : now,
    issuedCertificatesUnaffected: true,
    locks,
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

// ---------------------------------------------------------------------------
// Scheduling plan changes
// ---------------------------------------------------------------------------

/**
 * Default end of the billing period when billing hasn't set one: the next
 * monthly anniversary of signup strictly after `now` (31st -> last day of month).
 */
export function nextMonthlyBoundary(signup: Date, now: Date = new Date()): Date {
  const day = signup.getUTCDate()
  const at = (year: number, month: number) => {
    const last = new Date(Date.UTC(year, month + 1, 0)).getUTCDate()
    return new Date(Date.UTC(year, month, Math.min(day, last), signup.getUTCHours(), signup.getUTCMinutes(), signup.getUTCSeconds()))
  }
  let candidate = at(now.getUTCFullYear(), now.getUTCMonth())
  if (candidate.getTime() <= now.getTime()) {
    candidate = at(now.getUTCFullYear(), now.getUTCMonth() + 1)
  }
  return candidate
}

export type PlanChangeAction = 'apply_now' | 'schedule' | 'cancel_pending' | 'refuse'

export interface PlanChangeDecision {
  action: PlanChangeAction
  effectiveAt: Date
  reason?: string
}

/**
 * What to do when an account asks to move to `to`:
 * - upgrade: apply now
 * - same plan while a downgrade is pending: cancel the pending change
 * - downgrade/cancel: schedule for the end of the billing period, unless the
 *   target is a paid plan whose yearly limit is below this year's usage (refuse)
 */
export function decidePlanChange(input: {
  from: AccountLike
  to: AccountLike
  certificatesThisYear: number
  billingPeriodEnd: Date
  now?: Date
}): PlanChangeDecision {
  const now = input.now ?? new Date()
  const fromId = planIdOf(input.from)
  const toId = planIdOf(input.to)
  if (fromId === toId) return { action: 'cancel_pending', effectiveAt: now }
  if (!isDowngrade(fromId, toId)) return { action: 'apply_now', effectiveAt: now }
  const check = canChangePlan(input.to, input.certificatesThisYear)
  if (!check.allowed) return { action: 'refuse', effectiveAt: input.billingPeriodEnd, reason: check.reason }
  return { action: 'schedule', effectiveAt: input.billingPeriodEnd }
}

export interface StoredPlanState {
  plan: PlanId
  pendingPlan?: PlanId | null
  pendingPlanAt?: Date | null
}

export interface EffectivePlan {
  plan: PlanId
  /** A scheduled change still waiting (not due, or postponed by the volume rule) */
  pending: { plan: PlanId; at: Date } | null
  /** Due, but held back because this year's usage is above the target's limit */
  postponed: boolean
}

/**
 * The plan in force now. A scheduled change applies once its date has passed;
 * a due change to a paid plan is held back while this year's usage is above
 * that plan's yearly limit (it applies after the plan year resets).
 * Cancelling to Free is never held back.
 */
export function resolveEffectivePlan(state: StoredPlanState, now: Date = new Date(), certificatesThisYear?: number): EffectivePlan {
  const pendingPlan = state.pendingPlan && planIdOf(state.pendingPlan) === state.pendingPlan ? state.pendingPlan : null
  if (!pendingPlan || !state.pendingPlanAt) return { plan: state.plan, pending: null, postponed: false }
  const pending = { plan: pendingPlan, at: state.pendingPlanAt }
  if (state.pendingPlanAt.getTime() > now.getTime()) return { plan: state.plan, pending, postponed: false }
  if (pendingPlan !== 'free' && certificatesThisYear !== undefined && !canChangePlan(pendingPlan, certificatesThisYear).allowed) {
    return { plan: state.plan, pending, postponed: true }
  }
  return { plan: pendingPlan, pending: null, postponed: false }
}

// ---------------------------------------------------------------------------
// Seats
// ---------------------------------------------------------------------------

export type SeatAccess = 'admin' | 'view_only'

/**
 * Seat access for a user. Users are ranked oldest first (the account creator
 * keeps admin); the first `seatLimit` are admins, the rest are view-only.
 * Nobody is removed, and access comes back when the limit rises.
 */
export function seatAccess(userIdsOldestFirst: string[], userId: string, seatLimit: number): SeatAccess {
  const index = userIdsOldestFirst.indexOf(userId)
  if (index === -1) return 'admin'
  return index < Math.max(1, seatLimit) ? 'admin' : 'view_only'
}

export function viewOnlyUsers(userIdsOldestFirst: string[], seatLimit: number): string[] {
  return userIdsOldestFirst.slice(Math.max(1, seatLimit))
}

// ---------------------------------------------------------------------------
// Downgrade preview
// ---------------------------------------------------------------------------

export interface DowngradeConsequence {
  key: Feature | LimitKey | 'volume'
  label: string
  /** What happens, in plain words */
  effect: string
  /** When: at the change, or at the end of the billing period after a warning */
  when: 'at_change' | 'period_end'
}

export interface DowngradePreview {
  from: PlanId
  to: PlanId
  isDowngrade: boolean
  allowed: boolean
  blockedReason?: string
  effectiveAt: Date
  /** What the issuer loses or what changes */
  losses: DowngradeConsequence[]
  /** What always stays */
  keeps: string[]
}

const LOSS_EFFECT: Partial<Record<Feature, string>> = {
  customDomain: 'Links on your custom domain permanently redirect (301) to the same page on our domain, so shared links keep working while your DNS points at us.',
  pageAddress: 'Your page address (for example /acme) keeps resolving.',
  issueApi: 'API access stops. Your API keys are kept and work again when you upgrade.',
  webhooks: 'Webhooks stop sending. Your webhook settings are kept.',
  zapier: 'Zapier actions stop. Your connection settings are kept.',
  shareAnalytics: 'Share and click analytics are still collected, but hidden until you upgrade.',
  auditLog: 'The audit log is kept, but hidden until you upgrade.',
  customCta: 'Certificate pages show our "Create your first certificate" button instead of yours. Your saved button label and link are kept.',
  brandedEmail: 'Certificate emails come from our name with no custom reply-to. Your saved sender name and reply-to are kept.',
  expiry: "New certificates won't get an expiry date. Expiry dates on certificates already issued stay as they are.",
  expiryReminders: 'Expiry reminder emails stop.',
  expiringSoonView: 'The expiring-soon view locks.',
  whiteLabel: 'The "Verified by" mark returns on certificate pages and emails.',
  sso: 'SSO sign-in turns off; admins sign in with email or Google.',
  multipleBrands: 'Extra brands switch off at the end of the billing period. Nothing is deleted.',
  recertificationCampaigns: 'Recertification campaigns stop. Campaign settings are kept.',
}

/** What moving from `from` to `to` would mean for this account */
export function previewDowngrade(
  from: AccountLike,
  to: AccountLike,
  use: CurrentUse,
  billingPeriodEnd: Date,
  planYearEnd: Date,
  now: Date = new Date()
): DowngradePreview {
  const fromId = planIdOf(from)
  const toId = planIdOf(to)
  const change = planDowngrade(from, to, use, billingPeriodEnd, now)
  const losses: DowngradeConsequence[] = featuresLost(from, to).map((f) => ({
    key: f,
    label: FEATURES[f].label,
    effect: LOSS_EFFECT[f] ?? `${FEATURES[f].label} locks. Your settings are kept and come back when you upgrade.`,
    when: FEATURES[f].downgrade === 'period_end' ? 'period_end' : 'at_change',
  }))

  const seatsInUse = use.adminSeats ?? 0
  const seatLimit = getLimit(to, 'adminSeats')
  if (seatsInUse > seatLimit) {
    const n = seatsInUse - seatLimit
    losses.push({
      key: 'adminSeats',
      label: LIMITS.adminSeats.label,
      effect: `${n} admin${n === 1 ? '' : 's'} become${n === 1 ? 's' : ''} view-only (not removed). The longest-standing ${seatLimit === 1 ? 'admin keeps' : `${seatLimit} admins keep`} full access.`,
      when: 'period_end',
    })
  }
  const brandsInUse = use.brands ?? 0
  const brandLimit = getLimit(to, 'brands')
  if (brandsInUse > brandLimit) {
    losses.push({
      key: 'brands',
      label: LIMITS.brands.label,
      effect: `${brandsInUse - brandLimit} extra brand${brandsInUse - brandLimit === 1 ? '' : 's'} switch off. Nothing is deleted.`,
      when: 'period_end',
    })
  }

  const reset = planYearEnd.toISOString().slice(0, 10)
  if (!change.allowed) {
    losses.push({ key: 'volume', label: 'Yearly limit', effect: change.blockedReason!, when: 'at_change' })
  } else if (!change.canIssueNew) {
    losses.push({
      key: 'volume',
      label: 'Yearly limit',
      effect: `You've issued more this plan year than the ${PLANS[toId].name} plan allows (plus 10% grace), so new issuing is blocked until your plan year resets on ${reset}, or until you upgrade or add a top-up.`,
      when: 'at_change',
    })
  }

  return {
    from: fromId,
    to: toId,
    isDowngrade: change.isDowngrade,
    allowed: change.allowed,
    ...(change.blockedReason ? { blockedReason: change.blockedReason } : {}),
    effectiveAt: change.isDowngrade ? billingPeriodEnd : now,
    losses,
    keeps: [
      'Every certificate you have issued stays live and verifiable.',
      'You can still revoke certificates.',
      'Your data and settings are kept and come back when you upgrade.',
    ],
  }
}

