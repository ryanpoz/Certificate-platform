/**
 * Entitlements: the single source of truth for what each plan includes.
 *
 * Pure (no database access), built from PLANS in ./plans. Every plan check in
 * the app goes through `can(account, feature)` or `getLimit(account, limit)`;
 * server code resolves the account's plan with `getAccountEntitlements` /
 * `accountCan` / `accountLimit` in ./usage (which default to Free when the plan
 * can't be read).
 *
 * Features marked `status: 'coming_soon'` are registered at the tier the
 * pricing page lists them on, so they are gated correctly the day they ship.
 *
 * Downgrade rules are in ./downgrade.
 */
import {
  PLANS,
  PLAN_ORDER,
  DEFAULT_PLAN,
  isPlanId,
  planRank,
  type PlanDefinition,
  type PlanId,
} from './plans'

export type FeatureStatus = 'live' | 'coming_soon'

/**
 * What happens to a feature when an account moves to a plan without it:
 * - 'lock': locks straight away and shows as a locked preview (never disappears).
 * - 'period_end': keeps working until the end of the current billing period,
 *   after a warning email, then switches off.
 */
export type DowngradeBehaviour = 'lock' | 'period_end'

export interface FeatureDefinition {
  label: string
  /** Lowest plan that includes the feature */
  minPlan: PlanId
  status: FeatureStatus
  /** Is the gate enforced in the app today? (false = registered but not wired up yet) */
  enforced: boolean
  downgrade: DowngradeBehaviour
}

export const FEATURES = {
  // Starter
  expiry: { label: 'Expiry dates', minPlan: 'starter', status: 'live', enforced: true, downgrade: 'lock' },
  brandedEmail: { label: 'Branded email (your sender name and reply-to)', minPlan: 'starter', status: 'live', enforced: true, downgrade: 'lock' },
  issueApi: { label: 'Issue API', minPlan: 'starter', status: 'coming_soon', enforced: false, downgrade: 'lock' },
  webhooks: { label: 'Webhook', minPlan: 'starter', status: 'coming_soon', enforced: false, downgrade: 'lock' },
  zapier: { label: 'Zapier', minPlan: 'starter', status: 'coming_soon', enforced: false, downgrade: 'lock' },
  passScoreRule: { label: 'Pass-score rule', minPlan: 'starter', status: 'coming_soon', enforced: false, downgrade: 'lock' },
  openBadgesImport: { label: 'Badgr / Open Badges import', minPlan: 'starter', status: 'coming_soon', enforced: false, downgrade: 'lock' },
  // Growth
  shareAnalytics: { label: 'Share and click analytics', minPlan: 'growth', status: 'live', enforced: true, downgrade: 'lock' },
  expiryReminders: { label: 'Expiry reminder emails', minPlan: 'growth', status: 'coming_soon', enforced: false, downgrade: 'lock' },
  expiringSoonView: { label: 'Expiring-soon view', minPlan: 'growth', status: 'coming_soon', enforced: false, downgrade: 'lock' },
  customCta: { label: 'Your own call to action on certificate pages', minPlan: 'growth', status: 'live', enforced: true, downgrade: 'lock' },
  pageAddress: { label: 'Your own page address on our domain (e.g. /acme)', minPlan: 'growth', status: 'coming_soon', enforced: false, downgrade: 'lock' },
  // Business
  customDomain: { label: 'Custom domain', minPlan: 'business', status: 'coming_soon', enforced: false, downgrade: 'period_end' },
  whiteLabel: { label: 'Full white-label (remove our branding)', minPlan: 'business', status: 'coming_soon', enforced: false, downgrade: 'lock' },
  sso: { label: 'SSO (SAML)', minPlan: 'business', status: 'coming_soon', enforced: false, downgrade: 'lock' },
  multipleBrands: { label: 'Multiple brands', minPlan: 'business', status: 'coming_soon', enforced: false, downgrade: 'period_end' },
  auditLog: { label: 'Audit log', minPlan: 'business', status: 'coming_soon', enforced: false, downgrade: 'lock' },
  recertificationCampaigns: { label: 'Recertification campaigns', minPlan: 'business', status: 'coming_soon', enforced: false, downgrade: 'lock' },
} as const satisfies Record<string, FeatureDefinition>

export type Feature = keyof typeof FEATURES

export const FEATURE_KEYS = Object.keys(FEATURES) as Feature[]

/** Feature -> lowest plan that includes it (derived from FEATURES) */
export const FEATURE_MIN_PLAN = Object.fromEntries(
  FEATURE_KEYS.map((f) => [f, FEATURES[f].minPlan])
) as { [K in Feature]: (typeof FEATURES)[K]['minPlan'] }

export type LimitKey = 'certificatesPerYear' | 'adminSeats' | 'brands'

export interface LimitDefinition {
  label: string
  perPlan: Record<PlanId, number>
  /** Plans whose value is a contract floor that can be raised per account */
  contractPlans: PlanId[]
  downgrade: DowngradeBehaviour
}

/**
 * Numeric limits. Business values are floors: certificatesPerYear can be raised
 * with academy_plans.custom_limit; seats and brands are set per contract (no
 * column for them yet, so they default to the floor shown here).
 */
