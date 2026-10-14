import { requireAuth } from '@/lib/utils/session'
import { db } from '@/lib/db'
import { courses } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { notFound } from 'next/navigation'
import SingleCertificateForm from './form'

export default async function SingleIssuePage({
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

  return (
    <div className="px-4 sm:px-0">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Issue Single Certificate</h1>
        <p className="mt-2 text-sm text-gray-700">
          Issue a certificate to one learner for {course.name}
        </p>
      </div>

      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <SingleCertificateForm course={course} academyId={user.academyId} userId={user.id} />
        </div>
      </div>
    </div>
  )
}
