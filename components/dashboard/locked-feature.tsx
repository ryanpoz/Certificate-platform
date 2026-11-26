import Link from 'next/link'
import { UPGRADE_URL } from '@/lib/billing/plans'
import { requiredPlanName, type Feature } from '@/lib/billing/entitlements'

/**
 * Locked preview shown in place of a plan-gated panel. Renders placeholder
 * shapes only; no account data is loaded for it.
 */
export function LockedFeatureCard({
  feature,
  title,
  description,
  withTrial = false,
}: {
  feature: Feature
  title: string
  description: string
  /** Show both "Upgrade now" and "Start 14-day trial" */
  withTrial?: boolean
}) {
  const planName = requiredPlanName(feature)
  return (
    <div className="relative overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm mb-6" data-locked-feature={feature}>
      <div className="pointer-events-none select-none p-6 blur-[2px] opacity-60" aria-hidden>
        <div className="h-4 w-40 rounded bg-gray-200 mb-6" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 mb-6">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-lg bg-gray-100" />
          ))}
        </div>
        <div className="space-y-3">
          {[70, 45, 30].map((w) => (
            <div key={w} className="h-2 rounded-full bg-blue-100" style={{ width: `${w}%` }} />
          ))}
        </div>
      </div>
      <div className="absolute inset-0 flex items-center justify-center bg-white/60 p-6">
        <div className="max-w-sm text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-900 px-3 py-1 text-xs font-semibold text-white">
            <LockIcon /> Available on {planName}
          </span>
          <h3 className="mt-3 text-base font-semibold text-gray-900">{title}</h3>
          <p className="mt-1 text-sm text-gray-600">{description}</p>
          {withTrial ? (
            <UpgradeButtons className="mt-4 justify-center" />
          ) : (
            <Link
              href={UPGRADE_URL}
              className="mt-4 inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Upgrade to {planName}
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * "Upgrade now" and "Start 14-day trial". There is no checkout or trial yet,
 * so both go to the pricing page and the trial is marked Coming soon.
 */
export function UpgradeButtons({ className = '' }: { className?: string }) {
  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <Link
        href={UPGRADE_URL}
        className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
      >
        Upgrade now
      </Link>
      <Link
        href={UPGRADE_URL}
        className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
      >
        Start 14-day trial
        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-600">Coming soon</span>
      </Link>
    </div>
  )
}

/** Small inline "Starter plan" style link next to a disabled control */
export function PlanBadgeLink({ feature }: { feature: Feature }) {
  return (
    <Link
      href={UPGRADE_URL}
      className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700 hover:bg-blue-100"
    >
      <LockIcon /> {requiredPlanName(feature)} plan
    </Link>
  )
}

function LockIcon() {
  return (
    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  )
}
