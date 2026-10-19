import { requireAuth } from '@/lib/utils/session'
import { db } from '@/lib/db'
import { courses, templates, certificates } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import TemplateEditor from './template-editor'

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const user = await requireAuth()
  const { id } = await params

  const [course] = await db
    .select()
    .from(courses)
    .where(and(eq(courses.id, id), eq(courses.academyId, user.academyId)))
    .limit(1)

  if (!course) {
    notFound()
  }

  let template = null
  try {
    if ('templateId' in course && course.templateId) {
      const [tmpl] = await db
        .select()
        .from(templates)
        .where(eq(templates.id, course.templateId))
        .limit(1)
      template = tmpl || null
    }
  } catch (error) {
    console.error('Failed to load template:', error)
  }

  const unpublishedCerts = await db
    .select({ count: certificates.id })
    .from(certificates)
    .where(
      and(
        eq(certificates.courseId, course.id),
        eq(certificates.status, 'unpublished')
      )
    )

  return (
    <div className="px-4 sm:px-0">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{course.name}</h1>
            <p className="mt-2 text-sm text-gray-700">{course.description || 'No description'}</p>
          </div>
          <Link
            href={`/dashboard/courses/${course.id}/issue`}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
          >
            Issue Certificates
          </Link>
        </div>
        
        {unpublishedCerts.length > 0 && (
          <div className="mt-4 rounded-md bg-yellow-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  {unpublishedCerts.length} unpublished certificate{unpublishedCerts.length !== 1 ? 's' : ''}
                </h3>
                <div className="mt-2">
                  <Link
                    href={`/dashboard/certificates?course=${course.id}&status=unpublished`}
                    className="text-sm font-medium text-yellow-800 hover:text-yellow-700 underline"
                  >
                    View and publish
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Course Details</h2>
            <dl className="space-y-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Course Code</dt>
                <dd className="mt-1 text-sm text-gray-900">{course.code}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Validity</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {course.validityMonths ? `${course.validityMonths} months` : 'No expiry'}
                </dd>
              </div>
              {course.ctaLabel && course.ctaUrl && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Call-to-Action</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {course.ctaLabel} → {course.ctaUrl}
                  </dd>
                </div>
              )}
            </dl>
          </div>
        </div>

        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <Link
                href={`/dashboard/courses/${course.id}/issue`}
                className="block w-full text-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
              >
                Issue Certificates
              </Link>
              <Link
                href={`/dashboard/courses/${course.id}/single`}
                className="block w-full text-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Issue Single Certificate
              </Link>
              <Link
                href={`/dashboard/certificates?course=${course.id}`}
                className="block w-full text-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                View All Certificates
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <TemplateEditor course={course} template={template} />
      </div>
    </div>
  )
}
