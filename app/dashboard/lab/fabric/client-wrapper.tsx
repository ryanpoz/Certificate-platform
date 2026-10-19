'use client'

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

export default function ClientWrapper() {
  return <FabricEditor />
}
