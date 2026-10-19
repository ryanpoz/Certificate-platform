import { requireAuth } from '@/lib/utils/session'
import ClientWrapper from './client-wrapper'

export default async function FabricLabPage() {
  // Require authentication - signed-in users only
  await requireAuth()

  return (
    <div className="h-screen flex flex-col">
      <div className="bg-white border-b px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">Fabric.js Prototype Editor</h1>
            <p className="text-sm text-gray-600">Experimental comparison with Konva • Signed-in users only</p>
          </div>
          <div className="text-xs text-gray-500">
            Not in navigation • Lab feature
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-hidden">
        <ClientWrapper />
      </div>
    </div>
  )
}
