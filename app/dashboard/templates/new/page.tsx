import { requireAuth } from '@/lib/utils/session'
import { STARTER_TEMPLATES } from '@/lib/certificate-builder/types'
import StarterTemplateSelector from './starter-selector'

export default async function NewTemplatePage() {
  const user = await requireAuth()

  return (
    <div className="px-4 sm:px-0">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Create Certificate Template</h1>
        <p className="mt-2 text-sm text-gray-700">
          Choose a starter design and customize it to match your brand
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {Object.entries(STARTER_TEMPLATES).map(([key, config]) => (
          <StarterTemplateSelector
            key={key}
            starterKey={key}
            config={config}
            academyId={user.academyId}
          />
        ))}
      </div>
    </div>
  )
}
