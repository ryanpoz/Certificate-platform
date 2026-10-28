import {
  Canvas,
  StaticCanvas,
  Gradient,
  IText,
  Textbox,
  Rect,
  Circle,
  Ellipse,
  Line,
  Path,
  Triangle,
  Group,
  Image as FabricImage,
} from 'fabric'
import type {
  Background,
  DesignConfigV3,
  Element,
  ShapeFill,
} from '@/lib/design-config/v3-schema'
import { FieldText } from './objects/FieldText'
import { resolveFontFamily } from './fonts'
import {
  coverScale,
  serializeBackgroundFromSnapshot,
  createSolidBackground,
} from './background'
import { serializeLocked } from './lock'
import { applyObjectLock } from './create-shape'

/**
 * Convert Design Config V3 to Fabric canvas (Canvas or StaticCanvas for thumbnails)
 */
export async function designConfigToFabric(
  config: DesignConfigV3,
  canvas: Canvas | StaticCanvas,
  pageIndex = 0
): Promise<void> {
  const page = config.pages[pageIndex]
  if (!page) throw new Error(`Page ${pageIndex} not found`)

  // Set canvas dimensions to page size (caller may zoom/fit afterward)
  canvas.setDimensions({ width: page.width, height: page.height })
  canvas.setZoom(1)

  // Set background
  await applyBackground(canvas, page.background, page.width, page.height)

  // Add elements — skip duplicate field ids
  const seenFieldIds = new Set<string>()
  for (const element of page.elements) {
    if (element.type === 'field') {
      if (seenFieldIds.has(element.field)) continue
      seenFieldIds.add(element.field)
    }
    const obj = await elementToFabric(element)
    if (obj) {
      if ((element as any).locked) applyObjectLock(obj, true)
      canvas.add(obj)
    }
  }

  canvas.renderAll()
}

/**
 * Apply a Background config to a Fabric canvas (cover-fit for images).
 */
export async function applyBackground(
  canvas: Canvas | StaticCanvas,
  background: Background,
  pageWidth: number,
  pageHeight: number
): Promise<void> {
  canvas.backgroundImage = undefined

  if (background.type === 'color') {
    canvas.set('backgroundColor', background.color)
    return
  }

  if (background.type === 'gradient') {
    const grad = background.gradient
    const gradient = new Gradient({
      type: grad.type,
      coords: grad.coords as any,
      colorStops: grad.stops
    })
    canvas.set('backgroundColor', gradient as any)
    return
  }

  if (background.type === 'image') {
    canvas.set('backgroundColor', '#ffffff')
    try {
      const img = await FabricImage.fromURL(background.imageUrl, {
        crossOrigin: 'anonymous',
      } as any)
      const iw = img.width || 1
      const ih = img.height || 1
      const scale = coverScale(iw, ih, pageWidth, pageHeight)
      img.set({
        originX: 'center',
        originY: 'center',
        left: pageWidth / 2,
        top: pageHeight / 2,
        scaleX: scale,
        scaleY: scale,
        opacity: background.opacity ?? 1,
      })
      canvas.backgroundImage = img
    } catch (err) {
      console.warn('Failed to load background image', err)
      canvas.set('backgroundColor', '#ffffff')
    }
  }
}

/**
 * Read current canvas background into Design Config Background.
 */
export function canvasBackgroundToConfig(canvas: Canvas | StaticCanvas): Background {
  const bgImg = canvas.backgroundImage as any
  const bgColor = canvas.backgroundColor as any

  if (bgImg) {
    const src =
      bgImg.getSrc?.() ||
      bgImg._element?.src ||
      bgImg.src ||
      ''
    return serializeBackgroundFromSnapshot({
      backgroundImage: {
        src,
        opacity: bgImg.opacity ?? 1,
      },
    })
  }

  if (bgColor && typeof bgColor === 'object') {
    const colorStops = (bgColor.colorStops || []).map((s: any) => ({
      offset: s.offset,
      color: s.color,
    }))
    return serializeBackgroundFromSnapshot({
      backgroundColor: {
        type: bgColor.type || 'linear',
        coords: bgColor.coords,
        colorStops,
      },
    })
  }

  if (typeof bgColor === 'string' && bgColor) {
    return createSolidBackground(bgColor)
  }

  return createSolidBackground('#ffffff')
}

