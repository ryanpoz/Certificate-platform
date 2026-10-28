'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { IText, Textbox, StaticCanvas } from 'fabric'
import { initAligningGuidelines } from 'fabric/extensions'
import { useFabricCanvas } from '@/lib/fabric/useFabricCanvas'
import { CanvasHistory } from '@/lib/fabric/history'
import { loadFonts, extractFontsFromConfig } from '@/lib/fabric/fonts'
import { FieldText } from '@/lib/fabric/objects/FieldText'
import { designConfigToFabric } from '@/lib/fabric/serialize'
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

type TemplateKey = keyof typeof TEMPLATES

export default function FabricEditor() {
  const containerRef = useRef<HTMLDivElement>(null)
  const { canvasRef, canvas, history, isReady } = useFabricCanvas({
    width: 1123,
    height: 794,
    backgroundColor: '#ffffff'
  })
  
  const keyboardRef = useRef<KeyboardShortcuts | null>(null)
  const cleanupGuidelinesRef = useRef<(() => void) | null>(null)
  const selectedTemplateRef = useRef<TemplateKey>('modern-saas-gradient')
  
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateKey>('modern-saas-gradient')
  const [selectedObject, setSelectedObject] = useState<any>(null)
  const [selectedObjects, setSelectedObjects] = useState<any[]>([])
  const [historyState, setHistoryState] = useState({ canUndo: false, canRedo: false })
  const [toolbarPos, setToolbarPos] = useState({ x: 0, y: 0, visible: false })
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({})
  
  // Track user content by field ID to preserve across template switches and undo
  const userContentRef = useRef<Record<string, string>>({ ...SAMPLE_DATA })

  const fitCanvasToContainer = useCallback((templateKey: TemplateKey = selectedTemplateRef.current) => {
    if (!canvas || !containerRef.current) return

    const page = TEMPLATES[templateKey].pages[0]
    const padding = 32
    const availableWidth = containerRef.current.clientWidth - padding
    const availableHeight = containerRef.current.clientHeight - padding
    if (availableWidth <= 0 || availableHeight <= 0) return

    const scale = Math.min(availableWidth / page.width, availableHeight / page.height, 1)

    // Reset to page size, then zoom + set display dimensions to fit
    canvas.setDimensions({ width: page.width, height: page.height })
    canvas.setZoom(scale)
    canvas.setDimensions({
      width: page.width * scale,
      height: page.height * scale
    })
    canvas.requestRenderAll()
  }, [canvas])

  const saveFieldContent = useCallback(() => {
    if (!canvas) return
    
    canvas.getObjects().forEach((obj: any) => {
      if (obj instanceof FieldText || obj.type === 'FieldText') {
        const fieldId = obj.field
        const text = obj.text || ''
        if (fieldId && text) {
          userContentRef.current[fieldId] = text
        }
      }
    })
  }, [canvas])

  const restoreFieldContent = useCallback(() => {
    if (!canvas) return
    
    canvas.getObjects().forEach((obj: any) => {
      if (obj instanceof FieldText || obj.type === 'FieldText') {
        const content = userContentRef.current[obj.field]
        if (content) {
          obj.set({ text: content })
        }
      }
    })
  }, [canvas])

  const loadTemplate = useCallback(async (templateKey: TemplateKey) => {
    if (!canvas) return

    const config = TEMPLATES[templateKey]
    
    // Preload fonts before rendering
    const fonts = extractFontsFromConfig(config)
    await loadFonts(fonts)

    // Save current field content by field id
    saveFieldContent()

    // Pause history while we clear + rebuild (avoid ghost snapshots)
    history?.pause()

    // Clear all objects and reset background so old template doesn't linger
    canvas.clear()
    canvas.backgroundImage = undefined
    canvas.backgroundColor = '#ffffff'

    // Load new template
    await designConfigToFabric(config, canvas)

    // Restore user text by field id (never create duplicate fields)
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

    selectedTemplateRef.current = templateKey
    fitCanvasToContainer(templateKey)
    canvas.renderAll()

    // Resume history and take one clean snapshot
    history?.resume()
    history?.clear()
    await history?.saveState()
  }, [canvas, history, saveFieldContent, restoreFieldContent, fitCanvasToContainer])

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

    // Load initial template once when canvas is ready
    void loadTemplate(selectedTemplateRef.current)

    // Setup selection handlers
    const handleSelection = () => {
      const selected = canvas.getActiveObjects() || []
      setSelectedObjects(selected)
      setSelectedObject(selected.length === 1 ? selected[0] : null)

      if (selected.length === 1 && (selected[0] instanceof IText || selected[0] instanceof Textbox)) {
        const obj = selected[0]
        const bound = obj.getBoundingRect()
        setToolbarPos({
          x: bound.left + bound.width / 2,
          y: bound.top - 50,
          visible: true
        })
      } else {
        setToolbarPos(prev => ({ ...prev, visible: false }))
      }
    }

    const onCleared = () => {
      setSelectedObject(null)
      setSelectedObjects([])
      setToolbarPos(prev => ({ ...prev, visible: false }))
    }

    canvas.on('selection:created', handleSelection)
    canvas.on('selection:updated', handleSelection)
    canvas.on('selection:cleared', onCleared)

    // Listen to history changes
    const unsubscribe = history.onChange(setHistoryState)

    // Cleanup
    return () => {
      unsubscribe()
      keyboardRef.current?.dispose()
      cleanupGuidelinesRef.current?.()
      canvas.off('selection:created', handleSelection)
      canvas.off('selection:updated', handleSelection)
      canvas.off('selection:cleared', onCleared)
    }
    // Only re-init when canvas/history become ready — not on every loadTemplate identity change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvas, history, isReady])

  // Fit canvas on window resize
  useEffect(() => {
    if (!isReady || !canvas) return

    const onResize = () => fitCanvasToContainer()
    window.addEventListener('resize', onResize)
    // Fit once after layout settles
    requestAnimationFrame(() => fitCanvasToContainer())

    return () => window.removeEventListener('resize', onResize)
  }, [isReady, canvas, fitCanvasToContainer, selectedTemplate])

  const generateThumbnails = useCallback(async () => {
    const thumbs: Record<string, string> = {}

    for (const key of Object.keys(TEMPLATES) as TemplateKey[]) {
      const config = TEMPLATES[key]
      const page = config.pages[0]
      const fonts = extractFontsFromConfig(config)
      await loadFonts(fonts)

      const thumbWidth = 200
      const thumbHeight = (page.height / page.width) * thumbWidth
      const el = document.createElement('canvas')

      const thumbFabric = new StaticCanvas(el, {
        width: page.width,
        height: page.height,
        renderOnAddRemove: false
      })

      try {
        await designConfigToFabric(config, thumbFabric)

        // Apply sample field text for a recognizable preview
        thumbFabric.getObjects().forEach((obj: any) => {
          if (obj instanceof FieldText || obj.type === 'FieldText') {
            const sample = SAMPLE_DATA[obj.field]
            if (sample) obj.set({ text: sample })
          }
        })

        const scale = thumbWidth / page.width
        thumbFabric.setZoom(scale)
        thumbFabric.setDimensions({ width: thumbWidth, height: thumbHeight })
        thumbFabric.renderAll()

        thumbs[key] = thumbFabric.toDataURL({ format: 'png', multiplier: 1 })
      } catch (err) {
        console.warn(`Thumbnail failed for ${key}`, err)
      } finally {
        thumbFabric.dispose()
      }
    }

    setThumbnails(thumbs)
  }, [])

  // Generate thumbnails via offscreen StaticCanvas after fonts load
  useEffect(() => {
    if (!isReady) return
    void generateThumbnails()
  }, [isReady, generateThumbnails])

  const handleTemplateSwitch = async (templateKey: TemplateKey) => {
    if (templateKey === selectedTemplate) return
    setSelectedTemplate(templateKey)
    selectedTemplateRef.current = templateKey
    await loadTemplate(templateKey)
  }

  const updateTextStyle = (property: string, value: any) => {
    if (!selectedObject || !canvas) return
    
    selectedObject.set({ [property]: value })
    canvas.requestRenderAll()
  }

  const addTextField = () => {
    if (!canvas) return

    // Unique field id so we never create duplicate field keys
    const existing = new Set(
      canvas.getObjects()
        .filter((o: any) => o instanceof FieldText || o.type === 'FieldText')
        .map((o: any) => o.field as string)
    )
    let n = 1
    while (existing.has(`custom_${n}`) && n < 3) n++
    const fieldId = n <= 3 ? `custom_${n}` : `custom_${Date.now()}`
    
    const field = new FieldText('New Field', {
      left: 100,
      top: 100,
      width: 200,
      fontSize: 24,
      fill: '#000000',
      field: fieldId as any,
      autoShrink: true
    } as any)
    
    enableAutoShrink(field)
    canvas.add(field)
    canvas.setActiveObject(field)
    canvas.requestRenderAll()
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Toolbar */}
      <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center gap-2 flex-wrap shrink-0">
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
      <div className="bg-white border-b border-gray-200 px-4 py-3 shrink-0">
        <div className="flex gap-3 overflow-x-auto">
          {Object.keys(TEMPLATES).map(key => (
            <button
              key={key}
              onClick={() => handleTemplateSwitch(key as TemplateKey)}
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
      <div ref={containerRef} className="relative flex-1 flex items-center justify-center p-4 overflow-hidden min-h-0">
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
