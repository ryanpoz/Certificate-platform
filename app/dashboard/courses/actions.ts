'use server'

import { db } from '@/lib/db'
import { courses, templates, customFields } from '@/lib/db/schema'
import { and, eq } from 'drizzle-orm'
import { accountFor, getWritableAccount, NOT_FOUND } from '@/lib/auth/ownership'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { slugify, validateUrl } from '@/lib/utils/helpers'
import { accountCan, getAcademyPlan } from '@/lib/billing/usage'
import { saveCourseReminders } from '@/lib/reminders/settings'
import { effectiveValidityMonths, can } from '@/lib/billing/entitlements'

export async function createCourse(academyId: string, data: {
  name: string
  code: string
  description: string
  validityMonths: string
  ctaLabel: string
  ctaUrl: string
}) {
  const account = await accountFor(academyId)
  if (!account) {
    return { error: NOT_FOUND }
  }

  if (!data.name || !data.code) {
    return { error: 'Name and code are required' }
  }

  // Expiry is a Starter+ feature: ignored on Free
  const plan = await getAcademyPlan(academyId)
  // The program's own call to action is a Growth+ feature: ignored below Growth
  const canSetCta = can(plan, 'customCta')

  if (canSetCta && data.ctaUrl && !validateUrl(data.ctaUrl)) {
    return { error: 'Please enter a valid CTA URL' }
  }
  const validityMonths = effectiveValidityMonths(plan, data.validityMonths ? parseInt(data.validityMonths) : null)

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
      ctaLabel: canSetCta ? data.ctaLabel || null : null,
      ctaUrl: canSetCta ? data.ctaUrl || null : null,
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

  const account = await getWritableAccount()
  if (!account) {
    return { error: NOT_FOUND }
  }

  // Expiry is a Starter+ feature: on lower plans the stored value is left untouched
  const [existing] = await db
    .select({ academyId: courses.academyId })
    .from(courses)
    .where(and(eq(courses.id, courseId), eq(courses.academyId, account.academyId)))
    .limit(1)
  if (!existing) {
    return { error: NOT_FOUND }
  }
  const canSetExpiry = can(await getAcademyPlan(existing.academyId), 'expiry')
  // Growth+: below Growth the saved CTA label/link are kept untouched (they return on upgrade)
  const canSetCta = can(await getAcademyPlan(existing.academyId), 'customCta')
  if (canSetCta && data.ctaUrl && !validateUrl(data.ctaUrl)) {
    return { error: 'Please enter a valid CTA URL' }
  }
  const validityMonths = data.validityMonths ? parseInt(data.validityMonths) : null

  await db
    .update(courses)
    .set({
      name: data.name,
      code: data.code,
      description: data.description,
      ...(canSetExpiry ? { validityMonths } : {}),
      ...(canSetCta ? { ctaLabel: data.ctaLabel || null, ctaUrl: data.ctaUrl || null } : {}),
    })
    .where(and(eq(courses.id, courseId), eq(courses.academyId, account.academyId)))

  revalidatePath(`/dashboard/courses/${courseId}`)
  return { success: true }
}

export async function updateTemplate(templateId: string, data: {
  bodyText: string
  emailSubject: string
  emailBody: string
}) {
  const account = await getWritableAccount()
  if (!account) {
    return { error: NOT_FOUND }
  }
  await db
    .update(templates)
    .set({
      bodyText: data.bodyText,
      emailSubject: data.emailSubject,
      emailBody: data.emailBody,
    })
    .where(and(eq(templates.id, templateId), eq(templates.academyId, account.academyId)))

  revalidatePath('/dashboard/courses')
  return { success: true }
}

export async function createCustomField(academyId: string, data: {
  key: string
  label: string
  type: string
  showOnCertificate: boolean
}) {
  const account = await accountFor(academyId)
  if (!account) {
    return { error: NOT_FOUND }
  }
  const [field] = await db
    .insert(customFields)
    .values({
      academyId: account.academyId,
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
  const account = await getWritableAccount()
  if (!account) {
    return { error: NOT_FOUND }
  }
  await db
    .delete(customFields)
    .where(and(eq(customFields.id, fieldId), eq(customFields.academyId, account.academyId)))
  revalidatePath('/dashboard/courses')
  return { success: true }
}

/**
 * Turn expiry reminder emails on or off for one program (Growth and up).
 * Below Growth nothing is changed: the saved setting is kept for when the
 * account upgrades.
 */
export async function setCourseReminders(courseId: string, enabled: boolean) {
  const account = await getWritableAccount()
  if (!account) {
    return { error: NOT_FOUND }
  }
  const [existing] = await db
    .select({ id: courses.id })
    .from(courses)
    .where(and(eq(courses.id, courseId), eq(courses.academyId, account.academyId)))
    .limit(1)
  if (!existing) {
    return { error: NOT_FOUND }
  }
  if (!(await accountCan(account.academyId, 'expiryReminders'))) {
    return { error: 'Expiry reminders are available on the Growth plan.', locked: true }
  }
  const saved = await saveCourseReminders(account.academyId, courseId, enabled === true)
  if (!saved.ok) {
    return { error: saved.error }
  }
  revalidatePath(`/dashboard/courses/${courseId}`)
  return { success: true, enabled: enabled === true }
}
