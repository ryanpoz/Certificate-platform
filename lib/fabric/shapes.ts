/**
 * Shape catalog + pure geometry configs for the Elements panel.
 * Fabric object creation lives in createFabricShape (browser).
 */

export type ShapeKind =
  | 'rect'
  | 'rounded-rect'
  | 'circle'
  | 'ellipse'
  | 'triangle'
  | 'line'
  | 'dashed-line'
  | 'star'
  | 'seal'
  | 'ribbon'

export type ShapeFactoryConfig = {
  kind: ShapeKind
  label: string
  /** Default unscaled size when placed on the page */
  defaultWidth: number
  defaultHeight: number
  /** For circle/seal */
  defaultRadius?: number
  fill: string
  stroke: string
  strokeWidth: number
  strokeDashArray?: number[]
  rx?: number
  ry?: number
  /** path-based kinds */
  pathKind?: 'triangle' | 'star' | 'seal' | 'ribbon'
}

export const SHAPE_CATALOG: ShapeFactoryConfig[] = [
  {
    kind: 'rect',
    label: 'Rectangle',
    defaultWidth: 200,
    defaultHeight: 120,
    fill: '#dbeafe',
    stroke: '#2563eb',
    strokeWidth: 2,
  },
  {
    kind: 'rounded-rect',
    label: 'Rounded rectangle',
    defaultWidth: 200,
    defaultHeight: 120,
    fill: '#dbeafe',
    stroke: '#2563eb',
    strokeWidth: 2,
    rx: 16,
    ry: 16,
  },
  {
    kind: 'circle',
    label: 'Circle',
    defaultWidth: 140,
    defaultHeight: 140,
    defaultRadius: 70,
    fill: '#dbeafe',
    stroke: '#2563eb',
    strokeWidth: 2,
  },
  {
    kind: 'ellipse',
    label: 'Ellipse',
    defaultWidth: 220,
    defaultHeight: 140,
    fill: '#dbeafe',
    stroke: '#2563eb',
    strokeWidth: 2,
  },
  {
    kind: 'triangle',
    label: 'Triangle',
    defaultWidth: 160,
    defaultHeight: 140,
    fill: '#dbeafe',
    stroke: '#2563eb',
    strokeWidth: 2,
    pathKind: 'triangle',
  },
  {
    kind: 'line',
    label: 'Line',
    defaultWidth: 280,
    defaultHeight: 2,
    fill: 'transparent',
    stroke: '#111827',
    strokeWidth: 3,
  },
  {
    kind: 'dashed-line',
    label: 'Dashed line',
    defaultWidth: 280,
    defaultHeight: 2,
    fill: 'transparent',
    stroke: '#111827',
    strokeWidth: 3,
    strokeDashArray: [12, 8],
  },
  {
    kind: 'star',
    label: 'Star',
    defaultWidth: 140,
    defaultHeight: 140,
    fill: '#fef3c7',
    stroke: '#d97706',
    strokeWidth: 2,
    pathKind: 'star',
  },
  {
    kind: 'seal',
    label: 'Seal / badge',
    defaultWidth: 140,
    defaultHeight: 140,
    defaultRadius: 70,
    fill: '#fee2e2',
    stroke: '#dc2626',
    strokeWidth: 2,
    pathKind: 'seal',
  },
  {
    kind: 'ribbon',
    label: 'Ribbon banner',
    defaultWidth: 260,
    defaultHeight: 70,
    fill: '#2563eb',
    stroke: '#1e40af',
    strokeWidth: 1,
    pathKind: 'ribbon',
  },
]

export function getShapeFactoryConfig(kind: ShapeKind): ShapeFactoryConfig {
  const found = SHAPE_CATALOG.find(s => s.kind === kind)
  if (!found) throw new Error(`Unknown shape kind: ${kind}`)
  return found
}

/** SVG path for an equilateral-ish triangle in a w×h box (local origin top-left). */
export function trianglePath(w: number, h: number): string {
  return `M ${w / 2} 0 L ${w} ${h} L 0 ${h} Z`
}

/** 5-point star path centred in w×h. */
export function starPath(w: number, h: number, points = 5): string {
  const cx = w / 2
  const cy = h / 2
  const outer = Math.min(w, h) / 2
  const inner = outer * 0.4
  const coords: string[] = []
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outer : inner
    const angle = (Math.PI / points) * i - Math.PI / 2
    const x = cx + r * Math.cos(angle)
    const y = cy + r * Math.sin(angle)
    coords.push(`${i === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`)
  }
  return `${coords.join(' ')} Z`
}

/** Notched seal / badge (cog-like circle). */
export function sealPath(radius: number, notches = 16): string {
  const cx = radius
  const cy = radius
  const outer = radius
  const inner = radius * 0.82
  const coords: string[] = []
  const steps = notches * 2
  for (let i = 0; i < steps; i++) {
    const r = i % 2 === 0 ? outer : inner
    const angle = (Math.PI * 2 * i) / steps - Math.PI / 2
    const x = cx + r * Math.cos(angle)
    const y = cy + r * Math.sin(angle)
    coords.push(`${i === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`)
  }
  return `${coords.join(' ')} Z`
}

/** Classic ribbon banner path. */
export function ribbonPath(w: number, h: number): string {
  const notch = Math.min(h * 0.45, w * 0.12)
  return [
    `M 0 ${h * 0.15}`,
    `L ${notch} ${h / 2}`,
    `L 0 ${h * 0.85}`,
    `L ${w * 0.12} ${h * 0.85}`,
    `L ${w * 0.12} ${h}`,
    `L ${w * 0.88} ${h}`,
    `L ${w * 0.88} ${h * 0.85}`,
    `L ${w} ${h * 0.85}`,
    `L ${w - notch} ${h / 2}`,
    `L ${w} ${h * 0.15}`,
    `L ${w * 0.88} ${h * 0.15}`,
    `L ${w * 0.88} 0`,
    `L ${w * 0.12} 0`,
    `L ${w * 0.12} ${h * 0.15}`,
    'Z',
  ].join(' ')
}

export function pathForKind(
  kind: 'triangle' | 'star' | 'seal' | 'ribbon',
  width: number,
  height: number
): string {
  switch (kind) {
    case 'triangle':
      return trianglePath(width, height)
    case 'star':
      return starPath(width, height)
    case 'seal':
      return sealPath(Math.min(width, height) / 2)
    case 'ribbon':
      return ribbonPath(width, height)
  }
}

export type FillValue =
  | string
  | {
      type: 'linear'
      coords: { x1: number; y1: number; x2: number; y2: number }
      stops: { offset: number; color: string }[]
    }

/** Normalize stroke dash for solid vs dashed. */
export function strokeDashForStyle(style: 'solid' | 'dashed', strokeWidth = 2): number[] | undefined {
  if (style === 'dashed') return [Math.max(6, strokeWidth * 4), Math.max(4, strokeWidth * 2)]
  return undefined
}

export function styleFromDashArray(dash?: number[] | null): 'solid' | 'dashed' {
  return dash && dash.length > 0 ? 'dashed' : 'solid'
}

/** Snap angle to nearest 15° when shiftSnap is true. */
export function snapRotationAngle(angle: number, shiftSnap: boolean, step = 15): number {
  if (!shiftSnap) return angle
  return Math.round(angle / step) * step
}
