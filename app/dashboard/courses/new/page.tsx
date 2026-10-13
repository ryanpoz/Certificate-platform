import { requireAuth } from '@/lib/utils/session'
import CourseForm from './form'

export default async function NewCoursePage() {
  const user = await requireAuth()

  return (
    <div className="px-4 sm:px-0">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Create New Course</h1>
        <p className="mt-2 text-sm text-gray-700">
          Set up a new course with certificate template
        </p>
      </div>

      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <CourseForm academyId={user.academyId} />
        </div>
      </div>
    </div>
  )
}
