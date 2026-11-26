import Link from 'next/link'
import { requireAuth } from '@/lib/utils/session'
import { accountCan } from '@/lib/billing/usage'
import { getExpiringCertificates } from '@/lib/reminders/expiring'
import { EXPIRING_WINDOWS, parseExpiringWindow } from '@/lib/reminders/schedule'
import { formatResetDate } from '@/lib/billing/plans'
import { LockedFeatureCard } from '@/components/dashboard/locked-feature'

export const dynamic = 'force-dynamic'

export default async function ExpiringSoonPage({
  searchParams,
}: {
  searchParams: Promise<{ window?: string | string[] }>
}) {
  const user = await requireAuth()
  const windowDays = parseExpiringWindow((await searchParams).window)

  // Growth and up, checked on the server: nothing is loaded on lower plans
  if (!(await accountCan(user.academyId, 'expiringSoonView'))) {
    return (
      <div className="px-4 sm:px-0">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Expiring soon</h1>
        <LockedFeatureCard
          feature="expiringSoonView"
          title="See which certificates expire next"
          description="List every certificate expiring in the next 30, 60 or 90 days, and send recipients reminder emails 30 and 7 days before expiry."
          withTrial
        />
      </div>
    )
  }

  let rows: Awaited<ReturnType<typeof getExpiringCertificates>> = []
  let loadError = false
  try {
    rows = await getExpiringCertificates(user.academyId, windowDays)
  } catch (error) {
    console.error('Failed to load expiring certificates:', error)
    loadError = true
  }

  return (
    <div className="px-4 sm:px-0">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Expiring soon</h1>
          <p className="mt-1 text-sm text-gray-600">
            Live certificates that expire in the next {windowDays} days. Reminder emails go to recipients 30 and 7 days before expiry
            (turn them on or off on each program).
          </p>
        </div>
        <nav className="inline-flex rounded-md border border-gray-200 bg-white p-1 text-sm" aria-label="Window">
          {EXPIRING_WINDOWS.map((w) => (
            <Link
              key={w}
              href={`/dashboard/expiring?window=${w}`}
              aria-current={w === windowDays ? 'page' : undefined}
              className={`rounded px-3 py-1 font-medium ${w === windowDays ? 'bg-blue-600 text-white' : 'text-gray-600 hover:text-gray-900'}`}
            >
              {w} days
            </Link>
          ))}
        </nav>
      </div>

      {loadError ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          Expiring certificates couldn&apos;t be loaded right now. Please try again later.
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-lg border bg-white p-8 text-center text-sm text-gray-600">
          No certificates expire in the next {windowDays} days.
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3">Recipient</th>
                <th className="px-4 py-3">Certificate</th>
                <th className="px-4 py-3">Expiry date</th>
                <th className="px-4 py-3 text-right">Days left</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{r.learnerName}</div>
                    <div className="text-gray-500">{r.learnerEmail}</div>
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/dashboard/certificates/${r.id}`} className="font-medium text-blue-600 hover:text-blue-800">
                      {r.courseName}
                    </Link>
                    <div className="text-gray-500">{r.number}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-900">{formatResetDate(r.expiryDate)}</td>
                  <td className={`px-4 py-3 text-right font-semibold ${r.daysLeft <= 7 ? 'text-red-600' : 'text-gray-900'}`}>{r.daysLeft}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
