'use client'

import { useRef, useState } from 'react'
import { validateImageUpload } from '@/lib/fabric/upload-validation'

export type UploadedAsset = {
  id: string
  name: string
  dataUrl: string
}

export function UploadsPanel({
  assets,
  onAddAsset,
  onPlaceAsset,
}: {
  assets: UploadedAsset[]
  onAddAsset: (asset: UploadedAsset) => void
  onPlaceAsset: (asset: UploadedAsset) => void
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)

  const onFile = (file: File | null) => {
    if (!file) return
    const result = validateImageUpload(file)
    if (!result.ok) {
      setError(result.error)
      return
    }
    setError(null)
    // TODO: Move uploaded images to Supabase Storage instead of embedding data URLs in design JSON.
    const reader = new FileReader()
    reader.onload = () => {
      onAddAsset({
        id: `upload-${Date.now()}`,
        name: file.name,
        dataUrl: String(reader.result || ''),
      })
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="space-y-3 text-sm">
      <h3 className="font-semibold text-gray-900">Uploads</h3>
      <input
        ref={fileRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/svg+xml"
        className="hidden"
        onChange={e => onFile(e.target.files?.[0] || null)}
      />
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        className="w-full rounded border border-dashed px-3 py-3 text-xs hover:bg-gray-50"
      >
        Upload PNG / JPG / SVG / WebP
        <div className="mt-1 text-[10px] text-gray-400">Max 5 MB</div>
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}

      <div className="grid grid-cols-2 gap-2">
        {assets.map(asset => (
          <button
            key={asset.id}
            type="button"
            title={`Add ${asset.name}`}
            onClick={() => onPlaceAsset(asset)}
            className="overflow-hidden rounded border hover:border-blue-500"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={asset.dataUrl} alt={asset.name} className="h-20 w-full object-cover" />
          </button>
        ))}
      </div>
      {assets.length === 0 && (
        <p className="text-xs text-gray-500">Uploaded images appear here. Click a thumbnail to place it on the canvas.</p>
      )}
    </div>
  )
}
