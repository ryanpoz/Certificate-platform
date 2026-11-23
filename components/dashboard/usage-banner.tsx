import Link from 'next/link'
import { getAcademyUsage } from '@/lib/billing/usage'
import { UPGRADE_URL, formatResetDate } from '@/lib/billing/plans'

/**
 * Plan usage meter for the dashboard: "X of 250 certificates this year, resets on <date>".
 * Shows a warning at 80%, a limit notice at 100% (grace period) and a block notice at the cap.
 */
export default async function UsageBanner({ academyId }: { academyId: string }) {
  let usage = null
  try {
    usage = await getAcademyUsage(academyId)
  } catch (error) {
    console.error('Failed to load usage:', error)
  }
  if (!usage) return null

  const { plan, status, periodEnd } = usage
  const resetsOn = formatResetDate(periodEnd)
  const barWidth = Math.min(100, status.percent)
  const barColor =
    status.level === 'blocked' || status.level === 'limit'
      ? 'bg-red-500'
      : status.level === 'warning'
      ? 'bg-amber-500'
      : 'bg-blue-600'

  return (
    <div className="px-4 sm:px-0 mb-6 space-y-3" data-testid="usage-banner">
      {status.level === 'warning' && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 flex flex-wrap items-center justify-between gap-2">
          <span>
            You&apos;ve used {status.percent}% of your {plan.name} plan&apos;s{' '}
            {plan.yearlyLimit.toLocaleString('en-US')} certificates this year.
          </span>
          <Link href={UPGRADE_URL} className="font-semibold underline">
            See plans
          </Link>
        </div>
      )}
      {status.level === 'limit' && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900 flex flex-wrap items-center justify-between gap-2">
          <span>
            You&apos;ve reached your {plan.name} plan limit. You can issue{' '}
            {status.remaining.toLocaleString('en-US')} more in your 10% grace allowance until {resetsOn}.
          </span>
          <Link href={UPGRADE_URL} className="font-semibold underline">
            Upgrade
          </Link>
        </div>
      )}
      {status.level === 'blocked' && (
        <div className="rounded-lg border border-red-300 bg-red-100 px-4 py-3 text-sm text-red-900 flex flex-wrap items-center justify-between gap-2">
          <span>
            Issuing is paused: you&apos;ve used your {plan.name} plan&apos;s certificates and grace allowance.
            Existing certificates stay valid. Upgrade to keep issuing, or wait until {resetsOn}.
          </span>
          <Link
            href={UPGRADE_URL}
            className="inline-flex items-center rounded-md bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
          >
            Upgrade
          </Link>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border bg-white px-4 py-3 text-sm">
        <span className="font-medium text-gray-900">
          {status.used.toLocaleString('en-US')} of {plan.yearlyLimit.toLocaleString('en-US')} certificates this year
        </span>
        <div className="h-2 flex-1 min-w-[120px] max-w-xs rounded-full bg-gray-100 overflow-hidden" aria-hidden>
          <div className={`h-full ${barColor}`} style={{ width: `${barWidth}%` }} />
        </div>
        <span className="text-gray-500">
          {plan.name} plan · resets on {resetsOn}
        </span>
        <Link href={UPGRADE_URL} className="ml-auto text-blue-600 hover:text-blue-800 font-medium">
          Plans
        </Link>
      </div>
    </div>
  )
}
