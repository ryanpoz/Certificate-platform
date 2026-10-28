import {
  computeAlignOffsets,
  computeDistributeOffsets,
  resolveAlignContainer,
  unionBounds,
} from '@/lib/fabric/align'
import {
  computeSnapAdjustment,
  buildSnapTargets,
  pageSnapLines,
  collectSnapLines,
  DEFAULT_SNAP_THRESHOLD,
} from '@/lib/fabric/snap'
import {
  SHAPE_CATALOG,
  getShapeFactoryConfig,
  trianglePath,
  starPath,
  sealPath,
  ribbonPath,
  pathForKind,
  strokeDashForStyle,
  snapRotationAngle,
} from '@/lib/fabric/shapes'
import {
  lockPropsFromFlag,
  serializeLocked,
  applyLockToData,
} from '@/lib/fabric/lock'

describe('align / distribute math', () => {
  const a = { left: 10, top: 20, width: 40, height: 20 }
  const b = { left: 100, top: 40, width: 40, height: 20 }
  const c = { left: 200, top: 10, width: 40, height: 20 }
  const page = { left: 0, top: 0, width: 1000, height: 800 }

  it('aligns a single object to the page', () => {
    const container = resolveAlignContainer([a], page)
    expect(container).toEqual(page)
    const [left] = computeAlignOffsets([a], 'left', container)
    expect(left.dx).toBe(-10)
    const [center] = computeAlignOffsets([a], 'center', container)
    expect(center.dx).toBeCloseTo(500 - (10 + 20))
    const [middle] = computeAlignOffsets([a], 'middle', container)
    expect(middle.dy).toBeCloseTo(400 - (20 + 10))
  })

  it('aligns several objects to the selection union', () => {
    const items = [a, b]
    const container = resolveAlignContainer(items, page)
    expect(container).toEqual(unionBounds(items))
    const offsets = computeAlignOffsets(items, 'left', container)
    expect(offsets[0].dx).toBe(0)
    expect(offsets[1].dx).toBe(10 - 100)
  })

  it('distributes three objects horizontally with equal gaps', () => {
    const offsets = computeDistributeOffsets([a, b, c], 'horizontal')
    // first and last stay; middle moves
    expect(offsets[0].dx).toBe(0)
    expect(offsets[2].dx).toBe(0)
    const midLeft = b.left + offsets[1].dx
    const gap1 = midLeft - (a.left + a.width)
    const gap2 = c.left - (midLeft + b.width)
    expect(gap1).toBeCloseTo(gap2)
  })

  it('distributes vertically for 3+ items', () => {
    const tall = [
      { left: 0, top: 0, width: 10, height: 10 },
      { left: 0, top: 50, width: 10, height: 10 },
      { left: 0, top: 200, width: 10, height: 10 },
    ]
    const offsets = computeDistributeOffsets(tall, 'vertical')
    expect(offsets[0].dy).toBe(0)
    expect(offsets[2].dy).toBe(0)
    const midTop = tall[1].top + offsets[1].dy
    const g1 = midTop - 10
    const g2 = 200 - (midTop + 10)
    expect(g1).toBeCloseTo(g2)
  })

  it('no-ops distribute with fewer than 3 items', () => {
    expect(computeDistributeOffsets([a, b], 'horizontal')).toEqual([
      { dx: 0, dy: 0 },
      { dx: 0, dy: 0 },
    ])
  })
})

