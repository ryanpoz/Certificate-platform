import { readFileSync } from 'fs'
import { join } from 'path'

describe('Fabric.js Editor - Phase 1b Integration', () => {
  const editorPath = join(process.cwd(), 'app/dashboard/lab/fabric/fabric-editor.tsx')
  const editorCode = readFileSync(editorPath, 'utf-8')

  it('should use modular fabric utilities', () => {
    // Should use new modular imports
    expect(editorCode).toContain('useFabricCanvas')
    expect(editorCode).toContain('loadFonts')
    expect(editorCode).toContain('FieldText')
    expect(editorCode).toContain('designConfigToFabric')
    expect(editorCode).toContain('collectTextById')
  })

  it('should have defensive checks for selectedObject properties in toolbar', () => {
    // Should have fallback values for toolbar inputs
    expect(editorCode).toContain("selectedObject.fontFamily || 'Inter'")
    expect(editorCode).toContain('selectedObject.fontSize || 16')
  })

  it('should use v3 schema for templates', () => {
    // Should use templates from separate file
    expect(editorCode).toContain('TEMPLATES')
    expect(editorCode).toContain('from \'./templates\'')
  })

  it('should have aligning guidelines support', () => {
    // Should use Fabric extensions for guidelines
    expect(editorCode).toContain('initAligningGuidelines')
    expect(editorCode).toContain('from \'fabric/extensions\'')
  })

  it('should preserve user content across template switches', () => {
    // Should track user content
    expect(editorCode).toContain('userContentRef')
    expect(editorCode).toContain('saveFieldContent')
    expect(editorCode).toContain('restoreFieldContent')
  })

  it('should have thumbnail generation for the start screen catalog', () => {
    // Should generate thumbnails
    expect(editorCode).toContain('generateThumbnails')
    expect(editorCode).toContain('thumbnails')
    expect(editorCode).toContain('toDataURL')
    expect(editorCode).toContain('getTemplateCatalog')
    expect(editorCode).not.toContain('Template Thumbnails')
  })

  it('should keep text editing working with the start screen', () => {
    // Never toggle className on the Fabric-owned <canvas> node
    expect(editorCode).not.toMatch(/<canvas[^>]*className=\{showStartScreen/)
    // Hide via wrapper + refresh mouse offset after show/fit
    expect(editorCode).toContain('calcOffset')
    expect(editorCode).toContain('mouse:dblclick')
    expect(editorCode).toContain('enterEditing')
  })

  it('should retain user-added fields when switching templates', () => {
    expect(editorCode).toContain('userAddedFieldsRef')
    expect(editorCode).toContain('selectFieldsToCarry')
    expect(editorCode).toContain('addDynamicField')
  })

  it('should expose text, uploads, and background sidebar panels', () => {
    expect(editorCode).toContain('TextPanel')
    expect(editorCode).toContain('UploadsPanel')
    expect(editorCode).toContain('BackgroundPanel')
    expect(editorCode).toContain('changePageSize')
  })

  it('should have keyboard shortcuts', () => {
    // Should use KeyboardShortcuts class
    expect(editorCode).toContain('KeyboardShortcuts')
  })

  it('should use getBoundingRect for alignment', () => {
    // Should import alignment utilities
    expect(editorCode).toContain('alignLeft')
    expect(editorCode).toContain('alignRight')
    expect(editorCode).toContain('distributeH')
  })
})
