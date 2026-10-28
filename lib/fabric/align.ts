export type AlignBounds = {
  left: number
  top: number
  width: number
  height: number
}

export type AlignKind = 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom'

export type Offset = { dx: number; dy: number }

/** Union bounding box of several rects. */
export function unionBounds(items: AlignBounds[]): AlignBounds {
  if (items.length === 0) {
    return { left: 0, top: 0, width: 0, height: 0 }
  }
  const left = Math.min(...items.map(b => b.left))
  const top = Math.min(...items.map(b => b.top))
  const right = Math.max(...items.map(b => b.left + b.width))
  const bottom = Math.max(...items.map(b => b.top + b.height))
  return { left, top, width: right - left, height: bottom - top }
}

/**
 * Align object bounds relative to a container (page for one object, selection union for several).
 * Returns per-item dx/dy offsets to apply to object left/top.
 */
export function computeAlignOffsets(
  items: AlignBounds[],
  alignment: AlignKind,
  container: AlignBounds
): Offset[] {
  return items.map(b => {
    let dx = 0
    let dy = 0
    switch (alignment) {
      case 'left':
        dx = container.left - b.left
        break
      case 'center':
        dx = container.left + container.width / 2 - (b.left + b.width / 2)
        break
      case 'right':
        dx = container.left + container.width - (b.left + b.width)
        break
      case 'top':
        dy = container.top - b.top
        break
      case 'middle':
        dy = container.top + container.height / 2 - (b.top + b.height / 2)
        break
      case 'bottom':
        dy = container.top + container.height - (b.top + b.height)
        break
    }
    return { dx, dy }
  })
}

/**
 * Resolve the align container: page when one item, selection union when several.
 */
export function resolveAlignContainer(
  items: AlignBounds[],
  page: AlignBounds
): AlignBounds {
  if (items.length <= 1) return page
  return unionBounds(items)
}

/**
 * Distribute items evenly along an axis. First and last stay put; middle items get equal gaps.
 * Requires 3+ items. Returns offsets in original order.
 */
export function computeDistributeOffsets(
  items: AlignBounds[],
  axis: 'horizontal' | 'vertical'
): Offset[] {
  if (items.length < 3) {
    return items.map(() => ({ dx: 0, dy: 0 }))
  }

  const indexed = items.map((bound, index) => ({ bound, index }))
  if (axis === 'horizontal') {
    indexed.sort((a, b) => a.bound.left - b.bound.left)
    const first = indexed[0].bound
    const last = indexed[indexed.length - 1].bound
    const totalSpace = last.left + last.width - first.left
    const objectsWidth = indexed.reduce((sum, i) => sum + i.bound.width, 0)
    const gap = (totalSpace - objectsWidth) / (indexed.length - 1)

    const offsets: Offset[] = items.map(() => ({ dx: 0, dy: 0 }))
    let currentX = first.left
    for (const { bound, index } of indexed) {
      offsets[index] = { dx: currentX - bound.left, dy: 0 }
      currentX += bound.width + gap
    }
    return offsets
  }

  indexed.sort((a, b) => a.bound.top - b.bound.top)
  const first = indexed[0].bound
  const last = indexed[indexed.length - 1].bound
  const totalSpace = last.top + last.height - first.top
  const objectsHeight = indexed.reduce((sum, i) => sum + i.bound.height, 0)
  const gap = (totalSpace - objectsHeight) / (indexed.length - 1)

  const offsets: Offset[] = items.map(() => ({ dx: 0, dy: 0 }))
  let currentY = first.top
  for (const { bound, index } of indexed) {
    offsets[index] = { dx: 0, dy: currentY - bound.top }
    currentY += bound.height + gap
  }
  return offsets
}
