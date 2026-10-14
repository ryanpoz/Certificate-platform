import { requireAuth } from '@/lib/utils/session'
import { db } from '@/lib/db'
import { certificates, courses, learners, events } from '@/lib/db/schema'
import { eq, and, desc } from 'drizzle-orm'
import { notFound } from 'next/navigation'
import { formatDate } from '@/lib/utils/helpers'
import Link from 'next/link'
import CertificateActions from './actions-panel'
import EventTimeline from './event-timeline'

export default async function CertificateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const user = await requireAuth()
  const { id } = await params

  const [result] = await db
    .select({
      certificate: certificates,
      course: courses,
      learner: learners,
    })
    .from(certificates)
    .innerJoin(courses, eq(certificates.courseId, courses.id))
    .innerJoin(learners, eq(certificates.learnerId, learners.id))
    .where(and(
      eq(certificates.id, id),
      eq(certificates.academyId, user.academyId)
    ))
    .limit(1)

  if (!result) {
    notFound()
  }

  const { certificate, course, learner } = result

  const certificateEvents = await db
    .select()
    .from(events)
    .where(eq(events.certificateId, certificate.id))
    .orderBy(desc(events.at))
    .limit(50)

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const certificateUrl = `${appUrl}/c/${certificate.number}`

  return (
    <div className="px-4 sm:px-0">
      <div className="mb-8">
        <Link
          href="/dashboard/certificates"
          className="text-sm text-blue-600 hover:underline mb-4 inline-block"
        >
          ← Back to Certificates
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{learner.fullName}</h1>
            <p className="mt-1 text-sm text-gray-600">
              {course.name} • #{certificate.number}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              certificate.status === 'published' ? 'bg-green-100 text-green-800' :
              certificate.status === 'unpublished' ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>
              {certificate.status}
            </span>
            {certificate.isPreview && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                Preview
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Certificate Details</h2>
              <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Learner Name</dt>
                  <dd className="mt-1 text-sm text-gray-900">{learner.fullName}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Email</dt>
                  <dd className="mt-1 text-sm text-gray-900">{learner.email}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Course</dt>
                  <dd className="mt-1 text-sm text-gray-900">{course.name}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Certificate Number</dt>
                  <dd className="mt-1 text-sm text-gray-900 font-mono">{certificate.number}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Issue Date</dt>
                  <dd className="mt-1 text-sm text-gray-900">{formatDate(certificate.issueDate)}</dd>
                </div>
                {certificate.expiryDate && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Expiry Date</dt>
                    <dd className="mt-1 text-sm text-gray-900">{formatDate(certificate.expiryDate)}</dd>
                  </div>
                )}
                {certificate.revokedAt && (
                  <>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Revoked On</dt>
                      <dd className="mt-1 text-sm text-gray-900">{formatDate(certificate.revokedAt)}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Revoke Reason</dt>
                      <dd className="mt-1 text-sm text-gray-900">{certificate.revokeReason}</dd>
                    </div>
                  </>
                )}
                {certificate.publishedAt && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Published On</dt>
                    <dd className="mt-1 text-sm text-gray-900">{formatDate(certificate.publishedAt)}</dd>
                  </div>
                )}
                <div>
                  <dt className="text-sm font-medium text-gray-500">Source</dt>
                  <dd className="mt-1 text-sm text-gray-900 capitalize">{certificate.source}</dd>
                </div>
                {certificate.priorCertificateId && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Prior Certificate</dt>
                    <dd className="mt-1 text-sm text-blue-600">
                      <Link href={`/dashboard/certificates/${certificate.priorCertificateId}`}>
                        View Previous
                      </Link>
                    </dd>
                  </div>
                )}
              </dl>

              {certificate.status === 'published' && (
                <div className="mt-6 pt-6 border-t">
                  <dt className="text-sm font-medium text-gray-500 mb-2">Public URL</dt>
                  <dd className="text-sm text-blue-600 break-all">
                    <a href={certificateUrl} target="_blank" rel="noopener noreferrer">
                      {certificateUrl}
                    </a>
                  </dd>
                </div>
              )}
            </div>
          </div>

          <EventTimeline events={certificateEvents} />
        </div>

        <div className="lg:col-span-1">
          <CertificateActions 
            certificateId={certificate.id}
            status={certificate.status}
            learnerName={learner.fullName}
            issueDate={certificate.issueDate}
            custom={certificate.custom as Record<string, any> || {}}
          />
        </div>
      </div>
    </div>
  )
}
