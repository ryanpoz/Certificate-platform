import type { Canvas } from 'fabric'
import {
  alignSelection,
  distributeSelection,
} from './arrange-utils'

/** @deprecated Prefer alignSelection — kept for existing call sites */
export function alignLeft(canvas: Canvas) {
  alignSelection(canvas, 'left')
}

export function alignRight(canvas: Canvas) {
  alignSelection(canvas, 'right')
}

export function alignTop(canvas: Canvas) {
  alignSelection(canvas, 'top')
}

export function alignBottom(canvas: Canvas) {
  alignSelection(canvas, 'bottom')
}

export function alignCenterH(canvas: Canvas) {
  alignSelection(canvas, 'center')
}

export function alignCenterV(canvas: Canvas) {
  alignSelection(canvas, 'middle')
}

export function distributeH(canvas: Canvas) {
  distributeSelection(canvas, 'horizontal')
}

export function distributeV(canvas: Canvas) {
  distributeSelection(canvas, 'vertical')
}
