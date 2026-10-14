'use server'

import { db } from '@/lib/db'
import { certificates, events, learners, courses, academies } from '@/lib/db/schema'
import { eq, inArray, and, like, or, gte, lte } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

async function buildFilteredQuery(academyId: string, filters: any) {
  let query = db
    .select({
      id: certificates.id,
    })
    .from(certificates)
    .innerJoin(learners, eq(certificates.learnerId, learners.id))
    .where(eq(certificates.academyId, academyId))
    .$dynamic()

  if (filters.course) {
    query = query.where(eq(certificates.courseId, filters.course))
  }

  if (filters.status) {
    query = query.where(eq(certificates.status, filters.status))
  }

  if (filters.search) {
    query = query.where(
      or(
        like(learners.fullName, `%${filters.search}%`),
        like(learners.email, `%${filters.search}%`),
        like(certificates.number, `%${filters.search}%`)
      )
    )
  }

  if (filters.startDate) {
    query = query.where(gte(certificates.issueDate, new Date(filters.startDate)))
  }

  if (filters.endDate) {
    query = query.where(lte(certificates.issueDate, new Date(filters.endDate)))
  }

  const results = await query
  return results.map(r => r.id)
}

export async function publishCertificatesFiltered(academyId: string, filters: any) {
  const certIds = await buildFilteredQuery(academyId, { ...filters, status: 'unpublished' })
  
  if (certIds.length === 0) {
    return { count: 0 }
  }

  const { publishCertificates } = await import('@/lib/import/actions')
  await publishCertificates(certIds)
  
  revalidatePath('/dashboard/certificates')
  return { count: certIds.length }
}

export async function revokeCertificatesFiltered(academyId: string, filters: any, reason: string) {
  const certIds = await buildFilteredQuery(academyId, filters)
  
  if (certIds.length === 0) {
    return { count: 0 }
  }

  const revokedAt = new Date()
  
  for (const certId of certIds) {
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
  return { count: certIds.length }
}

export async function exportCertificatesToCSVFiltered(academyId: string, filters: any): Promise<string> {
  let query = db
    .select({
      certificate: certificates,
      learner: learners,
      course: courses,
    })
    .from(certificates)
    .innerJoin(learners, eq(certificates.learnerId, learners.id))
    .innerJoin(courses, eq(certificates.courseId, courses.id))
    .where(eq(certificates.academyId, academyId))
    .$dynamic()

  if (filters.course) {
    query = query.where(eq(certificates.courseId, filters.course))
  }

  if (filters.status) {
    query = query.where(eq(certificates.status, filters.status))
  }

  if (filters.search) {
    query = query.where(
      or(
        like(learners.fullName, `%${filters.search}%`),
        like(learners.email, `%${filters.search}%`),
        like(certificates.number, `%${filters.search}%`)
      )
    )
  }

  if (filters.startDate) {
    query = query.where(gte(certificates.issueDate, new Date(filters.startDate)))
  }

  if (filters.endDate) {
    query = query.where(lte(certificates.issueDate, new Date(filters.endDate)))
  }

  const results = await query

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
    'Has Pending Changes',
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
      certificate.pendingChanges ? 'Yes' : 'No',
    ]
  })

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n')

  return csvContent
}

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

  if (cert.status === 'unpublished') {
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
    return { success: true, pendingChanges: false }
  }

  await db
    .update(certificates)
    .set({
      pendingChanges: {
        learnerName: data.learnerName,
        issueDate: data.issueDate.toISOString(),
        custom: data.custom,
      }
    })
    .where(eq(certificates.id, certificateId))

  revalidatePath(`/dashboard/certificates/${certificateId}`)
  revalidatePath('/dashboard/certificates')
  return { success: true, pendingChanges: true }
}

export async function discardPendingChanges(certificateId: string) {
  await db
    .update(certificates)
    .set({ pendingChanges: null })
    .where(eq(certificates.id, certificateId))

  revalidatePath(`/dashboard/certificates/${certificateId}`)
  revalidatePath('/dashboard/certificates')
  return { success: true }
}

export async function republishCertificate(certificateId: string, sendEmail: boolean = false) {
  const [cert] = await db
    .select({
      certificate: certificates,
      learner: learners,
    })
    .from(certificates)
    .innerJoin(learners, eq(certificates.learnerId, learners.id))
    .where(eq(certificates.id, certificateId))
    .limit(1)

  if (!cert) {
    throw new Error('Certificate not found')
  }

  const pendingChanges = cert.certificate.pendingChanges as any

  if (pendingChanges) {
    await db
      .update(learners)
      .set({ fullName: pendingChanges.learnerName })
      .where(eq(learners.id, cert.certificate.learnerId))

    await db
      .update(certificates)
      .set({
        issueDate: new Date(pendingChanges.issueDate),
        custom: pendingChanges.custom,
        pendingChanges: null,
      })
      .where(eq(certificates.id, certificateId))
  }

  if (sendEmail) {
    const [updatedCert] = await db
      .select({
        certificate: certificates,
        learner: learners,
        course: courses,
        academy: academies,
      })
      .from(certificates)
      .innerJoin(learners, eq(certificates.learnerId, learners.id))
      .innerJoin(courses, eq(certificates.courseId, courses.id))
      .innerJoin(academies, eq(certificates.academyId, academies.id))
      .where(eq(certificates.id, certificateId))
      .limit(1)

    if (updatedCert) {
      const { publishCertificates } = await import('@/lib/import/actions')
      await publishCertificates([certificateId])
    }
  }

  revalidatePath(`/dashboard/certificates/${certificateId}`)
  revalidatePath('/dashboard/certificates')
  revalidatePath(`/c/${cert.certificate.number}`)
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