describe('snap calculation', () => {
  it('exposes default threshold of 6px', () => {
    expect(DEFAULT_SNAP_THRESHOLD).toBe(6)
  })

  it('collects page centre and edge lines', () => {
    const page = pageSnapLines(1000, 800)
    expect(page.xs).toEqual([0, 500, 1000])
    expect(page.ys).toEqual([0, 400, 800])
  })

  it('snaps moving object to nearby target within threshold', () => {
    const moving = { left: 494, top: 10, width: 20, height: 20 } // centre at 504
    const { xs, ys } = buildSnapTargets(1000, 800, [])
    const result = computeSnapAdjustment(moving, xs, ys, 6)
    // object centre 504 → page centre 500 → dx -4
    expect(result.dx).toBeCloseTo(-4)
    expect(result.guides.some(g => g.orientation === 'v' && g.position === 500)).toBe(true)
  })

  it('snaps to other object edges', () => {
    // Place so only the left edge is within threshold of the other object's left
    const moving = { left: 96, top: 0, width: 10, height: 10 } // edges 96, 101, 106
    const other = collectSnapLines({ left: 100, top: 50, width: 40, height: 20 })
    const result = computeSnapAdjustment(moving, other.xs, other.ys, 6)
    // nearest: centre 101 → 100 (dx -1) wins over left 96 → 100 (dx +4)
    expect(result.dx).toBe(-1)
    expect(result.guides.some(g => g.orientation === 'v')).toBe(true)
  })

  it('does not snap when outside threshold', () => {
    const moving = { left: 50, top: 50, width: 10, height: 10 }
    const result = computeSnapAdjustment(moving, [200], [200], 6)
    expect(result.dx).toBe(0)
    expect(result.dy).toBe(0)
    expect(result.guides).toHaveLength(0)
  })
})

describe('shape factory configs', () => {
  it('lists all required Round 1 Part 2 shapes', () => {
    const kinds = SHAPE_CATALOG.map(s => s.kind)
    expect(kinds).toEqual([
      'rect',
      'rounded-rect',
      'circle',
      'ellipse',
      'triangle',
      'line',
      'dashed-line',
      'star',
      'seal',
      'ribbon',
    ])
  })

  it('provides sensible default sizes and paints', () => {
    for (const kind of SHAPE_CATALOG.map(s => s.kind)) {
      const cfg = getShapeFactoryConfig(kind)
      expect(cfg.defaultWidth).toBeGreaterThan(0)
      expect(cfg.defaultHeight).toBeGreaterThan(0)
      expect(cfg.strokeWidth).toBeGreaterThanOrEqual(0)
      expect(cfg.label.length).toBeGreaterThan(0)
    }
    expect(getShapeFactoryConfig('rounded-rect').rx).toBeGreaterThan(0)
    expect(getShapeFactoryConfig('dashed-line').strokeDashArray?.length).toBeGreaterThan(0)
    expect(getShapeFactoryConfig('circle').defaultRadius).toBe(70)
  })

  it('builds SVG paths for complex shapes', () => {
    expect(trianglePath(100, 80)).toContain('M 50 0')
    expect(starPath(100, 100)).toMatch(/^M /)
    expect(sealPath(50)).toMatch(/Z$/)
    expect(ribbonPath(200, 60)).toContain('Z')
    expect(pathForKind('star', 120, 120)).toBe(starPath(120, 120))
  })

  it('maps stroke style helpers and rotation snap', () => {
    expect(strokeDashForStyle('solid')).toBeUndefined()
    expect(strokeDashForStyle('dashed', 2)?.length).toBe(2)
    expect(snapRotationAngle(22, true)).toBe(15)
    expect(snapRotationAngle(22, false)).toBe(22)
    expect(snapRotationAngle(38, true)).toBe(45)
  })
})

describe('lock state serialization', () => {
  it('expands locked flag into fabric lock props', () => {
    expect(lockPropsFromFlag(true)).toMatchObject({
      locked: true,
      lockMovementX: true,
      lockMovementY: true,
      lockScalingX: true,
      lockScalingY: true,
      lockRotation: true,
      editable: false,
    })
    expect(lockPropsFromFlag(false).locked).toBe(false)
    expect(lockPropsFromFlag(false).lockMovementX).toBe(false)
  })

  it('reads locked from data or movement locks', () => {
    expect(serializeLocked({ data: { locked: true } })).toBe(true)
    expect(serializeLocked({ locked: true })).toBe(true)
    expect(serializeLocked({ lockMovementX: true, lockMovementY: true })).toBe(true)
    expect(serializeLocked({ lockMovementX: false })).toBe(false)
  })

  it('merges locked into object data for JSON persistence', () => {
    expect(applyLockToData({ id: 'x' }, true)).toEqual({ id: 'x', locked: true })
    expect(applyLockToData(undefined, false)).toEqual({ locked: false })
  })
})
