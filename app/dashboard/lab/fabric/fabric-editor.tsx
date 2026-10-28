'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { IText, Textbox, StaticCanvas } from 'fabric'
import { initAligningGuidelines } from 'fabric/extensions'
import { useFabricCanvas } from '@/lib/fabric/useFabricCanvas'
import { loadFonts, extractFontsFromConfig } from '@/lib/fabric/fonts'
import { FieldText } from '@/lib/fabric/objects/FieldText'
import { designConfigToFabric } from '@/lib/fabric/serialize'
import { enableAutoShrink } from '@/lib/fabric/fit-text'
import {
  collectTextById,
  mergeTextById,
  resolveTextById,
} from '@/lib/fabric/text-by-id'
import { KeyboardShortcuts } from './keyboard-shortcuts'
import {
  TEMPLATES,
  SAMPLE_DATA,
  getTemplateCatalog,
  getCatalogCategories,
  filterCatalogByCategory,
  type TemplateCatalogEntry,
} from './templates'
import {
  BLANK_TEMPLATE_ID,
  createBlankLandscapeTemplate,
} from './blank-template'
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

type DesignKey = keyof typeof TEMPLATES | typeof BLANK_TEMPLATE_ID
type CategoryFilter = 'all' | string

const THUMB_WIDTH = 280
const CANVAS_PADDING = 24

function resolveDesignConfig(key: DesignKey) {
  if (key === BLANK_TEMPLATE_ID) return createBlankLandscapeTemplate()
  return TEMPLATES[key]
}

function textIdForObject(obj: any): string | null {
  const data = obj.get?.('data') || obj.data || {}
  if (data.id) return data.id as string
  if (obj instanceof FieldText || obj.type === 'FieldText') {
    return (obj.field as string) || null
  }
  return null
}

