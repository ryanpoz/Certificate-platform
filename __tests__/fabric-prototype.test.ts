import { readFileSync } from 'fs'
import { join } from 'path'

describe('Fabric.js Prototype - Smoke Tests', () => {
  it('should have fabric lab page at correct route', () => {
    const page = readFileSync(
      join(process.cwd(), 'app/dashboard/lab/fabric/page.tsx'),
      'utf-8'
    )
    
    // Should be a server component (async) for auth
    expect(page).toContain('async function FabricLabPage')
    expect(page).toContain('requireAuth')
    
    // Should use ClientWrapper
    expect(page).toContain('ClientWrapper')
  })

  it('should have client wrapper with dynamic import', () => {
    const wrapper = readFileSync(
      join(process.cwd(), 'app/dashboard/lab/fabric/client-wrapper.tsx'),
      'utf-8'
    )
    
    // Should be a client component
    expect(wrapper).toContain("'use client'")
    
    // Should use dynamic import with ssr:false
    expect(wrapper).toContain('dynamic(')
    expect(wrapper).toContain('ssr: false')
    expect(wrapper).toContain('fabric-editor')
  })

  it('should have fabric editor component with key features', () => {
    const editor = readFileSync(
      join(process.cwd(), 'app/dashboard/lab/fabric/fabric-editor.tsx'),
      'utf-8'
    )
    
    // Should be client component
    expect(editor).toContain("'use client'")
    
    // Should import from fabric
    expect(editor).toContain('from \'fabric\'')
    
    // Should have templates
    expect(editor).toContain('TEMPLATES')
    
    // Should have key features
    expect(editor).toContain('Undo')
    expect(editor).toContain('Redo')
    
    // Should have floating toolbar
    expect(editor).toContain('Floating Toolbar')
    expect(editor).toContain('fontFamily')
    expect(editor).toContain('fontSize')
    
    // Should use new modular imports
    expect(editor).toContain('useFabricCanvas')
    expect(editor).toContain('loadFonts')
    expect(editor).toContain('FieldText')
    expect(editor).toContain('initAligningGuidelines')

    // Start screen replaces the horizontal template strip
    expect(editor).toContain('Start blank')
    expect(editor).toContain('Change template')
    expect(editor).toContain('showStartScreen')
    expect(editor).not.toContain('Template Thumbnails')
  })

  it('should handle template switching via start screen', () => {
    const editor = readFileSync(
      join(process.cwd(), 'app/dashboard/lab/fabric/fabric-editor.tsx'),
      'utf-8'
    )
    
    // Should have template state
    expect(editor).toContain('selectedTemplate')
    expect(editor).toContain('setSelectedTemplate')
    
    // Should have loadTemplate function
    expect(editor).toContain('loadTemplate')
    expect(editor).toContain('handleDesignSelect')
    expect(editor).toContain('BLANK_TEMPLATE_ID')
  })

  it('should support text editing features', () => {
    const editor = readFileSync(
      join(process.cwd(), 'app/dashboard/lab/fabric/fabric-editor.tsx'),
      'utf-8'
    )
    
    // Should have IText/Textbox
    expect(editor).toContain('IText')
    expect(editor).toContain('Textbox')
    
    // Should use FieldText for merge fields
    expect(editor).toContain('FieldText')
    expect(editor).toContain('enableAutoShrink')
  })

  it('should have undo/redo functionality', () => {
    const editor = readFileSync(
      join(process.cwd(), 'app/dashboard/lab/fabric/fabric-editor.tsx'),
      'utf-8'
    )
    
    // History comes from useFabricCanvas
    expect(editor).toContain('history')
    expect(editor).toContain('useFabricCanvas')
    expect(editor).toContain('undo')
    expect(editor).toContain('redo')
  })

  it('should support multi-select, grouping, and alignment', () => {
    const editor = readFileSync(
      join(process.cwd(), 'app/dashboard/lab/fabric/fabric-editor.tsx'),
      'utf-8'
    )
    
    // Should track multiple selections
    expect(editor).toContain('selectedObjects')
    
    // Should have alignment functions
    expect(editor).toContain('alignLeft')
    expect(editor).toContain('alignRight')
    expect(editor).toContain('alignTop')
    expect(editor).toContain('Align')
    
    // Should have distribution
    expect(editor).toContain('distributeH')
    expect(editor).toContain('distributeV')
  })

  it('should have snap guides enabled', () => {
    const editor = readFileSync(
      join(process.cwd(), 'app/dashboard/lab/fabric/fabric-editor.tsx'),
      'utf-8'
    )
    
    // Should enable aligning guidelines from fabric extensions
    expect(editor).toContain('initAligningGuidelines')
  })

  it('should require authentication', () => {
    const page = readFileSync(
      join(process.cwd(), 'app/dashboard/lab/fabric/page.tsx'),
      'utf-8'
    )
    
    // Should import and call requireAuth
    expect(page).toContain('requireAuth')
    expect(page).toContain('await requireAuth()')
  })
})
