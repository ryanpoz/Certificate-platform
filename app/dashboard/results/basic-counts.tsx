import { db } from '@/lib/db'
import { certificates, events } from '@/lib/db/schema'
import { and, eq, gte, lte, ne, sql } from 'drizzle-orm'

/** Basic delivery counts, visible on every plan: issued, emails sent, claimed by recipients */
export default async function BasicCounts({
  academyId,
  startDate,
  endDate,
  courseFilter,
}: {
  academyId: string
  startDate: Date
  endDate: Date
  courseFilter?: string
}) {
  let issued = 0
  let sent = 0
  let claimed = 0
  try {
    const certConditions = [
      eq(certificates.academyId, academyId),
      ne(certificates.status, 'unpublished'),
      sql`coalesce(${certificates.isPreview}, false) = false`,
      gte(certificates.issueDate, startDate),
      lte(certificates.issueDate, endDate),
      ...(courseFilter ? [eq(certificates.courseId, courseFilter)] : []),
    ]
    const [row] = await db
      .select({ count: sql<number>`cast(count(*) as int)` })
      .from(certificates)
      .where(and(...certConditions))
    issued = Number(row?.count ?? 0)

    const [eventRow] = await db
      .select({
        sent: sql<number>`cast(count(distinct ${events.certificateId}) filter (where ${events.type} = 'email_delivered') as int)`,
        claimed: sql<number>`cast(count(distinct ${events.certificateId}) filter (where ${events.type} = 'page_view' and coalesce(${events.meta}->>'isRecipient', 'false') = 'true') as int)`,
      })
      .from(events)
      .innerJoin(certificates, eq(events.certificateId, certificates.id))
      .where(and(...certConditions))
    sent = Number(eventRow?.sent ?? 0)
    claimed = Number(eventRow?.claimed ?? 0)
  } catch (error) {
    console.error('Failed to load basic counts:', error)
  }

  const items = [
    { label: 'Issued', value: issued, hint: 'Certificates issued in this period' },
    { label: 'Emails sent', value: sent, hint: 'Certificate emails delivered to recipients' },
    { label: 'Claimed', value: claimed, hint: 'Recipients who opened their certificate' },
  ]

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-6">
      {items.map((item) => (
        <div key={item.label} className="rounded-lg border border-gray-200 bg-white px-4 py-4 shadow-sm" title={item.hint}>
          <div className="text-sm text-gray-500">{item.label}</div>
          <div className="mt-1 text-2xl font-semibold text-gray-900">{item.value}</div>
        </div>
      ))}
    </div>
  )
}