/**
 * Convert Fabric canvas to Design Config V3
 */
export function fabricToDesignConfig(canvas: Canvas): DesignConfigV3 {
  const elements: Element[] = []

  canvas.getObjects().forEach((obj: any) => {
    const element = fabricToElement(obj)
    if (element) {
      elements.push(element)
    }
  })

  const width = (canvas as any).width || 1123
  const height = (canvas as any).height || 794
  // Prefer logical page size stored on canvas data when zoomed
  const pageWidth = (canvas as any).__pageWidth || width
  const pageHeight = (canvas as any).__pageHeight || height

  return {
    version: 3,
    pages: [{
      width: pageWidth,
      height: pageHeight,
      unit: 'px',
      background: canvasBackgroundToConfig(canvas),
      elements
    }]
  }
}

/**
 * Convert element to Fabric object
 */
async function elementToFabric(element: Element): Promise<any | null> {
  if (element.type === 'text') {
    return new IText(element.text, {
      left: element.x,
      top: element.y,
      width: element.width,
      height: element.height,
      fontSize: element.fontSize,
      fontFamily: resolveFontFamily(element.fontFamily),
      fontWeight: element.fontWeight,
      fontStyle: element.fontStyle,
      fill: element.fill,
      textAlign: element.textAlign,
      underline: element.underline,
      linethrough: element.strikethrough,
      charSpacing: element.charSpacing,
      lineHeight: element.lineHeight,
      angle: element.angle,
      scaleX: element.scaleX,
      scaleY: element.scaleY,
      originX: element.originX,
      originY: element.originY,
      opacity: element.opacity,
      data: { id: element.id }
    })
  }

  if (element.type === 'field') {
    return new FieldText(element.placeholder || element.field, {
      left: element.x,
      top: element.y,
      width: element.width,
      height: element.height,
      fontSize: element.fontSize,
      fontFamily: resolveFontFamily(element.fontFamily),
      fontWeight: element.fontWeight as any,
      fontStyle: element.fontStyle as any,
      fill: element.fill,
      textAlign: element.textAlign as any,
      angle: element.angle,
      scaleX: element.scaleX,
      scaleY: element.scaleY,
      originX: element.originX as any,
      originY: element.originY as any,
      opacity: element.opacity,
      field: element.field,
      autoShrink: element.autoShrink,
      minFontSize: element.minFontSize,
      maxLines: element.maxLines,
      data: { id: element.id }
    } as any)
  }

  if (element.type === 'image') {
    try {
      const img = await FabricImage.fromURL(element.imageUrl, {
        crossOrigin: 'anonymous',
      } as any)
      img.set({
        left: element.x,
        top: element.y,
        angle: element.angle,
        scaleX: element.scaleX,
        scaleY: element.scaleY,
        originX: element.originX,
        originY: element.originY,
        opacity: element.opacity,
        data: {
          id: element.id,
          imageUrl: element.imageUrl,
          cornerRadius: element.cornerRadius || 0,
        },
      } as any)
      applyImageCornerRadius(img, element.cornerRadius || 0)
      lockImageAspectRatio(img)
      return img
    } catch (err) {
      console.warn('Failed to load image element', err)
      return null
    }
  }

  if (element.type === 'group') {
    const children: any[] = []
    for (const child of element.elements) {
      const obj = await elementToFabric(child)
      if (obj) children.push(obj)
    }
    const group = new Group(children, {
      left: element.x,
      top: element.y,
      angle: element.angle,
      scaleX: element.scaleX,
      scaleY: element.scaleY,
      originX: element.originX as any,
      originY: element.originY as any,
      opacity: element.opacity,
    })
    ;(group as any).set('data', { id: element.id })
    applyObjectLock(group, !!element.locked)
    return group
  }

  if (element.type === 'shape') {
    const obj = await shapeElementToFabric(element)
    if (obj && element.locked) applyObjectLock(obj, true)
    return obj
  }

  return null
}

function paintFill(fill: ShapeFill | undefined): any {
  if (!fill) return 'transparent'
  if (typeof fill === 'string') return fill
  return new Gradient({
    type: 'linear',
    coords: fill.coords as any,
    colorStops: fill.stops,
  })
}