export default function FabricEditor() {
  const containerRef = useRef<HTMLDivElement>(null)
  const { canvasRef, canvas, history, isReady } = useFabricCanvas({
    width: 1123,
    height: 794,
    backgroundColor: '#ffffff'
  })
  
  const keyboardRef = useRef<KeyboardShortcuts | null>(null)
  const cleanupGuidelinesRef = useRef<(() => void) | null>(null)
  const selectedTemplateRef = useRef<DesignKey | null>(null)
  const hasLoadedDesignRef = useRef(false)
  
  const [selectedTemplate, setSelectedTemplate] = useState<DesignKey | null>(null)
  const [selectedObject, setSelectedObject] = useState<any>(null)
  const [selectedObjects, setSelectedObjects] = useState<any[]>([])
  const [historyState, setHistoryState] = useState({ canUndo: false, canRedo: false })
  const [toolbarPos, setToolbarPos] = useState({ x: 0, y: 0, visible: false })
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({})
  const [showStartScreen, setShowStartScreen] = useState(true)
  const [startScreenMode, setStartScreenMode] = useState<'initial' | 'change'>('initial')
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all')
  
  // Track user content by field/element id to preserve across template switches
  const userContentRef = useRef<Record<string, string>>({ ...SAMPLE_DATA })

  const catalog = useMemo(() => getTemplateCatalog(TEMPLATES), [])
  const categories = useMemo(() => getCatalogCategories(catalog), [catalog])
  const filteredCatalog = useMemo(
    () => filterCatalogByCategory(catalog, categoryFilter),
    [catalog, categoryFilter]
  )

  const fitCanvasToContainer = useCallback((templateKey: DesignKey | null = selectedTemplateRef.current) => {
    if (!canvas || !containerRef.current || !templateKey) return

    const page = resolveDesignConfig(templateKey).pages[0]
    const availableWidth = containerRef.current.clientWidth - CANVAS_PADDING * 2
    const availableHeight = containerRef.current.clientHeight - CANVAS_PADDING * 2
    if (availableWidth <= 0 || availableHeight <= 0) return

    // Fill the area below the toolbar; portrait uses full height via height-bound scale
    const scale = Math.min(availableWidth / page.width, availableHeight / page.height)

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

    const sources = canvas.getObjects()
      .map((obj: any) => {
        const id = textIdForObject(obj)
        if (!id) return null
        return { id, text: (obj.text as string) || '' }
      })
      .filter((s): s is { id: string; text: string } => s !== null)

    userContentRef.current = mergeTextById(
      userContentRef.current,
      collectTextById(sources)
    )
  }, [canvas])

  const restoreFieldContent = useCallback(() => {
    if (!canvas) return

    canvas.getObjects().forEach((obj: any) => {
      const id = textIdForObject(obj)
      if (!id) return
      const content = resolveTextById(id, userContentRef.current)
      if (content !== undefined) {
        obj.set({ text: content })
      }
    })
  }, [canvas])

  const loadTemplate = useCallback(async (templateKey: DesignKey) => {
    if (!canvas) return

    const config = resolveDesignConfig(templateKey)
    
    // Preload fonts before rendering
    const fonts = extractFontsFromConfig(config)
    await loadFonts(fonts)

    // Save current field content by id when switching away from an existing design
    if (hasLoadedDesignRef.current) {
      saveFieldContent()
    }

    // Pause history while we clear + rebuild (avoid ghost snapshots)
    history?.pause()

    // Clear all objects and reset background so old template doesn't linger
    canvas.clear()
    canvas.backgroundImage = undefined
    canvas.backgroundColor = '#ffffff'

    // Load new template
    await designConfigToFabric(config, canvas)

    // Restore user text by id (never create duplicate field ids)
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
    hasLoadedDesignRef.current = true
    fitCanvasToContainer(templateKey)
    canvas.renderAll()

    // Fresh history snapshot for this design (first load or switch)
    history?.resume()
    history?.clear()
    await history?.saveState()
  }, [canvas, history, saveFieldContent, restoreFieldContent, fitCanvasToContainer])

  // Initialize aligning guidelines + keyboard shortcuts (no auto template load)
  useEffect(() => {
    if (!canvas || !history || !isReady) return

    cleanupGuidelinesRef.current = initAligningGuidelines(canvas, {
      color: '#2563eb',
      width: 1,
      margin: 4
    })

    keyboardRef.current = new KeyboardShortcuts({
      canvas,
      history
    })

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

    const unsubscribe = history.onChange(setHistoryState)

    return () => {
      unsubscribe()
      keyboardRef.current?.dispose()
      cleanupGuidelinesRef.current?.()
      canvas.off('selection:created', handleSelection)
      canvas.off('selection:updated', handleSelection)
      canvas.off('selection:cleared', onCleared)
    }
  }, [canvas, history, isReady])

  // Fit canvas on window resize and orientation change
  useEffect(() => {
    if (!isReady || !canvas || !selectedTemplate) return

    const onResize = () => fitCanvasToContainer()
    window.addEventListener('resize', onResize)
    window.addEventListener('orientationchange', onResize)
    requestAnimationFrame(() => fitCanvasToContainer())

    return () => {
      window.removeEventListener('resize', onResize)
      window.removeEventListener('orientationchange', onResize)
    }
  }, [isReady, canvas, fitCanvasToContainer, selectedTemplate])

  const generateThumbnails = useCallback(async () => {
    const thumbs: Record<string, string> = {}

    for (const entry of getTemplateCatalog(TEMPLATES)) {
      const config = entry.config
      const page = config.pages[0]
      const fonts = extractFontsFromConfig(config)
      await loadFonts(fonts)

      const thumbWidth = THUMB_WIDTH
      const thumbHeight = (page.height / page.width) * thumbWidth
      const el = document.createElement('canvas')

      const thumbFabric = new StaticCanvas(el, {
        width: page.width,
        height: page.height,
        renderOnAddRemove: false
      })

      try {
        await designConfigToFabric(config, thumbFabric)

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

        thumbs[entry.key] = thumbFabric.toDataURL({ format: 'png', multiplier: 1 })
      } catch (err) {
        console.warn(`Thumbnail failed for ${entry.key}`, err)
      } finally {
        thumbFabric.dispose()
      }
    }

    setThumbnails(thumbs)
  }, [])

  useEffect(() => {
    if (!isReady) return
    void generateThumbnails()
  }, [isReady, generateThumbnails])

  const openChangeTemplate = () => {
    setStartScreenMode('change')
    setShowStartScreen(true)
  }

  const cancelChangeTemplate = () => {
    setShowStartScreen(false)
    setStartScreenMode('initial')
  }

  const handleDesignSelect = async (templateKey: DesignKey) => {
    setSelectedTemplate(templateKey)
    selectedTemplateRef.current = templateKey
    await loadTemplate(templateKey)
    setShowStartScreen(false)
    setStartScreenMode('initial')
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
    <div className="h-full flex flex-col bg-gray-50 relative">
      {/* Toolbar — visible once a design has been chosen */}
      {selectedTemplate !== null && (
        <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center gap-2 flex-wrap shrink-0">
          <button
            onClick={addTextField}
            className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Add Field
          </button>

          <button
            onClick={openChangeTemplate}
            className="px-3 py-1.5 text-sm border rounded hover:bg-gray-50"
          >
            Change template
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
      )}

      {/* Canvas Container — always render canvas so useFabricCanvas can attach */}
      <div
        ref={containerRef}
        className="relative flex-1 flex items-center justify-center overflow-hidden min-h-0"
        style={{ padding: CANVAS_PADDING }}
      >
        <canvas ref={canvasRef} className={showStartScreen ? 'invisible' : undefined} />
        {!isReady && !showStartScreen && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50/80 z-10">
            <div className="text-gray-500">Loading Fabric editor...</div>
          </div>
        )}
      </div>

      {/* Start screen / Change template overlay */}
      {showStartScreen && (
        <StartScreen
          mode={startScreenMode}
          categories={categories}
          categoryFilter={categoryFilter}
          onCategoryChange={setCategoryFilter}
          catalog={filteredCatalog}
          thumbnails={thumbnails}
          onSelectBlank={() => void handleDesignSelect(BLANK_TEMPLATE_ID)}
          onSelectTemplate={(key) => void handleDesignSelect(key as DesignKey)}
          onCancel={startScreenMode === 'change' ? cancelChangeTemplate : undefined}
        />
      )}

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

function StartScreen({
  mode,
  categories,
  categoryFilter,
  onCategoryChange,
  catalog,
  thumbnails,
  onSelectBlank,
  onSelectTemplate,
  onCancel,
}: {
  mode: 'initial' | 'change'
  categories: string[]
  categoryFilter: CategoryFilter
  onCategoryChange: (c: CategoryFilter) => void
  catalog: TemplateCatalogEntry[]
  thumbnails: Record<string, string>
  onSelectBlank: () => void
  onSelectTemplate: (key: string) => void
  onCancel?: () => void
}) {
  return (
    <div className="absolute inset-0 z-40 bg-gray-50 overflow-y-auto">
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">
              {mode === 'change' ? 'Change template' : 'Start a design'}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {mode === 'change'
                ? 'Your field text is kept when you switch. Cancel to return unchanged.'
                : 'Start blank or pick a template. More templates appear here automatically when added.'}
            </p>
          </div>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-3 py-1.5 text-sm border rounded hover:bg-white shrink-0"
            >
              Cancel
            </button>
          )}
        </div>

        {/* Start blank */}
        <button
          type="button"
          onClick={onSelectBlank}
          className="w-full text-left rounded-xl border-2 border-dashed border-gray-300 bg-white hover:border-blue-500 hover:bg-blue-50/40 transition-colors p-6 mb-8"
        >
          <div className="flex items-center gap-4">
            <div className="w-16 h-12 rounded border border-gray-200 bg-gray-50 flex items-center justify-center text-gray-400 text-2xl">
              +
            </div>
            <div>
              <div className="font-medium text-gray-900">Start blank</div>
              <div className="text-sm text-gray-600">
                Landscape page with Recipient Name, Certificate Title, Description, Issue Date, and Issuer Name / Signature.
              </div>
            </div>
          </div>
        </button>

        {/* Category chips */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="text-sm font-medium text-gray-700 mr-1">Templates</span>
          <button
            type="button"
            onClick={() => onCategoryChange('all')}
            className={`px-3 py-1 text-xs rounded-full border ${
              categoryFilter === 'all'
                ? 'bg-gray-900 text-white border-gray-900'
                : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
            }`}
          >
            All
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              type="button"
              onClick={() => onCategoryChange(cat)}
              className={`px-3 py-1 text-xs rounded-full border ${
                categoryFilter === cat
                  ? 'bg-gray-900 text-white border-gray-900'
                  : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Catalog grid — driven by getTemplateCatalog(TEMPLATES), not a hard-coded list */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {catalog.map(entry => (
            <button
              key={entry.key}
              type="button"
              onClick={() => onSelectTemplate(entry.key)}
              className="text-left rounded-xl overflow-hidden border border-gray-200 bg-white hover:border-blue-500 hover:shadow-md transition-all"
            >
              <div className="bg-gray-100 flex items-center justify-center min-h-[160px]">
                {thumbnails[entry.key] ? (
                  <img
                    src={thumbnails[entry.key]}
                    alt={entry.name}
                    className="w-full h-auto block"
                    style={{ maxWidth: THUMB_WIDTH }}
                  />
                ) : (
                  <div
                    className="bg-gray-200 animate-pulse"
                    style={{ width: THUMB_WIDTH, height: Math.round(THUMB_WIDTH * 0.7) }}
                  />
                )}
              </div>
              <div className="px-3 py-2 flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-gray-900 truncate">{entry.name}</span>
                <span className="text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 shrink-0">
                  {entry.orientation}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
