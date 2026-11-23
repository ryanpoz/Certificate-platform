'use server'

import { db } from '@/lib/db'
import { templates } from '@/lib/db/schema'
import { and, eq } from 'drizzle-orm'
import { getWritableAccount } from '@/lib/auth/ownership'

export async function updateTemplateAction(
  templateId: string,
  data: {
    name: string
    designConfig: any
    bodyText: string
  }
) {
  try {
    const account = await getWritableAccount()
    if (!account) {
      return { error: 'Template not found' }
    }
    const updated = await db
      .update(templates)
      .set({
        name: data.name,
        designConfig: data.designConfig,
        bodyText: data.bodyText,
        updatedAt: new Date(),
      })
      .where(and(eq(templates.id, templateId), eq(templates.academyId, account.academyId)))
      .returning({ id: templates.id })
    if (updated.length === 0) {
      return { error: 'Template not found' }
    }

    return { success: true }
  } catch (error) {
    console.error('Failed to update template:', error)
    return { error: 'Failed to update template' }
  }
}
