import { db } from '@/lib/db'
import { certificates, courses, events } from '@/lib/db/schema'
import { eq, and, sql, gte, lte } from 'drizzle-orm'
import Link from 'next/link'

interface ShareImpactProps {
  academyId: string
  startDate: Date
  endDate: Date
  courseFilter?: string
}

export default async function ShareImpact({
  academyId,
  startDate,
  endDate,
  courseFilter,
}: ShareImpactProps) {
  // Get certificates in date range
  let certsQuery = db
    .select({
      id: certificates.id,
      number: certificates.number,
      courseId: certificates.courseId,
      isPreview: certificates.isPreview,
    })
    .from(certificates)
    .where(
      and(
        eq(certificates.academyId, academyId),
        gte(certificates.issueDate, startDate),
        lte(certificates.issueDate, endDate)
      )
    )
    .$dynamic()

  if (courseFilter) {
    certsQuery = certsQuery.where(eq(certificates.courseId, courseFilter))
  }

  const certs = await certsQuery
  const certIds = certs.filter(c => !c.isPreview).map(c => c.id)

  if (certIds.length === 0) {
    return (
      <div className="bg-white shadow sm:rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Share Impact</h2>
        <p className="text-sm text-gray-500">No certificates issued in this period.</p>
      </div>
    )
  }

  // Get all events for these certificates (audience views only, not recipients)
  const allEvents = await db
    .select({
      certificateId: events.certificateId,
      type: events.type,
      referrer: events.referrer,
      utmData: events.utmData,
      meta: events.meta,
      isBot: events.isBot,
    })
    .from(events)
    .where(
      and(
        sql`${events.certificateId} = ANY(ARRAY[${sql.join(certIds.map(id => sql`${id}`), sql`, `)}]::uuid[])`,
        eq(events.isBot, false)
      )
    )

  // Filter for audience views only (exclude recipient views)
  const audienceViews = allEvents.filter(e => 
    e.type === 'page_view' && 
    (!e.meta || !(e.meta as any).isRecipient)
  )

  // Categorize by source
  const fromLinkedIn = audienceViews.filter(e => 
    (e.referrer && e.referrer.includes('linkedin.com')) ||
    (e.utmData && (e.utmData as any).utm_source === 'linkedin')
  ).length

  const fromTwitter = audienceViews.filter(e => 
    (e.referrer && (e.referrer.includes('twitter.com') || e.referrer.includes('t.co') || e.referrer.includes('x.com'))) ||
    (e.utmData && ((e.utmData as any).utm_source === 'twitter' || (e.utmData as any).utm_source === 'x'))
  ).length

  const fromOther = audienceViews.length - fromLinkedIn - fromTwitter

  // CTA clicks from audience (not recipients)
  const audienceCtaClicks = allEvents.filter(e => 
    e.type === 'cta_click' &&
    (!e.meta || !(e.meta as any).isRecipient)
  ).length

  // Calculate CTR
  const ctr = audienceViews.length > 0 
    ? ((audienceCtaClicks / audienceViews.length) * 100).toFixed(1)
    : '0'

  // Get per-certificate breakdown
  const allCourses = await db
    .select()
    .from(courses)
    .where(eq(courses.academyId, academyId))

  const courseMap = new Map(allCourses.map(c => [c.id, c.name]))

  const perCertificate = certs.filter(c => !c.isPreview).map(cert => {
    const certEvents = allEvents.filter(e => e.certificateId === cert.id)
    
    const certAudienceViews = certEvents.filter(e => 
      e.type === 'page_view' && 
      (!e.meta || !(e.meta as any).isRecipient)
    )
    
    const certCtaClicks = certEvents.filter(e => 
      e.type === 'cta_click' &&
      (!e.meta || !(e.meta as any).isRecipient)
    ).length

    const certCtr = certAudienceViews.length > 0
      ? ((certCtaClicks / certAudienceViews.length) * 100).toFixed(1)
      : '0'

    return {
      certificateNumber: cert.number,
      courseName: courseMap.get(cert.courseId) || 'Unknown',
      views: certAudienceViews.length,
      ctaClicks: certCtaClicks,
      ctr: certCtr,
    }
  }).filter(c => c.views > 0) // Only show certificates with audience views

  return (
    <div className="bg-white shadow sm:rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-6">Share Impact</h2>
        <p className="text-sm text-gray-600 mb-6">
          Measures what sharing brought back: visits from social shares and resulting actions
        </p>

        {/* Total metrics */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <Metric
            label="Audience Visits"
            value={audienceViews.length}
            description="Total visits to certificate pages from shared links (excludes recipients viewing their own)"
          />
          <Metric
            label="From LinkedIn"
            value={fromLinkedIn}
            description="Visits arriving from LinkedIn shares or links"
          />
          <Metric
            label="From X/Twitter"
            value={fromTwitter}
            description="Visits arriving from X (Twitter) shares or links"
          />
          <Metric
            label="Other Sources"
            value={fromOther}
            description="Visits from direct links, other social platforms, or unknown referrers"
          />
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-2 mb-8">
          <Metric
            label="CTA Clicks"
            value={audienceCtaClicks}
            description="Clicks on your company's call-to-action button by audience members"
          />
          <Metric
            label="CTR"
            value={`${ctr}%`}
            description="Click-through rate: percentage of audience visitors who clicked the CTA"
          />
        </div>

        {/* Per-certificate breakdown */}
        {perCertificate.length > 0 && (
          <div className="mt-8">
            <h3 className="text-sm font-medium text-gray-900 mb-4">Per-Certificate Breakdown</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Certificate</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Course</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                      <span className="group relative inline-block cursor-help">
                        Audience Views
                        <span className="invisible group-hover:visible absolute right-0 top-6 w-48 p-2 bg-gray-900 text-white text-xs rounded shadow-lg z-10">
                          Visits from shared links (excludes recipient)
                        </span>
                      </span>
                    </th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                      <span className="group relative inline-block cursor-help">
                        CTA Clicks
                        <span className="invisible group-hover:visible absolute right-0 top-6 w-48 p-2 bg-gray-900 text-white text-xs rounded shadow-lg z-10">
                          Clicks on your CTA by audience
                        </span>
                      </span>
                    </th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                      <span className="group relative inline-block cursor-help">
                        CTR
                        <span className="invisible group-hover:visible absolute right-0 top-6 w-48 p-2 bg-gray-900 text-white text-xs rounded shadow-lg z-10">
                          Click-through rate
                        </span>
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {perCertificate.map((cert, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-3 py-2 text-sm text-gray-900">
                        <Link
                          href={`/c/${cert.certificateNumber}`}
                          className="text-blue-600 hover:text-blue-900"
                          target="_blank"
                        >
                          {cert.certificateNumber}
                        </Link>
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-500">{cert.courseName}</td>
                      <td className="px-3 py-2 text-sm text-right text-gray-900">{cert.views}</td>
                      <td className="px-3 py-2 text-sm text-right text-gray-900">{cert.ctaClicks}</td>
                      <td className="px-3 py-2 text-sm text-right text-gray-900">{cert.ctr}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {perCertificate.length === 0 && (
          <div className="text-center py-8 text-sm text-gray-500">
            No audience visits from shared links yet. Recipients need to share their certificates on social media.
          </div>
        )}
      </div>
    </div>
  )
}

function Metric({
  label,
  value,
  description,
}: {
  label: string
  value: number | string
  description: string
}) {
  return (
    <div className="bg-gray-50 overflow-hidden rounded-lg border border-gray-200">
      <div className="px-4 py-5 sm:p-6">
        <dt className="text-sm font-medium text-gray-500 truncate group relative cursor-help">
          {label}
          <span className="ml-1 text-gray-400">ⓘ</span>
          <span className="invisible group-hover:visible absolute left-0 top-6 w-64 p-2 bg-gray-900 text-white text-xs rounded shadow-lg z-10">
            {description}
          </span>
        </dt>
        <dd className="mt-1 text-3xl font-semibold text-gray-900">{value}</dd>
      </div>
    </div>
  )
}
