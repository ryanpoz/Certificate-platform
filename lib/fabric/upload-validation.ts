export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024

export const ALLOWED_UPLOAD_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
  'image/svg+xml',
] as const

export type UploadValidationResult =
  | { ok: true }
  | { ok: false; error: string }

/**
 * Validate an uploaded image file (type + size). Pure — no DOM.
 */
export function validateImageUpload(file: {
  type: string
  size: number
  name?: string
}): UploadValidationResult {
  const type = (file.type || '').toLowerCase()
  const allowed = ALLOWED_UPLOAD_MIME_TYPES as readonly string[]

  // Some browsers leave type empty for SVG — fall back to extension
  const name = (file.name || '').toLowerCase()
  const extOk =
    name.endsWith('.png') ||
    name.endsWith('.jpg') ||
    name.endsWith('.jpeg') ||
    name.endsWith('.webp') ||
    name.endsWith('.svg')

  if (type && !allowed.includes(type) && !(type === '' && extOk)) {
    return {
      ok: false,
      error: 'Only PNG, JPG, SVG, and WebP images are allowed.',
    }
  }

  if (!type && !extOk) {
    return {
      ok: false,
      error: 'Only PNG, JPG, SVG, and WebP images are allowed.',
    }
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    return {
      ok: false,
      error: 'Image must be 5 MB or smaller.',
    }
  }

  if (file.size <= 0) {
    return {
      ok: false,
      error: 'Image file is empty.',
    }
  }

  return { ok: true }
}

/** Scale so the longest side fits within maxFraction of the page width. */
export function scaleImageToPageFraction(
  imageWidth: number,
  imageHeight: number,
  pageWidth: number,
  maxFraction = 0.4
): number {
  if (imageWidth <= 0) return 1
  const maxW = pageWidth * maxFraction
  return Math.min(1, maxW / imageWidth)
}