function serializeFill(fill: any): ShapeFill | undefined {
  if (!fill) return undefined
  if (typeof fill === 'string') return fill
  if (typeof fill === 'object' && fill.colorStops) {
    return {
      type: 'linear',
      coords: {
        x1: fill.coords?.x1 ?? 0,
        y1: fill.coords?.y1 ?? 0,
        x2: fill.coords?.x2 ?? 0,
        y2: fill.coords?.y2 ?? 0,
      },
      stops: (fill.colorStops || []).map((s: any) => ({
        offset: s.offset,
        color: s.color,
      })),
    }
  }
  return undefined
}

async function shapeElementToFabric(element: Extract<Element, { type: 'shape' }>): Promise<any | null> {
  const common = {
    left: (element as any).x ?? 0,
    top: (element as any).y ?? 0,
    angle: element.angle,
    scaleX: element.scaleX,
    scaleY: element.scaleY,
    originX: element.originX,
    originY: element.originY,
    opacity: element.opacity,
    stroke: element.stroke,
    strokeWidth: element.strokeWidth,
    strokeDashArray: element.strokeDashArray,
    strokeLineCap: (element as any).strokeLineCap,
  }

  if (element.shape === 'rect') {
    return new Rect({
      ...common,
      width: element.width,
      height: element.height,
      fill: paintFill(element.fill),
      rx: element.rx,
      ry: element.ry,
      data: { id: element.id, shapeKind: (element.rx || 0) > 0 ? 'rounded-rect' : 'rect' },
    })
  }

  if (element.shape === 'circle') {
    return new Circle({
      ...common,
      radius: element.radius,
      fill: paintFill(element.fill),
      data: { id: element.id, shapeKind: 'circle' },
    })
  }

  if (element.shape === 'ellipse') {
    return new Ellipse({
      ...common,
      rx: element.rx,
      ry: element.ry,
      fill: paintFill(element.fill),
      data: { id: element.id, shapeKind: 'ellipse' },
    })
  }

  if (element.shape === 'line') {
    return new Line([element.x1, element.y1, element.x2, element.y2], {
      ...common,
      left: undefined,
      top: undefined,
      originX: 'left',
      originY: 'top',
      stroke: element.stroke,
      strokeLineCap: element.strokeLineCap || 'butt',
      data: {
        id: element.id,
        shapeKind: element.strokeDashArray?.length ? 'dashed-line' : 'line',
      },
    })
  }

  if (element.shape === 'path') {
    return new Path(element.path, {
      ...common,
      width: element.width,
      height: element.height,
      fill: paintFill(element.fill),
      data: { id: element.id, shapeKind: element.kind || 'path', pathKind: element.kind },
    })
  }

  return null
}

export function applyImageCornerRadius(img: any, radius: number) {
  const data = img.get?.('data') || img.data || {}
  data.cornerRadius = radius
  img.set('data', data)

  if (!radius || radius <= 0) {
    img.set({ clipPath: undefined })
    return
  }

  const w = (img.width || 0) * (img.scaleX || 1)
  const h = (img.height || 0) * (img.scaleY || 1)
  // clipPath is in object local unscaled space
  const localW = img.width || 0
  const localH = img.height || 0
  const rx = Math.min(radius, localW / 2, localH / 2)
  img.set({
    clipPath: new Rect({
      width: localW,
      height: localH,
      rx,
      ry: rx,
      originX: 'center',
      originY: 'center',
    }),
  })
  void w
  void h
}

export function lockImageAspectRatio(img: any) {
  // Keep aspect ratio when resizing from corners (Fabric v6)
  img.set({
    lockUniScaling: true,
  } as any)
  img.on?.('scaling', () => {
    const sx = img.scaleX || 1
    img.set({ scaleY: sx })
  })
}

/**
 * Convert Fabric object to element
 */
function transformFromObject(obj: any, data: any) {
  return {
    x: obj.left || 0,
    y: obj.top || 0,
    width: obj.width || 100,
    height: obj.height || 100,
    angle: obj.angle || 0,
    scaleX: obj.scaleX || 1,
    scaleY: obj.scaleY || 1,
    originX: (obj.originX || 'left') as 'left' | 'center' | 'right',
    originY: (obj.originY || 'top') as 'top' | 'center' | 'bottom',
    opacity: obj.opacity ?? 1,
    locked: serializeLocked({ ...obj, data }),
  }
}

