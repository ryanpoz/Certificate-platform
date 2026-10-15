import { requireAuth } from '@/lib/utils/session'
import { db } from '@/lib/db'
import { templates, courses } from '@/lib/db/schema'
import { eq, desc, sql } from 'drizzle-orm'
import Link from 'next/link'
import TemplateActions from './template-actions'

export default async function TemplatesPage() {
  const user = await requireAuth()

  // Try to query with new columns, fall back gracefully if migration hasn't run
  let allTemplates: any[] = []
  let migrationNeeded = false

  try {
    allTemplates = await db
      .select()
      .from(templates)
      .where(eq(templates.academyId, user.academyId))
      .orderBy(desc(templates.isDefault), desc(templates.updatedAt))
  } catch (error) {
    // If query fails (likely missing columns), try basic query
    console.error('Templates query failed, checking if migration needed:', error)
    try {
      allTemplates = await db
        .select()
        .from(templates)
        .where(eq(templates.academyId, user.academyId))
        .orderBy(desc(templates.createdAt))
      
      // If basic query works, migration is needed
      migrationNeeded = true
    } catch (fallbackError) {
      console.error('Basic templates query also failed:', fallbackError)
      allTemplates = []
    }
  }

  // Check if we have the new columns by inspecting first template
  if (allTemplates.length > 0 && !migrationNeeded) {
    const firstTemplate = allTemplates[0]
    if (!('name' in firstTemplate) || !('isDefault' in firstTemplate)) {
      migrationNeeded = true
    }
  }

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
      {migrationNeeded && (
        <div className="mb-6 rounded-md bg-yellow-50 p-4 border border-yellow-200">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">Database Migration Required</h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>
                  The certificate builder requires migration <code className="px-1.5 py-0.5 bg-yellow-100 rounded text-xs font-mono">003-certificate-builder.sql</code> to be run.
                  Please run this migration in your Supabase SQL Editor to enable template names, defaults, and design configuration.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

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
          {allTemplates.map((template) => {
            // Safely access new fields with fallbacks for pre-migration data
            const templateName = template.name || `Template ${template.id.substring(0, 8)}`
            const isDefault = template.isDefault || false
            
            return (
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
                    {isDefault && (
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
                      {templateName}
                    </h3>
                  </Link>
                  <div className="mt-2 flex items-center text-sm text-gray-500">
                    <span>
                      Used by {usageMap.get(template.id) || 0} program{usageMap.get(template.id) === 1 ? '' : 's'}
                    </span>
                  </div>
                  {!migrationNeeded && (
                    <div className="mt-4">
                      <TemplateActions 
                        templateId={template.id}
                        templateName={templateName}
                        isDefault={isDefault}
                        isInUse={usageMap.get(template.id)! > 0}
                        academyId={user.academyId}
                      />
                    </div>
                  )}
                  {migrationNeeded && (
                    <div className="mt-4 text-xs text-yellow-600">
                      Limited actions available - migration required
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