export const LIMITS: Record<LimitKey, LimitDefinition> = {
  certificatesPerYear: {
    label: 'Certificates per year',
    perPlan: {
      free: PLANS.free.yearlyLimit,
      starter: PLANS.starter.yearlyLimit,
      growth: PLANS.growth.yearlyLimit,
      business: PLANS.business.yearlyLimit,
    },
    contractPlans: ['business'],
    // Over-limit accounts are blocked from new issuing after the 10% grace (see checkIssueAllowance)
    downgrade: 'lock',
  },
  adminSeats: {
    label: 'Admin seats',
    perPlan: { free: 1, starter: 2, growth: 5, business: 5 },
    contractPlans: ['business'],
    downgrade: 'period_end',
  },
  brands: {
    label: 'Brands',
    perPlan: { free: 1, starter: 1, growth: 1, business: 1 },
    contractPlans: ['business'],
    downgrade: 'period_end',
  },
}

export const LIMIT_KEYS = Object.keys(LIMITS) as LimitKey[]

/** Per-account contract values (Business only) */
export type LimitOverrides = Partial<Record<LimitKey, number | null>>

/** Anything that identifies a plan: a plan ID, a resolved plan, or an account carrying one */
export type AccountLike =
  | PlanId
  | PlanDefinition
  | { plan: PlanId | PlanDefinition; overrides?: LimitOverrides }

export interface PlanEntitlements {
  plan: PlanId
  planName: string
  limits: Record<LimitKey, number>
  features: Record<Feature, boolean>
}

/** Plan ID for anything AccountLike (unknown or missing plans are Free) */
export function planIdOf(account: AccountLike | null | undefined): PlanId {
  if (!account) return DEFAULT_PLAN
  if (typeof account === 'string') return isPlanId(account) ? account : DEFAULT_PLAN
  if ('id' in account) return isPlanId(account.id) ? account.id : DEFAULT_PLAN
  return planIdOf(account.plan)
}

function accountOverrides(account: AccountLike | null | undefined): LimitOverrides {
  if (!account || typeof account === 'string') return {}
  const overrides: LimitOverrides = 'overrides' in account && account.overrides ? { ...account.overrides } : {}
  // A resolved PlanDefinition already carries the custom certificate limit
  const plan = 'id' in account ? account : typeof account.plan === 'object' ? account.plan : null
  if (plan && overrides.certificatesPerYear == null) overrides.certificatesPerYear = plan.yearlyLimit
  return overrides
}

/** Does `plan` include `feature`? */
export function planHasFeature(plan: PlanId, feature: Feature): boolean {
  return planRank(plan) >= planRank(FEATURES[feature].minPlan)
}

/** Static map: plan -> limits + feature flags (no per-account overrides) */
export const ENTITLEMENTS: Record<PlanId, PlanEntitlements> = Object.fromEntries(
  PLAN_ORDER.map((plan) => [
    plan,
    {
      plan,
      planName: PLANS[plan].name,
      limits: Object.fromEntries(LIMIT_KEYS.map((k) => [k, LIMITS[k].perPlan[plan]])) as Record<LimitKey, number>,
      features: Object.fromEntries(FEATURE_KEYS.map((f) => [f, planHasFeature(plan, f)])) as Record<Feature, boolean>,
    },
  ])
) as Record<PlanId, PlanEntitlements>

/** Can this account use `feature`? Unknown plans are treated as Free. */
export function can(account: AccountLike | null | undefined, feature: Feature): boolean {
  return ENTITLEMENTS[planIdOf(account)].features[feature]
}

/**
 * Limit for this account. Contract plans (Business) may raise, never lower,
 * the floor; other plans always get the plan value.
 */
export function getLimit(account: AccountLike | null | undefined, limit: LimitKey): number {
  const plan = planIdOf(account)
  const base = LIMITS[limit].perPlan[plan]
  if (!LIMITS[limit].contractPlans.includes(plan)) return base
  const override = accountOverrides(account)[limit]
  return override && override > base ? override : base
}

/** Full entitlements for an account, including contract overrides */
export function entitlementsFor(account: AccountLike | null | undefined): PlanEntitlements {
  const plan = planIdOf(account)
  return {
    ...ENTITLEMENTS[plan],
    limits: Object.fromEntries(LIMIT_KEYS.map((k) => [k, getLimit(account, k)])) as Record<LimitKey, number>,
  }
}

export function requiredPlanFor(feature: Feature): PlanId {
  return FEATURES[feature].minPlan
}

export function requiredPlanName(feature: Feature): string {
  return PLANS[requiredPlanFor(feature)].name
}

export type FeatureAccess =
  | { state: 'enabled'; comingSoon: boolean }
  | { state: 'locked'; comingSoon: boolean; requiredPlan: PlanId; requiredPlanName: string }

/**
 * How the UI should show a feature: enabled, or a locked preview with an
 * upgrade link. Plan-gated features are never hidden.
 */
export function featureAccess(account: AccountLike | null | undefined, feature: Feature): FeatureAccess {
  const comingSoon = FEATURES[feature].status === 'coming_soon'
  if (can(account, feature)) return { state: 'enabled', comingSoon }
  return { state: 'locked', comingSoon, requiredPlan: requiredPlanFor(feature), requiredPlanName: requiredPlanName(feature) }
}

/** Features this account gains by moving to `plan` */
export function featuresUnlockedBy(account: AccountLike | null | undefined, plan: PlanId): Feature[] {
  return FEATURE_KEYS.filter((f) => !can(account, f) && planHasFeature(plan, f))
}

/** Validity months to apply to NEW certificates: none if the plan lacks expiry */
export function effectiveValidityMonths(account: AccountLike | null | undefined, validityMonths: number | null | undefined): number | null {
  if (!validityMonths) return null
  return can(account, 'expiry') ? validityMonths : null
}
