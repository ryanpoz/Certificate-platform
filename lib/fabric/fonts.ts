// Font loading utilities to ensure fonts are ready before rendering

/** Fonts offered in the Fabric lab text toolbar / Text panel. */
export const EDITOR_FONTS = [
  'Inter',
  'Playfair Display',
  'Montserrat',
  'Georgia',
  'Arial',
  'Times New Roman',
] as const

export type EditorFont = (typeof EDITOR_FONTS)[number]

const loadedFonts = new Set<string>()
const failedFonts = new Set<string>()
const loadingPromises = new Map<string, Promise<void>>()

const FONT_LOAD_TIMEOUT_MS = 3000
export const SAFE_FALLBACK_FONT = 'Georgia'

const SYSTEM_FONTS = new Set([
  'Georgia',
  'Arial',
  'Times New Roman',
  'Helvetica',
  'Courier New',
  'serif',
  'sans-serif',
  'monospace',
  'system-ui'
])

/**
 * Race a promise against a timeout; rejects if timeout wins.
 */
function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(message)), ms)
    promise.then(
      (value) => {
        clearTimeout(timer)
        resolve(value)
      },
      (error) => {
        clearTimeout(timer)
        reject(error)
      }
    )
  })
}

/**
 * Inject a Google Fonts stylesheet so document.fonts.load can resolve the face.
 */
function ensureFontStylesheet(fontFamily: string): void {
  if (typeof document === 'undefined') return
  if (SYSTEM_FONTS.has(fontFamily)) return

  const id = `fabric-font-${fontFamily.replace(/\s+/g, '-')}`
  if (document.getElementById(id)) return

  const link = document.createElement('link')
  link.id = id
  link.rel = 'stylesheet'
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontFamily)}:wght@400;700&display=swap`
  document.head.appendChild(link)
}

/**
 * Return a usable font family — falls back if the requested font failed to load.
 */
export function resolveFontFamily(fontFamily: string): string {
  if (!fontFamily || failedFonts.has(fontFamily)) {
    return SAFE_FALLBACK_FONT
  }
  return fontFamily
}

/**
 * Load a font and cache the result
 */
export async function loadFont(fontFamily: string): Promise<void> {
  // Already loaded
  if (loadedFonts.has(fontFamily) || failedFonts.has(fontFamily)) {
    return
  }
  
  // Currently loading - return existing promise
  if (loadingPromises.has(fontFamily)) {
    return loadingPromises.get(fontFamily)
  }
  
  // Start loading
  const promise = (async () => {
    try {
      ensureFontStylesheet(fontFamily)

      // Use document.fonts.load to load the font (never block longer than timeout)
      await withTimeout(
        document.fonts.load(`16px "${fontFamily}"`),
        FONT_LOAD_TIMEOUT_MS,
        `Font load timed out: ${fontFamily}`
      )

      const available =
        typeof document !== 'undefined' &&
        (SYSTEM_FONTS.has(fontFamily) || document.fonts.check(`16px "${fontFamily}"`))

      if (available) {
        loadedFonts.add(fontFamily)
      } else {
        console.warn(`Font not available after load: ${fontFamily}; using ${SAFE_FALLBACK_FONT}`)
        failedFonts.add(fontFamily)
      }
    } catch (error) {
      console.warn(`Failed to load font: ${fontFamily}`, error)
      failedFonts.add(fontFamily)
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
 * Check if a font failed to load (consumers should use resolveFontFamily)
 */
export function didFontFail(fontFamily: string): boolean {
  return failedFonts.has(fontFamily)
}

/**
 * Clear the font cache (useful for testing)
 */
export function clearFontCache(): void {
  loadedFonts.clear()
  failedFonts.clear()
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
