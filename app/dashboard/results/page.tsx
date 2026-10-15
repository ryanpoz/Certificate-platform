import { requireAuth } from '@/lib/utils/session'
import { db } from '@/lib/db'
import { certificates, courses, events } from '@/lib/db/schema'
import { eq, and, gte, lte, desc, sql } from 'drizzle-orm'
import Link from 'next/link'
import ResultsMetrics from './metrics'
import ResultsTrend from './trend'
import { FilterSelect, FilterInput } from '@/components/dashboard/filters'

export default async function ResultsDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ 
    course?: string
    startDate?: string
    endDate?: string
  }>
}) {
  const user = await requireAuth()
  const params = await searchParams

  const defaultStartDate = new Date()
  defaultStartDate.setMonth(defaultStartDate.getMonth() - 1)
  
  const startDate = params.startDate ? new Date(params.startDate) : defaultStartDate
  const endDate = params.endDate ? new Date(params.endDate) : new Date()

  let certsQuery = db
    .select({
      id: certificates.id,
      number: certificates.number,
      courseId: certificates.courseId,
      issueDate: certificates.issueDate,
      isPreview: certificates.isPreview,
    })
    .from(certificates)
    .where(
      and(
        eq(certificates.academyId, user.academyId),
        gte(certificates.issueDate, startDate),
        lte(certificates.issueDate, endDate)
      )
    )
    .$dynamic()

  if (params.course) {
    certsQuery = certsQuery.where(eq(certificates.courseId, params.course))
  }

  const certs = await certsQuery

  const certIds = certs.filter(c => !c.isPreview).map(c => c.id)
  
  const eventsData = certIds.length > 0 ? await db
    .select({
      certificateId: events.certificateId,
      type: events.type,
      visitorHash: events.visitorHash,
      isBot: events.isBot,
    })
    .from(events)
    .where(
      and(
        sql`${events.certificateId} = ANY(ARRAY[${sql.join(certIds.map(id => sql`${id}`), sql`, `)}]::uuid[])`,
        eq(events.isBot, false)
      )
    )
    : []

  const issued = certs.filter(c => !c.isPreview).length
  const emailDelivered = new Set(eventsData.filter(e => e.type === 'email_delivered').map(e => e.certificateId)).size
  const uniqueViews = new Set(eventsData.filter(e => e.type === 'page_view').map(e => e.visitorHash)).size
  const linkedinClicks = eventsData.filter(e => e.type === 'linkedin_add_click').length
  const ctaClicks = eventsData.filter(e => e.type === 'cta_click').length

  const deliveryRate = issued > 0 ? ((emailDelivered / issued) * 100).toFixed(1) : '0'
  const viewRate = emailDelivered > 0 ? ((uniqueViews / emailDelivered) * 100).toFixed(1) : '0'
  const linkedinRate = uniqueViews > 0 ? ((linkedinClicks / uniqueViews) * 100).toFixed(1) : '0'
  const ctaRate = uniqueViews > 0 ? ((ctaClicks / uniqueViews) * 100).toFixed(1) : '0'

  const trendData = await generateTrendData(certIds, startDate, endDate)

  const perCourse = params.course ? null : await getPerCourseMetrics(user.academyId, startDate, endDate)

  const allCourses = await db
    .select()
    .from(courses)
    .where(eq(courses.academyId, user.academyId))
    .orderBy(desc(courses.createdAt))

  return (
    <div className="px-4 sm:px-0">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Results Dashboard</h1>
        <p className="mt-2 text-sm text-gray-700">
          Analytics included free • Excludes preview certificates • Non-bot traffic only
        </p>
      </div>

      <div className="mb-6 bg-white p-4 rounded-lg shadow-sm border">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <FilterSelect
            id="course-filter"
            label="Program"
            value={params.course || ''}
            paramName="course"
            options={[
              { value: '', label: 'All Programs' },
              ...allCourses.map(course => ({ value: course.id, label: course.name }))
            ]}
          />

          <FilterInput
            id="start-date"
            label="From Date"
            type="date"
            defaultValue={params.startDate || defaultStartDate.toISOString().split('T')[0]}
            paramName="startDate"
          />

          <FilterInput
            id="end-date"
            label="To Date"
            type="date"
            defaultValue={params.endDate || new Date().toISOString().split('T')[0]}
            paramName="endDate"
          />
        </div>
      </div>

      <ResultsMetrics
        issued={issued}
        emailDelivered={emailDelivered}
        uniqueViews={uniqueViews}
        linkedinClicks={linkedinClicks}
        ctaClicks={ctaClicks}
        deliveryRate={deliveryRate}
        viewRate={viewRate}
        linkedinRate={linkedinRate}
        ctaRate={ctaRate}
      />

      <ResultsTrend trendData={trendData} />

      {perCourse && perCourse.length > 0 && (
        <div className="mt-8 bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Per Course Breakdown</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Course</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Issued</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Delivered</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Viewed</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">LinkedIn</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">CTA</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {perCourse.map((row: any) => (
                    <tr key={row.courseId} className="hover:bg-gray-50">
                      <td className="px-3 py-2 text-sm text-gray-900">
                        <Link
                          href={`/dashboard/results?course=${row.courseId}&startDate=${params.startDate || defaultStartDate.toISOString().split('T')[0]}&endDate=${params.endDate || new Date().toISOString().split('T')[0]}`}
                          className="text-blue-600 hover:underline"
                        >
                          {row.courseName}
                        </Link>
                      </td>
                      <td className="px-3 py-2 text-sm text-right text-gray-900">{row.issued}</td>
                      <td className="px-3 py-2 text-sm text-right text-gray-900">{row.delivered}</td>
                      <td className="px-3 py-2 text-sm text-right text-gray-900">{row.viewed}</td>
                      <td className="px-3 py-2 text-sm text-right text-gray-900">{row.linkedin}</td>
                      <td className="px-3 py-2 text-sm text-right text-gray-900">{row.cta}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

async function generateTrendData(certIds: string[], startDate: Date, endDate: Date) {
  if (certIds.length === 0) return []

  const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
  const buckets = Math.min(daysDiff, 30)
  
  return Array.from({ length: buckets }, (_, i) => {
    const date = new Date(startDate)
    date.setDate(date.getDate() + i)
    return {
      date: date.toISOString().split('T')[0],
      issued: 0,
      viewed: 0,
    }
  })
}

async function getPerCourseMetrics(academyId: string, startDate: Date, endDate: Date) {
  const certs = await db
    .select({
      id: certificates.id,
      courseId: certificates.courseId,
      isPreview: certificates.isPreview,
    })
    .from(certificates)
    .where(
      and(
        eq(certificates.academyId, academyId),
        gte(certificates.issueDate, startDate),
        lte(certificates.issueDate, endDate)
      )
    )

  const allCourses = await db
    .select()
    .from(courses)
    .where(eq(courses.academyId, academyId))

  const courseMap = new Map(allCourses.map(c => [c.id, c.name]))

  const certsByCourse = new Map<string, string[]>()
  certs.filter(c => !c.isPreview).forEach(cert => {
    if (!certsByCourse.has(cert.courseId)) {
      certsByCourse.set(cert.courseId, [])
    }
    certsByCourse.get(cert.courseId)!.push(cert.id)
  })

  const results = []
  for (const [courseId, certIds] of certsByCourse) {
    const eventsData = await db
      .select({
        type: events.type,
      })
      .from(events)
      .where(
        and(
          sql`${events.certificateId} = ANY(ARRAY[${sql.join(certIds.map(id => sql`${id}`), sql`, `)}]::uuid[])`,
          eq(events.isBot, false)
        )
      )

    results.push({
      courseId,
      courseName: courseMap.get(courseId) || 'Unknown',
      issued: certIds.length,
      delivered: eventsData.filter(e => e.type === 'email_delivered').length,
      viewed: new Set(eventsData.filter(e => e.type === 'page_view')).size,
      linkedin: eventsData.filter(e => e.type === 'linkedin_add_click').length,
      cta: eventsData.filter(e => e.type === 'cta_click').length,
    })
  }

  return results.sort((a, b) => b.issued - a.issued)
}
