import {
  DesignConfigV3Schema,
  parseDesignConfig,
  validateDesignConfig,
  createEmptyDesignConfig,
  type DesignConfigV3,
  type TextElement,
  type FieldElement,
  type ShapeElement
} from '@/lib/design-config/v3-schema'

describe('Design Config V3 Schema', () => {
  describe('Valid designs', () => {
    it('should parse empty design config', () => {
      const config = createEmptyDesignConfig()
      const result = parseDesignConfig(config)
      
      expect(result.version).toBe(3)
      expect(result.pages).toHaveLength(1)
      expect(result.pages[0].width).toBe(1123)
      expect(result.pages[0].height).toBe(794)
    })

    it('should parse design with text element', () => {
      const config: DesignConfigV3 = {
        version: 3,
        pages: [{
          width: 1123,
          height: 794,
          unit: 'px',
          background: { type: 'color', color: '#ffffff' },
          elements: [{
            type: 'text',
            id: 'title',
            text: 'Certificate',
            fontFamily: 'Inter',
            fontSize: 48,
            fontWeight: 'bold',
            fontStyle: 'normal',
            fill: '#000000',
            textAlign: 'center',
            x: 100,
            y: 200,
            width: 900,
            height: 60,
            angle: 0,
            scaleX: 1,
            scaleY: 1,
            originX: 'center',
            originY: 'top',
            opacity: 1,
            underline: false,
            strikethrough: false
          }]
        }]
      }
      
      const result = parseDesignConfig(config)
      expect(result.pages[0].elements).toHaveLength(1)
      expect(result.pages[0].elements[0].type).toBe('text')
    })

    it('should parse design with field element', () => {
      const config: DesignConfigV3 = {
        version: 3,
        pages: [{
          width: 1123,
          height: 794,
          unit: 'px',
          background: { type: 'color', color: '#ffffff' },
          elements: [{
            type: 'field',
            id: 'recipient',
            field: 'recipient_name',
            fontFamily: 'Inter',
            fontSize: 36,
            fontWeight: 'normal',
            fontStyle: 'normal',
            fill: '#000000',
            textAlign: 'center',
            autoShrink: true,
            minFontSize: 18,
            maxLines: 1,
            x: 200,
            y: 300,
            width: 700,
            height: 50,
            angle: 0,
            scaleX: 1,
            scaleY: 1,
            originX: 'center',
            originY: 'center',
            opacity: 1
          }]
        }]
      }
      
      const result = parseDesignConfig(config)
      const field = result.pages[0].elements[0] as FieldElement
      expect(field.type).toBe('field')
      expect(field.field).toBe('recipient_name')
      expect(field.autoShrink).toBe(true)
    })

    it('should parse design with gradient background', () => {
      const config: DesignConfigV3 = {
        version: 3,
        pages: [{
          width: 1123,
          height: 794,
          unit: 'px',
          background: {
            type: 'gradient',
            gradient: {
              type: 'linear',
              coords: { x1: 0, y1: 0, x2: 1123, y2: 794 },
              stops: [
                { offset: 0, color: '#667eea' },
                { offset: 1, color: '#764ba2' }
              ]
            }
          },
          elements: []
        }]
      }
      
      const result = parseDesignConfig(config)
      expect(result.pages[0].background.type).toBe('gradient')
    })

    it('should parse design with shapes', () => {
      const config: DesignConfigV3 = {
        version: 3,
        pages: [{
          width: 1123,
          height: 794,
          unit: 'px',
          background: { type: 'color', color: '#ffffff' },
          elements: [
            {
              type: 'shape',
              id: 'border',
              shape: 'rect',
              fill: 'transparent',
              stroke: '#000000',
              strokeWidth: 2,
              x: 50,
              y: 50,
              width: 1023,
              height: 694,
              angle: 0,
              scaleX: 1,
              scaleY: 1,
              originX: 'left',
              originY: 'top',
              opacity: 1,
              rx: 0,
              ry: 0
            },
            {
              type: 'shape' as const,
              id: 'circle',
              shape: 'circle' as const,
              fill: '#ff0000',
              stroke: undefined,
              strokeWidth: 1,
              strokeDashArray: undefined,
              radius: 50,
              x: 500,
              y: 400,
              angle: 0,
              scaleX: 1,
              scaleY: 1,
              originX: 'center' as const,
              originY: 'center' as const,
              opacity: 0.5
            }
          ]
        }]
      }
      
      const result = parseDesignConfig(config)
      expect(result.pages[0].elements).toHaveLength(2)
      expect(result.pages[0].elements[0].type).toBe('shape')
    })

    it('should parse QR code element', () => {
      const config: DesignConfigV3 = {
        version: 3,
        pages: [{
          width: 1123,
          height: 794,
          unit: 'px',
          background: { type: 'color', color: '#ffffff' },
          elements: [{
            type: 'qr',
            id: 'qr1',
            data: 'https://example.com/verify',
            errorCorrectionLevel: 'M',
            foreground: '#000000',
            background: '#ffffff',
            x: 50,
            y: 50,
            width: 150,
            height: 150,
            angle: 0,
            scaleX: 1,
            scaleY: 1,
            originX: 'left',
            originY: 'top',
            opacity: 1
          }]
        }]
      }
      
      const result = parseDesignConfig(config)
      expect(result.pages[0].elements[0].type).toBe('qr')
    })
  })

  describe('Invalid designs', () => {
    it('should reject wrong version', () => {
      const config = {
        version: 2, // Wrong version
        pages: []
      }
      
      const result = validateDesignConfig(config)
      expect(result.success).toBe(false)
    })

    it('should reject negative dimensions', () => {
      const config = {
        version: 3,
        pages: [{
          width: -100, // Invalid
          height: 794,
          unit: 'px',
          background: { type: 'color', color: '#ffffff' },
          elements: []
        }]
      }
      
      const result = validateDesignConfig(config)
      expect(result.success).toBe(false)
    })

    it('should reject invalid gradient stops', () => {
      const config = {
        version: 3,
        pages: [{
          width: 1123,
          height: 794,
          unit: 'px',
          background: {
            type: 'gradient',
            gradient: {
              type: 'linear',
              coords: { x1: 0, y1: 0, x2: 100, y2: 100 },
              stops: [{ offset: 0, color: '#000' }] // Need at least 2 stops
            }
          },
          elements: []
        }]
      }
      
      const result = validateDesignConfig(config)
      expect(result.success).toBe(false)
    })

    it('should reject invalid field type', () => {
      const config = {
        version: 3,
        pages: [{
          width: 1123,
          height: 794,
          unit: 'px',
          background: { type: 'color', color: '#ffffff' },
          elements: [{
            type: 'field',
            id: 'test',
            field: 'invalid_field', // Not in enum
            fontSize: 16,
            fill: '#000',
            x: 0,
            y: 0,
            width: 100,
            height: 50
          }]
        }]
      }
      
      const result = validateDesignConfig(config)
      expect(result.success).toBe(false)
    })

    it('should reject zero or negative font size', () => {
      const config = {
        version: 3,
        pages: [{
          width: 1123,
          height: 794,
          unit: 'px',
          background: { type: 'color', color: '#ffffff' },
          elements: [{
            type: 'text',
            id: 'test',
            text: 'Test',
            fontSize: 0, // Invalid
            fill: '#000',
            x: 0,
            y: 0,
            width: 100,
            height: 50
          }]
        }]
      }
      
      const result = validateDesignConfig(config)
      expect(result.success).toBe(false)
    })

    it('should reject opacity outside 0-1 range', () => {
      const config = {
        version: 3,
        pages: [{
          width: 1123,
          height: 794,
          unit: 'px',
          background: { type: 'color', color: '#ffffff' },
          elements: [{
            type: 'text',
            id: 'test',
            text: 'Test',
            fontSize: 16,
            fill: '#000',
            x: 0,
            y: 0,
            width: 100,
            height: 50,
            opacity: 1.5 // Invalid
          }]
        }]
      }
      
      const result = validateDesignConfig(config)
      expect(result.success).toBe(false)
    })
  })

  describe('Default values', () => {
    it('should apply default values for optional fields', () => {
      const config = {
        version: 3,
        pages: [{
          width: 1123,
          height: 794,
          background: { type: 'color', color: '#ffffff' },
          elements: [{
            type: 'text',
            id: 'test',
            text: 'Test',
            fontSize: 16,
            fill: '#000',
            x: 0,
            y: 0,
            width: 100,
            height: 50
          }]
        }]
      }
      
      const result = parseDesignConfig(config)
      const element = result.pages[0].elements[0] as TextElement
      
      expect(element.angle).toBe(0)
      expect(element.scaleX).toBe(1)
      expect(element.scaleY).toBe(1)
      expect(element.originX).toBe('left')
      expect(element.originY).toBe('top')
      expect(element.opacity).toBe(1)
      expect(element.fontWeight).toBe('normal')
      expect(element.fontStyle).toBe('normal')
      expect(element.textAlign).toBe('left')
    })

    it('should apply default unit px', () => {
      const config = {
        version: 3,
        pages: [{
          width: 1123,
          height: 794,
          background: { type: 'color', color: '#ffffff' },
          elements: []
        }]
      }
      
      const result = parseDesignConfig(config)
      expect(result.pages[0].unit).toBe('px')
    })
  })

  describe('TypeScript type inference', () => {
    it('should infer discriminated union types correctly', () => {
      const config = createEmptyDesignConfig()
      config.pages[0].elements.push({
        type: 'text',
        id: 'test',
        text: 'Hello',
        fontSize: 16,
        fill: '#000',
        x: 0,
        y: 0,
        width: 100,
        height: 50,
        fontFamily: 'Inter',
        fontWeight: 'normal',
        fontStyle: 'normal',
        textAlign: 'left',
        angle: 0,
        scaleX: 1,
        scaleY: 1,
        originX: 'left',
        originY: 'top',
        opacity: 1,
        underline: false,
        strikethrough: false
      })
      
      const element = config.pages[0].elements[0]
      
      // TypeScript should narrow the type based on discriminant
      if (element.type === 'text') {
        expect(element.text).toBeDefined()
        expect(element.fontFamily).toBeDefined()
      }
    })
  })
})
