'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { IText, Textbox, StaticCanvas, Image as FabricImage, Rect, Group, Ellipse, Circle, Line, Path, Triangle, Gradient } from 'fabric'
import { useFabricCanvas } from '@/lib/fabric/useFabricCanvas'
import { attachSnapGuides } from '@/lib/fabric/snap-guides'
import { createFabricShape } from '@/lib/fabric/create-shape'
import { strokeDashForStyle, styleFromDashArray, snapRotationAngle, type ShapeKind } from '@/lib/fabric/shapes'
import { serializeLocked } from '@/lib/fabric/lock'
import { loadFonts, extractFontsFromConfig } from '@/lib/fabric/fonts'
import { FieldText } from '@/lib/fabric/objects/FieldText'
import {
  designConfigToFabric,
  fabricToDesignConfig,
  applyBackground,
  canvasBackgroundToConfig,
  applyImageCornerRadius,
  lockImageAspectRatio,
} from '@/lib/fabric/serialize'
import type { DesignConfigV3 } from '@/lib/design-config/v3-schema'
import { enableAutoShrink } from '@/lib/fabric/fit-text'
import {
  collectTextById,
  mergeTextById,
  resolveTextById,
} from '@/lib/fabric/text-by-id'
import {
  selectFieldsToCarry,
  clampFieldPosition,
  type CarryFieldSnapshot,
} from '@/lib/fabric/carry-fields'
import {
  getPageSize,
  detectPageSize,
  remapObjectPositions,
  type PagePaper,
  type PageOrientation,
} from '@/lib/fabric/page-size'
import { scaleImageToPageFraction } from '@/lib/fabric/upload-validation'
import { createSolidBackground } from '@/lib/fabric/background'
import type { Background } from '@/lib/design-config/v3-schema'
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
import {
  alignSelection,
  distributeSelection,
  bringForward,
  sendBackward,
  bringToFront,
  sendToBack,
  groupSelection,
  ungroupSelection,
  toggleLockSelection,
  isSelectionLocked,
} from './arrange-utils'
import { EditorSidebar, type SidebarPanel } from './editor-sidebar'
import { BackgroundPanel } from './panels/background-panel'
import { TextPanel, type DynamicFieldOption } from './panels/text-panel'
import { UploadsPanel, type UploadedAsset } from './panels/uploads-panel'
import { ElementsPanel } from './panels/elements-panel'
import { FloatingObjectToolbar, CropToolbar } from './floating-object-toolbar'
import { ObjectContextMenu, type ContextMenuAction } from './context-menu'

type DesignKey = keyof typeof TEMPLATES | typeof BLANK_TEMPLATE_ID
type CategoryFilter = 'all' | string

const THUMB_WIDTH = 280
const CANVAS_PADDING = 24

function resolveDesignConfig(key: DesignKey): DesignConfigV3 {
  if (key === BLANK_TEMPLATE_ID) return createBlankLandscapeTemplate()
  return TEMPLATES[key]
}

function textIdForObject(obj: any): string | null {
  // FieldText must key off `field` so values survive template switches even when
  // element ids differ (e.g. blank uses id "certificate_title" for course_name).
  if (obj instanceof FieldText || obj.type === 'FieldText') {
    return ((obj.field as string) || null)
  }
  const data = obj.get?.('data') || obj.data || {}
  if (data.id) return data.id as string
  return null
}

function snapshotFieldText(obj: any): CarryFieldSnapshot | null {
  if (!(obj instanceof FieldText || obj.type === 'FieldText')) return null
  const field = (obj.field as string) || ''
  if (!field) return null
  const data = obj.get?.('data') || obj.data || {}
  return {
    field,
    text: (obj.text as string) || '',
    left: obj.left ?? 0,
    top: obj.top ?? 0,
    width: obj.width ?? 200,
    height: obj.height ?? 50,
    fontSize: obj.fontSize ?? 24,
    fontFamily: obj.fontFamily || 'Inter',
    fill: typeof obj.fill === 'string' ? obj.fill : '#000000',
    textAlign: obj.textAlign || 'center',
    autoShrink: obj.autoShrink ?? true,
    minFontSize: obj.minFontSize ?? 12,
    maxLines: obj.maxLines ?? 1,
    angle: obj.angle ?? 0,
    scaleX: obj.scaleX ?? 1,
    scaleY: obj.scaleY ?? 1,
    originX: obj.originX || 'left',
    originY: obj.originY || 'top',
    elementId: data.id as string | undefined,
  }
}

function isTextObject(obj: any) {
  return obj instanceof IText || obj instanceof Textbox || obj instanceof FieldText ||
    obj?.type === 'i-text' || obj?.type === 'textbox' || obj?.type === 'FieldText'
}

function isImageObject(obj: any) {
  return obj instanceof FabricImage || obj?.type === 'image'
}

function isLineObject(obj: any) {
  return obj instanceof Line || obj?.type === 'line'
}

function isShapeObject(obj: any) {
  if (!obj || isTextObject(obj) || isImageObject(obj)) return false
  return (
    obj instanceof Rect ||
    obj instanceof Circle ||
    obj instanceof Ellipse ||
    obj instanceof Triangle ||
    obj instanceof Path ||
    obj instanceof Line ||
    obj instanceof Group ||
    ['rect', 'circle', 'ellipse', 'triangle', 'path', 'line', 'group'].includes(obj?.type)
  )
}

function solidFillColor(fill: any): string {
  if (typeof fill === 'string') return fill
  if (fill?.colorStops?.[0]?.color) return fill.colorStops[0].color
  return '#dbeafe'
}

