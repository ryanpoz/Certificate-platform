'use server'

import { db } from '@/lib/db'
import { certificates, events, learners, courses, academies } from '@/lib/db/schema'
import { eq, inArray, and } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

export async function revokeCertificates(certificateIds: string[], reason: string) {
  const revokedAt = new Date()
  
  for (const certId of certificateIds) {
    await db
      .update(certificates)
      .set({
        status: 'revoked',
        revokedAt,
        revokeReason: reason,
      })
      .where(eq(certificates.id, certId))
  }

  revalidatePath('/dashboard/certificates')
  return { revoked: certificateIds.length }
}

export async function exportCertificatesToCSV(certificateIds: string[]): Promise<string> {
  const results = await db
    .select({
      certificate: certificates,
      learner: learners,
      course: courses,
    })
    .from(certificates)
    .innerJoin(learners, eq(certificates.learnerId, learners.id))
    .innerJoin(courses, eq(certificates.courseId, courses.id))
    .where(inArray(certificates.id, certificateIds))

  const certIds = results.map(r => r.certificate.id)
  const engagementData = certIds.length > 0 ? await db
    .select({
      certificateId: events.certificateId,
      type: events.type,
    })
    .from(events)
    .where(
      and(
        inArray(events.certificateId, certIds),
        inArray(events.type, ['email_delivered', 'page_view', 'linkedin_add_click', 'cta_click'])
      )
    )
    : []

  const engagement = new Map<string, Set<string>>()
  engagementData.forEach(e => {
    if (!e.certificateId) return
    if (!engagement.has(e.certificateId)) {
      engagement.set(e.certificateId, new Set())
    }
    engagement.get(e.certificateId)!.add(e.type)
  })

  const headers = [
    'Certificate Number',
    'Learner Name',
    'Email',
    'Course',
    'Issue Date',
    'Expiry Date',
    'Status',
    'Email Delivered',
    'Page Viewed',
    'LinkedIn Clicked',
    'CTA Clicked',
    'Is Preview',
  ]

  const rows = results.map(({ certificate, learner, course }) => {
    const eng = engagement.get(certificate.id) || new Set()
    return [
      certificate.number,
      learner.fullName,
      learner.email,
      course.name,
      certificate.issueDate.toISOString().split('T')[0],
      certificate.expiryDate ? certificate.expiryDate.toISOString().split('T')[0] : '',
      certificate.status,
      eng.has('email_delivered') ? 'Yes' : 'No',
      eng.has('page_view') ? 'Yes' : 'No',
      eng.has('linkedin_add_click') ? 'Yes' : 'No',
      eng.has('cta_click') ? 'Yes' : 'No',
      certificate.isPreview ? 'Yes' : 'No',
    ]
  })

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n')

  return csvContent
}

export async function editCertificate(certificateId: string, data: {
  learnerName: string
  issueDate: Date
  custom: Record<string, any>
}) {
  const [cert] = await db
    .select()
    .from(certificates)
    .where(eq(certificates.id, certificateId))
    .limit(1)

  if (!cert) {
    throw new Error('Certificate not found')
  }

  const [learner] = await db
    .select()
    .from(learners)
    .where(eq(learners.id, cert.learnerId))
    .limit(1)

  await db
    .update(learners)
    .set({ fullName: data.learnerName })
    .where(eq(learners.id, cert.learnerId))

  await db
    .update(certificates)
    .set({
      issueDate: data.issueDate,
      custom: data.custom,
    })
    .where(eq(certificates.id, certificateId))

  revalidatePath(`/dashboard/certificates/${certificateId}`)
  revalidatePath('/dashboard/certificates')
  return { success: true }
}

export async function reissueCertificate(certificateId: string) {
  const [cert] = await db
    .select({
      certificate: certificates,
      course: courses,
      learner: learners,
    })
    .from(certificates)
    .innerJoin(courses, eq(certificates.courseId, courses.id))
    .innerJoin(learners, eq(certificates.learnerId, learners.id))
    .where(eq(certificates.id, certificateId))
    .limit(1)

  if (!cert) {
    throw new Error('Certificate not found')
  }

  const { generateCertificateNumber, calculateExpiryDate } = await import('@/lib/utils/helpers')
  
  const newNumber = generateCertificateNumber(cert.course.code)
  const newIssueDate = new Date()
  const newExpiryDate = calculateExpiryDate(newIssueDate, cert.course.validityMonths)

  const [newCert] = await db
    .insert(certificates)
    .values({
      number: newNumber,
      academyId: cert.certificate.academyId,
      courseId: cert.certificate.courseId,
      learnerId: cert.certificate.learnerId,
      issueDate: newIssueDate,
      expiryDate: newExpiryDate,
      status: 'unpublished',
      custom: cert.certificate.custom,
      source: 'reissue',
      priorCertificateId: cert.certificate.id,
      isPreview: false,
    })
    .returning()

  revalidatePath('/dashboard/certificates')
  return { certificateId: newCert.id, number: newNumber }
}

export async function revokeSingleCertificate(certificateId: string, reason: string) {
  await db
    .update(certificates)
    .set({
      status: 'revoked',
      revokedAt: new Date(),
      revokeReason: reason,
    })
    .where(eq(certificates.id, certificateId))

  revalidatePath(`/dashboard/certificates/${certificateId}`)
  revalidatePath('/dashboard/certificates')
  return { success: true }
}
