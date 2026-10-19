import { readFileSync } from 'fs'
import { join } from 'path'

describe('Fabric.js Editor - Defensive Code Regression', () => {
  const editorPath = join(process.cwd(), 'app/dashboard/lab/fabric/fabric-editor.tsx')
  const editorCode = readFileSync(editorPath, 'utf-8')

  it('should have defensive checks for undefined background properties', () => {
    // Should use optional chaining for background access
    expect(editorCode).toContain('template.background?.type')
    expect(editorCode).toContain('template.background?.value')
    
    // Should have fallback values
    expect(editorCode).toContain("|| '#ffffff'")
    expect(editorCode).toContain('#667eea')
    
    // Should not have unsafe string manipulation without checks
    expect(editorCode).not.toContain("template.background.value.replace('linear-gradient")
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

  it('should have regex-based gradient color extraction', () => {
    // Should use regex to extract colors from gradient strings
    expect(editorCode).toContain('gradientValue.match(')
    expect(editorCode).toContain('colorMatch ? colorMatch[0]')
  })
})

