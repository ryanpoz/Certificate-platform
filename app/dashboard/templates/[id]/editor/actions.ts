'use server'

import { db } from '@/lib/db'
import { templates } from '@/lib/db/schema'
import { and, eq } from 'drizzle-orm'
import { getWritableAccount } from '@/lib/auth/ownership'
import { revalidatePath } from 'next/cache'

export async function saveTemplateDesign(templateId: string, design: any) {
  try {
    const account = await getWritableAccount()
    if (!account) {
      return { error: 'Template not found' }
    }
    const updated = await db
      .update(templates)
      .set({
        designConfig: design,
        updatedAt: new Date(),
      })
      .where(and(eq(templates.id, templateId), eq(templates.academyId, account.academyId)))
      .returning({ id: templates.id })
    if (updated.length === 0) {
      return { error: 'Template not found' }
    }

    revalidatePath(`/dashboard/templates/${templateId}`)
    revalidatePath('/dashboard/templates')
    
    return { success: true }
  } catch (error) {
    console.error('Failed to save template design:', error)
    return { error: 'Failed to save design' }
  }
}
