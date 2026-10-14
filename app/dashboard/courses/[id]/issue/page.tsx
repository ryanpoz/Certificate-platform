import { requireAuth } from '@/lib/utils/session'
import { db } from '@/lib/db'
import { courses } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { notFound } from 'next/navigation'
import BulkIssuePage from './bulk-issue'

export default async function IssuePage({
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

  return <BulkIssuePage course={course} academyId={user.academyId} userId={user.id} />
}
