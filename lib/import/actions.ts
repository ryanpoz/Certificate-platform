'use server'

import { db } from '@/lib/db'
import { learners, certificates, batches, courses, academies, templates, events } from '@/lib/db/schema'
import { eq, and, inArray, sql } from 'drizzle-orm'
import { normalizeEmail, generateCertificateNumber, calculateExpiryDate } from '@/lib/utils/helpers'
import { revalidatePath } from 'next/cache'
import { checkCanIssue, getAcademyPlan } from '@/lib/billing/usage'
import { effectiveValidityMonths } from '@/lib/billing/entitlements'
import { findOrCreateLearner } from '@/lib/learners'
import { accountFor, getSessionAccount, NOT_FOUND } from '@/lib/auth/ownership'

export async function getExistingLearnerEmails(academyId: string, courseId: string): Promise<string[]> {
  if (!(await accountFor(academyId))) return []
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
  const account = await accountFor(academyId)
  if (!account) {
    throw new Error(NOT_FOUND)
  }
  // Batches are always attributed to the signed-in user
  userId = account.userId

  const [course] = await db
    .select()
    .from(courses)
    .where(and(eq(courses.id, courseId), eq(courses.academyId, academyId)))
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

  // Expiry is a Starter+ feature: new certificates on Free don't expire
  const validityMonths = effectiveValidityMonths(await getAcademyPlan(academyId), course.validityMonths)

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

      const expiryDate = calculateExpiryDate(row.issueDate, validityMonths)
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
): Promise<{ certificateId: string; number: string; error?: undefined } | { error: string; certificateId?: undefined; number?: undefined }> {
  const account = await accountFor(academyId)
  if (!account) {
    return { error: NOT_FOUND }
  }

  if (data.publish && !data.isPreview) {
    const allowance = await checkCanIssue(academyId, 1)
    if (!allowance.allowed) {
      return { error: allowance.message || 'Certificate limit reached' }
    }
  }

  const [course] = await db
    .select()
    .from(courses)
    .where(and(eq(courses.id, courseId), eq(courses.academyId, academyId)))
    .limit(1)

  if (!course) {
    throw new Error('Course not found')
  }

  // Scoped to this account: never match another account's learner by email
  const learner = [await findOrCreateLearner(academyId, data.name, data.email)]

  // Expiry is a Starter+ feature: new certificates on Free don't expire
  const expiryDate = calculateExpiryDate(
    data.issueDate,
    effectiveValidityMonths(await getAcademyPlan(academyId), course.validityMonths)
  )
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

export async function publishCertificates(
  certificateIds: string[]
): Promise<{ published: number; error?: string }> {
  const publishedAt = new Date()
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  if (certificateIds.length === 0) {
    return { published: 0 }
  }

  // Only the signed-in account's own certificates can be published
  const account = await getSessionAccount()
  if (!account) {
    return { published: 0, error: NOT_FOUND }
  }
  const owned = await db
    .select({ id: certificates.id })
    .from(certificates)
    .where(and(inArray(certificates.id, certificateIds), eq(certificates.academyId, account.academyId)))
  if (owned.length !== new Set(certificateIds).size) {
    return { published: 0, error: NOT_FOUND }
  }

  // Usage metering: only real (non-preview) certificates that are still unpublished count
  const pending = await db
    .select({ academyId: certificates.academyId })
    .from(certificates)
    .where(
      and(
        inArray(certificates.id, certificateIds),
        eq(certificates.status, 'unpublished'),
        sql`coalesce(${certificates.isPreview}, false) = false`
      )
    )
  const pendingByAcademy = new Map<string, number>()
  for (const row of pending) {
    pendingByAcademy.set(row.academyId, (pendingByAcademy.get(row.academyId) || 0) + 1)
  }
  for (const [academyId, requested] of pendingByAcademy) {
    const allowance = await checkCanIssue(academyId, requested)
    if (!allowance.allowed) {
      return { published: 0, error: allowance.message || 'Certificate limit reached' }
    }
  }

  let published = 0
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
    published++

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
  return { published }
}
