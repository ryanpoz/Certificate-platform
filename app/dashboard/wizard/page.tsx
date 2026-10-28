import { requireAuth } from '@/lib/utils/session'
import { redirect } from 'next/navigation'
import CertificateWizard from './wizard'
import { db } from '@/lib/db'
import { academies } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export default async function WizardPage({
  searchParams,
}: {
  searchParams: Promise<{ draft?: string; edit?: string }>
}) {
  const user = await requireAuth()
  const params = await searchParams

  const [academy] = await db
    .select()
    .from(academies)
    .where(eq(academies.id, user.academyId))
    .limit(1)

  if (!academy) {
    redirect('/dashboard')
  }

  return (
    <CertificateWizard
      academyId={user.academyId}
      userId={user.id}
      academyName={academy.name}
      userEmail={user.email}
      userName={user.name}
      draftId={params.draft}
      editCourseId={params.edit}
    />
  )
}
