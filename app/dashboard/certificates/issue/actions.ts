'use server'

import { db } from '@/lib/db'
import { courses, learners, certificates, templates, academies } from '@/lib/db/schema'
import { and, eq } from 'drizzle-orm'
import { generateCertificateNumber } from '@/lib/utils/helpers'
import { getCurrentUser } from '@/lib/utils/session'
import { findOrCreateLearner } from '@/lib/learners'
import { getAcademyPlan } from '@/lib/billing/usage'
import { effectiveValidityMonths } from '@/lib/billing/entitlements'
import { sendCertificateEmail } from '@/lib/email/resend'
import { checkCanIssue, getEmailBranding } from '@/lib/billing/usage'

export async function issueSingleCertificateAction(data: {
  learnerName: string
  learnerEmail: string
  issueDate: string
  programId?: string
  newProgramName?: string
  defaultTemplateId: string
  academyId: string
  userId: string
}) {
  try {
    // Only issue for the signed-in user's own account
    const user = await getCurrentUser()
    if (!user || user.academyId !== data.academyId) {
      return { error: 'Not authorised to issue for this account' }
    }

    const allowance = await checkCanIssue(data.academyId, 1)
    if (!allowance.allowed) {
      return { error: allowance.message, limitReached: true }
    }

    let courseId = data.programId

    if (!courseId && data.newProgramName) {
      const programCode = data.newProgramName
        .toUpperCase()
        .replace(/[^A-Z0-9]+/g, '')
        .substring(0, 10) || 'CERT'

      const [newCourse] = await db
        .insert(courses)
        .values({
          academyId: data.academyId,
          name: data.newProgramName,
          code: programCode,
          templateId: data.defaultTemplateId,
          validityMonths: null,
          ctaLabel: null,
          ctaUrl: null,
        })
        .returning()

      courseId = newCourse.id
    }

    if (!courseId) {
      return { error: 'Program is required' }
    }

    const [course] = await db
      .select()
      .from(courses)
      .where(and(eq(courses.id, courseId), eq(courses.academyId, data.academyId)))
      .limit(1)

    if (!course) {
      return { error: 'Program not found' }
    }

    let template = null
    try {
      if ('templateId' in course && course.templateId) {
        const [tmpl] = await db
          .select()
          .from(templates)
          .where(and(eq(templates.id, course.templateId), eq(templates.academyId, data.academyId)))
          .limit(1)
        template = tmpl || null
      }
      if (!template) {
        const [fallback] = await db.select().from(templates).where(eq(templates.academyId, data.academyId)).limit(1)
        template = fallback || null
      }
    } catch (error) {
      console.error('Failed to load template:', error)
    }

    if (!template) {
      return { error: 'No template found' }
    }

    // Scoped to this account: never match another account's learner by email
    const learner = await findOrCreateLearner(data.academyId, data.learnerName, data.learnerEmail)

    // Expiry is a Starter+ feature: new certificates on Free don't expire
    const validityMonths = effectiveValidityMonths(await getAcademyPlan(data.academyId), course.validityMonths)

    const certificateNumber = generateCertificateNumber(course.code)

    const [certificate] = await db
      .insert(certificates)
      .values({
        academyId: data.academyId,
        courseId,
        learnerId: learner.id,
        number: certificateNumber,
        issueDate: new Date(data.issueDate),
        expiryDate: validityMonths
          ? new Date(new Date(data.issueDate).setMonth(new Date(data.issueDate).getMonth() + validityMonths))
          : null,
        status: 'published',
        source: 'manual',
        publishedAt: new Date(),
      })
      .returning()

    const [academy] = await db
      .select()
      .from(academies)
      .where(eq(academies.id, data.academyId))
      .limit(1)

    const appUrl = process.env.NEXT_PUBLIC_APP_URL!
    const certificateUrl = `${appUrl}/c/${certificate.number}`

    await sendCertificateEmail({
      to: data.learnerEmail,
      learnerName: data.learnerName,
      courseName: course.name,
      certificateNumber,
      issueDate: new Date(data.issueDate),
      expiryDate: certificate.expiryDate,
      academyName: academy?.name || 'Academy',
      academySenderName: academy?.senderName || 'Academy',
      academyReplyTo: academy?.replyTo || 'support@example.com',
      emailSubject: template.emailSubject,
      emailBody: template.emailBody,
      certificateUrl,
      branding: await getEmailBranding(data.academyId),
    })

    return { success: true, certificateUrl }
  } catch (error) {
    console.error('Failed to issue certificate:', error)
    return { error: 'Failed to issue certificate' }
  }
}
