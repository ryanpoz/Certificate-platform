import {
  Rect,
  Circle,
  Ellipse,
  Line,
  Path,
  Triangle,
  Gradient,
} from 'fabric'
import {
  getShapeFactoryConfig,
  pathForKind,
  type ShapeKind,
  type FillValue,
} from './shapes'
import { lockPropsFromFlag } from './lock'

export function fillToFabric(fill: FillValue | undefined): any {
  if (!fill) return '#dbeafe'
  if (typeof fill === 'string') return fill
  return new Gradient({
    type: 'linear',
    coords: fill.coords as any,
    colorStops: fill.stops,
  })
}

export function createFabricShape(
  kind: ShapeKind,
  pageWidth: number,
  pageHeight: number
): any {
  const cfg = getShapeFactoryConfig(kind)
  const id = `${kind}-${Date.now()}`
  const center = { left: pageWidth / 2, top: pageHeight / 2 }
  const base = {
    originX: 'center' as const,
    originY: 'center' as const,
    left: center.left,
    top: center.top,
    fill: fillToFabric(cfg.fill),
    stroke: cfg.stroke,
    strokeWidth: cfg.strokeWidth,
    strokeDashArray: cfg.strokeDashArray,
    opacity: 1,
    data: { id, shapeKind: kind },
  }

  if (kind === 'rect' || kind === 'rounded-rect') {
    return new Rect({
      ...base,
      width: cfg.defaultWidth,
      height: cfg.defaultHeight,
      rx: cfg.rx || 0,
      ry: cfg.ry || 0,
    })
  }

  if (kind === 'circle') {
    return new Circle({
      ...base,
      radius: cfg.defaultRadius || 70,
    })
  }

  if (kind === 'ellipse') {
    return new Ellipse({
      ...base,
      rx: cfg.defaultWidth / 2,
      ry: cfg.defaultHeight / 2,
    })
  }

  if (kind === 'triangle') {
    // Fabric Triangle is easier than path for basic triangle
    return new Triangle({
      ...base,
      width: cfg.defaultWidth,
      height: cfg.defaultHeight,
      data: { id, shapeKind: 'triangle', pathKind: 'triangle' },
    })
  }

  if (kind === 'line' || kind === 'dashed-line') {
    const half = cfg.defaultWidth / 2
    return new Line([-half, 0, half, 0], {
      ...base,
      fill: undefined,
      strokeLineCap: 'butt',
      data: { id, shapeKind: kind },
    })
  }

  if (kind === 'star' || kind === 'seal' || kind === 'ribbon') {
    const pathKind = kind
    const w = cfg.defaultWidth
    const h = cfg.defaultHeight
    const path = pathForKind(pathKind, w, h)
    return new Path(path, {
      ...base,
      data: { id, shapeKind: kind, pathKind },
    })
  }

  return new Rect({ ...base, width: 100, height: 100 })
}

export function applyObjectLock(obj: any, locked: boolean) {
  const props = lockPropsFromFlag(locked)
  const data = { ...(obj.get?.('data') || obj.data || {}), locked }
  obj.set({
    lockMovementX: props.lockMovementX,
    lockMovementY: props.lockMovementY,
    lockScalingX: props.lockScalingX,
    lockScalingY: props.lockScalingY,
    lockRotation: props.lockRotation,
    editable: locked ? false : true,
    data,
  })
  if (typeof obj.set === 'function' && 'lockSkewingX' in obj) {
    obj.set({ lockSkewingX: locked, lockSkewingY: locked })
  }
}
