import { db } from '@/lib/db'
import { certificates, courses, learners, academies, templates } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { notFound } from 'next/navigation'
import { formatDate } from '@/lib/utils/helpers'
import CertificateView from './certificate-view'

export default async function CertificatePage({
  params,
  searchParams,
}: {
  params: Promise<{ number: string }>
  searchParams: Promise<{ preview?: string }>
}) {
  const { number } = await params
  const { preview } = await searchParams

  const [result] = await db
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
    .where(eq(certificates.number, number))
    .limit(1)

  if (!result) {
    notFound()
  }

  const { certificate, course, learner, academy, template } = result

  const isExpired = certificate.expiryDate && new Date() > certificate.expiryDate
  const status = certificate.status === 'revoked' ? 'revoked' : isExpired ? 'expired' : 'valid'

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const certificateUrl = `${appUrl}/c/${certificate.number}`

  return (
    <>
      <CertificateView
        certificate={{
          number: certificate.number,
          issueDate: certificate.issueDate,
          expiryDate: certificate.expiryDate,
          status,
          revokedAt: certificate.revokedAt,
          revokeReason: certificate.revokeReason,
          custom: certificate.custom as Record<string, any>,
          isPreview: certificate.isPreview || false,
        }}
        learner={{
          fullName: learner.fullName,
        }}
        course={{
          id: course.id,
          name: course.name,
          code: course.code,
          ctaLabel: course.ctaLabel,
          ctaUrl: course.ctaUrl,
        }}
        academy={{
          name: academy.name,
          brandColor: academy.brandColor || '#2563eb',
          website: academy.website,
        }}
        template={{
          bodyText: template?.bodyText || '',
          designConfig: template?.designConfig as any,
        }}
        certificateUrl={certificateUrl}
        isPreviewMode={preview === 'true'}
      />
    </>
  )
}

export async function generateMetadata({ params }: { params: Promise<{ number: string }> }) {
  const { number } = await params

  const [result] = await db
    .select({
      certificate: certificates,
      course: courses,
      learner: learners,
      academy: academies,
    })
    .from(certificates)
    .innerJoin(courses, eq(certificates.courseId, courses.id))
    .innerJoin(learners, eq(certificates.learnerId, learners.id))
    .innerJoin(academies, eq(certificates.academyId, academies.id))
    .where(eq(certificates.number, number))
    .limit(1)

  if (!result) {
    return {
      title: 'Certificate Not Found',
    }
  }

  const { learner, course, academy } = result

  return {
    title: `${learner.fullName} - ${course.name} Certificate`,
    description: `Certificate of completion for ${course.name} issued by ${academy.name}`,
    openGraph: {
      title: `${learner.fullName} - ${course.name}`,
      description: `Certified by ${academy.name}`,
      type: 'website',
    },
  }
}
