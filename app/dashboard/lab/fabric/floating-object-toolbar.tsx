'use client'

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { EDITOR_FONTS } from '@/lib/fabric/fonts'

export type ToolbarKind = 'text' | 'image' | 'shape' | 'line'

/** Drag handle + offset so floating popups can be moved without blocking controls. */
function useDraggableOffset(positionKey?: string) {
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const dragRef = useRef<{
    pointerId: number
    startX: number
    startY: number
    originX: number
    originY: number
  } | null>(null)

  useEffect(() => {
    setOffset({ x: 0, y: 0 })
  }, [positionKey])

  function onHandlePointerDown(e: ReactPointerEvent<HTMLElement>) {
    if (e.button !== 0) return
    e.preventDefault()
    e.stopPropagation()
    const target = e.currentTarget
    target.setPointerCapture(e.pointerId)
    dragRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      originX: offset.x,
      originY: offset.y,
    }
  }

  function onHandlePointerMove(e: ReactPointerEvent<HTMLElement>) {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== e.pointerId) return
    setOffset({
      x: drag.originX + (e.clientX - drag.startX),
      y: drag.originY + (e.clientY - drag.startY),
    })
  }

  function onHandlePointerUp(e: ReactPointerEvent<HTMLElement>) {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== e.pointerId) return
    dragRef.current = null
    try {
      e.currentTarget.releasePointerCapture(e.pointerId)
    } catch {
      // ignore
    }
  }

  return {
    offset,
    handleProps: {
      onPointerDown: onHandlePointerDown,
      onPointerMove: onHandlePointerMove,
      onPointerUp: onHandlePointerUp,
      onPointerCancel: onHandlePointerUp,
    },
  }
}

function DragHandle({ handleProps }: { handleProps: ReturnType<typeof useDraggableOffset>['handleProps'] }) {
  return (
    <button
      type="button"
      title="Drag to move"
      aria-label="Drag toolbar"
      className="cursor-grab active:cursor-grabbing touch-none select-none rounded px-1 py-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
      {...handleProps}
    >
      <span className="block leading-none text-xs tracking-tighter" aria-hidden>
        ⋮⋮
      </span>
    </button>
  )
}

