'use server'

import { db } from '@/lib/db'
import { templates } from '@/lib/db/schema'
import { STARTER_TEMPLATES, getDefaultDesignConfig } from '@/lib/certificate-builder/types'

export async function createTemplateFromStarterAction(starterKey: string, academyId: string) {
  try {
    const starterConfig = STARTER_TEMPLATES[starterKey]
    if (!starterConfig) {
      return { error: 'Invalid starter template' }
    }

    const designConfig = {
      ...getDefaultDesignConfig(),
      ...starterConfig,
    }

    const starterNames: Record<string, string> = {
      modern: 'Modern Template',
      classic: 'Classic Template',
      minimal: 'Minimal Template',
      bold: 'Bold Template',
    }

    const [template] = await db
      .insert(templates)
      .values({
        academyId,
        name: starterNames[starterKey] || 'New Template',
        isDefault: false,
        layout: 'letter',
        designConfig,
        bodyText: designConfig.bodyText,
        emailSubject: 'Your {{program_name}} Certificate',
        emailBody: `Congratulations!

You have successfully completed {{program_name}}.

Your certificate is now available. Click the button below to view your certificate and add it to your LinkedIn profile.`,
        version: 1,
      })
      .returning()

    return { success: true, templateId: template.id }
  } catch (error) {
    console.error('Failed to create template from starter:', error)
    return { error: 'Failed to create template' }
  }
}
