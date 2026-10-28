/**
 * Pure helpers for preserving editable text across template switches by id.
 * FieldText uses its `field` key; plain text objects use their element `id`.
 */

export type TextSource = {
  /** Stable id used for matching (field key or element id) */
  id: string
  text: string
}

/**
 * Build a map of id → text from canvas-like sources.
 * Skips empty ids; later entries overwrite earlier ones for the same id.
 */
export function collectTextById(sources: TextSource[]): Record<string, string> {
  const out: Record<string, string> = {}
  for (const source of sources) {
    const id = source.id?.trim()
    if (!id) continue
    const text = source.text ?? ''
    if (text) {
      out[id] = text
    }
  }
  return out
}

/**
 * Merge newly collected text into previously preserved values.
 * Collected values win on key collision.
 */
export function mergeTextById(
  previous: Record<string, string>,
  collected: Record<string, string>
): Record<string, string> {
  return { ...previous, ...collected }
}

/**
 * Resolve text for a target id from the preserved map.
 * Returns undefined when there is nothing to restore.
 */
export function resolveTextById(
  id: string,
  preserved: Record<string, string>
): string | undefined {
  if (!id) return undefined
  const value = preserved[id]
  return value !== undefined && value !== '' ? value : undefined
}

/**
 * Apply preserved text onto targets that expose a mutable `text` property.
 * Only updates targets whose id exists in the preserved map.
 * Returns the number of objects updated (for tests / debugging).
 */
export function applyTextById<T extends { id: string; text: string }>(
  targets: T[],
  preserved: Record<string, string>
): number {
  let updated = 0
  for (const target of targets) {
    const next = resolveTextById(target.id, preserved)
    if (next !== undefined) {
      target.text = next
      updated++
    }
  }
  return updated
}
