'use client'

import dynamic from 'next/dynamic'
import type { FabricEditorProps } from '@/app/dashboard/lab/fabric/fabric-editor'

const FabricEditor = dynamic(
  () => import('@/app/dashboard/lab/fabric/fabric-editor'),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full min-h-[420px] items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-b-2 border-blue-600" />
          <p className="text-sm text-gray-600">Loading editor…</p>
        </div>
      </div>
    ),
  }
)

export default function FabricEditorClient(props: FabricEditorProps) {
  return <FabricEditor {...props} />
}
