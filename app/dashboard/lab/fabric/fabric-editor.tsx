'use client'

import { useEffect, useRef, useState } from 'react'
import { Canvas, IText, Textbox, Rect, Circle } from 'fabric'

const TEMPLATES = {
  'modern-saas-gradient': {
    name: 'Modern SaaS (Landscape)',
    width: 1123,
    height: 794,
    orientation: 'landscape',
    background: { type: 'gradient', value: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
    elements: [
      { id: 'org_name', type: 'text', text: 'Tech Academy', x: 100, y: 80, fontSize: 24, fontFamily: 'Inter', fill: '#ffffff' },
      { id: 'certificate_title', type: 'text', text: 'Certificate of Completion', x: 561, y: 200, fontSize: 48, fontFamily: 'Playfair Display', fill: '#ffffff', width: 600, textAlign: 'center' },
      { id: 'recipient_name', type: 'textbox', text: 'Recipient Name', x: 400, y: 320, fontSize: 36, fontFamily: 'Inter', fill: '#ffffff', width: 323, textAlign: 'center', shrinkToFit: true },
      { id: 'description', type: 'text', text: 'Has successfully completed the requirements', x: 561, y: 420, fontSize: 18, fontFamily: 'Inter', fill: '#ffffff', width: 600, textAlign: 'center' },
      { id: 'signer_1_name', type: 'text', text: 'Jane Doe', x: 100, y: 650, fontSize: 16, fontFamily: 'Inter', fill: '#ffffff' },
      { id: 'signer_1_title', type: 'text', text: 'Director', x: 100, y: 680, fontSize: 14, fontFamily: 'Inter', fill: '#cccccc' },
      { id: 'issue_date', type: 'text', text: 'October 19, 2026', x: 900, y: 665, fontSize: 14, fontFamily: 'Inter', fill: '#ffffff' },
    ]
  },
  'portrait-academy-diploma': {
    name: 'Portrait Academy Diploma',
    width: 794,
    height: 1123,
    orientation: 'portrait',
    background: { type: 'color', value: '#ffffff' },
    elements: [
      { id: 'org_name', type: 'text', text: 'Academy of Excellence', x: 397, y: 100, fontSize: 28, fontFamily: 'Playfair Display', fill: '#1a202c', textAlign: 'center' },
      { id: 'certificate_title', type: 'text', text: 'Diploma', x: 397, y: 250, fontSize: 64, fontFamily: 'Playfair Display', fill: '#2d3748', textAlign: 'center' },
      { id: 'recipient_name', type: 'textbox', text: 'Recipient Name', x: 247, y: 400, fontSize: 42, fontFamily: 'Playfair Display', fill: '#1a202c', width: 300, textAlign: 'center', shrinkToFit: true },
      { id: 'description', type: 'text', text: 'Has demonstrated excellence and dedication', x: 397, y: 550, fontSize: 18, fontFamily: 'Inter', fill: '#4a5568', width: 500, textAlign: 'center' },
      { id: 'signer_1_name', type: 'text', text: 'Dr. Sarah Johnson', x: 200, y: 850, fontSize: 18, fontFamily: 'Inter', fill: '#1a202c' },
      { id: 'signer_1_title', type: 'text', text: 'Dean of Studies', x: 200, y: 880, fontSize: 14, fontFamily: 'Inter', fill: '#718096' },
      { id: 'issue_date', type: 'text', text: 'October 19, 2026', x: 500, y: 865, fontSize: 14, fontFamily: 'Inter', fill: '#4a5568' },
    ]
  }
}

const SAMPLE_DATA = {
  org_name: 'Tech Academy',
  certificate_title: 'Certificate of Completion',
  recipient_name: 'Jordan Lee',
  description: 'Has successfully completed the advanced program',
  signer_1_name: 'Dr. Sarah Johnson',
  signer_1_title: 'Director of Education',
  issue_date: 'October 19, 2026',
}

export default function FabricEditor() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fabricRef = useRef<Canvas | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<keyof typeof TEMPLATES>('modern-saas-gradient')
  const [selectedObject, setSelectedObject] = useState<any>(null)
  const [selectedObjects, setSelectedObjects] = useState<any[]>([])
  const [showFieldNames, setShowFieldNames] = useState(false)
  const [history, setHistory] = useState<string[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [toolbarPos, setToolbarPos] = useState({ x: 0, y: 0, visible: false })

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return

    const canvas = new Canvas(canvasRef.current, {
      width: 800,
      height: 600,
      backgroundColor: '#f5f5f5',
      // Enable snap guides
      snapAngle: 15,
      snapThreshold: 10,
    })

    fabricRef.current = canvas

    // Load initial template
    loadTemplate(selectedTemplate, canvas)

    // Selection handling
    canvas.on('selection:created', (e) => {
      const selected = e.selected || []
      setSelectedObject(selected[0])
      setSelectedObjects(selected)
      updateToolbarPosition(selected[0])
    })

    canvas.on('selection:updated', (e) => {
      const selected = e.selected || []
      setSelectedObject(selected[0])
      setSelectedObjects(selected)
      updateToolbarPosition(selected[0])
    })

    canvas.on('selection:cleared', () => {
      setSelectedObject(null)
      setSelectedObjects([])
      setToolbarPos({ x: 0, y: 0, visible: false })
    })

    canvas.on('object:modified', () => {
      saveHistory()
    })

    // Double-click to edit text
    canvas.on('mouse:dblclick', (e) => {
      if (e.target && (e.target instanceof IText || e.target instanceof Textbox)) {
        e.target.enterEditing()
        e.target.selectAll()
      }
    })

    // Auto-fit canvas
    const resizeCanvas = () => {
      if (!containerRef.current) return
      const container = containerRef.current
      const template = TEMPLATES[selectedTemplate]
      
      const padding = 40
      const availableWidth = container.clientWidth - padding
      const availableHeight = container.clientHeight - padding
      
      const scaleX = availableWidth / template.width
      const scaleY = availableHeight / template.height
      const scale = Math.min(scaleX, scaleY, 1)
      
      canvas.setZoom(scale)
      canvas.setWidth(template.width * scale)
      canvas.setHeight(template.height * scale)
      canvas.renderAll()
    }

    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    return () => {
      window.removeEventListener('resize', resizeCanvas)
      canvas.dispose()
    }
  }, [])

  useEffect(() => {
    if (fabricRef.current) {
      loadTemplate(selectedTemplate, fabricRef.current)
    }
  }, [selectedTemplate])

  const loadTemplate = (templateKey: keyof typeof TEMPLATES, canvas: Canvas) => {
    const template = TEMPLATES[templateKey]
    
    canvas.clear()
    canvas.setDimensions({ width: template.width, height: template.height })
    
    // Set background - defensive checks to prevent undefined access
    if (template.background?.type === 'gradient' && template.background?.value) {
      // Extract first color from gradient string safely
      const gradientValue = template.background.value
      const colorMatch = gradientValue.match(/#[0-9a-fA-F]{6}|#[0-9a-fA-F]{3}|rgb\([^)]+\)|rgba\([^)]+\)/)
      canvas.set('backgroundColor', colorMatch ? colorMatch[0] : '#667eea')
    } else {
      canvas.set('backgroundColor', template.background?.value || '#ffffff')
    }

    // Add elements - defensive checks for undefined properties
    template.elements?.forEach((el) => {
      if (!el || !el.id) return
      
      const displayText = showFieldNames 
        ? el.id.replace(/_/g, ' ').toUpperCase() 
        : (SAMPLE_DATA[el.id as keyof typeof SAMPLE_DATA] || el.text || 'Text')
      
      if (el.type === 'textbox') {
        const textbox = new Textbox(displayText, {
          left: el.x || 0,
          top: el.y || 0,
          fontSize: el.fontSize || 16,
          fontFamily: el.fontFamily || 'Inter',
          fill: el.fill || '#000000',
          width: el.width || 200,
          textAlign: (el.textAlign || 'left') as any,
          data: { id: el.id, shrinkToFit: el.shrinkToFit }
        })
        canvas.add(textbox)
      } else {
        const text = new IText(displayText, {
          left: el.x || 0,
          top: el.y || 0,
          fontSize: el.fontSize || 16,
          fontFamily: el.fontFamily || 'Inter',
          fill: el.fill || '#000000',
          textAlign: (el.textAlign || 'left') as any,
          data: { id: el.id }
        })
        if (el.width) {
          text.set({ width: el.width })
        }
        canvas.add(text)
      }
    })

    canvas.renderAll()
    saveHistory()
    
    // Auto-fit after load
    if (containerRef.current) {
      const container = containerRef.current
      const padding = 40
      const availableWidth = container.clientWidth - padding
      const availableHeight = container.clientHeight - padding
      
      const scaleX = availableWidth / template.width
      const scaleY = availableHeight / template.height
      const scale = Math.min(scaleX, scaleY, 1)
      
      canvas.setZoom(scale)
      canvas.setWidth(template.width * scale)
      canvas.setHeight(template.height * scale)
      canvas.renderAll()
    }
  }

  const updateToolbarPosition = (obj: any) => {
    if (!obj || !fabricRef.current) {
      setToolbarPos({ x: 0, y: 0, visible: false })
      return
    }

    const canvas = fabricRef.current
    const zoom = canvas.getZoom()
    const canvasEl = canvas.getElement()
    const rect = canvasEl.getBoundingClientRect()
    
    const objCoords = obj.getBoundingRect()
    const x = rect.left + (objCoords.left * zoom) + (objCoords.width * zoom / 2)
    const y = rect.top + (objCoords.top * zoom) - 60
    
    setToolbarPos({ x, y: Math.max(y, 10), visible: true })
  }

  const saveHistory = () => {
    if (!fabricRef.current) return
    const json = JSON.stringify(fabricRef.current.toJSON())
    setHistory(prev => [...prev.slice(0, historyIndex + 1), json])
    setHistoryIndex(prev => prev + 1)
  }

  const undo = () => {
    if (historyIndex > 0 && fabricRef.current) {
      const newIndex = historyIndex - 1
      setHistoryIndex(newIndex)
      fabricRef.current.loadFromJSON(JSON.parse(history[newIndex]))
      fabricRef.current.renderAll()
    }
  }

  const redo = () => {
    if (historyIndex < history.length - 1 && fabricRef.current) {
      const newIndex = historyIndex + 1
      setHistoryIndex(newIndex)
      fabricRef.current.loadFromJSON(JSON.parse(history[newIndex]))
      fabricRef.current.renderAll()
    }
  }

  const exportPNG = () => {
    if (!fabricRef.current) return
    const dataURL = fabricRef.current.toDataURL({ multiplier: 2 })
    const link = document.createElement('a')
    link.download = `certificate-${Date.now()}.png`
    link.href = dataURL
    link.click()
  }

  const exportJSON = () => {
    if (!fabricRef.current) return
    const json = JSON.stringify(fabricRef.current.toJSON(), null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.download = `certificate-${Date.now()}.json`
    link.href = url
    link.click()
    URL.revokeObjectURL(url)
  }

  const testLongName = () => {
    if (!fabricRef.current) return
    const objects = fabricRef.current.getObjects()
    const recipientText = objects.find((obj: any) => obj.get && obj.get('data')?.id === 'recipient_name')
    if (recipientText instanceof Textbox) {
      recipientText.set({ text: 'Extraordinarily Long Recipient Name That Should Shrink To Fit' })
      // Shrink to fit logic
      const data = recipientText.get('data') as any
      if (data?.shrinkToFit) {
        const maxWidth = recipientText.width || 300
        while (recipientText.getBoundingRect().width > maxWidth && recipientText.fontSize! > 12) {
          recipientText.set({ fontSize: recipientText.fontSize! - 1 })
        }
      }
      fabricRef.current.renderAll()
      saveHistory()
    }
  }

  const updateTextStyle = (property: string, value: any) => {
    if (!selectedObject || !fabricRef.current) return
    selectedObject.set(property, value)
    fabricRef.current.renderAll()
    saveHistory()
  }

  const deleteSelected = () => {
    if (!selectedObject || !fabricRef.current) return
    fabricRef.current.remove(selectedObject)
    setSelectedObject(null)
    setSelectedObjects([])
    setToolbarPos({ x: 0, y: 0, visible: false })
    fabricRef.current.renderAll()
    saveHistory()
  }

  const groupSelected = () => {
    if (!fabricRef.current || selectedObjects.length < 2) return
    const activeSelection = fabricRef.current.getActiveObject()
    if (activeSelection && activeSelection.type === 'activeSelection') {
      const group = (activeSelection as any).toGroup()
      fabricRef.current.requestRenderAll()
      saveHistory()
    }
  }

  const ungroupSelected = () => {
    if (!fabricRef.current || !selectedObject || selectedObject.type !== 'group') return
    selectedObject.toActiveSelection()
    fabricRef.current.requestRenderAll()
    saveHistory()
  }

  const alignSelected = (alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => {
    if (!fabricRef.current || selectedObjects.length === 0) return
    
    const canvas = fabricRef.current
    const activeObject = canvas.getActiveObject()
    
    if (selectedObjects.length === 1 && activeObject) {
      // Align to canvas
      const canvasWidth = canvas.width || 0
      const canvasHeight = canvas.height || 0
      const obj = activeObject
      
      switch (alignment) {
        case 'left':
          obj.set({ left: 0 })
          break
        case 'center':
          obj.set({ left: (canvasWidth - (obj.width || 0) * (obj.scaleX || 1)) / 2 })
          break
        case 'right':
          obj.set({ left: canvasWidth - (obj.width || 0) * (obj.scaleX || 1) })
          break
        case 'top':
          obj.set({ top: 0 })
          break
        case 'middle':
          obj.set({ top: (canvasHeight - (obj.height || 0) * (obj.scaleY || 1)) / 2 })
          break
        case 'bottom':
          obj.set({ top: canvasHeight - (obj.height || 0) * (obj.scaleY || 1) })
          break
      }
      obj.setCoords()
    } else if (selectedObjects.length > 1) {
      // Align to first selected object
      const bounds = {
        left: Math.min(...selectedObjects.map(obj => obj.left || 0)),
        top: Math.min(...selectedObjects.map(obj => obj.top || 0)),
        right: Math.max(...selectedObjects.map(obj => (obj.left || 0) + (obj.width || 0) * (obj.scaleX || 1))),
        bottom: Math.max(...selectedObjects.map(obj => (obj.top || 0) + (obj.height || 0) * (obj.scaleY || 1)))
      }
      
      selectedObjects.forEach(obj => {
        switch (alignment) {
          case 'left':
            obj.set({ left: bounds.left })
            break
          case 'center':
            obj.set({ left: bounds.left + (bounds.right - bounds.left - (obj.width || 0) * (obj.scaleX || 1)) / 2 })
            break
          case 'right':
            obj.set({ left: bounds.right - (obj.width || 0) * (obj.scaleX || 1) })
            break
          case 'top':
            obj.set({ top: bounds.top })
            break
          case 'middle':
            obj.set({ top: bounds.top + (bounds.bottom - bounds.top - (obj.height || 0) * (obj.scaleY || 1)) / 2 })
            break
          case 'bottom':
            obj.set({ top: bounds.bottom - (obj.height || 0) * (obj.scaleY || 1) })
            break
        }
        obj.setCoords()
      })
    }
    
    canvas.requestRenderAll()
    saveHistory()
  }

  const distributeSelected = (direction: 'horizontal' | 'vertical') => {
    if (!fabricRef.current || selectedObjects.length < 3) return
    
    const sorted = [...selectedObjects].sort((a, b) => {
      if (direction === 'horizontal') {
        return (a.left || 0) - (b.left || 0)
      } else {
        return (a.top || 0) - (b.top || 0)
      }
    })
    
    const first = sorted[0]
    const last = sorted[sorted.length - 1]
    
    if (direction === 'horizontal') {
      const totalWidth = sorted.reduce((sum, obj) => sum + (obj.width || 0) * (obj.scaleX || 1), 0)
      const availableSpace = ((last.left || 0) + (last.width || 0) * (last.scaleX || 1)) - (first.left || 0)
      const gap = (availableSpace - totalWidth) / (sorted.length - 1)
      
      let currentLeft = (first.left || 0) + (first.width || 0) * (first.scaleX || 1)
      for (let i = 1; i < sorted.length - 1; i++) {
        sorted[i].set({ left: currentLeft + gap })
        currentLeft += gap + (sorted[i].width || 0) * (sorted[i].scaleX || 1)
        sorted[i].setCoords()
      }
    } else {
      const totalHeight = sorted.reduce((sum, obj) => sum + (obj.height || 0) * (obj.scaleY || 1), 0)
      const availableSpace = ((last.top || 0) + (last.height || 0) * (last.scaleY || 1)) - (first.top || 0)
      const gap = (availableSpace - totalHeight) / (sorted.length - 1)
      
      let currentTop = (first.top || 0) + (first.height || 0) * (first.scaleY || 1)
      for (let i = 1; i < sorted.length - 1; i++) {
        sorted[i].set({ top: currentTop + gap })
        currentTop += gap + (sorted[i].height || 0) * (sorted[i].scaleY || 1)
        sorted[i].setCoords()
      }
    }
    
    fabricRef.current.requestRenderAll()
    saveHistory()
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Top Toolbar */}
      <div className="bg-white border-b px-4 py-2 flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Template:</span>
          {Object.keys(TEMPLATES).map((key) => (
            <button
              key={key}
              onClick={() => setSelectedTemplate(key as keyof typeof TEMPLATES)}
              className={`px-3 py-1 text-sm rounded ${
                selectedTemplate === key
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              {TEMPLATES[key as keyof typeof TEMPLATES].name}
            </button>
          ))}
        </div>

        <div className="border-l pl-4 flex items-center gap-2">
          <button
            onClick={undo}
            disabled={historyIndex <= 0}
            className="px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-30"
          >
            Undo
          </button>
          <button
            onClick={redo}
            disabled={historyIndex >= history.length - 1}
            className="px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-30"
          >
            Redo
          </button>
        </div>

        <div className="border-l pl-4 flex items-center gap-2">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={showFieldNames}
              onChange={(e) => {
                setShowFieldNames(e.target.checked)
                if (fabricRef.current) {
                  loadTemplate(selectedTemplate, fabricRef.current)
                }
              }}
              className="rounded"
            />
            Show field names
          </label>
        </div>

        <div className="border-l pl-4 flex items-center gap-2">
          <button
            onClick={testLongName}
            className="px-3 py-1 text-sm bg-purple-100 text-purple-700 rounded hover:bg-purple-200"
          >
            Test Long Name
          </button>
        </div>

        <div className="border-l pl-4 flex items-center gap-2">
          <span className="text-sm font-medium">Multi-select:</span>
          <button
            onClick={groupSelected}
            disabled={selectedObjects.length < 2}
            className="px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-30"
            title="Group selected objects (select multiple with Shift+Click)"
          >
            Group
          </button>
          <button
            onClick={ungroupSelected}
            disabled={!selectedObject || selectedObject.type !== 'group'}
            className="px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-30"
          >
            Ungroup
          </button>
        </div>

        <div className="border-l pl-4 flex items-center gap-2">
          <span className="text-sm font-medium">Align:</span>
          <button
            onClick={() => alignSelected('left')}
            disabled={selectedObjects.length === 0}
            className="px-2 py-1 text-xs border rounded hover:bg-gray-50 disabled:opacity-30"
            title="Align left"
          >
            ⬅
          </button>
          <button
            onClick={() => alignSelected('center')}
            disabled={selectedObjects.length === 0}
            className="px-2 py-1 text-xs border rounded hover:bg-gray-50 disabled:opacity-30"
            title="Align center"
          >
            ↔
          </button>
          <button
            onClick={() => alignSelected('right')}
            disabled={selectedObjects.length === 0}
            className="px-2 py-1 text-xs border rounded hover:bg-gray-50 disabled:opacity-30"
            title="Align right"
          >
            ➡
          </button>
          <button
            onClick={() => alignSelected('top')}
            disabled={selectedObjects.length === 0}
            className="px-2 py-1 text-xs border rounded hover:bg-gray-50 disabled:opacity-30"
            title="Align top"
          >
            ⬆
          </button>
          <button
            onClick={() => alignSelected('middle')}
            disabled={selectedObjects.length === 0}
            className="px-2 py-1 text-xs border rounded hover:bg-gray-50 disabled:opacity-30"
            title="Align middle"
          >
            ↕
          </button>
          <button
            onClick={() => alignSelected('bottom')}
            disabled={selectedObjects.length === 0}
            className="px-2 py-1 text-xs border rounded hover:bg-gray-50 disabled:opacity-30"
            title="Align bottom"
          >
            ⬇
          </button>
        </div>

        <div className="border-l pl-4 flex items-center gap-2">
          <span className="text-sm font-medium">Distribute:</span>
          <button
            onClick={() => distributeSelected('horizontal')}
            disabled={selectedObjects.length < 3}
            className="px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-30"
            title="Distribute horizontally"
          >
            ⟷
          </button>
          <button
            onClick={() => distributeSelected('vertical')}
            disabled={selectedObjects.length < 3}
            className="px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-30"
            title="Distribute vertically"
          >
            ⟱
          </button>
        </div>

        <div className="border-l pl-4 flex items-center gap-2">
          <button
            onClick={exportPNG}
            className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
          >
            Export PNG
          </button>
          <button
            onClick={exportJSON}
            className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Export JSON
          </button>
        </div>
      </div>

      {/* Canvas Container */}
      <div ref={containerRef} className="flex-1 flex items-center justify-center p-4 overflow-hidden">
        <canvas ref={canvasRef} />
      </div>

      {/* Floating Toolbar */}
      {toolbarPos.visible && selectedObject && (selectedObject instanceof IText || selectedObject instanceof Textbox) && (
        <div
          className="fixed bg-white rounded-lg shadow-xl border border-gray-200 px-3 py-2 flex items-center gap-2 z-50"
          style={{ left: toolbarPos.x, top: toolbarPos.y, transform: 'translateX(-50%)' }}
        >
          <select
            value={selectedObject.fontFamily || 'Inter'}
            onChange={(e) => updateTextStyle('fontFamily', e.target.value)}
            className="text-xs border rounded px-2 py-1"
          >
            <option value="Inter">Inter</option>
            <option value="Playfair Display">Playfair Display</option>
            <option value="Montserrat">Montserrat</option>
          </select>

          <input
            type="number"
            value={selectedObject.fontSize || 16}
            onChange={(e) => updateTextStyle('fontSize', parseInt(e.target.value))}
            className="text-xs border rounded px-2 py-1 w-16"
          />

          <button
            onClick={() => updateTextStyle('fontWeight', selectedObject.fontWeight === 'bold' ? 'normal' : 'bold')}
            className={`px-2 py-1 text-xs font-bold rounded ${
              selectedObject.fontWeight === 'bold' ? 'bg-blue-100' : 'hover:bg-gray-100'
            }`}
          >
            B
          </button>

          <button
            onClick={() => updateTextStyle('fontStyle', selectedObject.fontStyle === 'italic' ? 'normal' : 'italic')}
            className={`px-2 py-1 text-xs italic rounded ${
              selectedObject.fontStyle === 'italic' ? 'bg-blue-100' : 'hover:bg-gray-100'
            }`}
          >
            I
          </button>

          <input
            type="color"
            value={(selectedObject.fill as string) || '#000000'}
            onChange={(e) => updateTextStyle('fill', e.target.value)}
            className="w-8 h-8 border rounded cursor-pointer"
          />

          <div className="flex border rounded">
            <button
              onClick={() => updateTextStyle('textAlign', 'left')}
              className="px-2 py-1 text-xs hover:bg-gray-100"
            >
              ⬅
            </button>
            <button
              onClick={() => updateTextStyle('textAlign', 'center')}
              className="px-2 py-1 text-xs border-l hover:bg-gray-100"
            >
              ↔
            </button>
            <button
              onClick={() => updateTextStyle('textAlign', 'right')}
              className="px-2 py-1 text-xs border-l hover:bg-gray-100"
            >
              ➡
            </button>
          </div>

          <button
            onClick={deleteSelected}
            className="px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded ml-2"
          >
            🗑
          </button>
        </div>
      )}

      {/* Help Text */}
      <div className="bg-gray-100 border-t px-4 py-2 text-xs text-gray-600">
        <strong>Tips:</strong> Double-click text to edit inline • Drag to move • Corner handles to resize/rotate • 
        <strong> Shift+Click for multi-select</strong> • Group/ungroup, align, and distribute tools above • 
        Snap guides enabled (15° rotation, 10px position) • Test long name button demos shrink-to-fit • Template switch preserves content by field ID
      </div>
    </div>
  )
}
