import type { Background, Gradient, LinearGradient } from '@/lib/design-config/v3-schema'

export const BACKGROUND_SWATCHES = [
  '#ffffff',
  '#f8fafc',
  '#fef3c7',
  '#fee2e2',
  '#dbeafe',
  '#dcfce7',
  '#f3e8ff',
  '#1a1a2e',
  '#0f172a',
  '#667eea',
  '#764ba2',
  '#d4af37',
] as const

/**
 * Build linear gradient coords for a page from an angle in degrees.
 * 0° = left → right, 90° = top → bottom.
 */
export function linearGradientCoordsFromAngle(
  width: number,
  height: number,
  angleDeg: number
): LinearGradient['coords'] {
  const angle = ((angleDeg % 360) + 360) % 360
  const rad = (angle * Math.PI) / 180
  const cx = width / 2
  const cy = height / 2
  // Length of gradient line through the center covering the box
  const length =
    Math.abs(width * Math.cos(rad)) + Math.abs(height * Math.sin(rad))
  const half = length / 2
  return {
    x1: cx - Math.cos(rad) * half,
    y1: cy - Math.sin(rad) * half,
    x2: cx + Math.cos(rad) * half,
    y2: cy + Math.sin(rad) * half,
  }
}

export function createLinearGradientBackground(
  width: number,
  height: number,
  color1: string,
  color2: string,
  angleDeg: number
): Background {
  const coords = linearGradientCoordsFromAngle(width, height, angleDeg)
  const gradient: Gradient = {
    type: 'linear',
    coords,
    stops: [
      { offset: 0, color: color1 },
      { offset: 1, color: color2 },
    ],
  }
  return { type: 'gradient', gradient }
}

export function createSolidBackground(color: string): Background {
  return { type: 'color', color }
}

export function createImageBackground(
  imageUrl: string,
  opacity = 1
): Background {
  return {
    type: 'image',
    imageUrl,
    opacity: Math.min(1, Math.max(0, opacity)),
  }
}

/** Cover-fit scale so an image fills the page (may crop). */
export function coverScale(
  imageWidth: number,
  imageHeight: number,
  pageWidth: number,
  pageHeight: number
): number {
  if (imageWidth <= 0 || imageHeight <= 0) return 1
  return Math.max(pageWidth / imageWidth, pageHeight / imageHeight)
}

/**
 * Serialize a canvas-like background snapshot into Design Config Background.
 * Pure — no Fabric dependency — for round-trip tests.
 */
export type CanvasBackgroundSnapshot = {
  backgroundColor?: string | { type?: string; coords?: LinearGradient['coords']; colorStops?: Array<{ offset: number; color: string }> } | null
  backgroundImage?: {
    src?: string
    opacity?: number
  } | null
}

export function serializeBackgroundFromSnapshot(
  snapshot: CanvasBackgroundSnapshot
): Background {
  if (snapshot.backgroundImage?.src) {
    return createImageBackground(
      snapshot.backgroundImage.src,
      snapshot.backgroundImage.opacity ?? 1
    )
  }

  const bg = snapshot.backgroundColor
  if (bg && typeof bg === 'object' && (bg.type === 'linear' || Array.isArray(bg.colorStops))) {
    const stops = (bg.colorStops || []).map(s => ({
      offset: s.offset,
      color: s.color,
    }))
    if (stops.length >= 2 && bg.coords) {
      return {
        type: 'gradient',
        gradient: {
          type: 'linear',
          coords: bg.coords,
          stops,
        },
      }
    }
  }

  if (typeof bg === 'string' && bg) {
    return createSolidBackground(bg)
  }

  return createSolidBackground('#ffffff')
}
