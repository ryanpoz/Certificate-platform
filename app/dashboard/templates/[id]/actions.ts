'use server'

import { db } from '@/lib/db'
import { templates } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function updateTemplateAction(
  templateId: string,
  data: {
    name: string
    designConfig: any
    bodyText: string
  }
) {
  try {
    await db
      .update(templates)
      .set({
        name: data.name,
        designConfig: data.designConfig,
        bodyText: data.bodyText,
        updatedAt: new Date(),
      })
      .where(eq(templates.id, templateId))

    return { success: true }
  } catch (error) {
    console.error('Failed to update template:', error)
    return { error: 'Failed to update template' }
  }
}
