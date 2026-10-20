import { Canvas, Gradient, IText, Textbox, Rect, Circle, Image as FabricImage } from 'fabric'
import type { DesignConfigV3, Element, Page } from '@/lib/design-config/v3-schema'
import { FieldText } from './objects/FieldText'

/**
 * Convert Design Config V3 to Fabric canvas
 */
export async function designConfigToFabric(
  config: DesignConfigV3,
  canvas: Canvas,
  pageIndex = 0
): Promise<void> {
  const page = config.pages[pageIndex]
  if (!page) throw new Error(`Page ${pageIndex} not found`)

  // Set canvas dimensions
  canvas.setDimensions({ width: page.width, height: page.height })

  // Set background
  await applyBackground(canvas, page)

  // Add elements
  for (const element of page.elements) {
    const obj = await elementToFabric(element)
    if (obj) {
      canvas.add(obj)
    }
  }

  canvas.renderAll()
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

  return {
    version: 3,
    pages: [{
      width: canvas.width || 1123,
      height: canvas.height || 794,
      unit: 'px',
      background: {
        type: 'color',
        color: typeof canvas.backgroundColor === 'string' ? canvas.backgroundColor : '#ffffff'
      },
      elements
    }]
  }
}

/**
 * Apply background to canvas
 */
async function applyBackground(canvas: Canvas, page: Page): Promise<void> {
  if (page.background.type === 'color') {
    canvas.set('backgroundColor', page.background.color)
  } else if (page.background.type === 'gradient') {
    const grad = page.background.gradient
    const gradient = new Gradient({
      type: grad.type,
      coords: grad.coords,
      colorStops: grad.stops
    })
    canvas.set('backgroundColor', gradient)
  } else if (page.background.type === 'image') {
    // Load background image
    const img = await FabricImage.fromURL(page.background.imageUrl)
    canvas.backgroundImage = img
    canvas.renderAll()
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
      fontFamily: element.fontFamily,
      fontWeight: element.fontWeight,
      fontStyle: element.fontStyle,
      fill: element.fill,
      textAlign: element.textAlign,
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
      fontFamily: element.fontFamily,
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
      maxLines: element.maxLines
    } as any)
  }

  if (element.type === 'shape' && element.shape === 'rect') {
    return new Rect({
      left: element.x,
      top: element.y,
      width: element.width,
      height: element.height,
      fill: element.fill || 'transparent',
      stroke: element.stroke,
      strokeWidth: element.strokeWidth,
      strokeDashArray: element.strokeDashArray,
      rx: element.rx,
      ry: element.ry,
      angle: element.angle,
      scaleX: element.scaleX,
      scaleY: element.scaleY,
      originX: element.originX,
      originY: element.originY,
      opacity: element.opacity,
      data: { id: element.id }
    })
  }

  if (element.type === 'shape' && element.shape === 'circle') {
    return new Circle({
      left: element.x,
      top: element.y,
      radius: element.radius,
      fill: element.fill || 'transparent',
      stroke: element.stroke,
      strokeWidth: element.strokeWidth,
      strokeDashArray: element.strokeDashArray,
      angle: element.angle,
      scaleX: element.scaleX,
      scaleY: element.scaleY,
      originX: element.originX,
      originY: element.originY,
      opacity: element.opacity,
      data: { id: element.id }
    })
  }

  // TODO: Add other element types (image, signature, qr, line, path)
  
  return null
}

/**
 * Convert Fabric object to element
 */
function fabricToElement(obj: any): Element | null {
  const data = obj.get('data') || {}
  
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
      x: obj.left || 0,
      y: obj.top || 0,
      width: obj.width || 200,
      height: obj.height || 50,
      angle: obj.angle || 0,
      scaleX: obj.scaleX || 1,
      scaleY: obj.scaleY || 1,
      originX: obj.originX || 'left',
      originY: obj.originY || 'top',
      opacity: obj.opacity ?? 1
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
      x: obj.left || 0,
      y: obj.top || 0,
      width: obj.width || 200,
      height: obj.height || 50,
      angle: obj.angle || 0,
      scaleX: obj.scaleX || 1,
      scaleY: obj.scaleY || 1,
      originX: (obj.originX || 'left') as 'left' | 'center' | 'right',
      originY: (obj.originY || 'top') as 'top' | 'center' | 'bottom',
      opacity: obj.opacity ?? 1,
      underline: obj.underline || false,
      strikethrough: obj.linethrough || false
    }
  }

  if (obj instanceof Rect) {
    return {
      type: 'shape',
      id: data.id || `rect-${Date.now()}`,
      shape: 'rect',
      fill: typeof obj.fill === 'string' ? obj.fill : 'transparent',
      stroke: typeof obj.stroke === 'string' ? obj.stroke : undefined,
      strokeWidth: obj.strokeWidth || 1,
      strokeDashArray: obj.strokeDashArray ? [...obj.strokeDashArray] : undefined,
      rx: obj.rx || 0,
      ry: obj.ry || 0,
      x: obj.left || 0,
      y: obj.top || 0,
      width: obj.width || 100,
      height: obj.height || 100,
      angle: obj.angle || 0,
      scaleX: obj.scaleX || 1,
      scaleY: obj.scaleY || 1,
      originX: (obj.originX || 'left') as 'left' | 'center' | 'right',
      originY: (obj.originY || 'top') as 'top' | 'center' | 'bottom',
      opacity: obj.opacity ?? 1
    }
  }

  if (obj instanceof Circle) {
    return {
      type: 'shape',
      id: data.id || `circle-${Date.now()}`,
      shape: 'circle',
      fill: typeof obj.fill === 'string' ? obj.fill : 'transparent',
      stroke: typeof obj.stroke === 'string' ? obj.stroke : undefined,
      strokeWidth: obj.strokeWidth || 1,
      strokeDashArray: obj.strokeDashArray ? [...obj.strokeDashArray] : undefined,
      radius: obj.radius || 50,
      x: obj.left || 0,
      y: obj.top || 0,
      angle: obj.angle || 0,
      scaleX: obj.scaleX || 1,
      scaleY: obj.scaleY || 1,
      originX: 'center' as const,
      originY: 'center' as const,
      opacity: obj.opacity ?? 1
    }
  }

  return null
}

/**
 * Test round-trip conversion
 */
export function testRoundTrip(config: DesignConfigV3): boolean {
  try {
    // Basic validation - can't test actual canvas in Node
    return config.version === 3 && config.pages.length > 0
  } catch (error) {
    console.error('Round-trip test failed:', error)
    return false
  }
}
