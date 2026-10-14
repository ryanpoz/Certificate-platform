import { requireAuth } from '@/lib/utils/session'
import { db } from '@/lib/db'
import { courses, certificates } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import Link from 'next/link'

export default async function DashboardPage() {
  const user = await requireAuth()

  const allCourses = await db
    .select()
    .from(courses)
    .where(eq(courses.academyId, user.academyId))
    .orderBy(courses.createdAt)

  const coursesWithStats = await Promise.all(
    allCourses.map(async (course) => {
      const unpublished = await db
        .select({ count: certificates.id })
        .from(certificates)
        .where(
          and(
            eq(certificates.courseId, course.id),
            eq(certificates.status, 'unpublished')
          )
        )

      const total = await db
        .select({ count: certificates.id })
        .from(certificates)
        .where(eq(certificates.courseId, course.id))

      return {
        ...course,
        unpublishedCount: unpublished.length,
        totalCertificates: total.length,
      }
    })
  )

  return (
    <div className="px-4 sm:px-0">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage your courses and certificates
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Link
            href="/dashboard/courses/new"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            Create Course
          </Link>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Your Courses</h2>
        
        {coursesWithStats.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
            <h3 className="mt-2 text-sm font-semibold text-gray-900">No courses yet</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by creating your first course.</p>
            <div className="mt-6">
              <Link
                href="/dashboard/courses/new"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                Create Course
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
                          <div className="mt-2 flex items-center text-sm text-gray-500">
                            <span className="mr-4">
                              Total: {course.totalCertificates} certificates
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