function gradientSecondColor(fill: any): string {
  if (fill?.colorStops?.[1]?.color) return fill.colorStops[1].color
  return '#2563eb'
}

function isGradientFill(fill: any): boolean {
  return !!(fill && typeof fill === 'object' && fill.colorStops)
}

export type FabricEditorProps = {
  /** When set (v3), load this design and skip the start screen. */
  initialConfig?: DesignConfigV3 | null
  /** Called with the current design after edits (debounced). */
  onSave?: (config: DesignConfigV3) => void | Promise<void>
  /** lab = prototype page; wizard = certificate wizard embed. */
  mode?: 'lab' | 'wizard'
}

const CUSTOM_DESIGN_KEY = '__custom__' as const
type ExtendedDesignKey = DesignKey | typeof CUSTOM_DESIGN_KEY

export default function FabricEditor({
  initialConfig = null,
  onSave,
  mode = 'lab',
}: FabricEditorProps = {}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const replaceInputRef = useRef<HTMLInputElement>(null)
  const onSaveRef = useRef(onSave)
  onSaveRef.current = onSave
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const initialLoadedRef = useRef(false)

  const { canvasRef, canvas, history, isReady } = useFabricCanvas({
    width: initialConfig?.pages[0]?.width || 1123,
    height: initialConfig?.pages[0]?.height || 794,
    backgroundColor: '#ffffff'
  })
  
  const keyboardRef = useRef<KeyboardShortcuts | null>(null)
  const cleanupSnapRef = useRef<(() => void) | null>(null)
  const selectedTemplateRef = useRef<ExtendedDesignKey | null>(null)
  const hasLoadedDesignRef = useRef(false)
  const pageSizeRef = useRef({ width: 1123, height: 794 })
  const cropRectRef = useRef<any>(null)
  const cropTargetRef = useRef<any>(null)
  const shiftPressedRef = useRef(false)
  
  const [selectedTemplate, setSelectedTemplate] = useState<ExtendedDesignKey | null>(null)
  const [selectedObject, setSelectedObject] = useState<any>(null)
  const [selectedObjects, setSelectedObjects] = useState<any[]>([])
  const [historyState, setHistoryState] = useState({ canUndo: false, canRedo: false })
  const [toolbarPos, setToolbarPos] = useState({ x: 0, y: 0, visible: false })
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({})
  const [showStartScreen, setShowStartScreen] = useState(!(initialConfig && initialConfig.version === 3))
  const [startScreenMode, setStartScreenMode] = useState<'initial' | 'change'>('initial')
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all')
  const [activePanel, setActivePanel] = useState<SidebarPanel>('text')
  const [pagePaper, setPagePaper] = useState<PagePaper>('a4')
  const [pageOrientation, setPageOrientation] = useState<PageOrientation>('landscape')
  const [pageWidth, setPageWidth] = useState(1123)
  const [pageHeight, setPageHeight] = useState(794)
  const [background, setBackground] = useState<Background>(createSolidBackground('#ffffff'))
  const [uploads, setUploads] = useState<UploadedAsset[]>([])
  const [cropMode, setCropMode] = useState(false)
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null)
  const [shapeFillMode, setShapeFillMode] = useState<'solid' | 'gradient'>('solid')
  const [shapeFillColor2, setShapeFillColor2] = useState('#2563eb')
  const [, bumpToolbar] = useState(0)
  
  const userContentRef = useRef<Record<string, string>>({ ...SAMPLE_DATA })
  const userAddedFieldsRef = useRef<Set<string>>(new Set())
  const customConfigRef = useRef<DesignConfigV3 | null>(
    initialConfig?.version === 3 ? initialConfig : null
  )

  const catalog = useMemo(() => getTemplateCatalog(TEMPLATES), [])
  const categories = useMemo(() => getCatalogCategories(catalog), [catalog])
  const filteredCatalog = useMemo(
    () => filterCatalogByCategory(catalog, categoryFilter),
    [catalog, categoryFilter]
  )

  const emitSave = useCallback(() => {
    if (!canvas || !onSaveRef.current || !hasLoadedDesignRef.current) return
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      try {
        const config = fabricToDesignConfig(canvas)
        void onSaveRef.current?.(config)
      } catch (err) {
        console.warn('Fabric onSave failed', err)
      }
    }, 1500)
  }, [canvas])

  const commitHistory = useCallback(() => {
    void history?.saveState()
    emitSave()
  }, [history, emitSave])

  const updateToolbarPosition = useCallback((obj: any) => {
    if (!canvas || !obj) {
      setToolbarPos(prev => ({ ...prev, visible: false }))
      return
    }
    const el = canvas.getElement()
    const rect = el.getBoundingClientRect()
    const bound = obj.getBoundingRect()
    setToolbarPos({
      x: rect.left + bound.left + bound.width / 2,
      y: Math.max(8, rect.top + bound.top - 48),
      visible: true,
    })
  }, [canvas])

  const fitCanvasToContainer = useCallback(() => {
    if (!canvas || !containerRef.current) return
    const { width, height } = pageSizeRef.current

    const availableWidth = containerRef.current.clientWidth - CANVAS_PADDING * 2
    const availableHeight = containerRef.current.clientHeight - CANVAS_PADDING * 2
    if (availableWidth <= 0 || availableHeight <= 0) return

    const scale = Math.min(availableWidth / width, availableHeight / height)

    ;(canvas as any).__pageWidth = width
    ;(canvas as any).__pageHeight = height
    canvas.setDimensions({ width, height })
    canvas.setZoom(scale)
    canvas.setDimensions({
      width: width * scale,
      height: height * scale
    })
    canvas.calcOffset()
    canvas.requestRenderAll()
  }, [canvas])

  const saveFieldContent = useCallback(() => {
    if (!canvas) return
    const sources: { id: string; text: string }[] = []
    canvas.getObjects().forEach((obj: any) => {
      const text = (obj.text as string) || ''
      if (!text) return
      if (obj instanceof FieldText || obj.type === 'FieldText') {
        if (obj.field) sources.push({ id: obj.field, text })
        // Also keep element-id alias (blank uses certificate_title for course_name)
        const dataId = (obj.get?.('data') || obj.data || {}).id as string | undefined
        if (dataId && dataId !== obj.field) sources.push({ id: dataId, text })
        return
      }
      const id = textIdForObject(obj)
      if (id) sources.push({ id, text })
    })

    userContentRef.current = mergeTextById(
      userContentRef.current,
      collectTextById(sources)
    )
  }, [canvas])

  const restoreFieldContent = useCallback(() => {
    if (!canvas) return
    canvas.getObjects().forEach((obj: any) => {
      if (obj instanceof FieldText || obj.type === 'FieldText') {
        const dataId = (obj.get?.('data') || obj.data || {}).id as string | undefined
        const content =
          resolveTextById(obj.field, userContentRef.current) ??
          (dataId ? resolveTextById(dataId, userContentRef.current) : undefined)
        if (content !== undefined) obj.set({ text: content })
        return
      }
      const id = textIdForObject(obj)
      if (!id) return
      const content = resolveTextById(id, userContentRef.current)
      if (content !== undefined) {
        obj.set({ text: content })
      }
    })
  }, [canvas])

  const syncPageFromConfig = useCallback((width: number, height: number) => {
    const detected = detectPageSize(width, height)
    pageSizeRef.current = { width, height }
    setPageWidth(width)
    setPageHeight(height)
    setPagePaper(detected.paper)
    setPageOrientation(detected.orientation)
  }, [])

  const loadFromConfig = useCallback(async (
    config: DesignConfigV3,
    designKey: ExtendedDesignKey,
    options: { carryFields?: boolean } = {}
  ) => {
    if (!canvas) return
    const { carryFields = true } = options
    const page = config.pages[0]
    if (!page) return

    const fonts = extractFontsFromConfig(config)
    await loadFonts(fonts)

    let carriedSnapshots: CarryFieldSnapshot[] = []
    if (carryFields && hasLoadedDesignRef.current) {
      saveFieldContent()
      carriedSnapshots = canvas.getObjects()
        .map(snapshotFieldText)
        .filter((s): s is CarryFieldSnapshot => s !== null)
    }

    history?.pause()

    canvas.clear()
    canvas.backgroundImage = undefined
    canvas.backgroundColor = '#ffffff'

    await designConfigToFabric(config, canvas)
    syncPageFromConfig(page.width, page.height)
    setBackground(page.background)
    customConfigRef.current = config

    if (carryFields) {
      restoreFieldContent()
    }

    const keysOnCanvas = new Set(
      canvas.getObjects()
        .filter((o: any) => o instanceof FieldText || o.type === 'FieldText')
        .map((o: any) => o.field as string)
    )
    // Carry every previous field that the destination template doesn't already have
    // (not only Text-panel "user-added" fields — blank/template fields must survive too).
    const toCarry = selectFieldsToCarry(carriedSnapshots, keysOnCanvas)
    for (const snap of toCarry) {
      const pos = clampFieldPosition(
        snap.left,
        snap.top,
        snap.width,
        page.width,
        page.height
      )
      const field = new FieldText(snap.text || 'New Field', {
        left: pos.left,
        top: pos.top,
        width: snap.width,
        height: snap.height,
        fontSize: snap.fontSize,
        fontFamily: snap.fontFamily,
        fill: snap.fill,
        textAlign: snap.textAlign as any,
        angle: snap.angle,
        scaleX: snap.scaleX,
        scaleY: snap.scaleY,
        originX: snap.originX as any,
        originY: snap.originY as any,
        field: snap.field as any,
        autoShrink: snap.autoShrink,
        minFontSize: snap.minFontSize,
        maxLines: snap.maxLines,
        data: { id: snap.elementId || snap.field },
      } as any)
      enableAutoShrink(field)
      canvas.add(field)
      keysOnCanvas.add(snap.field)
      userAddedFieldsRef.current.add(snap.field)
    }

    canvas.getObjects().forEach(obj => {
      if (obj instanceof FieldText && obj.autoShrink) {
        enableAutoShrink(obj, {
          minFontSize: obj.minFontSize,
          maxLines: obj.maxLines
        })
      }
      if (isImageObject(obj)) lockImageAspectRatio(obj)
    })

    selectedTemplateRef.current = designKey
    hasLoadedDesignRef.current = true
    fitCanvasToContainer()
    canvas.renderAll()

    history?.resume()
    history?.clear()
    await history?.saveState()
    emitSave()
  }, [canvas, history, saveFieldContent, restoreFieldContent, fitCanvasToContainer, syncPageFromConfig, emitSave])

  const loadTemplate = useCallback(async (templateKey: DesignKey) => {
    const config = resolveDesignConfig(templateKey)
    await loadFromConfig(config, templateKey, { carryFields: true })
  }, [loadFromConfig])

  // Restore draft / initial v3 design once canvas is ready
  useEffect(() => {
    if (!canvas || !history || !isReady || initialLoadedRef.current) return
    if (initialConfig?.version === 3) {
      initialLoadedRef.current = true
      setSelectedTemplate(CUSTOM_DESIGN_KEY)
      selectedTemplateRef.current = CUSTOM_DESIGN_KEY
      void loadFromConfig(initialConfig, CUSTOM_DESIGN_KEY, { carryFields: false })
      setShowStartScreen(false)
    } else {
      initialLoadedRef.current = true
    }
  }, [canvas, history, isReady, initialConfig, loadFromConfig])

  useEffect(() => {
    if (!canvas || !history || !isReady) return

    cleanupSnapRef.current = attachSnapGuides(canvas, () => pageSizeRef.current, 6)

    keyboardRef.current = new KeyboardShortcuts({
      canvas,
      history,
    })

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Shift') shiftPressedRef.current = true
    }
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift') shiftPressedRef.current = false
    }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)

    const handleSelection = () => {
      const selected = canvas.getActiveObjects() || []
      setSelectedObjects(selected)
      const one = selected.length === 1 ? selected[0] : canvas.getActiveObject()
      setSelectedObject(one)

      if (one && (isTextObject(one) || isImageObject(one) || isShapeObject(one) || selected.length > 1)) {
        updateToolbarPosition(one)
        if (isShapeObject(one) && !isLineObject(one)) {
          setShapeFillMode(isGradientFill(one.fill) ? 'gradient' : 'solid')
          setShapeFillColor2(gradientSecondColor(one.fill))
        }
      } else {
        setToolbarPos(prev => ({ ...prev, visible: false }))
      }
      bumpToolbar(n => n + 1)
    }

    const onCleared = () => {
      setSelectedObject(null)
      setSelectedObjects([])
      setToolbarPos(prev => ({ ...prev, visible: false }))
      setContextMenu(null)
    }

    const handleDblClick = (e: any) => {
      const target = e.target
      if (target && isTextObject(target) && !serializeLocked(target)) {
        if (typeof target.enterEditing === 'function') {
          target.enterEditing()
          target.selectAll?.()
        }
      }
    }

    const onEditingEntered = () => {
      setToolbarPos(prev => ({ ...prev, visible: false }))
    }

    const onEditingExited = () => {
      handleSelection()
    }

    const onModified = () => {
      const active = canvas.getActiveObject()
      if (active) updateToolbarPosition(active)
    }

    const onRotating = (e: any) => {
      const target = e.target
      if (!target) return
      const snapped = snapRotationAngle(target.angle || 0, shiftPressedRef.current)
      if (snapped !== target.angle) {
        target.set({ angle: snapped })
        target.setCoords()
      }
    }

    const onContextMenu = (opt: any) => {
      opt.e?.preventDefault?.()
      const target = opt.target
      if (!target) {
        setContextMenu(null)
        return
      }
      if (!canvas.getActiveObjects().includes(target)) {
        canvas.setActiveObject(target)
        canvas.requestRenderAll()
      }
      setContextMenu({ x: opt.e.clientX, y: opt.e.clientY })
    }

    canvas.on('selection:created', handleSelection)
    canvas.on('selection:updated', handleSelection)
    canvas.on('selection:cleared', onCleared)
    canvas.on('mouse:dblclick', handleDblClick)
    canvas.on('text:editing:entered', onEditingEntered)
    canvas.on('text:editing:exited', onEditingExited)
    canvas.on('object:modified', onModified)
    canvas.on('object:moving', onModified)
    canvas.on('object:rotating', onRotating)
    canvas.on('mouse:down', (opt: any) => {
      if (opt.e?.button === 2 || opt.e?.which === 3) onContextMenu(opt)
    })

    const el = canvas.getElement()
    const nativeCtx = (ev: MouseEvent) => {
      ev.preventDefault()
      const target = canvas.findTarget(ev as any)
      if (target) {
        if (!canvas.getActiveObjects().includes(target as any)) {
          canvas.setActiveObject(target as any)
          canvas.requestRenderAll()
        }
        setContextMenu({ x: ev.clientX, y: ev.clientY })
      } else {
        setContextMenu(null)
      }
    }
    el.addEventListener('contextmenu', nativeCtx)

    const unsubscribe = history.onChange(state => {
      setHistoryState(state)
      emitSave()
    })

    return () => {
      unsubscribe()
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
      keyboardRef.current?.dispose()
      cleanupSnapRef.current?.()
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      el.removeEventListener('contextmenu', nativeCtx)
      canvas.off('selection:created', handleSelection)
      canvas.off('selection:updated', handleSelection)
      canvas.off('selection:cleared', onCleared)
      canvas.off('mouse:dblclick', handleDblClick)
      canvas.off('text:editing:entered', onEditingEntered)
      canvas.off('text:editing:exited', onEditingExited)
      canvas.off('object:modified', onModified)
      canvas.off('object:moving', onModified)
      canvas.off('object:rotating', onRotating)
    }
  }, [canvas, history, isReady, updateToolbarPosition, emitSave])

  useEffect(() => {
    if (!canvas || showStartScreen || !selectedTemplate) return
    requestAnimationFrame(() => {
      canvas.calcOffset()
      fitCanvasToContainer()
    })
  }, [canvas, showStartScreen, selectedTemplate, fitCanvasToContainer, activePanel])

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
      await loadFonts(extractFontsFromConfig(config))
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

  const applyBackgroundAndRender = useCallback(async (bg: Background, commit = false) => {
    if (!canvas) return
    const { width, height } = pageSizeRef.current
    await applyBackground(canvas, bg, width, height)
    setBackground(bg)
    canvas.requestRenderAll()
    if (commit) commitHistory()
  }, [canvas, commitHistory])

  const changePageSize = useCallback((paper: PagePaper, orientation: PageOrientation) => {
    if (!canvas) return
    const next = getPageSize(paper, orientation)
    const from = pageSizeRef.current
    history?.pause()

    const objects = canvas.getObjects()
    const remapped = remapObjectPositions(
      objects.map((o: any) => ({ left: o.left || 0, top: o.top || 0, obj: o })),
      from.width,
      from.height,
      next.width,
      next.height
    )
    remapped.forEach(item => {
      item.obj.set({ left: item.left, top: item.top })
      item.obj.setCoords()
    })

    pageSizeRef.current = { width: next.width, height: next.height }
    setPagePaper(paper)
    setPageOrientation(orientation)
    setPageWidth(next.width)
    setPageHeight(next.height)

    // Re-apply background to new size (gradients/images need new coords/cover)
    void (async () => {
      const bg = canvasBackgroundToConfig(canvas)
      await applyBackground(canvas, bg, next.width, next.height)
      setBackground(bg)
      fitCanvasToContainer()
      history?.resume()
      commitHistory()
    })()
  }, [canvas, history, fitCanvasToContainer, commitHistory])

  const addPlainText = (text: string, fontSize: number, fontWeight: 'normal' | 'bold' = 'normal') => {
    if (!canvas) return
    const { width, height } = pageSizeRef.current
    const obj = new IText(text, {
      left: width / 2,
      top: height / 2,
      originX: 'center',
      originY: 'center',
      fontSize,
      fontFamily: 'Inter',
      fontWeight,
      fill: '#111111',
      textAlign: 'center',
      data: { id: `text-${Date.now()}` },
    })
    canvas.add(obj)
    canvas.setActiveObject(obj)
    canvas.requestRenderAll()
  }

  const addShape = (kind: ShapeKind) => {
    if (!canvas) return
    const { width, height } = pageSizeRef.current
    const obj = createFabricShape(kind, width, height)
    canvas.add(obj)
    canvas.setActiveObject(obj)
    canvas.requestRenderAll()
  }

  const applyShapeFill = (obj: any, mode: 'solid' | 'gradient', color1: string, color2: string) => {
    if (mode === 'gradient') {
      const w = (obj.width || 100) * (obj.scaleX || 1)
      obj.set({
        fill: new Gradient({
          type: 'linear',
          coords: { x1: 0, y1: 0, x2: w, y2: 0 },
          colorStops: [
            { offset: 0, color: color1 },
            { offset: 1, color: color2 },
          ],
        }),
      })
    } else {
      obj.set({ fill: color1 })
    }
  }

  const updateShapeProp = (prop: string, value: any) => {
    if (!selectedObject || !canvas || serializeLocked(selectedObject)) return
    if (prop === 'fillMode') {
      setShapeFillMode(value)
      applyShapeFill(
        selectedObject,
        value,
        solidFillColor(selectedObject.fill),
        shapeFillColor2
      )
    } else if (prop === 'fill') {
      applyShapeFill(selectedObject, shapeFillMode, value, shapeFillColor2)
    } else if (prop === 'fillColor2') {
      setShapeFillColor2(value)
      applyShapeFill(selectedObject, 'gradient', solidFillColor(selectedObject.fill), value)
    } else if (prop === 'strokeStyle') {
      selectedObject.set({
        strokeDashArray: strokeDashForStyle(value, selectedObject.strokeWidth || 2),
      })
    } else if (prop === 'rx') {
      selectedObject.set({ rx: value, ry: value })
    } else {
      selectedObject.set({ [prop]: value })
    }
    canvas.requestRenderAll()
    bumpToolbar(n => n + 1)
    if (!['opacity', 'rx'].includes(prop)) commitHistory()
  }

  const runArrange = (action: string) => {
    if (!canvas) return
    switch (action) {
      case 'align-left':
        alignSelection(canvas, 'left')
        break
      case 'align-center':
        alignSelection(canvas, 'center')
        break
      case 'align-right':
        alignSelection(canvas, 'right')
        break
      case 'align-top':
        alignSelection(canvas, 'top')
        break
      case 'align-middle':
        alignSelection(canvas, 'middle')
        break
      case 'align-bottom':
        alignSelection(canvas, 'bottom')
        break
      case 'distribute-h':
        distributeSelection(canvas, 'horizontal')
        break
      case 'distribute-v':
        distributeSelection(canvas, 'vertical')
        break
      case 'bring-forward':
        bringForward(canvas)
        break
      case 'send-backward':
        sendBackward(canvas)
        break
      case 'bring-front':
        bringToFront(canvas)
        break
      case 'send-back':
        sendToBack(canvas)
        break
      case 'group':
        void groupSelection(canvas)
        break
      case 'ungroup':
        ungroupSelection(canvas)
        break
      case 'duplicate':
        keyboardRef.current && (keyboardRef.current as any)
        {
          const active = canvas.getActiveObject()
          if (active) {
            void active.clone().then((cloned: any) => {
              cloned.set({ left: (cloned.left || 0) + 20, top: (cloned.top || 0) + 20 })
              canvas.add(cloned)
              canvas.setActiveObject(cloned)
              canvas.requestRenderAll()
            })
          }
        }
        break
      case 'delete':
        deleteSelected()
        break
      case 'lock':
      case 'unlock':
        toggleLockSelection(canvas)
        bumpToolbar(n => n + 1)
        break
    }
    commitHistory()
  }

  const handleContextAction = (action: ContextMenuAction) => {
    runArrange(action)
  }

  const addDynamicField = (option: DynamicFieldOption) => {
    if (!canvas) return
    const existing = new Set(
      canvas.getObjects()
        .filter((o: any) => o instanceof FieldText || o.type === 'FieldText')
        .map((o: any) => o.field as string)
    )
    if (existing.has(option.field)) {
      const found = canvas.getObjects().find((o: any) => o.field === option.field)
      if (found) {
        canvas.setActiveObject(found)
        canvas.requestRenderAll()
      }
      return
    }

    const { width, height } = pageSizeRef.current
    const field = new FieldText(option.placeholder, {
      left: width / 2,
      top: height / 2,
      originX: 'center',
      originY: 'center',
      width: Math.min(400, width * 0.5),
      fontSize: 28,
      fill: '#111111',
      field: option.field as any,
      autoShrink: true,
      data: { id: option.field },
    } as any)
    userAddedFieldsRef.current.add(option.field)
    enableAutoShrink(field)
    canvas.add(field)
    canvas.setActiveObject(field)
    canvas.requestRenderAll()
  }

  const placeUpload = async (asset: UploadedAsset) => {
    if (!canvas) return
    const { width, height } = pageSizeRef.current
    const img = await FabricImage.fromURL(asset.dataUrl)
    const scale = scaleImageToPageFraction(img.width || 1, img.height || 1, width, 0.4)
    img.set({
      left: width / 2,
      top: height / 2,
      originX: 'center',
      originY: 'center',
      scaleX: scale,
      scaleY: scale,
      data: { id: asset.id, imageUrl: asset.dataUrl, cornerRadius: 0 },
    } as any)
    lockImageAspectRatio(img)
    // Above page background, under text/fields (and other existing objects)
    canvas.add(img)
    canvas.sendObjectToBack(img)
    canvas.setActiveObject(img)
    canvas.requestRenderAll()
  }

  const updateTextStyle = (property: string, value: any) => {
    if (!selectedObject || !canvas) return
    selectedObject.set({ [property]: value })
    if (property === 'fontFamily') {
      void loadFonts([value])
    }
    canvas.requestRenderAll()
    commitHistory()
    bumpToolbar(n => n + 1)
  }

  const updateImageProp = (prop: 'opacity' | 'cornerRadius', value: number) => {
    if (!selectedObject || !canvas || !isImageObject(selectedObject)) return
    if (prop === 'opacity') {
      selectedObject.set({ opacity: value })
    } else {
      applyImageCornerRadius(selectedObject, value)
    }
    canvas.requestRenderAll()
    bumpToolbar(n => n + 1)
  }

  const startCrop = () => {
    if (!canvas || !selectedObject || !isImageObject(selectedObject)) return
    const img = selectedObject
    cropTargetRef.current = img
    const bound = img.getBoundingRect()
    const rect = new Rect({
      left: bound.left + bound.width * 0.1,
      top: bound.top + bound.height * 0.1,
      width: bound.width * 0.8,
      height: bound.height * 0.8,
      fill: 'rgba(37,99,235,0.15)',
      stroke: '#2563eb',
      strokeWidth: 2,
      strokeDashArray: [6, 4],
      cornerColor: '#2563eb',
      transparentCorners: false,
      data: { id: '__crop_rect__', isCropRect: true },
    })
    history?.pause()
    canvas.add(rect)
    canvas.setActiveObject(rect)
    cropRectRef.current = rect
    setCropMode(true)
    canvas.requestRenderAll()
  }

  const cancelCrop = () => {
    if (!canvas) return
    if (cropRectRef.current) {
      canvas.remove(cropRectRef.current)
      cropRectRef.current = null
    }
    if (cropTargetRef.current) {
      canvas.setActiveObject(cropTargetRef.current)
    }
    cropTargetRef.current = null
    setCropMode(false)
    history?.resume()
    canvas.requestRenderAll()
  }

  const applyCrop = () => {
    if (!canvas || !cropRectRef.current || !cropTargetRef.current) {
      cancelCrop()
      return
    }
    const img = cropTargetRef.current
    const crop = cropRectRef.current
    const imgBound = img.getBoundingRect()
    const cropBound = crop.getBoundingRect()

    const scaleX = img.scaleX || 1
    const scaleY = img.scaleY || 1
    const relLeft = (cropBound.left - imgBound.left) / scaleX
    const relTop = (cropBound.top - imgBound.top) / scaleY
    const relW = cropBound.width / scaleX
    const relH = cropBound.height / scaleY

    img.set({
      cropX: Math.max(0, (img.cropX || 0) + relLeft),
      cropY: Math.max(0, (img.cropY || 0) + relTop),
      width: Math.max(1, relW),
      height: Math.max(1, relH),
    })
    img.setCoords()

    canvas.remove(crop)
    cropRectRef.current = null
    cropTargetRef.current = null
    setCropMode(false)
    history?.resume()
    canvas.setActiveObject(img)
    canvas.requestRenderAll()
    commitHistory()
  }

  const replaceSelectedImage = async (file: File | null) => {
    if (!file || !canvas || !selectedObject || !isImageObject(selectedObject)) return
    const { validateImageUpload } = await import('@/lib/fabric/upload-validation')
    const result = validateImageUpload(file)
    if (!result.ok) {
      alert(result.error)
      return
    }
    // TODO: Move replaced images to Supabase Storage instead of data URLs.
    const reader = new FileReader()
    reader.onload = async () => {
      const dataUrl = String(reader.result || '')
      const next = await FabricImage.fromURL(dataUrl)
      const prev = selectedObject
      next.set({
        left: prev.left,
        top: prev.top,
        originX: prev.originX,
        originY: prev.originY,
        angle: prev.angle,
        scaleX: prev.scaleX,
        scaleY: prev.scaleY,
        opacity: prev.opacity,
        data: {
          ...(prev.get?.('data') || {}),
          imageUrl: dataUrl,
        },
      } as any)
      lockImageAspectRatio(next)
      const radius = (prev.get?.('data') || {}).cornerRadius || 0
      applyImageCornerRadius(next, radius)
      const stackIndex = canvas.getObjects().indexOf(prev)
      canvas.remove(prev)
      if (stackIndex >= 0) {
        canvas.insertAt(stackIndex, next)
      } else {
        canvas.add(next)
        canvas.sendObjectToBack(next)
      }
      canvas.setActiveObject(next)
      canvas.requestRenderAll()
    }
    reader.readAsDataURL(file)
  }

  const deleteSelected = () => {
    if (!canvas) return
    const objs = canvas.getActiveObjects()
    if (objs.length === 0) return
    objs.forEach(o => canvas.remove(o))
    canvas.discardActiveObject()
    canvas.requestRenderAll()
  }

  const imageCornerRadius =
    isImageObject(selectedObject)
      ? ((selectedObject.get?.('data') || selectedObject.data || {}).cornerRadius || 0)
      : 0

  const selectionLocked = isSelectionLocked(selectedObjects.length ? selectedObjects : selectedObject ? [selectedObject] : [])
  const showObjectToolbar =
    !cropMode &&
    toolbarPos.visible &&
    selectedObject &&
    (isTextObject(selectedObject) ||
      isImageObject(selectedObject) ||
      isShapeObject(selectedObject) ||
      selectedObjects.length > 1)

  return (
    <div className="h-full flex flex-col bg-gray-50 relative">
      {selectedTemplate !== null && (
        <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center gap-2 flex-wrap shrink-0">
          <button
            onClick={openChangeTemplate}
            className="px-3 py-1.5 text-sm border rounded hover:bg-gray-50"
          >
            Change template
          </button>

          <div className="border-l border-gray-300 h-6 mx-2" />

          <div className="flex items-center gap-1 text-xs">
            <span className="text-gray-500 mr-1">Page</span>
            <select
              value={pagePaper}
              onChange={e => changePageSize(e.target.value as PagePaper, pageOrientation)}
              className="rounded border px-2 py-1"
            >
              <option value="a4">A4</option>
              <option value="letter">US Letter</option>
            </select>
            <select
              value={pageOrientation}
              onChange={e => changePageSize(pagePaper, e.target.value as PageOrientation)}
              className="rounded border px-2 py-1"
            >
              <option value="landscape">Landscape</option>
              <option value="portrait">Portrait</option>
            </select>
          </div>
          
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
              <button onClick={() => alignLeft(canvas!)} className="px-2 py-1 text-xs border rounded hover:bg-gray-50" title="Align Left">⬅️</button>
              <button onClick={() => alignCenterH(canvas!)} className="px-2 py-1 text-xs border rounded hover:bg-gray-50" title="Center Horizontally">↔️</button>
              <button onClick={() => alignRight(canvas!)} className="px-2 py-1 text-xs border rounded hover:bg-gray-50" title="Align Right">➡️</button>
              <button onClick={() => alignTop(canvas!)} className="px-2 py-1 text-xs border rounded hover:bg-gray-50" title="Align Top">⬆️</button>
              <button onClick={() => alignCenterV(canvas!)} className="px-2 py-1 text-xs border rounded hover:bg-gray-50" title="Center Vertically">↕️</button>
              <button onClick={() => alignBottom(canvas!)} className="px-2 py-1 text-xs border rounded hover:bg-gray-50" title="Align Bottom">⬇️</button>
              {selectedObjects.length >= 3 && (
                <>
                  <div className="border-l border-gray-300 h-6 mx-2" />
                  <button onClick={() => distributeH(canvas!)} className="px-2 py-1 text-xs border rounded hover:bg-gray-50" title="Distribute Horizontally">↔️ Dist</button>
                  <button onClick={() => distributeV(canvas!)} className="px-2 py-1 text-xs border rounded hover:bg-gray-50" title="Distribute Vertically">↕️ Dist</button>
                </>
              )}
            </>
          )}
          
          <div className="ml-auto text-xs text-gray-500">
            Shortcuts: Cmd/Ctrl+Z (Undo) • Cmd/Ctrl+D (Duplicate) • Delete • Arrows (Nudge)
          </div>
        </div>
      )}

      <div className="flex flex-1 min-h-0 overflow-hidden">
        {selectedTemplate !== null && !showStartScreen && (
          <EditorSidebar activePanel={activePanel} onSelect={setActivePanel}>
            {activePanel === 'text' && (
              <TextPanel
                onAddHeading={() => addPlainText('Heading', 48, 'bold')}
                onAddSubheading={() => addPlainText('Subheading', 32)}
                onAddBody={() => addPlainText('Body text', 18)}
                onAddField={addDynamicField}
              />
            )}
            {activePanel === 'uploads' && (
              <UploadsPanel
                assets={uploads}
                onAddAsset={asset => setUploads(prev => [asset, ...prev])}
                onPlaceAsset={asset => void placeUpload(asset)}
              />
            )}
            {activePanel === 'background' && (
              <BackgroundPanel
                pageWidth={pageWidth}
                pageHeight={pageHeight}
                current={background}
                onApply={bg => void applyBackgroundAndRender(bg, false)}
                onCommitHistory={commitHistory}
              />
            )}
            {activePanel === 'elements' && (
              <ElementsPanel onAddShape={addShape} />
            )}
          </EditorSidebar>
        )}

        <div
          ref={containerRef}
          className="relative flex-1 flex items-center justify-center overflow-hidden min-h-0"
          style={{ padding: CANVAS_PADDING }}
        >
          <div
            className={showStartScreen ? 'invisible pointer-events-none' : undefined}
            aria-hidden={showStartScreen}
          >
            <canvas ref={canvasRef} />
          </div>
          {!isReady && !showStartScreen && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50/80 z-10">
              <div className="text-gray-500">Loading Fabric editor...</div>
            </div>
          )}
        </div>
      </div>

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

      <input
        ref={replaceInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/svg+xml"
        className="hidden"
        onChange={e => {
          void replaceSelectedImage(e.target.files?.[0] || null)
          e.target.value = ''
        }}
      />

      {cropMode && (
        <CropToolbar
          x={toolbarPos.x || (typeof window !== 'undefined' ? window.innerWidth / 2 : 0)}
          y={toolbarPos.y || 80}
          onApply={applyCrop}
          onCancel={cancelCrop}
        />
      )}

      {showObjectToolbar && isTextObject(selectedObject) && selectedObjects.length <= 1 && (
        <FloatingObjectToolbar
          kind="text"
          x={toolbarPos.x}
          y={toolbarPos.y}
          locked={selectionLocked}
          fontFamily={selectedObject.fontFamily || 'Inter'}
          fontSize={selectedObject.fontSize || 16}
          fontWeight={selectedObject.fontWeight || 'normal'}
          fontStyle={selectedObject.fontStyle || 'normal'}
          underline={!!selectedObject.underline}
          fill={typeof selectedObject.fill === 'string' ? selectedObject.fill : '#000000'}
          textAlign={selectedObject.textAlign || 'left'}
          charSpacing={selectedObject.charSpacing ?? 0}
          lineHeight={selectedObject.lineHeight ?? 1.16}
          onTextChange={updateTextStyle}
          selectionCount={selectedObjects.length}
          onArrange={runArrange}
          onToggleLock={() => { toggleLockSelection(canvas!); bumpToolbar(n => n + 1); commitHistory() }}
        />
      )}

      {showObjectToolbar && isImageObject(selectedObject) && selectedObjects.length <= 1 && (
        <FloatingObjectToolbar
          kind="image"
          x={toolbarPos.x}
          y={toolbarPos.y}
          locked={selectionLocked}
          opacity={selectedObject.opacity ?? 1}
          cornerRadius={imageCornerRadius}
          onImageChange={updateImageProp}
          onImageCommit={commitHistory}
          onCrop={startCrop}
          onReplace={() => replaceInputRef.current?.click()}
          onDelete={deleteSelected}
          selectionCount={selectedObjects.length}
          onArrange={runArrange}
          onToggleLock={() => { toggleLockSelection(canvas!); bumpToolbar(n => n + 1); commitHistory() }}
        />
      )}

      {showObjectToolbar && isLineObject(selectedObject) && selectedObjects.length <= 1 && (
        <FloatingObjectToolbar
          kind="line"
          x={toolbarPos.x}
          y={toolbarPos.y}
          locked={selectionLocked}
          stroke={typeof selectedObject.stroke === 'string' ? selectedObject.stroke : '#111827'}
          strokeWidth={selectedObject.strokeWidth ?? 3}
          strokeStyle={styleFromDashArray(selectedObject.strokeDashArray)}
          strokeLineCap={selectedObject.strokeLineCap || 'butt'}
          onShapeChange={updateShapeProp}
          onDelete={deleteSelected}
          selectionCount={selectedObjects.length}
          onArrange={runArrange}
          onToggleLock={() => { toggleLockSelection(canvas!); bumpToolbar(n => n + 1); commitHistory() }}
        />
      )}

      {showObjectToolbar &&
        isShapeObject(selectedObject) &&
        !isLineObject(selectedObject) &&
        selectedObjects.length <= 1 && (
        <FloatingObjectToolbar
          kind="shape"
          x={toolbarPos.x}
          y={toolbarPos.y}
          locked={selectionLocked}
          fill={solidFillColor(selectedObject.fill)}
          fillMode={shapeFillMode}
          fillColor2={shapeFillColor2}
          stroke={typeof selectedObject.stroke === 'string' ? selectedObject.stroke : '#2563eb'}
          strokeWidth={selectedObject.strokeWidth ?? 2}
          strokeStyle={styleFromDashArray(selectedObject.strokeDashArray)}
          rx={typeof selectedObject.rx === 'number' ? selectedObject.rx : undefined}
          opacity={selectedObject.opacity ?? 1}
          onShapeChange={updateShapeProp}
          onShapeCommit={commitHistory}
          onDelete={deleteSelected}
          selectionCount={selectedObjects.length}
          onArrange={runArrange}
          onToggleLock={() => { toggleLockSelection(canvas!); bumpToolbar(n => n + 1); commitHistory() }}
        />
      )}

      {showObjectToolbar && selectedObjects.length > 1 && (
        <FloatingObjectToolbar
          kind="shape"
          x={toolbarPos.x}
          y={toolbarPos.y}
          locked={selectionLocked}
          selectionCount={selectedObjects.length}
          onArrange={runArrange}
          onToggleLock={() => { toggleLockSelection(canvas!); bumpToolbar(n => n + 1); commitHistory() }}
          onDelete={deleteSelected}
        />
      )}

      {contextMenu && (
        <ObjectContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          canGroup={selectedObjects.length >= 2}
          canUngroup={!!(selectedObject && (selectedObject instanceof Group || selectedObject.type === 'group'))}
          canDistribute={selectedObjects.length >= 3}
          locked={selectionLocked}
          onAction={handleContextAction}
          onClose={() => setContextMenu(null)}
        />
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
