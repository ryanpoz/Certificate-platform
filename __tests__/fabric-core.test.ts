import { loadFont, loadFonts, isFontLoaded, clearFontCache } from '@/lib/fabric/fonts'
import { FieldText } from '@/lib/fabric/objects/FieldText'
import { createEmptyDesignConfig } from '@/lib/design-config/v3-schema'

describe('Fabric Core Modules', () => {
  describe('Module exports', () => {
    it('should export CanvasHistory', async () => {
      const { CanvasHistory } = await import('@/lib/fabric/history')
      expect(CanvasHistory).toBeDefined()
    })

    it('should export fit text functions', async () => {
      const { fitTextToBox, autoShrinkText, enableAutoShrink } = await import('@/lib/fabric/fit-text')
      expect(fitTextToBox).toBeDefined()
      expect(autoShrinkText).toBeDefined()
      expect(enableAutoShrink).toBeDefined()
    })

    it('should export font loading functions', () => {
      expect(loadFont).toBeDefined()
      expect(loadFonts).toBeDefined()
      expect(isFontLoaded).toBeDefined()
      expect(clearFontCache).toBeDefined()
    })

    it('should export FieldText class', () => {
      expect(FieldText).toBeDefined()
      expect(FieldText.type).toBe('FieldText')
    })

    it('should export serialize functions', async () => {
      const { designConfigToFabric, fabricToDesignConfig, testRoundTrip } = await import('@/lib/fabric/serialize')
      expect(designConfigToFabric).toBeDefined()
      expect(fabricToDesignConfig).toBeDefined()
      expect(testRoundTrip).toBeDefined()
    })

    it('should export useFabricCanvas hook', async () => {
      const { useFabricCanvas } = await import('@/lib/fabric/useFabricCanvas')
      expect(useFabricCanvas).toBeDefined()
    })
  })

  describe('Font Loading (DOM-independent)', () => {
    beforeEach(() => {
      clearFontCache()
    })

    it('should have font loading API', () => {
      expect(typeof loadFont).toBe('function')
      expect(typeof isFontLoaded).toBe('function')
    })
  })

  describe('FieldText', () => {
    it('should have FieldText type', () => {
      expect(FieldText.type).toBe('FieldText')
    })

    it('should have fromObject static method', () => {
      expect(typeof FieldText.fromObject).toBe('function')
    })
  })

  describe('Design Config Integration', () => {
    it('should work with v3 schema', () => {
      const config = createEmptyDesignConfig()
      expect(config.version).toBe(3)
      expect(config.pages).toHaveLength(1)
    })
  })
})
