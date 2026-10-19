'use server'

import { db } from '@/lib/db'
import { templates } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

export async function saveTemplateDesign(templateId: string, design: any) {
  try {
    await db
      .update(templates)
      .set({
        designConfig: design,
        updatedAt: new Date(),
      })
      .where(eq(templates.id, templateId))

    revalidatePath(`/dashboard/templates/${templateId}`)
    revalidatePath('/dashboard/templates')
    
    return { success: true }
  } catch (error) {
    console.error('Failed to save template design:', error)
    return { error: 'Failed to save design' }
  }
}
