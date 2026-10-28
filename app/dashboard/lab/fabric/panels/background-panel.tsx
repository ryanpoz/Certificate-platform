'use client'

import { useRef, useState } from 'react'
import {
  BACKGROUND_SWATCHES,
  createSolidBackground,
  createLinearGradientBackground,
  createImageBackground,
} from '@/lib/fabric/background'
import { validateImageUpload } from '@/lib/fabric/upload-validation'
import type { Background } from '@/lib/design-config/v3-schema'

export type BackgroundPanelProps = {
  pageWidth: number
  pageHeight: number
  current: Background
  onApply: (background: Background) => void
  onCommitHistory: () => void
}

export function BackgroundPanel({
  pageWidth,
  pageHeight,
  current,
  onApply,
  onCommitHistory,
}: BackgroundPanelProps) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [solid, setSolid] = useState(
    current.type === 'color' ? current.color : '#ffffff'
  )
  const [g1, setG1] = useState('#667eea')
  const [g2, setG2] = useState('#764ba2')
  const [angle, setAngle] = useState(135)
  const [opacity, setOpacity] = useState(
    current.type === 'image' ? (current.opacity ?? 1) : 1
  )
  const [error, setError] = useState<string | null>(null)
  const imageUrl = current.type === 'image' ? current.imageUrl : null

  const applySolid = (color: string) => {
    setSolid(color)
    onApply(createSolidBackground(color))
    onCommitHistory()
  }

  const applyGradient = (c1 = g1, c2 = g2, a = angle) => {
    onApply(createLinearGradientBackground(pageWidth, pageHeight, c1, c2, a))
    onCommitHistory()
  }

  const onAngleRelease = () => {
    applyGradient()
  }

  const onFile = async (file: File | null) => {
    if (!file) return
    const result = validateImageUpload(file)
    if (!result.ok) {
      setError(result.error)
      return
    }
    setError(null)
    // TODO: Move uploaded background images to Supabase Storage instead of data URLs.
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = String(reader.result || '')
      onApply(createImageBackground(dataUrl, opacity))
      onCommitHistory()
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="space-y-5 text-sm">
      <div>
        <h3 className="font-semibold text-gray-900 mb-2">Background</h3>
      </div>

      <section className="space-y-2">
        <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Solid colour</div>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={solid}
            onChange={e => applySolid(e.target.value)}
            className="h-8 w-10 cursor-pointer rounded border"
          />
          <input
            type="text"
            value={solid}
            onChange={e => setSolid(e.target.value)}
            onBlur={() => applySolid(solid)}
            className="flex-1 rounded border px-2 py-1 text-xs"
          />
        </div>
        <div className="grid grid-cols-6 gap-1.5">
          {BACKGROUND_SWATCHES.map(c => (
            <button
              key={c}
              type="button"
              title={c}
              onClick={() => applySolid(c)}
              className="h-7 w-full rounded border border-gray-200"
              style={{ background: c }}
            />
          ))}
        </div>
      </section>

      <section className="space-y-2">
        <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Linear gradient</div>
        <div className="flex items-center gap-2">
          <input type="color" value={g1} onChange={e => setG1(e.target.value)} className="h-8 w-10 cursor-pointer rounded border" />
          <input type="color" value={g2} onChange={e => setG2(e.target.value)} className="h-8 w-10 cursor-pointer rounded border" />
          <button
            type="button"
            onClick={() => applyGradient()}
            className="rounded border px-2 py-1 text-xs hover:bg-gray-50"
          >
            Apply
          </button>
        </div>
        <label className="block text-xs text-gray-600">
          Angle: {angle}°
          <input
            type="range"
            min={0}
            max={360}
            value={angle}
            onChange={e => {
              const v = parseInt(e.target.value, 10)
              setAngle(v)
              onApply(createLinearGradientBackground(pageWidth, pageHeight, g1, g2, v))
            }}
            onMouseUp={onAngleRelease}
            onTouchEnd={onAngleRelease}
            className="mt-1 w-full"
          />
        </label>
      </section>

      <section className="space-y-2">
        <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Background image</div>
        <input
          ref={fileRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/svg+xml"
          className="hidden"
          onChange={e => void onFile(e.target.files?.[0] || null)}
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="w-full rounded border border-dashed px-3 py-2 text-xs hover:bg-gray-50"
        >
          Upload image
        </button>
        {error && <p className="text-xs text-red-600">{error}</p>}
        {imageUrl && (
          <>
            <div className="overflow-hidden rounded border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imageUrl} alt="Background" className="h-20 w-full object-cover" />
            </div>
            <label className="block text-xs text-gray-600">
              Opacity: {Math.round(opacity * 100)}%
              <input
                type="range"
                min={0}
                max={100}
                value={Math.round(opacity * 100)}
                onChange={e => {
                  const o = parseInt(e.target.value, 10) / 100
                  setOpacity(o)
                  onApply(createImageBackground(imageUrl, o))
                }}
                onMouseUp={() => onCommitHistory()}
                onTouchEnd={() => onCommitHistory()}
                className="mt-1 w-full"
              />
            </label>
            <button
              type="button"
              onClick={() => {
                onApply(createSolidBackground('#ffffff'))
                onCommitHistory()
              }}
              className="w-full rounded border px-2 py-1.5 text-xs text-red-600 hover:bg-red-50"
            >
              Remove background image
            </button>
          </>
        )}
      </section>
    </div>
  )
}
