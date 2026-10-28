export type PagePaper = 'a4' | 'letter'
export type PageOrientation = 'landscape' | 'portrait'

export type PageSize = {
  width: number
  height: number
  paper: PagePaper
  orientation: PageOrientation
}

/** Page sizes in CSS px at 96dpi (matches existing lab templates). */
export const PAGE_SIZES: Record<`${PagePaper}-${PageOrientation}`, PageSize> = {
  'a4-landscape': { width: 1123, height: 794, paper: 'a4', orientation: 'landscape' },
  'a4-portrait': { width: 794, height: 1123, paper: 'a4', orientation: 'portrait' },
  'letter-landscape': { width: 1056, height: 816, paper: 'letter', orientation: 'landscape' },
  'letter-portrait': { width: 816, height: 1056, paper: 'letter', orientation: 'portrait' },
}

export function getPageSize(paper: PagePaper, orientation: PageOrientation): PageSize {
  return PAGE_SIZES[`${paper}-${orientation}`]
}

export function detectPageSize(width: number, height: number): PageSize {
  const orientation: PageOrientation = width >= height ? 'landscape' : 'portrait'
  // Prefer closest match by area / dimensions
  const candidates = Object.values(PAGE_SIZES).filter(p => p.orientation === orientation)
  let best = candidates[0]
  let bestDist = Infinity
  for (const c of candidates) {
    const dist = Math.abs(c.width - width) + Math.abs(c.height - height)
    if (dist < bestDist) {
      bestDist = dist
      best = c
    }
  }
  return best
}

export type PositionedObject = {
  left: number
  top: number
}

/**
 * Re-centre / scale object positions proportionally when the page size changes.
 */
export function remapObjectPositions<T extends PositionedObject>(
  objects: T[],
  fromWidth: number,
  fromHeight: number,
  toWidth: number,
  toHeight: number
): T[] {
  if (fromWidth <= 0 || fromHeight <= 0) return objects.map(o => ({ ...o }))
  const sx = toWidth / fromWidth
  const sy = toHeight / fromHeight
  return objects.map(o => ({
    ...o,
    left: o.left * sx,
    top: o.top * sy,
  }))
}
