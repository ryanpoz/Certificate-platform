import {
  linearGradientCoordsFromAngle,
  createLinearGradientBackground,
  createSolidBackground,
  createImageBackground,
  serializeBackgroundFromSnapshot,
  coverScale,
  BACKGROUND_SWATCHES,
} from '@/lib/fabric/background'
import {
  getPageSize,
  detectPageSize,
  remapObjectPositions,
  PAGE_SIZES,
} from '@/lib/fabric/page-size'
import {
  validateImageUpload,
  scaleImageToPageFraction,
  MAX_UPLOAD_BYTES,
} from '@/lib/fabric/upload-validation'
import { EDITOR_FONTS } from '@/lib/fabric/fonts'
import { BackgroundSchema } from '@/lib/design-config/v3-schema'

describe('Background / gradient helpers', () => {
  it('exposes preset swatches', () => {
    expect(BACKGROUND_SWATCHES.length).toBeGreaterThanOrEqual(12)
  })

  it('builds linear gradient coords from angle (0 = L→R, 90 = T→B)', () => {
    const w = 1000
    const h = 500
    const horizontal = linearGradientCoordsFromAngle(w, h, 0)
    expect(horizontal.y1).toBeCloseTo(horizontal.y2, 5)
    expect(horizontal.x2).toBeGreaterThan(horizontal.x1)

    const vertical = linearGradientCoordsFromAngle(w, h, 90)
    expect(vertical.x1).toBeCloseTo(vertical.x2, 5)
    expect(vertical.y2).toBeGreaterThan(vertical.y1)
  })

  it('creates solid / gradient / image background configs', () => {
    expect(createSolidBackground('#fff')).toEqual({ type: 'color', color: '#fff' })

    const grad = createLinearGradientBackground(800, 600, '#111', '#eee', 45)
    expect(grad.type).toBe('gradient')
    if (grad.type === 'gradient') {
      expect(grad.gradient.stops).toHaveLength(2)
      expect(grad.gradient.stops[0].color).toBe('#111')
    }

    const img = createImageBackground('data:image/png;base64,abc', 0.5)
    expect(img).toEqual({
      type: 'image',
      imageUrl: 'data:image/png;base64,abc',
      opacity: 0.5,
    })
  })

  it('round-trips background snapshots into Design Config Background', () => {
    expect(
      serializeBackgroundFromSnapshot({ backgroundColor: '#abcdef' })
    ).toEqual({ type: 'color', color: '#abcdef' })

    const fromGrad = serializeBackgroundFromSnapshot({
      backgroundColor: {
        type: 'linear',
        coords: { x1: 0, y1: 0, x2: 100, y2: 0 },
        colorStops: [
          { offset: 0, color: '#000' },
          { offset: 1, color: '#fff' },
        ],
      },
    })
    expect(fromGrad.type).toBe('gradient')
    expect(BackgroundSchema.safeParse(fromGrad).success).toBe(true)

    const fromImg = serializeBackgroundFromSnapshot({
      backgroundImage: { src: 'data:image/png;base64,xx', opacity: 0.8 },
    })
    expect(fromImg).toEqual({
      type: 'image',
      imageUrl: 'data:image/png;base64,xx',
      opacity: 0.8,
    })
    expect(BackgroundSchema.safeParse(fromImg).success).toBe(true)
  })

  it('computes cover scale for background images', () => {
    expect(coverScale(100, 100, 200, 100)).toBe(2)
    expect(coverScale(100, 100, 100, 200)).toBe(2)
  })
})

describe('Page size math', () => {
  it('returns A4 and US Letter landscape/portrait sizes', () => {
    expect(getPageSize('a4', 'landscape')).toEqual(PAGE_SIZES['a4-landscape'])
    expect(getPageSize('a4', 'portrait').height).toBeGreaterThan(
      getPageSize('a4', 'portrait').width
    )
    expect(getPageSize('letter', 'landscape').width).toBeGreaterThan(
      getPageSize('letter', 'landscape').height
    )
  })

  it('detects paper from dimensions', () => {
    const a4 = detectPageSize(1123, 794)
    expect(a4.paper).toBe('a4')
    expect(a4.orientation).toBe('landscape')
  })

  it('remaps object positions proportionally on page resize', () => {
    const remapped = remapObjectPositions(
      [{ left: 100, top: 50, id: 'a' }],
      1000,
      500,
      2000,
      1000
    )
    expect(remapped[0]).toEqual({ left: 200, top: 100, id: 'a' })
  })
})

describe('Upload validation', () => {
  it('accepts allowed types under 5 MB', () => {
    expect(
      validateImageUpload({ type: 'image/png', size: 1024, name: 'a.png' })
    ).toEqual({ ok: true })
    expect(
      validateImageUpload({ type: 'image/svg+xml', size: 2048, name: 'a.svg' })
    ).toEqual({ ok: true })
  })

  it('rejects oversized or wrong-type files', () => {
    const big = validateImageUpload({
      type: 'image/png',
      size: MAX_UPLOAD_BYTES + 1,
      name: 'big.png',
    })
    expect(big.ok).toBe(false)
    if (!big.ok) expect(big.error).toMatch(/5 MB/i)

    const bad = validateImageUpload({
      type: 'application/pdf',
      size: 100,
      name: 'x.pdf',
    })
    expect(bad.ok).toBe(false)
  })

  it('scales added images to 40% of page width', () => {
    expect(scaleImageToPageFraction(1000, 500, 1000, 0.4)).toBeCloseTo(0.4)
    expect(scaleImageToPageFraction(100, 50, 1000, 0.4)).toBe(1)
  })
})

describe('Editor fonts', () => {
  it('exports the font list used by the text toolbar', () => {
    expect(EDITOR_FONTS).toContain('Inter')
    expect(EDITOR_FONTS).toContain('Playfair Display')
    expect(EDITOR_FONTS.length).toBeGreaterThanOrEqual(4)
  })
})
