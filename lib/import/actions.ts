'use server'

import { db } from '@/lib/db'
import { learners, certificates, batches, courses, academies, templates, events } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { normalizeEmail, generateCertificateNumber, calculateExpiryDate } from '@/lib/utils/helpers'
import { revalidatePath } from 'next/cache'

export async function getExistingLearnerEmails(academyId: string, courseId: string): Promise<string[]> {
  const existing = await db
    .select({
      email: learners.emailNormalised,
    })
    .from(certificates)
    .innerJoin(learners, eq(certificates.learnerId, learners.id))
    .where(
      and(
        eq(certificates.academyId, academyId),
        eq(certificates.courseId, courseId)
      )
    )

  return existing.map(l => l.email)
}

export async function createDraftsFromValidation(
  academyId: string,
  courseId: string,
  userId: string,
  validRows: Array<{
    name: string
    email: string
    issueDate: Date
    custom: Record<string, any>
  }>,
  fileName: string,
  columnMap: any
) {
  const [course] = await db
    .select()
    .from(courses)
    .where(eq(courses.id, courseId))
    .limit(1)

  if (!course) {
    throw new Error('Course not found')
  }

  const [batch] = await db
    .insert(batches)
    .values({
      academyId,
      courseId,
      fileName,
      columnMap,
      rowsTotal: validRows.length,
      created: 0,
      skipped: 0,
      errors: 0,
      createdBy: userId,
    })
    .returning()

  let created = 0
  const errors: string[] = []

  for (const row of validRows) {
    try {
      let learner = await db
        .select()
        .from(learners)
        .where(
          and(
            eq(learners.academyId, academyId),
            eq(learners.emailNormalised, row.email)
          )
        )
        .limit(1)

      if (learner.length === 0) {
        const [newLearner] = await db
          .insert(learners)
          .values({
            academyId,
            fullName: row.name,
            email: row.email,
            emailNormalised: row.email,
          })
          .returning()
        learner = [newLearner]
      }

      const expiryDate = calculateExpiryDate(row.issueDate, course.validityMonths)
      const certNumber = generateCertificateNumber(course.code)

      await db.insert(certificates).values({
        number: certNumber,
        academyId,
        courseId,
        learnerId: learner[0].id,
        issueDate: row.issueDate,
        expiryDate,
        status: 'unpublished',
        custom: row.custom,
        batchId: batch.id,
        source: 'upload',
      })

      created++
    } catch (error) {
      errors.push(`Row ${row.name}: ${error}`)
    }
  }

  await db
    .update(batches)
    .set({ created })
    .where(eq(batches.id, batch.id))

  revalidatePath('/dashboard')
  return { batchId: batch.id, created, errors }
}

export async function createSingleCertificate(
  academyId: string,
  courseId: string,
  userId: string,
  data: {
    name: string
    email: string
    issueDate: Date
    custom: Record<string, any>
    publish: boolean
    isPreview?: boolean
  }
) {
  const [course] = await db
    .select()
    .from(courses)
    .where(eq(courses.id, courseId))
    .limit(1)

  if (!course) {
    throw new Error('Course not found')
  }

  const emailNormalised = normalizeEmail(data.email)

  let learner = await db
    .select()
    .from(learners)
    .where(
      and(
        eq(learners.academyId, academyId),
        eq(learners.emailNormalised, emailNormalised)
      )
    )
    .limit(1)

  if (learner.length === 0) {
    const [newLearner] = await db
      .insert(learners)
      .values({
        academyId,
        fullName: data.name,
        email: data.email,
        emailNormalised,
      })
      .returning()
    learner = [newLearner]
  }

  const expiryDate = calculateExpiryDate(data.issueDate, course.validityMonths)
  const certNumber = generateCertificateNumber(course.code)

  const [certificate] = await db
    .insert(certificates)
    .values({
      number: certNumber,
      academyId,
      courseId,
      learnerId: learner[0].id,
      issueDate: data.issueDate,
      expiryDate,
      status: data.publish ? 'published' : 'unpublished',
      custom: data.custom,
      source: 'form',
      publishedAt: data.publish ? new Date() : null,
      isPreview: data.isPreview || false,
    })
    .returning()

  revalidatePath('/dashboard')
  return { certificateId: certificate.id, number: certNumber }
}

export async function publishCertificates(certificateIds: string[]) {
  const publishedAt = new Date()
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  
  for (const certId of certificateIds) {
    const [cert] = await db
      .select({
        certificate: certificates,
        course: courses,
        learner: learners,
        academy: academies,
        template: templates,
      })
      .from(certificates)
      .innerJoin(courses, eq(certificates.courseId, courses.id))
      .innerJoin(learners, eq(certificates.learnerId, learners.id))
      .innerJoin(academies, eq(certificates.academyId, academies.id))
      .leftJoin(templates, eq(courses.templateId, templates.id))
      .where(eq(certificates.id, certId))
      .limit(1)

    if (!cert || cert.certificate.status !== 'unpublished') {
      continue
    }

    await db
      .update(certificates)
      .set({
        status: 'published',
        publishedAt,
      })
      .where(eq(certificates.id, certId))

    if (!cert.certificate.isPreview) {
      const certificateUrl = `${appUrl}/c/${cert.certificate.number}`
      
      const { sendCertificateEmail } = await import('@/lib/email/resend')
      
      const emailResult = await sendCertificateEmail({
        to: cert.learner.email,
        learnerName: cert.learner.fullName,
        courseName: cert.course.name,
        certificateNumber: cert.certificate.number,
        issueDate: cert.certificate.issueDate,
        expiryDate: cert.certificate.expiryDate,
        academyName: cert.academy.name,
        academySenderName: cert.academy.senderName,
        academyReplyTo: cert.academy.replyTo,
        emailSubject: cert.template?.emailSubject || 'Your Certificate is Ready',
        emailBody: cert.template?.emailBody || 'Congratulations! Your certificate is ready.',
        certificateUrl,
      })

      await db.insert(events).values({
        certificateId: cert.certificate.id,
        academyId: cert.academy.id,
        type: emailResult.success ? 'email_delivered' : 'email_bounced',
        at: new Date(),
        meta: { messageId: emailResult.messageId, error: emailResult.error },
      })
    }
  }

  revalidatePath('/dashboard')
  return { published: certificateIds.length }
}
