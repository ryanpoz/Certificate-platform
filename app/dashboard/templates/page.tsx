import { requireAuth } from '@/lib/utils/session'
import { db } from '@/lib/db'
import { templates, courses } from '@/lib/db/schema'
import { eq, desc, sql } from 'drizzle-orm'
import Link from 'next/link'
import TemplateActions from './template-actions'

export default async function TemplatesPage() {
  const user = await requireAuth()

  const allTemplates = await db
    .select()
    .from(templates)
    .where(eq(templates.academyId, user.academyId))
    .orderBy(desc(templates.isDefault), desc(templates.updatedAt))

  const templateUsage = await Promise.all(
    allTemplates.map(async (template) => {
      const [result] = await db
        .select({ count: sql<number>`cast(count(*) as int)` })
        .from(courses)
        .where(eq(courses.templateId, template.id))
      
      return {
        templateId: template.id,
        usageCount: result?.count || 0,
      }
    })
  )

  const usageMap = new Map(templateUsage.map(u => [u.templateId, u.usageCount]))

  return (
    <div className="px-4 sm:px-0">
      <div className="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Certificate Templates</h1>
          <p className="mt-2 text-sm text-gray-700">
            Design beautiful, on-brand certificates in minutes
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Link
            href="/dashboard/templates/new"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            Create Template
          </Link>
        </div>
      </div>

      {allTemplates.length === 0 ? (
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
          <h3 className="mt-2 text-sm font-semibold text-gray-900">No templates yet</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by creating your first certificate template.
          </p>
          <div className="mt-6">
            <Link
              href="/dashboard/templates/new"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              Create Template
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {allTemplates.map((template) => (
            <div
              key={template.id}
              className="bg-white overflow-hidden shadow rounded-lg border hover:shadow-md transition-shadow"
            >
              <Link href={`/dashboard/templates/${template.id}`}>
                <div className="aspect-[1.414/1] bg-gray-100 flex items-center justify-center relative">
                  <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                    <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  {template.isDefault && (
                    <div className="absolute top-2 right-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Default
                      </span>
                    </div>
                  )}
                </div>
              </Link>
              <div className="px-4 py-5 sm:p-6">
                <Link href={`/dashboard/templates/${template.id}`}>
                  <h3 className="text-lg font-medium text-gray-900 hover:text-blue-600">
                    {template.name}
                  </h3>
                </Link>
                <div className="mt-2 flex items-center text-sm text-gray-500">
                  <span>
                    Used by {usageMap.get(template.id) || 0} program{usageMap.get(template.id) === 1 ? '' : 's'}
                  </span>
                </div>
                <div className="mt-4">
                  <TemplateActions 
                    templateId={template.id}
                    templateName={template.name}
                    isDefault={template.isDefault || false}
                    isInUse={usageMap.get(template.id)! > 0}
                    academyId={user.academyId}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
