import { requireAuth } from '@/lib/utils/session'
import dynamic from 'next/dynamic'

const FabricEditor = dynamic(() => import('./fabric-editor'), { 
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading Fabric.js editor...</p>
      </div>
    </div>
  )
})

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
        <FabricEditor />
      </div>
    </div>
  )
}
