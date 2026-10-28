/**
 * Pure helpers for carrying FieldText objects across template switches.
 * Fields whose keys already exist on the destination canvas are skipped (no duplicates).
 * An optional userAddedFieldKeys filter can further limit which fields are carried.
 */

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
