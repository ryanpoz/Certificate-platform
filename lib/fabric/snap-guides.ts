import type { Canvas } from 'fabric'
import {
  buildSnapTargets,
  computeSnapAdjustment,
  DEFAULT_SNAP_THRESHOLD,
  type SnapBounds,
  type SnapGuide,
} from './snap'

/**
 * Attach drag snap-to-page/objects with guide lines drawn after render.
 * Returns a disposer.
 */
export function attachSnapGuides(
  canvas: Canvas,
  getPageSize: () => { width: number; height: number },
  threshold = DEFAULT_SNAP_THRESHOLD
): () => void {
  let guides: SnapGuide[] = []

  const onMoving = (e: any) => {
    const target = e.target
    if (!target || target.lockMovementX) return

    const page = getPageSize()
    const moving: SnapBounds = (() => {
      const b = target.getBoundingRect()
      return { left: b.left, top: b.top, width: b.width, height: b.height }
    })()

    const others: SnapBounds[] = canvas
      .getObjects()
      .filter((o: any) => o !== target && !o.get?.('data')?.isGuide)
      .filter((o: any) => {
        // Exclude objects inside active selection if target is selection
        if (target.type === 'activeselection' || target.type === 'activeSelection') {
          return !target.getObjects?.().includes(o)
        }
        return true
      })
      .map((o: any) => {
        const b = o.getBoundingRect()
        return { left: b.left, top: b.top, width: b.width, height: b.height }
      })

    const { xs, ys } = buildSnapTargets(page.width, page.height, others)
    const result = computeSnapAdjustment(moving, xs, ys, threshold)

    if (result.dx || result.dy) {
      target.set({
        left: (target.left || 0) + result.dx,
        top: (target.top || 0) + result.dy,
      })
      target.setCoords()
    }
    guides = result.guides
  }

  const onModified = () => {
    guides = []
    canvas.requestRenderAll()
  }

  const afterRender = () => {
    if (guides.length === 0) return
    const ctx = canvas.getSelectionContext?.() || canvas.contextTop
    if (!ctx) return
    const vpt = canvas.viewportTransform || [1, 0, 0, 1, 0, 0]
    ctx.save()
    ctx.strokeStyle = '#2563eb'
    ctx.lineWidth = 1
    ctx.setLineDash([4, 4])
    for (const g of guides) {
      ctx.beginPath()
      if (g.orientation === 'v') {
        const x = g.position * vpt[0] + vpt[4]
        ctx.moveTo(x, 0)
        ctx.lineTo(x, canvas.getHeight())
      } else {
        const y = g.position * vpt[3] + vpt[5]
        ctx.moveTo(0, y)
        ctx.lineTo(canvas.getWidth(), y)
      }
      ctx.stroke()
    }
    ctx.restore()
  }

  canvas.on('object:moving', onMoving)
  canvas.on('object:modified', onModified)
  canvas.on('after:render', afterRender)

  return () => {
    canvas.off('object:moving', onMoving)
    canvas.off('object:modified', onModified)
    canvas.off('after:render', afterRender)
    guides = []
  }
}
