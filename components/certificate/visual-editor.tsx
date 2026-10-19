'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Stage, Layer, Rect, Circle, Line, Text, Image as KonvaImage, Transformer, Group } from 'react-konva'
import { type CertificateDesignV2, type DesignElement, type TextElement, type DynamicFieldElement, type ShapeElement, type ImageElement, type SignatureElement, type QRCodeElement, GOOGLE_FONTS, DYNAMIC_FIELD_LABELS, getSampleData, migrateV1ToV2 } from '@/lib/certificate-builder/design-v2'
import { STARTER_TEMPLATES } from '@/lib/certificate-builder/starter-templates'
import Konva from 'konva'
import ImageUpload from '@/components/dashboard/image-upload'
import { FloatingToolbar } from './floating-toolbar'
import QRCode from 'qrcode'
import useImage from 'use-image'

function ImageElement({ element, isSelected, onSelect, onUpdate }: { element: ImageElement; isSelected: boolean; onSelect: () => void; onUpdate: (updates: any) => void }) {
  const [img] = useImage(element.src || '')
  return <KonvaImage id={element.id} image={img || undefined} x={element.x} y={element.y} width={element.width} height={element.height} draggable={!element.locked} rotation={element.rotation} onClick={(e) => { e.cancelBubble = true; onSelect() }} onDragEnd={(e) => onUpdate({ x: e.target.x(), y: e.target.y() })} onTransformEnd={(e) => { const node = e.target; onUpdate({ x: node.x(), y: node.y(), width: node.width() * node.scaleX(), height: node.height() * node.scaleY(), rotation: node.rotation() }); node.scaleX(1); node.scaleY(1) }} />
}

function SignatureElementRenderer({ element, isSelected, onSelect, onUpdate }: { element: SignatureElement; isSelected: boolean; onSelect: () => void; onUpdate: (updates: any) => void }) {
  const [img] = useImage((element.signatureType === 'image' && element.src) ? element.src : '')
  
  if (element.signatureType === 'image' && element.src) {
    return (
      <Group id={element.id} x={element.x} y={element.y} draggable={!element.locked} rotation={element.rotation} onClick={(e) => { e.cancelBubble = true; onSelect() }} onDragEnd={(e) => onUpdate({ x: e.target.x(), y: e.target.y() })} onTransformEnd={(e) => { const node = e.target; onUpdate({ x: node.x(), y: node.y(), width: node.width() * node.scaleX(), height: node.height() * node.scaleY(), rotation: node.rotation() }); node.scaleX(1); node.scaleY(1) }}>
        <KonvaImage image={img || undefined} width={element.width} height={element.height} />
        {element.title && <Text text={element.title} y={element.height + 5} width={element.width} align="center" fontSize={12} fill="#666666" />}
      </Group>
    )
  }
  
  return (
    <Group id={element.id} x={element.x} y={element.y} draggable={!element.locked} rotation={element.rotation} onClick={(e) => { e.cancelBubble = true; onSelect() }} onDragEnd={(e) => onUpdate({ x: e.target.x(), y: e.target.y() })} onTransformEnd={(e) => { const node = e.target; onUpdate({ x: node.x(), y: node.y(), width: node.width() * node.scaleX(), height: node.height() * node.scaleY(), rotation: node.rotation() }); node.scaleX(1); node.scaleY(1) }}>
      <Text text={element.text || ''} width={element.width} fontFamily={element.fontFamily} fontSize={element.fontSize} fill={element.color} align="center" />
      {element.title && <Text text={element.title} y={(element.fontSize || 32) + 5} width={element.width} align="center" fontSize={12} fill="#666666" />}
    </Group>
  )
}

function QRCodeElement({ element, isSelected, onSelect, onUpdate, sampleUrl }: { element: QRCodeElement; isSelected: boolean; onSelect: () => void; onUpdate: (updates: any) => void; sampleUrl: string }) {
  const [qrData, setQrData] = useState<string>('')
  const [img] = useImage(qrData)

  useEffect(() => {
    QRCode.toDataURL(sampleUrl, { width: 256, margin: 1 })
      .then(setQrData)
      .catch(console.error)
  }, [sampleUrl])

  return (
    <Group id={element.id} x={element.x} y={element.y} draggable={!element.locked} rotation={element.rotation} onClick={(e) => { e.cancelBubble = true; onSelect() }} onDragEnd={(e) => onUpdate({ x: e.target.x(), y: e.target.y() })} onTransformEnd={(e) => { const node = e.target; onUpdate({ x: node.x(), y: node.y(), width: node.width() * node.scaleX(), height: node.height() * node.scaleY(), rotation: node.rotation() }); node.scaleX(1); node.scaleY(1) }}>
      <KonvaImage image={img} width={element.width} height={element.height} />
      {element.showLink && <Text text={sampleUrl} y={element.height + 5} width={element.width} fontSize={10} fill="#666666" align="center" />}
    </Group>
  )
}

