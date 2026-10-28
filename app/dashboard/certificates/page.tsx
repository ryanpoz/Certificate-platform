import { requireAuth } from '@/lib/utils/session'
import { db } from '@/lib/db'
import { certificates, courses, events } from '@/lib/db/schema'
import { eq, desc, sql, and } from 'drizzle-orm'
import Link from 'next/link'
import { checkFirstTimeUser } from '../wizard/actions'
import { redirect } from 'next/navigation'

function isDraftProgram(
  program: { draftData: unknown; code: string },
  issuedCount: number
) {
  if (program.draftData != null) return true
  // Fallback: draft rows use DRAFT- codes and have never issued
  return program.code.startsWith('DRAFT-') && issuedCount === 0
}

export default async function CertificatesPage() {
  const user = await requireAuth()

  // Check if first-time user
  const isFirstTime = await checkFirstTimeUser(user.academyId)
  
  if (isFirstTime) {
    redirect('/dashboard/wizard')
  }

  // Get all programs (courses) with certificate counts and metrics
  const allPrograms = await db
    .select({
      id: courses.id,
      name: courses.name,
      code: courses.code,
      description: courses.description,
      createdAt: courses.createdAt,
      draftData: courses.draftData,
    })
    .from(courses)
    .where(eq(courses.academyId, user.academyId))
    .orderBy(desc(courses.createdAt))

  // Get certificate counts per program
  const programMetrics = await Promise.all(
    allPrograms.map(async (program) => {
      // Count issued certificates
      const [certCount] = await db
        .select({ count: sql<number>`cast(count(*) as int)` })
        .from(certificates)
        .where(
          and(
            eq(certificates.courseId, program.id),
            eq(certificates.status, 'valid')
          )
        )

      // Count views
      const [viewCount] = await db
        .select({ count: sql<number>`cast(count(*) as int)` })
        .from(events)
        .innerJoin(certificates, eq(events.certificateId, certificates.id))
        .where(
          and(
            eq(certificates.courseId, program.id),
            eq(events.type, 'page_view')
          )
        )

      // Count LinkedIn clicks
      const [linkedinCount] = await db
        .select({ count: sql<number>`cast(count(*) as int)` })
        .from(events)
        .innerJoin(certificates, eq(events.certificateId, certificates.id))
        .where(
          and(
            eq(certificates.courseId, program.id),
            eq(events.type, 'linkedin_add_click')
          )
        )

      return {
        programId: program.id,
        issued: certCount?.count || 0,
        views: viewCount?.count || 0,
        linkedinClicks: linkedinCount?.count || 0,
      }
    })
  )

  const metricsMap = new Map(programMetrics.map(m => [m.programId, m]))

  const drafts = allPrograms.filter(p =>
    isDraftProgram(p, metricsMap.get(p.id)?.issued || 0)
  )
  const issued = allPrograms.filter(
    p => !isDraftProgram(p, metricsMap.get(p.id)?.issued || 0)
  )

  return (
    <div className="px-4 sm:px-0">
      <div className="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Certificates</h1>
          <p className="mt-2 text-sm text-gray-700">
            Create and manage your certificates
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Link
            href="/dashboard/wizard"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create certificate
          </Link>
        </div>
      </div>

      {drafts.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Drafts</h2>
          <div className="bg-white shadow-sm rounded-lg border divide-y">
            {drafts.map(program => (
              <div
                key={program.id}
                className="flex items-center justify-between gap-4 px-6 py-4"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="font-medium text-gray-900 truncate">{program.name}</div>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-200 text-slate-800 shrink-0">
                      Draft
                    </span>
                  </div>
                  {program.description ? (
                    <div className="text-sm text-gray-500 truncate">{program.description}</div>
                  ) : null}
                </div>
                <Link
                  href={`/dashboard/wizard?draft=${program.id}`}
                  className="text-blue-600 hover:text-blue-900 font-medium text-sm whitespace-nowrap"
                >
                  Continue editing
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {issued.length === 0 && drafts.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-semibold text-gray-900">No certificates yet</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by creating your first certificate.
          </p>
          <div className="mt-6">
            <Link
              href="/dashboard/wizard"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              Create certificate
            </Link>
          </div>
        </div>
      ) : issued.length === 0 ? (
        <p className="text-sm text-gray-500">No issued certificates yet.</p>
      ) : (
        <div className="bg-white shadow-sm rounded-lg border">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Certificate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Issued
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Views
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  LinkedIn
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {issued.map((program) => {
                const metrics = metricsMap.get(program.id)!
                const isSample = program.name === 'Sample Certificate'

                return (
                  <tr key={program.id} className={isSample ? 'bg-yellow-50' : ''}>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div>
                          <div className="flex items-center gap-2">
                            <div className="font-medium text-gray-900">
                              {program.name}
                            </div>
                            {isSample && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                                Sample
                              </span>
                            )}
                          </div>
                          {program.description && (
                            <div className="text-sm text-gray-500">{program.description}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {metrics.issued}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {metrics.views}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {metrics.linkedinClicks}
                    </td>
                    <td className="px-6 py-4 text-right text-sm whitespace-nowrap">
                      <Link
                        href={`/dashboard/courses/${program.id}`}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        View
                      </Link>
                      <Link
                        href={`/dashboard/courses/${program.id}/issue`}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Issue more
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-6 text-sm text-gray-500">
        <p>
          <strong>Tip:</strong> LinkedIn shares = signups. Encourage recipients to add certificates to LinkedIn!
        </p>
      </div>
    </div>
  )
}
