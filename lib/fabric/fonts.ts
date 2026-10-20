// Font loading utilities to ensure fonts are ready before rendering

const loadedFonts = new Set<string>()
const loadingPromises = new Map<string, Promise<void>>()

/**
 * Load a font and cache the result
 */
export async function loadFont(fontFamily: string): Promise<void> {
  // Already loaded
  if (loadedFonts.has(fontFamily)) {
    return
  }
  
  // Currently loading - return existing promise
  if (loadingPromises.has(fontFamily)) {
    return loadingPromises.get(fontFamily)
  }
  
  // Start loading
  const promise = (async () => {
    try {
      // Use document.fonts.load to load the font
      await document.fonts.load(`16px "${fontFamily}"`)
      loadedFonts.add(fontFamily)
    } catch (error) {
      console.warn(`Failed to load font: ${fontFamily}`, error)
      // Mark as loaded anyway to prevent infinite retries
      loadedFonts.add(fontFamily)
    } finally {
      loadingPromises.delete(fontFamily)
    }
  })()
  
  loadingPromises.set(fontFamily, promise)
  return promise
}

/**
 * Load multiple fonts in parallel
 */
export async function loadFonts(fontFamilies: string[]): Promise<void> {
  await Promise.all(fontFamilies.map(font => loadFont(font)))
}

/**
 * Check if a font is already loaded
 */
export function isFontLoaded(fontFamily: string): boolean {
  return loadedFonts.has(fontFamily)
}

/**
 * Clear the font cache (useful for testing)
 */
export function clearFontCache(): void {
  loadedFonts.clear()
  loadingPromises.clear()
}

/**
 * Get all unique fonts from a design config
 */
export function extractFontsFromConfig(config: any): string[] {
  const fonts = new Set<string>()
  
  config.pages?.forEach((page: any) => {
    page.elements?.forEach((element: any) => {
      if (element.fontFamily) {
        fonts.add(element.fontFamily)
      }
    })
  })
  
  return Array.from(fonts)
}
