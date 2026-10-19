'use client'

import { useState, useRef, useEffect } from 'react'
import { Stage, Layer, Rect, Circle, Line, Text, Image as KonvaImage, Group, Transformer } from 'react-konva'
import { type CertificateDesignV2, type DesignElement, type TextElement, type DynamicFieldElement, type ShapeElement, GOOGLE_FONTS, DYNAMIC_FIELD_LABELS, getSampleData, migrateV1ToV2 } from '@/lib/certificate-builder/design-v2'
import { STARTER_TEMPLATES } from '@/lib/certificate-builder/starter-templates'
import Konva from 'konva'

interface VisualEditorProps {
  templateId?: string
  initialDesign?: CertificateDesignV2 | any
  onSave: (design: CertificateDesignV2) => void
}

export default function VisualEditor({ templateId, initialDesign, onSave }: VisualEditorProps) {
  const [design, setDesign] = useState<CertificateDesignV2>(() => {
    if (initialDesign) {
      // Migrate v1 to v2 if needed
      if (!initialDesign.version || initialDesign.version === 1) {
        return migrateV1ToV2(initialDesign)
      }
      return initialDesign
    }
    
    // Load from template
    if (templateId) {
      const template = STARTER_TEMPLATES.find(t => t.id === templateId)
      if (template?.config) {
        return migrateV1ToV2(template.config)
      }
    }
    
    // Default blank
    return {
      version: 2,
      width: 1123,
      height: 794,
      orientation: 'landscape',
      background: { type: 'color', value: '#ffffff' },
      elements: [],
    }
  })

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [leftPanel, setLeftPanel] = useState<'templates' | 'text' | 'fields' | 'uploads' | 'shapes' | 'background'>('templates')
  
  const stageRef = useRef<Konva.Stage>(null)
  const transformerRef = useRef<Konva.Transformer>(null)

  // Autosave
  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem('certificate-design-draft', JSON.stringify(design))
    }, 1000)
    return () => clearTimeout(timer)
  }, [design])

  function addElement(element: any) {
    const newElement = {
      id: `element-${Date.now()}`,
      x: design.width / 2 - 100,
      y: design.height / 2 - 50,
      width: 200,
      height: 100,
      ...element,
    }

    setDesign(prev => ({
      ...prev,
      elements: [...prev.elements, newElement],
    } as CertificateDesignV2))
    setSelectedId(newElement.id)
  }

  function updateElement(id: string, updates: any) {
    setDesign(prev => ({
      ...prev,
      elements: prev.elements.map(el =>
        el.id === id ? { ...el, ...updates } : el
      ),
    } as CertificateDesignV2))
  }

  function deleteElement(id: string) {
    setDesign(prev => ({
      ...prev,
      elements: prev.elements.filter(el => el.id !== id),
    }))
    setSelectedId(null)
  }

  function duplicateElement(id: string) {
    const element = design.elements.find(el => el.id === id)
    if (element) {
      addElement({
        ...element,
        x: element.x + 20,
        y: element.y + 20,
      })
    }
  }

  const selectedElement = design.elements.find(el => el.id === selectedId)

  // Keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (!selectedId) return

      if (e.key === 'Delete' || e.key === 'Backspace') {
        deleteElement(selectedId)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        updateElement(selectedId, { y: selectedElement!.y - (e.shiftKey ? 10 : 1) })
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        updateElement(selectedId, { y: selectedElement!.y + (e.shiftKey ? 10 : 1) })
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        updateElement(selectedId, { x: selectedElement!.x - (e.shiftKey ? 10 : 1) })
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        updateElement(selectedId, { x: selectedElement!.x + (e.shiftKey ? 10 : 1) })
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'd') {
        e.preventDefault()
        duplicateElement(selectedId)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedId, selectedElement])

  const sampleData = getSampleData()

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Left Panel */}
      <div className="w-64 bg-white border-r flex flex-col">
        <div className="flex border-b">
          <button
            onClick={() => setLeftPanel('templates')}
            className={`flex-1 px-4 py-2 text-sm ${leftPanel === 'templates' ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600' : 'text-gray-600'}`}
          >
            Templates
          </button>
          <button
            onClick={() => setLeftPanel('text')}
            className={`flex-1 px-4 py-2 text-sm ${leftPanel === 'text' ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600' : 'text-gray-600'}`}
          >
            Text
          </button>
        </div>
        
        <div className="flex border-b">
          <button
            onClick={() => setLeftPanel('fields')}
            className={`flex-1 px-4 py-2 text-sm ${leftPanel === 'fields' ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600' : 'text-gray-600'}`}
          >
            Fields
          </button>
          <button
            onClick={() => setLeftPanel('shapes')}
            className={`flex-1 px-4 py-2 text-sm ${leftPanel === 'shapes' ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600' : 'text-gray-600'}`}
          >
            Shapes
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {leftPanel === 'text' && (
            <div className="space-y-2">
              <button
                onClick={() => addElement({
                  type: 'text',
                  text: 'New Text',
                  fontFamily: 'Inter',
                  fontSize: 24,
                  fontWeight: 'normal',
                  color: '#000000',
                  align: 'center',
                })}
                className="w-full px-4 py-3 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Add Text
              </button>
            </div>
          )}

          {leftPanel === 'fields' && (
            <div className="space-y-2">
              {Object.entries(DYNAMIC_FIELD_LABELS).map(([field, label]) => (
                <button
                  key={field}
                  onClick={() => addElement({
                    type: 'dynamic-field',
                    field: field as any,
                    fontFamily: 'Inter',
                    fontSize: 24,
                    fontWeight: 'normal',
                    color: '#000000',
                    align: 'center',
                    autoShrink: field === 'recipient_name',
                  })}
                  className="w-full px-4 py-2 bg-gray-100 text-left rounded hover:bg-gray-200 text-sm"
                >
                  {label}
                </button>
              ))}
            </div>
          )}

          {leftPanel === 'shapes' && (
            <div className="space-y-2">
              <button
                onClick={() => addElement({
                  type: 'shape',
                  shapeType: 'rect',
                  fill: '#2563eb',
                  width: 200,
                  height: 100,
                })}
                className="w-full px-4 py-2 bg-gray-100 text-left rounded hover:bg-gray-200 text-sm"
              >
                Rectangle
              </button>
              <button
                onClick={() => addElement({
                  type: 'shape',
                  shapeType: 'circle',
                  fill: '#2563eb',
                  width: 100,
                  height: 100,
                })}
                className="w-full px-4 py-2 bg-gray-100 text-left rounded hover:bg-gray-200 text-sm"
              >
                Circle
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 flex flex-col">
        <div className="bg-white border-b px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="font-semibold">Certificate Editor</h2>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={showPreview}
                onChange={(e) => setShowPreview(e.target.checked)}
                className="rounded"
              />
              Preview with sample data
            </label>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onSave(design)}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Save
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-8 flex items-center justify-center">
          <div className="bg-white shadow-lg" style={{ width: design.width, height: design.height }}>
            <Stage
              ref={stageRef}
              width={design.width}
              height={design.height}
              onMouseDown={(e) => {
                const clickedOnEmpty = e.target === e.target.getStage()
                if (clickedOnEmpty) {
                  setSelectedId(null)
                }
              }}
            >
              <Layer>
                {/* Background */}
                <Rect
                  x={0}
                  y={0}
                  width={design.width}
                  height={design.height}
                  fill={design.background.type === 'color' ? design.background.value : '#ffffff'}
                />

                {/* Elements */}
                {design.elements.map((element) => {
                  if (element.type === 'text') {
                    const textEl = element as any
                    return (
                      <Text
                        key={element.id}
                        id={element.id}
                        x={element.x}
                        y={element.y}
                        width={element.width}
                        height={element.height}
                        text={textEl.text}
                        fontSize={textEl.fontSize}
                        fontFamily={textEl.fontFamily}
                        fontStyle={textEl.fontWeight === 'bold' ? 'bold' : 'normal'}
                        fill={textEl.color}
                        align={textEl.align}
                        draggable={!element.locked}
                        onClick={() => setSelectedId(element.id)}
                        onTap={() => setSelectedId(element.id)}
                        onDragEnd={(e) => {
                          updateElement(element.id, {
                            x: e.target.x(),
                            y: e.target.y(),
                          })
                        }}
                      />
                    )
                  }

                  if (element.type === 'dynamic-field') {
                    const fieldEl = element as DynamicFieldElement
                    const text = showPreview ? (sampleData as any)[fieldEl.field] || fieldEl.field : `{${fieldEl.field}}`
                    return (
                      <Text
                        key={element.id}
                        id={element.id}
                        x={element.x}
                        y={element.y}
                        width={element.width}
                        height={element.height}
                        text={text}
                        fontSize={fieldEl.fontSize}
                        fontFamily={fieldEl.fontFamily}
                        fontStyle={fieldEl.fontWeight === 'bold' ? 'bold' : 'normal'}
                        fill={fieldEl.color}
                        align={fieldEl.align}
                        draggable={!element.locked}
                        onClick={() => setSelectedId(element.id)}
                        onTap={() => setSelectedId(element.id)}
                        onDragEnd={(e) => {
                          updateElement(element.id, {
                            x: e.target.x(),
                            y: e.target.y(),
                          })
                        }}
                      />
                    )
                  }

                  if (element.type === 'shape') {
                    const shapeEl = element as any
                    if (shapeEl.shapeType === 'rect' || shapeEl.shapeType === 'border') {
                      return (
                        <Rect
                          key={element.id}
                          id={element.id}
                          x={element.x}
                          y={element.y}
                          width={element.width}
                          height={element.height}
                          fill={shapeEl.fill}
                          stroke={shapeEl.stroke}
                          strokeWidth={shapeEl.strokeWidth || 0}
                          cornerRadius={shapeEl.cornerRadius || 0}
                          draggable={!element.locked}
                          onClick={() => setSelectedId(element.id)}
                          onTap={() => setSelectedId(element.id)}
                          onDragEnd={(e) => {
                            updateElement(element.id, {
                              x: e.target.x(),
                              y: e.target.y(),
                            })
                          }}
                        />
                      )
                    }

                    if (shapeEl.shapeType === 'circle') {
                      return (
                        <Circle
                          key={element.id}
                          id={element.id}
                          x={element.x + element.width / 2}
                          y={element.y + element.height / 2}
                          radius={element.width / 2}
                          fill={shapeEl.fill}
                          stroke={shapeEl.stroke}
                          strokeWidth={shapeEl.strokeWidth || 0}
                          draggable={!element.locked}
                          onClick={() => setSelectedId(element.id)}
                          onTap={() => setSelectedId(element.id)}
                          onDragEnd={(e) => {
                            updateElement(element.id, {
                              x: e.target.x() - element.width / 2,
                              y: e.target.y() - element.height / 2,
                            })
                          }}
                        />
                      )
                    }
                  }

                  return null
                })}

                {selectedId && (
                  <Transformer
                    ref={transformerRef}
                    boundBoxFunc={(oldBox, newBox) => {
                      if (newBox.width < 5 || newBox.height < 5) {
                        return oldBox
                      }
                      return newBox
                    }}
                  />
                )}
              </Layer>
            </Stage>
          </div>
        </div>
      </div>

      {/* Right Panel - Properties */}
      {selectedElement && (
        <div className="w-80 bg-white border-l p-4 overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold">Properties</h3>
            <button
              onClick={() => deleteElement(selectedId!)}
              className="text-red-600 hover:text-red-800 text-sm"
            >
              Delete
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">X Position</label>
              <input
                type="number"
                value={Math.round(selectedElement.x)}
                onChange={(e) => updateElement(selectedId!, { x: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border rounded text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Y Position</label>
              <input
                type="number"
                value={Math.round(selectedElement.y)}
                onChange={(e) => updateElement(selectedId!, { y: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border rounded text-sm"
              />
            </div>

            {(selectedElement.type === 'text' || selectedElement.type === 'dynamic-field') && (
              <>
                {selectedElement.type === 'text' && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Text</label>
                    <textarea
                      value={(selectedElement as any).text}
                      onChange={(e) => updateElement(selectedId!, { text: e.target.value } as any)}
                      className="w-full px-3 py-2 border rounded text-sm"
                      rows={3}
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Font</label>
                  <select
                    value={(selectedElement as any).fontFamily}
                    onChange={(e) => updateElement(selectedId!, { fontFamily: e.target.value } as any)}
                    className="w-full px-3 py-2 border rounded text-sm"
                  >
                    {GOOGLE_FONTS.map(font => (
                      <option key={font} value={font}>{font}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Font Size</label>
                  <input
                    type="number"
                    value={(selectedElement as any).fontSize}
                    onChange={(e) => updateElement(selectedId!, { fontSize: parseInt(e.target.value) } as any)}
                    className="w-full px-3 py-2 border rounded text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Color</label>
                  <input
                    type="color"
                    value={(selectedElement as any).color}
                    onChange={(e) => updateElement(selectedId!, { color: e.target.value } as any)}
                    className="w-full h-10 border rounded"
                  />
                </div>
              </>
            )}

            {selectedElement.type === 'shape' && (
              <>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Fill Color</label>
                  <input
                    type="color"
                    value={(selectedElement as any).fill || '#000000'}
                    onChange={(e) => updateElement(selectedId!, { fill: e.target.value } as any)}
                    className="w-full h-10 border rounded"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Stroke Color</label>
                  <input
                    type="color"
                    value={(selectedElement as any).stroke || '#000000'}
                    onChange={(e) => updateElement(selectedId!, { stroke: e.target.value } as any)}
                    className="w-full h-10 border rounded"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Stroke Width</label>
                  <input
                    type="number"
                    value={(selectedElement as any).strokeWidth || 0}
                    onChange={(e) => updateElement(selectedId!, { strokeWidth: parseInt(e.target.value) } as any)}
                    className="w-full px-3 py-2 border rounded text-sm"
                  />
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
