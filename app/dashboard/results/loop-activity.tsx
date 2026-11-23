import { db } from '@/lib/db'
import { certificates, events } from '@/lib/db/schema'
import { and, eq, gte, inArray, lte, sql } from 'drizzle-orm'
import { summarizeLoopEvents, type LoopEventRow } from '@/lib/growth/tracking'

interface LoopActivityProps {
  academyId: string
  startDate: Date
  endDate: Date
  courseFilter?: string
}

/**
 * Growth-loop counts for the issuer: where certificate page views came from,
 * how recipients shared, Add to LinkedIn clicks and Verified-by clicks.
 * (Attributed signups are recorded but kept internal for now.)
 */
export default async function LoopActivity({ academyId, startDate, endDate, courseFilter }: LoopActivityProps) {
  const key = sql<string | null>`coalesce(${events.meta}->>'source', ${events.meta}->>'channel')`
  const conditions = [
    eq(events.academyId, academyId),
    eq(events.isBot, false),
    gte(events.at, startDate),
    lte(events.at, endDate),
    inArray(events.type, ['page_view', 'share_click', 'linkedin_add_click', 'verified_by_click']),
    // Recipients opening their own certificate are not audience views
    sql`not (${events.type} = 'page_view' and coalesce(${events.meta}->>'isRecipient', 'false') = 'true')`,
  ]

  let rows: LoopEventRow[] = []
  try {
    const base = db
      .select({ type: events.type, key, count: sql<number>`cast(count(*) as int)` })
      .from(events)
    rows = courseFilter
      ? await base
          .innerJoin(certificates, eq(events.certificateId, certificates.id))
          .where(and(...conditions, eq(certificates.courseId, courseFilter)))
          .groupBy(events.type, key)
      : await base.where(and(...conditions)).groupBy(events.type, key)
  } catch (error) {
    console.error('Failed to load loop activity:', error)
  }

  const summary = summarizeLoopEvents(rows)

  return (
    <div className="bg-white shadow sm:rounded-lg mb-6">
      <div className="px-4 py-5 sm:p-6">
        <h2 className="text-lg font-medium text-gray-900">Sharing activity</h2>
        <p className="text-sm text-gray-600 mt-1 mb-6">
          How people find and share your certificates. Every certificate link is tagged by channel.
        </p>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 mb-6">
          <Stat label="Page views" value={summary.totalViews} hint="Audience visits to certificate pages" />
          <Stat label="Shares" value={summary.totalShares} hint="Share clicks by recipients and visitors" />
          <Stat label="Add to LinkedIn" value={summary.linkedinAdds} hint="Clicks to add a certificate to a LinkedIn profile" />
          <Stat label="Verified-by clicks" value={summary.verifiedByClicks} hint="Visitors who clicked through to create their own certificates" />
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Breakdown
            title="Views by source"
            items={summary.viewsBySource.map((v) => ({ label: v.label, count: v.count }))}
            total={summary.totalViews}
            empty="No page views in this period yet."
          />
          <Breakdown
            title="Shares by channel"
            items={summary.sharesByChannel.map((s) => ({ label: s.label, count: s.count }))}
            total={summary.totalShares}
            empty="No shares in this period yet."
          />
        </div>
      </div>
    </div>
  )
}

function Stat({ label, value, hint }: { label: string; value: number; hint: string }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-4" title={hint}>
      <div className="text-sm text-gray-500">{label}</div>
      <div className="mt-1 text-2xl font-semibold text-gray-900">{value}</div>
    </div>
  )
}

function Breakdown({
  title,
  items,
  total,
  empty,
}: {
  title: string
  items: Array<{ label: string; count: number }>
  total: number
  empty: string
}) {
  return (
    <div>
      <h3 className="text-sm font-medium text-gray-900 mb-3">{title}</h3>
      {items.length === 0 ? (
        <p className="text-sm text-gray-500">{empty}</p>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => {
            const pct = total > 0 ? Math.round((item.count / total) * 100) : 0
            return (
              <li key={item.label} className="text-sm">
                <div className="flex justify-between text-gray-700">
                  <span>{item.label}</span>
                  <span className="font-medium text-gray-900">{item.count}</span>
                </div>
                <div className="mt-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                  <div className="h-full bg-blue-500" style={{ width: `${pct}%` }} />
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
