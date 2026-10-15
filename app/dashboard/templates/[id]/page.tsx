import { requireAuth } from '@/lib/utils/session'
import { db } from '@/lib/db'
import { templates } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { notFound } from 'next/navigation'
import TemplateBuilder from './builder'

export default async function EditTemplatePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const user = await requireAuth()
  const { id } = await params

  const [template] = await db
    .select()
    .from(templates)
    .where(and(eq(templates.id, id), eq(templates.academyId, user.academyId)))
    .limit(1)

  if (!template) {
    notFound()
  }

  return (
    <TemplateBuilder template={template} academyId={user.academyId} />
  )
}
