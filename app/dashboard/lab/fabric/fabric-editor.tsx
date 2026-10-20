'use client'

import { useEffect, useRef, useState } from 'react'
import { Canvas, IText, Textbox } from 'fabric'
import { initAligningGuidelines } from 'fabric/extensions'
import { useFabricCanvas } from '@/lib/fabric/useFabricCanvas'
import { CanvasHistory } from '@/lib/fabric/history'
import { loadFonts, extractFontsFromConfig } from '@/lib/fabric/fonts'
import { FieldText } from '@/lib/fabric/objects/FieldText'
import { designConfigToFabric, fabricToDesignConfig } from '@/lib/fabric/serialize'
import { enableAutoShrink } from '@/lib/fabric/fit-text'
import { KeyboardShortcuts } from './keyboard-shortcuts'
import { TEMPLATES, SAMPLE_DATA, getTemplateDisplayName } from './templates'
import {
  alignLeft,
  alignRight,
  alignTop,
  alignBottom,
  alignCenterH,
  alignCenterV,
  distributeH,
  distributeV
} from './align-utils'

export default function FabricEditor() {
  const containerRef = useRef<HTMLDivElement>(null)
  const { canvasRef, canvas, history, isReady } = useFabricCanvas({
    width: 1123,
    height: 794,
    backgroundColor: '#ffffff'
  })
  
  const keyboardRef = useRef<KeyboardShortcuts | null>(null)
  const cleanupGuidelinesRef = useRef<(() => void) | null>(null)
  
  const [selectedTemplate, setSelectedTemplate] = useState<keyof typeof TEMPLATES>('modern-saas-gradient')
  const [selectedObject, setSelectedObject] = useState<any>(null)
  const [selectedObjects, setSelectedObjects] = useState<any[]>([])
  const [historyState, setHistoryState] = useState({ canUndo: false, canRedo: false })
  const [toolbarPos, setToolbarPos] = useState({ x: 0, y: 0, visible: false })
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({})
  
  // Track user content by field ID to preserve across template switches and undo
  const userContentRef = useRef<Record<string, string>>({ ...SAMPLE_DATA })

  // Initialize canvas with template, aligning guidelines, and keyboard shortcuts
  useEffect(() => {
    if (!canvas || !history || !isReady) return

    // Initialize aligning guidelines
    cleanupGuidelinesRef.current = initAligningGuidelines(canvas, {
      color: '#2563eb',
      width: 1,
      margin: 4
    })

    // Initialize keyboard shortcuts
    keyboardRef.current = new KeyboardShortcuts({
      canvas,
      history
    })

    // Load initial template
    loadTemplate(selectedTemplate)

    // Setup selection handlers
    canvas.on('selection:created', handleSelection)
    canvas.on('selection:updated', handleSelection)
    canvas.on('selection:cleared', () => {
      setSelectedObject(null)
      setSelectedObjects([])
      setToolbarPos(prev => ({ ...prev, visible: false }))
    })

    // Listen to history changes
    const unsubscribe = history.onChange(setHistoryState)

    // Cleanup
    return () => {
      unsubscribe()
      keyboardRef.current?.dispose()
      cleanupGuidelinesRef.current?.()
    }
  }, [canvas, history, isReady])

  // Generate thumbnails
  useEffect(() => {
    if (!isReady) return
    generateThumbnails()
  }, [isReady])

  const handleSelection = (e: any) => {
    const selected = canvas?.getActiveObjects() || []
    setSelectedObjects(selected)
    setSelectedObject(selected.length === 1 ? selected[0] : null)

    if (selected.length === 1 && (selected[0] instanceof IText || selected[0] instanceof Textbox)) {
      const obj = selected[0]
      const bound = obj.getBoundingRect()
      const zoom = canvas?.getZoom() || 1
      setToolbarPos({
        x: bound.left + bound.width / 2,
        y: bound.top - 50,
        visible: true
      })
    } else {
      setToolbarPos(prev => ({ ...prev, visible: false }))
    }
  }

  const loadTemplate = async (templateKey: keyof typeof TEMPLATES) => {
    if (!canvas) return

    const config = TEMPLATES[templateKey]
    
    // Preload fonts
    const fonts = extractFontsFromConfig(config)
    await loadFonts(fonts)

    // Save current field content
    saveFieldContent()

    // Load template
    await designConfigToFabric(config, canvas)

    // Restore user content to field elements
    restoreFieldContent()

    // Enable auto-shrink on all FieldText objects
    canvas.getObjects().forEach(obj => {
      if (obj instanceof FieldText && obj.autoShrink) {
        enableAutoShrink(obj, {
          minFontSize: obj.minFontSize,
          maxLines: obj.maxLines
        })
      }
    })

    canvas.renderAll()
    
    // Save initial state for undo
    if (history) {
      await history.saveState()
    }
  }

  const saveFieldContent = () => {
    if (!canvas) return
    
    canvas.getObjects().forEach((obj: any) => {
      if (obj instanceof FieldText || obj.get?.('data')?.field) {
        const fieldId = obj.field || obj.get('data')?.field
        const text = obj.text || ''
        if (fieldId && text) {
          userContentRef.current[fieldId] = text
        }
      }
    })
  }

  const restoreFieldContent = () => {
    if (!canvas) return
    
    canvas.getObjects().forEach((obj: any) => {
      if (obj instanceof FieldText) {
        const content = userContentRef.current[obj.field]
        if (content) {
          obj.set({ text: content })
        }
      }
    })
  }

  const handleTemplateSwitch = async (templateKey: keyof typeof TEMPLATES) => {
    setSelectedTemplate(templateKey)
    await loadTemplate(templateKey)
  }

  const generateThumbnails = async () => {
    const thumbs: Record<string, string> = {}
    
    for (const key of Object.keys(TEMPLATES)) {
      const config = TEMPLATES[key as keyof typeof TEMPLATES]
      const thumbCanvas = document.createElement('canvas')
      const thumbWidth = 200
      const thumbHeight = (config.pages[0].height / config.pages[0].width) * thumbWidth
      
      thumbCanvas.width = thumbWidth
      thumbCanvas.height = thumbHeight
      
      const thumbFabric = new Canvas(thumbCanvas, {
        width: config.pages[0].width,
        height: config.pages[0].height
      })
      
      // Load template (without user content)
      await designConfigToFabric(config, thumbFabric)
      
      // Scale to thumbnail size
      const scale = thumbWidth / config.pages[0].width
      thumbFabric.setZoom(scale)
      thumbFabric.setDimensions({ width: thumbWidth, height: thumbHeight })
      
      thumbs[key] = thumbCanvas.toDataURL()
      thumbFabric.dispose()
    }
    
    setThumbnails(thumbs)
  }

  const updateTextStyle = (property: string, value: any) => {
    if (!selectedObject || !canvas) return
    
    selectedObject.set({ [property]: value })
    canvas.requestRenderAll()
  }

  const addTextField = () => {
    if (!canvas) return
    
    const field = new FieldText('New Field', {
      left: 100,
      top: 100,
      width: 200,
      fontSize: 24,
      fill: '#000000',
      field: 'custom_1',
      autoShrink: true
    } as any)
    
    enableAutoShrink(field)
    canvas.add(field)
    canvas.setActiveObject(field)
    canvas.requestRenderAll()
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Toolbar */}
      <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center gap-2 flex-wrap">
        <button
          onClick={addTextField}
          className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Add Field
        </button>
        
        <div className="border-l border-gray-300 h-6 mx-2" />
        
        <button
          onClick={() => history?.undo()}
          disabled={!historyState.canUndo}
          className="px-3 py-1.5 text-sm border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Undo (Cmd/Ctrl+Z)"
        >
          Undo
        </button>
        <button
          onClick={() => history?.redo()}
          disabled={!historyState.canRedo}
          className="px-3 py-1.5 text-sm border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Redo (Shift+Cmd/Ctrl+Z)"
        >
          Redo
        </button>
        
        {selectedObjects.length >= 2 && (
          <>
            <div className="border-l border-gray-300 h-6 mx-2" />
            <button onClick={() => alignLeft(canvas!)} className="px-2 py-1 text-xs border rounded hover:bg-gray-50" title="Align Left">
              ⬅️
            </button>
            <button onClick={() => alignCenterH(canvas!)} className="px-2 py-1 text-xs border rounded hover:bg-gray-50" title="Center Horizontally">
              ↔️
            </button>
            <button onClick={() => alignRight(canvas!)} className="px-2 py-1 text-xs border rounded hover:bg-gray-50" title="Align Right">
              ➡️
            </button>
            <button onClick={() => alignTop(canvas!)} className="px-2 py-1 text-xs border rounded hover:bg-gray-50" title="Align Top">
              ⬆️
            </button>
            <button onClick={() => alignCenterV(canvas!)} className="px-2 py-1 text-xs border rounded hover:bg-gray-50" title="Center Vertically">
              ↕️
            </button>
            <button onClick={() => alignBottom(canvas!)} className="px-2 py-1 text-xs border rounded hover:bg-gray-50" title="Align Bottom">
              ⬇️
            </button>
            
            {selectedObjects.length >= 3 && (
              <>
                <div className="border-l border-gray-300 h-6 mx-2" />
                <button onClick={() => distributeH(canvas!)} className="px-2 py-1 text-xs border rounded hover:bg-gray-50" title="Distribute Horizontally">
                  ↔️ Dist
                </button>
                <button onClick={() => distributeV(canvas!)} className="px-2 py-1 text-xs border rounded hover:bg-gray-50" title="Distribute Vertically">
                  ↕️ Dist
                </button>
              </>
            )}
          </>
        )}
        
        <div className="ml-auto text-xs text-gray-500">
          Shortcuts: Cmd/Ctrl+Z (Undo) • Cmd/Ctrl+D (Duplicate) • Delete • Arrows (Nudge)
        </div>
      </div>

      {/* Template Thumbnails */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex gap-3 overflow-x-auto">
          {Object.keys(TEMPLATES).map(key => (
            <button
              key={key}
              onClick={() => handleTemplateSwitch(key as keyof typeof TEMPLATES)}
              className={`flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all ${
                selectedTemplate === key ? 'border-blue-600 shadow-lg' : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {thumbnails[key] ? (
                <img 
                  src={thumbnails[key]} 
                  alt={getTemplateDisplayName(key)}
                  className="w-32 h-auto block"
                />
              ) : (
                <div className="w-32 h-24 bg-gray-100 flex items-center justify-center text-xs text-gray-400">
                  Loading...
                </div>
              )}
              <div className={`text-xs py-1 px-2 text-center ${
                selectedTemplate === key ? 'bg-blue-600 text-white' : 'bg-gray-50 text-gray-700'
              }`}>
                {getTemplateDisplayName(key)}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Canvas Container — always render canvas so useFabricCanvas can attach */}
      <div ref={containerRef} className="relative flex-1 flex items-center justify-center p-4 overflow-hidden">
        <canvas ref={canvasRef} />
        {!isReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50/80 z-10">
            <div className="text-gray-500">Loading Fabric editor...</div>
          </div>
        )}
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
            <option value="Georgia">Georgia</option>
          </select>

          <input
            type="number"
            value={selectedObject.fontSize || 16}
            onChange={(e) => updateTextStyle('fontSize', parseInt(e.target.value))}
            className="text-xs border rounded px-2 py-1 w-16"
          />

          <input
            type="color"
            value={typeof selectedObject.fill === 'string' ? selectedObject.fill : '#000000'}
            onChange={(e) => updateTextStyle('fill', e.target.value)}
            className="w-8 h-8 border rounded cursor-pointer"
          />
        </div>
      )}
    </div>
  )
}
