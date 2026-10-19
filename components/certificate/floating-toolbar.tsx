'use client'

import { useState, useEffect, useRef } from 'react'

interface FloatingToolbarProps {
  element: any
  stageRef: any
  onUpdate: (updates: any) => void
  onDelete: () => void
  containerBounds?: DOMRect
}

export function FloatingToolbar({ element, stageRef, onUpdate, onDelete, containerBounds }: FloatingToolbarProps) {
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [showMore, setShowMore] = useState(false)
  const toolbarRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!stageRef.current || !element) return

    const stage = stageRef.current
    const node = stage.findOne(`#${element.id}`)
    if (!node) return

    // Get node position in stage coordinates
    const nodeBox = node.getClientRect()
    
    // Convert to screen coordinates
    const stageContainer = stage.container()
    const containerRect = stageContainer.getBoundingClientRect()
    
    // Position toolbar above the element
    let x = containerRect.left + nodeBox.x + (nodeBox.width / 2)
    let y = containerRect.top + nodeBox.y - 60 // 60px above element

    // Keep within viewport
    if (toolbarRef.current) {
      const toolbarWidth = toolbarRef.current.offsetWidth
      const toolbarHeight = toolbarRef.current.offsetHeight

      // Adjust horizontal position
      if (x - toolbarWidth / 2 < 10) {
        x = toolbarWidth / 2 + 10
      } else if (x + toolbarWidth / 2 > window.innerWidth - 10) {
        x = window.innerWidth - toolbarWidth / 2 - 10
      }

      // If too close to top, show below element instead
      if (y < toolbarHeight + 10) {
        y = containerRect.top + nodeBox.y + nodeBox.height + 10
      }
    }

    setPosition({ x, y })
  }, [element, stageRef, containerBounds])

  if (!element) return null

  const isText = element.type === 'text' || element.type === 'dynamic-field'
  const isShape = element.type === 'shape'
  const isImage = element.type === 'image' || element.type === 'signature'

  return (
    <>
      <div
        ref={toolbarRef}
        className="fixed bg-white rounded-lg shadow-xl border border-gray-200 px-2 py-1.5 flex items-center gap-1 z-50"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          transform: 'translateX(-50%)',
        }}
      >
        {/* Text controls */}
        {isText && (
          <>
            <select
              value={(element as any).fontFamily || 'Inter'}
              onChange={(e) => onUpdate({ fontFamily: e.target.value })}
              className="text-xs border rounded px-2 py-1 w-28"
            >
              <option value="Inter">Inter</option>
              <option value="Playfair Display">Playfair Display</option>
              <option value="Montserrat">Montserrat</option>
              <option value="Libre Baskerville">Libre Baskerville</option>
              <option value="Poppins">Poppins</option>
              <option value="Space Grotesk">Space Grotesk</option>
              <option value="DM Sans">DM Sans</option>
              <option value="Cormorant Garamond">Cormorant Garamond</option>
            </select>

            <input
              type="number"
              value={(element as any).fontSize || 16}
              onChange={(e) => onUpdate({ fontSize: parseInt(e.target.value) || 16 })}
              className="text-xs border rounded px-2 py-1 w-14"
              min="8"
              max="200"
            />

            <button
              onClick={() => onUpdate({ fontWeight: (element as any).fontWeight === 'bold' ? 'normal' : 'bold' })}
              className={`px-2 py-1 text-xs font-bold rounded ${(element as any).fontWeight === 'bold' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'}`}
              title="Bold"
            >
              B
            </button>

            <input
              type="color"
              value={(element as any).color || '#000000'}
              onChange={(e) => onUpdate({ color: e.target.value })}
              className="w-8 h-8 border rounded cursor-pointer"
              title="Text color"
            />

            <div className="flex border rounded">
              <button
                onClick={() => onUpdate({ align: 'left' })}
                className={`px-2 py-1 text-xs ${(element as any).align === 'left' ? 'bg-blue-100' : 'hover:bg-gray-100'}`}
                title="Align left"
              >
                ⬅
              </button>
              <button
                onClick={() => onUpdate({ align: 'center' })}
                className={`px-2 py-1 text-xs border-l ${(element as any).align === 'center' ? 'bg-blue-100' : 'hover:bg-gray-100'}`}
                title="Align center"
              >
                ↔
              </button>
              <button
                onClick={() => onUpdate({ align: 'right' })}
                className={`px-2 py-1 text-xs border-l ${(element as any).align === 'right' ? 'bg-blue-100' : 'hover:bg-gray-100'}`}
                title="Align right"
              >
                ➡
              </button>
            </div>
          </>
        )}

        {/* Shape controls */}
        {isShape && (
          <>
            <input
              type="color"
              value={(element as any).fill || '#000000'}
              onChange={(e) => onUpdate({ fill: e.target.value })}
              className="w-8 h-8 border rounded cursor-pointer"
              title="Fill color"
            />
            <input
              type="color"
              value={(element as any).stroke || '#000000'}
              onChange={(e) => onUpdate({ stroke: e.target.value })}
              className="w-8 h-8 border rounded cursor-pointer"
              title="Stroke color"
            />
            <input
              type="number"
              value={(element as any).strokeWidth || 1}
              onChange={(e) => onUpdate({ strokeWidth: parseInt(e.target.value) || 0 })}
              className="text-xs border rounded px-2 py-1 w-14"
              placeholder="Stroke"
              min="0"
            />
          </>
        )}

        {/* Image controls */}
        {isImage && (
          <>
            <label className="text-xs px-2 py-1 border rounded cursor-pointer hover:bg-gray-100">
              Replace
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    // Handle image upload
                    console.log('Image upload:', file)
                  }
                }}
                className="hidden"
              />
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={(element as any).opacity || 1}
              onChange={(e) => onUpdate({ opacity: parseFloat(e.target.value) })}
              className="w-20"
              title="Opacity"
            />
          </>
        )}

        <div className="border-l pl-1 ml-1 flex gap-1">
          <button
            onClick={onDelete}
            className="px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded"
            title="Delete"
          >
            🗑
          </button>

          <button
            onClick={() => setShowMore(!showMore)}
            className="px-2 py-1 text-xs hover:bg-gray-100 rounded"
            title="More"
          >
            ⋮
          </button>
        </div>
      </div>

      {/* More popover */}
      {showMore && (
        <div
          className="fixed bg-white rounded-lg shadow-xl border border-gray-200 p-3 z-50"
          style={{
            left: `${position.x + 100}px`,
            top: `${position.y}px`,
            transform: 'translateX(-50%)',
          }}
        >
          <div className="text-xs font-semibold mb-2">Position & Size</div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <label className="text-gray-600">X</label>
              <input
                type="number"
                value={Math.round(element.x)}
                onChange={(e) => onUpdate({ x: parseInt(e.target.value) || 0 })}
                className="w-full border rounded px-2 py-1 mt-0.5"
              />
            </div>
            <div>
              <label className="text-gray-600">Y</label>
              <input
                type="number"
                value={Math.round(element.y)}
                onChange={(e) => onUpdate({ y: parseInt(e.target.value) || 0 })}
                className="w-full border rounded px-2 py-1 mt-0.5"
              />
            </div>
            <div>
              <label className="text-gray-600">W</label>
              <input
                type="number"
                value={Math.round(element.width)}
                onChange={(e) => onUpdate({ width: parseInt(e.target.value) || 10 })}
                className="w-full border rounded px-2 py-1 mt-0.5"
              />
            </div>
            <div>
              <label className="text-gray-600">H</label>
              <input
                type="number"
                value={Math.round(element.height)}
                onChange={(e) => onUpdate({ height: parseInt(e.target.value) || 10 })}
                className="w-full border rounded px-2 py-1 mt-0.5"
              />
            </div>
            <div className="col-span-2">
              <label className="text-gray-600">Rotation</label>
              <input
                type="number"
                value={Math.round(element.rotation || 0)}
                onChange={(e) => onUpdate({ rotation: parseInt(e.target.value) || 0 })}
                className="w-full border rounded px-2 py-1 mt-0.5"
              />
            </div>
          </div>
          <button
            onClick={() => setShowMore(false)}
            className="w-full mt-2 px-2 py-1 text-xs border rounded hover:bg-gray-100"
          >
            Close
          </button>
        </div>
      )}
    </>
  )
}