export function FloatingObjectToolbar({
  kind,
  x,
  y,
  positionKey,
  locked,
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
  // shape
  stroke,
  strokeWidth,
  strokeStyle,
  strokeLineCap,
  rx,
  fillMode,
  fillColor2,
  onShapeChange,
  onShapeCommit,
  // arrange
  selectionCount,
  onArrange,
  onToggleLock,
}: {
  kind: ToolbarKind
  x: number
  y: number
  /** When this changes (new selection), drag offset resets to the default anchor. */
  positionKey?: string
  locked?: boolean
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
  stroke?: string
  strokeWidth?: number
  strokeStyle?: 'solid' | 'dashed'
  strokeLineCap?: 'butt' | 'round' | 'square'
  rx?: number
  fillMode?: 'solid' | 'gradient'
  fillColor2?: string
  onShapeChange?: (prop: string, value: any) => void
  onShapeCommit?: () => void
  selectionCount?: number
  onArrange?: (action: string) => void
  onToggleLock?: () => void
}) {
  const count = selectionCount ?? 1
  const { offset, handleProps } = useDraggableOffset(positionKey ?? kind)

  return (
    <div
      className="fixed z-50 flex max-w-[min(96vw,900px)] flex-wrap items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2 py-1.5 shadow-xl"
      style={{ left: x + offset.x, top: y + offset.y, transform: 'translateX(-50%)' }}
      onMouseDown={e => e.stopPropagation()}
    >
      <DragHandle handleProps={handleProps} />
      {locked && (
        <span title="Locked" className="rounded bg-amber-50 px-1.5 py-0.5 text-xs text-amber-700">
          🔒
        </span>
      )}

      {kind === 'text' && onTextChange && (
        <>
          <select
            value={fontFamily || 'Inter'}
            onChange={e => onTextChange('fontFamily', e.target.value)}
            className="max-w-[120px] rounded border px-1.5 py-1 text-xs"
            disabled={locked}
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
            disabled={locked}
          />
          <button
            type="button"
            title="Bold"
            disabled={locked}
            onClick={() => onTextChange('fontWeight', fontWeight === 'bold' ? 'normal' : 'bold')}
            className={`rounded border px-2 py-1 text-xs font-bold ${fontWeight === 'bold' ? 'bg-gray-900 text-white' : ''}`}
          >
            B
          </button>
          <button
            type="button"
            title="Italic"
            disabled={locked}
            onClick={() => onTextChange('fontStyle', fontStyle === 'italic' ? 'normal' : 'italic')}
            className={`rounded border px-2 py-1 text-xs italic ${fontStyle === 'italic' ? 'bg-gray-900 text-white' : ''}`}
          >
            I
          </button>
          <button
            type="button"
            title="Underline"
            disabled={locked}
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
            disabled={locked}
          />
          {(['left', 'center', 'right'] as const).map(align => (
            <button
              key={align}
              type="button"
              title={align}
              disabled={locked}
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
              disabled={locked}
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
              disabled={locked}
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
              disabled={locked}
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
              disabled={locked}
            />
          </label>
          <button type="button" disabled={locked} onClick={onCrop} className="rounded border px-2 py-1 text-xs hover:bg-gray-50 disabled:opacity-40">
            Crop
          </button>
          <button type="button" disabled={locked} onClick={onReplace} className="rounded border px-2 py-1 text-xs hover:bg-gray-50 disabled:opacity-40">
            Replace
          </button>
          <button type="button" onClick={onDelete} className="rounded border px-2 py-1 text-xs text-red-600 hover:bg-red-50">
            Delete
          </button>
        </>
      )}

      {kind === 'shape' && onShapeChange && (
        <>
          <select
            value={fillMode || 'solid'}
            onChange={e => onShapeChange('fillMode', e.target.value)}
            className="rounded border px-1.5 py-1 text-xs"
            disabled={locked}
          >
            <option value="solid">Solid fill</option>
            <option value="gradient">2-colour fill</option>
          </select>
          <input
            type="color"
            title="Fill"
            value={typeof fill === 'string' ? fill : '#dbeafe'}
            onChange={e => onShapeChange('fill', e.target.value)}
            className="h-7 w-7 cursor-pointer rounded border"
            disabled={locked}
          />
          {fillMode === 'gradient' && (
            <input
              type="color"
              title="Fill 2"
              value={fillColor2 || '#2563eb'}
              onChange={e => onShapeChange('fillColor2', e.target.value)}
              className="h-7 w-7 cursor-pointer rounded border"
              disabled={locked}
            />
          )}
          <input
            type="color"
            title="Border"
            value={stroke || '#2563eb'}
            onChange={e => onShapeChange('stroke', e.target.value)}
            className="h-7 w-7 cursor-pointer rounded border"
            disabled={locked}
          />
          <label className="flex items-center gap-1 text-[10px] text-gray-600">
            W
            <input
              type="number"
              min={0}
              max={40}
              value={strokeWidth ?? 2}
              onChange={e => onShapeChange('strokeWidth', parseInt(e.target.value, 10) || 0)}
              className="w-12 rounded border px-1 py-1 text-xs"
              disabled={locked}
            />
          </label>
          <select
            value={strokeStyle || 'solid'}
            onChange={e => onShapeChange('strokeStyle', e.target.value)}
            className="rounded border px-1.5 py-1 text-xs"
            disabled={locked}
          >
            <option value="solid">Solid</option>
            <option value="dashed">Dashed</option>
          </select>
          {typeof rx === 'number' && (
            <label className="flex items-center gap-1 text-[10px] text-gray-600">
              Radius
              <input
                type="range"
                min={0}
                max={80}
                value={rx}
                onChange={e => onShapeChange('rx', parseInt(e.target.value, 10))}
                onMouseUp={() => onShapeCommit?.()}
                onTouchEnd={() => onShapeCommit?.()}
                className="w-16"
                disabled={locked}
              />
            </label>
          )}
          <label className="flex items-center gap-1 text-[10px] text-gray-600">
            Opacity
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round((opacity ?? 1) * 100)}
              onChange={e => onShapeChange('opacity', parseInt(e.target.value, 10) / 100)}
              onMouseUp={() => onShapeCommit?.()}
              onTouchEnd={() => onShapeCommit?.()}
              className="w-16"
              disabled={locked}
            />
          </label>
          <button type="button" onClick={onDelete} className="rounded border px-2 py-1 text-xs text-red-600 hover:bg-red-50">
            Delete
          </button>
        </>
      )}

      {kind === 'line' && onShapeChange && (
        <>
          <input
            type="color"
            title="Colour"
            value={stroke || '#111827'}
            onChange={e => onShapeChange('stroke', e.target.value)}
            className="h-7 w-7 cursor-pointer rounded border"
            disabled={locked}
          />
          <label className="flex items-center gap-1 text-[10px] text-gray-600">
            Width
            <input
              type="number"
              min={1}
              max={40}
              value={strokeWidth ?? 3}
              onChange={e => onShapeChange('strokeWidth', parseInt(e.target.value, 10) || 1)}
              className="w-12 rounded border px-1 py-1 text-xs"
              disabled={locked}
            />
          </label>
          <button
            type="button"
            disabled={locked}
            onClick={() => onShapeChange('strokeStyle', strokeStyle === 'dashed' ? 'solid' : 'dashed')}
            className={`rounded border px-2 py-1 text-xs ${strokeStyle === 'dashed' ? 'bg-gray-900 text-white' : ''}`}
          >
            Dashed
          </button>
          <select
            value={strokeLineCap || 'butt'}
            onChange={e => onShapeChange('strokeLineCap', e.target.value)}
            className="rounded border px-1.5 py-1 text-xs"
            disabled={locked}
            title="End caps"
          >
            <option value="butt">Butt</option>
            <option value="round">Round</option>
            <option value="square">Square</option>
          </select>
          <button type="button" onClick={onDelete} className="rounded border px-2 py-1 text-xs text-red-600 hover:bg-red-50">
            Delete
          </button>
        </>
      )}

      {onArrange && (
        <>
          <div className="mx-1 h-5 w-px bg-gray-200" />
          <button type="button" title="Align left" onClick={() => onArrange('align-left')} className="rounded border px-1.5 py-1 text-[10px]">⇤</button>
          <button type="button" title="Align centre" onClick={() => onArrange('align-center')} className="rounded border px-1.5 py-1 text-[10px]">↔</button>
          <button type="button" title="Align right" onClick={() => onArrange('align-right')} className="rounded border px-1.5 py-1 text-[10px]">⇥</button>
          <button type="button" title="Align top" onClick={() => onArrange('align-top')} className="rounded border px-1.5 py-1 text-[10px]">⤒</button>
          <button type="button" title="Align middle" onClick={() => onArrange('align-middle')} className="rounded border px-1.5 py-1 text-[10px]">↕</button>
          <button type="button" title="Align bottom" onClick={() => onArrange('align-bottom')} className="rounded border px-1.5 py-1 text-[10px]">⤓</button>
          {count >= 3 && (
            <>
              <button type="button" title="Distribute H" onClick={() => onArrange('distribute-h')} className="rounded border px-1.5 py-1 text-[10px]">⇔</button>
              <button type="button" title="Distribute V" onClick={() => onArrange('distribute-v')} className="rounded border px-1.5 py-1 text-[10px]">⇕</button>
            </>
          )}
          <button type="button" title="Bring forward" onClick={() => onArrange('bring-forward')} className="rounded border px-1.5 py-1 text-[10px]">↑</button>
          <button type="button" title="Send backward" onClick={() => onArrange('send-backward')} className="rounded border px-1.5 py-1 text-[10px]">↓</button>
          <button type="button" title="Bring to front" onClick={() => onArrange('bring-front')} className="rounded border px-1.5 py-1 text-[10px]">⇈</button>
          <button type="button" title="Send to back" onClick={() => onArrange('send-back')} className="rounded border px-1.5 py-1 text-[10px]">⇊</button>
          {count >= 2 && (
            <button type="button" title="Group" onClick={() => onArrange('group')} className="rounded border px-1.5 py-1 text-[10px]">Grp</button>
          )}
          <button type="button" title="Ungroup" onClick={() => onArrange('ungroup')} className="rounded border px-1.5 py-1 text-[10px]"> Ungroup</button>
          <button type="button" title="Duplicate" onClick={() => onArrange('duplicate')} className="rounded border px-1.5 py-1 text-[10px]">Dup</button>
          {onToggleLock && (
            <button type="button" title={locked ? 'Unlock' : 'Lock'} onClick={onToggleLock} className="rounded border px-1.5 py-1 text-[10px]">
              {locked ? 'Unlock' : 'Lock'}
            </button>
          )}
        </>
      )}
    </div>
  )
}

export function CropToolbar({
  x,
  y,
  positionKey,
  onApply,
  onCancel,
}: {
  x: number
  y: number
  positionKey?: string
  onApply: () => void
  onCancel: () => void
}) {
  const { offset, handleProps } = useDraggableOffset(positionKey ?? 'crop')

  return (
    <div
      className="fixed z-50 flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-xl"
      style={{ left: x + offset.x, top: y + offset.y, transform: 'translateX(-50%)' }}
      onMouseDown={e => e.stopPropagation()}
    >
      <DragHandle handleProps={handleProps} />
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
