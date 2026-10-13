'use server'

import { db } from '@/lib/db'
import { courses, templates, customFields } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { slugify, validateUrl } from '@/lib/utils/helpers'

export async function createCourse(academyId: string, data: {
  name: string
  code: string
  description: string
  validityMonths: string
  ctaLabel: string
  ctaUrl: string
}) {
  if (!data.name || !data.code) {
    return { error: 'Name and code are required' }
  }

  if (data.ctaUrl && !validateUrl(data.ctaUrl)) {
    return { error: 'Please enter a valid CTA URL' }
  }

  const validityMonths = data.validityMonths ? parseInt(data.validityMonths) : null

  const [template] = await db
    .insert(templates)
    .values({
      academyId,
      layout: 'letter',
      bodyText: `This certifies that {{learner.name}} has successfully completed {{course.name}}.

Issued on {{issue_date}}
Certificate Number: {{certificate.number}}
${validityMonths ? 'Valid until: {{expiry_date}}' : ''}`,
      emailSubject: 'Your {{course.name}} Certificate',
      emailBody: `Hi {{learner.name}},

Congratulations on completing {{course.name}}!

Your certificate is ready. View and download it here: [Certificate Link]

Certificate Number: {{certificate.number}}
Issue Date: {{issue_date}}
${validityMonths ? 'Expiry Date: {{expiry_date}}' : ''}`,
    })
    .returning()

  const [course] = await db
    .insert(courses)
    .values({
      academyId,
      name: data.name,
      code: data.code,
      description: data.description,
      validityMonths,
      ctaLabel: data.ctaLabel || null,
      ctaUrl: data.ctaUrl || null,
      templateId: template.id,
    })
    .returning()

  revalidatePath('/dashboard')
  return { courseId: course.id }
}

export async function updateCourse(courseId: string, data: {
  name: string
  code: string
  description: string
  validityMonths: string
  ctaLabel: string
  ctaUrl: string
}) {
  if (!data.name || !data.code) {
    return { error: 'Name and code are required' }
  }

  if (data.ctaUrl && !validateUrl(data.ctaUrl)) {
    return { error: 'Please enter a valid CTA URL' }
  }

  const validityMonths = data.validityMonths ? parseInt(data.validityMonths) : null

  await db
    .update(courses)
    .set({
      name: data.name,
      code: data.code,
      description: data.description,
      validityMonths,
      ctaLabel: data.ctaLabel || null,
      ctaUrl: data.ctaUrl || null,
    })
    .where(eq(courses.id, courseId))

  revalidatePath(`/dashboard/courses/${courseId}`)
  return { success: true }
}

export async function updateTemplate(templateId: string, data: {
  bodyText: string
  emailSubject: string
  emailBody: string
}) {
  await db
    .update(templates)
    .set({
      bodyText: data.bodyText,
      emailSubject: data.emailSubject,
      emailBody: data.emailBody,
    })
    .where(eq(templates.id, templateId))

  revalidatePath('/dashboard/courses')
  return { success: true }
}

export async function createCustomField(academyId: string, data: {
  key: string
  label: string
  type: string
  showOnCertificate: boolean
}) {
  const [field] = await db
    .insert(customFields)
    .values({
      academyId,
      key: slugify(data.key),
      label: data.label,
      type: data.type,
      showOnCertificate: data.showOnCertificate,
    })
    .returning()

  revalidatePath('/dashboard/courses')
  return { field }
}

export async function deleteCustomField(fieldId: string) {
  await db.delete(customFields).where(eq(customFields.id, fieldId))
  revalidatePath('/dashboard/courses')
  return { success: true }
}
