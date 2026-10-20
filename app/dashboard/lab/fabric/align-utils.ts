import { Canvas, FabricObject } from 'fabric'

/**
 * Align and distribute utilities using getBoundingRect
 * All calculations in design units (not zoomed canvas dimensions)
 */

export function alignLeft(canvas: Canvas) {
  const activeObjects = canvas.getActiveObjects()
  if (activeObjects.length < 2) return

  const bounds = activeObjects.map(obj => obj.getBoundingRect())
  const minLeft = Math.min(...bounds.map(b => b.left))

  activeObjects.forEach((obj, i) => {
    const bound = bounds[i]
    const offsetX = minLeft - bound.left
    obj.set({ left: (obj.left || 0) + offsetX })
    obj.setCoords()
  })

  canvas.requestRenderAll()
}

export function alignRight(canvas: Canvas) {
  const activeObjects = canvas.getActiveObjects()
  if (activeObjects.length < 2) return

  const bounds = activeObjects.map(obj => obj.getBoundingRect())
  const maxRight = Math.max(...bounds.map(b => b.left + b.width))

  activeObjects.forEach((obj, i) => {
    const bound = bounds[i]
    const offsetX = maxRight - (bound.left + bound.width)
    obj.set({ left: (obj.left || 0) + offsetX })
    obj.setCoords()
  })

  canvas.requestRenderAll()
}

export function alignTop(canvas: Canvas) {
  const activeObjects = canvas.getActiveObjects()
  if (activeObjects.length < 2) return

  const bounds = activeObjects.map(obj => obj.getBoundingRect())
  const minTop = Math.min(...bounds.map(b => b.top))

  activeObjects.forEach((obj, i) => {
    const bound = bounds[i]
    const offsetY = minTop - bound.top
    obj.set({ top: (obj.top || 0) + offsetY })
    obj.setCoords()
  })

  canvas.requestRenderAll()
}

export function alignBottom(canvas: Canvas) {
  const activeObjects = canvas.getActiveObjects()
  if (activeObjects.length < 2) return

  const bounds = activeObjects.map(obj => obj.getBoundingRect())
  const maxBottom = Math.max(...bounds.map(b => b.top + b.height))

  activeObjects.forEach((obj, i) => {
    const bound = bounds[i]
    const offsetY = maxBottom - (bound.top + bound.height)
    obj.set({ top: (obj.top || 0) + offsetY })
    obj.setCoords()
  })

  canvas.requestRenderAll()
}

export function alignCenterH(canvas: Canvas) {
  const activeObjects = canvas.getActiveObjects()
  if (activeObjects.length < 2) return

  const bounds = activeObjects.map(obj => obj.getBoundingRect())
  const avgCenterX = bounds.reduce((sum, b) => sum + b.left + b.width / 2, 0) / bounds.length

  activeObjects.forEach((obj, i) => {
    const bound = bounds[i]
    const currentCenterX = bound.left + bound.width / 2
    const offsetX = avgCenterX - currentCenterX
    obj.set({ left: (obj.left || 0) + offsetX })
    obj.setCoords()
  })

  canvas.requestRenderAll()
}

export function alignCenterV(canvas: Canvas) {
  const activeObjects = canvas.getActiveObjects()
  if (activeObjects.length < 2) return

  const bounds = activeObjects.map(obj => obj.getBoundingRect())
  const avgCenterY = bounds.reduce((sum, b) => sum + b.top + b.height / 2, 0) / bounds.length

  activeObjects.forEach((obj, i) => {
    const bound = bounds[i]
    const currentCenterY = bound.top + bound.height / 2
    const offsetY = avgCenterY - currentCenterY
    obj.set({ top: (obj.top || 0) + offsetY })
    obj.setCoords()
  })

  canvas.requestRenderAll()
}

export function distributeH(canvas: Canvas) {
  const activeObjects = canvas.getActiveObjects()
  if (activeObjects.length < 3) return

  const bounds = activeObjects.map((obj, i) => ({ obj, bound: obj.getBoundingRect(), index: i }))
  bounds.sort((a, b) => a.bound.left - b.bound.left)

  const first = bounds[0].bound
  const last = bounds[bounds.length - 1].bound
  const totalSpace = (last.left + last.width) - first.left
  const objectsWidth = bounds.reduce((sum, b) => sum + b.bound.width, 0)
  const gap = (totalSpace - objectsWidth) / (bounds.length - 1)

  let currentX = first.left
  bounds.forEach(({ obj, bound }) => {
    const offsetX = currentX - bound.left
    obj.set({ left: (obj.left || 0) + offsetX })
    obj.setCoords()
    currentX += bound.width + gap
  })

  canvas.requestRenderAll()
}

export function distributeV(canvas: Canvas) {
  const activeObjects = canvas.getActiveObjects()
  if (activeObjects.length < 3) return

  const bounds = activeObjects.map((obj, i) => ({ obj, bound: obj.getBoundingRect(), index: i }))
  bounds.sort((a, b) => a.bound.top - b.bound.top)

  const first = bounds[0].bound
  const last = bounds[bounds.length - 1].bound
  const totalSpace = (last.top + last.height) - first.top
  const objectsHeight = bounds.reduce((sum, b) => sum + b.bound.height, 0)
  const gap = (totalSpace - objectsHeight) / (bounds.length - 1)

  let currentY = first.top
  bounds.forEach(({ obj, bound }) => {
    const offsetY = currentY - bound.top
    obj.set({ top: (obj.top || 0) + offsetY })
    obj.setCoords()
    currentY += bound.height + gap
  })

  canvas.requestRenderAll()
}
