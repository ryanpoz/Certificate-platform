import { requireAuth } from '@/lib/utils/session'
import { db } from '@/lib/db'
import { courses } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'
import { FilterSelect, FilterInput } from '@/components/dashboard/filters'
import ShareImpact from './share-impact'

export default async function ResultsDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ 
    course?: string
    startDate?: string
    endDate?: string
  }>
}) {
  const user = await requireAuth()
  const params = await searchParams

  const defaultStartDate = new Date()
  defaultStartDate.setMonth(defaultStartDate.getMonth() - 1)
  
  const startDate = params.startDate ? new Date(params.startDate) : defaultStartDate
  const endDate = params.endDate ? new Date(params.endDate) : new Date()

  const allCourses = await db
    .select()
    .from(courses)
    .where(eq(courses.academyId, user.academyId))
    .orderBy(desc(courses.createdAt))

  return (
    <div className="px-4 sm:px-0">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Results</h1>
        <p className="mt-2 text-sm text-gray-700">
          Measure what sharing brings back: audience visits and conversions
        </p>
      </div>

      <div className="mb-6 bg-white p-4 rounded-lg shadow-sm border">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <FilterSelect
            id="course-filter"
            label="Certificate"
            value={params.course || ''}
            paramName="course"
            options={[
              { value: '', label: 'All Certificates' },
              ...allCourses.map(course => ({ value: course.id, label: course.name }))
            ]}
          />

          <FilterInput
            id="start-date"
            label="From Date"
            type="date"
            defaultValue={params.startDate || defaultStartDate.toISOString().split('T')[0]}
            paramName="startDate"
          />

          <FilterInput
            id="end-date"
            label="To Date"
            type="date"
            defaultValue={params.endDate || new Date().toISOString().split('T')[0]}
            paramName="endDate"
          />
        </div>
      </div>

      <ShareImpact
        academyId={user.academyId}
        startDate={startDate}
        endDate={endDate}
        courseFilter={params.course}
      />
    </div>
  )
}
