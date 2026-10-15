import { requireAuth } from '@/lib/utils/session'
import { db } from '@/lib/db'
import { courses, certificates, events } from '@/lib/db/schema'
import { eq, and, desc, sql } from 'drizzle-orm'
import Link from 'next/link'

export default async function ProgramsPage() {
  const user = await requireAuth()

  const allCourses = await db
    .select({
      course: courses,
    })
    .from(courses)
    .where(eq(courses.academyId, user.academyId))
    .orderBy(desc(courses.createdAt))

  // Get certificate counts and engagement metrics for each program
  const coursesWithStats = await Promise.all(
    allCourses.map(async ({ course }) => {
      const [unpublishedResult] = await db
        .select({ count: sql<number>`cast(count(*) as int)` })
        .from(certificates)
        .where(
          and(
            eq(certificates.courseId, course.id),
            eq(certificates.status, 'unpublished')
          )
        )

      const [totalResult] = await db
        .select({ count: sql<number>`cast(count(*) as int)` })
        .from(certificates)
        .where(eq(certificates.courseId, course.id))

      // Get all certificate IDs for this program
      const certIds = await db
        .select({ id: certificates.id })
        .from(certificates)
        .where(and(
          eq(certificates.courseId, course.id),
          eq(certificates.isPreview, false)
        ))

      const ids = certIds.map(c => c.id)

      // Get engagement events for these certificates
      const engagementData = ids.length > 0 ? await db
        .select({
          type: events.type,
        })
        .from(events)
        .where(
          and(
            sql`${events.certificateId} = ANY(ARRAY[${sql.join(ids.map(id => sql`${id}`), sql`, `)}]::uuid[])`,
            eq(events.isBot, false)
          )
        )
        : []

      const views = engagementData.filter(e => e.type === 'page_view').length
      const linkedinClicks = engagementData.filter(e => e.type === 'linkedin_add_click').length

      return {
        ...course,
        unpublishedCount: unpublishedResult?.count || 0,
        totalCertificates: totalResult?.count || 0,
        views,
        linkedinClicks,
      }
    })
  )

  return (
    <div className="px-4 sm:px-0">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Certificate Programs</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage program settings, templates and defaults
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex gap-3">
          <Link
            href="/dashboard/certificates/issue"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            Issue Certificate
          </Link>
          <Link
            href="/dashboard/courses/new"
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Create Program
          </Link>
        </div>
      </div>

      <div className="mt-8">
        {coursesWithStats.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
            <h3 className="mt-2 text-sm font-semibold text-gray-900">No programs yet</h3>
            <p className="mt-1 text-sm text-gray-500">Programs will be created automatically when you issue certificates, or create one with custom settings here.</p>
            <div className="mt-6 flex gap-3 justify-center">
              <Link
                href="/dashboard/certificates/issue"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                Issue Certificate
              </Link>
              <Link
                href="/dashboard/courses/new"
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Create Program
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {coursesWithStats.map((course) => (
                <li key={course.id}>
                  <Link
                    href={`/dashboard/courses/${course.id}`}
                    className="block hover:bg-gray-50"
                  >
                    <div className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-blue-600 truncate">
                            {course.name}
                          </p>
                          <p className="mt-1 text-sm text-gray-500">
                            {course.description || 'No description'}
                          </p>
                          <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-gray-500">
                            <span>
                              Issued: {course.totalCertificates}
                            </span>
                            <span>
                              Views: {course.views}
                            </span>
                            <span>
                              LinkedIn clicks: {course.linkedinClicks}
                            </span>
                            {course.unpublishedCount > 0 && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                {course.unpublishedCount} unpublished
                              </span>
                            )}
                          </div>
                        </div>
                        <div>
                          <svg
                            className="h-5 w-5 text-gray-400"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
