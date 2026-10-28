'use client'

import { EDITOR_FONTS } from '@/lib/fabric/fonts'

export type ToolbarKind = 'text' | 'image'

export function FloatingObjectToolbar({
  kind,
  x,
  y,
  // text
  fontFamily,
  fontSize,
  fontWeight,
  fontStyle,
  underline,
  fill,
  textAlign,
  charSpacing,
  lineHeight,
  onTextChange,
  // image
  opacity,
  cornerRadius,
  onImageChange,
  onImageCommit,
  onCrop,
  onReplace,
  onDelete,
}: {
  kind: ToolbarKind
  x: number
  y: number
  fontFamily?: string
  fontSize?: number
  fontWeight?: string
  fontStyle?: string
  underline?: boolean
  fill?: string
  textAlign?: string
  charSpacing?: number
  lineHeight?: number
  onTextChange?: (prop: string, value: any) => void
  opacity?: number
  cornerRadius?: number
  onImageChange?: (prop: 'opacity' | 'cornerRadius', value: number) => void
  onImageCommit?: () => void
  onCrop?: () => void
  onReplace?: () => void
  onDelete?: () => void
}) {
  return (
    <div
      className="fixed z-50 flex max-w-[min(92vw,720px)] flex-wrap items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2 py-1.5 shadow-xl"
      style={{ left: x, top: y, transform: 'translateX(-50%)' }}
      onMouseDown={e => e.stopPropagation()}
    >
      {kind === 'text' && onTextChange && (
        <>
          <select
            value={fontFamily || 'Inter'}
            onChange={e => onTextChange('fontFamily', e.target.value)}
            className="max-w-[120px] rounded border px-1.5 py-1 text-xs"
          >
            {EDITOR_FONTS.map(f => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
          <input
            type="number"
            min={8}
            max={200}
            value={fontSize || 16}
            onChange={e => onTextChange('fontSize', parseInt(e.target.value, 10) || 16)}
            className="w-14 rounded border px-1.5 py-1 text-xs"
          />
          <button
            type="button"
            title="Bold"
            onClick={() => onTextChange('fontWeight', fontWeight === 'bold' ? 'normal' : 'bold')}
            className={`rounded border px-2 py-1 text-xs font-bold ${fontWeight === 'bold' ? 'bg-gray-900 text-white' : ''}`}
          >
            B
          </button>
          <button
            type="button"
            title="Italic"
            onClick={() => onTextChange('fontStyle', fontStyle === 'italic' ? 'normal' : 'italic')}
            className={`rounded border px-2 py-1 text-xs italic ${fontStyle === 'italic' ? 'bg-gray-900 text-white' : ''}`}
          >
            I
          </button>
          <button
            type="button"
            title="Underline"
            onClick={() => onTextChange('underline', !underline)}
            className={`rounded border px-2 py-1 text-xs underline ${underline ? 'bg-gray-900 text-white' : ''}`}
          >
            U
          </button>
          <input
            type="color"
            value={typeof fill === 'string' ? fill : '#000000'}
            onChange={e => onTextChange('fill', e.target.value)}
            className="h-7 w-7 cursor-pointer rounded border"
          />
          {(['left', 'center', 'right'] as const).map(align => (
            <button
              key={align}
              type="button"
              title={align}
              onClick={() => onTextChange('textAlign', align)}
              className={`rounded border px-1.5 py-1 text-[10px] uppercase ${textAlign === align ? 'bg-gray-900 text-white' : ''}`}
            >
              {align[0]}
            </button>
          ))}
          <label className="flex items-center gap-1 text-[10px] text-gray-500">
            LS
            <input
              type="number"
              value={charSpacing ?? 0}
              onChange={e => onTextChange('charSpacing', parseInt(e.target.value, 10) || 0)}
              className="w-12 rounded border px-1 py-1 text-xs"
            />
          </label>
          <label className="flex items-center gap-1 text-[10px] text-gray-500">
            LH
            <input
              type="number"
              step={0.05}
              min={0.5}
              max={3}
              value={lineHeight ?? 1.16}
              onChange={e => onTextChange('lineHeight', parseFloat(e.target.value) || 1.16)}
              className="w-14 rounded border px-1 py-1 text-xs"
            />
          </label>
        </>
      )}

      {kind === 'image' && onImageChange && (
        <>
          <label className="flex items-center gap-1 text-[10px] text-gray-600">
            Opacity
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round((opacity ?? 1) * 100)}
              onChange={e => onImageChange('opacity', parseInt(e.target.value, 10) / 100)}
              onMouseUp={() => onImageCommit?.()}
              onTouchEnd={() => onImageCommit?.()}
              className="w-20"
            />
          </label>
          <label className="flex items-center gap-1 text-[10px] text-gray-600">
            Radius
            <input
              type="range"
              min={0}
              max={80}
              value={cornerRadius ?? 0}
              onChange={e => onImageChange('cornerRadius', parseInt(e.target.value, 10))}
              onMouseUp={() => onImageCommit?.()}
              onTouchEnd={() => onImageCommit?.()}
              className="w-20"
            />
          </label>
          <button type="button" onClick={onCrop} className="rounded border px-2 py-1 text-xs hover:bg-gray-50">
            Crop
          </button>
          <button type="button" onClick={onReplace} className="rounded border px-2 py-1 text-xs hover:bg-gray-50">
            Replace
          </button>
          <button type="button" onClick={onDelete} className="rounded border px-2 py-1 text-xs text-red-600 hover:bg-red-50">
            Delete
          </button>
        </>
      )}
    </div>
  )
}

export function CropToolbar({
  x,
  y,
  onApply,
  onCancel,
}: {
  x: number
  y: number
  onApply: () => void
  onCancel: () => void
}) {
  return (
    <div
      className="fixed z-50 flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-xl"
      style={{ left: x, top: y, transform: 'translateX(-50%)' }}
    >
      <span className="text-xs text-gray-600">Drag the crop rectangle</span>
      <button type="button" onClick={onApply} className="rounded bg-blue-600 px-2 py-1 text-xs text-white">
        Apply
      </button>
      <button type="button" onClick={onCancel} className="rounded border px-2 py-1 text-xs">
        Cancel
      </button>
    </div>
  )
}