interface VisualEditorProps {
  templateId?: string
  initialDesign?: CertificateDesignV2 | any
  onSave: (design: CertificateDesignV2) => Promise<any>
}

export default function VisualEditor({ templateId, initialDesign, onSave }: VisualEditorProps) {
  const [design, setDesign] = useState<CertificateDesignV2>(() => {
    if (initialDesign) {
      if (!initialDesign.version || initialDesign.version === 1) {
        return migrateV1ToV2(initialDesign)
      }
      return initialDesign
    }
    
    if (templateId) {
      const template = STARTER_TEMPLATES.find(t => t.id === templateId)
      if (template?.config) {
        return migrateV1ToV2(template.config)
      }
    }
    
    return {
      version: 2,
      width: 1123,
      height: 794,
      orientation: 'landscape',
      background: { type: 'color', value: '#ffffff' },
      elements: [],
    }
  })

  const [history, setHistory] = useState<CertificateDesignV2[]>([design])
  const [historyIndex, setHistoryIndex] = useState(0)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [leftPanel, setLeftPanel] = useState<'templates' | 'text' | 'fields' | 'uploads' | 'shapes' | 'background'>('text')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(true)
  const [snapLines, setSnapLines] = useState<Array<{ x?: number; y?: number }>>([])
  const [zoom, setZoom] = useState(1)
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 })
  
  const stageRef = useRef<Konva.Stage>(null)
  const transformerRef = useRef<Konva.Transformer>(null)
  const layerRef = useRef<Konva.Layer>(null)
  const selectionRectRef = useRef<Konva.Rect>(null)
  const selection = useRef<{ x1: number; y1: number; x2: number; y2: number } | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Calculate snap guides
  function getSnapLines(skipId: string) {
    const lines: Array<{ x?: number; y?: number }> = []
    const SNAP_THRESHOLD = 5

    // Add canvas center lines
    lines.push({ x: design.width / 2 })
    lines.push({ y: design.height / 2 })

    // Add element edge lines
    design.elements.forEach(el => {
      if (el.id !== skipId) {
        lines.push({ x: el.x })
        lines.push({ x: el.x + el.width })
        lines.push({ y: el.y })
        lines.push({ y: el.y + el.height })
      }
    })

    return lines
  }

  function snapToGuides(pos: { x: number; y: number; width: number; height: number }, skipId: string) {
    const lines = getSnapLines(skipId)
    const SNAP_THRESHOLD = 5
    const snappedLines: Array<{ x?: number; y?: number }> = []
    let snapped = { ...pos }

    // Snap left edge
    for (const line of lines) {
      if (line.x !== undefined && Math.abs(pos.x - line.x) < SNAP_THRESHOLD) {
        snapped.x = line.x
        snappedLines.push({ x: line.x })
        break
      }
    }

    // Snap right edge
    for (const line of lines) {
      if (line.x !== undefined && Math.abs(pos.x + pos.width - line.x) < SNAP_THRESHOLD) {
        snapped.x = line.x - pos.width
        snappedLines.push({ x: line.x })
        break
      }
    }

    // Snap top edge
    for (const line of lines) {
      if (line.y !== undefined && Math.abs(pos.y - line.y) < SNAP_THRESHOLD) {
        snapped.y = line.y
        snappedLines.push({ y: line.y })
        break
      }
    }

    // Snap bottom edge
    for (const line of lines) {
      if (line.y !== undefined && Math.abs(pos.y + pos.height - line.y) < SNAP_THRESHOLD) {
        snapped.y = line.y - pos.height
        snappedLines.push({ y: line.y })
        break
      }
    }

    setSnapLines(snappedLines)
    return snapped
  }

  // Undo/redo
  const pushHistory = useCallback((newDesign: CertificateDesignV2) => {
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1)
      newHistory.push(newDesign)
      return newHistory.slice(-50) // Cap at 50
    })
    setHistoryIndex(prev => Math.min(prev + 1, 49))
  }, [historyIndex])

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(prev => prev - 1)
      setDesign(history[historyIndex - 1])
    }
  }, [history, historyIndex])

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(prev => prev + 1)
      setDesign(history[historyIndex + 1])
    }
  }, [history, historyIndex])

  // Server autosave (debounced)
  useEffect(() => {
    setSaved(false)
    const timer = setTimeout(async () => {
      setSaving(true)
      try {
        await onSave(design)
        setSaved(true)
      } catch (error) {
        console.error('Autosave failed:', error)
      } finally {
        setSaving(false)
      }
    }, 2000)
    return () => clearTimeout(timer)
  }, [design, onSave])

  function addElement(element: any) {
    const newElement = {
      id: `element-${Date.now()}`,
      x: design.width / 2 - 100,
      y: design.height / 2 - 50,
      width: 200,
      height: 100,
      ...element,
    }

    const newDesign = {
      ...design,
      elements: [...design.elements, newElement],
    } as CertificateDesignV2
    
    setDesign(newDesign)
    pushHistory(newDesign)
    setSelectedIds([newElement.id])
  }

  function updateElement(id: string, updates: any) {
    const newDesign = {
      ...design,
      elements: design.elements.map(el =>
        el.id === id ? { ...el, ...updates } : el
      ),
    } as CertificateDesignV2
    setDesign(newDesign)
    pushHistory(newDesign)
  }

  function deleteElements(ids: string[]) {
    const newDesign = {
      ...design,
      elements: design.elements.filter(el => !ids.includes(el.id)),
    } as CertificateDesignV2
    setDesign(newDesign)
    pushHistory(newDesign)
    setSelectedIds([])
  }

  function duplicateElements(ids: string[]) {
    const elementsToDup = design.elements.filter(el => ids.includes(el.id))
    const duplicated = elementsToDup.map(el => ({
      ...el,
      id: `element-${Date.now()}-${Math.random()}`,
      x: el.x + 20,
      y: el.y + 20,
    }))

    const newDesign = {
      ...design,
      elements: [...design.elements, ...duplicated],
    } as CertificateDesignV2
    setDesign(newDesign)
    pushHistory(newDesign)
    setSelectedIds(duplicated.map(el => el.id))
  }

  function bringForward(ids: string[]) {
    const newElements = [...design.elements]
    ids.forEach(id => {
      const idx = newElements.findIndex(el => el.id === id)
      if (idx < newElements.length - 1) {
        ;[newElements[idx], newElements[idx + 1]] = [newElements[idx + 1], newElements[idx]]
      }
    })
    const newDesign = { ...design, elements: newElements } as CertificateDesignV2
    setDesign(newDesign)
    pushHistory(newDesign)
  }

  function sendBackward(ids: string[]) {
    const newElements = [...design.elements]
    ids.forEach(id => {
      const idx = newElements.findIndex(el => el.id === id)
      if (idx > 0) {
        ;[newElements[idx], newElements[idx - 1]] = [newElements[idx - 1], newElements[idx]]
      }
    })
    const newDesign = { ...design, elements: newElements } as CertificateDesignV2
    setDesign(newDesign)
    pushHistory(newDesign)
  }

  function toggleLock(ids: string[]) {
    const newDesign = {
      ...design,
      elements: design.elements.map(el =>
        ids.includes(el.id) ? { ...el, locked: !el.locked } : el
      ),
    } as CertificateDesignV2
    setDesign(newDesign)
    pushHistory(newDesign)
  }

  function toggleOrientation() {
    const newDesign = {
      ...design,
      orientation: design.orientation === 'landscape' ? 'portrait' as const : 'landscape' as const,
      width: design.height,
      height: design.width,
    }
    setDesign(newDesign)
    pushHistory(newDesign)
  }

  const selectedElement = selectedIds.length === 1 ? design.elements.find(el => el.id === selectedIds[0]) : null

  // Keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault()
        if (e.shiftKey) {
          redo()
        } else {
          undo()
        }
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'd') {
        e.preventDefault()
        if (selectedIds.length > 0) duplicateElements(selectedIds)
      } else if (selectedIds.length > 0 && (e.key === 'Delete' || e.key === 'Backspace')) {
        deleteElements(selectedIds)
      } else if (selectedIds.length > 0 && selectedElement) {
        if (e.key === 'ArrowUp') {
          e.preventDefault()
          updateElement(selectedIds[0], { y: selectedElement.y - (e.shiftKey ? 10 : 1) })
        } else if (e.key === 'ArrowDown') {
          e.preventDefault()
          updateElement(selectedIds[0], { y: selectedElement.y + (e.shiftKey ? 10 : 1) })
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault()
          updateElement(selectedIds[0], { x: selectedElement.x - (e.shiftKey ? 10 : 1) })
        } else if (e.key === 'ArrowRight') {
          e.preventDefault()
          updateElement(selectedIds[0], { x: selectedElement.x + (e.shiftKey ? 10 : 1) })
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedIds, selectedElement, undo, redo])

  // Update transformer
  useEffect(() => {
    if (transformerRef.current && layerRef.current) {
      const stage = stageRef.current
      if (!stage) return

      const selectedNodes = selectedIds
        .map(id => stage.findOne(`#${id}`))
        .filter(Boolean) as Konva.Node[]

      transformerRef.current.nodes(selectedNodes)
      transformerRef.current.getLayer()?.batchDraw()
    }
  }, [selectedIds])

  const sampleData = getSampleData()

  // Auto-fit zoom calculation
  useEffect(() => {
    const updateZoom = () => {
      if (containerRef.current) {
        const container = containerRef.current
        const padding = 80
        const availableWidth = container.clientWidth - padding
        const availableHeight = container.clientHeight - padding
        
        const scaleX = availableWidth / design.width
        const scaleY = availableHeight / design.height
        const autoFitScale = Math.min(scaleX, scaleY, 1)
        
        setZoom(autoFitScale)
        setContainerSize({ width: container.clientWidth, height: container.clientHeight })
      }
    }
    
    updateZoom()
    window.addEventListener('resize', updateZoom)
    return () => window.removeEventListener('resize', updateZoom)
  }, [design.width, design.height])

  const zoomIn = () => setZoom(prev => Math.min(prev * 1.2, 3))
  const zoomOut = () => setZoom(prev => Math.max(prev / 1.2, 0.1))
  const zoomFit = () => {
    if (containerRef.current) {
      const container = containerRef.current
      const padding = 80
      const availableWidth = container.clientWidth - padding
      const availableHeight = container.clientHeight - padding
      const scaleX = availableWidth / design.width
      const scaleY = availableHeight / design.height
      setZoom(Math.min(scaleX, scaleY, 1))
    }
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Left Panel */}
      <div className="w-64 bg-white border-r flex flex-col">
        <div className="border-b">
          <div className="grid grid-cols-3 gap-px bg-gray-200">
            <button onClick={() => setLeftPanel('text')} className={`px-2 py-3 text-xs font-medium ${leftPanel === 'text' ? 'bg-blue-50 text-blue-600' : 'bg-white text-gray-600 hover:bg-gray-50'}`} title="Text">
              <div className="flex flex-col items-center gap-1">
                <span className="text-base">T</span>
                <span>Text</span>
              </div>
            </button>
            <button onClick={() => setLeftPanel('fields')} className={`px-2 py-3 text-xs font-medium ${leftPanel === 'fields' ? 'bg-blue-50 text-blue-600' : 'bg-white text-gray-600 hover:bg-gray-50'}`} title="Dynamic Fields">
              <div className="flex flex-col items-center gap-1">
                <span className="text-base">{ }</span>
                <span>Fields</span>
              </div>
            </button>
            <button onClick={() => setLeftPanel('uploads')} className={`px-2 py-3 text-xs font-medium ${leftPanel === 'uploads' ? 'bg-blue-50 text-blue-600' : 'bg-white text-gray-600 hover:bg-gray-50'}`} title="Images">
              <div className="flex flex-col items-center gap-1">
                <span className="text-base">🖼</span>
                <span>Images</span>
              </div>
            </button>
          </div>
          <div className="grid grid-cols-2 gap-px bg-gray-200">
            <button onClick={() => setLeftPanel('shapes')} className={`px-2 py-3 text-xs font-medium ${leftPanel === 'shapes' ? 'bg-blue-50 text-blue-600' : 'bg-white text-gray-600 hover:bg-gray-50'}`} title="Shapes">
              <div className="flex flex-col items-center gap-1">
                <span className="text-base">◼</span>
                <span>Shapes</span>
              </div>
            </button>
            <button onClick={() => setLeftPanel('background')} className={`px-2 py-3 text-xs font-medium ${leftPanel === 'background' ? 'bg-blue-50 text-blue-600' : 'bg-white text-gray-600 hover:bg-gray-50'}`} title="Background">
              <div className="flex flex-col items-center gap-1">
                <span className="text-base">🎨</span>
                <span>Background</span>
              </div>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {leftPanel === 'text' && (
            <div className="space-y-2">
              <button onClick={() => addElement({ type: 'text', text: 'New Text', fontFamily: 'Inter', fontSize: 24, fontWeight: 'normal', color: '#000000', align: 'center' })} className="w-full px-4 py-3 bg-blue-600 text-white rounded hover:bg-blue-700">Add Text</button>
            </div>
          )}

          {leftPanel === 'fields' && (
            <div className="space-y-2">
              {Object.entries(DYNAMIC_FIELD_LABELS).map(([field, label]) => (
                <button key={field} onClick={() => addElement({ type: 'dynamic-field', field, fontFamily: 'Inter', fontSize: 24, fontWeight: 'normal', color: '#000000', align: 'center', autoShrink: field === 'recipient_name' })} className="w-full px-4 py-2 bg-gray-100 text-left rounded hover:bg-gray-200 text-sm">{label}</button>
              ))}
            </div>
          )}

          {leftPanel === 'uploads' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Logo / Image</label>
                <ImageUpload value="" onChange={(url) => addElement({ type: 'image', src: url, width: 200, height: 100 })} label="Upload" maxWidth={2000} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Signature</label>
                <button onClick={() => addElement({ type: 'signature', signatureType: 'text', text: 'Jane Doe', fontFamily: 'Allura', fontSize: 32, color: '#000000', title: 'Director', width: 200, height: 80 })} className="w-full px-4 py-2 bg-gray-100 rounded hover:bg-gray-200 text-sm mb-2">Add Text Signature</button>
                <ImageUpload value="" onChange={(url) => addElement({ type: 'signature', signatureType: 'image', src: url, title: 'Director', width: 200, height: 80 })} label="Upload Signature" maxWidth={600} />
              </div>
              <button onClick={() => addElement({ type: 'qr-code', width: 120, height: 120, showLink: true })} className="w-full px-4 py-2 bg-gray-100 rounded hover:bg-gray-200 text-sm">Add QR Code</button>
            </div>
          )}

          {leftPanel === 'shapes' && (
            <div className="space-y-2">
              <button onClick={() => addElement({ type: 'shape', shapeType: 'rect', fill: '#2563eb', width: 200, height: 100 })} className="w-full px-4 py-2 bg-gray-100 text-left rounded hover:bg-gray-200 text-sm">Rectangle</button>
              <button onClick={() => addElement({ type: 'shape', shapeType: 'circle', fill: '#2563eb', width: 100, height: 100 })} className="w-full px-4 py-2 bg-gray-100 text-left rounded hover:bg-gray-200 text-sm">Circle</button>
              <button onClick={() => addElement({ type: 'shape', shapeType: 'line', stroke: '#000000', strokeWidth: 2, width: 200, height: 0 })} className="w-full px-4 py-2 bg-gray-100 text-left rounded hover:bg-gray-200 text-sm">Line</button>
              <button onClick={() => addElement({ type: 'shape', shapeType: 'border', stroke: '#2563eb', strokeWidth: 4, fill: 'transparent', x: 20, y: 20, width: design.width - 40, height: design.height - 40 })} className="w-full px-4 py-2 bg-gray-100 text-left rounded hover:bg-gray-200 text-sm">Border</button>
              <button onClick={() => addElement({ type: 'shape', shapeType: 'frame', stroke: '#d97706', strokeWidth: 8, fill: 'transparent', cornerRadius: 20, x: 40, y: 40, width: design.width - 80, height: design.height - 80 })} className="w-full px-4 py-2 bg-gray-100 text-left rounded hover:bg-gray-200 text-sm">Frame</button>
            </div>
          )}

          {leftPanel === 'background' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Type</label>
                <select value={design.background.type} onChange={(e) => setDesign({ ...design, background: { ...design.background, type: e.target.value as any } })} className="w-full px-3 py-2 border rounded">
                  <option value="color">Color</option>
                  <option value="gradient">Gradient</option>
                  <option value="image">Image</option>
                </select>
              </div>
              {design.background.type === 'color' && (
                <div>
                  <label className="block text-sm font-medium mb-2">Color</label>
                  <input type="color" value={design.background.value} onChange={(e) => setDesign({ ...design, background: { ...design.background, value: e.target.value } })} className="w-full h-10 border rounded" />
                </div>
              )}
              {design.background.type === 'gradient' && (
                <div>
                  <label className="block text-sm font-medium mb-2">Gradient</label>
                  <input type="text" value={design.background.value} onChange={(e) => setDesign({ ...design, background: { ...design.background, value: e.target.value } })} placeholder="linear-gradient(...)" className="w-full px-3 py-2 border rounded text-sm" />
                </div>
              )}
              {design.background.type === 'image' && (
                <ImageUpload value={design.background.value} onChange={(url) => setDesign({ ...design, background: { ...design.background, value: url } })} label="Upload Background" maxWidth={2000} />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 flex flex-col">
        <div className="bg-white border-b px-4 py-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-4">
              <h2 className="font-semibold">Certificate Editor</h2>
              <button onClick={toggleOrientation} className="text-sm text-blue-600 hover:text-blue-800">{design.orientation === 'landscape' ? 'Switch to Portrait' : 'Switch to Landscape'}</button>
            </div>
            <div className="flex gap-2 items-center flex-wrap">
              <span className="text-xs text-gray-500">{saving ? 'Saving...' : saved ? 'Saved' : 'Unsaved'}</span>
              <button disabled={historyIndex === 0} onClick={undo} className="px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-30" title="Undo">Undo</button>
              <button disabled={historyIndex >= history.length - 1} onClick={redo} className="px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-30" title="Redo">Redo</button>
              <div className="border-l pl-2 ml-2 flex items-center gap-2">
                <button onClick={zoomOut} className="px-2 py-1 text-sm border rounded hover:bg-gray-50" title="Zoom out">−</button>
                <span className="text-xs text-gray-600 min-w-[3rem] text-center">{Math.round(zoom * 100)}%</span>
                <button onClick={zoomIn} className="px-2 py-1 text-sm border rounded hover:bg-gray-50" title="Zoom in">+</button>
                <button onClick={zoomFit} className="px-2 py-1 text-sm border rounded hover:bg-gray-50" title="Fit to window">Fit</button>
              </div>
            </div>
          </div>
        </div>

        <div ref={containerRef} className="flex-1 overflow-hidden p-8 flex items-center justify-center">
          <div className="bg-white shadow-lg" style={{ width: design.width * zoom, height: design.height * zoom }}>
            <Stage
              ref={stageRef}
              width={design.width}
              height={design.height}
              scaleX={zoom}
              scaleY={zoom}
              onMouseDown={(e) => {
                const clickedOnEmpty = e.target === e.target.getStage()
                if (clickedOnEmpty) {
                  if (!e.evt.shiftKey) setSelectedIds([])
                  const stage = e.target.getStage()
                  if (stage) {
                    const pos = stage.getPointerPosition()
                    if (pos) {
                      selection.current = { x1: pos.x, y1: pos.y, x2: pos.x, y2: pos.y }
                    }
                  }
                }
              }}
              onMouseMove={(e) => {
                if (!selection.current) return
                const stage = e.target.getStage()
                if (stage) {
                  const pos = stage.getPointerPosition()
                  if (pos) {
                    selection.current.x2 = pos.x
                    selection.current.y2 = pos.y
                    const rect = selectionRectRef.current
                    if (rect) {
                      rect.setAttrs({
                        visible: true,
                        x: Math.min(selection.current.x1, selection.current.x2),
                        y: Math.min(selection.current.y1, selection.current.y2),
                        width: Math.abs(selection.current.x2 - selection.current.x1),
                        height: Math.abs(selection.current.y2 - selection.current.y1),
                      })
                      rect.getLayer()?.batchDraw()
                    }
                  }
                }
              }}
              onMouseUp={() => {
                if (selection.current) {
                  const rect = selectionRectRef.current
                  if (rect) rect.visible(false)
                  
                  const box = {
                    x: Math.min(selection.current.x1, selection.current.x2),
                    y: Math.min(selection.current.y1, selection.current.y2),
                    width: Math.abs(selection.current.x2 - selection.current.x1),
                    height: Math.abs(selection.current.y2 - selection.current.y1),
                  }

                  if (box.width > 5 && box.height > 5) {
                    const selected = design.elements.filter(el =>
                      el.x >= box.x && el.x + el.width <= box.x + box.width &&
                      el.y >= box.y && el.y + el.height <= box.y + box.height
                    ).map(el => el.id)
                    setSelectedIds(selected)
                  }

                  selection.current = null
                }
              }}
            >
              <Layer ref={layerRef}>
                <Rect x={0} y={0} width={design.width} height={design.height} fill={design.background.type === 'color' ? design.background.value : '#ffffff'} />

                {design.elements.map((element) => {
                  const isSelected = selectedIds.includes(element.id)
                  
                  if (element.type === 'text') {
                    const el = element as TextElement
                    return <Text key={element.id} id={element.id} x={el.x} y={el.y} width={el.width} height={el.height} text={el.text} fontSize={el.fontSize} fontFamily={el.fontFamily} fontStyle={el.fontWeight === 'bold' ? 'bold' : 'normal'} fill={el.color} align={el.align} draggable={!el.locked} rotation={el.rotation} onClick={(e) => { e.cancelBubble = true; setSelectedIds(e.evt.shiftKey ? [...selectedIds, el.id] : [el.id]) }} onDragMove={(e) => { const snapped = snapToGuides({ x: e.target.x(), y: e.target.y(), width: el.width, height: el.height }, el.id); e.target.position(snapped) }} onDragEnd={(e) => { setSnapLines([]); updateElement(el.id, { x: e.target.x(), y: e.target.y() }) }} onTransformEnd={(e) => { const node = e.target; updateElement(el.id, { x: node.x(), y: node.y(), width: node.width() * node.scaleX(), height: node.height() * node.scaleY(), rotation: node.rotation() }); node.scaleX(1); node.scaleY(1) }} />
                  }

                  if (element.type === 'dynamic-field') {
                    const el = element as DynamicFieldElement
                    const fieldLabel = DYNAMIC_FIELD_LABELS[el.field] || el.field
                    // Render dynamic fields as styled chips/badges showing the field label
                    return (
                      <Group key={element.id} id={element.id} x={el.x} y={el.y} draggable={!el.locked} rotation={el.rotation} onClick={(e) => { e.cancelBubble = true; setSelectedIds(e.evt.shiftKey ? [...selectedIds, el.id] : [el.id]) }} onDragEnd={(e) => updateElement(el.id, { x: e.target.x(), y: e.target.y() })} onTransformEnd={(e) => { const node = e.target; updateElement(el.id, { x: node.x(), y: node.y(), width: node.width() * node.scaleX(), height: node.height() * node.scaleY(), rotation: node.rotation() }); node.scaleX(1); node.scaleY(1) }}>
                        <Rect width={el.width} height={el.height} fill="#EFF6FF" stroke="#3B82F6" strokeWidth={2} cornerRadius={6} dash={[5, 3]} />
                        <Text text={fieldLabel} width={el.width} height={el.height} fontSize={el.fontSize * 0.7} fontFamily={el.fontFamily} fill="#2563EB" align="center" verticalAlign="middle" fontStyle="bold" />
                      </Group>
                    )
                  }

                  if (element.type === 'shape') {
                    const el = element as ShapeElement
                    if (el.shapeType === 'rect' || el.shapeType === 'border' || el.shapeType === 'frame') {
                      return <Rect key={element.id} id={element.id} x={el.x} y={el.y} width={el.width} height={el.height} fill={el.fill} stroke={el.stroke} strokeWidth={el.strokeWidth || 0} cornerRadius={el.cornerRadius || 0} draggable={!el.locked} rotation={el.rotation} onClick={(e) => { e.cancelBubble = true; setSelectedIds(e.evt.shiftKey ? [...selectedIds, el.id] : [el.id]) }} onDragEnd={(e) => updateElement(el.id, { x: e.target.x(), y: e.target.y() })} onTransformEnd={(e) => { const node = e.target; updateElement(el.id, { x: node.x(), y: node.y(), width: node.width() * node.scaleX(), height: node.height() * node.scaleY(), rotation: node.rotation() }); node.scaleX(1); node.scaleY(1) }} />
                    }
                    if (el.shapeType === 'circle') {
                      return <Circle key={element.id} id={element.id} x={el.x + el.width / 2} y={el.y + el.height / 2} radius={el.width / 2} fill={el.fill} stroke={el.stroke} strokeWidth={el.strokeWidth || 0} draggable={!el.locked} onClick={(e) => { e.cancelBubble = true; setSelectedIds(e.evt.shiftKey ? [...selectedIds, el.id] : [el.id]) }} onDragEnd={(e) => updateElement(el.id, { x: e.target.x() - el.width / 2, y: e.target.y() - el.height / 2 })} onTransformEnd={(e) => { const node = e.target; const scaleX = node.scaleX(); updateElement(el.id, { x: node.x() - (el.width * scaleX) / 2, y: node.y() - (el.width * scaleX) / 2, width: el.width * scaleX, height: el.width * scaleX }); node.scaleX(1); node.scaleY(1) }} />
                    }
                    if (el.shapeType === 'line') {
                      return <Line key={element.id} id={element.id} points={[el.x, el.y, el.x + el.width, el.y + el.height]} stroke={el.stroke} strokeWidth={el.strokeWidth || 2} draggable={!el.locked} onClick={(e) => { e.cancelBubble = true; setSelectedIds(e.evt.shiftKey ? [...selectedIds, el.id] : [el.id]) }} onDragEnd={(e) => updateElement(el.id, { x: e.target.x(), y: e.target.y() })} />
                    }
                  }

                  if (element.type === 'image') {
                    const el = element as ImageElement
                    return <ImageElement key={element.id} element={el} isSelected={isSelected} onSelect={() => setSelectedIds(e => e.includes(el.id) ? e : [el.id])} onUpdate={(updates) => updateElement(el.id, updates)} />
                  }

                  if (element.type === 'signature') {
                    const el = element as SignatureElement
                    return <SignatureElementRenderer key={element.id} element={el} isSelected={isSelected} onSelect={() => setSelectedIds(e => e.includes(el.id) ? e : [el.id])} onUpdate={(updates) => updateElement(el.id, updates)} />
                  }

                  if (element.type === 'qr-code') {
                    const el = element as QRCodeElement
                    const sampleUrl = 'https://example.com/c/12345'
                    return <QRCodeElement key={element.id} element={el} isSelected={isSelected} onSelect={() => setSelectedIds(e => e.includes(el.id) ? e : [el.id])} onUpdate={(updates) => updateElement(el.id, updates)} sampleUrl={sampleUrl} />
                  }

                  return null
                })}

                <Rect ref={selectionRectRef} fill="rgba(0,0,255,0.1)" stroke="blue" strokeWidth={1} visible={false} />

                {/* Snap guide lines */}
                {snapLines.map((line, i) => (
                  line.x !== undefined ? (
                    <Line key={`snap-x-${i}`} points={[line.x, 0, line.x, design.height]} stroke="#FF00FF" strokeWidth={1} dash={[4, 4]} />
                  ) : line.y !== undefined ? (
                    <Line key={`snap-y-${i}`} points={[0, line.y, design.width, line.y]} stroke="#FF00FF" strokeWidth={1} dash={[4, 4]} />
                  ) : null
                ))}

                {selectedIds.length > 0 && (
                  <Transformer
                    ref={transformerRef}
                    rotateEnabled
                    enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right', 'middle-left', 'middle-right', 'top-center', 'bottom-center']}
                    boundBoxFunc={(oldBox, newBox) => {
                      if (newBox.width < 5 || newBox.height < 5) return oldBox
                      return newBox
                    }}
                  />
                )}
              </Layer>
            </Stage>
          </div>
        </div>
      </div>

      {/* Floating Toolbar */}
      {selectedIds.length === 1 && selectedElement && (
        <FloatingToolbar
          element={selectedElement}
          stageRef={stageRef}
          onUpdate={(updates) => updateElement(selectedIds[0], updates)}
          onDelete={() => deleteElements(selectedIds)}
        />
      )}
    </div>
  )
}
