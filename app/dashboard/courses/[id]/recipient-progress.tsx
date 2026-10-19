import { db } from '@/lib/db'
import { certificates, learners, events } from '@/lib/db/schema'
import { eq, and, sql, inArray } from 'drizzle-orm'

interface RecipientProgressProps {
  courseId: string
}

export default async function RecipientProgress({ courseId }: RecipientProgressProps) {
  // Get all issued certificates for this course
  const allCerts = await db
    .select({
      id: certificates.id,
      number: certificates.number,
      learnerId: certificates.learnerId,
      status: certificates.status,
      isPreview: certificates.isPreview,
    })
    .from(certificates)
    .where(and(
      eq(certificates.courseId, courseId),
      eq(certificates.isPreview, false)
    ))

  const issued = allCerts.filter(c => c.status !== 'unpublished').length

  if (issued === 0) {
    return (
      <div className="bg-white shadow sm:rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Recipient Progress</h2>
        <p className="text-sm text-gray-500">No certificates issued yet.</p>
      </div>
    )
  }

  const publishedCertIds = allCerts
    .filter(c => c.status !== 'unpublished')
    .map(c => c.id)

  // Get all events for these certificates
  const allEvents = publishedCertIds.length > 0
    ? await db
        .select({
          certificateId: events.certificateId,
          type: events.type,
          visitorHash: events.visitorHash,
          isBot: events.isBot,
          meta: events.meta,
        })
        .from(events)
        .where(
          and(
            sql`${events.certificateId} = ANY(ARRAY[${sql.join(publishedCertIds.map(id => sql`${id}`), sql`, `)}]::uuid[])`,
            eq(events.isBot, false)
          )
        )
    : []

  // Calculate funnel metrics
  const emailDelivered = new Set(
    allEvents.filter(e => e.type === 'email_delivered').map(e => e.certificateId)
  ).size

  const viewed = new Set(
    allEvents.filter(e => e.type === 'page_view' && e.meta && (e.meta as any).isRecipient).map(e => e.certificateId)
  ).size

  const linkedinClicked = new Set(
    allEvents.filter(e => e.type === 'linkedin_add_click').map(e => e.certificateId)
  ).size

  const pdfDownloaded = new Set(
    allEvents.filter(e => e.type === 'pdf_download').map(e => e.certificateId)
  ).size

  // Calculate percentages (avoid division by zero)
  const deliveredPct = issued > 0 ? ((emailDelivered / issued) * 100).toFixed(1) : '0'
  const viewedPct = issued > 0 ? ((viewed / issued) * 100).toFixed(1) : '0'
  const linkedinPct = issued > 0 ? ((linkedinClicked / issued) * 100).toFixed(1) : '0'
  const pdfPct = issued > 0 ? ((pdfDownloaded / issued) * 100).toFixed(1) : '0'

  // Get recipient details
  const recipientDetails = await Promise.all(
    allCerts.filter(c => c.status !== 'unpublished').map(async (cert) => {
      const [learner] = await db
        .select({
          fullName: learners.fullName,
          email: learners.email,
        })
        .from(learners)
        .where(eq(learners.id, cert.learnerId))
        .limit(1)

      const certEvents = allEvents.filter(e => e.certificateId === cert.id)
      
      const hasDelivered = certEvents.some(e => e.type === 'email_delivered')
      const hasViewed = certEvents.some(e => e.type === 'page_view' && e.meta && (e.meta as any).isRecipient)
      const hasLinkedin = certEvents.some(e => e.type === 'linkedin_add_click')
      const hasPdf = certEvents.some(e => e.type === 'pdf_download')

      let furthestStage = 'Issued'
      if (hasPdf) furthestStage = 'Downloaded PDF'
      else if (hasLinkedin) furthestStage = 'Added to LinkedIn'
      else if (hasViewed) furthestStage = 'Viewed'
      else if (hasDelivered) furthestStage = 'Delivered'

      return {
        name: learner?.fullName || 'Unknown',
        email: learner?.email || 'Unknown',
        status: furthestStage,
      }
    })
  )

  return (
    <div className="bg-white shadow sm:rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-6">Recipient Progress</h2>
        
        {/* Funnel visualization */}
        <div className="space-y-4 mb-8">
          <FunnelStage
            label="Issued"
            count={issued}
            percentage="100"
            description="Certificates created and published"
          />
          <FunnelStage
            label="Email Delivered"
            count={emailDelivered}
            percentage={deliveredPct}
            description="Confirmation emails successfully delivered to recipients"
          />
          <FunnelStage
            label="Certificate Viewed"
            count={viewed}
            percentage={viewedPct}
            description="Recipients who opened and viewed their certificate page"
          />
          <FunnelStage
            label="Added to LinkedIn"
            count={linkedinClicked}
            percentage={linkedinPct}
            description="Recipients who clicked to add certificate to LinkedIn profile"
          />
          <FunnelStage
            label="Downloaded PDF"
            count={pdfDownloaded}
            percentage={pdfPct}
            description="Recipients who downloaded the certificate PDF"
          />
        </div>

        {/* Recipient table */}
        <div className="mt-8">
          <h3 className="text-sm font-medium text-gray-900 mb-4">Recipients ({recipientDetails.length})</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Recipient</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Furthest Stage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {recipientDetails.map((recipient, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-3 py-2 text-sm text-gray-900">{recipient.name}</td>
                    <td className="px-3 py-2 text-sm text-gray-500">{recipient.email}</td>
                    <td className="px-3 py-2 text-sm">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStageColor(recipient.status)}`}>
                        {recipient.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

function FunnelStage({
  label,
  count,
  percentage,
  description,
}: {
  label: string
  count: number
  percentage: string
  description: string
}) {
  return (
    <div className="flex items-center">
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium text-gray-900 group relative">
            {label}
            <span className="ml-1 text-gray-400 cursor-help">ⓘ</span>
            <span className="invisible group-hover:visible absolute left-0 top-6 w-64 p-2 bg-gray-900 text-white text-xs rounded shadow-lg z-10">
              {description}
            </span>
          </span>
          <span className="text-sm text-gray-500">
            {count} ({percentage}%)
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    </div>
  )
}

function getStageColor(stage: string): string {
  switch (stage) {
    case 'Downloaded PDF':
      return 'bg-purple-100 text-purple-800'
    case 'Added to LinkedIn':
      return 'bg-blue-100 text-blue-800'
    case 'Viewed':
      return 'bg-green-100 text-green-800'
    case 'Delivered':
      return 'bg-yellow-100 text-yellow-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}
