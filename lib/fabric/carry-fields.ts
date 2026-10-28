/**
 * Pure helpers for carrying FieldText objects across template switches.
 * Fields whose keys already exist on the destination canvas are skipped (no duplicates).
 * An optional userAddedFieldKeys filter can further limit which fields are carried.
 *
 * Visual style (fill/font) should follow the destination template — only the text
 * value is preserved across switches.
 */

import type { Background } from '@/lib/design-config/v3-schema'

export type CarryFieldSnapshot = {
  field: string
  text: string
  left: number
  top: number
  width: number
  height: number
  fontSize: number
  fontFamily: string
  fill: string
  textAlign: string
  autoShrink: boolean
  minFontSize: number
  maxLines: number
  angle: number
  scaleX: number
  scaleY: number
  originX: string
  originY: string
  elementId?: string
}

export type CarryFieldVisualStyle = {
  fill: string
  fontFamily: string
  fontSize: number
  textAlign: string
}

/** Field keys present on a design config page (type === 'field'). */
export function fieldKeysFromElements(
  elements: Array<{ type: string; field?: string }>
): Set<string> {
  const keys = new Set<string>()
  for (const el of elements) {
    if (el.type === 'field' && el.field) {
      keys.add(el.field)
    }
  }
  return keys
}

/**
 * Keep snapshots whose field key is not already on the destination canvas,
 * and (when provided) only those marked as user-added.
 * First snapshot wins per field key.
 */
export function selectFieldsToCarry(
  snapshots: CarryFieldSnapshot[],
  keysAlreadyOnCanvas: Set<string>,
  userAddedFieldKeys?: Set<string> | ReadonlySet<string>
): CarryFieldSnapshot[] {
  const seen = new Set<string>()
  const out: CarryFieldSnapshot[] = []

  for (const snap of snapshots) {
    const key = snap.field?.trim()
    if (!key) continue
    if (keysAlreadyOnCanvas.has(key)) continue
    if (userAddedFieldKeys && !userAddedFieldKeys.has(key)) continue
    if (seen.has(key)) continue
    seen.add(key)
    out.push(snap)
  }

  return out
}

/**
 * Clamp left/top so a carried field stays within the destination page.
 */
export function clampFieldPosition(
  left: number,
  top: number,
  width: number,
  pageWidth: number,
  pageHeight: number,
  margin = 24
): { left: number; top: number } {
  const maxLeft = Math.max(margin, pageWidth - width - margin)
  const maxTop = Math.max(margin, pageHeight - margin)
  return {
    left: Math.min(Math.max(left, margin), maxLeft),
    top: Math.min(Math.max(top, margin), maxTop),
  }
}

/** Parse #rgb / #rrggbb / rgb() into 0–255 channels. */
export function parseCssColor(color: string): { r: number; g: number; b: number } | null {
  const c = color.trim()
  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(c)
  if (hex) {
    const h = hex[1]
    if (h.length === 3) {
      return {
        r: parseInt(h[0] + h[0], 16),
        g: parseInt(h[1] + h[1], 16),
        b: parseInt(h[2] + h[2], 16),
      }
    }
    return {
      r: parseInt(h.slice(0, 2), 16),
      g: parseInt(h.slice(2, 4), 16),
      b: parseInt(h.slice(4, 6), 16),
    }
  }
  const rgb = /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/i.exec(c)
  if (rgb) {
    return { r: Number(rgb[1]), g: Number(rgb[2]), b: Number(rgb[3]) }
  }
  return null
}

/** Relative luminance 0–1 (sRGB). */
export function relativeLuminance(color: string): number | null {
  const rgb = parseCssColor(color)
  if (!rgb) return null
  const lin = (v: number) => {
    const s = v / 255
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
  }
  const r = lin(rgb.r)
  const g = lin(rgb.g)
  const b = lin(rgb.b)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/**
 * Pick a readable text colour for a page background.
 * Dark backgrounds → white text; light → near-black.
 */
export function contrastTextColorForBackground(background: Background): string {
  let sample = '#ffffff'
  if (background.type === 'color') {
    sample = background.color
  } else if (background.type === 'gradient') {
    const stops = background.gradient.stops
    sample = stops[Math.floor(stops.length / 2)]?.color || stops[0]?.color || sample
  } else if (background.type === 'image') {
    // Cover images vary; default to dark text (most cert photos are light-ish)
    return '#111111'
  }
  const lum = relativeLuminance(sample)
  if (lum === null) return '#111111'
  return lum < 0.45 ? '#ffffff' : '#111111'
}

/**
 * Visual style for fields carried onto a new template.
 * Prefer an existing destination field's style; otherwise contrast against the page background.
 */
export function resolveCarryFieldStyle(
  destinationFieldStyles: Array<Partial<CarryFieldVisualStyle>>,
  background: Background
): CarryFieldVisualStyle {
  const ref =
    destinationFieldStyles.find(s => typeof s.fill === 'string' && s.fill && s.fill !== 'transparent') ||
    destinationFieldStyles[0]

  return {
    fill: (ref?.fill as string) || contrastTextColorForBackground(background),
    fontFamily: ref?.fontFamily || 'Inter',
    fontSize: ref?.fontSize || 28,
    textAlign: ref?.textAlign || 'center',
  }
}