function fabricToElement(obj: any): Element | null {
  const data = obj.get?.('data') || obj.data || {}

  // Skip editor-only chrome
  if (data.isCropRect || data.isGuide) return null

  if (obj instanceof Group || obj.type === 'group') {
    const children = (obj.getObjects?.() || obj._objects || [])
      .map((child: any) => fabricToElement(child))
      .filter(Boolean) as Element[]
    const t = transformFromObject(obj, data)
    return {
      type: 'group',
      id: data.id || `group-${Date.now()}`,
      elements: children,
      ...t,
      width: Math.max(1, (obj.width || 1) * (obj.scaleX || 1)),
      height: Math.max(1, (obj.height || 1) * (obj.scaleY || 1)),
    }
  }
  
  if (obj instanceof FieldText || obj.type === 'FieldText') {
    return {
      type: 'field',
      id: data.id || `field-${Date.now()}`,
      field: obj.field || 'recipient_name',
      fontFamily: obj.fontFamily || 'Inter',
      fontSize: obj.fontSize || 16,
      fontWeight: obj.fontWeight || 'normal',
      fontStyle: obj.fontStyle || 'normal',
      fill: obj.fill || '#000000',
      textAlign: obj.textAlign || 'left',
      autoShrink: obj.autoShrink ?? true,
      minFontSize: obj.minFontSize || 12,
      maxLines: obj.maxLines || 1,
      ...transformFromObject(obj, data),
      width: obj.width || 200,
      height: obj.height || 50,
    }
  }

  if (obj instanceof FabricImage || obj.type === 'image') {
    const src =
      data.imageUrl ||
      obj.getSrc?.() ||
      obj._element?.src ||
      ''
    return {
      type: 'image',
      id: data.id || `image-${Date.now()}`,
      imageUrl: src,
      fit: 'contain',
      cornerRadius: data.cornerRadius || 0,
      ...transformFromObject(obj, data),
      width: (obj.width || 100) * (obj.scaleX || 1),
      height: (obj.height || 100) * (obj.scaleY || 1),
    }
  }

  if (obj instanceof IText || obj instanceof Textbox) {
    return {
      type: 'text',
      id: data.id || `text-${Date.now()}`,
      text: obj.text || '',
      fontFamily: obj.fontFamily || 'Inter',
      fontSize: obj.fontSize || 16,
      fontWeight: (obj.fontWeight === 'bold' ? 'bold' : 'normal') as 'normal' | 'bold',
      fontStyle: (obj.fontStyle === 'italic' ? 'italic' : 'normal') as 'normal' | 'italic',
      fill: typeof obj.fill === 'string' ? obj.fill : '#000000',
      textAlign: (obj.textAlign || 'left') as 'left' | 'center' | 'right' | 'justify',
      lineHeight: obj.lineHeight,
      charSpacing: obj.charSpacing,
      ...transformFromObject(obj, data),
      width: obj.width || 200,
      height: obj.height || 50,
      underline: obj.underline || false,
      strikethrough: obj.linethrough || false
    }
  }

  if (obj instanceof Line || obj.type === 'line') {
    const x1 = obj.x1 ?? 0
    const y1 = obj.y1 ?? 0
    const x2 = obj.x2 ?? 0
    const y2 = obj.y2 ?? 0
    return {
      type: 'shape',
      id: data.id || `line-${Date.now()}`,
      shape: 'line',
      stroke: typeof obj.stroke === 'string' ? obj.stroke : '#000000',
      strokeWidth: obj.strokeWidth || 1,
      strokeDashArray: obj.strokeDashArray ? [...obj.strokeDashArray] : undefined,
      strokeLineCap: obj.strokeLineCap || 'butt',
      x1: (obj.left || 0) + x1,
      y1: (obj.top || 0) + y1,
      x2: (obj.left || 0) + x2,
      y2: (obj.top || 0) + y2,
      locked: serializeLocked({ ...obj, data }),
      opacity: obj.opacity ?? 1,
      angle: obj.angle || 0,
      scaleX: obj.scaleX || 1,
      scaleY: obj.scaleY || 1,
      originX: 'left',
      originY: 'top',
    }
  }

  if (obj instanceof Ellipse || obj.type === 'ellipse') {
    return {
      type: 'shape',
      id: data.id || `ellipse-${Date.now()}`,
      shape: 'ellipse',
      fill: serializeFill(obj.fill) || 'transparent',
      stroke: typeof obj.stroke === 'string' ? obj.stroke : undefined,
      strokeWidth: obj.strokeWidth || 1,
      strokeDashArray: obj.strokeDashArray ? [...obj.strokeDashArray] : undefined,
      strokeLineCap: obj.strokeLineCap,
      rx: obj.rx || 50,
      ry: obj.ry || 40,
      ...transformFromObject(obj, data),
    }
  }

  if (obj instanceof Path || obj.type === 'path') {
    const pathData =
      typeof obj.path === 'string'
        ? obj.path
        : (obj.path || [])
            .map((cmd: any[]) => cmd.join(' '))
            .join(' ')
    return {
      type: 'shape',
      id: data.id || `path-${Date.now()}`,
      shape: 'path',
      fill: serializeFill(obj.fill) || 'transparent',
      stroke: typeof obj.stroke === 'string' ? obj.stroke : undefined,
      strokeWidth: obj.strokeWidth || 1,
      strokeDashArray: obj.strokeDashArray ? [...obj.strokeDashArray] : undefined,
      strokeLineCap: obj.strokeLineCap,
      path: pathData || 'M 0 0',
      kind: data.pathKind || undefined,
      ...transformFromObject(obj, data),
      width: Math.max(1, obj.width || 100),
      height: Math.max(1, obj.height || 100),
    }
  }

  if (obj instanceof Triangle || obj.type === 'triangle') {
    // Persist triangles as path for schema stability
    const w = obj.width || 100
    const h = obj.height || 100
    return {
      type: 'shape',
      id: data.id || `triangle-${Date.now()}`,
      shape: 'path',
      fill: serializeFill(obj.fill) || 'transparent',
      stroke: typeof obj.stroke === 'string' ? obj.stroke : undefined,
      strokeWidth: obj.strokeWidth || 1,
      strokeDashArray: obj.strokeDashArray ? [...obj.strokeDashArray] : undefined,
      path: `M ${w / 2} 0 L ${w} ${h} L 0 ${h} Z`,
      kind: 'triangle',
      ...transformFromObject(obj, data),
      width: w,
      height: h,
    }
  }

  if (obj instanceof Rect) {
    return {
      type: 'shape',
      id: data.id || `rect-${Date.now()}`,
      shape: 'rect',
      fill: serializeFill(obj.fill) || 'transparent',
      stroke: typeof obj.stroke === 'string' ? obj.stroke : undefined,
      strokeWidth: obj.strokeWidth || 1,
      strokeDashArray: obj.strokeDashArray ? [...obj.strokeDashArray] : undefined,
      strokeLineCap: obj.strokeLineCap,
      rx: obj.rx || 0,
      ry: obj.ry || 0,
      ...transformFromObject(obj, data),
      width: obj.width || 100,
      height: obj.height || 100,
    }
  }

  if (obj instanceof Circle) {
    const t = transformFromObject(obj, data)
    return {
      type: 'shape',
      id: data.id || `circle-${Date.now()}`,
      shape: 'circle',
      fill: serializeFill(obj.fill) || 'transparent',
      stroke: typeof obj.stroke === 'string' ? obj.stroke : undefined,
      strokeWidth: obj.strokeWidth || 1,
      strokeDashArray: obj.strokeDashArray ? [...obj.strokeDashArray] : undefined,
      strokeLineCap: obj.strokeLineCap,
      radius: obj.radius || 50,
      x: t.x,
      y: t.y,
      angle: t.angle,
      scaleX: t.scaleX,
      scaleY: t.scaleY,
      originX: t.originX,
      originY: t.originY,
      opacity: t.opacity,
      locked: t.locked,
    }
  }

  return null
}

/**
 * Test round-trip conversion
 */
export function testRoundTrip(config: DesignConfigV3): boolean {
  try {
    return config.version === 3 && config.pages.length > 0
  } catch (error) {
    console.error('Round-trip test failed:', error)
    return false
  }
}
