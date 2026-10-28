import { Canvas, FabricObject } from 'fabric'
import type { CanvasHistory } from '@/lib/fabric/history'
import { groupSelection, ungroupSelection } from './arrange-utils'
import { serializeLocked } from '@/lib/fabric/lock'

export interface KeyboardShortcutsOptions {
  canvas: Canvas
  history: CanvasHistory
  onCopy?: () => void
  onPaste?: () => void
  onDuplicate?: () => void
  onDelete?: () => void
  onGroup?: () => void
  onUngroup?: () => void
}

/**
 * Keyboard shortcuts for Fabric canvas
 * Supports: Undo/Redo, Copy/Paste/Duplicate, Delete, Group/Ungroup, Arrow nudge
 */
export class KeyboardShortcuts {
  private canvas: Canvas
  private history: CanvasHistory
  private clipboard: any = null
  private onCopy?: () => void
  private onPaste?: () => void
  private onDuplicate?: () => void
  private onDelete?: () => void
  private onGroup?: () => void
  private onUngroup?: () => void

  constructor(options: KeyboardShortcutsOptions) {
    this.canvas = options.canvas
    this.history = options.history
    this.onCopy = options.onCopy
    this.onPaste = options.onPaste
    this.onDuplicate = options.onDuplicate
    this.onDelete = options.onDelete
    this.onGroup = options.onGroup
    this.onUngroup = options.onUngroup

    this.setupListeners()
  }

  private setupListeners() {
    document.addEventListener('keydown', this.handleKeyDown)
  }

  private isTypingInFormField(target: EventTarget | null): boolean {
    if (!(target instanceof HTMLElement)) return false
    const tag = target.tagName
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true
    if (target.isContentEditable) return true
    return Boolean(target.closest('input, textarea, select, [contenteditable="true"]'))
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    // Don't steal keys from inputs (e.g. certificate name) or Fabric text editing
    if (this.isTypingInFormField(e.target)) {
      return
    }
    const activeObject = this.canvas.getActiveObject()
    if (activeObject && (activeObject as any).isEditing) {
      return
    }

    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
    const mod = isMac ? e.metaKey : e.ctrlKey

    // Undo: Cmd/Ctrl+Z
    if (mod && e.key === 'z' && !e.shiftKey) {
      e.preventDefault()
      this.history.undo()
      return
    }

    // Redo: Shift+Cmd/Ctrl+Z or Ctrl+Y
    if ((mod && e.key === 'z' && e.shiftKey) || (!isMac && e.ctrlKey && e.key === 'y')) {
      e.preventDefault()
      this.history.redo()
      return
    }

    // Group: Cmd/Ctrl+G
    if (mod && e.key.toLowerCase() === 'g' && !e.shiftKey) {
      e.preventDefault()
      void groupSelection(this.canvas)
      this.onGroup?.()
      return
    }

    // Ungroup: Cmd/Ctrl+Shift+G
    if (mod && e.key.toLowerCase() === 'g' && e.shiftKey) {
      e.preventDefault()
      ungroupSelection(this.canvas)
      this.onUngroup?.()
      return
    }

    // Copy: Cmd/Ctrl+C
    if (mod && e.key === 'c') {
      e.preventDefault()
      this.copy()
      return
    }

    // Paste: Cmd/Ctrl+V
    if (mod && e.key === 'v') {
      e.preventDefault()
      this.paste()
      return
    }

    // Duplicate: Cmd/Ctrl+D
    if (mod && e.key === 'd') {
      e.preventDefault()
      this.duplicate()
      return
    }

    // Delete: Delete or Backspace (not while editing text)
    if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault()
      this.deleteSelected()
      return
    }

    // Arrow nudge: Arrow keys (Shift = 10px, normal = 1px)
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
      e.preventDefault()
      this.nudge(e.key, e.shiftKey ? 10 : 1)
      return
    }
  }

  private copy() {
    const activeObject = this.canvas.getActiveObject()
    if (!activeObject) return

    this.clipboard = activeObject.toObject()
    this.onCopy?.()
  }

  private paste() {
    if (!this.clipboard) return

    const promise = FabricObject.fromObject(this.clipboard)
    promise.then((cloned) => {
      cloned.set({
        left: (cloned.left || 0) + 20,
        top: (cloned.top || 0) + 20
      })

      this.canvas.add(cloned as any)
      this.canvas.setActiveObject(cloned as any)
      this.canvas.requestRenderAll()
      this.onPaste?.()
    })
  }

  private duplicate() {
    const activeObject = this.canvas.getActiveObject()
    if (!activeObject) return

    const promise = activeObject.clone()
    promise.then((cloned) => {
      cloned.set({
        left: (cloned.left || 0) + 20,
        top: (cloned.top || 0) + 20
      })

      this.canvas.add(cloned as any)
      this.canvas.setActiveObject(cloned as any)
      this.canvas.requestRenderAll()
      this.onDuplicate?.()
    })
  }

  private deleteSelected() {
    const activeObjects = this.canvas.getActiveObjects()
    if (activeObjects.length === 0) return

    activeObjects.forEach(obj => {
      this.canvas.remove(obj)
    })

    this.canvas.discardActiveObject()
    this.canvas.requestRenderAll()
    this.onDelete?.()
  }

  private nudge(direction: string, distance: number) {
    const activeObjects = this.canvas.getActiveObjects()
    if (activeObjects.length === 0) return

    activeObjects.forEach(obj => {
      if (serializeLocked(obj as any)) return
      const left = obj.left || 0
      const top = obj.top || 0

      switch (direction) {
        case 'ArrowUp':
          obj.set({ top: top - distance })
          break
        case 'ArrowDown':
          obj.set({ top: top + distance })
          break
        case 'ArrowLeft':
          obj.set({ left: left - distance })
          break
        case 'ArrowRight':
          obj.set({ left: left + distance })
          break
      }

      obj.setCoords()
    })

    this.canvas.requestRenderAll()
  }

  public dispose() {
    document.removeEventListener('keydown', this.handleKeyDown)
  }
}
