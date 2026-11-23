'use server'

import { db } from '@/lib/db'
import { templates, courses } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { accountFor, getSessionAccount } from '@/lib/auth/ownership'

export async function duplicateTemplateAction(templateId: string, academyId: string) {
  try {
    const account = await accountFor(academyId)
    if (!account) {
      return { error: 'Template not found' }
    }
    const [original] = await db
      .select()
      .from(templates)
      .where(and(eq(templates.id, templateId), eq(templates.academyId, account.academyId)))
      .limit(1)

    if (!original) {
      return { error: 'Template not found' }
    }

    await db.insert(templates).values({
      academyId: original.academyId,
      name: `${original.name} (Copy)`,
      isDefault: false,
      layout: original.layout,
      designConfig: original.designConfig,
      backgroundUrl: original.backgroundUrl,
      signatureUrl: original.signatureUrl,
      bodyText: original.bodyText,
      emailSubject: original.emailSubject,
      emailBody: original.emailBody,
      version: 1,
    })

    revalidatePath('/dashboard/templates')
    return { success: true }
  } catch (error) {
    console.error('Failed to duplicate template:', error)
    return { error: 'Failed to duplicate template' }
  }
}

export async function deleteTemplateAction(templateId: string) {
  try {
    const account = await getSessionAccount()
    if (!account) {
      return { error: 'Template not found' }
    }
    const [owned] = await db
      .select({ id: templates.id })
      .from(templates)
      .where(and(eq(templates.id, templateId), eq(templates.academyId, account.academyId)))
      .limit(1)
    if (!owned) {
      return { error: 'Template not found' }
    }

    let usage = null
    try {
      const [result] = await db
        .select({ id: courses.id })
        .from(courses)
        .where(eq(courses.templateId, templateId))
        .limit(1)
      usage = result || null
    } catch (error) {
      console.error('Could not check template usage (migration may be needed):', error)
    }

    if (usage) {
      return { error: 'Cannot delete template that is in use by programs' }
    }

    await db.delete(templates).where(and(eq(templates.id, templateId), eq(templates.academyId, account.academyId)))

    revalidatePath('/dashboard/templates')
    return { success: true }
  } catch (error) {
    console.error('Failed to delete template:', error)
    return { error: 'Failed to delete template' }
  }
}

export async function setDefaultTemplateAction(templateId: string, academyId: string) {
  try {
    const account = await accountFor(academyId)
    if (!account) {
      return { error: 'Template not found' }
    }
    const [owned] = await db
      .select({ id: templates.id })
      .from(templates)
      .where(and(eq(templates.id, templateId), eq(templates.academyId, account.academyId)))
      .limit(1)
    if (!owned) {
      return { error: 'Template not found' }
    }

    await db.update(templates)
      .set({ isDefault: false })
      .where(eq(templates.academyId, account.academyId))

    await db.update(templates)
      .set({ isDefault: true })
      .where(and(eq(templates.id, templateId), eq(templates.academyId, account.academyId)))

    revalidatePath('/dashboard/templates')
    return { success: true }
  } catch (error) {
    console.error('Failed to set default template:', error)
    return { error: 'Failed to set as default' }
  }
}

export async function renameTemplateAction(templateId: string, newName: string) {
  try {
    if (!newName.trim()) {
      return { error: 'Template name cannot be empty' }
    }

    const account = await getSessionAccount()
    if (!account) {
      return { error: 'Template not found' }
    }

    await db.update(templates)
      .set({ name: newName.trim() })
      .where(and(eq(templates.id, templateId), eq(templates.academyId, account.academyId)))

    revalidatePath('/dashboard/templates')
    return { success: true }
  } catch (error) {
    console.error('Failed to rename template:', error)
    return { error: 'Failed to rename template' }
  }
}
