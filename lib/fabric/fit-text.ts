import { Textbox } from 'fabric'

export interface FitTextOptions {
  minFontSize?: number
  maxLines?: number
  tolerance?: number
}

/**
 * Shrink text to fit within a bounding box using binary search
 * Reusable for both client and server-side rendering
 */
export function fitTextToBox(
  textbox: Textbox,
  maxWidth: number,
  maxHeight: number,
  options: FitTextOptions = {}
): number {
  const {
    minFontSize = 12,
    maxLines = 1,
    tolerance = 0.5
  } = options
  
  const originalFontSize = textbox.fontSize || 16
  let currentFontSize = originalFontSize
  let low = minFontSize
  let high = originalFontSize
  let bestFit = minFontSize
  
  // Binary search for the largest font size that fits
  while (high - low > tolerance) {
    currentFontSize = (low + high) / 2
    textbox.set({ fontSize: currentFontSize })
    
    // Force text to wrap and recalculate dimensions
    textbox._splitTextIntoLines(textbox.text || '')
    const lines = textbox._textLines || []
    
    // Get actual dimensions
    const actualWidth = textbox.width || 0
    const actualHeight = textbox.calcTextHeight()
    
    // Check if it fits
    const fitsWidth = actualWidth <= maxWidth
    const fitsHeight = actualHeight <= maxHeight
    const fitsLines = lines.length <= maxLines
    
    if (fitsWidth && fitsHeight && fitsLines) {
      bestFit = currentFontSize
      low = currentFontSize
    } else {
      high = currentFontSize
    }
  }
  
  // Apply the best fit size
  textbox.set({ fontSize: bestFit })
  textbox._splitTextIntoLines(textbox.text || '')
  
  return bestFit
}

/**
 * Auto-shrink text when it changes (single line within box)
 */
export function autoShrinkText(
  textbox: Textbox,
  options: FitTextOptions = {}
): void {
  const maxWidth = textbox.width || 200
  const maxHeight = textbox.height || 100
  
  fitTextToBox(textbox, maxWidth, maxHeight, options)
}

/**
 * Set up auto-shrink on text:changed event
 */
export function enableAutoShrink(
  textbox: Textbox,
  options: FitTextOptions = {}
): () => void {
  const handler = () => autoShrinkText(textbox, options)
  
  textbox.on('text:changed', handler)
  textbox.on('changed', handler)
  
  // Initial fit
  handler()
  
  // Return cleanup function
  return () => {
    textbox.off('text:changed', handler)
    textbox.off('changed', handler)
  }
}
