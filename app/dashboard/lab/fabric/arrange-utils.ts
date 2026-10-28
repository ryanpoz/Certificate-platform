import type { Canvas } from 'fabric'
import { ActiveSelection, Group } from 'fabric'
import {
  computeAlignOffsets,
  computeDistributeOffsets,
  resolveAlignContainer,
  type AlignBounds,
  type AlignKind,
} from '@/lib/fabric/align'
import { applyObjectLock } from '@/lib/fabric/create-shape'
import { serializeLocked } from '@/lib/fabric/lock'

function objectBounds(obj: any): AlignBounds {
  const b = obj.getBoundingRect()
  return { left: b.left, top: b.top, width: b.width, height: b.height }
}

function pageBounds(canvas: Canvas): AlignBounds {
  const w = (canvas as any).__pageWidth || canvas.getWidth() || 1123
  const h = (canvas as any).__pageHeight || canvas.getHeight() || 794
  return { left: 0, top: 0, width: w, height: h }
}

function applyOffsets(objects: any[], offsets: { dx: number; dy: number }[]) {
  objects.forEach((obj, i) => {
    const { dx, dy } = offsets[i]
    if (!dx && !dy) return
    obj.set({
      left: (obj.left || 0) + dx,
      top: (obj.top || 0) + dy,
    })
    obj.setCoords()
  })
}

export function alignSelection(canvas: Canvas, alignment: AlignKind) {
  const active = canvas.getActiveObjects()
  if (active.length === 0) return
  const bounds = active.map(objectBounds)
  const container = resolveAlignContainer(bounds, pageBounds(canvas))
  const offsets = computeAlignOffsets(bounds, alignment, container)
  applyOffsets(active, offsets)
  canvas.requestRenderAll()
}

export function distributeSelection(canvas: Canvas, axis: 'horizontal' | 'vertical') {
  const active = canvas.getActiveObjects()
  if (active.length < 3) return
  const bounds = active.map(objectBounds)
  const offsets = computeDistributeOffsets(bounds, axis)
  applyOffsets(active, offsets)
  canvas.requestRenderAll()
}

export function bringForward(canvas: Canvas) {
  const obj = canvas.getActiveObject()
  if (!obj) return
  canvas.bringObjectForward(obj)
  canvas.requestRenderAll()
}

export function sendBackward(canvas: Canvas) {
  const obj = canvas.getActiveObject()
  if (!obj) return
  canvas.sendObjectBackwards(obj)
  canvas.requestRenderAll()
}

export function bringToFront(canvas: Canvas) {
  const obj = canvas.getActiveObject()
  if (!obj) return
  canvas.bringObjectToFront(obj)
  canvas.requestRenderAll()
}

export function sendToBack(canvas: Canvas) {
  const obj = canvas.getActiveObject()
  if (!obj) return
  canvas.sendObjectToBack(obj)
  canvas.requestRenderAll()
}

export async function groupSelection(canvas: Canvas) {
  const active = canvas.getActiveObject()
  if (!active) return

  let objects: any[] = []
  if (active instanceof ActiveSelection || active.type === 'activeselection' || active.type === 'activeSelection') {
    objects = (active as ActiveSelection).getObjects()
    canvas.discardActiveObject()
  } else if (canvas.getActiveObjects().length >= 2) {
    objects = canvas.getActiveObjects()
    canvas.discardActiveObject()
  } else {
    return
  }

  if (objects.length < 2) return

  // Detach from canvas before grouping
  objects.forEach(o => {
    if (canvas.getObjects().includes(o)) canvas.remove(o)
  })
  const group = new Group(objects)
  ;(group as any).set('data', { id: `group-${Date.now()}` })
  canvas.add(group)
  canvas.setActiveObject(group)
  canvas.requestRenderAll()
}

export function ungroupSelection(canvas: Canvas) {
  const active = canvas.getActiveObject()
  if (!active || !(active instanceof Group || active.type === 'group')) return

  const group = active as Group
  const items = group.removeAll()
  canvas.remove(group)
  items.forEach(obj => canvas.add(obj))
  const sel = new ActiveSelection(items, { canvas })
  canvas.setActiveObject(sel)
  canvas.requestRenderAll()
}

export function toggleLockSelection(canvas: Canvas) {
  const objects = canvas.getActiveObjects()
  if (objects.length === 0) return
  const anyUnlocked = objects.some(o => !serializeLocked(o as any))
  objects.forEach(o => applyObjectLock(o, anyUnlocked))
  canvas.requestRenderAll()
}

export function isSelectionLocked(objects: any[]): boolean {
  if (objects.length === 0) return false
  return objects.every(o => serializeLocked(o))
}
