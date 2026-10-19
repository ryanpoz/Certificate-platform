import { readFileSync } from 'fs'
import { join } from 'path'

describe('Fabric.js Editor - Defensive Code Regression', () => {
  const editorPath = join(process.cwd(), 'app/dashboard/lab/fabric/fabric-editor.tsx')
  const editorCode = readFileSync(editorPath, 'utf-8')

  it('should have defensive checks for undefined background properties', () => {
    // Should use optional chaining for background access
    expect(editorCode).toContain('template.background?.gradient')
    
    // Should have fallback values
    expect(editorCode).toContain("|| '#ffffff'")
    expect(editorCode).toContain('#667eea')
  })

  it('should have defensive checks for undefined element properties', () => {
    // Should check if element exists
    expect(editorCode).toContain('if (!el || !el.id) return')
    
    // Should have fallback values for properties
    expect(editorCode).toContain('el.x || 0')
    expect(editorCode).toContain('el.y || 0')
    expect(editorCode).toContain('el.fontSize || 16')
    expect(editorCode).toContain("el.fontFamily || 'Inter'")
    expect(editorCode).toContain("el.fill || '#000000'")
  })

  it('should have defensive checks for selectedObject properties in toolbar', () => {
    // Should have fallback values for toolbar inputs
    expect(editorCode).toContain("selectedObject.fontFamily || 'Inter'")
    expect(editorCode).toContain('selectedObject.fontSize || 16')
    expect(editorCode).toContain("(selectedObject.fill as string) || '#000000'")
  })

  it('should use optional chaining for template.elements', () => {
    // Should safely iterate over elements
    expect(editorCode).toContain('template.elements?.forEach')
  })

  it('should have native Fabric gradient support', () => {
    // Should use native Fabric Gradient objects
    expect(editorCode).toContain('new Gradient(')
    expect(editorCode).toContain('grad.type')
    expect(editorCode).toContain('grad.coords')
    expect(editorCode).toContain('grad.colorStops')
  })

  it('should have template decorations support', () => {
    // Should support decorative elements
    expect(editorCode).toContain('template.decorations')
    expect(editorCode).toContain('new Rect(')
    expect(editorCode).toContain('new Circle(')
  })

  it('should preserve user content across template switches', () => {
    // Should track user content
    expect(editorCode).toContain('userContentRef')
    expect(editorCode).toContain('preserveContent')
    
    // Should save content before switching
    expect(editorCode).toContain('userContentRef.current[data.id] = obj.text')
  })

  it('should have thumbnail generation', () => {
    // Should generate thumbnails
    expect(editorCode).toContain('generateThumbnails')
    expect(editorCode).toContain('thumbnails')
    expect(editorCode).toContain('toDataURL')
  })
})

