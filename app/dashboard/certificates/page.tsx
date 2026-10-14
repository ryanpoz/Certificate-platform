import { requireAuth } from '@/lib/utils/session'
import { db } from '@/lib/db'
import { certificates, courses, learners, events } from '@/lib/db/schema'
import { eq, and, desc, like, or, gte, lte, inArray, sql } from 'drizzle-orm'
import Link from 'next/link'
import { formatDate } from '@/lib/utils/helpers'
import BulkActions from './bulk-actions'
import EngagementIcons from './engagement-icons'

export default async function CertificatesPage({
  searchParams,
}: {
  searchParams: Promise<{ 
    course?: string
    status?: string
    search?: string
    startDate?: string
    endDate?: string
    engagement?: string
  }>
}) {
  const user = await requireAuth()
  const params = await searchParams

  let query = db
    .select({
      certificate: certificates,
      course: courses,
      learner: learners,
    })
    .from(certificates)
    .innerJoin(courses, eq(certificates.courseId, courses.id))
    .innerJoin(learners, eq(certificates.learnerId, learners.id))
    .where(eq(certificates.academyId, user.academyId))
    .$dynamic()

  if (params.course) {
    query = query.where(eq(certificates.courseId, params.course))
  }

  if (params.status) {
    query = query.where(eq(certificates.status, params.status))
  }

  if (params.search) {
    query = query.where(
      or(
        like(learners.fullName, `%${params.search}%`),
        like(learners.email, `%${params.search}%`),
        like(certificates.number, `%${params.search}%`)
      )
    )
  }

  if (params.startDate) {
    query = query.where(gte(certificates.issueDate, new Date(params.startDate)))
  }

  if (params.endDate) {
    query = query.where(lte(certificates.issueDate, new Date(params.endDate)))
  }

  const results = await query.orderBy(desc(certificates.createdAt)).limit(100)

  const certIds = results.map(r => r.certificate.id)
  
  const engagementData = certIds.length > 0 ? await db
    .select({
      certificateId: events.certificateId,
      type: events.type,
    })
    .from(events)
    .where(
      and(
        inArray(events.certificateId, certIds),
        inArray(events.type, ['email_delivered', 'page_view', 'linkedin_add_click', 'cta_click'])
      )
    )
    : []

  const engagement = new Map<string, Set<string>>()
  engagementData.forEach(e => {
    if (!e.certificateId) return
    if (!engagement.has(e.certificateId)) {
      engagement.set(e.certificateId, new Set())
    }
    engagement.get(e.certificateId)!.add(e.type)
  })

  if (params.engagement) {
    const filtered = results.filter(r => {
      const eng = engagement.get(r.certificate.id)
      return eng && eng.has(params.engagement!)
    })
    results.length = 0
    results.push(...filtered)
  }

  const allCourses = await db
    .select()
    .from(courses)
    .where(eq(courses.academyId, user.academyId))

  const unpublishedCerts = results.filter(r => r.certificate.status === 'unpublished')
  const selectedIds = results.map(r => r.certificate.id)

  return (
    <div className="px-4 sm:px-0">
      <div className="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Certificates</h1>
          <p className="mt-2 text-sm text-gray-700">
            {results.length} certificate{results.length !== 1 ? 's' : ''}
            {params.status === 'unpublished' && ` (${unpublishedCerts.length} unpublished)`}
          </p>
        </div>
        {results.length > 0 && (
          <BulkActions certificateIds={selectedIds} hasUnpublished={unpublishedCerts.length > 0} />
        )}
      </div>

      <div className="mb-6 bg-white p-4 rounded-lg shadow-sm border space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <div>
            <label htmlFor="course-filter" className="block text-sm font-medium text-gray-700 mb-1">
              Course
            </label>
            <select
              id="course-filter"
              defaultValue={params.course || ''}
              onChange={(e) => {
                const url = new URL(window.location.href)
                if (e.target.value) {
                  url.searchParams.set('course', e.target.value)
                } else {
                  url.searchParams.delete('course')
                }
                window.location.href = url.toString()
              }}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
            >
              <option value="">All Courses</option>
              {allCourses.map(course => (
                <option key={course.id} value={course.id}>
                  {course.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              id="status-filter"
              defaultValue={params.status || ''}
              onChange={(e) => {
                const url = new URL(window.location.href)
                if (e.target.value) {
                  url.searchParams.set('status', e.target.value)
                } else {
                  url.searchParams.delete('status')
                }
                window.location.href = url.toString()
              }}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
            >
              <option value="">All Statuses</option>
              <option value="unpublished">Unpublished</option>
              <option value="published">Published</option>
              <option value="revoked">Revoked</option>
            </select>
          </div>

          <div>
            <label htmlFor="start-date" className="block text-sm font-medium text-gray-700 mb-1">
              From Date
            </label>
            <input
              type="date"
              id="start-date"
              defaultValue={params.startDate || ''}
              onChange={(e) => {
                const url = new URL(window.location.href)
                if (e.target.value) {
                  url.searchParams.set('startDate', e.target.value)
                } else {
                  url.searchParams.delete('startDate')
                }
                window.location.href = url.toString()
              }}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
            />
          </div>

          <div>
            <label htmlFor="end-date" className="block text-sm font-medium text-gray-700 mb-1">
              To Date
            </label>
            <input
              type="date"
              id="end-date"
              defaultValue={params.endDate || ''}
              onChange={(e) => {
                const url = new URL(window.location.href)
                if (e.target.value) {
                  url.searchParams.set('endDate', e.target.value)
                } else {
                  url.searchParams.delete('endDate')
                }
                window.location.href = url.toString()
              }}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <input
              type="text"
              id="search"
              defaultValue={params.search || ''}
              placeholder="Name, email, or certificate number"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const url = new URL(window.location.href)
                  const value = (e.target as HTMLInputElement).value
                  if (value) {
                    url.searchParams.set('search', value)
                  } else {
                    url.searchParams.delete('search')
                  }
                  window.location.href = url.toString()
                }
              }}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
            />
          </div>

          <div>
            <label htmlFor="engagement-filter" className="block text-sm font-medium text-gray-700 mb-1">
              Engagement
            </label>
            <select
              id="engagement-filter"
              defaultValue={params.engagement || ''}
              onChange={(e) => {
                const url = new URL(window.location.href)
                if (e.target.value) {
                  url.searchParams.set('engagement', e.target.value)
                } else {
                  url.searchParams.delete('engagement')
                }
                window.location.href = url.toString()
              }}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
            >
              <option value="">All</option>
              <option value="email_delivered">Delivered</option>
              <option value="page_view">Viewed</option>
              <option value="linkedin_add_click">LinkedIn Clicked</option>
              <option value="cta_click">CTA Clicked</option>
            </select>
          </div>
        </div>
      </div>

      {results.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
          <h3 className="mt-2 text-sm font-semibold text-gray-900">No certificates found</h3>
          <p className="mt-1 text-sm text-gray-500">Try adjusting your filters or issue your first certificate.</p>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {results.map(({ certificate, course, learner }) => (
              <li key={certificate.id}>
                <Link
                  href={`/dashboard/certificates/${certificate.id}`}
                  className="block hover:bg-gray-50"
                >
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center">
                          <p className="text-sm font-medium text-blue-600 truncate">
                            {learner.fullName}
                          </p>
                          <span className={`ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            certificate.status === 'published' ? 'bg-green-100 text-green-800' :
                            certificate.status === 'unpublished' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {certificate.status}
                          </span>
                          {certificate.isPreview && (
                            <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                              Preview
                            </span>
                          )}
                        </div>
                        <div className="mt-2 flex items-center text-sm text-gray-500">
                          <span className="mr-4">{course.name}</span>
                          <span className="mr-4">#{certificate.number}</span>
                          <span className="mr-4">{learner.email}</span>
                        </div>
                        <div className="mt-1 text-sm text-gray-500 flex items-center">
                          <span className="mr-4">
                            Issued: {formatDate(certificate.issueDate)}
                          </span>
                          {certificate.expiryDate && (
                            <span className="mr-4">
                              Expires: {formatDate(certificate.expiryDate)}
                            </span>
                          )}
                          {!certificate.isPreview && certificate.status === 'published' && (
                            <EngagementIcons engagement={engagement.get(certificate.id) || new Set()} />
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
  )
}
