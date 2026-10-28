export type SnapBounds = {
  left: number
  top: number
  width: number
  height: number
}

export type SnapGuide = {
  orientation: 'h' | 'v'
  position: number
}

export type SnapResult = {
  dx: number
  dy: number
  guides: SnapGuide[]
}

export const DEFAULT_SNAP_THRESHOLD = 6

/** Collect vertical (x) and horizontal (y) snap lines from a rect's edges + centre. */
export function collectSnapLines(bounds: SnapBounds): { xs: number[]; ys: number[] } {
  return {
    xs: [bounds.left, bounds.left + bounds.width / 2, bounds.left + bounds.width],
    ys: [bounds.top, bounds.top + bounds.height / 2, bounds.top + bounds.height],
  }
}

/** Page edge + centre snap lines. */
export function pageSnapLines(pageWidth: number, pageHeight: number): { xs: number[]; ys: number[] } {
  return collectSnapLines({ left: 0, top: 0, width: pageWidth, height: pageHeight })
}

/**
 * Compute snap adjustment for a moving rect against target lines (page + other objects).
 * Snaps the moving object's edges and centre to any target line within threshold.
 */
export function computeSnapAdjustment(
  moving: SnapBounds,
  targetXs: number[],
  targetYs: number[],
  threshold = DEFAULT_SNAP_THRESHOLD
): SnapResult {
  const movingXs = collectSnapLines(moving).xs
  const movingYs = collectSnapLines(moving).ys

  let bestDx: number | null = null
  let bestDy: number | null = null
  const guides: SnapGuide[] = []

  for (const mx of movingXs) {
    for (const tx of targetXs) {
      const d = tx - mx
      if (Math.abs(d) <= threshold && (bestDx === null || Math.abs(d) < Math.abs(bestDx))) {
        bestDx = d
      }
    }
  }

  for (const my of movingYs) {
    for (const ty of targetYs) {
      const d = ty - my
      if (Math.abs(d) <= threshold && (bestDy === null || Math.abs(d) < Math.abs(bestDy))) {
        bestDy = d
      }
    }
  }

  if (bestDx !== null) {
    const snappedXs = movingXs.map(x => x + bestDx!)
    for (const mx of snappedXs) {
      if (targetXs.some(tx => Math.abs(tx - mx) < 0.5)) {
        guides.push({ orientation: 'v', position: mx })
      }
    }
  }

  if (bestDy !== null) {
    const snappedYs = movingYs.map(y => y + bestDy!)
    for (const my of snappedYs) {
      if (targetYs.some(ty => Math.abs(ty - my) < 0.5)) {
        guides.push({ orientation: 'h', position: my })
      }
    }
  }

  // Dedupe guides
  const unique: SnapGuide[] = []
  for (const g of guides) {
    if (!unique.some(u => u.orientation === g.orientation && Math.abs(u.position - g.position) < 0.5)) {
      unique.push(g)
    }
  }

  return {
    dx: bestDx ?? 0,
    dy: bestDy ?? 0,
    guides: unique,
  }
}

/** Build snap targets from page + other object bounds. */
export function buildSnapTargets(
  pageWidth: number,
  pageHeight: number,
  others: SnapBounds[]
): { xs: number[]; ys: number[] } {
  const page = pageSnapLines(pageWidth, pageHeight)
  const xs = [...page.xs]
  const ys = [...page.ys]
  for (const b of others) {
    const lines = collectSnapLines(b)
    xs.push(...lines.xs)
    ys.push(...lines.ys)
  }
  return { xs, ys }
}
