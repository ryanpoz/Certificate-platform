'use server'

import { db } from '@/lib/db'
import { courses, learners, certificates, templates, academies } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { generateCertificateNumber, normalizeEmail } from '@/lib/utils/helpers'
import { sendCertificateEmail } from '@/lib/email/resend'

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
      .where(eq(courses.id, courseId))
      .limit(1)

    if (!course) {
      return { error: 'Program not found' }
    }

    let template = null
    try {
      if ('templateId' in course && course.templateId) {
        const [tmpl] = await db.select().from(templates).where(eq(templates.id, course.templateId)).limit(1)
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

    const emailNorm = normalizeEmail(data.learnerEmail)
    let [learner] = await db
      .select()
      .from(learners)
      .where(eq(learners.emailNormalised, emailNorm))
      .limit(1)

    if (!learner) {
      ;[learner] = await db
        .insert(learners)
        .values({
          academyId: data.academyId,
          fullName: data.learnerName,
          email: data.learnerEmail,
          emailNormalised: emailNorm,
        })
        .returning()
    }

    const certificateNumber = generateCertificateNumber(course.code)

    const [certificate] = await db
      .insert(certificates)
      .values({
        academyId: data.academyId,
        courseId,
        learnerId: learner.id,
        number: certificateNumber,
        issueDate: new Date(data.issueDate),
        expiryDate: course.validityMonths
          ? new Date(new Date(data.issueDate).setMonth(new Date(data.issueDate).getMonth() + course.validityMonths))
          : null,
        status: 'published',
        source: 'manual',
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
    })

    return { success: true, certificateUrl }
  } catch (error) {
    console.error('Failed to issue certificate:', error)
    return { error: 'Failed to issue certificate' }
  }
}
