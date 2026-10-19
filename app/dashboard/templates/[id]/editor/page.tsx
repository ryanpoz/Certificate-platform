import { requireAuth } from '@/lib/utils/session'
import { db } from '@/lib/db'
import { templates } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import EditorPageClient from './editor-client'

export default async function VisualEditorPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const user = await requireAuth()
  const { id } = await params

  const [template] = await db
    .select()
    .from(templates)
    .where(eq(templates.id, id))
    .limit(1)

  if (!template || template.academyId !== user.academyId) {
    redirect('/dashboard/templates')
  }

  return (
    <EditorPageClient
      templateId={id}
      initialDesign={template.designConfig}
    />
  )
}
