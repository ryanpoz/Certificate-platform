'use client'

import { SHAPE_CATALOG, type ShapeKind } from '@/lib/fabric/shapes'

export function ElementsPanel({
  onAddShape,
}: {
  onAddShape: (kind: ShapeKind) => void
}) {
  return (
    <div className="space-y-4 text-sm">
      <h3 className="font-semibold text-gray-900">Elements</h3>
      <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Shapes</div>
      <div className="grid grid-cols-2 gap-2">
        {SHAPE_CATALOG.map(shape => (
          <button
            key={shape.kind}
            type="button"
            onClick={() => onAddShape(shape.kind)}
            className="rounded border px-2 py-3 text-left hover:bg-gray-50"
            title={shape.label}
          >
            <ShapeGlyph kind={shape.kind} />
            <div className="mt-1.5 text-[11px] font-medium text-gray-700 leading-tight">
              {shape.label}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

function ShapeGlyph({ kind }: { kind: ShapeKind }) {
  const common = 'h-8 w-full text-blue-600'
  switch (kind) {
    case 'rect':
      return <div className={`${common} mx-auto max-w-[48px] rounded-sm border-2 border-current bg-blue-100`} style={{ height: 28 }} />
    case 'rounded-rect':
      return <div className={`${common} mx-auto max-w-[48px] rounded-md border-2 border-current bg-blue-100`} style={{ height: 28 }} />
    case 'circle':
      return <div className="mx-auto h-8 w-8 rounded-full border-2 border-blue-600 bg-blue-100" />
    case 'ellipse':
      return <div className="mx-auto h-7 w-12 rounded-full border-2 border-blue-600 bg-blue-100" />
    case 'triangle':
      return (
        <div
          className="mx-auto h-0 w-0 border-l-[16px] border-r-[16px] border-b-[28px] border-l-transparent border-r-transparent border-b-blue-500"
        />
      )
    case 'line':
      return <div className="mx-auto mt-3 h-0.5 w-12 bg-gray-800" />
    case 'dashed-line':
      return <div className="mx-auto mt-3 h-0 w-12 border-t-2 border-dashed border-gray-800" />
    case 'star':
      return <div className="text-center text-2xl leading-8 text-amber-500">★</div>
    case 'seal':
      return <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-full border-2 border-dashed border-red-500 bg-red-100 text-[10px] font-bold text-red-600">S</div>
    case 'ribbon':
      return <div className="mx-auto h-5 w-14 bg-blue-600" style={{ clipPath: 'polygon(8% 0, 92% 0, 100% 50%, 92% 100%, 8% 100%, 0 50%)' }} />
    default:
      return null
  }
}
