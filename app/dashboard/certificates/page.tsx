import { requireAuth } from '@/lib/utils/session'
import { db } from '@/lib/db'
import { certificates, courses, learners } from '@/lib/db/schema'
import { eq, and, desc, like, or } from 'drizzle-orm'
import Link from 'next/link'
import { formatDate } from '@/lib/utils/helpers'
import PublishButton from './publish-button'

export default async function CertificatesPage({
  searchParams,
}: {
  searchParams: Promise<{ course?: string; status?: string; search?: string }>
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
    .orderBy(desc(certificates.createdAt))
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

  const results = await query.limit(100)

  const allCourses = await db
    .select()
    .from(courses)
    .where(eq(courses.academyId, user.academyId))

  const unpublishedCerts = results.filter(r => r.certificate.status === 'unpublished')

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
        {unpublishedCerts.length > 0 && (
          <PublishButton certificateIds={unpublishedCerts.map(c => c.certificate.id)} />
        )}
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="course-filter" className="block text-sm font-medium text-gray-700 mb-1">
            Filter by Course
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
            Filter by Status
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
      </div>

      {results.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
          <h3 className="mt-2 text-sm font-semibold text-gray-900">No certificates found</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by issuing your first certificate.</p>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {results.map(({ certificate, course, learner }) => (
              <li key={certificate.id}>
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
                      </div>
                      <div className="mt-2 flex items-center text-sm text-gray-500">
                        <span className="mr-4">{course.name}</span>
                        <span className="mr-4">#{certificate.number}</span>
                        <span className="mr-4">{learner.email}</span>
                      </div>
                      <div className="mt-1 text-sm text-gray-500">
                        Issued: {formatDate(certificate.issueDate)}
                        {certificate.expiryDate && ` • Expires: ${formatDate(certificate.expiryDate)}`}
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
