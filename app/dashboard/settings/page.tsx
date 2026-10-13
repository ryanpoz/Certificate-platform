import { requireAuth } from '@/lib/utils/session'
import { db } from '@/lib/db'
import { academies } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import SettingsForm from './form'

export default async function SettingsPage() {
  const user = await requireAuth()
  
  const [academy] = await db
    .select()
    .from(academies)
    .where(eq(academies.id, user.academyId))
    .limit(1)

  return (
    <div className="px-4 sm:px-0">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Academy Settings</h1>
        <p className="mt-2 text-sm text-gray-700">
          Manage your academy branding and email settings
        </p>
      </div>

      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <SettingsForm academy={academy} />
        </div>
      </div>
    </div>
  )
}
